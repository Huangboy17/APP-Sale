import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  UserRole,
  CompanyInfo,
  Customer,
  CustomerStage,
  ProductPriceItem,
  InventoryItem,
  Quotation,
  QuotationStatus,
  Contract,
  ReserveItem,
  OrderItem,
  QuoteProductRow,
  PaymentMilestone,
  Organization,
  CustomerMember,
  PriceImportRecord,
  resolveOrganizationId,
  canLevel2AccessCustomer,
  canLevel2AccessQuotation,
  canLevel2AccessContract,
  validateUserUpdate,
  isUserActive,
  isUserPending,
  isUserBlocked,
  StockTransaction,
  StockTransactionType,
  StockInVoucher,
  StockOutVoucher,
  StockAuditVoucher,
} from '../types';
import {
  saveProductsToIndexedDB,
  loadProductsFromIndexedDB,
  saveInventoryToIndexedDB,
  loadInventoryFromIndexedDB,
  migrateAndCleanupLegacyStorage,
  safeSetLocalStorage,
  safeGetLocalStorage,
} from '../utils/localDB';
import { normalizeProductPriceItem } from '../utils/priceImportEngine';
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
import {
  db,
  collection,
  onSnapshot,
} from '../lib/firebase';
import {
  COLLECTIONS,
  seedInitialDataIfEmpty,
  setOnQuotaExceededListener,
  handleFirestoreError,
  syncUserToCloud,
  syncCompanyInfoToCloud,
  deleteUserFromCloud,
  syncCustomerToCloud,
  deleteCustomerFromCloud,
  syncProductToCloud,
  batchSyncProductsToCloud,
  deleteProductFromCloud,
  clearCompanyProductsFromCloud,
  syncInventoryItemToCloud,
  batchSyncInventoryToCloud,
  deleteInventoryItemFromCloud,
  clearCompanyInventoryFromCloud,
  syncQuotationToCloud,
  deleteQuotationFromCloud,
  batchDeleteQuotationsFromCloud,
  syncContractToCloud,
  deleteContractFromCloud,
  batchDeleteContractsFromCloud,
  syncReserveItemToCloud,
  deleteReserveItemFromCloud,
  batchSyncReservesToCloud,
  batchDeleteReservesFromCloud,
  syncOrderItemToCloud,
  deleteOrderItemFromCloud,
  batchSyncOrdersToCloud,
  batchDeleteOrdersFromCloud,
  clearAllDataFromCloud,
  clearCollectionFromCloud,
  syncOrganizationToCloud,
  syncCustomerMemberToCloud,
  deleteCustomerMemberFromCloud,
  syncStockTransactionToCloud,
  batchSyncStockTransactionsToCloud,
  syncStockInVoucherToCloud,
  deleteStockInVoucherFromCloud,
  syncStockOutVoucherToCloud,
  deleteStockOutVoucherFromCloud,
  syncStockAuditVoucherToCloud,
  deleteStockAuditVoucherFromCloud,
} from '../services/firestoreSync';

// Helper function to resolve the company scope (C1 is company, C2 inherits C1's companyId)
export const getCompanyScopeForUser = (user: User, userList: User[]): { companyId: string; companyName: string } => {
  if (user.role === 'manager_c1') {
    return {
      companyId: user.id,
      companyName: user.department || `Công ty của ${user.name}`,
    };
  }
  if (user.role === 'sales_c2') {
    const mgrId = user.managerId || user.createdBy;
    const mgr = userList.find((u) => u.id === mgrId);
    return {
      companyId: mgrId || user.id,
      companyName: mgr?.department || (mgr ? `Công ty của ${mgr.name}` : user.department || 'Công ty'),
    };
  }
  return {
    companyId: 'system_admin',
    companyName: 'Quản trị hệ thống',
  };
};

export type NavTabType =
  | 'dashboard'
  | 'customers'
  | 'quotations'
  | 'contracts'
  | 'products'
  | 'price_data'
  | 'inventory'
  | 'reserve_orders'
  | 'team'
  | 'system_admin';

interface AppContextType {
  // Current user & Auth
  currentUser: User;
  setCurrentUser: (user: User) => void;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  login: (email: string, password?: string) => { success: boolean; message: string; user?: User };
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    department?: string;
    position?: string;
    role?: UserRole;
    managerId?: string;
  }) => { success: boolean; message: string; user?: User };
  logout: () => void;
  resetPassword: (email: string, newPassword?: string) => { success: boolean; message: string };
  authScreenMode: 'login' | 'register' | 'forgot_password';
  setAuthScreenMode: (mode: 'login' | 'register' | 'forgot_password') => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  quickDemoLogin: (targetUserIdOrRole: string) => void;
  users: User[];
  filteredUsers: User[];
  approveManagerC1: (userId: string) => void;
  rejectManagerC1: (userId: string) => void;
  createSalesC2: (user: Omit<User, 'id' | 'createdAt' | 'status'>) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  approveUser: (userId: string) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;

  // Master Company Information & Brand Identity
  companyInfo: CompanyInfo;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => Promise<void>;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  profileModalInitialTab: 'profile' | 'company';
  setProfileModalInitialTab: (tab: 'profile' | 'company') => void;

  // Customers
  customers: Customer[];
  filteredCustomers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'code'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  updateCustomerStage: (customerId: string, stage: CustomerStage, rejectReason?: string) => void;
  assignCustomer: (customerId: string, salesId: string, salesName: string) => void;
  deleteCustomer: (customerId: string) => void;
  grantCustomerAccess: (customerId: string, userId: string, userName: string) => void;
  revokeCustomerAccess: (customerId: string, userId: string) => void;

  // Company Scope for active user (Tenant isolation)
  companyScope: { companyId: string; companyName: string };

  // Products (Data Giá theo từng công ty C1)
  products: ProductPriceItem[];
  allProducts?: ProductPriceItem[];
  addProduct: (product: ProductPriceItem) => void;
  updateProduct: (product: ProductPriceItem) => void;
  deleteProduct: (sku: string) => void;
  importProducts: (newProducts: ProductPriceItem[]) => void;
  importPriceRecords: (records: PriceImportRecord[], mode?: 'upsert' | 'new_only') => void;

  // Inventory (Tồn kho theo từng công ty C1)
  inventory: InventoryItem[];
  allInventory?: InventoryItem[];
  updateInventoryItem: (item: InventoryItem) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'availableQuantity' | 'reservedQuantity' | 'updatedAt'>) => void;
  deleteInventoryItem: (sku: string) => void;
  importInventory: (newInventory: InventoryItem[]) => void;
  quickAdjustStock: (sku: string, deltaQty: number, notes?: string) => void;
  receiveOrderToWarehouseAndReserve: (orderId: string, warehouseLocation?: string) => void;

  // Warehouse Vouchers & Stock Transaction Ledger
  stockTransactions: StockTransaction[];
  stockInVouchers: StockInVoucher[];
  stockOutVouchers: StockOutVoucher[];
  stockAuditVouchers: StockAuditVoucher[];
  addStockTransaction: (txData: Omit<StockTransaction, 'id' | 'timestamp' | 'date'>) => StockTransaction;
  createStockInVoucher: (data: Omit<StockInVoucher, 'id' | 'voucherNumber' | 'createdAt' | 'updatedAt'>) => StockInVoucher;
  confirmStockInVoucher: (voucherId: string) => Promise<void>;
  cancelStockInVoucher: (voucherId: string) => Promise<void>;
  createStockOutVoucher: (data: Omit<StockOutVoucher, 'id' | 'voucherNumber' | 'createdAt' | 'updatedAt'>) => StockOutVoucher;
  confirmStockOutVoucher: (voucherId: string) => Promise<void>;
  cancelStockOutVoucher: (voucherId: string) => Promise<void>;
  createStockAuditVoucher: (data: Omit<StockAuditVoucher, 'id' | 'voucherNumber' | 'createdAt' | 'updatedAt'>) => StockAuditVoucher;
  confirmStockAuditVoucher: (voucherId: string) => Promise<void>;
  cancelStockAuditVoucher: (voucherId: string) => Promise<void>;

  // Quotations (Báo giá)
  quotations: Quotation[];
  filteredQuotations: Quotation[];
  getCustomerQuotations: (customerId: string) => Quotation[];
  createQuotation: (quoteData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => Quotation;
  updateQuotation: (quotation: Quotation) => void;
  updateQuotationStatus: (quoteId: string, status: QuotationStatus) => void;
  cloneQuotationToNextRound: (previousQuoteId: string) => Quotation | null;
  deleteQuotation: (id: string) => void;
  finalizeQuoteToContract: (
    quoteId: string,
    contractDetails?: Partial<Contract>,
    overrideQuote?: Quotation
  ) => { contract: Contract; reserveItems: ReserveItem[]; orderItems: OrderItem[] };

  // Contracts (Hợp đồng)
  contracts: Contract[];
  filteredContracts: Contract[];
  updateContract: (contract: Contract) => void;
  updateContractMilestoneStatus: (contractId: string, milestoneId: string, status: 'pending' | 'completed' | 'overdue') => void;

  // Split Tables: Giữ hàng & Đặt hàng
  reserveItems: ReserveItem[];
  filteredReserveItems: ReserveItem[];
  updateReserveStatus: (id: string, status: 'holding' | 'dispatched' | 'cancelled') => void;
  updateReserveItem: (item: ReserveItem) => void;
  orderItems: OrderItem[];
  filteredOrderItems: OrderItem[];
  updateOrderStatus: (id: string, status: 'pending_order' | 'ordered' | 'arrived_in_stock' | 'cancelled', notes?: string) => void;
  updateOrderItem: (item: OrderItem) => void;

  // Active view navigation
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;

  // Quick modals state
  isCreateCustomerModalOpen: boolean;
  setIsCreateCustomerModalOpen: (open: boolean) => void;
  selectedCustomerForModal: Customer | null;
  setSelectedCustomerForModal: (customer: Customer | null) => void;

  isCreateQuoteModalOpen: boolean;
  setIsCreateQuoteModalOpen: (open: boolean) => void;
  selectedQuoteForModal: Quotation | null;
  setSelectedQuoteForModal: (quote: Quotation | null) => void;
  selectedCustomerIdForQuote: string | null;
  setSelectedCustomerIdForQuote: (id: string | null) => void;

  // PDF Preview State
  pdfPreviewData: { type: 'quote' | 'contract'; data: Quotation | Contract } | null;
  setPdfPreviewData: (data: { type: 'quote' | 'contract'; data: Quotation | Contract } | null) => void;

  // Google Cloud Firestore Sync State
  cloudSyncStatus: 'connected' | 'syncing' | 'quota-exceeded' | 'offline' | 'error';
  lastCloudSyncTime: Date | null;
  syncAllToCloudNow: () => Promise<void>;

  // Data Clearance & Management
  isClearDataModalOpen: boolean;
  setIsClearDataModalOpen: (open: boolean) => void;
  clearAllSystemData: () => Promise<void>;
  clearSpecificData: (options: {
    clearCustomers?: boolean;
    clearProducts?: boolean;
    clearInventory?: boolean;
    clearQuotesAndContracts?: boolean;
    clearReservesAndOrders?: boolean;
    clearUsers?: boolean;
  }) => Promise<void>;

  // Reset to demo
  resetDataToDefault: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
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
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local cache initialization
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: User[] = JSON.parse(saved);
      // Ensure super admin is buiviethoangktxd@gmail.com
      const superAdminIndex = parsed.findIndex((u) => u.role === 'super_admin' || u.id === 'user-super-admin');
      if (superAdminIndex >= 0) {
        parsed[superAdminIndex] = {
          ...parsed[superAdminIndex],
          name: 'Bùi Viết Hoàng (Super Admin)',
          email: 'buiviethoangktxd@gmail.com',
          role: 'super_admin',
          status: 'active',
        };
      }
      return parsed;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const savedAuth = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
    if (savedAuth === 'true' && savedId) {
      const savedUsersStr = localStorage.getItem(STORAGE_KEYS.USERS);
      let list = INITIAL_USERS;
      if (savedUsersStr) {
        try {
          list = JSON.parse(savedUsersStr);
        } catch {
          list = INITIAL_USERS;
        }
      }
      const found = list.find((u: User) => u.id === savedId);
      if (found && found.status !== 'inactive') return found;
    }
    return INITIAL_USERS[0]; // Default to Super Admin (Bùi Viết Hoàng)
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (saved === 'true' && savedId) return true;
    return false; // Default to requiring explicit login
  });

  const [authScreenMode, setAuthScreenMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [products, setProducts] = useState<ProductPriceItem[]>(INITIAL_PRODUCTS);

  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QUOTATIONS);
    return saved ? JSON.parse(saved) : INITIAL_QUOTATIONS;
  });

  const [contracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTRACTS);
    return saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
  });

  const [reserveItems, setReserveItems] = useState<ReserveItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESERVES);
    return saved ? JSON.parse(saved) : INITIAL_RESERVE_ITEMS;
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDER_ITEMS;
  });

  // Hydrate large datasets (Products & Inventory) from IndexedDB and cleanup any legacy localStorage bloat
  useEffect(() => {
    migrateAndCleanupLegacyStorage().finally(() => {
      // 1. Load Products from IndexedDB
      loadProductsFromIndexedDB()
        .then((cachedProds) => {
          if (cachedProds && Array.isArray(cachedProds) && cachedProds.length > 0) {
            const normalizedProds = cachedProds.map((p) => normalizeProductPriceItem(p));
            setProducts((prev) => {
              if (prev.length <= INITIAL_PRODUCTS.length || prev.length < normalizedProds.length) {
                console.log(`[LocalDB] Hydrated ${normalizedProds.length} products from IndexedDB`);
                return normalizedProds;
              }
              return prev;
            });
          }
        })
        .catch((err) => console.warn('[LocalDB] Products hydration error:', err));

      // 2. Load Inventory from IndexedDB
      loadInventoryFromIndexedDB()
        .then((cachedInv) => {
          if (cachedInv && Array.isArray(cachedInv) && cachedInv.length > 0) {
            setInventory((prev) => {
              if (prev.length <= INITIAL_INVENTORY.length || prev.length < cachedInv.length) {
                console.log(`[LocalDB] Hydrated ${cachedInv.length} inventory items from IndexedDB`);
                return cachedInv;
              }
              return prev;
            });
          }
        })
        .catch((err) => console.warn('[LocalDB] Inventory hydration error:', err));
    });
  }, []);

  // Master Company Information (Synced to all C1 & C2 users)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPANY);
    if (!saved) return INITIAL_COMPANY_INFO;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_COMPANY_INFO;
    }
  });

  // Warehouse Vouchers & Stock Transaction Ledger State
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [stockInVouchers, setStockInVouchers] = useState<StockInVoucher[]>([]);
  const [stockOutVouchers, setStockOutVouchers] = useState<StockOutVoucher[]>([]);
  const [stockAuditVouchers, setStockAuditVouchers] = useState<StockAuditVoucher[]>([]);

  // Profile & Company Identity Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'profile' | 'company'>('profile');

  const [activeTab, setActiveTab] = useState<NavTabType>('dashboard');

  // Customer modal
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<Customer | null>(null);

  // Clear data modal
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

  // Quote modal
  const [isCreateQuoteModalOpen, setIsCreateQuoteModalOpen] = useState(false);
  const [selectedQuoteForModal, setSelectedQuoteForModal] = useState<Quotation | null>(null);
  const [selectedCustomerIdForQuote, setSelectedCustomerIdForQuote] = useState<string | null>(null);

  // PDF Preview
  const [pdfPreviewData, setPdfPreviewData] = useState<{ type: 'quote' | 'contract'; data: Quotation | Contract } | null>(null);

  // Cloud Sync Status
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline' | 'error'>('connected');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<Date | null>(new Date());

  // -------------------------------------------------------------
  // Real-time Cloud Synchronization (Google Cloud Firestore)
  // -------------------------------------------------------------
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    // Register quota exceeded callback
    setOnQuotaExceededListener(() => {
      setCloudSyncStatus('quota-exceeded');
    });

    const initializeFirestoreRealtime = async () => {
      try {
        setCloudSyncStatus('syncing');
        await seedInitialDataIfEmpty();

        // 1. Users real-time listener
        const unsubUsers = onSnapshot(
          collection(db, COLLECTIONS.USERS),
          (snap) => {
            // CRITICAL: Merge cloud data WITH existing local users.
            // Never discard locally-registered users that haven't synced to cloud yet.
            setUsers((prevLocalUsers) => {
              const map = new Map<string, User>();
              
              // Layer 1: Start with INITIAL_USERS as baseline
              INITIAL_USERS.forEach((u) => map.set(u.id, u));
              
              // Layer 2: Preserve ALL existing local users (includes recently registered ones)
              prevLocalUsers.forEach((u) => {
                if (u && u.id) map.set(u.id, u);
              });
              
              // Layer 3: Overlay cloud data (cloud is source of truth for users that exist there)
              snap.forEach((d) => {
                const u = d.data() as User;
                if (u && u.id) {
                  map.set(u.id, u);
                }
              });
              
              return Array.from(map.values());
            });

            // Keep current user updated with cloud data if logged in
            const currentSavedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
            if (currentSavedId) {
              const cloudUser = snap.docs
                .map((d) => d.data() as User)
                .find((u) => u.id === currentSavedId);
              if (cloudUser) {
                setCurrentUser(cloudUser);
              }
            }

            setCloudSyncStatus((prev) => (prev === 'quota-exceeded' ? 'quota-exceeded' : 'connected'));
            setLastCloudSyncTime(new Date());
          },
          (err) => {
            handleFirestoreError(err, 'Users listener');
          }
        );
        unsubs.push(unsubUsers);

        // 2. Customers real-time listener
        const unsubCustomers = onSnapshot(
          collection(db, COLLECTIONS.CUSTOMERS),
          (snap) => {
            const list: Customer[] = [];
            snap.forEach((d) => {
              const item = d.data() as Customer;
              if (item && item.id) list.push(item);
            });
            list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            setCustomers(list);
            setCloudSyncStatus((prev) => (prev === 'quota-exceeded' ? 'quota-exceeded' : 'connected'));
            setLastCloudSyncTime(new Date());
          },
          (err) => {
            handleFirestoreError(err, 'Customers listener');
          }
        );
        unsubs.push(unsubCustomers);

        // 3. Products real-time listener
        const unsubProducts = onSnapshot(
          collection(db, COLLECTIONS.PRODUCTS),
          (snap) => {
            const cloudList: ProductPriceItem[] = [];
            snap.forEach((d) => {
              const item = d.data();
              if (item && (item.sku || item.product_code)) {
                cloudList.push(normalizeProductPriceItem(item));
              }
            });

            console.log('[PRICE_IMPORT] SNAPSHOT_MERGE cloud items count:', cloudList.length);

            // CRITICAL: Merge cloud data WITH existing local products.
            // Preserve organizationId & createdBy from local state if cloud item lacks them.
            setProducts((prevLocal) => {
              const map = new Map<string, ProductPriceItem>();
              
              // Layer 1: Preserve all existing local products
              prevLocal.forEach((p) => {
                const normalized = normalizeProductPriceItem(p);
                const orgKey = normalized.organizationId || normalized.companyId || 'global';
                map.set(`${orgKey}_${normalized.sku}`, normalized);
              });

              // Layer 2: Overlay cloud data without losing tenant ownership
              cloudList.forEach((cloudItem) => {
                const skuUpper = cloudItem.sku;
                let existingLocalKey = Array.from(map.keys()).find((k) => k.endsWith(`_${skuUpper}`));
                let existingLocal = existingLocalKey ? map.get(existingLocalKey) : undefined;

                const orgId = cloudItem.organizationId || cloudItem.companyId || existingLocal?.organizationId || existingLocal?.companyId;
                const createdBy = cloudItem.createdBy || existingLocal?.createdBy;
                const createdByName = cloudItem.createdByName || existingLocal?.createdByName;

                const mergedItem: ProductPriceItem = {
                  ...cloudItem,
                  organizationId: orgId,
                  companyId: orgId,
                  createdBy: createdBy || 'system',
                  createdByName: createdByName || 'System',
                };

                const targetKey = `${orgId || 'global'}_${skuUpper}`;
                if (existingLocalKey && existingLocalKey !== targetKey) {
                  map.delete(existingLocalKey);
                }
                map.set(targetKey, mergedItem);
              });

              const mergedResult = Array.from(map.values());
              // Update local persistence via IndexedDB (Zero localStorage usage)
              saveProductsToIndexedDB(mergedResult);
              return mergedResult;
            });
            setCloudSyncStatus((prev) => (prev === 'quota-exceeded' ? 'quota-exceeded' : 'connected'));
            setLastCloudSyncTime(new Date());
          },
          (err) => {
            handleFirestoreError(err, 'Products listener');
          }
        );
        unsubs.push(unsubProducts);

        // 4. Inventory real-time listener
        const unsubInventory = onSnapshot(
          collection(db, COLLECTIONS.INVENTORY),
          (snap) => {
            const cloudList: InventoryItem[] = [];
            snap.forEach((d) => {
              const item = d.data() as InventoryItem;
              if (item && item.sku) {
                cloudList.push({
                  ...item,
                  sku: (item.sku || '').trim().toUpperCase(),
                  name: (item.name || '').trim() || `Sản phẩm ${item.sku}`,
                  unit: (item.unit || '').trim() || 'Bộ',
                  totalQuantity: typeof item.totalQuantity === 'number' && !isNaN(item.totalQuantity) ? item.totalQuantity : 0,
                  reservedQuantity: typeof item.reservedQuantity === 'number' && !isNaN(item.reservedQuantity) ? item.reservedQuantity : 0,
                  availableQuantity: typeof item.availableQuantity === 'number' && !isNaN(item.availableQuantity) ? item.availableQuantity : 0,
                  warehouseLocation: (item.warehouseLocation || 'Kho Tổng').trim(),
                  updatedAt: item.updatedAt || new Date().toISOString().split('T')[0],
                });
              }
            });
            // CRITICAL: Merge cloud data WITH existing local inventory.
            // Never discard locally-imported inventory that hasn't synced to cloud yet.
            setInventory((prevLocal) => {
              const map = new Map<string, InventoryItem>();
              // Layer 1: Preserve all existing local inventory
              prevLocal.forEach((i) => {
                const key = `${i.organizationId || i.companyId || 'global'}_${(i.sku || '').trim().toUpperCase()}`;
                map.set(key, i);
              });
              // Layer 2: Overlay cloud data (source of truth for synced items)
              cloudList.forEach((i) => {
                const key = `${i.organizationId || i.companyId || 'global'}_${(i.sku || '').trim().toUpperCase()}`;
                map.set(key, i);
              });
              const mergedResult = Array.from(map.values());
              saveInventoryToIndexedDB(mergedResult);
              return mergedResult;
            });
            setCloudSyncStatus((prev) => (prev === 'quota-exceeded' ? 'quota-exceeded' : 'connected'));
            setLastCloudSyncTime(new Date());
          },
          (err) => {
            handleFirestoreError(err, 'Inventory listener');
          }
        );
        unsubs.push(unsubInventory);

        // 5. Quotations real-time listener
        const unsubQuotes = onSnapshot(
          collection(db, COLLECTIONS.QUOTATIONS),
          (snap) => {
            const list: Quotation[] = [];
            snap.forEach((d) => {
              const item = d.data() as Quotation;
              if (item && item.id) list.push(item);
            });
            list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            setQuotations(list);
            setCloudSyncStatus((prev) => (prev === 'quota-exceeded' ? 'quota-exceeded' : 'connected'));
            setLastCloudSyncTime(new Date());
          },
          (err) => {
            handleFirestoreError(err, 'Quotations listener');
          }
        );
        unsubs.push(unsubQuotes);

        // 6. Contracts real-time listener
        const unsubContracts = onSnapshot(
          collection(db, COLLECTIONS.CONTRACTS),
          (snap) => {
            const list: Contract[] = [];
            snap.forEach((d) => {
              const item = d.data() as Contract;
              if (item && item.id) list.push(item);
            });
            list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            setContracts(list);
            setCloudSyncStatus((prev) => (prev === 'quota-exceeded' ? 'quota-exceeded' : 'connected'));
            setLastCloudSyncTime(new Date());
          },
          (err) => {
            handleFirestoreError(err, 'Contracts listener');
          }
        );
        unsubs.push(unsubContracts);

        // 7. Reserves real-time listener
        const unsubReserves = onSnapshot(
          collection(db, COLLECTIONS.RESERVES),
          (snap) => {
            const list: ReserveItem[] = [];
            snap.forEach((d) => {
              const item = d.data() as ReserveItem;
              if (item && item.id) list.push(item);
            });
            setReserveItems(list);
            setCloudSyncStatus((prev) => (prev === 'quota-exceeded' ? 'quota-exceeded' : 'connected'));
            setLastCloudSyncTime(new Date());
          },
          (err) => {
            handleFirestoreError(err, 'Reserves listener');
          }
        );
        unsubs.push(unsubReserves);

        // 8. Orders real-time listener
        const unsubOrders = onSnapshot(
          collection(db, COLLECTIONS.ORDERS),
          (snap) => {
            const list: OrderItem[] = [];
            snap.forEach((d) => {
              const item = d.data() as OrderItem;
              if (item && item.id) list.push(item);
            });
            setOrderItems(list);
            setCloudSyncStatus((prev) => (prev === 'quota-exceeded' ? 'quota-exceeded' : 'connected'));
            setLastCloudSyncTime(new Date());
          },
          (err) => {
            handleFirestoreError(err, 'Orders listener');
          }
        );
        unsubs.push(unsubOrders);

        // 9. Master Company Info real-time listener
        const unsubCompany = onSnapshot(
          collection(db, COLLECTIONS.COMPANY),
          (snap) => {
            if (!snap.empty) {
              const data = snap.docs[0].data() as CompanyInfo;
              if (data && data.name) {
                const normalizedData: CompanyInfo = {
                  ...data,
                  logoUrl: data.logoUrl || data.logo || '',
                  logo: data.logoUrl || data.logo || '',
                };
                setCompanyInfo(normalizedData);
                localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(normalizedData));
              }
            }
            setCloudSyncStatus((prev) => (prev === 'quota-exceeded' ? 'quota-exceeded' : 'connected'));
            setLastCloudSyncTime(new Date());
          },
          (err) => {
            handleFirestoreError(err, 'Company listener');
          }
        );
        unsubs.push(unsubCompany);

        // 10. Stock Transactions real-time listener
        const unsubStockTx = onSnapshot(
          collection(db, COLLECTIONS.STOCK_TRANSACTIONS),
          (snap) => {
            const list: StockTransaction[] = [];
            snap.forEach((d) => {
              const tx = d.data() as StockTransaction;
              if (tx && tx.id) list.push(tx);
            });
            // Sort by timestamp desc
            list.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
            setStockTransactions(list);
          },
          (err) => {
            handleFirestoreError(err, 'Stock transactions listener');
          }
        );
        unsubs.push(unsubStockTx);

        // 11. Stock In Vouchers real-time listener
        const unsubStockIn = onSnapshot(
          collection(db, COLLECTIONS.STOCK_IN_VOUCHERS),
          (snap) => {
            const list: StockInVoucher[] = [];
            snap.forEach((d) => {
              const v = d.data() as StockInVoucher;
              if (v && v.id) list.push(v);
            });
            list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
            setStockInVouchers(list);
          },
          (err) => {
            handleFirestoreError(err, 'Stock In vouchers listener');
          }
        );
        unsubs.push(unsubStockIn);

        // 12. Stock Out Vouchers real-time listener
        const unsubStockOut = onSnapshot(
          collection(db, COLLECTIONS.STOCK_OUT_VOUCHERS),
          (snap) => {
            const list: StockOutVoucher[] = [];
            snap.forEach((d) => {
              const v = d.data() as StockOutVoucher;
              if (v && v.id) list.push(v);
            });
            list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
            setStockOutVouchers(list);
          },
          (err) => {
            handleFirestoreError(err, 'Stock Out vouchers listener');
          }
        );
        unsubs.push(unsubStockOut);

        // 13. Stock Audit Vouchers real-time listener
        const unsubStockAudit = onSnapshot(
          collection(db, COLLECTIONS.STOCK_AUDIT_VOUCHERS),
          (snap) => {
            const list: StockAuditVoucher[] = [];
            snap.forEach((d) => {
              const v = d.data() as StockAuditVoucher;
              if (v && v.id) list.push(v);
            });
            list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
            setStockAuditVouchers(list);
          },
          (err) => {
            handleFirestoreError(err, 'Stock Audit vouchers listener');
          }
        );
        unsubs.push(unsubStockAudit);

        setCloudSyncStatus((prev) => (prev === 'quota-exceeded' ? 'quota-exceeded' : 'connected'));
      } catch (err) {
        handleFirestoreError(err, 'Initialization error');
      }
    };

    initializeFirestoreRealtime();

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Sync to localStorage / IndexedDB as local instant cache
  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.CUSTOMERS, customers);
  }, [customers]);

  useEffect(() => {
    saveProductsToIndexedDB(products);
  }, [products]);

  useEffect(() => {
    saveInventoryToIndexedDB(inventory);
  }, [inventory]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.QUOTATIONS, quotations);
  }, [quotations]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.CONTRACTS, contracts);
  }, [contracts]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.RESERVES, reserveItems);
  }, [reserveItems]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.ORDERS, orderItems);
  }, [orderItems]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.COMPANY, companyInfo);
  }, [companyInfo]);

  // Automated Self-Healing Orphan Data Reconciliation:
  // Automatically detects and purges any orphan reserve items, order items, contracts, and quotes
  // whose customerId no longer exists in customers, and restores locked inventory to available stock.
  useEffect(() => {
    if (customers.length === 0) return;

    const validCustomerIds = new Set(customers.map((c) => c.id));

    // 1. Identify orphan reserves
    const orphanReserves = reserveItems.filter(
      (r) => !r.customerId || !validCustomerIds.has(r.customerId)
    );

    // 2. Identify orphan orders
    const orphanOrders = orderItems.filter(
      (o) => !o.customerId || !validCustomerIds.has(o.customerId)
    );

    // 3. Identify orphan contracts
    const orphanContracts = contracts.filter(
      (c) => !c.customerId || !validCustomerIds.has(c.customerId)
    );

    // 4. Identify orphan quotations
    const orphanQuotes = quotations.filter(
      (q) => !q.customerId || !validCustomerIds.has(q.customerId)
    );

    let hadOrphans = false;

    if (orphanReserves.length > 0) {
      hadOrphans = true;
      const orphanIds = orphanReserves.map((r) => r.id);
      console.log(`[OrphanCleanup] Purging ${orphanReserves.length} orphan reserve items:`, orphanIds);
      setReserveItems((prev) => prev.filter((r) => r.customerId && validCustomerIds.has(r.customerId)));
      batchDeleteReservesFromCloud(orphanIds);
    }

    if (orphanOrders.length > 0) {
      hadOrphans = true;
      const orphanIds = orphanOrders.map((o) => o.id);
      console.log(`[OrphanCleanup] Purging ${orphanOrders.length} orphan order items:`, orphanIds);
      setOrderItems((prev) => prev.filter((o) => o.customerId && validCustomerIds.has(o.customerId)));
      batchDeleteOrdersFromCloud(orphanIds);
    }

    if (orphanContracts.length > 0) {
      hadOrphans = true;
      const orphanIds = orphanContracts.map((c) => c.id);
      console.log(`[OrphanCleanup] Purging ${orphanContracts.length} orphan contracts:`, orphanIds);
      setContracts((prev) => prev.filter((c) => c.customerId && validCustomerIds.has(c.customerId)));
      batchDeleteContractsFromCloud(orphanIds);
    }

    if (orphanQuotes.length > 0) {
      hadOrphans = true;
      const orphanIds = orphanQuotes.map((q) => q.id);
      console.log(`[OrphanCleanup] Purging ${orphanQuotes.length} orphan quotations:`, orphanIds);
      setQuotations((prev) => prev.filter((q) => q.customerId && validCustomerIds.has(q.customerId)));
      batchDeleteQuotationsFromCloud(orphanIds);
    }

    // 5. Self-Healing: Reconcile Sales Rep assignments in ReserveItems and OrderItems with current Customer Master
    const customerMap = new Map(customers.map((c) => [c.id, c]));
    let reservesReconciled = false;
    const reconciledReserves = reserveItems.map((r) => {
      const parentCust = r.customerId ? customerMap.get(r.customerId) : null;
      if (
        parentCust &&
        parentCust.assignedToName &&
        (r.salesRepName !== parentCust.assignedToName || r.salesRepId !== parentCust.assignedToId || r.customerName !== parentCust.name)
      ) {
        reservesReconciled = true;
        return {
          ...r,
          customerName: parentCust.name || r.customerName,
          salesRepId: parentCust.assignedToId,
          salesRepName: parentCust.assignedToName,
        };
      }
      return r;
    });

    if (reservesReconciled) {
      console.log('[SalesReconciliation] Reconciling reserve items with Customer Master assigned Sales');
      setReserveItems(reconciledReserves);
      batchSyncReservesToCloud(reconciledReserves.filter((r) => r.customerId && validCustomerIds.has(r.customerId)));
    }

    let ordersReconciled = false;
    const reconciledOrders = orderItems.map((o) => {
      const parentCust = o.customerId ? customerMap.get(o.customerId) : null;
      if (
        parentCust &&
        parentCust.assignedToName &&
        (o.salesRepName !== parentCust.assignedToName || o.salesRepId !== parentCust.assignedToId || o.customerName !== parentCust.name)
      ) {
        ordersReconciled = true;
        return {
          ...o,
          customerName: parentCust.name || o.customerName,
          salesRepId: parentCust.assignedToId,
          salesRepName: parentCust.assignedToName,
        };
      }
      return o;
    });

    if (ordersReconciled) {
      console.log('[SalesReconciliation] Reconciling order items with Customer Master assigned Sales');
      setOrderItems(reconciledOrders);
      batchSyncOrdersToCloud(reconciledOrders.filter((o) => o.customerId && validCustomerIds.has(o.customerId)));
    }
  }, [customers]);

  // Sync all current state to Google Cloud Firestore on demand
  const syncAllToCloudNow = async () => {
    try {
      setCloudSyncStatus('syncing');
      await Promise.all([
        ...users.map((u) => syncUserToCloud(u)),
        syncCompanyInfoToCloud(companyInfo),
        ...customers.map((c) => syncCustomerToCloud(c)),
        batchSyncProductsToCloud(products),
        batchSyncInventoryToCloud(inventory),
        ...quotations.map((q) => syncQuotationToCloud(q)),
        ...contracts.map((c) => syncContractToCloud(c)),
        batchSyncReservesToCloud(reserveItems),
        batchSyncOrdersToCloud(orderItems),
      ]);
      setCloudSyncStatus('connected');
      setLastCloudSyncTime(new Date());
    } catch (err) {
      console.error('[Firestore] Sync all error:', err);
      setCloudSyncStatus('error');
    }
  };

  // User Profile & Company Info Actions
  const updateUserProfile = async (userData: Partial<User>) => {
    const updatedUser: User = {
      ...currentUser,
      ...userData,
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => {
      const updatedList = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedList));
      return updatedList;
    });
    await syncUserToCloud(updatedUser);
  };

  const updateCompanyInfo = async (info: Partial<CompanyInfo>) => {
    const effectiveLogo = info.logoUrl || info.logo || (info.logoUrl === '' ? '' : companyInfo.logoUrl || companyInfo.logo || '');
    const updated: CompanyInfo = {
      ...companyInfo,
      ...info,
      logoUrl: effectiveLogo,
      logo: effectiveLogo,
      updatedAt: new Date().toISOString(),
    };
    setCompanyInfo(updated);
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updated));
    await syncCompanyInfoToCloud(updated);
  };

  // User management
  const approveManagerC1 = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          // Ensure organizationId is set (create one if missing for backward compat)
          const orgId = u.organizationId || `org-${u.id}`;
          if (!u.organizationId) {
            // Auto-create Organization for approved Level 1
            syncOrganizationToCloud({
              id: orgId,
              ownerId: u.id,
              ownerName: u.name,
              name: u.department || `Doanh nghiệp của ${u.name}`,
              createdAt: new Date().toISOString().split('T')[0],
            });
          }
          return { ...u, status: 'active' as const, organizationId: orgId };
        }
        return u;
      });
      const targetUser = updated.find((u) => u.id === userId);
      if (targetUser) syncUserToCloud(targetUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      return updated;
    });
  };

  const approveUser = (userId: string) => approveManagerC1(userId);

  const rejectManagerC1 = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, status: 'inactive' as const } : u));
      const targetUser = updated.find((u) => u.id === userId);
      if (targetUser) syncUserToCloud(targetUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      return updated;
    });
  };


  const createSalesC2 = (userData: Omit<User, 'id' | 'createdAt' | 'status'>) => {
    const myOrgId = resolveOrganizationId(currentUser, users);
    const newUser: User = {
      ...userData,
      id: `user-sales-${Date.now()}`,
      status: 'active',
      role: 'sales_c2', // Always Level 2
      organizationId: myOrgId, // AUTO-STAMP: inherit manager's organization
      managerId: currentUser.role === 'manager_c1' ? currentUser.id : userData.managerId,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => {
      const updated = [...prev, newUser];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      return updated;
    });
    syncUserToCloud(newUser);
    return newUser;
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const isC1 = currentUser.role === 'manager_c1';
    const myOrgId = resolveOrganizationId(currentUser, users);
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      role: isC1 ? 'sales_c2' : userData.role, // Level 1 can only create Level 2
      organizationId: myOrgId, // AUTO-STAMP: inherit manager's organization
      managerId: isC1 ? currentUser.id : userData.managerId,
      createdBy: currentUser.id,
      department: isC1 ? (currentUser.department || 'Phòng Kinh Doanh') : userData.department,
      status: userData.status || 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => {
      const updated = [...prev, newUser];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      return updated;
    });
    syncUserToCloud(newUser);
    return newUser;
  };

  const updateUser = (updated: User) => {
    // Validate protected fields
    const targetUser = users.find(u => u.id === updated.id);
    if (targetUser) {
      const violations = validateUserUpdate(currentUser, targetUser, updated);
      if (violations.length > 0) {
        console.warn('[PERMISSION DENIED] updateUser violations:', violations);
        // Strip protected field changes for non-Super Admin
        if (currentUser.role !== 'super_admin') {
          updated = {
            ...updated,
            role: targetUser.role,
            organizationId: targetUser.organizationId,
            managerId: targetUser.managerId,
            parentId: targetUser.parentId,
          };
        }
      }
    }
    
    setUsers((prev) => {
      const newList = prev.map((u) => (u.id === updated.id ? updated : u));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newList));
      return newList;
    });
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
    syncUserToCloud(updated);
  };

  const deleteUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    // 1. Remove user from state and storage
    setUsers((prev) => {
      const newList = prev.filter((u) => u.id !== userId);
      safeSetLocalStorage(STORAGE_KEYS.USERS, newList);
      return newList;
    });
    deleteUserFromCloud(userId);

    // 2. If deleting Sales C2: reassign their customers to their Manager C1 so customers are not orphaned
    if (targetUser.role === 'sales_c2') {
      const mgrId = targetUser.managerId || targetUser.createdBy;
      const mgr = users.find((u) => u.id === mgrId);

      if (mgr) {
        setCustomers((prev) => {
          const updated = prev.map((c) => {
            if (c.assignedToId === userId || c.createdBy === userId) {
              const newAssigneeId = c.assignedToId === userId ? mgr.id : c.assignedToId;
              const newAssigneeName = c.assignedToId === userId ? mgr.name : c.assignedToName;
              const newMemberIds = (c.memberIds || []).filter((id) => id !== userId);
              if (!newMemberIds.includes(mgr.id)) newMemberIds.push(mgr.id);
              const updatedCust = {
                ...c,
                assignedToId: newAssigneeId,
                assignedToName: newAssigneeName,
                memberIds: newMemberIds,
                updatedAt: new Date().toISOString().split('T')[0],
              };
              syncCustomerToCloud(updatedCust);
              return updatedCust;
            }
            return c;
          });
          return updated;
        });
      }
    }
  };

  // -------------------------------------------------------------
  // Authentication & Account Management
  // -------------------------------------------------------------
  const login = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    // FALLBACK: If not found in current React state, check localStorage directly.
    // This handles the case where onSnapshot may not have merged the user yet,
    // or where a timing issue caused the user to be dropped from state.
    if (!user) {
      try {
        const savedUsersStr = localStorage.getItem(STORAGE_KEYS.USERS);
        if (savedUsersStr) {
          const savedUsers: User[] = JSON.parse(savedUsersStr);
          const localUser = savedUsers.find((u) => u.email.toLowerCase() === cleanEmail);
          if (localUser) {
            console.info('[Login] User not found in state but found in localStorage. Re-adding to state.');
            user = localUser;
            // Re-add this user to state so they're available going forward
            setUsers((prev) => {
              if (prev.find((u) => u.id === localUser.id)) return prev;
              return [...prev, localUser];
            });
            // Retry cloud sync in case it failed before
            syncUserToCloud(localUser);
          }
        }
      } catch {
        // localStorage parse error — ignore
      }
    }

    if (!user) {
      return {
        success: false,
        message: 'Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại hoặc bấm Đăng Ký.',
      };
    }

    // Block completely disabled accounts
    if (isUserBlocked(user.status)) {
      return {
        success: false,
        message: 'Tài khoản này đang bị khóa hoặc ngừng hoạt động. Vui lòng liên hệ Quản trị viên (Super Admin).',
      };
    }

    // Password verification
    const expectedPassword = user.password || (user.role === 'super_admin' ? 'admin' : '123456');
    if (password && password !== expectedPassword) {
      return {
        success: false,
        message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại hoặc bấm "Quên mật khẩu".',
      };
    }

    // Set auth state — user is authenticated regardless of pending/active
    // App.tsx auth guards will show appropriate screen based on status
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);

    if (isUserPending(user.status)) {
      return {
        success: true,
        message: `Đăng nhập thành công! Lưu ý: Tài khoản "${user.name}" đang ở trạng thái Chờ Super Admin phê duyệt. Bạn sẽ không thể sử dụng các chức năng chính cho đến khi được duyệt.`,
        user,
      };
    }

    return {
      success: true,
      message: `Đăng nhập thành công! Xin chào ${user.name}.`,
      user,
    };
  };

  const register = (userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    department?: string;
    position?: string;
    role?: UserRole;
    managerId?: string;
  }) => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      return {
        success: false,
        message: `Email "${userData.email}" đã tồn tại trên hệ thống. Vui lòng chuyển sang Đăng nhập hoặc sử dụng email khác.`,
      };
    }

    // Public registration is always Level 1 (Chủ doanh nghiệp / Giám đốc C1)
    // Always pending Super Admin approval (status: 'pending')
    const userId = `user-c1-${Date.now()}`;
    const orgId = `org-${Date.now()}`;
    
    // Create Organization for this new Level 1
    const newOrg: Organization = {
      id: orgId,
      ownerId: userId,
      ownerName: userData.name.trim(),
      name: userData.department?.trim() || `Doanh nghiệp của ${userData.name.trim()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const newUser: User = {
      id: userId,
      name: userData.name.trim(),
      email: userData.email.trim(),
      phone: userData.phone.trim() || '0901234567',
      password: userData.password || '123456',
      role: 'manager_c1', // Always Level 1
      department: userData.department?.trim() || 'Ban Quản Lý & Doanh Nghiệp C1',
      position: userData.position?.trim() || 'Giám Đốc / Chủ Doanh Nghiệp',
      status: 'pending', // Always pending Super Admin approval
      organizationId: orgId, // Link to newly created Organization
      createdAt: new Date().toISOString().split('T')[0],
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?w=120&auto=format&fit=crop&q=80`,
    };

    setUsers((prev) => {
      const updated = [...prev, newUser];
      // CRITICAL: Immediately persist to localStorage so the user survives
      // even if Firestore onSnapshot overwrites state before useEffect runs.
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      return updated;
    });
    
    // Sync to cloud (async, may fail if quota exceeded)
    syncUserToCloud(newUser).catch((err) => {
      console.warn('[Register] Cloud sync failed for user, will retry on next session:', err);
    });
    syncOrganizationToCloud(newOrg).catch((err) => {
      console.warn('[Register] Cloud sync failed for organization:', err);
    });

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);

    return {
      success: true,
      message: 'Đăng ký tài khoản Doanh Nghiệp (Level 1) thành công! Hồ sơ của bạn đã được gửi tới Super Admin để xét duyệt kích hoạt.',
      user: newUser,
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    setAuthScreenMode('login');
  };

  const resetPassword = (email: string, newPassword?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const targetUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!targetUser) {
      return {
        success: false,
        message: `Không tìm thấy tài khoản tương ứng với email "${email}". Vui lòng kiểm tra lại.`,
      };
    }

    const updatedPassword = newPassword || '123456';
    const updatedUser: User = {
      ...targetUser,
      password: updatedPassword,
    };

    setUsers((prev) => {
      const newList = prev.map((u) => (u.id === targetUser.id ? updatedUser : u));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newList));
      return newList;
    });
    if (currentUser.id === targetUser.id) {
      setCurrentUser(updatedUser);
    }
    syncUserToCloud(updatedUser);

    return {
      success: true,
      message: `Đã đổi mật khẩu cho tài khoản "${targetUser.name}" (${email}) thành công! Mời bạn đăng nhập với mật khẩu mới.`,
    };
  };

  const quickDemoLogin = (targetUserIdOrRole: string) => {
    let targetUser = users.find((u) => u.id === targetUserIdOrRole || u.role === targetUserIdOrRole);
    if (!targetUser) {
      if (targetUserIdOrRole === 'super_admin') {
        targetUser = users.find((u) => u.role === 'super_admin') || INITIAL_USERS[0];
      } else if (targetUserIdOrRole === 'manager_c1') {
        targetUser = users.find((u) => u.role === 'manager_c1' && u.status === 'active') || INITIAL_USERS[1];
      } else {
        targetUser = users.find((u) => u.role === 'sales_c2') || INITIAL_USERS[3];
      }
    }

    if (targetUser) {
      setCurrentUser(targetUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, targetUser.id);
    }
  };

  // RBAC Filtered Users:
  // - Super Admin: views all users in the system (C1, C2, Admins)
  // - Cấp 1 (Manager): views self and all Cấp 2 accounts created/managed by this Cấp 1
  // - Cấp 2 (Sales): views self only
  // Users - RBAC Filter (organization-scoped):
  // - Super Admin: views ALL users
  // - Level 1: views self + all Level 2 in their organization
  // - Level 2: views only self
  const filteredUsers = users.filter((u) => {
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'manager_c1') {
      const myOrgId = resolveOrganizationId(currentUser, users);
      return (
        u.id === currentUser.id ||
        u.organizationId === myOrgId ||
        u.managerId === currentUser.id ||
        u.createdBy === currentUser.id
      );
    }
    return u.id === currentUser.id;
  });

  // Customers Logic - RBAC Filter:
  // - Super Admin: views ALL customers (system-wide monitoring)
  // - Level 1: views ALL customers within their organization (organizationId match)
  // - Level 2: ONLY views customers they have explicit permission for:
  //   1. Created by this Level 2 (createdBy === userId)
  //   2. Assigned to this Level 2 (assignedToId === userId)
  //   3. Explicitly granted by Level 1 (userId in memberIds[])
  const filteredCustomers = useMemo(() => {
    if (currentUser.role === 'super_admin') {
      return customers; // Super Admin sees all
    }
    
    const myOrgId = resolveOrganizationId(currentUser, users);
    
    // First: filter by organization (tenant isolation)
    const orgCustomers = customers.filter((cust) => cust.organizationId === myOrgId);
    
    if (currentUser.role === 'manager_c1') {
      // Level 1: sees all customers in their organization
      return orgCustomers;
    }
    
    // Level 2: only sees customers they have permission for
    return orgCustomers.filter((cust) => canLevel2AccessCustomer(currentUser.id, cust));
  }, [customers, currentUser, users]);

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'code'>) => {
    const now = new Date().toISOString().split('T')[0];
    const code = `KH-${new Date().getFullYear()}-${String(customers.length + 1).padStart(3, '0')}`;
    const myOrgId = resolveOrganizationId(currentUser, users);
    const creatorId = customerData.createdBy || currentUser.id;
    const assigneeId = customerData.assignedToId || currentUser.id;
    
    // Auto-build memberIds: always include creator and assignee
    const baseMemberIds = customerData.memberIds || [];
    const memberIds = [...new Set([...baseMemberIds, creatorId, assigneeId])];
    
    const newCust: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      code,
      organizationId: myOrgId, // AUTO-STAMP: tenant isolation
      createdBy: creatorId,
      assignedToId: assigneeId,
      assignedToName: customerData.assignedToName || currentUser.name,
      memberIds, // Include creator + assignee in permissions
      createdAt: now,
      updatedAt: now,
    };
    setCustomers((prev) => [newCust, ...prev]);
    syncCustomerToCloud(newCust);
    return newCust;
  };

  const updateCustomer = (updated: Customer) => {
    const now = new Date().toISOString().split('T')[0];
    const itemWithTime = { ...updated, updatedAt: now };
    setCustomers((prev) =>
      prev.map((c) => (c.id === updated.id ? itemWithTime : c))
    );
    syncCustomerToCloud(itemWithTime);

    // Synchronize assigned sales representative to all active reserves and orders for this customer
    setReserveItems((prevReserves) => {
      let changed = false;
      const updatedReserves = prevReserves.map((r) => {
        if (r.customerId === updated.id) {
          changed = true;
          return {
            ...r,
            customerName: updated.name,
            salesRepId: updated.assignedToId,
            salesRepName: updated.assignedToName,
          };
        }
        return r;
      });
      if (changed) {
        batchSyncReservesToCloud(updatedReserves.filter((r) => r.customerId === updated.id));
      }
      return updatedReserves;
    });

    setOrderItems((prevOrders) => {
      let changed = false;
      const updatedOrders = prevOrders.map((o) => {
        if (o.customerId === updated.id) {
          changed = true;
          return {
            ...o,
            customerName: updated.name,
            salesRepId: updated.assignedToId,
            salesRepName: updated.assignedToName,
          };
        }
        return o;
      });
      if (changed) {
        batchSyncOrdersToCloud(updatedOrders.filter((o) => o.customerId === updated.id));
      }
      return updatedOrders;
    });
  };

  const updateCustomerStage = (customerId: string, stage: CustomerStage, rejectReason?: string) => {
    const now = new Date().toISOString().split('T')[0];
    setCustomers((prev) => {
      let targetCust: Customer | null = null;
      const updated = prev.map((c) => {
        if (c.id === customerId) {
          targetCust = {
            ...c,
            stage,
            rejectReason: stage === 'rejected' ? rejectReason : c.rejectReason,
            updatedAt: now,
          };
          return targetCust;
        }
        return c;
      });
      if (targetCust) syncCustomerToCloud(targetCust);
      return updated;
    });
  };

  const assignCustomer = (customerId: string, salesId: string, salesName: string) => {
    const now = new Date().toISOString().split('T')[0];
    let targetCust: Customer | null = null;
    setCustomers((prev) => {
      const updated = prev.map((c) => {
        if (c.id === customerId) {
          // Also add the new assignee to memberIds if not already there
          const currentMemberIds = c.memberIds || [];
          const newMemberIds = currentMemberIds.includes(salesId)
            ? currentMemberIds
            : [...currentMemberIds, salesId];
          targetCust = { ...c, assignedToId: salesId, assignedToName: salesName, memberIds: newMemberIds, updatedAt: now };
          return targetCust;
        }
        return c;
      });
      if (targetCust) syncCustomerToCloud(targetCust);
      return updated;
    });

    // Synchronize assigned sales representative to all active reserves and orders for this customer
    setReserveItems((prevReserves) => {
      let changed = false;
      const updatedReserves = prevReserves.map((r) => {
        if (r.customerId === customerId) {
          changed = true;
          return {
            ...r,
            salesRepId: salesId,
            salesRepName: salesName,
          };
        }
        return r;
      });
      if (changed) {
        batchSyncReservesToCloud(updatedReserves.filter((r) => r.customerId === customerId));
      }
      return updatedReserves;
    });

    setOrderItems((prevOrders) => {
      let changed = false;
      const updatedOrders = prevOrders.map((o) => {
        if (o.customerId === customerId) {
          changed = true;
          return {
            ...o,
            salesRepId: salesId,
            salesRepName: salesName,
          };
        }
        return o;
      });
      if (changed) {
        batchSyncOrdersToCloud(updatedOrders.filter((o) => o.customerId === customerId));
      }
      return updatedOrders;
    });
  };

  const deleteCustomer = (customerId: string) => {
    // 1. Remove customer from state and Cloud Firestore
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    deleteCustomerFromCloud(customerId);
    deleteCustomerMemberFromCloud(`cm-${customerId}`);

    // 2. Cascade delete all quotations for this customer
    const quotesToDelete = quotations.filter((q) => q.customerId === customerId);
    if (quotesToDelete.length > 0) {
      const quoteIds = quotesToDelete.map((q) => q.id);
      setQuotations((prev) => prev.filter((q) => q.customerId !== customerId));
      batchDeleteQuotationsFromCloud(quoteIds);
    }

    // 3. Cascade delete all contracts for this customer
    const contractsToDelete = contracts.filter((c) => c.customerId === customerId);
    if (contractsToDelete.length > 0) {
      const contractIds = contractsToDelete.map((c) => c.id);
      setContracts((prev) => prev.filter((c) => c.customerId !== customerId));
      batchDeleteContractsFromCloud(contractIds);
    }

    // 4. Cascade delete all reserve items for this customer & identify affected SKUs
    const reservesToDelete = reserveItems.filter((r) => r.customerId === customerId);
    const affectedSkus = new Set<string>();

    if (reservesToDelete.length > 0) {
      const reserveIds = reservesToDelete.map((r) => r.id);
      reservesToDelete.forEach((r) => {
        if (r.sku) affectedSkus.add(r.sku.trim().toLowerCase());
      });

      setReserveItems((prev) => prev.filter((r) => r.customerId !== customerId));
      batchDeleteReservesFromCloud(reserveIds);
    }

    // 5. Cascade delete all order items for this customer
    const ordersToDelete = orderItems.filter((o) => o.customerId === customerId);
    if (ordersToDelete.length > 0) {
      const orderIds = ordersToDelete.map((o) => o.id);
      setOrderItems((prev) => prev.filter((o) => o.customerId !== customerId));
      batchDeleteOrdersFromCloud(orderIds);
    }

    // 6. CRITICAL: Release reserved quantity and re-calculate available inventory for all affected SKUs
    if (affectedSkus.size > 0) {
      setInventory((prevInv) => {
        // Remaining valid holding reserves for other customers
        const remainingHoldingReserves = reserveItems.filter(
          (r) => r.customerId !== customerId && r.status === 'holding'
        );
        const reserveMap = new Map<string, number>();
        remainingHoldingReserves.forEach((r) => {
          const cleanSku = (r.sku || '').trim().toLowerCase();
          reserveMap.set(cleanSku, (reserveMap.get(cleanSku) || 0) + (r.reservedQuantity || 0));
        });

        const updatedInv = prevInv.map((item) => {
          const cleanSku = (item.sku || '').trim().toLowerCase();
          if (affectedSkus.has(cleanSku)) {
            const actualReserved = reserveMap.get(cleanSku) || 0;
            const actualAvailable = Math.max(0, (item.totalQuantity || 0) - actualReserved);
            return {
              ...item,
              reservedQuantity: actualReserved,
              availableQuantity: actualAvailable,
              updatedAt: new Date().toISOString().split('T')[0],
            };
          }
          return item;
        });

        saveInventoryToIndexedDB(updatedInv);
        const changedItems = updatedInv.filter((i) => affectedSkus.has((i.sku || '').trim().toLowerCase()));
        if (changedItems.length > 0) {
          batchSyncInventoryToCloud(changedItems);
        }
        return updatedInv;
      });
    }
  };

  // =========================================================================
  // Customer Member Permission Management (Level 1 grants/revokes Level 2 access)
  // =========================================================================
  
  /**
   * Grant a Level 2 user access to a specific customer.
   * Only Level 1 (of the same org) or Super Admin can call this.
   */
  const grantCustomerAccess = (customerId: string, userId: string, userName: string) => {
    // Update memberIds on Customer document
    setCustomers((prev) => {
      let targetCust: Customer | null = null;
      const updated = prev.map((c) => {
        if (c.id === customerId) {
          const currentMemberIds = c.memberIds || [];
          if (!currentMemberIds.includes(userId)) {
            targetCust = { ...c, memberIds: [...currentMemberIds, userId], updatedAt: new Date().toISOString().split('T')[0] };
            return targetCust;
          }
          return c; // Already has access
        }
        return c;
      });
      if (targetCust) syncCustomerToCloud(targetCust);
      return updated;
    });

    // Also create CustomerMember record in Firestore
    const member: CustomerMember = {
      id: `cm-${customerId}-${userId}`,
      customerId,
      userId,
      userName,
      organizationId: resolveOrganizationId(currentUser, users),
      createdBy: currentUser.id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    syncCustomerMemberToCloud(member);
  };

  /**
   * Revoke a Level 2 user's access to a specific customer.
   * Only Level 1 (of the same org) or Super Admin can call this.
   */
  const revokeCustomerAccess = (customerId: string, userId: string) => {
    // Remove from memberIds on Customer document
    setCustomers((prev) => {
      let targetCust: Customer | null = null;
      const updated = prev.map((c) => {
        if (c.id === customerId) {
          const currentMemberIds = c.memberIds || [];
          if (currentMemberIds.includes(userId)) {
            targetCust = { ...c, memberIds: currentMemberIds.filter((id) => id !== userId), updatedAt: new Date().toISOString().split('T')[0] };
            return targetCust;
          }
          return c;
        }
        return c;
      });
      if (targetCust) syncCustomerToCloud(targetCust);
      return updated;
    });

    // Also delete CustomerMember record from Firestore
    deleteCustomerMemberFromCloud(`cm-${customerId}-${userId}`);
  };

  // Active Company Scope for the logged in user
  const companyScope = useMemo(() => {
    return getCompanyScopeForUser(currentUser, users);
  }, [currentUser, users]);

  // Products Data Giá - Scoped by Company:
  // - Super Admin: returns [] (Super Admin quản trị hệ thống tài khoản & công ty, không can thiệp bảng giá bán lẻ của các C1)
  // - Cấp 1 (Công ty A): CHỈ xem & quản lý data giá của công ty A
  // - Cấp 2 (Sales của C1): Xem và dùng chung data giá của công ty C1 quản lý
  const filteredProducts = useMemo(() => {
    if (currentUser.role === 'super_admin') {
      return [];
    }
    const myOrgId = resolveOrganizationId(currentUser, users);
    const myCompanyId = companyScope.companyId || myOrgId;

    return products.filter((p) => {
      const pOrg = p.organizationId || p.companyId;
      if (pOrg) {
        return pOrg === myOrgId || pOrg === myCompanyId;
      }
      // Backward compatibility nếu data cũ chưa gắn organizationId/companyId
      if (currentUser.role === 'manager_c1') {
        return p.createdBy === currentUser.id;
      }
      if (currentUser.role === 'sales_c2') {
        const mgrId = currentUser.managerId || currentUser.createdBy;
        return p.createdBy === currentUser.id || (mgrId ? p.createdBy === mgrId : false);
      }
      return false;
    });
  }, [products, currentUser, companyScope, users]);

  const addProduct = (prod: ProductPriceItem) => {
    const myCompanyId = companyScope.companyId;
    const stampedProd: ProductPriceItem = {
      ...prod,
      companyId: myCompanyId,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
    };

    setProducts((prev) => {
      // Remove any item with same SKU in THIS company
      const otherItems = prev.filter(
        (p) => !(p.sku.trim().toUpperCase() === prod.sku.trim().toUpperCase() && (p.companyId === myCompanyId || !p.companyId))
      );
      const updated = [stampedProd, ...otherItems];
      return updated;
    });
    syncProductToCloud(stampedProd);

    // Also create corresponding inventory item if not exists for this company
    setInventory((prev) => {
      if (!prev.some((item) => item.sku.trim().toUpperCase() === prod.sku.trim().toUpperCase() && item.companyId === myCompanyId)) {
        const newInv: InventoryItem = {
          sku: prod.sku,
          name: prod.name,
          unit: prod.unit,
          totalQuantity: 0,
          reservedQuantity: 0,
          availableQuantity: 0,
          warehouseLocation: 'Kho Mới',
          updatedAt: new Date().toISOString().split('T')[0],
          companyId: myCompanyId,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        };
        syncInventoryItemToCloud(newInv);
        return [...prev, newInv];
      }
      return prev;
    });
  };

  const updateProduct = (updated: ProductPriceItem) => {
    const myCompanyId = companyScope.companyId;
    const stampedProd: ProductPriceItem = {
      ...updated,
      companyId: updated.companyId || myCompanyId,
      createdBy: updated.createdBy || currentUser.id,
      createdByName: updated.createdByName || currentUser.name,
    };

    setProducts((prev) =>
      prev.map((p) =>
        p.sku.trim().toUpperCase() === updated.sku.trim().toUpperCase() && (p.companyId === stampedProd.companyId || !p.companyId)
          ? stampedProd
          : p
      )
    );
    syncProductToCloud(stampedProd);

    setInventory((prev) => {
      const updatedList = prev.map((inv) => {
        if (inv.sku.trim().toUpperCase() === updated.sku.trim().toUpperCase() && (inv.companyId === stampedProd.companyId || !inv.companyId)) {
          const syncedInv = { ...inv, name: updated.name, unit: updated.unit, companyId: stampedProd.companyId };
          syncInventoryItemToCloud(syncedInv);
          return syncedInv;
        }
        return inv;
      });
      return updatedList;
    });
  };

  const deleteProduct = (sku: string) => {
    const myCompanyId = companyScope.companyId;
    setProducts((prev) =>
      prev.filter(
        (p) => !(p.sku.trim().toUpperCase() === sku.trim().toUpperCase() && (p.companyId === myCompanyId || !p.companyId))
      )
    );
    deleteProductFromCloud(sku, myCompanyId);

    // Also delete inventory item for this company
    setInventory((prev) =>
      prev.filter(
        (i) => !(i.sku.trim().toUpperCase() === sku.trim().toUpperCase() && (i.companyId === myCompanyId || !i.companyId))
      )
    );
    deleteInventoryItemFromCloud(sku, myCompanyId);
  };

  const importProducts = (newProducts: ProductPriceItem[]) => {
    const myOrgId = resolveOrganizationId(currentUser, users);
    const myCompanyId = companyScope.companyId || myOrgId;

    const stampedProducts: ProductPriceItem[] = newProducts.map((p) =>
      normalizeProductPriceItem(p, myOrgId, currentUser.id, currentUser.name)
    );

    console.log('[PRICE_IMPORT] NORMALIZED count:', stampedProducts.length);
    console.log('[PRICE_IMPORT] STAMPED count:', stampedProducts.length, 'org:', myOrgId);

    setProducts((prev) => {
      // Products belonging explicitly to OTHER organizations
      const otherOrgProducts = prev.filter((p) => {
        const pOrg = p.organizationId || p.companyId;
        return pOrg && pOrg !== myOrgId && pOrg !== myCompanyId;
      });

      // Products belonging to current org OR unassigned products
      const myMap = new Map<string, ProductPriceItem>();
      prev.filter((p) => {
        const pOrg = p.organizationId || p.companyId;
        return !pOrg || pOrg === myOrgId || pOrg === myCompanyId;
      }).forEach((p) => {
        const stampedExisting = normalizeProductPriceItem(p, myOrgId, currentUser.id, currentUser.name);
        myMap.set(stampedExisting.sku, stampedExisting);
      });

      // Overlay newly imported products
      stampedProducts.forEach((p) => myMap.set(p.sku, p));

      const updatedCompanyProducts = Array.from(myMap.values());
      const fullList = [...otherOrgProducts, ...updatedCompanyProducts];
      
      console.log('[PRICE_IMPORT] STORE_UPDATED full products count:', fullList.length);

      // Save to IndexedDB (Zero localStorage usage)
      saveProductsToIndexedDB(fullList);

      return fullList;
    });

    // Ensure inventory entries exist for this company
    setInventory((prev) => {
      const otherOrgInventory = prev.filter((i) => {
        const iOrg = i.organizationId || i.companyId;
        return iOrg && iOrg !== myOrgId && iOrg !== myCompanyId;
      });

      const myInvMap = new Map<string, InventoryItem>();
      prev.filter((i) => {
        const iOrg = i.organizationId || i.companyId;
        return !iOrg || iOrg === myOrgId || iOrg === myCompanyId;
      }).forEach((i) => {
        const stampedInv: InventoryItem = {
          ...i,
          organizationId: i.organizationId || myOrgId,
          companyId: i.companyId || myCompanyId,
          createdBy: i.createdBy || currentUser.id || 'system',
          createdByName: i.createdByName || currentUser.name || 'System Manager',
        };
        myInvMap.set((i.sku || '').toUpperCase(), stampedInv);
      });

      const newlyAdded: InventoryItem[] = [];
      stampedProducts.forEach((p) => {
        const skuKey = (p.sku || '').toUpperCase();
        if (skuKey && !myInvMap.has(skuKey)) {
          const item: InventoryItem = {
            sku: p.sku,
            name: p.name,
            unit: p.unit,
            totalQuantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            warehouseLocation: 'Kho Mới',
            updatedAt: new Date().toISOString().split('T')[0],
            organizationId: myOrgId,
            companyId: myCompanyId,
            createdBy: currentUser.id || 'system',
            createdByName: currentUser.name || 'System Manager',
          };
          myInvMap.set(skuKey, item);
          newlyAdded.push(item);
        }
      });

      if (newlyAdded.length > 0) {
        batchSyncInventoryToCloud(newlyAdded);
      }

      const fullInvList = [...otherOrgInventory, ...Array.from(myInvMap.values())];
      saveInventoryToIndexedDB(fullInvList);
      return fullInvList;
    });

    // Trigger cloud sync outside state updater
    console.log('[PRICE_IMPORT] FIRESTORE_SYNC_START');
    batchSyncProductsToCloud(stampedProducts)
      .then(() => console.log('[PRICE_IMPORT] FIRESTORE_SAVED count:', stampedProducts.length))
      .catch((err) => console.error('[PRICE_IMPORT] FIRESTORE_SYNC_ERROR:', err));
  };

  const importPriceRecords = (records: PriceImportRecord[], mode: 'upsert' | 'new_only' = 'upsert') => {
    console.log('[PRICE_IMPORT] INPUT_RECORDS count:', records.length, 'mode:', mode);

    const existingSkuSet = new Set(products.map((p) => (p.sku || '').toUpperCase()).filter(Boolean));

    let filteredRecords = records;
    if (mode === 'new_only') {
      filteredRecords = records.filter((r) => !existingSkuSet.has((r.product_code || '').toUpperCase()));
    }

    console.log('[PRICE_IMPORT] VALIDATED count:', filteredRecords.length);

    const convertedProducts: ProductPriceItem[] = filteredRecords.map((r) => ({
      sku: (r.product_code || '').trim().toUpperCase(),
      name: (r.product_name || '').trim() || `Sản phẩm ${(r.product_code || '').trim().toUpperCase()}`,
      category: (r.category || '').trim() || 'Chung',
      brand: (r.brand || '').trim() || 'Khác',
      color: (r.color || '').trim() || 'Tiêu chuẩn',
      size: (r.size || '').trim() || 'Tiêu chuẩn',
      unit: (r.unit || '').trim() || 'Bộ',
      listPrice: typeof r.price === 'number' && !isNaN(r.price) ? r.price : 0,
      dpPrice: typeof r.dp_price === 'number' && !isNaN(r.dp_price) ? r.dp_price : 0,
      description: (r.description || '').trim(),
      status: 'active',
    }));

    importProducts(convertedProducts);
  };

  // Inventory Tồn kho - Unified Inventory Engine (Single Source of Truth for Sales & Warehouse):
  const filteredInventory = useMemo(() => {
    const validCustomerIds = new Set(customers.map((c) => c.id));
    const myOrgId = resolveOrganizationId(currentUser, users);
    const myCompanyId = companyScope.companyId || myOrgId;

    // 1. Calculate active holding reserves for valid customers
    const reserveMap = new Map<string, number>();
    reserveItems.forEach((r) => {
      if (r.status === 'holding' && r.customerId && validCustomerIds.has(r.customerId)) {
        if (currentUser.role === 'super_admin' || !r.organizationId || r.organizationId === myOrgId) {
          const cleanSku = (r.sku || '').trim().toUpperCase();
          reserveMap.set(cleanSku, (reserveMap.get(cleanSku) || 0) + (r.reservedQuantity || 0));
        }
      }
    });

    // 2. Calculate active pending / ordered PO quantities
    const orderMap = new Map<string, number>();
    orderItems.forEach((o) => {
      if (
        (o.status === 'pending_order' || o.status === 'ordered') &&
        o.customerId &&
        validCustomerIds.has(o.customerId)
      ) {
        if (currentUser.role === 'super_admin' || !o.organizationId || o.organizationId === myOrgId) {
          const cleanSku = (o.sku || '').trim().toUpperCase();
          orderMap.set(cleanSku, (orderMap.get(cleanSku) || 0) + (o.orderQuantity || 0));
        }
      }
    });

    // 3. Filter inventory items based on role / organization
    const scopedInventory = inventory.filter((item) => {
      if (currentUser.role === 'super_admin') return true;
      const itemOrg = item.organizationId || item.companyId;
      if (itemOrg) {
        return itemOrg === myOrgId || itemOrg === myCompanyId;
      }
      if (currentUser.role === 'manager_c1') {
        return item.createdBy === currentUser.id;
      }
      if (currentUser.role === 'sales_c2') {
        const mgrId = currentUser.managerId || currentUser.createdBy;
        return item.createdBy === currentUser.id || (mgrId ? item.createdBy === mgrId : false);
      }
      return true;
    });

    // 4. Compute On Hand, Reserved, Available, On Order, Reorder Needed
    return scopedInventory.map((item) => {
      const cleanSku = (item.sku || '').trim().toUpperCase();
      const actualOnHand = typeof item.totalQuantity === 'number' && !isNaN(item.totalQuantity) ? Math.max(0, item.totalQuantity) : 0;
      const actualReserved = reserveMap.get(cleanSku) || 0;
      const actualAvailable = Math.max(0, actualOnHand - actualReserved);
      const actualOnOrder = orderMap.get(cleanSku) || 0;
      const reorderNeeded = Math.max(0, actualReserved - actualAvailable - actualOnOrder);

      return {
        ...item,
        totalQuantity: actualOnHand,
        reservedQuantity: actualReserved,
        availableQuantity: actualAvailable,
        onOrderQuantity: actualOnOrder,
        reorderNeeded,
      };
    });
  }, [inventory, reserveItems, orderItems, currentUser, companyScope, users, customers]);

  // Stock Transaction Logging
  const addStockTransaction = (txData: Omit<StockTransaction, 'id' | 'timestamp' | 'date'>): StockTransaction => {
    const now = new Date();
    const newTx: StockTransaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      organizationId: txData.organizationId || resolveOrganizationId(currentUser, users),
    };
    setStockTransactions((prev) => [newTx, ...prev]);
    syncStockTransactionToCloud(newTx);
    return newTx;
  };

  const updateInventoryItem = (item: InventoryItem) => {
    const myCompanyId = companyScope.companyId;
    const available = Math.max(0, item.totalQuantity - item.reservedQuantity);
    const updated: InventoryItem = {
      ...item,
      companyId: item.companyId || myCompanyId,
      createdBy: item.createdBy || currentUser.id,
      createdByName: item.createdByName || currentUser.name,
      availableQuantity: available,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setInventory((prev) => {
      const newInv = prev.map((i) =>
        i.sku.trim().toUpperCase() === item.sku.trim().toUpperCase() && (i.companyId === updated.companyId || !i.companyId)
          ? updated
          : i
      );
      saveInventoryToIndexedDB(newInv);
      return newInv;
    });
    syncInventoryItemToCloud(updated);
  };

  const addInventoryItem = (newItem: Omit<InventoryItem, 'availableQuantity' | 'reservedQuantity' | 'updatedAt'>) => {
    const myCompanyId = companyScope.companyId;
    const now = new Date().toISOString().split('T')[0];
    const created: InventoryItem = {
      ...newItem,
      companyId: myCompanyId,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      reservedQuantity: 0,
      availableQuantity: newItem.totalQuantity,
      updatedAt: now,
    };
    setInventory((prev) => {
      const filtered = prev.filter(
        (i) => !(i.sku.trim().toUpperCase() === newItem.sku.trim().toUpperCase() && (i.companyId === myCompanyId || !i.companyId))
      );
      const newInv = [created, ...filtered];
      saveInventoryToIndexedDB(newInv);
      return newInv;
    });
    syncInventoryItemToCloud(created);

    addStockTransaction({
      sku: created.sku,
      productName: created.name,
      unit: created.unit,
      type: 'IMPORT',
      deltaQuantity: created.totalQuantity,
      beforeOnHand: 0,
      afterOnHand: created.totalQuantity,
      referenceCode: 'THÊM MỚI MÃ HÀNG',
      performedById: currentUser.id,
      performedByName: currentUser.name,
      organizationId: created.organizationId || myCompanyId,
      notes: 'Thêm mới mã hàng vào danh mục tồn kho',
    });
  };

  const deleteInventoryItem = (sku: string) => {
    const myCompanyId = companyScope.companyId;
    setInventory((prev) => {
      const newInv = prev.filter(
        (i) => !(i.sku.trim().toUpperCase() === sku.trim().toUpperCase() && (i.companyId === myCompanyId || !i.companyId))
      );
      saveInventoryToIndexedDB(newInv);
      return newInv;
    });
    deleteInventoryItemFromCloud(sku, myCompanyId);
  };

  const quickAdjustStock = (sku: string, deltaQty: number, notes?: string) => {
    const myOrgId = resolveOrganizationId(currentUser, users);
    const myCompanyId = companyScope.companyId || myOrgId;
    let oldOnHand = 0;
    let newOnHand = 0;
    let targetProdName = sku;
    let targetUnit = 'Bộ';

    setInventory((prev) => {
      let targetItem: InventoryItem | null = null;
      const updated = prev.map((item) => {
        if (item.sku.trim().toUpperCase() === sku.trim().toUpperCase() && (item.companyId === myCompanyId || !item.companyId)) {
          oldOnHand = item.totalQuantity || 0;
          newOnHand = Math.max(0, oldOnHand + deltaQty);
          const newAvailable = Math.max(0, newOnHand - (item.reservedQuantity || 0));
          targetProdName = item.name;
          targetUnit = item.unit || 'Bộ';
          targetItem = {
            ...item,
            totalQuantity: newOnHand,
            availableQuantity: newAvailable,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return targetItem;
        }
        return item;
      });
      if (targetItem) {
        syncInventoryItemToCloud(targetItem);
        saveInventoryToIndexedDB(updated);
      }
      return updated;
    });

    if (deltaQty !== 0) {
      addStockTransaction({
        sku,
        productName: targetProdName,
        unit: targetUnit,
        type: 'ADJUSTMENT',
        deltaQuantity: deltaQty,
        beforeOnHand: oldOnHand,
        afterOnHand: newOnHand,
        referenceCode: 'ĐIỀU CHỈNH NHANH',
        performedById: currentUser.id,
        performedByName: currentUser.name,
        organizationId: myOrgId,
        notes: notes || `Điều chỉnh nhanh tồn kho: ${deltaQty > 0 ? `+${deltaQty}` : deltaQty}`,
      });
    }
  };

  // Stock In Voucher Actions
  const createStockInVoucher = (data: Omit<StockInVoucher, 'id' | 'voucherNumber' | 'createdAt' | 'updatedAt'>): StockInVoucher => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const voucherNumber = `PNK-${dateStr}-${rand}`;
    const myOrgId = resolveOrganizationId(currentUser, users);

    const newVoucher: StockInVoucher = {
      ...data,
      id: `pnk-${Date.now()}-${rand}`,
      voucherNumber,
      organizationId: data.organizationId || myOrgId,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: data.status || 'DRAFT',
    };

    setStockInVouchers((prev) => [newVoucher, ...prev]);
    syncStockInVoucherToCloud(newVoucher);
    return newVoucher;
  };

  const confirmStockInVoucher = async (voucherId: string) => {
    const voucher = stockInVouchers.find((v) => v.id === voucherId);
    if (!voucher || voucher.status === 'CONFIRMED') return;

    const now = new Date();
    const myOrgId = resolveOrganizationId(currentUser, users);
    const myCompanyId = companyScope.companyId || myOrgId;

    // 1. Update voucher status to CONFIRMED
    const updatedVoucher: StockInVoucher = {
      ...voucher,
      status: 'CONFIRMED',
      confirmedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    setStockInVouchers((prev) => prev.map((v) => (v.id === voucherId ? updatedVoucher : v)));
    syncStockInVoucherToCloud(updatedVoucher);

    // 2. Increment On Hand for each item in the voucher
    const itemMap = new Map<string, number>();
    voucher.items.forEach((item) => {
      const cleanSku = item.sku.trim().toUpperCase();
      itemMap.set(cleanSku, (itemMap.get(cleanSku) || 0) + (item.actualQuantity || item.expectedQuantity || 0));
    });

    setInventory((prev) => {
      const updated = prev.map((inv) => {
        const cleanSku = inv.sku.trim().toUpperCase();
        if (itemMap.has(cleanSku)) {
          const addQty = itemMap.get(cleanSku) || 0;
          const oldOnHand = inv.totalQuantity || 0;
          const newOnHand = oldOnHand + addQty;
          const newAvailable = Math.max(0, newOnHand - (inv.reservedQuantity || 0));

          // Log StockTransaction
          addStockTransaction({
            sku: inv.sku,
            productName: inv.name,
            unit: inv.unit,
            type: 'STOCK_IN',
            deltaQuantity: addQty,
            beforeOnHand: oldOnHand,
            afterOnHand: newOnHand,
            referenceCode: updatedVoucher.voucherNumber,
            partnerName: updatedVoucher.supplierName,
            performedById: currentUser.id,
            performedByName: currentUser.name,
            organizationId: myOrgId,
            notes: `Nhập kho theo ${updatedVoucher.voucherNumber} từ NCC ${updatedVoucher.supplierName}`,
          });

          return {
            ...inv,
            totalQuantity: newOnHand,
            availableQuantity: newAvailable,
            updatedAt: now.toISOString().split('T')[0],
          };
        }
        return inv;
      });

      saveInventoryToIndexedDB(updated);
      const changed = updated.filter((i) => itemMap.has(i.sku.trim().toUpperCase()));
      if (changed.length > 0) batchSyncInventoryToCloud(changed);
      return updated;
    });
  };

  const cancelStockInVoucher = async (voucherId: string) => {
    const voucher = stockInVouchers.find((v) => v.id === voucherId);
    if (!voucher || voucher.status === 'CONFIRMED') return;

    const updatedVoucher: StockInVoucher = {
      ...voucher,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };
    setStockInVouchers((prev) => prev.map((v) => (v.id === voucherId ? updatedVoucher : v)));
    syncStockInVoucherToCloud(updatedVoucher);
  };

  // Stock Out Voucher Actions
  const createStockOutVoucher = (data: Omit<StockOutVoucher, 'id' | 'voucherNumber' | 'createdAt' | 'updatedAt'>): StockOutVoucher => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const voucherNumber = `PXK-${dateStr}-${rand}`;
    const myOrgId = resolveOrganizationId(currentUser, users);

    const newVoucher: StockOutVoucher = {
      ...data,
      id: `pxk-${Date.now()}-${rand}`,
      voucherNumber,
      organizationId: data.organizationId || myOrgId,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: data.status || 'DRAFT',
    };

    setStockOutVouchers((prev) => [newVoucher, ...prev]);
    syncStockOutVoucherToCloud(newVoucher);
    return newVoucher;
  };

  const confirmStockOutVoucher = async (voucherId: string) => {
    const voucher = stockOutVouchers.find((v) => v.id === voucherId);
    if (!voucher || voucher.status === 'CONFIRMED') return;

    const now = new Date();
    const myOrgId = resolveOrganizationId(currentUser, users);

    // 1. Update voucher status to CONFIRMED
    const updatedVoucher: StockOutVoucher = {
      ...voucher,
      status: 'CONFIRMED',
      confirmedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    setStockOutVouchers((prev) => prev.map((v) => (v.id === voucherId ? updatedVoucher : v)));
    syncStockOutVoucherToCloud(updatedVoucher);

    // 2. Decrement On Hand for each item in the voucher
    const itemMap = new Map<string, number>();
    voucher.items.forEach((item) => {
      const cleanSku = item.sku.trim().toUpperCase();
      itemMap.set(cleanSku, (itemMap.get(cleanSku) || 0) + (item.quantity || 0));
    });

    setInventory((prev) => {
      const updated = prev.map((inv) => {
        const cleanSku = inv.sku.trim().toUpperCase();
        if (itemMap.has(cleanSku)) {
          const deductQty = itemMap.get(cleanSku) || 0;
          const oldOnHand = inv.totalQuantity || 0;
          const newOnHand = Math.max(0, oldOnHand - deductQty);
          const newAvailable = Math.max(0, newOnHand - (inv.reservedQuantity || 0));

          // Log StockTransaction
          addStockTransaction({
            sku: inv.sku,
            productName: inv.name,
            unit: inv.unit,
            type: 'STOCK_OUT',
            deltaQuantity: -deductQty,
            beforeOnHand: oldOnHand,
            afterOnHand: newOnHand,
            referenceCode: updatedVoucher.voucherNumber,
            partnerName: updatedVoucher.customerName || updatedVoucher.contractNumber,
            performedById: currentUser.id,
            performedByName: currentUser.name,
            organizationId: myOrgId,
            notes: `Xuất kho theo ${updatedVoucher.voucherNumber} cho HĐ ${updatedVoucher.contractNumber || '---'} (Khách: ${updatedVoucher.customerName || '---'})`,
          });

          return {
            ...inv,
            totalQuantity: newOnHand,
            availableQuantity: newAvailable,
            updatedAt: now.toISOString().split('T')[0],
          };
        }
        return inv;
      });

      saveInventoryToIndexedDB(updated);
      const changed = updated.filter((i) => itemMap.has(i.sku.trim().toUpperCase()));
      if (changed.length > 0) batchSyncInventoryToCloud(changed);
      return updated;
    });

    // 3. If linked to a reserveId, update reserve status to dispatched
    if (voucher.reserveId) {
      updateReserveStatus(voucher.reserveId, 'dispatched');
    }
  };

  const cancelStockOutVoucher = async (voucherId: string) => {
    const voucher = stockOutVouchers.find((v) => v.id === voucherId);
    if (!voucher || voucher.status === 'CONFIRMED') return;

    const updatedVoucher: StockOutVoucher = {
      ...voucher,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };
    setStockOutVouchers((prev) => prev.map((v) => (v.id === voucherId ? updatedVoucher : v)));
    syncStockOutVoucherToCloud(updatedVoucher);
  };

  // Stock Audit Voucher Actions
  const createStockAuditVoucher = (data: Omit<StockAuditVoucher, 'id' | 'voucherNumber' | 'createdAt' | 'updatedAt'>): StockAuditVoucher => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const voucherNumber = `PKK-${dateStr}-${rand}`;
    const myOrgId = resolveOrganizationId(currentUser, users);

    const newVoucher: StockAuditVoucher = {
      ...data,
      id: `pkk-${Date.now()}-${rand}`,
      voucherNumber,
      organizationId: data.organizationId || myOrgId,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: data.status || 'DRAFT',
    };

    setStockAuditVouchers((prev) => [newVoucher, ...prev]);
    syncStockAuditVoucherToCloud(newVoucher);
    return newVoucher;
  };

  const confirmStockAuditVoucher = async (voucherId: string) => {
    const voucher = stockAuditVouchers.find((v) => v.id === voucherId);
    if (!voucher || voucher.status === 'CONFIRMED') return;

    const now = new Date();
    const myOrgId = resolveOrganizationId(currentUser, users);

    // 1. Update voucher status to CONFIRMED
    const updatedVoucher: StockAuditVoucher = {
      ...voucher,
      status: 'CONFIRMED',
      confirmedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    setStockAuditVouchers((prev) => prev.map((v) => (v.id === voucherId ? updatedVoucher : v)));
    syncStockAuditVoucherToCloud(updatedVoucher);

    // 2. Adjust On Hand to actualQuantity for each audited item
    const itemMap = new Map<string, { actualQty: number; diff: number; reason?: string }>();
    voucher.items.forEach((item) => {
      const cleanSku = item.sku.trim().toUpperCase();
      itemMap.set(cleanSku, { actualQty: item.actualQuantity, diff: item.difference, reason: item.reason });
    });

    setInventory((prev) => {
      const updated = prev.map((inv) => {
        const cleanSku = inv.sku.trim().toUpperCase();
        if (itemMap.has(cleanSku)) {
          const auditInfo = itemMap.get(cleanSku)!;
          const oldOnHand = inv.totalQuantity || 0;
          const newOnHand = Math.max(0, auditInfo.actualQty);
          const newAvailable = Math.max(0, newOnHand - (inv.reservedQuantity || 0));

          // Log StockTransaction
          addStockTransaction({
            sku: inv.sku,
            productName: inv.name,
            unit: inv.unit,
            type: 'AUDIT_ADJUSTMENT',
            deltaQuantity: auditInfo.diff,
            beforeOnHand: oldOnHand,
            afterOnHand: newOnHand,
            referenceCode: updatedVoucher.voucherNumber,
            performedById: currentUser.id,
            performedByName: currentUser.name,
            organizationId: myOrgId,
            notes: `Cân bằng tồn theo phiếu kiểm kê ${updatedVoucher.voucherNumber}. Lý do: ${auditInfo.reason || 'Kiểm kê định kỳ'}`,
          });

          return {
            ...inv,
            totalQuantity: newOnHand,
            availableQuantity: newAvailable,
            updatedAt: now.toISOString().split('T')[0],
          };
        }
        return inv;
      });

      saveInventoryToIndexedDB(updated);
      const changed = updated.filter((i) => itemMap.has(i.sku.trim().toUpperCase()));
      if (changed.length > 0) batchSyncInventoryToCloud(changed);
      return updated;
    });
  };

  const cancelStockAuditVoucher = async (voucherId: string) => {
    const voucher = stockAuditVouchers.find((v) => v.id === voucherId);
    if (!voucher || voucher.status === 'CONFIRMED') return;

    const updatedVoucher: StockAuditVoucher = {
      ...voucher,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };
    setStockAuditVouchers((prev) => prev.map((v) => (v.id === voucherId ? updatedVoucher : v)));
    syncStockAuditVoucherToCloud(updatedVoucher);
  };

  const receiveOrderToWarehouseAndReserve = (orderId: string, warehouseLocation?: string) => {
    const order = orderItems.find((o) => o.id === orderId);
    if (!order) return;

    const myCompanyId = companyScope.companyId;
    const contract = contracts.find((c) => c.id === order.contractId);
    const loc = warehouseLocation || 'Kho Tổng TP.HCM (Kệ A1)';
    const now = new Date().toISOString().split('T')[0];

    // 1. Mark order item as arrived_in_stock
    const updatedOrder: OrderItem = {
      ...order,
      status: 'arrived_in_stock',
      notes: `${order.notes || ''} [Đã nhập kho ngày ${now}]`.trim(),
    };
    setOrderItems((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    syncOrderItemToCloud(updatedOrder);

    // 2. Increase inventory totalQuantity for this company
    setInventory((prev) => {
      const existing = prev.find(
        (i) => i.sku.trim().toUpperCase() === order.sku.trim().toUpperCase() && (i.companyId === myCompanyId || !i.companyId)
      );
      let updatedInv: InventoryItem;
      if (existing) {
        updatedInv = {
          ...existing,
          companyId: myCompanyId,
          totalQuantity: existing.totalQuantity + order.orderQuantity,
          warehouseLocation: existing.warehouseLocation || loc,
          updatedAt: now,
        };
        syncInventoryItemToCloud(updatedInv);
        return prev.map((i) =>
          i.sku.trim().toUpperCase() === order.sku.trim().toUpperCase() && (i.companyId === myCompanyId || !i.companyId)
            ? updatedInv
            : i
        );
      } else {
        updatedInv = {
          sku: order.sku,
          name: order.productName,
          unit: order.unit || 'Cái',
          totalQuantity: order.orderQuantity,
          reservedQuantity: order.orderQuantity,
          availableQuantity: 0,
          warehouseLocation: loc,
          updatedAt: now,
          companyId: myCompanyId,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        };
        syncInventoryItemToCloud(updatedInv);
        return [...prev, updatedInv];
      }
    });

    // 3. Create a holding reserve item for this contract/customer
    const targetCustomer = customers.find((c) => c.id === order.customerId);
    const newReserve: ReserveItem = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      contractId: order.contractId,
      contractNumber: order.contractNumber,
      quoteNumber: order.quoteNumber,
      customerId: order.customerId,
      customerName: targetCustomer?.name || order.customerName,
      salesRepId: targetCustomer?.assignedToId || order.salesRepId || currentUser.id,
      salesRepName: targetCustomer?.assignedToName || order.salesRepName || currentUser.name,
      createdBy: currentUser.id,
      sku: order.sku,
      productName: order.productName,
      unit: order.unit,
      reservedQuantity: order.orderQuantity,
      warehouseLocation: loc,
      reservedDate: now,
      status: 'holding',
      expectedDeliveryDate: contract?.deliveryDate || now,
    };

    setReserveItems((prev) => [newReserve, ...prev]);
    syncReserveItemToCloud(newReserve);
  };

  const importInventory = (newInvList: InventoryItem[]) => {
    const myOrgId = resolveOrganizationId(currentUser, users);
    const myCompanyId = companyScope.companyId || myOrgId;

    const stampedList: InventoryItem[] = newInvList.map((item) => ({
      ...item,
      sku: (item.sku || '').trim().toUpperCase(),
      name: (item.name || '').trim() || `Sản phẩm ${(item.sku || '').trim().toUpperCase()}`,
      unit: (item.unit || '').trim() || 'Bộ',
      totalQuantity: typeof item.totalQuantity === 'number' && !isNaN(item.totalQuantity) ? item.totalQuantity : 0,
      reservedQuantity: typeof item.reservedQuantity === 'number' && !isNaN(item.reservedQuantity) ? item.reservedQuantity : 0,
      availableQuantity: typeof item.availableQuantity === 'number' && !isNaN(item.availableQuantity) ? item.availableQuantity : 0,
      warehouseLocation: (item.warehouseLocation || 'Kho Tổng').trim(),
      organizationId: myOrgId,
      companyId: myCompanyId,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      updatedAt: new Date().toISOString().split('T')[0],
    }));

    setInventory((prev) => {
      const otherOrgInventory = prev.filter((i) => {
        const iOrg = i.organizationId || i.companyId;
        return iOrg && iOrg !== myOrgId && iOrg !== myCompanyId;
      });

      const myMap = new Map<string, InventoryItem>();
      prev.filter((i) => {
        const iOrg = i.organizationId || i.companyId;
        return iOrg === myOrgId || iOrg === myCompanyId;
      }).forEach((i) => myMap.set((i.sku || '').toUpperCase(), i));

      stampedList.forEach((item) => {
        const skuKey = (item.sku || '').toUpperCase();
        const existing = myMap.get(skuKey);
        const reserved = existing ? existing.reservedQuantity : (item.reservedQuantity || 0);
        const available = Math.max(0, item.totalQuantity - reserved);
        myMap.set(skuKey, {
          ...item,
          reservedQuantity: reserved,
          availableQuantity: available,
          updatedAt: new Date().toISOString().split('T')[0],
        });
      });

      const updatedCompanyInv = Array.from(myMap.values());
      const fullList = [...otherOrgInventory, ...updatedCompanyInv];
      saveInventoryToIndexedDB(fullList);
      return fullList;
    });

    // Trigger cloud sync outside state updater
    batchSyncInventoryToCloud(stampedList);
  };

  // Quotations - RBAC Filter:
  // - Super Admin: views ALL quotations (system-wide monitoring)
  // - Level 1: views ALL quotations within their organization
  // - Level 2: ONLY views quotations linked to customers they have permission for
  const filteredQuotations = useMemo(() => {
    if (currentUser.role === 'super_admin') {
      return quotations; // Super Admin sees all
    }
    
    const myOrgId = resolveOrganizationId(currentUser, users);
    
    // Filter by organization
    const orgQuotations = quotations.filter((q) => q.organizationId === myOrgId);
    
    if (currentUser.role === 'manager_c1') {
      return orgQuotations; // Level 1 sees all in org
    }
    
    // Level 2: only quotations linked to permitted customers
    return orgQuotations.filter((q) => canLevel2AccessQuotation(currentUser.id, q, customers));
  }, [quotations, currentUser, users, customers]);

  const getCustomerQuotations = (customerId: string) => {
    return quotations
      .filter((q) => q.customerId === customerId)
      .sort((a, b) => b.version - a.version);
  };

  const createQuotation = (quoteData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    const myOrgId = resolveOrganizationId(currentUser, users);

    // PERMISSION GATE: Level 2 can only create quotations for customers they have access to
    if (currentUser.role === 'sales_c2' && quoteData.customerId) {
      const targetCustomer = customers.find(c => c.id === quoteData.customerId);
      if (!targetCustomer || !canLevel2AccessCustomer(currentUser.id, targetCustomer)) {
        console.error('[PERMISSION DENIED] createQuotation: Level 2 user', currentUser.id,
          'attempted to create quotation for unauthorized customer', quoteData.customerId);
        return null;
      }
    }

    const newQuote: Quotation = {
      ...quoteData,
      id: `quote-${Date.now()}`,
      organizationId: myOrgId, // AUTO-STAMP: tenant isolation
      salesRepId: quoteData.salesRepId || currentUser.id,
      salesRepName: quoteData.salesRepName || currentUser.name,
      salesRepPhone: quoteData.salesRepPhone || currentUser.phone,
      createdBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
    };
    setQuotations((prev) => [newQuote, ...prev]);
    syncQuotationToCloud(newQuote);

    // Automatically update customer stage to 'quoting' if it was 'new' or 'contacted'
    setCustomers((prev) => {
      let custToUpdate: Customer | null = null;
      const updated = prev.map((c) => {
        if (c.id === quoteData.customerId && (c.stage === 'new' || c.stage === 'contacted')) {
          custToUpdate = { ...c, stage: 'quoting', updatedAt: now };
          return custToUpdate;
        }
        return c;
      });
      if (custToUpdate) syncCustomerToCloud(custToUpdate);
      return updated;
    });

    return newQuote;
  };

  const updateQuotation = (quotation: Quotation) => {
    const now = new Date().toISOString().split('T')[0];
    const itemWithTime = { ...quotation, updatedAt: now };
    setQuotations((prev) =>
      prev.map((q) => (q.id === quotation.id ? itemWithTime : q))
    );
    syncQuotationToCloud(itemWithTime);
  };

  const updateQuotationStatus = (quoteId: string, status: QuotationStatus) => {
    if (status === 'approved_contract') {
      finalizeQuoteToContract(quoteId);
      return;
    }

    const now = new Date().toISOString().split('T')[0];
    let targetCustomerId = '';
    setQuotations((prev) =>
      prev.map((q) => {
        if (q.id === quoteId) {
          targetCustomerId = q.customerId;
          const updated: Quotation = {
            ...q,
            status,
            isContractQuote: false,
            updatedAt: now,
          };
          syncQuotationToCloud(updated);
          return updated;
        }
        return q;
      })
    );

    // If status is 'sent', update customer stage to 'quoting' if it was 'new' or 'contacted'
    if (status === 'sent' && targetCustomerId) {
      setCustomers((prev) => {
        let custToUpdate: Customer | null = null;
        const updated = prev.map((c) => {
          if (c.id === targetCustomerId && (c.stage === 'new' || c.stage === 'contacted')) {
            custToUpdate = { ...c, stage: 'quoting', updatedAt: now };
            return custToUpdate;
          }
          return c;
        });
        if (custToUpdate) syncCustomerToCloud(custToUpdate);
        return updated;
      });
    }
  };

  const cloneQuotationToNextRound = (previousQuoteId: string): Quotation | null => {
    const prevQuote = quotations.find((q) => q.id === previousQuoteId);
    if (!prevQuote) return null;

    const customerQuotes = quotations.filter((q) => q.customerId === prevQuote.customerId);
    const maxVersion = customerQuotes.reduce((max, q) => Math.max(max, q.version || 1), 1);
    const nextVersion = maxVersion + 1;
    const now = new Date().toISOString().split('T')[0];

    // Refresh inventory check on items
    const refreshedItems = prevQuote.items.map((item) => {
      const inv = inventory.find((i) => i.sku === item.sku);
      const avail = inv ? inv.availableQuantity : 0;
      return {
        ...item,
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        inventoryAvailable: avail,
      };
    });

    const newQuoteNumber = `BG-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}-V${nextVersion}`;
    const newQuote: Quotation = {
      ...prevQuote,
      id: `quote-${Date.now()}`,
      quoteNumber: newQuoteNumber,
      version: nextVersion,
      title: `${prevQuote.title.replace(/ - Lần \d+$/, '').replace(/ \(v\d+\)$/, '')} - Lần ${nextVersion}`,
      date: now,
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: refreshedItems,
      status: 'draft',
      isContractQuote: false,
      contractId: undefined,
      createdAt: now,
      updatedAt: now,
    };

    setQuotations((prev) => [newQuote, ...prev]);
    syncQuotationToCloud(newQuote);

    return newQuote;
  };

  const deleteQuotation = (id: string) => {
    setQuotations((prev) => prev.filter((q) => q.id !== id));
    deleteQuotationFromCloud(id);
  };

  // CRITICAL REQUIREMENT: Finalize Quote to Contract + Automatic Split of Reserve & Order
  const finalizeQuoteToContract = (
    quoteId: string,
    contractDetails?: Partial<Contract>,
    overrideQuote?: Quotation
  ) => {
    let quote = overrideQuote || quotations.find((q) => q.id === quoteId);

    // Fallback: check localStorage if not yet updated in state
    if (!quote) {
      try {
        const stored = localStorage.getItem('salesflow_quotations');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const found = parsed.find((q: Quotation) => q.id === quoteId);
            if (found) quote = found;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // Secondary fallback: construct a valid quotation object to prevent crashing
    if (!quote) {
      const now = new Date().toISOString().split('T')[0];
      quote = {
        id: quoteId || `quote-${Date.now()}`,
        quoteNumber: `BG-${Date.now().toString().slice(-6)}`,
        version: 1,
        customerId: contractDetails?.customerId || '',
        customerName: contractDetails?.customerName || 'Khách hàng',
        customerPhone: contractDetails?.customerPhone || '',
        customerEmail: '',
        customerCompany: contractDetails?.customerCompany || '',
        customerAddress: contractDetails?.deliveryAddress || contractDetails?.customerAddress || '',
        salesRepId: currentUser.id,
        salesRepName: currentUser.name,
        salesRepPhone: currentUser.phone,
        title: 'Báo giá chốt hợp đồng',
        date: now,
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        items: contractDetails?.items || [],
        subtotal: contractDetails?.totalValue || 0,
        discountTotal: 0,
        taxRate: 10,
        taxAmount: (contractDetails?.totalValue || 0) * 0.1,
        grandTotal: contractDetails?.totalValue || 0,
        milestones: contractDetails?.milestones || [],
        status: 'approved_contract',
        isContractQuote: true,
        notes: '',
        termsAndConditions: '',
        createdAt: now,
        updatedAt: now,
      };
    }

    const now = new Date().toISOString().split('T')[0];
    const contractId = `contract-${Date.now()}`;
    const contractNumber =
      contractDetails?.contractNumber ||
      `HĐKT-${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}-${quote.quoteNumber.replace(/[^a-zA-Z0-9]/g, '')}`;

    // 1. Mark quote as approved contract
    const updatedQuote: Quotation = {
      ...quote,
      status: 'approved_contract',
      isContractQuote: true,
      contractId,
      updatedAt: now,
    };
    setQuotations((prev) => {
      const exists = prev.some((q) => q.id === updatedQuote.id);
      return exists
        ? prev.map((q) => (q.id === updatedQuote.id ? updatedQuote : q))
        : [updatedQuote, ...prev];
    });
    syncQuotationToCloud(updatedQuote);

    // 2. Update Customer stage to 'contract_signed'
    setCustomers((prev) => {
      let custToUpdate: Customer | null = null;
      const updated = prev.map((c) => {
        if (c.id === quote.customerId) {
          custToUpdate = { ...c, stage: 'contract_signed', updatedAt: now };
          return custToUpdate;
        }
        return c;
      });
      if (custToUpdate) syncCustomerToCloud(custToUpdate);
      return updated;
    });

    // 3. Create Contract with master company branding
    const myOrgId = resolveOrganizationId(currentUser, users);
    const targetCustomer = customers.find((c) => c.id === quote.customerId);
    const resolvedCustomerName = targetCustomer?.name || quote.customerName;
    const resolvedSalesRepId = targetCustomer?.assignedToId || quote.salesRepId || currentUser.id;
    const resolvedSalesRepName = targetCustomer?.assignedToName || quote.salesRepName || currentUser.name;

    const newContract: Contract = {
      id: contractId,
      organizationId: myOrgId, // AUTO-STAMP: tenant isolation
      contractNumber,
      quotationId: quote.id,
      quoteNumber: quote.quoteNumber,
      customerId: quote.customerId,
      customerName: resolvedCustomerName,
      customerCompany: quote.customerCompany || targetCustomer?.company,
      customerAddress: quote.customerAddress || targetCustomer?.address,
      customerPhone: quote.customerPhone || targetCustomer?.phone,
      companyName: quote.companyName || companyInfo.name,
      companyTaxCode: quote.companyTaxCode || companyInfo.taxCode,
      companyAddress: quote.companyAddress || companyInfo.address,
      companyPhone: quote.companyHotline || companyInfo.phone || companyInfo.hotline,
      companyEmail: quote.companyEmail || companyInfo.email,
      companyWebsite: quote.companyWebsite || companyInfo.website,
      companyLogo: quote.companyLogo || companyInfo.logoUrl || companyInfo.logo,
      salesRepId: resolvedSalesRepId,
      salesRepName: resolvedSalesRepName,
      salesRepPhone: quote.salesRepPhone || currentUser.phone,
      createdBy: currentUser.id,
      contractDate: now,
      deliveryDate: contractDetails?.deliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      deliveryAddress: contractDetails?.deliveryAddress || quote.customerAddress || targetCustomer?.address || 'Giao tại chân công trình',
      items: quote.items,
      totalValue: quote.grandTotal,
      milestones: quote.milestones,
      status: 'signed',
      createdAt: now,
      ...contractDetails,
    };
    setContracts((prev) => [newContract, ...prev]);
    syncContractToCloud(newContract);

    // 4. AUTOMATIC SPLIT: 1 Bảng Giữ Hàng (Reserve List) + 1 Bảng Đặt Hàng (Order List)
    const newReserveList: ReserveItem[] = [];
    const newOrderList: OrderItem[] = [];

    // Copy current inventory for calculating
    const updatedInventoryMap = new Map<string, InventoryItem>();
    inventory.forEach((inv) => updatedInventoryMap.set(inv.sku, { ...inv }));

    quote.items.forEach((item) => {
      const inv = updatedInventoryMap.get(item.sku);
      const available = inv ? Math.max(0, inv.totalQuantity - inv.reservedQuantity) : 0;
      const required = item.quantity;

      if (available >= required) {
        // Toàn bộ có thể giữ hàng từ kho
        newReserveList.push({
          id: `res-${Date.now()}-${item.sku}`,
          organizationId: myOrgId, // AUTO-STAMP: tenant isolation
          contractId,
          contractNumber,
          quoteNumber: quote.quoteNumber,
          customerId: quote.customerId,
          customerName: resolvedCustomerName,
          salesRepId: resolvedSalesRepId,
          salesRepName: resolvedSalesRepName,
          createdBy: currentUser.id,
          sku: item.sku,
          productName: item.name,
          unit: item.unit,
          reservedQuantity: required,
          warehouseLocation: inv?.warehouseLocation || 'Kho Tổng',
          reservedDate: now,
          status: 'holding',
          expectedDeliveryDate: newContract.deliveryDate,
        });

        // Khóa tồn kho
        if (inv) {
          inv.reservedQuantity += required;
          inv.availableQuantity = Math.max(0, inv.totalQuantity - inv.reservedQuantity);
          inv.updatedAt = now;
        }
      } else if (available > 0 && available < required) {
        // Tồn kho có 1 phần -> Giữ phần có sẵn, phần thiếu đưa vào Bảng Đặt hàng
        const holdingQty = available;
        const missingQty = required - available;

        newReserveList.push({
          id: `res-${Date.now()}-${item.sku}`,
          organizationId: myOrgId, // AUTO-STAMP: tenant isolation
          contractId,
          contractNumber,
          quoteNumber: quote.quoteNumber,
          customerId: quote.customerId,
          customerName: resolvedCustomerName,
          salesRepId: resolvedSalesRepId,
          salesRepName: resolvedSalesRepName,
          createdBy: currentUser.id,
          sku: item.sku,
          productName: item.name,
          unit: item.unit,
          reservedQuantity: holdingQty,
          warehouseLocation: inv?.warehouseLocation || 'Kho Tổng',
          reservedDate: now,
          status: 'holding',
          expectedDeliveryDate: newContract.deliveryDate,
        });

        newOrderList.push({
          id: `ord-${Date.now()}-${item.sku}`,
          organizationId: myOrgId, // AUTO-STAMP: tenant isolation
          contractId,
          contractNumber,
          quoteNumber: quote.quoteNumber,
          customerId: quote.customerId,
          customerName: resolvedCustomerName,
          salesRepId: resolvedSalesRepId,
          salesRepName: resolvedSalesRepName,
          createdBy: currentUser.id,
          sku: item.sku,
          productName: item.name,
          unit: item.unit,
          orderQuantity: missingQty,
          brand: item.brand,
          size: item.size,
          color: item.color,
          orderDate: now,
          status: 'pending_order',
          notes: `Hợp đồng ${contractNumber} cần gấp ${missingQty} ${item.unit}`,
        });

        // Khóa toàn bộ tồn khả dụng hiện có
        if (inv) {
          inv.reservedQuantity += holdingQty;
          inv.availableQuantity = 0;
          inv.updatedAt = now;
        }
      } else {
        // Hết hàng / Tồn bằng 0 -> Đặt toàn bộ
        newOrderList.push({
          id: `ord-${Date.now()}-${item.sku}`,
          organizationId: myOrgId, // AUTO-STAMP: tenant isolation
          contractId,
          contractNumber,
          quoteNumber: quote.quoteNumber,
          customerId: quote.customerId,
          customerName: resolvedCustomerName,
          salesRepId: resolvedSalesRepId,
          salesRepName: resolvedSalesRepName,
          createdBy: currentUser.id,
          sku: item.sku,
          productName: item.name,
          unit: item.unit,
          orderQuantity: required,
          brand: item.brand,
          size: item.size,
          color: item.color,
          orderDate: now,
          status: 'pending_order',
          notes: `Hợp đồng ${contractNumber} đặt mới ${required} ${item.unit}`,
        });
      }
    });

    // Cập nhật State & Cloud Firestore
    const updatedInventoryList = Array.from(updatedInventoryMap.values());
    setInventory(updatedInventoryList);
    batchSyncInventoryToCloud(updatedInventoryList);

    setReserveItems((prev) => {
      const merged = [...newReserveList, ...prev];
      batchSyncReservesToCloud(newReserveList);
      return merged;
    });

    setOrderItems((prev) => {
      const merged = [...newOrderList, ...prev];
      batchSyncOrdersToCloud(newOrderList);
      return merged;
    });

    return {
      contract: newContract,
      reserveItems: newReserveList,
      orderItems: newOrderList,
    };
  };

  // Contracts - RBAC Filter:
  // - Super Admin: views ALL contracts (system-wide monitoring)
  // - Level 1: views ALL contracts within their organization
  // - Level 2: ONLY views contracts linked to customers they have permission for
  const filteredContracts = useMemo(() => {
    if (currentUser.role === 'super_admin') {
      return contracts; // Super Admin sees all
    }
    
    const myOrgId = resolveOrganizationId(currentUser, users);
    
    // Filter by organization
    const orgContracts = contracts.filter((c) => c.organizationId === myOrgId);
    
    if (currentUser.role === 'manager_c1') {
      return orgContracts; // Level 1 sees all in org
    }
    
    // Level 2: only contracts linked to permitted customers
    return orgContracts.filter((c) => canLevel2AccessContract(currentUser.id, c, customers));
  }, [contracts, currentUser, users, customers]);

  const updateContract = (updated: Contract) => {
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    syncContractToCloud(updated);
  };

  const updateContractMilestoneStatus = (
    contractId: string,
    milestoneId: string,
    status: 'pending' | 'completed' | 'overdue'
  ) => {
    setContracts((prev) => {
      let targetContract: Contract | null = null;
      const updated = prev.map((c) => {
        if (c.id === contractId) {
          const updatedMs = c.milestones.map((m) => (m.id === milestoneId ? { ...m, status } : m));
          targetContract = { ...c, milestones: updatedMs };
          return targetContract;
        }
        return c;
      });
      if (targetContract) syncContractToCloud(targetContract);
      return updated;
    });
  };

  // Logistics Split tables (Reserve & Order) - RBAC Filter:
  // - Super Admin: views all valid records belonging to existing customers
  // - Cấp 1: views valid items within their organization belonging to existing customers
  // - Level 2: ONLY views valid items associated with contracts of customers they have permission for
  const filteredReserveItems = useMemo(() => {
    const validCustomerIds = new Set(customers.map((c) => c.id));
    
    if (currentUser.role === 'super_admin') {
      return reserveItems.filter((r) => r.customerId && validCustomerIds.has(r.customerId));
    }
    
    const myOrgId = resolveOrganizationId(currentUser, users);
    const orgItems = reserveItems.filter((r) => {
      if (!r.customerId || !validCustomerIds.has(r.customerId)) return false;
      return !r.organizationId || r.organizationId === myOrgId;
    });
    
    if (currentUser.role === 'manager_c1') return orgItems;
    
    // Level 2: filter strictly by customer permission
    return orgItems.filter((r) => {
      const customer = customers.find((c) => c.id === r.customerId);
      if (customer) return canLevel2AccessCustomer(currentUser.id, customer);
      return false;
    });
  }, [reserveItems, currentUser, users, customers]);

  const filteredOrderItems = useMemo(() => {
    const validCustomerIds = new Set(customers.map((c) => c.id));
    
    if (currentUser.role === 'super_admin') {
      return orderItems.filter((o) => o.customerId && validCustomerIds.has(o.customerId));
    }
    
    const myOrgId = resolveOrganizationId(currentUser, users);
    const orgItems = orderItems.filter((o) => {
      if (!o.customerId || !validCustomerIds.has(o.customerId)) return false;
      return !o.organizationId || o.organizationId === myOrgId;
    });
    
    if (currentUser.role === 'manager_c1') return orgItems;
    
    // Level 2: filter strictly by customer permission
    return orgItems.filter((o) => {
      const customer = customers.find((c) => c.id === o.customerId);
      if (customer) return canLevel2AccessCustomer(currentUser.id, customer);
      return false;
    });
  }, [orderItems, currentUser, users, customers]);

  // Derived synced inventory: ensures reservedQuantity matches active holding reserves of VALID existing customers,
  // and available is total - reserved
  const syncedInventory = useMemo(() => {
    const validCustomerIds = new Set(customers.map((c) => c.id));
    const reserveMap = new Map<string, number>();

    reserveItems.forEach((r) => {
      // ONLY holding reserves linked to an ACTIVE, VALID customer lock inventory stock
      if (r.status === 'holding' && r.customerId && validCustomerIds.has(r.customerId)) {
        const cleanSku = (r.sku || '').trim().toLowerCase();
        reserveMap.set(cleanSku, (reserveMap.get(cleanSku) || 0) + (r.reservedQuantity || 0));
      }
    });

    return inventory.map((item) => {
      const cleanSku = (item.sku || '').trim().toLowerCase();
      const actualReserved = reserveMap.get(cleanSku) || 0;
      const actualAvailable = Math.max(0, (item.totalQuantity || 0) - actualReserved);

      return {
        ...item,
        reservedQuantity: actualReserved,
        availableQuantity: actualAvailable,
      };
    });
  }, [inventory, reserveItems, customers]);

  const updateReserveStatus = (id: string, status: 'holding' | 'dispatched' | 'cancelled') => {
    setReserveItems((prev) => {
      const oldItem = prev.find((r) => r.id === id);
      if (!oldItem) return prev;

      const previousStatus = oldItem.status;
      const targetRes: ReserveItem = { ...oldItem, status };

      const updated = prev.map((r) => (r.id === id ? targetRes : r));
      syncReserveItemToCloud(targetRes);

      // Handle stock balance changes:
      // 1. Moving TO dispatched: deduct stock
      if (previousStatus !== 'dispatched' && status === 'dispatched') {
        setInventory((invPrev) => {
          let updatedInv: InventoryItem | null = null;
          const newInv = invPrev.map((inv) => {
            if (inv.sku.trim().toLowerCase() === targetRes.sku.trim().toLowerCase()) {
              const newTotal = Math.max(0, inv.totalQuantity - targetRes.reservedQuantity);
              updatedInv = {
                ...inv,
                totalQuantity: newTotal,
                updatedAt: new Date().toISOString().split('T')[0],
              };
              return updatedInv;
            }
            return inv;
          });
          if (updatedInv) syncInventoryItemToCloud(updatedInv);
          return newInv;
        });
      }
      // 2. Reverting FROM dispatched back to holding/cancelled (e.g. user clicked by mistake): restore stock
      else if (previousStatus === 'dispatched' && status !== 'dispatched') {
        setInventory((invPrev) => {
          let updatedInv: InventoryItem | null = null;
          const newInv = invPrev.map((inv) => {
            if (inv.sku.trim().toLowerCase() === targetRes.sku.trim().toLowerCase()) {
              const newTotal = inv.totalQuantity + targetRes.reservedQuantity;
              updatedInv = {
                ...inv,
                totalQuantity: newTotal,
                updatedAt: new Date().toISOString().split('T')[0],
              };
              return updatedInv;
            }
            return inv;
          });
          if (updatedInv) syncInventoryItemToCloud(updatedInv);
          return newInv;
        });
      }

      return updated;
    });
  };

  const updateReserveItem = (item: ReserveItem) => {
    setReserveItems((prev) => {
      const oldItem = prev.find((r) => r.id === item.id);
      const updated = prev.map((r) => (r.id === item.id ? item : r));
      syncReserveItemToCloud(item);

      // Check if status changed regarding dispatched
      if (oldItem) {
        if (oldItem.status !== 'dispatched' && item.status === 'dispatched') {
          setInventory((invPrev) => {
            let updatedInv: InventoryItem | null = null;
            const newInv = invPrev.map((inv) => {
              if (inv.sku.trim().toLowerCase() === item.sku.trim().toLowerCase()) {
                const newTotal = Math.max(0, inv.totalQuantity - item.reservedQuantity);
                updatedInv = {
                  ...inv,
                  totalQuantity: newTotal,
                  updatedAt: new Date().toISOString().split('T')[0],
                };
                return updatedInv;
              }
              return inv;
            });
            if (updatedInv) syncInventoryItemToCloud(updatedInv);
            return newInv;
          });
        } else if (oldItem.status === 'dispatched' && item.status !== 'dispatched') {
          setInventory((invPrev) => {
            let updatedInv: InventoryItem | null = null;
            const newInv = invPrev.map((inv) => {
              if (inv.sku.trim().toLowerCase() === item.sku.trim().toLowerCase()) {
                const newTotal = inv.totalQuantity + oldItem.reservedQuantity;
                updatedInv = {
                  ...inv,
                  totalQuantity: newTotal,
                  updatedAt: new Date().toISOString().split('T')[0],
                };
                return updatedInv;
              }
              return inv;
            });
            if (updatedInv) syncInventoryItemToCloud(updatedInv);
            return newInv;
          });
        }
      }

      return updated;
    });
  };

  const updateOrderStatus = (
    id: string,
    status: 'pending_order' | 'ordered' | 'arrived_in_stock' | 'cancelled',
    notes?: string
  ) => {
    setOrderItems((prev) => {
      let targetOrder: OrderItem | null = null;
      const updated = prev.map((o) => {
        if (o.id === id) {
          targetOrder = { ...o, status, notes: notes !== undefined ? notes : o.notes };
          return targetOrder;
        }
        return o;
      });
      if (targetOrder) syncOrderItemToCloud(targetOrder);
      return updated;
    });
  };

  const updateOrderItem = (item: OrderItem) => {
    setOrderItems((prev) => {
      const updated = prev.map((o) => (o.id === item.id ? item : o));
      syncOrderItemToCloud(item);
      return updated;
    });
  };

  const clearAllSystemData = async () => {
    // 1. Clear local state
    setCustomers([]);
    setProducts([]);
    setInventory([]);
    setQuotations([]);
    setContracts([]);
    setReserveItems([]);
    setOrderItems([]);

    // Keep super admin so the user stays logged in
    const superAdmin = users.find((u) => u.role === 'super_admin') || INITIAL_USERS[0];
    setUsers([superAdmin]);
    setCurrentUser(superAdmin);

    // 2. Clear IndexedDB & localStorage
    saveProductsToIndexedDB([]);
    saveInventoryToIndexedDB([]);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.QUOTATIONS);
    localStorage.removeItem(STORAGE_KEYS.CONTRACTS);
    localStorage.removeItem(STORAGE_KEYS.RESERVES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([superAdmin]));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, superAdmin.id);

    // 3. Clear Google Cloud Firestore
    await clearAllDataFromCloud(true);
    setLastCloudSyncTime(new Date());
  };

  const clearSpecificData = async (options: {
    clearCustomers?: boolean;
    clearProducts?: boolean;
    clearInventory?: boolean;
    clearQuotesAndContracts?: boolean;
    clearReservesAndOrders?: boolean;
    clearUsers?: boolean;
  }) => {
    if (options.clearCustomers) {
      setCustomers([]);
      localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      await clearCollectionFromCloud(COLLECTIONS.CUSTOMERS);
    }

    if (options.clearProducts) {
      if (currentUser.role === 'super_admin') {
        setProducts([]);
        saveProductsToIndexedDB([]);
        localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
        await clearCollectionFromCloud(COLLECTIONS.PRODUCTS);
      } else {
        const myCompanyId = companyScope.companyId;
        setProducts((prev) => {
          const remaining = prev.filter((p) => p.companyId !== myCompanyId && p.createdBy !== currentUser.id);
          saveProductsToIndexedDB(remaining);
          return remaining;
        });
        await clearCompanyProductsFromCloud(myCompanyId);
      }
    }

    if (options.clearInventory) {
      if (currentUser.role === 'super_admin') {
        setInventory([]);
        saveInventoryToIndexedDB([]);
        localStorage.removeItem(STORAGE_KEYS.INVENTORY);
        await clearCollectionFromCloud(COLLECTIONS.INVENTORY);
      } else {
        const myCompanyId = companyScope.companyId;
        setInventory((prev) => {
          const remaining = prev.filter((i) => i.companyId !== myCompanyId && i.createdBy !== currentUser.id);
          saveInventoryToIndexedDB(remaining);
          return remaining;
        });
        await clearCompanyInventoryFromCloud(myCompanyId);
      }
    }

    if (options.clearQuotesAndContracts) {
      setQuotations([]);
      setContracts([]);
      localStorage.removeItem(STORAGE_KEYS.QUOTATIONS);
      localStorage.removeItem(STORAGE_KEYS.CONTRACTS);
      await clearCollectionFromCloud(COLLECTIONS.QUOTATIONS);
      await clearCollectionFromCloud(COLLECTIONS.CONTRACTS);
    }

    if (options.clearReservesAndOrders) {
      setReserveItems([]);
      setOrderItems([]);
      localStorage.removeItem(STORAGE_KEYS.RESERVES);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      await clearCollectionFromCloud(COLLECTIONS.RESERVES);
      await clearCollectionFromCloud(COLLECTIONS.ORDERS);
    }

    if (options.clearUsers) {
      const superAdmin = users.find((u) => u.role === 'super_admin') || INITIAL_USERS[0];
      setUsers([superAdmin]);
      setCurrentUser(superAdmin);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([superAdmin]));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, superAdmin.id);
      await clearCollectionFromCloud(COLLECTIONS.USERS, [superAdmin.id]);
    }

    setLastCloudSyncTime(new Date());
  };

  const resetDataToDefault = async () => {
    localStorage.clear();
    await saveProductsToIndexedDB(INITIAL_PRODUCTS);
    await saveInventoryToIndexedDB(INITIAL_INVENTORY);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setCustomers(INITIAL_CUSTOMERS);
    setProducts(INITIAL_PRODUCTS);
    setInventory(INITIAL_INVENTORY);
    setQuotations(INITIAL_QUOTATIONS);
    setContracts(INITIAL_CONTRACTS);
    setReserveItems(INITIAL_RESERVE_ITEMS);
    setOrderItems(INITIAL_ORDER_ITEMS);
    await syncAllToCloudNow();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        setIsAuthenticated,
        login,
        register,
        logout,
        resetPassword,
        authScreenMode,
        setAuthScreenMode,
        isAuthModalOpen,
        setIsAuthModalOpen,
        quickDemoLogin,
        users,
        filteredUsers,
        updateUserProfile,
        approveManagerC1,
        rejectManagerC1,
        createSalesC2,
        addUser,
        approveUser,
        updateUser,
        deleteUser,
        companyInfo,
        updateCompanyInfo,
        isProfileModalOpen,
        setIsProfileModalOpen,
        profileModalInitialTab,
        setProfileModalInitialTab,
        companyScope,
        customers,
        filteredCustomers,
        addCustomer,
        updateCustomer,
        updateCustomerStage,
        assignCustomer,
        deleteCustomer,
        grantCustomerAccess,
        revokeCustomerAccess,
        products: filteredProducts,
        allProducts: products,
        addProduct,
        updateProduct,
        deleteProduct,
        importProducts,
        importPriceRecords,
        inventory: filteredInventory,
        allInventory: inventory,
        updateInventoryItem,
        addInventoryItem,
        deleteInventoryItem,
        importInventory,
        quickAdjustStock,
        receiveOrderToWarehouseAndReserve,
        stockTransactions,
        stockInVouchers,
        stockOutVouchers,
        stockAuditVouchers,
        addStockTransaction,
        createStockInVoucher,
        confirmStockInVoucher,
        cancelStockInVoucher,
        createStockOutVoucher,
        confirmStockOutVoucher,
        cancelStockOutVoucher,
        createStockAuditVoucher,
        confirmStockAuditVoucher,
        cancelStockAuditVoucher,
        quotations,
        filteredQuotations,
        getCustomerQuotations,
        createQuotation,
        updateQuotation,
        updateQuotationStatus,
        cloneQuotationToNextRound,
        deleteQuotation,
        finalizeQuoteToContract,
        contracts,
        filteredContracts,
        updateContract,
        updateContractMilestoneStatus,
        reserveItems,
        filteredReserveItems,
        updateReserveStatus,
        updateReserveItem,
        orderItems,
        filteredOrderItems,
        updateOrderStatus,
        updateOrderItem,
        activeTab,
        setActiveTab,
        isCreateCustomerModalOpen,
        setIsCreateCustomerModalOpen,
        selectedCustomerForModal,
        setSelectedCustomerForModal,
        isClearDataModalOpen,
        setIsClearDataModalOpen,
        clearAllSystemData,
        clearSpecificData,
        isCreateQuoteModalOpen,
        setIsCreateQuoteModalOpen,
        selectedQuoteForModal,
        setSelectedQuoteForModal,
        selectedCustomerIdForQuote,
        setSelectedCustomerIdForQuote,
        pdfPreviewData,
        setPdfPreviewData,
        cloudSyncStatus,
        lastCloudSyncTime,
        syncAllToCloudNow,
        resetDataToDefault,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
