import {
  Customer,
  Contract,
  Quotation,
  QuoteProductRow,
  ReserveItem,
  OrderItem,
  PurchaseOrder,
  StockInVoucher,
  StockOutVoucher,
} from '../types';

export type LogisticsStatusType =
  | 'UNPROCESSED' // Chưa xử lý
  | 'RESERVED' // Đang giữ hàng
  | 'PURCHASE_REQUESTED' // Đã gửi yêu cầu đặt
  | 'ORDERED_PO' // Đã đặt NCC
  | 'PARTIAL_IN_STOCK' // Đã về kho một phần
  | 'IN_STOCK' // Đã về đủ kho
  | 'PARTIAL_DELIVERED' // Đã giao một phần
  | 'DELIVERED'; // Đã giao hàng đủ

export interface TimelineStep {
  step: 'CONTRACT' | 'RESERVE' | 'SALES_REQUEST' | 'PURCHASE_ORDER' | 'STOCK_IN' | 'STOCK_OUT';
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  date?: string;
  quantity?: number;
  details?: string;
  referenceCode?: string;
  referenceId?: string;
  actorName?: string;
  extraNotes?: string;
}

export interface ItemLogisticsStatusResult {
  status: LogisticsStatusType;
  statusLabel: string;
  statusBadgeClass: string;
  progressPercent: number; // 0 to 100
  contractQuantity: number; // SL HĐ gốc
  reservedQuantity: number; // SL giữ
  requestedQuantity: number; // SL yêu cầu đặt
  supplierOrderedQuantity: number; // SL đã lên PO
  receivedQuantity: number; // SL đã nhập kho thực tế
  deliveredQuantity: number; // SL đã xuất kho giao khách
  expectedDeliveryDate?: string; // ETA từ PO
  firstReceivedDate?: string; // Ngày nhận đầu tiên
  fullyReceivedDate?: string; // Ngày nhận đủ
  firstDeliveredDate?: string; // Ngày giao đầu tiên
  fullyDeliveredDate?: string; // Ngày giao đủ
  purchaseOrders: Array<{
    id: string;
    poNumber: string;
    orderDate: string;
    expectedDeliveryDate?: string;
    supplierName: string;
    orderQuantity: number;
  }>;
  stockInVouchers: Array<{
    id: string;
    voucherNumber: string;
    date: string;
    quantity: number;
    warehouseLocation?: string;
  }>;
  stockOutVouchers: Array<{
    id: string;
    voucherNumber: string;
    date: string;
    quantity: number;
    warehouseLocation?: string;
  }>;
  timelineSteps: TimelineStep[];
}

export interface Customer360ItemRow {
  id: string;
  contractId: string;
  contractNumber: string;
  contractDate?: string;
  quoteNumber?: string;
  sku: string;
  productName: string;
  brand: string;
  unit: string;
  contractQuantity: number;
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
  logistics: ItemLogisticsStatusResult;
}

export interface Customer360Summary {
  totalContractValue: number;
  totalContractsCount: number;
  signedContractsCount: number;
  quotationRoundsCount: number;
  totalItemsCount: number;
  totalContractQuantity: number;
  totalReceivedQuantity: number;
  totalDeliveredQuantity: number;
  overallFulfillmentPercent: number;
}

/**
 * Calculates the complete logistics status and supply chain timeline for a single item of a contract.
 * Prioritizes ID-first linking (contractId, orderItemId, reserveItemId, purchaseOrderId, stockIn/out vouchers).
 */
export function getItemLogisticsStatus(
  contractId: string,
  contractNumber: string,
  contractDate: string | undefined,
  quoteRow: QuoteProductRow,
  reserveItems: ReserveItem[] = [],
  orderItems: OrderItem[] = [],
  purchaseOrders: PurchaseOrder[] = [],
  stockInVouchers: StockInVoucher[] = [],
  stockOutVouchers: StockOutVoucher[] = []
): ItemLogisticsStatusResult {
  const cleanSku = (quoteRow.sku || '').trim().toUpperCase();
  const contractQty = Number(quoteRow.quantity) || 0;

  // 1. Matching Reserve Items (for this contract and SKU/ID)
  const matchingReserves = (reserveItems || []).filter(
    (r) =>
      r.contractId === contractId &&
      (r.sku || '').trim().toUpperCase() === cleanSku &&
      r.status !== 'released' &&
      r.status !== 'cancelled'
  );
  const totalReservedQty = matchingReserves.reduce(
    (sum, r) => sum + (Number(r.reservedQuantity) || 0),
    0
  );

  // 2. Matching Order Items (Sales Requests)
  const matchingOrders = (orderItems || []).filter(
    (o) =>
      o.contractId === contractId &&
      (o.sku || '').trim().toUpperCase() === cleanSku &&
      o.status !== 'cancelled'
  );
  const totalRequestedQty = matchingOrders.reduce(
    (sum, o) => sum + (Number(o.orderQuantity) || 0),
    0
  );

  // 3. Matching Purchase Orders
  // Match PO lines whose salesDemands specifically reference this contract or orderItemId
  const matchingPOs: Array<{
    id: string;
    poNumber: string;
    orderDate: string;
    expectedDeliveryDate?: string;
    supplierName: string;
    orderQuantity: number;
  }> = [];

  let totalSupplierOrderedQty = 0;
  let poEarliestETA: string | undefined = undefined;

  for (const po of purchaseOrders || []) {
    if (po.status === 'cancelled') continue;

    for (const poItem of po.items || []) {
      if ((poItem.sku || '').trim().toUpperCase() !== cleanSku) continue;

      // Check if this PO item specifically serves this contract
      const matchedDemand = (poItem.salesDemands || []).find(
        (sd) =>
          sd.contractId === contractId ||
          matchingOrders.some((o) => o.id === sd.orderItemId)
      );

      if (matchedDemand) {
        matchingPOs.push({
          id: po.id,
          poNumber: po.poNumber,
          orderDate: po.orderDate,
          expectedDeliveryDate: po.expectedDeliveryDate || poItem.earliestRequiredDate,
          supplierName: po.supplierName,
          orderQuantity: matchedDemand.requiredQuantity || poItem.supplierOrderQuantity,
        });

        totalSupplierOrderedQty += matchedDemand.requiredQuantity || poItem.supplierOrderQuantity;

        if (po.expectedDeliveryDate && (!poEarliestETA || po.expectedDeliveryDate < poEarliestETA)) {
          poEarliestETA = po.expectedDeliveryDate;
        }
      }
    }
  }

  // Fallback: If matchingOrders has ETA
  if (!poEarliestETA) {
    const orderWithETA = matchingOrders.find((o) => !!o.supplierETA);
    if (orderWithETA) poEarliestETA = orderWithETA.supplierETA;
  }

  // 4. Inbound Stock In Receipts
  const matchingStockIns: Array<{
    id: string;
    voucherNumber: string;
    date: string;
    quantity: number;
    warehouseLocation?: string;
  }> = [];

  // Look into orderItems.inboundReceipts or linked stockInVouchers
  for (const order of matchingOrders) {
    for (const rec of order.inboundReceipts || []) {
      matchingStockIns.push({
        id: rec.id,
        voucherNumber: rec.receiptNumber,
        date: rec.date,
        quantity: rec.quantity,
        warehouseLocation: rec.warehouseLocation,
      });
    }
  }

  // Also check direct StockInVouchers for matched POs
  const matchedPoIds = new Set(matchingPOs.map((p) => p.id));
  const matchedPoNumbers = new Set(matchingPOs.map((p) => p.poNumber));

  for (const inVoucher of stockInVouchers || []) {
    if (inVoucher.status === 'CANCELLED') continue;
    if (
      matchedPoIds.has(inVoucher.purchaseOrderId || '') ||
      matchedPoNumbers.has(inVoucher.purchaseOrderNumber || '')
    ) {
      for (const item of inVoucher.items || []) {
        if ((item.sku || '').trim().toUpperCase() === cleanSku) {
          // Check if already captured via inboundReceipts
          if (!matchingStockIns.some((m) => m.voucherNumber === inVoucher.voucherNumber)) {
            matchingStockIns.push({
              id: inVoucher.id,
              voucherNumber: inVoucher.voucherNumber,
              date: inVoucher.date,
              quantity: item.actualQuantity || item.expectedQuantity || 0,
              warehouseLocation: inVoucher.warehouseLocation,
            });
          }
        }
      }
    }
  }

  // Sort inbound dates
  matchingStockIns.sort((a, b) => (a.date > b.date ? 1 : -1));

  // Compute received quantity (order items received + stock held in reserve)
  const orderReceivedQty = matchingOrders.reduce(
    (sum, o) => sum + (Number(o.receivedQuantity) || 0),
    0
  );
  const totalReceivedQty = Math.min(contractQty, totalReservedQty + orderReceivedQty);

  const firstReceivedDate = matchingStockIns.length > 0 ? matchingStockIns[0].date : undefined;
  const fullyReceivedDate =
    totalReceivedQty >= contractQty && matchingStockIns.length > 0
      ? matchingStockIns[matchingStockIns.length - 1].date
      : undefined;

  // 5. Outbound Stock Out Vouchers
  const matchingStockOuts: Array<{
    id: string;
    voucherNumber: string;
    date: string;
    quantity: number;
    warehouseLocation?: string;
  }> = [];

  for (const outVoucher of stockOutVouchers || []) {
    if (outVoucher.status === 'CANCELLED') continue;

    if (
      outVoucher.contractId === contractId ||
      outVoucher.contractNumber === contractNumber
    ) {
      for (const item of outVoucher.items || []) {
        if ((item.sku || '').trim().toUpperCase() === cleanSku) {
          matchingStockOuts.push({
            id: outVoucher.id,
            voucherNumber: outVoucher.voucherNumber,
            date: outVoucher.date,
            quantity: Number(item.quantity) || 0,
            warehouseLocation: outVoucher.warehouseLocation,
          });
        }
      }
    }
  }

  matchingStockOuts.sort((a, b) => (a.date > b.date ? 1 : -1));

  // Calculate dispatched quantity
  const reserveDispatched = matchingReserves.reduce(
    (sum, r) => sum + (Number(r.dispatchedQuantity) || (r.status === 'delivered' ? r.reservedQuantity : 0)),
    0
  );
  const orderDispatched = matchingOrders.reduce(
    (sum, o) => sum + (Number(o.dispatchedQuantity) || (o.status === 'delivered' ? (o.receivedQuantity || o.orderQuantity) : 0)),
    0
  );
  const stockOutSum = matchingStockOuts.reduce((sum, s) => sum + s.quantity, 0);

  const totalDeliveredQty = Math.min(
    contractQty,
    Math.max(reserveDispatched + orderDispatched, stockOutSum)
  );

  const firstDeliveredDate = matchingStockOuts.length > 0 ? matchingStockOuts[0].date : undefined;
  const fullyDeliveredDate =
    totalDeliveredQty >= contractQty && matchingStockOuts.length > 0
      ? matchingStockOuts[matchingStockOuts.length - 1].date
      : undefined;

  // 6. Determine Status & Label
  let status: LogisticsStatusType = 'UNPROCESSED';
  let statusLabel = '⚪ Chưa xử lý';
  let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
  let progressPercent = 0;

  if (totalDeliveredQty >= contractQty && contractQty > 0) {
    status = 'DELIVERED';
    statusLabel = '🟢 Đã giao hàng đủ';
    statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    progressPercent = 100;
  } else if (totalDeliveredQty > 0) {
    status = 'PARTIAL_DELIVERED';
    statusLabel = `🚚 Đã giao ${totalDeliveredQty}/${contractQty}`;
    statusBadgeClass = 'bg-teal-100 text-teal-800 border-teal-300';
    progressPercent = Math.min(95, Math.round((totalDeliveredQty / contractQty) * 100));
  } else if (totalRequestedQty > 0) {
    if (orderReceivedQty >= totalRequestedQty) {
      status = 'IN_STOCK';
      statusLabel = '📦 Đã về kho đủ';
      statusBadgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
      progressPercent = 75;
    } else if (orderReceivedQty > 0) {
      status = 'PARTIAL_IN_STOCK';
      statusLabel = `🟠 Đã về kho ${orderReceivedQty}/${totalRequestedQty}`;
      statusBadgeClass = 'bg-orange-100 text-orange-800 border-orange-300';
      progressPercent = Math.min(70, Math.round((orderReceivedQty / totalRequestedQty) * 50) + 20);
    } else if (matchingPOs.length > 0) {
      status = 'ORDERED_PO';
      statusLabel = `🟡 Đã đặt NCC (${matchingPOs[0].poNumber})`;
      statusBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
      progressPercent = 40;
    } else {
      status = 'PURCHASE_REQUESTED';
      statusLabel = '📨 Đã gửi yêu cầu đặt';
      statusBadgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-300';
      progressPercent = 20;
    }
  } else if (totalReservedQty > 0) {
    status = 'RESERVED';
    statusLabel = `🔵 Đang giữ kho (${totalReservedQty} sp)`;
    statusBadgeClass = 'bg-sky-100 text-sky-800 border-sky-300';
    progressPercent = 50;
  }

  // 7. Construct Structured Timeline Steps
  const timelineSteps: TimelineStep[] = [];

  // Step 1: Contract signed
  timelineSteps.push({
    step: 'CONTRACT',
    title: `Ký kết Hợp đồng ${contractNumber}`,
    status: 'completed',
    date: contractDate,
    quantity: contractQty,
    details: `Hợp đồng chính thức yêu cầu cấp ${contractQty} ${quoteRow.unit}`,
    referenceCode: contractNumber,
    referenceId: contractId,
  });

  // Step 2: Reserve
  if (totalReservedQty > 0) {
    timelineSteps.push({
      step: 'RESERVE',
      title: 'Giữ hàng sẵn từ kho',
      status: 'completed',
      date: matchingReserves[0]?.reservedDate || contractDate,
      quantity: totalReservedQty,
      details: `Đã khóa tồn sẵn ${totalReservedQty} ${quoteRow.unit} tại ${matchingReserves[0]?.warehouseLocation || 'Kho Tổng'}`,
      referenceCode: matchingReserves[0]?.id,
      referenceId: matchingReserves[0]?.id,
    });
  }

  // Step 3: Sales Request
  if (totalRequestedQty > 0) {
    timelineSteps.push({
      step: 'SALES_REQUEST',
      title: 'Đề nghị đặt hàng NCC',
      status: 'completed',
      date: matchingOrders[0]?.orderDate || contractDate,
      quantity: totalRequestedQty,
      details: `Sales đã phát sinh đề xuất mua thêm ${totalRequestedQty} ${quoteRow.unit}`,
      referenceCode: matchingOrders[0]?.id,
      referenceId: matchingOrders[0]?.id,
    });
  }

  // Step 4: Purchase Order
  if (matchingPOs.length > 0) {
    matchingPOs.forEach((po) => {
      timelineSteps.push({
        step: 'PURCHASE_ORDER',
        title: `Đã lên Đơn đặt NCC: ${po.poNumber}`,
        status: 'completed',
        date: po.orderDate,
        quantity: po.orderQuantity,
        details: `Nhà cung cấp: ${po.supplierName} • Dự kiến về (ETA): ${po.expectedDeliveryDate || 'Chưa có ETA'}`,
        referenceCode: po.poNumber,
        referenceId: po.id,
      });
    });
  } else if (totalRequestedQty > 0) {
    timelineSteps.push({
      step: 'PURCHASE_ORDER',
      title: 'Chờ Kho lên đơn đặt NCC',
      status: 'in_progress',
      details: 'Kho đang tổng hợp nhu cầu để đặt hàng NCC',
    });
  }

  // Step 5: Stock In
  if (matchingStockIns.length > 0) {
    matchingStockIns.forEach((rec, idx) => {
      timelineSteps.push({
        step: 'STOCK_IN',
        title: `Nhập kho đợt ${idx + 1}: ${rec.voucherNumber}`,
        status: 'completed',
        date: rec.date,
        quantity: rec.quantity,
        details: `Đã nhập ${rec.quantity} ${quoteRow.unit} vào ${rec.warehouseLocation || 'Kho Tổng'}`,
        referenceCode: rec.voucherNumber,
        referenceId: rec.id,
      });
    });
  } else if (matchingPOs.length > 0) {
    timelineSteps.push({
      step: 'STOCK_IN',
      title: 'Chờ NCC giao hàng về kho',
      status: 'pending',
      details: poEarliestETA ? `Dự kiến giao hàng: ${poEarliestETA}` : 'Đang chờ cập nhật lịch giao',
    });
  }

  // Step 6: Stock Out
  if (matchingStockOuts.length > 0) {
    matchingStockOuts.forEach((out, idx) => {
      timelineSteps.push({
        step: 'STOCK_OUT',
        title: `Xuất kho giao hàng đợt ${idx + 1}: ${out.voucherNumber}`,
        status: 'completed',
        date: out.date,
        quantity: out.quantity,
        details: `Đã xuất ${out.quantity} ${quoteRow.unit} bàn giao cho khách hàng`,
        referenceCode: out.voucherNumber,
        referenceId: out.id,
      });
    });
  } else if (totalReceivedQty > 0) {
    timelineSteps.push({
      step: 'STOCK_OUT',
      title: 'Sẵn sàng lập phiếu xuất kho',
      status: 'in_progress',
      details: `Đã có sẵn ${totalReceivedQty} ${quoteRow.unit} trong kho để xuất giao`,
    });
  }

  return {
    status,
    statusLabel,
    statusBadgeClass,
    progressPercent,
    contractQuantity: contractQty,
    reservedQuantity: totalReservedQty,
    requestedQuantity: totalRequestedQty,
    supplierOrderedQuantity: totalSupplierOrderedQty,
    receivedQuantity: totalReceivedQty,
    deliveredQuantity: totalDeliveredQty,
    expectedDeliveryDate: poEarliestETA,
    firstReceivedDate,
    fullyReceivedDate,
    firstDeliveredDate,
    fullyDeliveredDate,
    purchaseOrders: matchingPOs,
    stockInVouchers: matchingStockIns,
    stockOutVouchers: matchingStockOuts,
    timelineSteps,
  };
}

/**
 * Extracts and calculates all Customer 360 item rows from finalized contracts & quotations.
 */
export function getCustomer360Items(
  customerId: string,
  contracts: Contract[] = [],
  quotations: Quotation[] = [],
  reserveItems: ReserveItem[] = [],
  orderItems: OrderItem[] = [],
  purchaseOrders: PurchaseOrder[] = [],
  stockInVouchers: StockInVoucher[] = [],
  stockOutVouchers: StockOutVoucher[] = []
): Customer360ItemRow[] {
  if (!customerId) return [];

  const customerContracts = (contracts || []).filter((c) => c.customerId === customerId);
  const rows: Customer360ItemRow[] = [];

  for (const contract of customerContracts) {
    // If contract has items array
    if (contract.items && Array.isArray(contract.items) && contract.items.length > 0) {
      for (const item of contract.items) {
        const logistics = getItemLogisticsStatus(
          contract.id,
          contract.contractNumber,
          contract.contractDate,
          item,
          reserveItems,
          orderItems,
          purchaseOrders,
          stockInVouchers,
          stockOutVouchers
        );

        const unitPrice = Number(item.quotedPrice) || Number(item.listPrice) || 0;
        rows.push({
          id: `${contract.id}-${item.sku}-${item.id || Math.random()}`,
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          contractDate: contract.contractDate,
          quoteNumber: contract.quoteNumber,
          sku: item.sku,
          productName: item.name,
          brand: item.brand || 'Khác',
          unit: item.unit || 'Bộ',
          contractQuantity: Number(item.quantity) || 0,
          unitPrice,
          discountPercent: Number(item.discountPercent) || 0,
          totalPrice: (Number(item.quantity) || 0) * unitPrice,
          logistics,
        });
      }
    }
  }

  // Fallback: If no contracts yet, check if there is an approved quotation
  if (rows.length === 0) {
    const approvedQuotes = (quotations || []).filter(
      (q) => q.customerId === customerId && (q.status === 'approved_contract' || q.isContractQuote)
    );

    for (const quote of approvedQuotes) {
      for (const item of quote.items || []) {
        const logistics = getItemLogisticsStatus(
          quote.contractId || quote.id,
          quote.quoteNumber,
          quote.date,
          item,
          reserveItems,
          orderItems,
          purchaseOrders,
          stockInVouchers,
          stockOutVouchers
        );

        const unitPrice = Number(item.quotedPrice) || Number(item.listPrice) || 0;
        rows.push({
          id: `${quote.id}-${item.sku}-${item.id || Math.random()}`,
          contractId: quote.contractId || quote.id,
          contractNumber: quote.quoteNumber,
          contractDate: quote.date,
          quoteNumber: quote.quoteNumber,
          sku: item.sku,
          productName: item.name,
          brand: item.brand || 'Khác',
          unit: item.unit || 'Bộ',
          contractQuantity: Number(item.quantity) || 0,
          unitPrice,
          discountPercent: Number(item.discountPercent) || 0,
          totalPrice: (Number(item.quantity) || 0) * unitPrice,
          logistics,
        });
      }
    }
  }

  return rows;
}

/**
 * Calculates overall Customer 360 summary KPIs.
 */
export function getCustomer360Summary(
  customer: Customer,
  contracts: Contract[] = [],
  quotations: Quotation[] = [],
  items: Customer360ItemRow[] = []
): Customer360Summary {
  if (!customer) {
    return {
      totalContractValue: 0,
      totalContractsCount: 0,
      signedContractsCount: 0,
      quotationRoundsCount: 0,
      totalItemsCount: 0,
      totalContractQuantity: 0,
      totalReceivedQuantity: 0,
      totalDeliveredQuantity: 0,
      overallFulfillmentPercent: 0,
    };
  }

  const customerContracts = (contracts || []).filter((c) => c && c.customerId === customer.id);
  const customerQuotes = (quotations || []).filter((q) => q && q.customerId === customer.id);

  const totalContractValue = customerContracts.reduce(
    (sum, c) => sum + (Number(c.totalValue) || 0),
    0
  );

  const signedContractsCount = customerContracts.filter(
    (c) => c && (c.status === 'signed' || c.status === 'completed' || c.status === 'delivering')
  ).length;

  const totalContractQty = (items || []).reduce((sum, it) => sum + (Number(it?.contractQuantity) || 0), 0);
  const totalReceivedQty = (items || []).reduce((sum, it) => sum + (Number(it?.logistics?.receivedQuantity) || 0), 0);
  const totalDeliveredQty = (items || []).reduce((sum, it) => sum + (Number(it?.logistics?.deliveredQuantity) || 0), 0);

  const overallFulfillmentPercent =
    totalContractQty > 0
      ? Math.min(100, Math.round((totalDeliveredQty / totalContractQty) * 100))
      : 0;

  return {
    totalContractValue,
    totalContractsCount: customerContracts.length,
    signedContractsCount,
    quotationRoundsCount: customerQuotes.length,
    totalItemsCount: (items || []).length,
    totalContractQuantity: totalContractQty,
    totalReceivedQuantity: totalReceivedQty,
    totalDeliveredQuantity: totalDeliveredQty,
    overallFulfillmentPercent,
  };
}
