import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  POLineSourceType,
  POLineSalesDemand,
  OrderItem,
  ProductPriceItem,
  InventoryItem,
} from '../types';

/**
 * Calculates warehouse extra quantity (Kho chủ động mua thêm).
 * Invariant: warehouseExtraQuantity = max(0, supplierOrderQuantity - salesRequiredQuantity)
 */
export function calculateWarehouseExtraQuantity(
  supplierOrderQuantity: number,
  salesRequiredQuantity: number
): number {
  const supplierQty = Number(supplierOrderQuantity) || 0;
  const salesQty = Number(salesRequiredQuantity) || 0;
  return Math.max(0, supplierQty - salesQty);
}

/**
 * Calculates remaining waiting quantity (Còn chờ NCC giao).
 * Invariant: remainingQuantity = max(0, supplierOrderQuantity - receivedQuantity)
 */
export function calculateRemainingQuantity(
  supplierOrderQuantity: number,
  receivedQuantity: number
): number {
  const supplierQty = Number(supplierOrderQuantity) || 0;
  const receivedQty = Number(receivedQuantity) || 0;
  return Math.max(0, supplierQty - receivedQty);
}

/**
 * Generates a unique PO Number in format: PO-YYYYMMDD-XXXX
 */
export function generatePurchaseOrderNumber(existingPOs: PurchaseOrder[] = []): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const prefix = `PO-${dateStr}`;

  const matchingNumbers = (existingPOs || [])
    .map((p) => p?.poNumber || '')
    .filter((num) => num.startsWith(prefix))
    .map((num) => {
      const parts = num.split('-');
      const seq = parseInt(parts[2] || '0', 10);
      return isNaN(seq) ? 0 : seq;
    });

  const nextSeq = matchingNumbers.length > 0 ? Math.max(...matchingNumbers) + 1 : 1;
  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Calculates overall Purchase Order status based on its item lines.
 */
export function calculatePurchaseOrderStatus(
  items: PurchaseOrderItem[],
  currentStatus?: PurchaseOrderStatus
): PurchaseOrderStatus {
  if (currentStatus === 'cancelled') return 'cancelled';
  if (!items || items.length === 0) return 'draft';

  const totalOrdered = items.reduce((sum, item) => sum + (Number(item.supplierOrderQuantity) || 0), 0);
  const totalReceived = items.reduce((sum, item) => sum + (Number(item.receivedQuantity) || 0), 0);

  if (totalReceived <= 0) {
    if (currentStatus === 'in_transit') return 'in_transit';
    if (currentStatus === 'ordered') return 'ordered';
    return 'draft';
  }

  if (totalReceived >= totalOrdered) {
    return 'completed';
  }

  return 'partial_received';
}

/**
 * Groups multiple selected Sales Requests (OrderItems) by SKU.
 * Builds consolidated PO line items with full source breakdown.
 */
export function groupSalesRequestsBySku(
  selectedOrderItems: OrderItem[],
  productMap?: Map<string, ProductPriceItem>,
  inventoryMap?: Map<string, InventoryItem>
): PurchaseOrderItem[] {
  const map = new Map<string, {
    sku: string;
    productName: string;
    brand: string;
    unit: string;
    salesDemands: POLineSalesDemand[];
    earliestRequiredDate?: string;
  }>();

  for (const order of selectedOrderItems) {
    const cleanSku = (order.sku || '').trim().toUpperCase();
    if (!cleanSku) continue;

    const unfulfilled =
      order.remainingQuantity !== undefined
        ? Number(order.remainingQuantity) || 0
        : Math.max(0, (Number(order.orderQuantity) || 0) - (Number(order.receivedQuantity) || 0));

    const demandQty = unfulfilled > 0 ? unfulfilled : Number(order.orderQuantity) || 0;

    const prod = productMap?.get(cleanSku);
    const demandEntry: POLineSalesDemand = {
      orderItemId: order.id,
      contractId: order.contractId || '',
      contractNumber: order.contractNumber || '',
      customerId: order.customerId || '',
      customerName: order.customerName || 'Khách hàng',
      salesRepId: order.salesRepId,
      salesRepName: order.salesRepName || 'Sales phụ trách',
      requiredQuantity: demandQty,
      requiredDate: order.supplierETA || order.orderDate,
      fulfilledQuantity: 0,
    };

    const existing = map.get(cleanSku);
    if (existing) {
      existing.salesDemands.push(demandEntry);
      if (
        demandEntry.requiredDate &&
        (!existing.earliestRequiredDate || demandEntry.requiredDate < existing.earliestRequiredDate)
      ) {
        existing.earliestRequiredDate = demandEntry.requiredDate;
      }
    } else {
      map.set(cleanSku, {
        sku: order.sku,
        productName: order.productName || prod?.name || 'Sản phẩm',
        brand: order.brand || prod?.brand || 'Khác',
        unit: order.unit || prod?.unit || 'Bộ',
        salesDemands: [demandEntry],
        earliestRequiredDate: demandEntry.requiredDate,
      });
    }
  }

  const result: PurchaseOrderItem[] = [];

  map.forEach((val) => {
    const totalSalesDemand = val.salesDemands.reduce((sum, d) => sum + (Number(d.requiredQuantity) || 0), 0);
    const supplierQty = totalSalesDemand; // Default supplier order qty = sales demand
    const extraQty = calculateWarehouseExtraQuantity(supplierQty, totalSalesDemand);
    const remainingQty = calculateRemainingQuantity(supplierQty, 0);

    result.push({
      id: `po-item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      sku: val.sku,
      productName: val.productName,
      brand: val.brand,
      unit: val.unit,
      salesRequiredQuantity: totalSalesDemand,
      supplierOrderQuantity: supplierQty,
      warehouseExtraQuantity: extraQty,
      receivedQuantity: 0,
      remainingQuantity: remainingQty,
      earliestRequiredDate: val.earliestRequiredDate,
      sourceType: 'SALES_REQUEST',
      salesDemands: val.salesDemands,
    });
  });

  return result;
}

/**
 * Creates a Warehouse Planned item (Kho chủ động thêm mặt hàng).
 */
export function createWarehousePlannedItem(
  product: ProductPriceItem | InventoryItem,
  initialQuantity = 1
): PurchaseOrderItem {
  const supplierQty = Number(initialQuantity) || 1;
  const salesDemand = 0;
  const extraQty = calculateWarehouseExtraQuantity(supplierQty, salesDemand);
  const remainingQty = calculateRemainingQuantity(supplierQty, 0);

  return {
    id: `po-item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    sku: product.sku,
    productName: product.name,
    brand: (product as ProductPriceItem).brand || 'Khác',
    unit: product.unit || 'Bộ',
    salesRequiredQuantity: 0,
    supplierOrderQuantity: supplierQty,
    warehouseExtraQuantity: extraQty,
    receivedQuantity: 0,
    remainingQuantity: remainingQty,
    sourceType: 'WAREHOUSE_PLANNED',
    salesDemands: [],
  };
}

/**
 * Normalizes a raw PurchaseOrder object from storage or network to guarantee no undefined/NaN fields.
 */
export function normalizePurchaseOrder(raw: any): PurchaseOrder {
  const items: PurchaseOrderItem[] = (raw?.items || []).map((item: any, idx: number) => {
    const salesReq = Number(item?.salesRequiredQuantity) || 0;
    const supplierOrd = Number(item?.supplierOrderQuantity) || salesReq;
    const recQty = Number(item?.receivedQuantity) || 0;
    const extraQty = calculateWarehouseExtraQuantity(supplierOrd, salesReq);
    const remQty = calculateRemainingQuantity(supplierOrd, recQty);

    const demands: POLineSalesDemand[] = (item?.salesDemands || []).map((d: any) => ({
      orderItemId: String(d?.orderItemId || ''),
      contractId: String(d?.contractId || ''),
      contractNumber: String(d?.contractNumber || ''),
      customerId: String(d?.customerId || ''),
      customerName: String(d?.customerName || ''),
      salesRepId: d?.salesRepId ? String(d.salesRepId) : undefined,
      salesRepName: String(d?.salesRepName || ''),
      requiredQuantity: Number(d?.requiredQuantity) || 0,
      requiredDate: d?.requiredDate ? String(d.requiredDate) : undefined,
      fulfilledQuantity: Number(d?.fulfilledQuantity) || 0,
    }));

    return {
      id: String(item?.id || `po-item-${idx}-${Date.now()}`),
      sku: String(item?.sku || '').trim().toUpperCase(),
      productName: String(item?.productName || 'Sản phẩm'),
      brand: String(item?.brand || 'Khác'),
      unit: String(item?.unit || 'Bộ'),
      salesRequiredQuantity: salesReq,
      supplierOrderQuantity: supplierOrd,
      warehouseExtraQuantity: extraQty,
      receivedQuantity: recQty,
      remainingQuantity: remQty,
      unitCost: item?.unitCost !== undefined ? Number(item.unitCost) : undefined,
      earliestRequiredDate: item?.earliestRequiredDate ? String(item.earliestRequiredDate) : undefined,
      notes: item?.notes ? String(item.notes) : undefined,
      sourceType: (item?.sourceType === 'WAREHOUSE_PLANNED' ? 'WAREHOUSE_PLANNED' : 'SALES_REQUEST') as POLineSourceType,
      salesDemands: demands,
    };
  });

  const totalSales = items.reduce((sum, i) => sum + i.salesRequiredQuantity, 0);
  const totalOrder = items.reduce((sum, i) => sum + i.supplierOrderQuantity, 0);
  const totalReceived = items.reduce((sum, i) => sum + i.receivedQuantity, 0);

  return {
    id: String(raw?.id || `po-${Date.now()}`),
    poNumber: String(raw?.poNumber || 'PO-UNKNOWN'),
    supplierName: String(raw?.supplierName || 'Nhà cung cấp'),
    orderDate: String(raw?.orderDate || new Date().toISOString().slice(0, 10)),
    expectedDeliveryDate: raw?.expectedDeliveryDate ? String(raw.expectedDeliveryDate) : undefined,
    warehouseLocation: String(raw?.warehouseLocation || 'Kho Tổng TP.HCM'),
    status: (raw?.status || 'draft') as PurchaseOrderStatus,
    items,
    totalSalesDemand: totalSales,
    totalOrderQuantity: totalOrder,
    totalReceivedQuantity: totalReceived,
    totalAmount: raw?.totalAmount !== undefined ? Number(raw.totalAmount) : undefined,
    createdById: String(raw?.createdById || ''),
    createdByName: String(raw?.createdByName || ''),
    organizationId: String(raw?.organizationId || 'system_admin'),
    notes: raw?.notes ? String(raw.notes) : undefined,
    inboundVoucherIds: Array.isArray(raw?.inboundVoucherIds) ? raw.inboundVoucherIds.map(String) : [],
    createdAt: String(raw?.createdAt || new Date().toISOString()),
    updatedAt: String(raw?.updatedAt || new Date().toISOString()),
  };
}

/**
 * Validates a Purchase Order before submission.
 */
export function validatePurchaseOrder(po: {
  supplierName: string;
  items: PurchaseOrderItem[];
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!po.supplierName || !po.supplierName.trim()) {
    errors.push('Tên Nhà cung cấp không được để trống.');
  }

  if (!po.items || po.items.length === 0) {
    errors.push('Đơn đặt NCC phải có ít nhất 1 mặt hàng.');
  }

  const skuSet = new Set<string>();
  for (const item of po.items || []) {
    const cleanSku = (item.sku || '').trim().toUpperCase();
    if (!cleanSku) {
      errors.push('Mã hàng SKU không hợp lệ.');
    }
    if (skuSet.has(cleanSku)) {
      errors.push(`Mã hàng ${cleanSku} bị trùng lặp trong cùng một đơn đặt NCC.`);
    }
    skuSet.add(cleanSku);

    if (item.supplierOrderQuantity <= 0) {
      errors.push(`Số lượng đặt NCC cho mã ${item.sku} phải lớn hơn 0.`);
    }

    if (item.supplierOrderQuantity < item.salesRequiredQuantity) {
      errors.push(
        `Số lượng đặt NCC cho mã ${item.sku} (${item.supplierOrderQuantity}) không được nhỏ hơn tổng nhu cầu Sales (${item.salesRequiredQuantity}).`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
