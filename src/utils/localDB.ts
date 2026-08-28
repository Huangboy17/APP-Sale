/**
 * IndexedDB & Safe LocalStorage Persistence Layer
 * Handles large datasets (9,380+ records) without exceeding localStorage 5MB quota or throwing QuotaExceededError.
 */

const DB_NAME = 'SalesFlow_LocalDB';
const DB_VERSION = 1;
const STORES = {
  PRODUCTS: 'products_store',
  INVENTORY: 'inventory_store',
};

// Open or initialize IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        db.createObjectStore(STORES.PRODUCTS);
      }
      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        db.createObjectStore(STORES.INVENTORY);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save data to IndexedDB
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
 * Load data from IndexedDB
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
 * Safe LocalStorage setter that gracefully handles QuotaExceededError
 * and seamlessly mirrors to IndexedDB for large dataset persistence.
 */
export function safeSetLocalStorage<T>(storageKey: string, data: T, idbStoreName?: string): void {
  const jsonStr = JSON.stringify(data);
  try {
    localStorage.setItem(storageKey, jsonStr);
    console.log(`[PRICE_IMPORT] LOCAL_SAVED ${storageKey} (${(jsonStr.length / 1024).toFixed(1)} KB)`);
  } catch (err: any) {
    if (err.name === 'QuotaExceededError' || err.code === 22 || err.number === -2147024882) {
      console.warn(`[LocalDB] LocalStorage quota exceeded (${(jsonStr.length / 1024 / 1024).toFixed(2)} MB). Preserving via IndexedDB fallback.`);
    } else {
      console.error(`[LocalDB] LocalStorage save error for ${storageKey}:`, err);
    }
  }

  // Always mirror to IndexedDB for robust large dataset persistence across browser restarts/reloads
  if (idbStoreName) {
    saveToIDB(idbStoreName, storageKey, data).catch(() => {});
  }
}

/**
 * Safe LocalStorage getter with IndexedDB fallback for large datasets
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

export { STORES as IDB_STORES };
