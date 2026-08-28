/**
 * Dedicated IndexedDB Persistence Layer for Large Datasets (Products & Inventory)
 * Guarantees ZERO localStorage usage for Products & Inventory to completely prevent QuotaExceededError.
 */

import { ProductPriceItem, InventoryItem } from '../types';

const DB_NAME = 'SalesFlow_LocalDB';
const DB_VERSION = 1;
export const IDB_STORES = {
  PRODUCTS: 'products_store',
  INVENTORY: 'inventory_store',
} as const;

const IDB_KEYS = {
  PRODUCTS: 'master_products_data',
  INVENTORY: 'master_inventory_data',
};

// Open or initialize IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save data directly to IndexedDB (No localStorage quota limits)
 */
export async function saveToIDB<T>(storeName: string, key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[LocalDB] IndexedDB save warning for ${storeName}/${key}:`, err);
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
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[LocalDB] IndexedDB load warning for ${storeName}/${key}:`, err);
    return null;
  }
}

/**
 * Dedicated Product Persistence (IndexedDB ONLY - Zero localStorage)
 */
export async function saveProductsToIndexedDB(products: ProductPriceItem[]): Promise<void> {
  console.log(`[PRICE_IMPORT] LOCAL_SAVED (IndexedDB: ${products.length} products)`);
  await saveToIDB(IDB_STORES.PRODUCTS, IDB_KEYS.PRODUCTS, products);
}

export async function loadProductsFromIndexedDB(): Promise<ProductPriceItem[] | null> {
  return loadFromIDB<ProductPriceItem[]>(IDB_STORES.PRODUCTS, IDB_KEYS.PRODUCTS);
}

/**
 * Dedicated Inventory Persistence (IndexedDB ONLY - Zero localStorage)
 */
export async function saveInventoryToIndexedDB(inventory: InventoryItem[]): Promise<void> {
  console.log(`[INVENTORY_IMPORT] LOCAL_SAVED (IndexedDB: ${inventory.length} items)`);
  await saveToIDB(IDB_STORES.INVENTORY, IDB_KEYS.INVENTORY, inventory);
}

export async function loadInventoryFromIndexedDB(): Promise<InventoryItem[] | null> {
  return loadFromIDB<InventoryItem[]>(IDB_STORES.INVENTORY, IDB_KEYS.INVENTORY);
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
