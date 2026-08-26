import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
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
  syncUserToCloud,
  deleteUserFromCloud,
  syncCustomerToCloud,
  deleteCustomerFromCloud,
  syncProductToCloud,
  batchSyncProductsToCloud,
  deleteProductFromCloud,
  syncInventoryItemToCloud,
  batchSyncInventoryToCloud,
  syncQuotationToCloud,
  deleteQuotationFromCloud,
  syncContractToCloud,
  syncReserveItemToCloud,
  batchSyncReservesToCloud,
  syncOrderItemToCloud,
  batchSyncOrdersToCloud,
} from '../services/firestoreSync';

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
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  login: (email: string, password?: string) => { success: boolean; message: string; user?: User };
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: UserRole;
    department: string;
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

  // Customers
  customers: Customer[];
  filteredCustomers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'code'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  updateCustomerStage: (customerId: string, stage: CustomerStage, rejectReason?: string) => void;
  assignCustomer: (customerId: string, salesId: string, salesName: string) => void;
  deleteCustomer: (customerId: string) => void;

  // Products (Data Giá)
  products: ProductPriceItem[];
  addProduct: (product: ProductPriceItem) => void;
  updateProduct: (product: ProductPriceItem) => void;
  deleteProduct: (sku: string) => void;
  importProducts: (newProducts: ProductPriceItem[]) => void;

  // Inventory (Tồn kho)
  inventory: InventoryItem[];
  updateInventoryItem: (item: InventoryItem) => void;
  importInventory: (newInventory: InventoryItem[]) => void;
  quickAdjustStock: (sku: string, deltaQty: number) => void;

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
  orderItems: OrderItem[];
  filteredOrderItems: OrderItem[];
  updateOrderStatus: (id: string, status: 'pending_order' | 'ordered' | 'arrived_in_stock' | 'cancelled', notes?: string) => void;

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
  cloudSyncStatus: 'connected' | 'syncing' | 'offline' | 'error';
  lastCloudSyncTime: Date | null;
  syncAllToCloudNow: () => Promise<void>;

  // Reset to demo
  resetDataToDefault: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'salesflow_users_v1',
  CURRENT_USER_ID: 'salesflow_current_user_id_v1',
  IS_AUTHENTICATED: 'salesflow_is_authenticated_v1',
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
    const found = INITIAL_USERS.find((u) => u.id === savedId);
    return found || INITIAL_USERS[0]; // Default to Super Admin (Bùi Viết Hoàng)
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
    if (saved === 'false') return false;
    return true; // Default logged in
  });

  const [authScreenMode, setAuthScreenMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [products, setProducts] = useState<ProductPriceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
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

  const [activeTab, setActiveTab] = useState<NavTabType>('dashboard');

  // Customer modal
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<Customer | null>(null);

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

    const initializeFirestoreRealtime = async () => {
      try {
        setCloudSyncStatus('syncing');
        await seedInitialDataIfEmpty();

        // 1. Users real-time listener
        const unsubUsers = onSnapshot(collection(db, COLLECTIONS.USERS), (snap) => {
          if (!snap.empty) {
            const list: User[] = [];
            snap.forEach((d) => list.push(d.data() as User));
            setUsers(list);
            setLastCloudSyncTime(new Date());
          }
        });
        unsubs.push(unsubUsers);

        // 2. Customers real-time listener
        const unsubCustomers = onSnapshot(collection(db, COLLECTIONS.CUSTOMERS), (snap) => {
          if (!snap.empty) {
            const list: Customer[] = [];
            snap.forEach((d) => list.push(d.data() as Customer));
            // Sort by creation date
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setCustomers(list);
            setLastCloudSyncTime(new Date());
          }
        });
        unsubs.push(unsubCustomers);

        // 3. Products real-time listener
        const unsubProducts = onSnapshot(collection(db, COLLECTIONS.PRODUCTS), (snap) => {
          if (!snap.empty) {
            const list: ProductPriceItem[] = [];
            snap.forEach((d) => list.push(d.data() as ProductPriceItem));
            setProducts(list);
            setLastCloudSyncTime(new Date());
          }
        });
        unsubs.push(unsubProducts);

        // 4. Inventory real-time listener
        const unsubInventory = onSnapshot(collection(db, COLLECTIONS.INVENTORY), (snap) => {
          if (!snap.empty) {
            const list: InventoryItem[] = [];
            snap.forEach((d) => list.push(d.data() as InventoryItem));
            setInventory(list);
            setLastCloudSyncTime(new Date());
          }
        });
        unsubs.push(unsubInventory);

        // 5. Quotations real-time listener
        const unsubQuotes = onSnapshot(collection(db, COLLECTIONS.QUOTATIONS), (snap) => {
          if (!snap.empty) {
            const list: Quotation[] = [];
            snap.forEach((d) => list.push(d.data() as Quotation));
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setQuotations(list);
            setLastCloudSyncTime(new Date());
          }
        });
        unsubs.push(unsubQuotes);

        // 6. Contracts real-time listener
        const unsubContracts = onSnapshot(collection(db, COLLECTIONS.CONTRACTS), (snap) => {
          if (!snap.empty) {
            const list: Contract[] = [];
            snap.forEach((d) => list.push(d.data() as Contract));
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setContracts(list);
            setLastCloudSyncTime(new Date());
          }
        });
        unsubs.push(unsubContracts);

        // 7. Reserves real-time listener
        const unsubReserves = onSnapshot(collection(db, COLLECTIONS.RESERVES), (snap) => {
          if (!snap.empty) {
            const list: ReserveItem[] = [];
            snap.forEach((d) => list.push(d.data() as ReserveItem));
            setReserveItems(list);
            setLastCloudSyncTime(new Date());
          }
        });
        unsubs.push(unsubReserves);

        // 8. Orders real-time listener
        const unsubOrders = onSnapshot(collection(db, COLLECTIONS.ORDERS), (snap) => {
          if (!snap.empty) {
            const list: OrderItem[] = [];
            snap.forEach((d) => list.push(d.data() as OrderItem));
            setOrderItems(list);
            setLastCloudSyncTime(new Date());
          }
        });
        unsubs.push(unsubOrders);

        setCloudSyncStatus('connected');
      } catch (err) {
        console.error('[Firestore] Initialization error:', err);
        setCloudSyncStatus('error');
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

  // Sync all current state to Google Cloud Firestore on demand
  const syncAllToCloudNow = async () => {
    try {
      setCloudSyncStatus('syncing');
      await Promise.all([
        ...users.map((u) => syncUserToCloud(u)),
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

    // Password verification (check exact or common demo fallback)
    if (password && user.password && user.password !== password && password !== '123' && password !== 'admin' && password !== '123456') {
      return {
        success: false,
        message: 'Mật khẩu không chính xác. Vui lòng thử lại hoặc bấm "Quên mật khẩu".',
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
    role: UserRole;
    department: string;
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

    // Determine initial status:
    // - Manager C1: 'pending_approval' (needs Super Admin approval)
    // - Sales C2: 'active'
    // - Super Admin: 'active'
    const initialStatus = userData.role === 'manager_c1' ? 'pending_approval' : 'active';

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name.trim(),
      email: userData.email.trim(),
      phone: userData.phone.trim() || '0901234567',
      password: userData.password || '123456',
      role: userData.role,
      department: userData.department || (userData.role === 'sales_c2' ? 'Phòng Kinh Doanh' : 'Ban Quản Lý'),
      managerId: userData.role === 'sales_c2' ? userData.managerId : undefined,
      status: initialStatus,
      createdAt: new Date().toISOString().split('T')[0],
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?w=120&auto=format&fit=crop&q=80`,
    };

    setUsers((prev) => [...prev, newUser]);
    syncUserToCloud(newUser);

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);

    if (newUser.role === 'manager_c1') {
      return {
        success: true,
        message: 'Đăng ký tài khoản Quản Lý / Giám Đốc (Cấp 1) thành công! Hồ sơ của bạn đang chờ Super Admin phê duyệt kích hoạt.',
        user: newUser,
      };
    }

    return {
      success: true,
      message: `Đăng ký thành công! Tài khoản Sales (Cấp 2) của bạn đã được kích hoạt.`,
      user: newUser,
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'false');
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
  // - Super Admin: views all users in the system
  // - Cấp 1 (Manager): views self and Cấp 2 accounts created/managed by this Cấp 1
  // - Cấp 2 (Sales): views only self
  const filteredUsers = users.filter((u) => {
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'manager_c1') {
      return u.id === currentUser.id || (u.role === 'sales_c2' && (u.managerId === currentUser.id || u.createdBy === currentUser.id));
    }
    return u.id === currentUser.id;
  });

  // Customers Logic - RBAC Filter:
  // - Super Admin: KHÔNG xem thông tin nội bộ của C1, C2 (returns empty list for operational customer data)
  // - Cấp 1: xem khách hàng do chính C1 phụ trách hoặc do các tài khoản Cấp 2 thuộc C1 đó quản lý/tạo
  // - Cấp 2: CHỈ xem khách hàng được phân công (assignedToId) hoặc do C2 đó tự tạo (createdBy)
  const filteredCustomers = customers.filter((cust) => {
    if (currentUser.role === 'super_admin') {
      return false; // Super admin strictly has no access to internal operational customer lists
    }
    if (currentUser.role === 'manager_c1') {
      const managedC2Ids = users
        .filter((u) => u.managerId === currentUser.id || u.createdBy === currentUser.id)
        .map((u) => u.id);
      return (
        cust.assignedToId === currentUser.id ||
        cust.createdBy === currentUser.id ||
        managedC2Ids.includes(cust.assignedToId) ||
        managedC2Ids.includes(cust.createdBy)
      );
    }
    // Cấp 2 (Sales)
    return cust.assignedToId === currentUser.id || cust.createdBy === currentUser.id;
  });

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'code'>) => {
    const now = new Date().toISOString().split('T')[0];
    const code = `KH-${new Date().getFullYear()}-${String(customers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      code,
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

  // Products Data Giá
  const addProduct = (prod: ProductPriceItem) => {
    setProducts((prev) => [prod, ...prev]);
    syncProductToCloud(prod);

    // Also create corresponding inventory item if not exists
    setInventory((prev) => {
      if (!prev.some((item) => item.sku === prod.sku)) {
        const newInv: InventoryItem = {
          sku: prod.sku,
          name: prod.name,
          unit: prod.unit,
          totalQuantity: 0,
          reservedQuantity: 0,
          availableQuantity: 0,
          warehouseLocation: 'Kho Mới',
          updatedAt: new Date().toISOString().split('T')[0],
        };
        syncInventoryItemToCloud(newInv);
        return [...prev, newInv];
      }
      return prev;
    });
  };

  const updateProduct = (updated: ProductPriceItem) => {
    setProducts((prev) => prev.map((p) => (p.sku === updated.sku ? updated : p)));
    syncProductToCloud(updated);

    setInventory((prev) => {
      const updatedList = prev.map((inv) => {
        if (inv.sku === updated.sku) {
          const syncedInv = { ...inv, name: updated.name, unit: updated.unit };
          syncInventoryItemToCloud(syncedInv);
          return syncedInv;
        }
        return inv;
      });
      return updatedList;
    });
  };

  const deleteProduct = (sku: string) => {
    setProducts((prev) => prev.filter((p) => p.sku !== sku));
    deleteProductFromCloud(sku);
  };

  const importProducts = (newProducts: ProductPriceItem[]) => {
    setProducts((prev) => {
      const map = new Map<string, ProductPriceItem>();
      prev.forEach((p) => map.set(p.sku, p));
      newProducts.forEach((p) => map.set(p.sku, p));
      const list = Array.from(map.values());
      batchSyncProductsToCloud(list);
      return list;
    });

    // Ensure inventory entries exist
    setInventory((prev) => {
      const invMap = new Map<string, InventoryItem>();
      prev.forEach((i) => invMap.set(i.sku, i));
      const newlyAdded: InventoryItem[] = [];

      newProducts.forEach((p) => {
        if (!invMap.has(p.sku)) {
          const item: InventoryItem = {
            sku: p.sku,
            name: p.name,
            unit: p.unit,
            totalQuantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            warehouseLocation: 'Kho Mới',
            updatedAt: new Date().toISOString().split('T')[0],
          };
          invMap.set(p.sku, item);
          newlyAdded.push(item);
        }
      });

      if (newlyAdded.length > 0) {
        batchSyncInventoryToCloud(newlyAdded);
      }

      return Array.from(invMap.values());
    });
  };

  // Inventory
  const updateInventoryItem = (item: InventoryItem) => {
    const available = Math.max(0, item.totalQuantity - item.reservedQuantity);
    const updated = {
      ...item,
      availableQuantity: available,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setInventory((prev) => prev.map((i) => (i.sku === item.sku ? updated : i)));
    syncInventoryItemToCloud(updated);
  };

  const quickAdjustStock = (sku: string, deltaQty: number) => {
    setInventory((prev) => {
      let targetItem: InventoryItem | null = null;
      const updated = prev.map((item) => {
        if (item.sku === sku) {
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

  const importInventory = (newInvList: InventoryItem[]) => {
    setInventory((prev) => {
      const map = new Map<string, InventoryItem>();
      prev.forEach((i) => map.set(i.sku, i));
      newInvList.forEach((item) => {
        const existing = map.get(item.sku);
        const reserved = existing ? existing.reservedQuantity : 0;
        const available = Math.max(0, item.totalQuantity - reserved);
        map.set(item.sku, {
          ...item,
          reservedQuantity: reserved,
          availableQuantity: available,
          updatedAt: new Date().toISOString().split('T')[0],
        });
      });
      const list = Array.from(map.values());
      batchSyncInventoryToCloud(list);
      return list;
    });
  };

  // Quotations - RBAC Filter:
  // - Super Admin: returns [] (no access to internal operational quotes)
  // - Cấp 1: views own quotes and quotes created by their managed C2 team
  // - Cấp 2: views ONLY their own quotes (q.salesRepId === currentUser.id)
  const filteredQuotations = quotations.filter((q) => {
    if (currentUser.role === 'super_admin') {
      return false;
    }
    if (currentUser.role === 'manager_c1') {
      const managedC2Ids = users
        .filter((u) => u.managerId === currentUser.id || u.createdBy === currentUser.id)
        .map((u) => u.id);
      return q.salesRepId === currentUser.id || managedC2Ids.includes(q.salesRepId);
    }
    return q.salesRepId === currentUser.id;
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

    // 3. Create Contract
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
  // - Super Admin: returns []
  // - Cấp 1: views own contracts and contracts of their managed C2 team
  // - Cấp 2: views ONLY their own contracts
  const filteredContracts = contracts.filter((c) => {
    if (currentUser.role === 'super_admin') {
      return false;
    }
    if (currentUser.role === 'manager_c1') {
      const managedC2Ids = users
        .filter((u) => u.managerId === currentUser.id || u.createdBy === currentUser.id)
        .map((u) => u.id);
      return c.salesRepId === currentUser.id || managedC2Ids.includes(c.salesRepId);
    }
    return c.salesRepId === currentUser.id;
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
  // - Super Admin: returns [] (operational orders and reserves are internal to sales/managers)
  // - Cấp 1: views items created by self or their managed C2 sales reps
  // - Cấp 2: views ONLY items associated with their name
  const filteredReserveItems = reserveItems.filter((r) => {
    if (currentUser.role === 'super_admin') return false;
    if (currentUser.role === 'manager_c1') {
      const managedC2Names = users
        .filter((u) => u.managerId === currentUser.id || u.createdBy === currentUser.id)
        .map((u) => u.name);
      return r.salesRepName === currentUser.name || managedC2Names.includes(r.salesRepName);
    }
    return r.salesRepName === currentUser.name;
  });

  const filteredOrderItems = orderItems.filter((o) => {
    if (currentUser.role === 'super_admin') return false;
    if (currentUser.role === 'manager_c1') {
      const managedC2Names = users
        .filter((u) => u.managerId === currentUser.id || u.createdBy === currentUser.id)
        .map((u) => u.name);
      return o.salesRepName === currentUser.name || managedC2Names.includes(o.salesRepName);
    }
    return o.salesRepName === currentUser.name;
  });

  const updateReserveStatus = (id: string, status: 'holding' | 'dispatched' | 'cancelled') => {
    setReserveItems((prev) => {
      let targetRes: ReserveItem | null = null;
      const updated = prev.map((r) => {
        if (r.id === id) {
          targetRes = { ...r, status };
          return targetRes;
        }
        return r;
      });
      if (targetRes) syncReserveItemToCloud(targetRes);
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
        approveManagerC1,
        rejectManagerC1,
        createSalesC2,
        addUser,
        approveUser,
        updateUser,
        deleteUser,
        customers,
        filteredCustomers,
        addCustomer,
        updateCustomer,
        updateCustomerStage,
        assignCustomer,
        deleteCustomer,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        importProducts,
        inventory,
        updateInventoryItem,
        importInventory,
        quickAdjustStock,
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
        orderItems,
        filteredOrderItems,
        updateOrderStatus,
        activeTab,
        setActiveTab,
        isCreateCustomerModalOpen,
        setIsCreateCustomerModalOpen,
        selectedCustomerForModal,
        setSelectedCustomerForModal,
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
