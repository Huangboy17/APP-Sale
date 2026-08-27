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
};

// Seed initial demo data to Firestore if collection is empty
export async function seedInitialDataIfEmpty() {
  try {
    // Always guarantee Super Admin user is synchronized with buiviethoangktxd@gmail.com
    const superAdminUser = INITIAL_USERS[0];
    await setDoc(doc(db, COLLECTIONS.USERS, superAdminUser.id), superAdminUser, { merge: true });

    // Seed master company info
    const companyDoc = INITIAL_COMPANY_INFO;
    await setDoc(doc(db, COLLECTIONS.COMPANY, companyDoc.id), companyDoc, { merge: true });

    const custSnapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    if (!custSnapshot.empty) {
      return; // Already initialized in Google Cloud Firestore
    }

    console.log('[Firestore] Seeding initial data to Google Cloud Firestore...');
    const batch = writeBatch(db);

    // 1. Users
    INITIAL_USERS.forEach((user) => {
      const userRef = doc(db, COLLECTIONS.USERS, user.id);
      batch.set(userRef, user);
    });

    // 2. Customers
    INITIAL_CUSTOMERS.forEach((customer) => {
      const custRef = doc(db, COLLECTIONS.CUSTOMERS, customer.id);
      batch.set(custRef, customer);
    });

    // 3. Products
    INITIAL_PRODUCTS.forEach((product) => {
      const prodRef = doc(db, COLLECTIONS.PRODUCTS, product.sku);
      batch.set(prodRef, product);
    });

    // 4. Inventory
    INITIAL_INVENTORY.forEach((inv) => {
      const invRef = doc(db, COLLECTIONS.INVENTORY, inv.sku);
      batch.set(invRef, inv);
    });

    // 5. Quotations
    INITIAL_QUOTATIONS.forEach((quote) => {
      const quoteRef = doc(db, COLLECTIONS.QUOTATIONS, quote.id);
      batch.set(quoteRef, quote);
    });

    // 6. Contracts
    INITIAL_CONTRACTS.forEach((contract) => {
      const contractRef = doc(db, COLLECTIONS.CONTRACTS, contract.id);
      batch.set(contractRef, contract);
    });

    // 7. Reserve Items
    INITIAL_RESERVE_ITEMS.forEach((res) => {
      const resRef = doc(db, COLLECTIONS.RESERVES, res.id);
      batch.set(resRef, res);
    });

    // 8. Order Items
    INITIAL_ORDER_ITEMS.forEach((ord) => {
      const ordRef = doc(db, COLLECTIONS.ORDERS, ord.id);
      batch.set(ordRef, ord);
    });

    await batch.commit();
    console.log('[Firestore] Seed initial data successfully committed to Google Cloud Firestore!');
  } catch (error) {
    console.warn('[Firestore] Error during Firestore initialization seeding:', error);
  }
}

// User Actions
export async function syncUserToCloud(user: User) {
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), user, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving user:', err);
  }
}

export async function deleteUserFromCloud(userId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  } catch (err) {
    console.error('[Firestore] Error deleting user:', err);
  }
}

// Company Info Actions
export async function syncCompanyInfoToCloud(companyInfo: CompanyInfo) {
  try {
    const id = companyInfo.id || 'company-master';
    await setDoc(doc(db, COLLECTIONS.COMPANY, id), companyInfo, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving company info:', err);
  }
}

// Customer Actions
export async function syncCustomerToCloud(customer: Customer) {
  try {
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), customer, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving customer:', err);
  }
}

export async function deleteCustomerFromCloud(customerId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId));
  } catch (err) {
    console.error('[Firestore] Error deleting customer:', err);
  }
}

// Product Actions
export async function syncProductToCloud(product: ProductPriceItem) {
  try {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.sku), product, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving product:', err);
  }
}

export async function batchSyncProductsToCloud(products: ProductPriceItem[]) {
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((p) => {
        batch.set(doc(db, COLLECTIONS.PRODUCTS, p.sku), p, { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('[Firestore] Error batch saving products:', err);
  }
}

export async function deleteProductFromCloud(sku: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, sku));
  } catch (err) {
    console.error('[Firestore] Error deleting product:', err);
  }
}

// Inventory Actions
export async function syncInventoryItemToCloud(item: InventoryItem) {
  try {
    await setDoc(doc(db, COLLECTIONS.INVENTORY, item.sku), item, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving inventory item:', err);
  }
}

export async function batchSyncInventoryToCloud(inventoryItems: InventoryItem[]) {
  try {
    const batch = writeBatch(db);
    inventoryItems.forEach((i) => {
      batch.set(doc(db, COLLECTIONS.INVENTORY, i.sku), i, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('[Firestore] Error batch saving inventory:', err);
  }
}

// Quotation Actions
export async function syncQuotationToCloud(quote: Quotation) {
  try {
    await setDoc(doc(db, COLLECTIONS.QUOTATIONS, quote.id), quote, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving quotation:', err);
  }
}

export async function deleteQuotationFromCloud(quoteId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.QUOTATIONS, quoteId));
  } catch (err) {
    console.error('[Firestore] Error deleting quotation:', err);
  }
}

// Contract Actions
export async function syncContractToCloud(contract: Contract) {
  try {
    await setDoc(doc(db, COLLECTIONS.CONTRACTS, contract.id), contract, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving contract:', err);
  }
}

// Logistics (Reserves & Orders) Actions
export async function syncReserveItemToCloud(reserve: ReserveItem) {
  try {
    await setDoc(doc(db, COLLECTIONS.RESERVES, reserve.id), reserve, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving reserve item:', err);
  }
}

export async function batchSyncReservesToCloud(reserves: ReserveItem[]) {
  try {
    const batch = writeBatch(db);
    reserves.forEach((r) => {
      batch.set(doc(db, COLLECTIONS.RESERVES, r.id), r, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('[Firestore] Error batch saving reserves:', err);
  }
}

export async function syncOrderItemToCloud(order: OrderItem) {
  try {
    await setDoc(doc(db, COLLECTIONS.ORDERS, order.id), order, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving order item:', err);
  }
}

export async function batchSyncOrdersToCloud(orders: OrderItem[]) {
  try {
    const batch = writeBatch(db);
    orders.forEach((o) => {
      batch.set(doc(db, COLLECTIONS.ORDERS, o.id), orderItemDoc(o), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('[Firestore] Error batch saving orders:', err);
  }
}

function orderItemDoc(o: OrderItem) {
  return { ...o };
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
    console.error(`[Firestore] Error clearing collection ${collectionName}:`, err);
  }
}

// Clear all data from Google Cloud Firestore
export async function clearAllDataFromCloud(keepSuperAdmin = true) {
  try {
    console.log('[Firestore] Clearing all data collections...');
    const superAdminId = 'user-super-admin';
    const collectionsToClear = [
      COLLECTIONS.CUSTOMERS,
      COLLECTIONS.PRODUCTS,
      COLLECTIONS.INVENTORY,
      COLLECTIONS.QUOTATIONS,
      COLLECTIONS.CONTRACTS,
      COLLECTIONS.RESERVES,
      COLLECTIONS.ORDERS,
    ];

    for (const colName of collectionsToClear) {
      await clearCollectionFromCloud(colName);
    }

    // Clear Users (keep Super Admin if requested)
    await clearCollectionFromCloud(COLLECTIONS.USERS, keepSuperAdmin ? [superAdminId] : []);

    console.log('[Firestore] All collections cleared successfully!');
  } catch (err) {
    console.error('[Firestore] Error clearing all data:', err);
  }
}
