import { ReserveItem, OrderItem, ReserveItemStatus, OrderItemStatus } from '../types';

// =============================================================================
// RESERVE ITEM (GIỮ HÀNG) LIFECYCLE HELPERS
// =============================================================================

/**
 * Statuses representing active work in the Reserve queue.
 */
export const ACTIVE_RESERVE_STATUSES: ReserveItemStatus[] = [
  'active',
  'holding',
  'allocated',
  'picking',
  'ready_to_ship',
  'shipped',
  'partially_delivered',
];

/**
 * Statuses representing completed work in Reserve.
 */
export const COMPLETED_RESERVE_STATUSES: ReserveItemStatus[] = [
  'delivered',
];

/**
 * Gets total delivered quantity for a ReserveItem safely.
 */
export function getReserveDeliveredQuantity(r: ReserveItem): number {
  if (r.deliveredQuantity !== undefined) return Number(r.deliveredQuantity) || 0;
  if (r.dispatchedQuantity !== undefined) return Number(r.dispatchedQuantity) || 0;
  if (r.status === 'delivered') return Number(r.reservedQuantity) || 0;
  return 0;
}

/**
 * Checks if a ReserveItem is still in the active Work Queue.
 * An item is in the Work Queue if:
 * 1. It is not cancelled/released
 * 2. It has not been fully delivered (deliveredQty < reservedQty)
 * 3. Its status is not 'delivered'
 */
export function isReserveInWorkQueue(r: ReserveItem): boolean {
  if (r.status === 'released' || r.status === 'cancelled') return false;
  const delivered = getReserveDeliveredQuantity(r);
  const reserved = Number(r.reservedQuantity) || 0;
  
  if (reserved === 0) return false;
  if (r.status === 'delivered' && delivered >= reserved) return false;
  return delivered < reserved;
}

/**
 * Checks if a ReserveItem is fully completed (eligible for History).
 */
export function isReserveCompleted(r: ReserveItem): boolean {
  if (r.status === 'released' || r.status === 'cancelled') return false;
  const delivered = getReserveDeliveredQuantity(r);
  const reserved = Number(r.reservedQuantity) || 0;
  
  if (reserved > 0 && delivered >= reserved) return true;
  return r.status === 'delivered';
}

/**
 * Checks if a ReserveItem is partially delivered (Giao một phần).
 */
export function isReservePartiallyDelivered(r: ReserveItem): boolean {
  if (r.status === 'released' || r.status === 'cancelled') return false;
  const delivered = getReserveDeliveredQuantity(r);
  const reserved = Number(r.reservedQuantity) || 0;
  return delivered > 0 && delivered < reserved;
}

// =============================================================================
// ORDER ITEM (ĐẶT HÀNG NCC) LIFECYCLE HELPERS
// =============================================================================

/**
 * Statuses representing active work in the Order queue (from pending to waiting delivery to partial delivery).
 */
export const ACTIVE_ORDER_STATUSES: OrderItemStatus[] = [
  'pending',
  'pending_order',
  'ordered',
  'in_transit',
  'arrived',
  'partial',
  'received',
  'arrived_in_stock',
  'ready_to_deliver',
  'partially_delivered',
];

/**
 * Statuses representing completed work in Orders.
 */
export const COMPLETED_ORDER_STATUSES: OrderItemStatus[] = [
  'delivered',
];

/**
 * Gets total delivered quantity for an OrderItem safely.
 */
export function getOrderDeliveredQuantity(o: OrderItem): number {
  if (o.deliveredQuantity !== undefined) return Number(o.deliveredQuantity) || 0;
  if (o.dispatchedQuantity !== undefined) return Number(o.dispatchedQuantity) || 0;
  if (o.status === 'delivered') return Number(o.orderQuantity) || 0;
  return 0;
}

/**
 * Checks if an OrderItem is still in the active Work Queue.
 * An item is in the Work Queue if:
 * 1. It is not cancelled
 * 2. It has not been fully delivered to customer (deliveredQty < orderQty)
 * Note: Even if goods arrived at warehouse (received/ready_to_deliver), it remains in Work Queue until delivered!
 */
export function isOrderInWorkQueue(o: OrderItem): boolean {
  if (o.status === 'cancelled') return false;
  const delivered = getOrderDeliveredQuantity(o);
  const orderQty = Number(o.orderQuantity) || 0;
  
  if (orderQty === 0) return false;
  if (o.status === 'delivered' && delivered >= orderQty) return false;
  return delivered < orderQty;
}

/**
 * Checks if an OrderItem is fully completed (eligible for History).
 */
export function isOrderCompleted(o: OrderItem): boolean {
  if (o.status === 'cancelled') return false;
  const delivered = getOrderDeliveredQuantity(o);
  const orderQty = Number(o.orderQuantity) || 0;
  
  if (orderQty > 0 && delivered >= orderQty) return true;
  return o.status === 'delivered';
}

/**
 * Checks if an OrderItem is partially delivered to customer.
 */
export function isOrderPartiallyDelivered(o: OrderItem): boolean {
  if (o.status === 'cancelled') return false;
  const delivered = getOrderDeliveredQuantity(o);
  const orderQty = Number(o.orderQuantity) || 0;
  return delivered > 0 && delivered < orderQty;
}

/**
 * Checks if goods have arrived at warehouse but are waiting to be delivered to customer.
 */
export function isOrderArrivedInStock(o: OrderItem): boolean {
  if (o.status === 'cancelled') return false;
  const received = Number(o.receivedQuantity) || 0;
  const orderQty = Number(o.orderQuantity) || 0;
  const delivered = getOrderDeliveredQuantity(o);
  
  return received >= orderQty && delivered < orderQty;
}
