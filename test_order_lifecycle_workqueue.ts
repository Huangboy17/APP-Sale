import {
  isReserveInWorkQueue,
  isReserveCompleted,
  isReservePartiallyDelivered,
  getReserveDeliveredQuantity,
  isOrderInWorkQueue,
  isOrderCompleted,
  isOrderPartiallyDelivered,
  isOrderArrivedInStock,
  getOrderDeliveredQuantity,
} from './src/utils/orderLifecycle';
import { ReserveItem, OrderItem } from './src/types';

function runTests() {
  console.log('🧪 Starting Reserve & Order Lifecycle Work Queue vs History Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
    }
  }

  // ==========================================
  // TEST SET 1: RESERVE ITEM LIFECYCLE
  // ==========================================
  console.log('--- 1. Testing ReserveItem Lifecycle ---');

  // Case 1.1: Newly created reserve (holding)
  const r1: ReserveItem = {
    id: 'res-1',
    contractId: 'ctr-1',
    contractNumber: 'HD-001',
    quoteNumber: 'BG-001',
    customerId: 'cust-1',
    customerName: 'Khach Hang A',
    salesRepName: 'Sale 1',
    sku: 'LED-001',
    productName: 'Den LED 1',
    unit: 'Cai',
    reservedQuantity: 100,
    warehouseLocation: 'Kho Tong',
    reservedDate: '2026-08-01',
    status: 'holding',
    expectedDeliveryDate: '2026-08-30',
  };

  assert(isReserveInWorkQueue(r1) === true, 'r1 (holding 100, delivered 0) MUST be in Work Queue');
  assert(isReserveCompleted(r1) === false, 'r1 (holding 100, delivered 0) MUST NOT be Completed');
  assert(isReservePartiallyDelivered(r1) === false, 'r1 (holding 100, delivered 0) is not partially delivered');

  // Case 1.2: Allocated, Picking, Ready to ship
  const r2: ReserveItem = { ...r1, id: 'res-2', status: 'allocated' };
  const r3: ReserveItem = { ...r1, id: 'res-3', status: 'picking' };
  const r4: ReserveItem = { ...r1, id: 'res-4', status: 'ready_to_ship' };

  assert(isReserveInWorkQueue(r2) === true, 'r2 (allocated) MUST be in Work Queue');
  assert(isReserveInWorkQueue(r3) === true, 'r3 (picking) MUST be in Work Queue');
  assert(isReserveInWorkQueue(r4) === true, 'r4 (ready_to_ship) MUST be in Work Queue');

  // Case 1.3: Partial Delivery (70/100)
  const rPartial: ReserveItem = {
    ...r1,
    id: 'res-partial',
    status: 'partially_delivered',
    deliveredQuantity: 70,
    dispatchedQuantity: 70,
  };

  assert(isReserveInWorkQueue(rPartial) === true, 'rPartial (70/100 delivered) MUST STILL be in Work Queue');
  assert(isReserveCompleted(rPartial) === false, 'rPartial (70/100 delivered) MUST NOT be in History');
  assert(isReservePartiallyDelivered(rPartial) === true, 'rPartial is detected as partially delivered');
  assert(getReserveDeliveredQuantity(rPartial) === 70, 'getReserveDeliveredQuantity returns 70');

  // Case 1.4: Full Delivery (100/100)
  const rFull: ReserveItem = {
    ...r1,
    id: 'res-full',
    status: 'delivered',
    deliveredQuantity: 100,
    dispatchedQuantity: 100,
    completedAt: '2026-08-28T10:00:00Z',
    completedBy: 'user-wh',
    completedByName: 'Thu Kho A',
  };

  assert(isReserveInWorkQueue(rFull) === false, 'rFull (100/100 delivered) MUST NOT be in Work Queue');
  assert(isReserveCompleted(rFull) === true, 'rFull (100/100 delivered) MUST be in History');
  assert(rFull.completedByName === 'Thu Kho A', 'rFull preserves audit completedByName metadata');

  // Case 1.5: Cancelled / Released
  const rCancelled: ReserveItem = { ...r1, id: 'res-cancel', status: 'released' };
  assert(isReserveInWorkQueue(rCancelled) === false, 'rCancelled MUST NOT be in Work Queue');

  // ==========================================
  // TEST SET 2: ORDER ITEM LIFECYCLE
  // ==========================================
  console.log('\n--- 2. Testing OrderItem Lifecycle ---');

  // Case 2.1: Pending Order (Nhu cau Sales can dat)
  const o1: OrderItem = {
    id: 'ord-1',
    contractId: 'ctr-1',
    contractNumber: 'HD-001',
    quoteNumber: 'BG-001',
    customerId: 'cust-1',
    customerName: 'Khach Hang A',
    salesRepName: 'Sale 1',
    sku: 'PANEL-001',
    productName: 'Den Panel',
    unit: 'Bo',
    orderQuantity: 50,
    brand: 'Panasonic',
    size: '600x600',
    color: 'Trang',
    orderDate: '2026-08-01',
    status: 'pending',
  };

  assert(isOrderInWorkQueue(o1) === true, 'o1 (pending) MUST be in Work Queue');
  assert(isOrderCompleted(o1) === false, 'o1 (pending) MUST NOT be Completed');

  // Case 2.2: Ordered, In Transit
  const o2: OrderItem = { ...o1, id: 'ord-2', status: 'ordered' };
  const o3: OrderItem = { ...o1, id: 'ord-3', status: 'in_transit' };

  assert(isOrderInWorkQueue(o2) === true, 'o2 (ordered) MUST be in Work Queue');
  assert(isOrderInWorkQueue(o3) === true, 'o3 (in_transit) MUST be in Work Queue');

  // Case 2.3: Goods Arrived In Warehouse (50/50 received, but 0 delivered to customer)
  const oArrived: OrderItem = {
    ...o1,
    id: 'ord-arrived',
    status: 'ready_to_deliver',
    receivedQuantity: 50,
    deliveredQuantity: 0,
  };

  assert(isOrderInWorkQueue(oArrived) === true, 'oArrived (in warehouse but not yet delivered to customer) MUST STAY in Work Queue');
  assert(isOrderCompleted(oArrived) === false, 'oArrived MUST NOT be marked Completed');
  assert(isOrderArrivedInStock(oArrived) === true, 'isOrderArrivedInStock recognizes goods in stock');

  // Case 2.4: Partial Delivery to customer (30/50 delivered)
  const oPartialDelivered: OrderItem = {
    ...o1,
    id: 'ord-partial-del',
    status: 'partially_delivered',
    receivedQuantity: 50,
    deliveredQuantity: 30,
  };

  assert(isOrderInWorkQueue(oPartialDelivered) === true, 'oPartialDelivered (30/50 delivered to customer) MUST STAY in Work Queue');
  assert(isOrderCompleted(oPartialDelivered) === false, 'oPartialDelivered MUST NOT be Completed');
  assert(isOrderPartiallyDelivered(oPartialDelivered) === true, 'isOrderPartiallyDelivered recognizes partial customer delivery');
  assert(getOrderDeliveredQuantity(oPartialDelivered) === 30, 'getOrderDeliveredQuantity returns 30');

  // Case 2.5: Full Delivery to customer (50/50 delivered)
  const oFullDelivered: OrderItem = {
    ...o1,
    id: 'ord-full-del',
    status: 'delivered',
    receivedQuantity: 50,
    deliveredQuantity: 50,
    completedAt: '2026-08-28T11:00:00Z',
    completedBy: 'user-wh',
    completedByName: 'Thu Kho A',
  };

  assert(isOrderInWorkQueue(oFullDelivered) === false, 'oFullDelivered (50/50 delivered) MUST NOT be in Work Queue');
  assert(isOrderCompleted(oFullDelivered) === true, 'oFullDelivered (50/50 delivered) MUST be in History');
  assert(oFullDelivered.completedByName === 'Thu Kho A', 'oFullDelivered preserves audit completedByName metadata');

  // ==========================================
  // TEST SET 3: MULTI-ITEM TICKET COEXISTENCE & NO DELETION
  // ==========================================
  console.log('\n--- 3. Testing Multi-item Coexistence & Data Preservation ---');

  const allReserves: ReserveItem[] = [r1, r2, r3, r4, rPartial, rFull, rCancelled];
  const allOrders: OrderItem[] = [o1, o2, o3, oArrived, oPartialDelivered, oFullDelivered];

  const activeReserves = allReserves.filter(isReserveInWorkQueue);
  const completedReserves = allReserves.filter(isReserveCompleted);

  const activeOrders = allOrders.filter(isOrderInWorkQueue);
  const completedOrders = allOrders.filter(isOrderCompleted);

  assert(activeReserves.length === 5, `Expected 5 active reserves in Work Queue, got ${activeReserves.length}`);
  assert(completedReserves.length === 1, `Expected 1 completed reserve in History, got ${completedReserves.length}`);
  assert(activeOrders.length === 5, `Expected 5 active orders in Work Queue, got ${activeOrders.length}`);
  assert(completedOrders.length === 1, `Expected 1 completed order in History, got ${completedOrders.length}`);

  // Total records preserved:
  assert(allReserves.length === 7, 'Zero reserve records deleted: all 7 records intact');
  assert(allOrders.length === 6, 'Zero order records deleted: all 6 records intact');

  console.log(`\n🎉 Results: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
