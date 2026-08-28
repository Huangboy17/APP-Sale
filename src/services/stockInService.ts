import {
  PurchaseOrder,
  PurchaseOrderItem,
  OrderItem,
  ReserveItem,
  StockInVoucher,
  StockInVoucherItem,
  StockTransaction,
  InventoryItem,
  User,
} from '../types';

export interface POStockInAllocationResult {
  updatedPO: PurchaseOrder;
  stockInVoucher: StockInVoucher;
  updatedOrderItems: OrderItem[];
  createdReserveItems: ReserveItem[];
  stockTransactions: StockTransaction[];
  warehouseSurplusBySku: Record<string, number>;
}

/**
 * Executes multi-stage PO inbound receiving and atomic Sales allocation.
 */
export function processPOInboundReceiving(params: {
  po: PurchaseOrder;
  actualQuantities: Record<string, number>; // { [poItemId]: actualReceivedQty }
  existingOrderItems: OrderItem[];
  existingReserveItems: ReserveItem[];
  warehouseLocation: string;
  user: User;
  receiptNumber?: string;
  notes?: string;
}): POStockInAllocationResult {
  const {
    po,
    actualQuantities,
    existingOrderItems,
    existingReserveItems,
    warehouseLocation,
    user,
    receiptNumber,
    notes,
  } = params;

  const voucherNumber =
    receiptNumber?.trim() ||
    `PNK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);

  const orderItemMap = new Map(existingOrderItems.map((o) => [o.id, { ...o }]));
  const updatedOrderItemsMap = new Map<string, OrderItem>();
  const createdReserveItems: ReserveItem[] = [];
  const stockTransactions: StockTransaction[] = [];
  const voucherItems: StockInVoucherItem[] = [];
  const warehouseSurplusBySku: Record<string, number> = {};

  // Clone PO items
  const updatedPOItems: PurchaseOrderItem[] = po.items.map((item) => {
    const receiveQty = Math.max(0, Number(actualQuantities[item.id] ?? actualQuantities[item.sku] ?? 0));
    if (receiveQty <= 0) {
      return { ...item };
    }

    const currentRec = Number(item.receivedQuantity) || 0;
    const newTotalRec = currentRec + receiveQty;
    const newRem = Math.max(0, item.supplierOrderQuantity - newTotalRec);

    // Track voucher line
    voucherItems.push({
      sku: item.sku,
      productName: item.productName,
      unit: item.unit,
      expectedQuantity: item.remainingQuantity,
      actualQuantity: receiveQty,
      unitCost: item.unitCost,
      notes: `Nhập đợt từ PO ${po.poNumber}`,
    });

    let remainingToAllocate = receiveQty;

    // Clone and sort sales demands by requiredDate ASC (FIFO priority)
    const sortedDemands = [...(item.salesDemands || [])].sort((a, b) => {
      const dateA = a.requiredDate || '9999-99-99';
      const dateB = b.requiredDate || '9999-99-99';
      return dateA.localeCompare(dateB);
    });

    const updatedDemands = sortedDemands.map((demand) => {
      if (remainingToAllocate <= 0) return { ...demand };

      const fulfilled = Number(demand.fulfilledQuantity) || 0;
      const unfulfilled = Math.max(0, demand.requiredQuantity - fulfilled);

      if (unfulfilled <= 0) return { ...demand };

      const allocated = Math.min(remainingToAllocate, unfulfilled);
      remainingToAllocate -= allocated;
      const newFulfilled = fulfilled + allocated;

      // Update corresponding OrderItem
      const existingOrder = orderItemMap.get(demand.orderItemId);
      if (existingOrder) {
        const orderRec = Number(existingOrder.receivedQuantity) || 0;
        const newOrderRec = orderRec + allocated;
        const newOrderRem = Math.max(0, existingOrder.orderQuantity - newOrderRec);
        const newStatus = newOrderRem <= 0 ? 'ready_to_deliver' : 'partial';

        const updatedOrder: OrderItem = {
          ...existingOrder,
          receivedQuantity: newOrderRec,
          remainingQuantity: newOrderRem,
          status: newStatus,
          inboundReceipts: [
            ...(existingOrder.inboundReceipts || []),
            {
              id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              receiptNumber: voucherNumber,
              date: today,
              quantity: allocated,
              warehouseLocation,
              note: `Nhập từ PO ${po.poNumber}`,
              actorId: user.id,
              actorName: user.name,
            },
          ],
        };
        orderItemMap.set(demand.orderItemId, updatedOrder);
        updatedOrderItemsMap.set(demand.orderItemId, updatedOrder);

        // Create or allocate ReserveItem for this customer/contract
        const newReserve: ReserveItem = {
          id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          organizationId: user.organizationId || 'system_admin',
          contractId: demand.contractId,
          contractNumber: demand.contractNumber,
          quoteNumber: existingOrder.quoteNumber || '',
          customerId: demand.customerId,
          customerName: demand.customerName,
          salesRepId: demand.salesRepId,
          salesRepName: demand.salesRepName,
          createdBy: user.id,
          sku: item.sku,
          productName: item.productName,
          unit: item.unit,
          reservedQuantity: allocated,
          warehouseLocation,
          reservedDate: today,
          status: 'allocated',
          expectedDeliveryDate: demand.requiredDate || today,
          purchaseOrderId: po.id,
          stockInVoucherId: voucherNumber,
          orderItemId: demand.orderItemId,
        };
        createdReserveItems.push(newReserve);
      }

      return {
        ...demand,
        fulfilledQuantity: newFulfilled,
      };
    });

    // Any surplus remaining after fulfilling Sales demands
    if (remainingToAllocate > 0) {
      warehouseSurplusBySku[item.sku] = (warehouseSurplusBySku[item.sku] || 0) + remainingToAllocate;
    }

    return {
      ...item,
      receivedQuantity: newTotalRec,
      remainingQuantity: newRem,
      salesDemands: updatedDemands,
    };
  });

  // Calculate new overall PO status
  const allOrdered = updatedPOItems.reduce((sum, i) => sum + i.supplierOrderQuantity, 0);
  const allReceived = updatedPOItems.reduce((sum, i) => sum + i.receivedQuantity, 0);
  const newPOStatus = allReceived >= allOrdered ? 'completed' : allReceived > 0 ? 'partial_received' : po.status;

  const totalVoucherQty = voucherItems.reduce((sum, i) => sum + i.actualQuantity, 0);

  const stockInVoucher: StockInVoucher = {
    id: `voucher-in-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    voucherNumber,
    purchaseOrderId: po.id,
    purchaseOrderNumber: po.poNumber,
    date: today,
    supplierName: po.supplierName,
    warehouseLocation,
    status: 'CONFIRMED',
    items: voucherItems,
    totalQuantity: totalVoucherQty,
    createdById: user.id,
    createdByName: user.name,
    confirmedAt: nowIso,
    organizationId: user.organizationId || 'system_admin',
    notes: notes || `Nhập kho theo đơn đặt NCC ${po.poNumber}`,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const updatedPO: PurchaseOrder = {
    ...po,
    items: updatedPOItems,
    totalReceivedQuantity: allReceived,
    status: newPOStatus,
    inboundVoucherIds: Array.from(new Set([...(po.inboundVoucherIds || []), stockInVoucher.id, voucherNumber])),
    updatedAt: nowIso,
  };

  return {
    updatedPO,
    stockInVoucher,
    updatedOrderItems: Array.from(updatedOrderItemsMap.values()),
    createdReserveItems,
    stockTransactions,
    warehouseSurplusBySku,
  };
}
