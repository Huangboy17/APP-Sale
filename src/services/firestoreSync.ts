import {
  db,
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  deleteDoc,
  onSnapshot,
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

// Seed initial demo data to Firestore ONLY IF necessary, avoiding repeated write storms
export async function seedInitialDataIfEmpty() {
  const seedKey = 'salesflow_cloud_seed_completed_v3';
  if (localStorage.getItem(seedKey) === 'true') {
    return;
  }

  try {
    const custSnapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    if (!custSnapshot.empty) {
      localStorage.setItem(seedKey, 'true');
      return; // Cloud already has live data
    }

    // Only seed minimal initial demo users and company info in a single batch
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

// Product Actions (Scoped by companyId so different C1 companies never collide)
export function getProductDocId(product: ProductPriceItem): string {
  if (product.companyId) {
    return `${product.companyId}_${product.sku}`;
  }
  return product.sku;
}

export function getInventoryDocId(item: InventoryItem): string {
  if (item.companyId) {
    return `${item.companyId}_${item.sku}`;
  }
  return item.sku;
}

export async function syncProductToCloud(product: ProductPriceItem) {
  try {
    const docId = getProductDocId(product);
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, docId), cleanForFirestore(product), { merge: true });
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
        const docId = getProductDocId(p);
        batch.set(doc(db, COLLECTIONS.PRODUCTS, docId), cleanForFirestore(p), { merge: true });
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
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, `${companyId}_${sku}`));
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
      if (data.companyId === companyId || d.id.startsWith(`${companyId}_`)) {
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

// Inventory Actions (Scoped by companyId)
export async function syncInventoryItemToCloud(item: InventoryItem) {
  try {
    const docId = getInventoryDocId(item);
    await setDoc(doc(db, COLLECTIONS.INVENTORY, docId), cleanForFirestore(item), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save inventory item');
  }
}

export async function batchSyncInventoryToCloud(inventoryItems: InventoryItem[]) {
  try {
    const batch = writeBatch(db);
    inventoryItems.forEach((i) => {
      const docId = getInventoryDocId(i);
      batch.set(doc(db, COLLECTIONS.INVENTORY, docId), cleanForFirestore(i), { merge: true });
    });
    await batch.commit();
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

// Contract Actions
export async function syncContractToCloud(contract: Contract) {
  try {
    await setDoc(doc(db, COLLECTIONS.CONTRACTS, contract.id), cleanForFirestore(contract), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save contract');
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

export async function syncOrderItemToCloud(order: OrderItem) {
  try {
    await setDoc(doc(db, COLLECTIONS.ORDERS, order.id), cleanForFirestore(order), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'Save order item');
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

// Clear a specific collection completely from Firestore
export async function clearCollectionFromCloud(collectionName: string, exceptIds: string[] = []) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    let count = 0;
    snapshot.docs.forEach((d) => {
      if (!exceptIds.includes(d.id)) {
        batch.delete(d.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, `Clear collection ${collectionName}`);
  }
}

// Clear all data from Google Cloud Firestore
export async function clearAllDataFromCloud(keepSuperAdmin = true) {
  try {
    const superAdminId = 'user-super-admin';
    const collectionsToClear = [
      COLLECTIONS.CUSTOMERS,
      COLLECTIONS.PRODUCTS,
      COLLECTIONS.INVENTORY,
      COLLECTIONS.QUOTATIONS,
      COLLECTIONS.CONTRACTS,
      COLLECTIONS.RESERVES,
      COLLECTIONS.ORDERS,
      COLLECTIONS.ORGANIZATIONS,
      COLLECTIONS.CUSTOMER_MEMBERS,
    ];

    for (const colName of collectionsToClear) {
      await clearCollectionFromCloud(colName);
    }

    // Clear Users (keep Super Admin if requested)
    await clearCollectionFromCloud(COLLECTIONS.USERS, keepSuperAdmin ? [superAdminId] : []);
  } catch (err) {
    handleFirestoreError(err, 'Clear all data');
  }
}
