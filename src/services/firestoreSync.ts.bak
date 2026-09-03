import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from '../lib/firebase';
import {
  User,
  CompanyInfo,
  Customer,
  ProductPriceItem,
  InventoryItem,
  Quotation,
  Contract,
  ReserveItem,
  OrderItem,
  Organization,
  StockTransaction,
  StockInVoucher,
  StockOutVoucher,
  StockAuditVoucher,
  PurchaseOrder,
  ContractTemplate,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_COMPANY_INFO,
  INITIAL_PRODUCTS,
  INITIAL_INVENTORY,
  INITIAL_CUSTOMERS,
  INITIAL_QUOTATIONS,
  INITIAL_CONTRACTS,
  INITIAL_RESERVE_ITEMS,
  INITIAL_ORDER_ITEMS,
} from '../data/initialData';
import { INITIAL_CONTRACT_TEMPLATES } from './contractTemplateService';

export const COLLECTIONS = {
  USERS: 'users',
  COMPANY: 'companyInfo',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  QUOTATIONS: 'quotations',
  CONTRACTS: 'contracts',
  RESERVES: 'reserveItems',
  ORDERS: 'orderItems',
  ORGANIZATIONS: 'organizations',
  CUSTOMER_MEMBERS: 'customerMembers',
  STOCK_TRANSACTIONS: 'stockTransactions',
  STOCK_IN_VOUCHERS: 'stockInVouchers',
  STOCK_OUT_VOUCHERS: 'stockOutVouchers',
  STOCK_AUDIT_VOUCHERS: 'stockAuditVouchers',
  PURCHASE_ORDERS: 'purchaseOrders',
  CONTRACT_TEMPLATES: 'contractTemplates',
};

// Quota state and notification callback
let isQuotaExceededState = false;
let onQuotaExceededCallback: (() => void) | null = null;

export function setOnQuotaExceededListener(cb: () => void) {
  onQuotaExceededCallback = cb;
  if (isQuotaExceededState) {
    cb();
  }
}

export function getIsQuotaExceeded(): boolean {
  return isQuotaExceededState;
}

export function handleFirestoreError(err: unknown, actionName: string) {
  const errStr = String(err);
  const errorCode = (err as { code?: string })?.code;
  const isQuota =
    errorCode === 'resource-exhausted' ||
    errStr.includes('resource-exhausted') ||
    errStr.includes('Quota limit exceeded') ||
    errStr.includes('Free daily write units');

  if (isQuota) {
    if (!isQuotaExceededState) {
      isQuotaExceededState = true;
      console.warn('[Firestore] Google Cloud Firestore Free daily write quota reached. Local persistence active.');
    }
    if (onQuotaExceededCallback) {
      onQuotaExceededCallback();
    }
    return;
  }
  console.warn(`[Firestore] ${actionName} warning:`, err);
}

// Deep sanitize object to remove undefined values which cause Firestore setDoc/writeBatch to fail
export function cleanForFirestore<T>(data: T): Record<string, unknown> {
  if (data === null || data === undefined) {
    return {};
  }
  const serialized = JSON.stringify(data, (_, value) => {
    return value === undefined ? null : value;
  });
  return JSON.parse(serialized);
}

// Seed initial demo data to Firestore ONLY IF the database is 100% empty (Initial project bootstrap)
// Never overwrites existing accounts or business data
export async function seedInitialDataIfEmpty() {
  const seedKey = 'salesflow_cloud_seed_completed_v4';
  if (localStorage.getItem(seedKey) === 'true') {
    return;
  }

  try {
    // Check if USERS or CUSTOMERS already exist in Firestore
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    if (!usersSnapshot.empty) {
      localStorage.setItem(seedKey, 'true');
      return; // Cloud already has users/data — DO NOT OVERWRITE
    }

    // Only seed minimal initial demo users and system org if database is totally empty
    const batch = writeBatch(db);

    INITIAL_USERS.forEach((user) => {
      batch.set(doc(db, COLLECTIONS.USERS, user.id), cleanForFirestore(user), { merge: true });
    });

    // Seed default system organization
    batch.set(doc(db, COLLECTIONS.ORGANIZATIONS, 'org-system'), cleanForFirestore({
      id: 'org-system',
      ownerId: 'user-super-admin',
      ownerName: 'Bùi Viết Hoàng (Super Admin)',
      name: 'Quản trị hệ thống',
      createdAt: '2026-01-01',
    }), { merge: true });

    batch.set(doc(db, COLLECTIONS.COMPANY, INITIAL_COMPANY_INFO.id), cleanForFirestore(INITIAL_COMPANY_INFO), {
      merge: true,
    });

    INITIAL_CONTRACT_TEMPLATES.forEach((tmpl) => {
      batch.set(doc(db, COLLECTIONS.CONTRACT_TEMPLATES, tmpl.id), cleanForFirestore(tmpl), { merge: true });
    });

    await batch.commit();
    localStorage.setItem(seedKey, 'true');
  } catch (error) {
    handleFirestoreError(error, 'Seed initial data');
    // If quota is exhausted or seed fails, avoid repeating on every page load
    localStorage.setItem(seedKey, 'true');
  }
}

// User Actions
export async function syncUserToCloud(user: User) {
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), cleanForFirestore(user), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save user');
  }
}

export async function deleteUserFromCloud(userId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  } catch (err) {
    handleFirestoreError(err, 'Delete user');
  }
}

export async function fetchUserFromCloud(uidOrId?: string, email?: string): Promise<User | null> {
  try {
    if (uidOrId) {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uidOrId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
    }
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as User;
      }
    }
    return null;
  } catch (err) {
    console.warn('[Firestore] fetchUserFromCloud error:', err);
    return null;
  }
}

// Company Info Actions
export async function syncCompanyInfoToCloud(companyInfo: CompanyInfo) {
  try {
    const id = companyInfo.id || 'company-master';
    await setDoc(doc(db, COLLECTIONS.COMPANY, id), cleanForFirestore(companyInfo), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save company info');
  }
}

// Customer Actions
export async function syncCustomerToCloud(customer: Customer) {
  try {
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), cleanForFirestore(customer), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save customer');
  }
}

export async function deleteCustomerFromCloud(customerId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId));
  } catch (err) {
    handleFirestoreError(err, 'Delete customer');
  }
}

// Product Actions (Scoped by organizationId/companyId so different C1 companies never collide)
export function getProductDocId(product: ProductPriceItem): string {
  const scopeId = product.organizationId || product.companyId || 'global';
  const cleanSku = (product.sku || '').trim().toUpperCase().replace(/[/\\#?]/g, '_');
  return `${scopeId}_${cleanSku}`;
}

export function getInventoryDocId(item: InventoryItem): string {
  const scopeId = item.organizationId || item.companyId || 'global';
  const cleanSku = (item.sku || '').trim().toUpperCase().replace(/[/\\#?]/g, '_');
  return `${scopeId}_${cleanSku}`;
}

export async function syncProductToCloud(product: ProductPriceItem) {
  try {
    const orgId = product.organizationId || product.companyId || 'org-system';
    const stampedProduct: ProductPriceItem = {
      ...product,
      organizationId: orgId,
      companyId: orgId,
    };
    const docId = getProductDocId(stampedProduct);
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, docId), cleanForFirestore(stampedProduct), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save product');
  }
}

export async function batchSyncProductsToCloud(products: ProductPriceItem[]) {
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((p) => {
        const orgId = p.organizationId || p.companyId || 'org-system';
        const stampedProduct: ProductPriceItem = {
          ...p,
          organizationId: orgId,
          companyId: orgId,
        };
        const docId = getProductDocId(stampedProduct);
        batch.set(doc(db, COLLECTIONS.PRODUCTS, docId), cleanForFirestore(stampedProduct), { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, 'Batch save products');
  }
}

export async function deleteProductFromCloud(sku: string, companyId?: string) {
  try {
    if (companyId) {
      const cleanSku = sku.trim().toUpperCase().replace(/[/\\#?]/g, '_');
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, `${companyId}_${cleanSku}`));
    }
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, sku));
  } catch (err) {
    handleFirestoreError(err, 'Delete product');
  }
}

// Clear all products belonging to a specific company
export async function clearCompanyProductsFromCloud(companyId: string) {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    let count = 0;
    snapshot.docs.forEach((d) => {
      const data = d.data() as ProductPriceItem;
      if (data.organizationId === companyId || data.companyId === companyId || d.id.startsWith(`${companyId}_`)) {
        batch.delete(d.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, `Clear products for company ${companyId}`);
  }
}

// Inventory Actions (Scoped by organizationId/companyId)
export async function syncInventoryItemToCloud(item: InventoryItem) {
  try {
    const orgId = item.organizationId || item.companyId || 'org-system';
    const stampedItem: InventoryItem = {
      ...item,
      organizationId: orgId,
      companyId: orgId,
    };
    const docId = getInventoryDocId(stampedItem);
    await setDoc(doc(db, COLLECTIONS.INVENTORY, docId), cleanForFirestore(stampedItem), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save inventory item');
  }
}

export async function batchSyncInventoryToCloud(inventoryItems: InventoryItem[]) {
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < inventoryItems.length; i += CHUNK_SIZE) {
      const chunk = inventoryItems.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((iItem) => {
        const orgId = iItem.organizationId || iItem.companyId || 'org-system';
        const stampedItem: InventoryItem = {
          ...iItem,
          organizationId: orgId,
          companyId: orgId,
        };
        const docId = getInventoryDocId(stampedItem);
        batch.set(doc(db, COLLECTIONS.INVENTORY, docId), cleanForFirestore(stampedItem), { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, 'Batch save inventory');
  }
}

export async function deleteInventoryItemFromCloud(sku: string, companyId?: string) {
  try {
    if (companyId) {
      await deleteDoc(doc(db, COLLECTIONS.INVENTORY, `${companyId}_${sku}`));
    }
    await deleteDoc(doc(db, COLLECTIONS.INVENTORY, sku));
  } catch (err) {
    handleFirestoreError(err, 'Delete inventory item');
  }
}

// Clear all inventory items belonging to a specific company
export async function clearCompanyInventoryFromCloud(companyId: string) {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.INVENTORY));
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    let count = 0;
    snapshot.docs.forEach((d) => {
      const data = d.data() as InventoryItem;
      if (data.companyId === companyId || d.id.startsWith(`${companyId}_`)) {
        batch.delete(d.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, `Clear inventory for company ${companyId}`);
  }
}

// Quotation Actions
export async function syncQuotationToCloud(quote: Quotation) {
  try {
    await setDoc(doc(db, COLLECTIONS.QUOTATIONS, quote.id), cleanForFirestore(quote), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save quotation');
  }
}

export async function deleteQuotationFromCloud(quoteId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.QUOTATIONS, quoteId));
  } catch (err) {
    handleFirestoreError(err, 'Delete quotation');
  }
}

export async function batchDeleteQuotationsFromCloud(quoteIds: string[]) {
  if (!quoteIds || quoteIds.length === 0) return;
  try {
    const batch = writeBatch(db);
    quoteIds.forEach((id) => {
      batch.delete(doc(db, COLLECTIONS.QUOTATIONS, id));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, 'Batch delete quotations');
  }
}

// Contract Actions
export async function syncContractToCloud(contract: Contract) {
  try {
    await setDoc(doc(db, COLLECTIONS.CONTRACTS, contract.id), cleanForFirestore(contract), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save contract');
  }
}

export async function deleteContractFromCloud(contractId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CONTRACTS, contractId));
  } catch (err) {
    handleFirestoreError(err, 'Delete contract');
  }
}

export async function batchDeleteContractsFromCloud(contractIds: string[]) {
  if (!contractIds || contractIds.length === 0) return;
  try {
    const batch = writeBatch(db);
    contractIds.forEach((id) => {
      batch.delete(doc(db, COLLECTIONS.CONTRACTS, id));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, 'Batch delete contracts');
  }
}

// Logistics (Reserves & Orders) Actions
export async function syncReserveItemToCloud(reserve: ReserveItem) {
  try {
    await setDoc(doc(db, COLLECTIONS.RESERVES, reserve.id), cleanForFirestore(reserve), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save reserve item');
  }
}

export async function deleteReserveItemFromCloud(reserveId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.RESERVES, reserveId));
  } catch (err) {
    handleFirestoreError(err, 'Delete reserve item');
  }
}

export async function batchSyncReservesToCloud(reserves: ReserveItem[]) {
  try {
    const batch = writeBatch(db);
    reserves.forEach((r) => {
      batch.set(doc(db, COLLECTIONS.RESERVES, r.id), cleanForFirestore(r), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, 'Batch save reserves');
  }
}

export async function batchDeleteReservesFromCloud(reserveIds: string[]) {
  if (!reserveIds || reserveIds.length === 0) return;
  try {
    const batch = writeBatch(db);
    reserveIds.forEach((id) => {
      batch.delete(doc(db, COLLECTIONS.RESERVES, id));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, 'Batch delete reserves');
  }
}

export async function syncOrderItemToCloud(order: OrderItem) {
  try {
    await setDoc(doc(db, COLLECTIONS.ORDERS, order.id), cleanForFirestore(order), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save order item');
  }
}

export async function deleteOrderItemFromCloud(orderId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.ORDERS, orderId));
  } catch (err) {
    handleFirestoreError(err, 'Delete order item');
  }
}

export async function batchSyncOrdersToCloud(orders: OrderItem[]) {
  try {
    const batch = writeBatch(db);
    orders.forEach((o) => {
      batch.set(doc(db, COLLECTIONS.ORDERS, o.id), cleanForFirestore(o), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, 'Batch save orders');
  }
}

export async function batchDeleteOrdersFromCloud(orderIds: string[]) {
  if (!orderIds || orderIds.length === 0) return;
  try {
    const batch = writeBatch(db);
    orderIds.forEach((id) => {
      batch.delete(doc(db, COLLECTIONS.ORDERS, id));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, 'Batch delete orders');
  }
}

// Organization Actions
export async function syncOrganizationToCloud(org: Organization) {
  try {
    await setDoc(doc(db, COLLECTIONS.ORGANIZATIONS, org.id), cleanForFirestore(org), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save organization');
  }
}

export async function getOrganizationFromCloud(orgId: string): Promise<Organization | null> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.ORGANIZATIONS));
    const found = snapshot.docs.find(d => d.id === orgId);
    if (found) return found.data() as Organization;
    return null;
  } catch (err) {
    handleFirestoreError(err, 'Get organization');
    return null;
  }
}

// Stock Transaction & Ledger Actions
export async function syncStockTransactionToCloud(tx: StockTransaction) {
  try {
    await setDoc(doc(db, COLLECTIONS.STOCK_TRANSACTIONS, tx.id), cleanForFirestore(tx), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save stock transaction');
  }
}

export async function batchSyncStockTransactionsToCloud(transactions: StockTransaction[]) {
  if (!transactions || transactions.length === 0) return;
  try {
    const batch = writeBatch(db);
    transactions.forEach((tx) => {
      batch.set(doc(db, COLLECTIONS.STOCK_TRANSACTIONS, tx.id), cleanForFirestore(tx), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, 'Batch save stock transactions');
  }
}

// Stock In Voucher Actions
export async function syncStockInVoucherToCloud(voucher: StockInVoucher) {
  try {
    await setDoc(doc(db, COLLECTIONS.STOCK_IN_VOUCHERS, voucher.id), cleanForFirestore(voucher), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save stock in voucher');
  }
}

export async function deleteStockInVoucherFromCloud(voucherId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.STOCK_IN_VOUCHERS, voucherId));
  } catch (err) {
    handleFirestoreError(err, 'Delete stock in voucher');
  }
}

// Stock Out Voucher Actions
export async function syncStockOutVoucherToCloud(voucher: StockOutVoucher) {
  try {
    await setDoc(doc(db, COLLECTIONS.STOCK_OUT_VOUCHERS, voucher.id), cleanForFirestore(voucher), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save stock out voucher');
  }
}

export async function deleteStockOutVoucherFromCloud(voucherId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.STOCK_OUT_VOUCHERS, voucherId));
  } catch (err) {
    handleFirestoreError(err, 'Delete stock out voucher');
  }
}

// Stock Audit Voucher Actions
export async function syncStockAuditVoucherToCloud(voucher: StockAuditVoucher) {
  try {
    await setDoc(doc(db, COLLECTIONS.STOCK_AUDIT_VOUCHERS, voucher.id), cleanForFirestore(voucher), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save stock audit voucher');
  }
}

export async function deleteStockAuditVoucherFromCloud(voucherId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.STOCK_AUDIT_VOUCHERS, voucherId));
  } catch (err) {
    handleFirestoreError(err, 'Delete stock audit voucher');
  }
}

// Customer Member Actions (Permission management)
export async function syncCustomerMemberToCloud(member: { id: string; customerId: string; userId: string; userName: string; organizationId: string; createdBy: string; createdAt: string }) {
  try {
    await setDoc(doc(db, COLLECTIONS.CUSTOMER_MEMBERS, member.id), cleanForFirestore(member), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save customer member');
  }
}

export async function deleteCustomerMemberFromCloud(memberId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CUSTOMER_MEMBERS, memberId));
  } catch (err) {
    handleFirestoreError(err, 'Delete customer member');
  }
}

// Purchase Order Actions (Đơn đặt NCC)
export async function syncPurchaseOrderToCloud(po: PurchaseOrder) {
  try {
    await setDoc(doc(db, COLLECTIONS.PURCHASE_ORDERS, po.id), cleanForFirestore(po), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save purchase order');
  }
}

export async function deletePurchaseOrderFromCloud(poId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PURCHASE_ORDERS, poId));
  } catch (err) {
    handleFirestoreError(err, 'Delete purchase order');
  }
}

export async function batchSyncPurchaseOrdersToCloud(pos: PurchaseOrder[]) {
  if (!pos || pos.length === 0) return;
  try {
    const batch = writeBatch(db);
    pos.forEach((po) => {
      batch.set(doc(db, COLLECTIONS.PURCHASE_ORDERS, po.id), cleanForFirestore(po), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, 'Batch sync purchase orders');
  }
}

// Contract Template Actions
export async function syncContractTemplateToCloud(template: ContractTemplate) {
  try {
    await setDoc(doc(db, COLLECTIONS.CONTRACT_TEMPLATES, template.id), cleanForFirestore(template), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save contract template');
  }
}

export async function deleteContractTemplateFromCloud(templateId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CONTRACT_TEMPLATES, templateId));
  } catch (err) {
    handleFirestoreError(err, 'Delete contract template');
  }
}

export async function batchSyncContractTemplatesToCloud(templates: ContractTemplate[]) {
  if (!templates || templates.length === 0) return;
  try {
    const batch = writeBatch(db);
    templates.forEach((t) => {
      batch.set(doc(db, COLLECTIONS.CONTRACT_TEMPLATES, t.id), cleanForFirestore(t), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, 'Batch sync contract templates');
  }
}

export async function getCustomerMembersFromCloud(customerId: string): Promise<{ id: string; customerId: string; userId: string; userName: string; organizationId: string; createdBy: string; createdAt: string }[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMER_MEMBERS));
    const members: any[] = [];
    snapshot.forEach(d => {
      const data = d.data();
      if (data.customerId === customerId) members.push(data);
    });
    return members;
  } catch (err) {
    handleFirestoreError(err, 'Get customer members');
    return [];
  }
}

/**
 * Secure Helper: Delete documents from a Firestore collection belonging ONLY to a specific organization/tenant.
 * Security: Strictly enforces valid organizationId. Rejects missing/empty organizationId to prevent accidental whole-table wipes.
 * Protected: NEVER allows wiping USERS or ORGANIZATIONS collections.
 */
export async function clearTenantCollectionFromCloud(
  collectionName: string,
  organizationId: string,
  docIdPrefix?: string
): Promise<number> {
  if (!organizationId || typeof organizationId !== 'string' || organizationId.trim() === '') {
    console.error(`[CRITICAL SECURITY DENIAL] clearTenantCollectionFromCloud called without valid organizationId for collection: ${collectionName}`);
    throw new Error(`Không thể xoá dữ liệu ${collectionName} khi thiếu phạm vi tổ chức (organizationId).`);
  }

  const cleanOrgId = organizationId.trim();

  // Guard: NEVER allow clearing USERS or ORGANIZATIONS via this function
  if (collectionName === COLLECTIONS.USERS || collectionName === COLLECTIONS.ORGANIZATIONS) {
    console.error(`[CRITICAL SECURITY DENIAL] Attempted to clear protected account collection: ${collectionName}`);
    throw new Error(`Không được phép xoá dữ liệu tài khoản hệ thống.`);
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));
    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((d) => {
      const data = d.data();
      const itemOrg = data.organizationId || data.companyId;
      const isDocPrefixed = docIdPrefix ? d.id.startsWith(`${cleanOrgId}_`) : false;

      // Match ONLY documents belonging to this organization
      if (itemOrg === cleanOrgId || isDocPrefixed) {
        batch.delete(d.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`[Cloud Sync] Cleared ${count} items from ${collectionName} for tenant [${cleanOrgId}]`);
    }
    return count;
  } catch (err) {
    handleFirestoreError(err, `Clear tenant collection ${collectionName} for ${cleanOrgId}`);
    return 0;
  }
}

// Tenant-scoped deletion functions for each business entity
export async function clearTenantCustomersFromCloud(organizationId: string): Promise<number> {
  return clearTenantCollectionFromCloud(COLLECTIONS.CUSTOMERS, organizationId);
}

export async function clearTenantProductsFromCloud(organizationId: string): Promise<number> {
  return clearTenantCollectionFromCloud(COLLECTIONS.PRODUCTS, organizationId, organizationId);
}

export async function clearTenantInventoryFromCloud(organizationId: string): Promise<number> {
  return clearTenantCollectionFromCloud(COLLECTIONS.INVENTORY, organizationId, organizationId);
}

export async function clearTenantQuotationsFromCloud(organizationId: string): Promise<number> {
  return clearTenantCollectionFromCloud(COLLECTIONS.QUOTATIONS, organizationId);
}

export async function clearTenantContractsFromCloud(organizationId: string): Promise<number> {
  return clearTenantCollectionFromCloud(COLLECTIONS.CONTRACTS, organizationId);
}

export async function clearTenantReservesFromCloud(organizationId: string): Promise<number> {
  return clearTenantCollectionFromCloud(COLLECTIONS.RESERVES, organizationId);
}

export async function clearTenantOrdersFromCloud(organizationId: string): Promise<number> {
  return clearTenantCollectionFromCloud(COLLECTIONS.ORDERS, organizationId);
}

export async function clearTenantPurchaseOrdersFromCloud(organizationId: string): Promise<number> {
  return clearTenantCollectionFromCloud(COLLECTIONS.PURCHASE_ORDERS, organizationId);
}

export async function clearTenantStockVouchersFromCloud(organizationId: string): Promise<void> {
  await Promise.all([
    clearTenantCollectionFromCloud(COLLECTIONS.STOCK_TRANSACTIONS, organizationId),
    clearTenantCollectionFromCloud(COLLECTIONS.STOCK_IN_VOUCHERS, organizationId),
    clearTenantCollectionFromCloud(COLLECTIONS.STOCK_OUT_VOUCHERS, organizationId),
    clearTenantCollectionFromCloud(COLLECTIONS.STOCK_AUDIT_VOUCHERS, organizationId),
  ]);
}

/**
 * Clear all business data for a specific tenant.
 * IMPORTANT: Strictly preserves all user accounts and organization profiles.
 */
export async function clearTenantBusinessDataFromCloud(
  organizationId: string,
  options: {
    clearCustomers?: boolean;
    clearProducts?: boolean;
    clearInventory?: boolean;
    clearQuotesAndContracts?: boolean;
    clearReservesAndOrders?: boolean;
  }
): Promise<void> {
  if (!organizationId || typeof organizationId !== 'string' || organizationId.trim() === '') {
    throw new Error('Thiếu organizationId khi xoá dữ liệu tổ chức.');
  }

  const cleanOrgId = organizationId.trim();
  const tasks: Promise<unknown>[] = [];

  if (options.clearCustomers) {
    tasks.push(clearTenantCustomersFromCloud(cleanOrgId));
  }
  if (options.clearProducts) {
    tasks.push(clearTenantProductsFromCloud(cleanOrgId));
  }
  if (options.clearInventory) {
    tasks.push(clearTenantInventoryFromCloud(cleanOrgId));
  }
  if (options.clearQuotesAndContracts) {
    tasks.push(clearTenantQuotationsFromCloud(cleanOrgId));
    tasks.push(clearTenantContractsFromCloud(cleanOrgId));
  }
  if (options.clearReservesAndOrders) {
    tasks.push(clearTenantReservesFromCloud(cleanOrgId));
    tasks.push(clearTenantOrdersFromCloud(cleanOrgId));
    tasks.push(clearTenantStockVouchersFromCloud(cleanOrgId));
    tasks.push(clearTenantPurchaseOrdersFromCloud(cleanOrgId));
  }

  await Promise.all(tasks);
}
