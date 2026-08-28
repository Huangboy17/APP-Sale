import {
  StockOutVoucher,
  StockOutVoucherItem,
  ReserveItem,
  OrderItem,
  Contract,
  Customer,
  ProductPriceItem,
  InventoryItem,
  StockOutItemSourceType,
} from '../types';

/**
 * Generates a unique Stock Out Voucher number in the format: PXK-YYYYMMDD-XXXX
 */
export function generateStockOutVoucherNumber(existingVouchers: StockOutVoucher[]): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `PXK-${year}${month}${day}-`;

  const todayCount = (existingVouchers || []).filter((v) =>
    (v.voucherNumber || '').startsWith(datePrefix)
  ).length;

  const sequence = String(todayCount + 1).padStart(4, '0');
  return `${datePrefix}${sequence}`;
}

/**
 * Extracts and calculates all deliverable items for a specific Contract.
 * Integrates data from ReserveItems (held stock) and OrderItems (inbound-received stock).
 */
export function getContractDeliverableItems(
  contractId: string,
  reserveItems: ReserveItem[],
  orderItems: OrderItem[],
  productMap?: Map<string, ProductPriceItem>,
  inventoryMap?: Map<string, InventoryItem>
): StockOutVoucherItem[] {
  if (!contractId) return [];

  // 1. Gather relevant ReserveItems (excluding released/cancelled)
  const relevantReserves = (reserveItems || []).filter(
    (r) =>
      r.contractId === contractId &&
      r.status !== 'released' &&
      r.status !== 'cancelled'
  );

  // 2. Gather relevant OrderItems (excluding cancelled)
  const relevantOrders = (orderItems || []).filter(
    (o) => o.contractId === contractId && o.status !== 'cancelled'
  );

  // Group by SKU
  const skuMap = new Map<
    string,
    {
      sku: string;
      productName: string;
      brand: string;
      unit: string;
      reservedQty: number;
      reserveDispatched: number;
      reserveAvailable: number;
      reserveItemId?: string;
      orderedQty: number;
      orderReceivedQty: number;
      orderDispatched: number;
      orderAvailable: number;
      orderItemId?: string;
    }
  >();

  // Process Reserve items
  for (const r of relevantReserves) {
    const cleanSku = (r.sku || '').trim().toUpperCase();
    if (!cleanSku) continue;

    const dispatched =
      r.dispatchedQuantity !== undefined
        ? r.dispatchedQuantity
        : r.status === 'delivered'
        ? r.reservedQuantity
        : 0;
    const available = Math.max(0, (r.reservedQuantity || 0) - dispatched);

    const existing = skuMap.get(cleanSku);
    if (existing) {
      existing.reservedQty += r.reservedQuantity || 0;
      existing.reserveDispatched += dispatched;
      existing.reserveAvailable += available;
      if (!existing.reserveItemId) existing.reserveItemId = r.id;
    } else {
      const prod = productMap?.get(cleanSku);
      const inv = inventoryMap?.get(cleanSku);
      skuMap.set(cleanSku, {
        sku: r.sku,
        productName: r.productName || prod?.name || inv?.name || cleanSku,
        brand: prod?.brand || 'Khác',
        unit: r.unit || prod?.unit || inv?.unit || 'Bộ',
        reservedQty: r.reservedQuantity || 0,
        reserveDispatched: dispatched,
        reserveAvailable: available,
        reserveItemId: r.id,
        orderedQty: 0,
        orderReceivedQty: 0,
        orderDispatched: 0,
        orderAvailable: 0,
      });
    }
  }

  // Process Order items (Only received portion is available to dispatch!)
  for (const o of relevantOrders) {
    const cleanSku = (o.sku || '').trim().toUpperCase();
    if (!cleanSku) continue;

    const received = o.receivedQuantity || 0;
    const dispatched =
      o.dispatchedQuantity !== undefined
        ? o.dispatchedQuantity
        : o.status === 'delivered'
        ? received
        : 0;
    const available = Math.max(0, received - dispatched);

    const existing = skuMap.get(cleanSku);
    if (existing) {
      existing.orderedQty += o.orderQuantity || 0;
      existing.orderReceivedQty += received;
      existing.orderDispatched += dispatched;
      existing.orderAvailable += available;
      if (!existing.orderItemId) existing.orderItemId = o.id;
    } else {
      const prod = productMap?.get(cleanSku);
      const inv = inventoryMap?.get(cleanSku);
      skuMap.set(cleanSku, {
        sku: o.sku,
        productName: o.productName || prod?.name || inv?.name || cleanSku,
        brand: o.brand || prod?.brand || 'Khác',
        unit: o.unit || prod?.unit || inv?.unit || 'Bộ',
        reservedQty: 0,
        reserveDispatched: 0,
        reserveAvailable: 0,
        orderedQty: o.orderQuantity || 0,
        orderReceivedQty: received,
        orderDispatched: dispatched,
        orderAvailable: available,
        orderItemId: o.id,
      });
    }
  }

  // Convert to StockOutVoucherItem array
  const items: StockOutVoucherItem[] = [];

  for (const entry of skuMap.values()) {
    const totalAvailable = entry.reserveAvailable + entry.orderAvailable;
    const totalDispatched = entry.reserveDispatched + entry.orderDispatched;

    let sourceType: StockOutItemSourceType = 'RESERVE';
    if (entry.reservedQty > 0 && (entry.orderedQty > 0 || entry.orderReceivedQty > 0)) {
      sourceType = 'HYBRID';
    } else if (entry.orderedQty > 0 || entry.orderReceivedQty > 0) {
      sourceType = 'ORDER';
    }

    items.push({
      id: `item-${entry.sku}-${Date.now()}`,
      sku: entry.sku,
      productName: entry.productName,
      brand: entry.brand,
      unit: entry.unit,
      quantity: totalAvailable > 0 ? totalAvailable : 0, // Default to available
      reservedQuantity: entry.reservedQty,
      orderedQuantity: entry.orderedQty,
      orderReceivedQuantity: entry.orderReceivedQty,
      previouslyDispatchedQuantity: totalDispatched,
      availableToDeliverQuantity: totalAvailable,
      sourceType,
      reserveItemId: entry.reserveItemId,
      orderItemId: entry.orderItemId,
      notes: '',
    });
  }

  return items;
}

export interface CustomerDeliverableSummary {
  customer: Customer;
  deliverableContractCount: number;
  totalDeliverableQty: number;
  totalHoldingQty: number;
  totalOrderArrivedQty: number;
}

/**
 * Summarizes deliverable stock for all Customers.
 */
export function getCustomersWithDeliverableSummary(
  customers: Customer[],
  contracts: Contract[],
  reserveItems: ReserveItem[],
  orderItems: OrderItem[]
): CustomerDeliverableSummary[] {
  const customerMap = new Map<string, CustomerDeliverableSummary>();

  for (const c of customers || []) {
    customerMap.set(c.id, {
      customer: c,
      deliverableContractCount: 0,
      totalDeliverableQty: 0,
      totalHoldingQty: 0,
      totalOrderArrivedQty: 0,
    });
  }

  // Calculate per contract
  for (const contract of contracts || []) {
    const custId = contract.customerId;
    const custSummary = customerMap.get(custId);
    if (!custSummary) continue;

    const items = getContractDeliverableItems(contract.id, reserveItems, orderItems);
    const contractAvailQty = items.reduce(
      (sum, it) => sum + (it.availableToDeliverQuantity || 0),
      0
    );

    if (contractAvailQty > 0) {
      custSummary.deliverableContractCount += 1;
      custSummary.totalDeliverableQty += contractAvailQty;
    }

    for (const it of items) {
      custSummary.totalHoldingQty += it.reservedQuantity || 0;
      custSummary.totalOrderArrivedQty += it.orderReceivedQuantity || 0;
    }
  }

  return Array.from(customerMap.values());
}

export interface ContractDeliverableSummary {
  contract: Contract;
  customerName: string;
  customerCode?: string;
  deliverableItemCount: number;
  totalDeliverableQty: number;
  totalHoldingQty: number;
  totalOrderArrivedQty: number;
  hasDeliverableStock: boolean;
}

/**
 * Summarizes deliverable stock for Contracts, optionally filtered by Customer ID.
 */
export function getContractsWithDeliverableSummary(
  contracts: Contract[],
  customers: Customer[],
  reserveItems: ReserveItem[],
  orderItems: OrderItem[],
  selectedCustomerId?: string
): ContractDeliverableSummary[] {
  const custMap = new Map((customers || []).map((c) => [c.id, c]));

  let targetContracts = contracts || [];
  if (selectedCustomerId) {
    targetContracts = targetContracts.filter((c) => c.customerId === selectedCustomerId);
  }

  return targetContracts.map((contract) => {
    const cust = custMap.get(contract.customerId);
    const items = getContractDeliverableItems(contract.id, reserveItems, orderItems);
    const deliverableItems = items.filter((it) => (it.availableToDeliverQuantity || 0) > 0);
    const totalDeliverableQty = deliverableItems.reduce(
      (sum, it) => sum + (it.availableToDeliverQuantity || 0),
      0
    );
    const totalHoldingQty = items.reduce((sum, it) => sum + (it.reservedQuantity || 0), 0);
    const totalOrderArrivedQty = items.reduce(
      (sum, it) => sum + (it.orderReceivedQuantity || 0),
      0
    );

    return {
      contract,
      customerName: cust?.name || contract.customerName || 'ORPHAN CUSTOMER',
      customerCode: cust?.code,
      deliverableItemCount: deliverableItems.length,
      totalDeliverableQty,
      totalHoldingQty,
      totalOrderArrivedQty,
      hasDeliverableStock: totalDeliverableQty > 0,
    };
  });
}

/**
 * Validation function for Create Stock Out Voucher.
 */
export function validateStockOutVoucher(
  contractId: string,
  items: StockOutVoucherItem[]
): { isValid: boolean; error?: string } {
  if (!contractId) {
    return { isValid: false, error: 'Vui lòng chọn Hợp đồng nguồn để xuất kho!' };
  }

  if (!items || items.length === 0) {
    return { isValid: false, error: 'Hợp đồng đã chọn không có mặt hàng nào để xuất kho!' };
  }

  let totalExportQty = 0;
  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const max = Number(item.availableToDeliverQuantity) || 0;

    if (qty < 0) {
      return {
        isValid: false,
        error: `Số lượng xuất cho mã ${item.sku} không được âm!`,
      };
    }

    if (qty > max) {
      return {
        isValid: false,
        error: `Số lượng xuất cho mã ${item.sku} (${qty}) vượt quá số lượng có thể xuất hiện tại (${max})!`,
      };
    }

    totalExportQty += qty;
  }

  if (totalExportQty <= 0) {
    return {
      isValid: false,
      error: 'Vui lòng nhập số lượng xuất đợt này lớn hơn 0 cho ít nhất một mặt hàng!',
    };
  }

  return { isValid: true };
}
