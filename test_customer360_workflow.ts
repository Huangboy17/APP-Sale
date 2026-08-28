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
} from './src/types';
import {
  getItemLogisticsStatus,
  getCustomer360Items,
  getCustomer360Summary,
} from './src/services/customer360Service';

console.log('================================================================');
console.log('🧪 RUNNING CUSTOMER 360 AUTOMATED VERIFICATION SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (detail) console.error(`   Details: ${detail}`);
  }
}

// -------------------------------------------------------------
// TEST CASE 1: Single Item Full Pipeline Lifecycle
// -------------------------------------------------------------
const custA: Customer = {
  id: 'CUST-001',
  code: 'KH-001',
  name: 'Công ty Cổ Phần Xây Dựng Nam Á',
  company: 'Nam Á Corp',
  phone: '0901234567',
  email: 'nama@example.com',
  address: '123 Nguyễn Văn Linh, Q7, TP.HCM',
  stage: 'contract_signed',
  organizationId: 'ORG-001',
  assignedToId: 'USER-002',
  assignedToName: 'Nguyễn Văn B (Sales)',
  expectedValue: 500000000,
  createdBy: 'USER-001',
  createdAt: '2026-08-01T08:00:00Z',
  updatedAt: '2026-08-01T08:00:00Z',
};

const itemLED: QuoteProductRow = {
  id: 'ROW-LED-001',
  sku: 'LED-DOWNLIGHT-15W',
  name: 'Đèn LED âm trần 15W',
  category: 'Đèn Chiếu Sáng',
  brand: 'Philips',
  color: 'Trắng 4000K',
  size: 'D150mm',
  unit: 'Bộ',
  listPrice: 250000,
  dpPrice: 180000,
  quotedPrice: 220000,
  quantity: 50,
  discountPercent: 0,
  totalAmount: 11000000,
  inventoryAvailable: 0,
  isBelowDP: false,
};

const contractA: Contract = {
  id: 'CTR-001',
  contractNumber: 'HĐKT-2026-001',
  quotationId: 'Q-001',
  quoteNumber: 'BG-2026-001',
  customerId: custA.id,
  customerName: custA.name,
  salesRepId: custA.assignedToId,
  salesRepName: custA.assignedToName,
  contractDate: '2026-08-05',
  deliveryDate: '2026-08-25',
  deliveryAddress: 'Công trường Nam Á Tower',
  items: [itemLED],
  totalValue: 11000000,
  milestones: [],
  status: 'signed',
  createdAt: '2026-08-05T09:00:00Z',
};

// Stage 1: Unprocessed (No PO, no order item yet)
const status1 = getItemLogisticsStatus(contractA.id, contractA.contractNumber, contractA.contractDate, itemLED, [], [], [], [], []);
assert(status1.status === 'UNPROCESSED', 'Stage 1: Initial status is UNPROCESSED');
assert(status1.contractQuantity === 50, 'Stage 1: Contract quantity is 50');

// Stage 2: Sales Request (OrderItem created)
const orderItemA: OrderItem = {
  id: 'ORDER-ITEM-001',
  contractId: contractA.id,
  contractNumber: contractA.contractNumber,
  quoteNumber: contractA.quoteNumber,
  customerId: custA.id,
  customerName: custA.name,
  salesRepName: custA.assignedToName,
  sku: itemLED.sku,
  productName: itemLED.name,
  unit: itemLED.unit,
  orderQuantity: 50,
  receivedQuantity: 0,
  dispatchedQuantity: 0,
  status: 'pending_order',
  warehouseLocation: 'Kho Tổng',
  orderDate: '2026-08-06',
};
const status2 = getItemLogisticsStatus(contractA.id, contractA.contractNumber, contractA.contractDate, itemLED, [], [orderItemA], [], [], []);
assert(status2.status === 'PURCHASE_REQUESTED', 'Stage 2: Status is PURCHASE_REQUESTED after Sales creates request');
assert(status2.requestedQuantity === 50, 'Stage 2: Requested quantity is 50');

// Stage 3: PO Created (Warehouse buys 50 for customer + 20 extra buffer = 70 total)
const po1: PurchaseOrder = {
  id: 'PO-001',
  poNumber: 'PO-20260807-0001',
  orderDate: '2026-08-07',
  supplierId: 'SUPP-001',
  supplierName: 'Philips Lighting VN',
  expectedDeliveryDate: '2026-08-15',
  warehouseLocation: 'Kho Tổng TP.HCM',
  status: 'ORDERED',
  items: [
    {
      sku: itemLED.sku,
      productName: itemLED.name,
      unit: itemLED.unit,
      salesRequiredQuantity: 50,
      warehouseExtraQuantity: 20,
      supplierOrderQuantity: 70,
      unitPrice: 150000,
      totalAmount: 10500000,
      salesDemands: [
        {
          orderItemId: orderItemA.id,
          contractId: contractA.id,
          customerId: custA.id,
          requiredQuantity: 50,
          customerName: custA.name,
          contractNumber: contractA.contractNumber,
          salesRepName: custA.assignedToName,
          requiredDate: '2026-08-25',
        },
      ],
    },
  ],
  totalQuantity: 70,
  totalAmount: 10500000,
  createdById: 'USER-001',
  createdByName: 'Kho Trưởng',
  organizationId: 'ORG-001',
  createdAt: '2026-08-07T10:00:00Z',
  updatedAt: '2026-08-07T10:00:00Z',
};

const status3 = getItemLogisticsStatus(contractA.id, contractA.contractNumber, contractA.contractDate, itemLED, [], [orderItemA], [po1], [], []);
assert(status3.status === 'ORDERED_PO', 'Stage 3: Status is ORDERED_PO');
assert(status3.contractQuantity === 50, 'Stage 3: Invariant: Contract quantity remains 50 (not inflated to 70)');
assert(status3.supplierOrderedQuantity === 50, 'Stage 3: Invariant: Customer demand in PO is strictly 50 (warehouse extra 20 excluded)');
assert(status3.expectedDeliveryDate === '2026-08-15', 'Stage 3: ETA correctly picked from PO');

// Stage 4: Partial Inbound Stock In (PNK receives 30 units)
const stockIn1: StockInVoucher = {
  id: 'PNK-001',
  voucherNumber: 'PNK-20260812-0001',
  purchaseOrderId: po1.id,
  purchaseOrderNumber: po1.poNumber,
  date: '2026-08-12',
  supplierName: po1.supplierName,
  warehouseLocation: 'Kho Tổng TP.HCM',
  status: 'CONFIRMED',
  items: [
    {
      sku: itemLED.sku,
      productName: itemLED.name,
      unit: itemLED.unit,
      expectedQuantity: 70,
      actualQuantity: 30,
    },
  ],
  totalQuantity: 30,
  createdById: 'USER-001',
  createdByName: 'Thủ Kho',
  organizationId: 'ORG-001',
  createdAt: '2026-08-12T14:00:00Z',
  updatedAt: '2026-08-12T14:00:00Z',
};

const orderItemPartial: OrderItem = {
  ...orderItemA,
  receivedQuantity: 30,
  status: 'in_transit',
  inboundReceipts: [
    {
      id: 'REC-001',
      receiptNumber: stockIn1.voucherNumber,
      date: stockIn1.date,
      quantity: 30,
      warehouseLocation: stockIn1.warehouseLocation,
      receiverName: 'Thủ Kho',
    },
  ],
};

const status4 = getItemLogisticsStatus(contractA.id, contractA.contractNumber, contractA.contractDate, itemLED, [], [orderItemPartial], [po1], [stockIn1], []);
assert(status4.status === 'PARTIAL_IN_STOCK', 'Stage 4: Status is PARTIAL_IN_STOCK');
assert(status4.receivedQuantity === 30, 'Stage 4: Received quantity is 30');
assert(status4.firstReceivedDate === '2026-08-12', 'Stage 4: First received date recorded');

// Stage 5: Full Inbound Stock In (PNK receives remaining 20 units)
const stockIn2: StockInVoucher = {
  id: 'PNK-002',
  voucherNumber: 'PNK-20260815-0002',
  purchaseOrderId: po1.id,
  purchaseOrderNumber: po1.poNumber,
  date: '2026-08-15',
  supplierName: po1.supplierName,
  warehouseLocation: 'Kho Tổng TP.HCM',
  status: 'CONFIRMED',
  items: [
    {
      sku: itemLED.sku,
      productName: itemLED.name,
      unit: itemLED.unit,
      expectedQuantity: 40,
      actualQuantity: 20,
    },
  ],
  totalQuantity: 20,
  createdById: 'USER-001',
  createdByName: 'Thủ Kho',
  organizationId: 'ORG-001',
  createdAt: '2026-08-15T15:00:00Z',
  updatedAt: '2026-08-15T15:00:00Z',
};

const orderItemFullInbound: OrderItem = {
  ...orderItemPartial,
  receivedQuantity: 50,
  status: 'in_stock',
  inboundReceipts: [
    ...orderItemPartial.inboundReceipts!,
    {
      id: 'REC-002',
      receiptNumber: stockIn2.voucherNumber,
      date: stockIn2.date,
      quantity: 20,
      warehouseLocation: stockIn2.warehouseLocation,
      receiverName: 'Thủ Kho',
    },
  ],
};

const status5 = getItemLogisticsStatus(contractA.id, contractA.contractNumber, contractA.contractDate, itemLED, [], [orderItemFullInbound], [po1], [stockIn1, stockIn2], []);
assert(status5.status === 'IN_STOCK', 'Stage 5: Status is IN_STOCK');
assert(status5.receivedQuantity === 50, 'Stage 5: Full 50 units in stock');
assert(status5.fullyReceivedDate === '2026-08-15', 'Stage 5: Fully received date is 2026-08-15');

// Stage 6: Partial Dispatch (PXK ships 25 units)
const stockOut1: StockOutVoucher = {
  id: 'PXK-001',
  voucherNumber: 'PXK-20260818-0001',
  contractId: contractA.id,
  contractNumber: contractA.contractNumber,
  customerId: custA.id,
  customerName: custA.name,
  date: '2026-08-18',
  warehouseLocation: 'Kho Tổng TP.HCM',
  receiverName: 'Anh Long (Chỉ huy trưởng)',
  receiverPhone: '0912345678',
  status: 'CONFIRMED',
  items: [
    {
      id: 'OUT-ITEM-001',
      sku: itemLED.sku,
      productName: itemLED.name,
      unit: itemLED.unit,
      sourceType: 'ORDER',
      orderItemId: orderItemA.id,
      quantity: 25,
    },
  ],
  totalQuantity: 25,
  createdById: 'USER-001',
  createdByName: 'Thủ Kho',
  organizationId: 'ORG-001',
  createdAt: '2026-08-18T10:00:00Z',
  updatedAt: '2026-08-18T10:00:00Z',
};

const orderItemPartialDispatched: OrderItem = {
  ...orderItemFullInbound,
  dispatchedQuantity: 25,
};

const status6 = getItemLogisticsStatus(contractA.id, contractA.contractNumber, contractA.contractDate, itemLED, [], [orderItemPartialDispatched], [po1], [stockIn1, stockIn2], [stockOut1]);
assert(status6.status === 'PARTIAL_DELIVERED', 'Stage 6: Status is PARTIAL_DELIVERED');
assert(status6.deliveredQuantity === 25, 'Stage 6: Delivered quantity is 25/50');
assert(status6.firstDeliveredDate === '2026-08-18', 'Stage 6: First delivered date is 2026-08-18');

// Stage 7: Full Delivery (PXK ships remaining 25 units)
const stockOut2: StockOutVoucher = {
  id: 'PXK-002',
  voucherNumber: 'PXK-20260822-0002',
  contractId: contractA.id,
  contractNumber: contractA.contractNumber,
  customerId: custA.id,
  customerName: custA.name,
  date: '2026-08-22',
  warehouseLocation: 'Kho Tổng TP.HCM',
  receiverName: 'Anh Long (Chỉ huy trưởng)',
  receiverPhone: '0912345678',
  status: 'CONFIRMED',
  items: [
    {
      id: 'OUT-ITEM-002',
      sku: itemLED.sku,
      productName: itemLED.name,
      unit: itemLED.unit,
      sourceType: 'ORDER',
      orderItemId: orderItemA.id,
      quantity: 25,
    },
  ],
  totalQuantity: 25,
  createdById: 'USER-001',
  createdByName: 'Thủ Kho',
  organizationId: 'ORG-001',
  createdAt: '2026-08-22T11:00:00Z',
  updatedAt: '2026-08-22T11:00:00Z',
};

const orderItemFullDispatched: OrderItem = {
  ...orderItemFullInbound,
  dispatchedQuantity: 50,
  status: 'delivered',
};

const status7 = getItemLogisticsStatus(contractA.id, contractA.contractNumber, contractA.contractDate, itemLED, [], [orderItemFullDispatched], [po1], [stockIn1, stockIn2], [stockOut1, stockOut2]);
assert(status7.status === 'DELIVERED', 'Stage 7: Status is DELIVERED');
assert(status7.deliveredQuantity === 50, 'Stage 7: Delivered quantity is 50/50');
assert(status7.progressPercent === 100, 'Stage 7: Progress is 100%');
assert(status7.fullyDeliveredDate === '2026-08-22', 'Stage 7: Fully delivered date is 2026-08-22');

// -------------------------------------------------------------
// TEST CASE 2: Multiple Customers Sharing Same SKU Isolation
// -------------------------------------------------------------
const custB: Customer = {
  id: 'CUST-002',
  code: 'KH-002',
  name: 'Tập đoàn Hòa Bình',
  phone: '0988888888',
  email: 'hoabinh@example.com',
  stage: 'contract_signed',
  organizationId: 'ORG-001',
  assignedToId: 'USER-003',
  assignedToName: 'Trần Văn C (Sales)',
  expectedValue: 300000000,
  createdBy: 'USER-001',
  createdAt: '2026-08-02T08:00:00Z',
  updatedAt: '2026-08-02T08:00:00Z',
};

const itemLED_CustB: QuoteProductRow = {
  ...itemLED,
  id: 'ROW-LED-002',
  quantity: 80,
};

const contractB: Contract = {
  id: 'CTR-002',
  contractNumber: 'HĐKT-2026-002',
  quotationId: 'Q-002',
  quoteNumber: 'BG-2026-002',
  customerId: custB.id,
  customerName: custB.name,
  salesRepId: custB.assignedToId,
  salesRepName: custB.assignedToName,
  contractDate: '2026-08-06',
  deliveryDate: '2026-08-30',
  deliveryAddress: 'Hòa Bình Center',
  items: [itemLED_CustB],
  totalValue: 17600000,
  milestones: [],
  status: 'signed',
  createdAt: '2026-08-06T10:00:00Z',
};

const multiPo: PurchaseOrder = {
  id: 'PO-MULTI',
  poNumber: 'PO-20260808-9999',
  orderDate: '2026-08-08',
  supplierId: 'SUPP-001',
  supplierName: 'Philips Lighting VN',
  expectedDeliveryDate: '2026-08-20',
  warehouseLocation: 'Kho Tổng TP.HCM',
  status: 'ORDERED',
  items: [
    {
      sku: itemLED.sku,
      productName: itemLED.name,
      unit: itemLED.unit,
      salesRequiredQuantity: 130, // 50 for A + 80 for B
      warehouseExtraQuantity: 20,
      supplierOrderQuantity: 150,
      unitPrice: 150000,
      totalAmount: 22500000,
      salesDemands: [
        {
          orderItemId: 'ORDER-A',
          contractId: contractA.id,
          customerId: custA.id,
          requiredQuantity: 50,
          customerName: custA.name,
          contractNumber: contractA.contractNumber,
          salesRepName: custA.assignedToName,
          requiredDate: '2026-08-25',
        },
        {
          orderItemId: 'ORDER-B',
          contractId: contractB.id,
          customerId: custB.id,
          requiredQuantity: 80,
          customerName: custB.name,
          contractNumber: contractB.contractNumber,
          salesRepName: custB.assignedToName,
          requiredDate: '2026-08-30',
        },
      ],
    },
  ],
  totalQuantity: 150,
  totalAmount: 22500000,
  createdById: 'USER-001',
  createdByName: 'Kho Trưởng',
  organizationId: 'ORG-001',
  createdAt: '2026-08-08T10:00:00Z',
  updatedAt: '2026-08-08T10:00:00Z',
};

const itemsCustA = getCustomer360Items(custA.id, [contractA, contractB], [], [], [], [multiPo], [], []);
const itemsCustB = getCustomer360Items(custB.id, [contractA, contractB], [], [], [], [multiPo], [], []);

assert(itemsCustA.length === 1 && itemsCustA[0].contractQuantity === 50, 'Multi-customer: Customer A gets exactly 50 units');
assert(itemsCustA[0].logistics.supplierOrderedQuantity === 50, 'Multi-customer: Customer A PO demand is 50');
assert(itemsCustB.length === 1 && itemsCustB[0].contractQuantity === 80, 'Multi-customer: Customer B gets exactly 80 units');
assert(itemsCustB[0].logistics.supplierOrderedQuantity === 80, 'Multi-customer: Customer B PO demand is 80');

// -------------------------------------------------------------
// TEST CASE 3: Direct Stock Reservation Flow
// -------------------------------------------------------------
const itemCable: QuoteProductRow = {
  id: 'ROW-CABLE',
  sku: 'CADIVI-CV-2.5',
  name: 'Dây điện đơn Cadivi CV 2.5mm2',
  category: 'Dây Cáp Điện',
  brand: 'Cadivi',
  color: 'Đỏ',
  size: '2.5mm2',
  unit: 'Cuộn',
  listPrice: 650000,
  dpPrice: 520000,
  quotedPrice: 580000,
  quantity: 20,
  discountPercent: 0,
  totalAmount: 11600000,
  inventoryAvailable: 100,
  isBelowDP: false,
};

const contractC: Contract = {
  id: 'CTR-003',
  contractNumber: 'HĐKT-2026-003',
  quotationId: 'Q-003',
  quoteNumber: 'BG-2026-003',
  customerId: custA.id,
  customerName: custA.name,
  salesRepId: custA.assignedToId,
  salesRepName: custA.assignedToName,
  contractDate: '2026-08-10',
  deliveryDate: '2026-08-15',
  deliveryAddress: 'Kho Nam Á',
  items: [itemCable],
  totalValue: 11600000,
  milestones: [],
  status: 'signed',
  createdAt: '2026-08-10T09:00:00Z',
};

const reserveItemC: ReserveItem = {
  id: 'RES-001',
  contractId: contractC.id,
  contractNumber: contractC.contractNumber,
  quoteNumber: contractC.quoteNumber,
  customerId: custA.id,
  customerName: custA.name,
  salesRepName: custA.assignedToName,
  sku: itemCable.sku,
  productName: itemCable.name,
  unit: itemCable.unit,
  reservedQuantity: 20,
  dispatchedQuantity: 0,
  warehouseLocation: 'Kho Tổng TP.HCM',
  reservedDate: '2026-08-10',
  status: 'holding',
  expectedDeliveryDate: '2026-08-15',
};

const statusReserve = getItemLogisticsStatus(contractC.id, contractC.contractNumber, contractC.contractDate, itemCable, [reserveItemC], [], [], [], []);
assert(statusReserve.status === 'RESERVED', 'Direct Reserve: Status is RESERVED');
assert(statusReserve.reservedQuantity === 20, 'Direct Reserve: Reserved quantity is 20');
assert(statusReserve.receivedQuantity === 20, 'Direct Reserve: Items already in stock (receivedQuantity === 20)');

// -------------------------------------------------------------
// TEST CASE 4: Customer 360 Summary Aggregation
// -------------------------------------------------------------
const allItemsCustA = getCustomer360Items(
  custA.id,
  [contractA, contractC],
  [],
  [reserveItemC],
  [orderItemFullInbound],
  [po1],
  [stockIn1, stockIn2],
  []
);

const summaryA = getCustomer360Summary(custA, [contractA, contractC], [], allItemsCustA);

assert(summaryA.totalContractValue === contractA.totalValue + contractC.totalValue, 'Summary: Total contract value is accurate');
assert(summaryA.totalContractsCount === 2, 'Summary: Total contracts count is 2');
assert(summaryA.totalContractQuantity === 70, 'Summary: Total contract quantity is 50 + 20 = 70');
assert(summaryA.totalReceivedQuantity === 70, 'Summary: Total received quantity is 50 + 20 = 70');

console.log('\n================================================================');
console.log(`📊 FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
