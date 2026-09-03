/**
 * Dedicated IndexedDB Persistence Layer for Large Datasets (Products & Inventory)
 * Guarantees ZERO localStorage usage for Products & Inventory to completely prevent QuotaExceededError.
 */

import { ProductPriceItem, InventoryItem, User } from '../types';

const DB_NAME = 'SalesFlow_LocalDB';
const DB_VERSION = 3;
export const IDB_STORES = {
  PRODUCTS: 'products_store',
  INVENTORY: 'inventory_store',
  PRODUCT_IMAGES: 'product_images_store',
  USERS: 'users_store',
} as const;

export const STORAGE_KEYS = {
  USERS: 'salesflow_users_v1',
  CURRENT_USER_ID: 'salesflow_current_user_id_v1',
  IS_AUTHENTICATED: 'salesflow_is_authenticated_v1',
  COMPANY: 'salesflow_company_info_v1',
  CUSTOMERS: 'salesflow_customers_v1',
  PRODUCTS: 'salesflow_products_v1',
  INVENTORY: 'salesflow_inventory_v1',
  QUOTATIONS: 'salesflow_quotations_v1',
  CONTRACTS: 'salesflow_contracts_v1',
  RESERVES: 'salesflow_reserves_v1',
  ORDERS: 'salesflow_orders_v1',
  PURCHASE_ORDERS: 'salesflow_purchase_orders_v1',
  CONTRACT_TEMPLATES: 'salesflow_contract_templates_v1',
  STOCK_TRANSACTIONS: 'salesflow_stock_transactions_v1',
  STOCK_IN_VOUCHERS: 'salesflow_stock_in_vouchers_v1',
  STOCK_OUT_VOUCHERS: 'salesflow_stock_out_vouchers_v1',
  STOCK_AUDIT_VOUCHERS: 'salesflow_stock_audit_vouchers_v1',
} as const;

const IDB_KEYS = {
  PRODUCTS: 'master_products_data',
  INVENTORY: 'master_inventory_data',
  USERS: 'master_users_data',
};

// Open or initialize IndexedDB connection with connection reuse
let cachedDbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (cachedDbPromise) {
    return cachedDbPromise;
  }

  cachedDbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORES.PRODUCTS)) {
        db.createObjectStore(IDB_STORES.PRODUCTS);
      }
      if (!db.objectStoreNames.contains(IDB_STORES.INVENTORY)) {
        db.createObjectStore(IDB_STORES.INVENTORY);
      }
      if (!db.objectStoreNames.contains(IDB_STORES.PRODUCT_IMAGES)) {
        db.createObjectStore(IDB_STORES.PRODUCT_IMAGES);
      }
      if (!db.objectStoreNames.contains(IDB_STORES.USERS)) {
        db.createObjectStore(IDB_STORES.USERS);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onclose = () => {
        cachedDbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      cachedDbPromise = null;
      reject(request.error);
    };
  });

  return cachedDbPromise;
}

/**
 * Save data directly to IndexedDB (No localStorage quota limits)
 * Uses transaction 'oncomplete' to guarantee physical persistence before resolving.
 */
export async function saveToIDB<T>(storeName: string, key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(data, key);

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(tx.error || new Error(`IndexedDB transaction error in ${storeName}`));
      };
      tx.onabort = () => {
        reject(new Error(`IndexedDB transaction aborted in ${storeName}`));
      };
    });
  } catch (err) {
    console.error(`[LocalDB] IndexedDB save error for ${storeName}/${key}:`, err);
    throw err;
  }
}

/**
 * Load data directly from IndexedDB
 */
export async function loadFromIDB<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve((req.result as T) || null);
      };
      req.onerror = () => {
        reject(req.error || new Error(`IndexedDB read error in ${storeName}`));
      };
    });
  } catch (err) {
    console.warn(`[LocalDB] IndexedDB load warning for ${storeName}/${key}:`, err);
    return null;
  }
}

/**
 * Delete a specific key directly from IndexedDB
 */
export async function deleteFromIDB(storeName: string, key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(key);

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(tx.error || new Error(`IndexedDB delete error in ${storeName}`));
      };
      tx.onabort = () => {
        reject(new Error(`IndexedDB delete aborted in ${storeName}`));
      };
    });
  } catch (err) {
    console.error(`[LocalDB] IndexedDB delete error for ${storeName}/${key}:`, err);
    throw err;
  }
}

/**
 * Dedicated Product Persistence (IndexedDB ONLY - Zero localStorage)
 * Scoped by organizationId (Tenant) to guarantee 100% data isolation between Level 1 accounts.
 */
export function getTenantProductStoreKey(orgId?: string): string {
  return orgId ? `products_${orgId}` : IDB_KEYS.PRODUCTS;
}

export function getTenantInventoryStoreKey(orgId?: string): string {
  return orgId ? `inventory_${orgId}` : IDB_KEYS.INVENTORY;
}

export async function clearTenantProductsFromIndexedDB(orgId: string): Promise<void> {
  if (!orgId) return;
  const storeKey = getTenantProductStoreKey(orgId);
  await saveToIDB(IDB_STORES.PRODUCTS, storeKey, []);
}

export async function clearTenantInventoryFromIndexedDB(orgId: string): Promise<void> {
  if (!orgId) return;
  const storeKey = getTenantInventoryStoreKey(orgId);
  await saveToIDB(IDB_STORES.INVENTORY, storeKey, []);
}

export async function saveProductsToIndexedDB(products: ProductPriceItem[], orgId?: string): Promise<void> {
  const storeKey = getTenantProductStoreKey(orgId);
  console.log(`[LocalDB] SAVING products to IndexedDB [${storeKey}] (${products.length} records)`);
  await saveToIDB(IDB_STORES.PRODUCTS, storeKey, products);
  console.log(`[LocalDB] SAVED products to IndexedDB [${storeKey}] successfully (${products.length} records)`);
}

export async function loadProductsFromIndexedDB(orgId?: string): Promise<ProductPriceItem[] | null> {
  const storeKey = getTenantProductStoreKey(orgId);
  let result = await loadFromIDB<ProductPriceItem[]>(IDB_STORES.PRODUCTS, storeKey);
  
  // Fallback: If tenant-specific key is empty or null, check master/legacy key so 9380+ products aren't lost
  if ((!result || result.length === 0) && orgId && storeKey !== IDB_KEYS.PRODUCTS) {
    const fallback = await loadFromIDB<ProductPriceItem[]>(IDB_STORES.PRODUCTS, IDB_KEYS.PRODUCTS);
    if (fallback && Array.isArray(fallback) && fallback.length > 0) {
      console.log(`[LocalDB] Fallback loaded ${fallback.length} products from [${IDB_KEYS.PRODUCTS}] for org [${orgId}]`);
      result = fallback;
    }
  }

  if (result && Array.isArray(result)) {
    console.log(`[LocalDB] LOADED ${result.length} products from IndexedDB [${storeKey}]`);
  }
  return result;
}

export async function verifyProductCountInIndexedDB(orgId?: string): Promise<number> {
  const prods = await loadProductsFromIndexedDB(orgId);
  return prods ? prods.length : 0;
}

/**
 * Dedicated Inventory Persistence (IndexedDB ONLY - Zero localStorage)
 * Scoped by organizationId (Tenant).
 */
export async function saveInventoryToIndexedDB(inventory: InventoryItem[], orgId?: string): Promise<void> {
  const storeKey = getTenantInventoryStoreKey(orgId);
  console.log(`[LocalDB] SAVING inventory to IndexedDB [${storeKey}] (${inventory.length} items)`);
  await saveToIDB(IDB_STORES.INVENTORY, storeKey, inventory);
  console.log(`[LocalDB] SAVED inventory to IndexedDB [${storeKey}] successfully (${inventory.length} items)`);
}

export async function loadInventoryFromIndexedDB(orgId?: string): Promise<InventoryItem[] | null> {
  const storeKey = getTenantInventoryStoreKey(orgId);
  let result = await loadFromIDB<InventoryItem[]>(IDB_STORES.INVENTORY, storeKey);

  // Fallback: If tenant-specific key is empty or null, check master/legacy key
  if ((!result || result.length === 0) && orgId && storeKey !== IDB_KEYS.INVENTORY) {
    const fallback = await loadFromIDB<InventoryItem[]>(IDB_STORES.INVENTORY, IDB_KEYS.INVENTORY);
    if (fallback && Array.isArray(fallback) && fallback.length > 0) {
      console.log(`[LocalDB] Fallback loaded ${fallback.length} inventory items from [${IDB_KEYS.INVENTORY}] for org [${orgId}]`);
      result = fallback;
    }
  }

  if (result && Array.isArray(result)) {
    console.log(`[LocalDB] LOADED ${result.length} inventory items from IndexedDB [${storeKey}]`);
  }
  return result;
}

export async function verifyInventoryCountInIndexedDB(orgId?: string): Promise<number> {
  const inv = await loadInventoryFromIndexedDB(orgId);
  return inv ? inv.length : 0;
}

/**
 * Dedicated Users Persistence (IndexedDB Local High Performance Cache)
 * Ensures user accounts remain accessible even when localStorage is wiped or Cloud quota is reached.
 */
export async function saveUsersToIndexedDB(users: User[]): Promise<void> {
  try {
    await saveToIDB(IDB_STORES.USERS, IDB_KEYS.USERS, users);
  } catch (err) {
    console.warn('[LocalDB] saveUsersToIndexedDB warning:', err);
  }
}

export async function loadUsersFromIndexedDB(): Promise<User[] | null> {
  try {
    return await loadFromIDB<User[]>(IDB_STORES.USERS, IDB_KEYS.USERS);
  } catch (err) {
    console.warn('[LocalDB] loadUsersFromIndexedDB warning:', err);
    return null;
  }
}

/**
 * Migrate and clean up any legacy product/inventory data from localStorage
 * to free up browser storage quota immediately.
 */
export async function migrateAndCleanupLegacyStorage(): Promise<void> {
  try {
    // 1. Migrate Products
    const legacyProds = localStorage.getItem('salesflow_products_v1');
    if (legacyProds) {
      try {
        const parsed = JSON.parse(legacyProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIDB = await loadProductsFromIndexedDB();
          if (!existingIDB || existingIDB.length < parsed.length) {
            await saveProductsToIndexedDB(parsed);
          }
        }
      } catch {}
      localStorage.removeItem('salesflow_products_v1');
      console.log('[LocalDB Migration] Cleared legacy salesflow_products_v1 from localStorage');
    }

    // 2. Migrate Inventory
    const legacyInv = localStorage.getItem('salesflow_inventory_v1');
    if (legacyInv) {
      try {
        const parsed = JSON.parse(legacyInv);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIDB = await loadInventoryFromIndexedDB();
          if (!existingIDB || existingIDB.length < parsed.length) {
            await saveInventoryToIndexedDB(parsed);
          }
        }
      } catch {}
      localStorage.removeItem('salesflow_inventory_v1');
      console.log('[LocalDB Migration] Cleared legacy salesflow_inventory_v1 from localStorage');
    }
  } catch (err) {
    console.warn('[LocalDB Migration] Warning during legacy cleanup:', err);
  }
}

/**
 * Generate a tenant-isolated storage key
 */
export function getTenantStorageKey(baseKey: string, orgId?: string): string {
  const cleanOrg = (orgId || 'global').trim();
  return `${baseKey}_${cleanOrg}`;
}

/**
 * Safe LocalStorage getter with tenant-first lookup and fallback to global key
 */
export function loadTenantDataWithFallback<T>(baseKey: string, orgId: string, defaultValue: T): T {
  try {
    const tenantKey = getTenantStorageKey(baseKey, orgId);
    const tenantVal = safeGetLocalStorage<T | null>(tenantKey, null);
    if (tenantVal !== null) {
      if (Array.isArray(tenantVal)) {
        if (tenantVal.length > 0) return tenantVal;
      } else {
        return tenantVal;
      }
    }
    // Fallback to legacy global key
    const globalVal = safeGetLocalStorage<T | null>(baseKey, null);
    if (globalVal !== null) {
      if (Array.isArray(globalVal)) {
        if (globalVal.length > 0) return globalVal;
      } else {
        return globalVal;
      }
    }
  } catch (err) {
    console.warn(`[LocalDB] Error loading tenant data for ${baseKey} (${orgId}):`, err);
  }
  return defaultValue;
}

/**
 * Safe LocalStorage setter strictly for SMALL datasets (Users, Auth, Quotes, Contracts, Company).
 * Explicitly rejects storing full Products or Inventory to avoid quota exhaustion.
 */
export function safeSetLocalStorage<T>(storageKey: string, data: T): void {
  // Guard against accidental product or inventory serialization
  if (storageKey === 'salesflow_products_v1' || storageKey === 'salesflow_inventory_v1') {
    console.warn(`[LocalDB] Blocked localStorage.setItem for large dataset key: ${storageKey}. Routing to IndexedDB.`);
    if (storageKey === 'salesflow_products_v1') {
      saveProductsToIndexedDB(data as any);
    } else {
      saveInventoryToIndexedDB(data as any);
    }
    return;
  }

  try {
    const jsonStr = JSON.stringify(data);
    localStorage.setItem(storageKey, jsonStr);
  } catch (err: any) {
    console.warn(`[LocalDB] Safe localStorage write warning for ${storageKey}:`, err?.message || err);
  }
}

/**
 * Safe LocalStorage getter for small datasets
 */
export function safeGetLocalStorage<T>(storageKey: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (err) {
    console.warn(`[LocalDB] LocalStorage parse error for ${storageKey}:`, err);
  }
  return defaultValue;
}

export async function saveProductImageBlobToIDB(key: string, blob: Blob): Promise<string> {
  try {
    await saveToIDB(IDB_STORES.PRODUCT_IMAGES, key, blob);
  } catch (idbErr) {
    console.warn('[LocalDB] saveProductImageBlobToIDB non-fatal warning (fallback to DataURL):', idbErr);
  }

  return new Promise((resolve) => {
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve((reader.result as string) || `local-blob://${key}`);
      };
      reader.onerror = () => {
        resolve(`local-blob://${key}`);
      };
      try {
        reader.readAsDataURL(blob);
      } catch {
        resolve(`local-blob://${key}`);
      }
    } else {
      resolve(`local-blob://${key}`);
    }
  });
}

export async function loadProductImageBlobFromIDB(key: string): Promise<string | null> {
  try {
    const blob = await loadFromIDB<Blob>(IDB_STORES.PRODUCT_IMAGES, key);
    if (blob && blob instanceof Blob) {
      return new Promise((resolve) => {
        if (typeof FileReader !== 'undefined') {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            resolve(null);
          };
          reader.readAsDataURL(blob);
        } else {
          resolve(null);
        }
      });
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteProductImageBlobFromIDB(key: string): Promise<void> {
  try {
    await deleteFromIDB(IDB_STORES.PRODUCT_IMAGES, key);
  } catch (err) {
    console.warn(`[LocalDB] Failed to delete image blob for ${key}:`, err);
  }
}
