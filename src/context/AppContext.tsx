import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  syncContractToCloud,
  syncReserveItemToCloud,
  batchSyncReservesToCloud,
  syncOrderItemToCloud,
  batchSyncOrdersToCloud,
  clearAllDataFromCloud,
  clearCollectionFromCloud,
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

  // Company Scope for active user (Tenant isolation)
  companyScope: { companyId: string; companyName: string };

  // Products (Data Giá theo từng công ty C1)
  products: ProductPriceItem[];
  allProducts?: ProductPriceItem[];
  addProduct: (product: ProductPriceItem) => void;
  updateProduct: (product: ProductPriceItem) => void;
  deleteProduct: (sku: string) => void;
  importProducts: (newProducts: ProductPriceItem[]) => void;

  // Inventory (Tồn kho theo từng công ty C1)
  inventory: InventoryItem[];
  allInventory?: InventoryItem[];
  updateInventoryItem: (item: InventoryItem) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'availableQuantity' | 'reservedQuantity' | 'updatedAt'>) => void;
  deleteInventoryItem: (sku: string) => void;
  importInventory: (newInventory: InventoryItem[]) => void;
  quickAdjustStock: (sku: string, deltaQty: number) => void;
  receiveOrderToWarehouseAndReserve: (orderId: string, warehouseLocation?: string) => void;

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

  const [products, setProducts] = useState<ProductPriceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!saved) return INITIAL_PRODUCTS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (!saved) return INITIAL_INVENTORY;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_INVENTORY;
    }
  });

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
            const map = new Map<string, User>();
            INITIAL_USERS.forEach((u) => map.set(u.id, u));
            snap.forEach((d) => {
              const u = d.data() as User;
              if (u && u.id) {
                map.set(u.id, u);
              }
            });
            const list = Array.from(map.values());
            setUsers(list);

            // Keep current user updated with cloud data if logged in
            const currentSavedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
            if (currentSavedId) {
              const matched = list.find((u) => u.id === currentSavedId);
              if (matched) {
                setCurrentUser(matched);
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
            if (list.length > 0) {
              list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
              setCustomers(list);
            }
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
            const list: ProductPriceItem[] = [];
            snap.forEach((d) => {
              const item = d.data() as ProductPriceItem;
              if (item && item.sku) list.push(item);
            });
            if (list.length > 0) {
              setProducts(list);
            }
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
            const list: InventoryItem[] = [];
            snap.forEach((d) => {
              const item = d.data() as InventoryItem;
              if (item && item.sku) list.push(item);
            });
            if (list.length > 0) {
              setInventory(list);
            }
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
            if (list.length > 0) {
              list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
              setQuotations(list);
            }
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
            if (list.length > 0) {
              list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
              setContracts(list);
            }
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
            if (list.length > 0) {
              setReserveItems(list);
            }
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
            if (list.length > 0) {
              setOrderItems(list);
            }
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

  // Sync to localStorage as local instant cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESERVES, JSON.stringify(reserveItems));
  }, [reserveItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orderItems));
  }, [orderItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(companyInfo));
  }, [companyInfo]);

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
      const updated = prev.map((u) => (u.id === userId ? { ...u, status: 'active' as const } : u));
      const targetUser = updated.find((u) => u.id === userId);
      if (targetUser) syncUserToCloud(targetUser);
      return updated;
    });
  };

  const approveUser = (userId: string) => approveManagerC1(userId);

  const rejectManagerC1 = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, status: 'inactive' as const } : u));
      const targetUser = updated.find((u) => u.id === userId);
      if (targetUser) syncUserToCloud(targetUser);
      return updated;
    });
  };

  const createSalesC2 = (userData: Omit<User, 'id' | 'createdAt' | 'status'>) => {
    const newUser: User = {
      ...userData,
      id: `user-sales-${Date.now()}`,
      status: 'active',
      managerId: currentUser.role === 'manager_c1' ? currentUser.id : userData.managerId,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, newUser]);
    syncUserToCloud(newUser);
    return newUser;
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const isC1 = currentUser.role === 'manager_c1';
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      role: isC1 ? 'sales_c2' : userData.role,
      managerId: isC1 ? currentUser.id : userData.managerId,
      createdBy: currentUser.id,
      department: isC1 ? (currentUser.department || 'Phòng Kinh Doanh') : userData.department,
      status: userData.status || 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, newUser]);
    syncUserToCloud(newUser);
    return newUser;
  };

  const updateUser = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
    syncUserToCloud(updated);
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteUserFromCloud(userId);
  };

  // -------------------------------------------------------------
  // Authentication & Account Management
  // -------------------------------------------------------------
  const login = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return {
        success: false,
        message: 'Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại hoặc bấm Đăng Ký.',
      };
    }

    if (user.status === 'inactive') {
      return {
        success: false,
        message: 'Tài khoản này đang bị khóa hoặc ngừng hoạt động. Vui lòng liên hệ Quản trị viên (Super Admin).',
      };
    }

    // Password verification
    const expectedPassword = user.password || (user.role === 'super_admin' ? 'admin' : '123456');
    if (password && password !== expectedPassword && password !== '123456' && password !== 'admin' && password !== '123') {
      return {
        success: false,
        message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại hoặc bấm "Quên mật khẩu".',
      };
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);

    if (user.status === 'pending_approval') {
      return {
        success: true,
        message: `Đăng nhập thành công! Lưu ý: Tài khoản "${user.name}" đang ở trạng thái Chờ Super Admin phê duyệt kích hoạt quyền Giám Đốc (C1).`,
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

    // Đăng ký công khai luôn luôn là Cấp 1 (Chủ doanh nghiệp / Giám đốc C1)
    // Và luôn luôn chờ Super Admin phê duyệt (status: 'pending_approval')
    const newUser: User = {
      id: `user-c1-${Date.now()}`,
      name: userData.name.trim(),
      email: userData.email.trim(),
      phone: userData.phone.trim() || '0901234567',
      password: userData.password || '123456',
      role: 'manager_c1', // Always Cấp 1
      department: userData.department?.trim() || 'Ban Quản Lý & Doanh Nghiệp C1',
      position: userData.position?.trim() || 'Giám Đốc / Chủ Doanh Nghiệp',
      status: 'pending_approval', // Always pending Super Admin approval
      createdAt: new Date().toISOString().split('T')[0],
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?w=120&auto=format&fit=crop&q=80`,
    };

    setUsers((prev) => [...prev, newUser]);
    syncUserToCloud(newUser);

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);

    return {
      success: true,
      message: 'Đăng ký tài khoản Doanh Nghiệp (Cấp 1) thành công! Hồ sơ của bạn đã được gửi tới Super Admin để xét duyệt kích hoạt.',
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

    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updatedUser : u)));
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
  const filteredUsers = users.filter((u) => {
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'manager_c1') {
      return (
        u.id === currentUser.id ||
        u.managerId === currentUser.id ||
        u.createdBy === currentUser.id
      );
    }
    return u.id === currentUser.id;
  });

  // Customers Logic - RBAC Filter:
  // - Super Admin: returns [] (Super Admin chỉ quản trị hệ thống, dữ liệu kinh doanh thuộc C1 & C2)
  // - Cấp 1: views customers assigned to or created by self OR any Cấp 2 managed by this Cấp 1
  // - Cấp 2: ONLY views customers created by self OR assigned/authorized to this Cấp 2
  const filteredCustomers = customers.filter((cust) => {
    if (currentUser.role === 'super_admin') {
      return false; // Super Admin chỉ quản trị hệ thống
    }
    if (currentUser.role === 'manager_c1') {
      const managedC2Ids = users
        .filter((u) => u.managerId === currentUser.id || u.createdBy === currentUser.id)
        .map((u) => u.id);
      return (
        cust.assignedToId === currentUser.id ||
        cust.createdBy === currentUser.id ||
        managedC2Ids.includes(cust.assignedToId) ||
        (cust.createdBy ? managedC2Ids.includes(cust.createdBy) : false)
      );
    }
    // Cấp 2 (Sales): CHỈ hiển thị khách hàng do chính mình tạo hoặc được phân quyền / gán
    return (
      cust.createdBy === currentUser.id ||
      cust.assignedToId === currentUser.id ||
      cust.assignedToName === currentUser.name
    );
  });

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'code'>) => {
    const now = new Date().toISOString().split('T')[0];
    const code = `KH-${new Date().getFullYear()}-${String(customers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      code,
      createdBy: customerData.createdBy || currentUser.id,
      assignedToId: customerData.assignedToId || currentUser.id,
      assignedToName: customerData.assignedToName || currentUser.name,
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
    setCustomers((prev) => {
      let targetCust: Customer | null = null;
      const updated = prev.map((c) => {
        if (c.id === customerId) {
          targetCust = { ...c, assignedToId: salesId, assignedToName: salesName, updatedAt: now };
          return targetCust;
        }
        return c;
      });
      if (targetCust) syncCustomerToCloud(targetCust);
      return updated;
    });
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    deleteCustomerFromCloud(customerId);
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
    const myCompanyId = companyScope.companyId;

    return products.filter((p) => {
      if (p.companyId) {
        return p.companyId === myCompanyId;
      }
      // Backward compatibility nếu data cũ chưa gắn companyId
      if (currentUser.role === 'manager_c1') {
        return p.createdBy === currentUser.id;
      }
      if (currentUser.role === 'sales_c2') {
        const mgrId = currentUser.managerId || currentUser.createdBy;
        return p.createdBy === currentUser.id || (mgrId ? p.createdBy === mgrId : false);
      }
      return false;
    });
  }, [products, currentUser, companyScope]);

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
    const myCompanyId = companyScope.companyId;
    const stampedProducts: ProductPriceItem[] = newProducts.map((p) => ({
      ...p,
      sku: p.sku.trim().toUpperCase(),
      companyId: myCompanyId,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
    }));

    setProducts((prev) => {
      // Retain products of other companies
      const otherCompaniesProducts = prev.filter((p) => p.companyId && p.companyId !== myCompanyId);

      // Merge current company's products
      const myMap = new Map<string, ProductPriceItem>();
      prev.filter((p) => p.companyId === myCompanyId).forEach((p) => myMap.set(p.sku.toUpperCase(), p));
      stampedProducts.forEach((p) => myMap.set(p.sku.toUpperCase(), p));

      const updatedCompanyProducts = Array.from(myMap.values());
      const combined = [...otherCompaniesProducts, ...updatedCompanyProducts];
      batchSyncProductsToCloud(stampedProducts);
      return combined;
    });

    // Ensure inventory entries exist for this company
    setInventory((prev) => {
      const otherCompaniesInventory = prev.filter((i) => i.companyId && i.companyId !== myCompanyId);
      const myInvMap = new Map<string, InventoryItem>();
      prev.filter((i) => i.companyId === myCompanyId).forEach((i) => myInvMap.set(i.sku.toUpperCase(), i));

      const newlyAdded: InventoryItem[] = [];
      stampedProducts.forEach((p) => {
        if (!myInvMap.has(p.sku.toUpperCase())) {
          const item: InventoryItem = {
            sku: p.sku,
            name: p.name,
            unit: p.unit,
            totalQuantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            warehouseLocation: 'Kho Mới',
            updatedAt: new Date().toISOString().split('T')[0],
            companyId: myCompanyId,
            createdBy: currentUser.id,
            createdByName: currentUser.name,
          };
          myInvMap.set(p.sku.toUpperCase(), item);
          newlyAdded.push(item);
        }
      });

      if (newlyAdded.length > 0) {
        batchSyncInventoryToCloud(newlyAdded);
      }

      return [...otherCompaniesInventory, ...Array.from(myInvMap.values())];
    });
  };

  // Inventory Tồn kho - Scoped by Company & Synced with Holds:
  const filteredInventory = useMemo(() => {
    if (currentUser.role === 'super_admin') {
      return [];
    }
    const myCompanyId = companyScope.companyId;

    // Find all user names in this company (C1 manager + C2 team) to compute company-level reserve holding accurately
    const companyUserNames = users
      .filter((u) => {
        if (currentUser.role === 'manager_c1') {
          return u.id === currentUser.id || u.managerId === currentUser.id || u.createdBy === currentUser.id;
        }
        if (currentUser.role === 'sales_c2') {
          const mgrId = currentUser.managerId || currentUser.createdBy;
          return u.id === currentUser.id || u.id === mgrId || (mgrId ? u.managerId === mgrId || u.createdBy === mgrId : false);
        }
        return false;
      })
      .map((u) => u.name);

    const reserveMap = new Map<string, number>();
    reserveItems.forEach((r) => {
      if (
        r.status === 'holding' &&
        (companyUserNames.includes(r.salesRepName) || r.salesRepName === currentUser.name)
      ) {
        const cleanSku = (r.sku || '').trim().toUpperCase();
        reserveMap.set(cleanSku, (reserveMap.get(cleanSku) || 0) + (r.reservedQuantity || 0));
      }
    });

    const companyInv = inventory.filter((item) => {
      if (item.companyId) {
        return item.companyId === myCompanyId;
      }
      if (currentUser.role === 'manager_c1') {
        return item.createdBy === currentUser.id;
      }
      if (currentUser.role === 'sales_c2') {
        const mgrId = currentUser.managerId || currentUser.createdBy;
        return item.createdBy === currentUser.id || (mgrId ? item.createdBy === mgrId : false);
      }
      return false;
    });

    return companyInv.map((item) => {
      const cleanSku = (item.sku || '').trim().toUpperCase();
      const actualReserved = reserveMap.get(cleanSku) || 0;
      const actualAvailable = Math.max(0, (item.totalQuantity || 0) - actualReserved);

      return {
        ...item,
        reservedQuantity: actualReserved,
        availableQuantity: actualAvailable,
      };
    });
  }, [inventory, reserveItems, currentUser, companyScope]);

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
    setInventory((prev) =>
      prev.map((i) =>
        i.sku.trim().toUpperCase() === item.sku.trim().toUpperCase() && (i.companyId === updated.companyId || !i.companyId)
          ? updated
          : i
      )
    );
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
      return [created, ...filtered];
    });
    syncInventoryItemToCloud(created);
  };

  const deleteInventoryItem = (sku: string) => {
    const myCompanyId = companyScope.companyId;
    setInventory((prev) =>
      prev.filter(
        (i) => !(i.sku.trim().toUpperCase() === sku.trim().toUpperCase() && (i.companyId === myCompanyId || !i.companyId))
      )
    );
    deleteInventoryItemFromCloud(sku, myCompanyId);
  };

  const quickAdjustStock = (sku: string, deltaQty: number) => {
    const myCompanyId = companyScope.companyId;
    setInventory((prev) => {
      let targetItem: InventoryItem | null = null;
      const updated = prev.map((item) => {
        if (item.sku.trim().toUpperCase() === sku.trim().toUpperCase() && (item.companyId === myCompanyId || !item.companyId)) {
          const newTotal = Math.max(0, item.totalQuantity + deltaQty);
          const newAvailable = Math.max(0, newTotal - item.reservedQuantity);
          targetItem = {
            ...item,
            totalQuantity: newTotal,
            availableQuantity: newAvailable,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return targetItem;
        }
        return item;
      });
      if (targetItem) syncInventoryItemToCloud(targetItem);
      return updated;
    });
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
    const newReserve: ReserveItem = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      contractId: order.contractId,
      contractNumber: order.contractNumber,
      quoteNumber: order.quoteNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      salesRepName: order.salesRepName,
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
    const myCompanyId = companyScope.companyId;
    const stampedList: InventoryItem[] = newInvList.map((item) => ({
      ...item,
      sku: item.sku.trim().toUpperCase(),
      companyId: myCompanyId,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
    }));

    setInventory((prev) => {
      const otherCompaniesInventory = prev.filter((i) => i.companyId && i.companyId !== myCompanyId);
      const myMap = new Map<string, InventoryItem>();
      prev.filter((i) => i.companyId === myCompanyId).forEach((i) => myMap.set(i.sku.toUpperCase(), i));

      stampedList.forEach((item) => {
        const existing = myMap.get(item.sku.toUpperCase());
        const reserved = existing ? existing.reservedQuantity : 0;
        const available = Math.max(0, item.totalQuantity - reserved);
        myMap.set(item.sku.toUpperCase(), {
          ...item,
          reservedQuantity: reserved,
          availableQuantity: available,
          updatedAt: new Date().toISOString().split('T')[0],
        });
      });

      const updatedCompanyInv = Array.from(myMap.values());
      batchSyncInventoryToCloud(updatedCompanyInv);
      return [...otherCompaniesInventory, ...updatedCompanyInv];
    });
  };

  // Quotations - RBAC Filter:
  // - Super Admin: returns [] (Super Admin chỉ quản trị hệ thống, dữ liệu báo giá thuộc C1 & C2)
  // - Cấp 1: views own quotes and all quotes created by their managed C2 sales team
  // - Cấp 2: ONLY views quotes created by self or where salesRepId/salesRepName matches self
  const filteredQuotations = quotations.filter((q) => {
    if (currentUser.role === 'super_admin') {
      return false; // Super Admin chỉ quản trị hệ thống
    }
    if (currentUser.role === 'manager_c1') {
      const managedC2 = users.filter(
        (u) => u.managerId === currentUser.id || u.createdBy === currentUser.id
      );
      const managedC2Ids = managedC2.map((u) => u.id);
      const managedC2Names = managedC2.map((u) => u.name);
      return (
        q.salesRepId === currentUser.id ||
        q.salesRepName === currentUser.name ||
        (q.createdBy && q.createdBy === currentUser.id) ||
        managedC2Ids.includes(q.salesRepId) ||
        managedC2Names.includes(q.salesRepName) ||
        (q.createdBy ? managedC2Ids.includes(q.createdBy) : false)
      );
    }
    // Cấp 2 (Sales): CHỈ hiển thị báo giá do chính mình tạo hoặc đứng tên
    return (
      q.salesRepId === currentUser.id ||
      q.salesRepName === currentUser.name ||
      (q.createdBy && q.createdBy === currentUser.id)
    );
  });

  const getCustomerQuotations = (customerId: string) => {
    return quotations
      .filter((q) => q.customerId === customerId)
      .sort((a, b) => b.version - a.version);
  };

  const createQuotation = (quoteData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    const newQuote: Quotation = {
      ...quoteData,
      id: `quote-${Date.now()}`,
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
    const newContract: Contract = {
      id: contractId,
      contractNumber,
      quotationId: quote.id,
      quoteNumber: quote.quoteNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerCompany: quote.customerCompany,
      customerAddress: quote.customerAddress,
      customerPhone: quote.customerPhone,
      companyName: quote.companyName || companyInfo.name,
      companyTaxCode: quote.companyTaxCode || companyInfo.taxCode,
      companyAddress: quote.companyAddress || companyInfo.address,
      companyPhone: quote.companyHotline || companyInfo.phone || companyInfo.hotline,
      companyEmail: quote.companyEmail || companyInfo.email,
      companyWebsite: quote.companyWebsite || companyInfo.website,
      companyLogo: quote.companyLogo || companyInfo.logoUrl || companyInfo.logo,
      salesRepId: quote.salesRepId,
      salesRepName: quote.salesRepName,
      salesRepPhone: quote.salesRepPhone,
      contractDate: now,
      deliveryDate: contractDetails?.deliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      deliveryAddress: contractDetails?.deliveryAddress || quote.customerAddress || 'Giao tại chân công trình',
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
          contractId,
          contractNumber,
          quoteNumber: quote.quoteNumber,
          customerId: quote.customerId,
          customerName: quote.customerName,
          salesRepName: quote.salesRepName,
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
          contractId,
          contractNumber,
          quoteNumber: quote.quoteNumber,
          customerId: quote.customerId,
          customerName: quote.customerName,
          salesRepName: quote.salesRepName,
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
          contractId,
          contractNumber,
          quoteNumber: quote.quoteNumber,
          customerId: quote.customerId,
          customerName: quote.customerName,
          salesRepName: quote.salesRepName,
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
          contractId,
          contractNumber,
          quoteNumber: quote.quoteNumber,
          customerId: quote.customerId,
          customerName: quote.customerName,
          salesRepName: quote.salesRepName,
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
  // - Super Admin: returns [] (Super Admin chỉ quản trị hệ thống)
  // - Cấp 1: views own contracts and contracts of their managed C2 sales team
  // - Cấp 2: ONLY views own contracts
  const filteredContracts = contracts.filter((c) => {
    if (currentUser.role === 'super_admin') {
      return false; // Super Admin chỉ quản trị hệ thống
    }
    if (currentUser.role === 'manager_c1') {
      const managedC2 = users.filter(
        (u) => u.managerId === currentUser.id || u.createdBy === currentUser.id
      );
      const managedC2Ids = managedC2.map((u) => u.id);
      const managedC2Names = managedC2.map((u) => u.name);
      return (
        c.salesRepId === currentUser.id ||
        c.salesRepName === currentUser.name ||
        managedC2Ids.includes(c.salesRepId) ||
        managedC2Names.includes(c.salesRepName)
      );
    }
    // Cấp 2 (Sales): CHỈ hiển thị hợp đồng do chính mình tạo / đứng tên
    return (
      c.salesRepId === currentUser.id ||
      c.salesRepName === currentUser.name
    );
  });

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
  // - Super Admin: returns [] (Super Admin quản lý kho tổng, không xem danh sách giữ/đặt riêng lẻ của sale)
  // - Cấp 1: views items created by self or their managed C2 sales team
  // - Cấp 2: ONLY views items associated with their name or id
  const filteredReserveItems = reserveItems.filter((r) => {
    if (currentUser.role === 'super_admin') return false;
    if (currentUser.role === 'manager_c1') {
      const managedC2 = users.filter(
        (u) => u.managerId === currentUser.id || u.createdBy === currentUser.id
      );
      const managedNames = managedC2.map((u) => u.name);
      return (
        r.salesRepName === currentUser.name ||
        managedNames.includes(r.salesRepName)
      );
    }
    // Cấp 2 (Sales): CHỈ hiển thị danh sách do chính mình phụ trách
    return r.salesRepName === currentUser.name;
  });

  const filteredOrderItems = orderItems.filter((o) => {
    if (currentUser.role === 'super_admin') return false;
    if (currentUser.role === 'manager_c1') {
      const managedC2 = users.filter(
        (u) => u.managerId === currentUser.id || u.createdBy === currentUser.id
      );
      const managedNames = managedC2.map((u) => u.name);
      return (
        o.salesRepName === currentUser.name ||
        managedNames.includes(o.salesRepName)
      );
    }
    // Cấp 2 (Sales): CHỈ hiển thị danh sách do chính mình phụ trách
    return o.salesRepName === currentUser.name;
  });

  // Derived synced inventory: ensures reservedQuantity matches active holding reserves, and available is total - reserved
  const syncedInventory = useMemo(() => {
    const reserveMap = new Map<string, number>();
    reserveItems.forEach((r) => {
      if (r.status === 'holding') {
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
  }, [inventory, reserveItems]);

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

    // 2. Clear localStorage
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
        localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
        await clearCollectionFromCloud(COLLECTIONS.PRODUCTS);
      } else {
        const myCompanyId = companyScope.companyId;
        setProducts((prev) => prev.filter((p) => p.companyId !== myCompanyId && p.createdBy !== currentUser.id));
        await clearCompanyProductsFromCloud(myCompanyId);
      }
    }

    if (options.clearInventory) {
      if (currentUser.role === 'super_admin') {
        setInventory([]);
        localStorage.removeItem(STORAGE_KEYS.INVENTORY);
        await clearCollectionFromCloud(COLLECTIONS.INVENTORY);
      } else {
        const myCompanyId = companyScope.companyId;
        setInventory((prev) => prev.filter((i) => i.companyId !== myCompanyId && i.createdBy !== currentUser.id));
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
        products: filteredProducts,
        allProducts: products,
        addProduct,
        updateProduct,
        deleteProduct,
        importProducts,
        inventory: filteredInventory,
        allInventory: inventory,
        updateInventoryItem,
        addInventoryItem,
        deleteInventoryItem,
        importInventory,
        quickAdjustStock,
        receiveOrderToWarehouseAndReserve,
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
