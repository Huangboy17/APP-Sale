import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Customer,
  CustomerStage,
  ProductPriceItem,
  InventoryItem,
  Quotation,
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

interface AppContextType {
  // Current user & Auth
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  approveManagerC1: (userId: string) => void;
  rejectManagerC1: (userId: string) => void;
  createSalesC2: (user: Omit<User, 'id' | 'createdAt' | 'status'>) => void;
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
  deleteQuotation: (id: string) => void;
  finalizeQuoteToContract: (quoteId: string, contractDetails?: Partial<Contract>) => { contract: Contract; reserveItems: ReserveItem[]; orderItems: OrderItem[] };

  // Contracts (Hợp đồng)
  contracts: Contract[];
  filteredContracts: Contract[];
  updateContract: (contract: Contract) => void;
  updateContractMilestoneStatus: (contractId: string, milestoneId: string, status: 'pending' | 'completed' | 'overdue') => void;

  // Split Tables: Giữ hàng & Đặt hàng
  reserveItems: ReserveItem[];
  updateReserveStatus: (id: string, status: 'holding' | 'dispatched' | 'cancelled') => void;
  orderItems: OrderItem[];
  updateOrderStatus: (id: string, status: 'pending_order' | 'ordered' | 'arrived_in_stock' | 'cancelled', notes?: string) => void;

  // Active view navigation
  activeTab: 'dashboard' | 'customers' | 'quotations' | 'contracts' | 'price_data' | 'inventory' | 'reserve_orders' | 'team';
  setActiveTab: (tab: 'dashboard' | 'customers' | 'quotations' | 'contracts' | 'price_data' | 'inventory' | 'reserve_orders' | 'team') => void;

  // Quick modals state
  isCreateQuoteModalOpen: boolean;
  setIsCreateQuoteModalOpen: (open: boolean) => void;
  selectedQuoteForModal: Quotation | null;
  setSelectedQuoteForModal: (quote: Quotation | null) => void;
  selectedCustomerIdForQuote: string | null;
  setSelectedCustomerIdForQuote: (id: string | null) => void;

  // PDF Preview State
  pdfPreviewData: { type: 'quote' | 'contract'; data: Quotation | Contract } | null;
  setPdfPreviewData: (data: { type: 'quote' | 'contract'; data: Quotation | Contract } | null) => void;

  // Reset to demo
  resetDataToDefault: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'salesflow_users_v1',
  CURRENT_USER_ID: 'salesflow_current_user_id_v1',
  CUSTOMERS: 'salesflow_customers_v1',
  PRODUCTS: 'salesflow_products_v1',
  INVENTORY: 'salesflow_inventory_v1',
  QUOTATIONS: 'salesflow_quotations_v1',
  CONTRACTS: 'salesflow_contracts_v1',
  RESERVES: 'salesflow_reserves_v1',
  ORDERS: 'salesflow_orders_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or defaults
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const found = INITIAL_USERS.find((u) => u.id === savedId);
    return found || INITIAL_USERS[3]; // Default to Bùi Viết Hoàng (Cấp 2) or Cấp 1
  });

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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'quotations' | 'contracts' | 'price_data' | 'inventory' | 'reserve_orders' | 'team'>('dashboard');

  const [isCreateQuoteModalOpen, setIsCreateQuoteModalOpen] = useState(false);
  const [selectedQuoteForModal, setSelectedQuoteForModal] = useState<Quotation | null>(null);
  const [selectedCustomerIdForQuote, setSelectedCustomerIdForQuote] = useState<string | null>(null);
  const [pdfPreviewData, setPdfPreviewData] = useState<{ type: 'quote' | 'contract'; data: Quotation | Contract } | null>(null);

  // Sync to localStorage
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

  // User management
  const approveManagerC1 = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'active' as const } : u))
    );
  };

  const rejectManagerC1 = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'inactive' as const } : u))
    );
  };

  const createSalesC2 = (userData: Omit<User, 'id' | 'createdAt' | 'status'>) => {
    const newUser: User = {
      ...userData,
      id: `user-sales-${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Customers Logic - RBAC Filter: Cấp 2 only sees assigned & created
  const filteredCustomers = customers.filter((cust) => {
    if (currentUser.role === 'super_admin' || currentUser.role === 'manager_c1') {
      return true;
    }
    // Sales Cấp 2: Chỉ xem khách được giao hoặc tự tạo
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
    return newCust;
  };

  const updateCustomer = (updated: Customer) => {
    const now = new Date().toISOString().split('T')[0];
    setCustomers((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...updated, updatedAt: now } : c))
    );
  };

  const updateCustomerStage = (customerId: string, stage: CustomerStage, rejectReason?: string) => {
    const now = new Date().toISOString().split('T')[0];
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            stage,
            rejectReason: stage === 'rejected' ? rejectReason : c.rejectReason,
            updatedAt: now,
          };
        }
        return c;
      })
    );
  };

  const assignCustomer = (customerId: string, salesId: string, salesName: string) => {
    const now = new Date().toISOString().split('T')[0];
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, assignedToId: salesId, assignedToName: salesName, updatedAt: now }
          : c
      )
    );
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  // Products Data Giá
  const addProduct = (prod: ProductPriceItem) => {
    setProducts((prev) => [prod, ...prev]);
    // Also create corresponding inventory item if not exists
    setInventory((prev) => {
      if (!prev.some((item) => item.sku === prod.sku)) {
        return [
          ...prev,
          {
            sku: prod.sku,
            name: prod.name,
            unit: prod.unit,
            totalQuantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            warehouseLocation: 'Kho Mới',
            updatedAt: new Date().toISOString().split('T')[0],
          },
        ];
      }
      return prev;
    });
  };

  const updateProduct = (updated: ProductPriceItem) => {
    setProducts((prev) => prev.map((p) => (p.sku === updated.sku ? updated : p)));
    setInventory((prev) =>
      prev.map((inv) => (inv.sku === updated.sku ? { ...inv, name: updated.name, unit: updated.unit } : inv))
    );
  };

  const deleteProduct = (sku: string) => {
    setProducts((prev) => prev.filter((p) => p.sku !== sku));
  };

  const importProducts = (newProducts: ProductPriceItem[]) => {
    setProducts((prev) => {
      const map = new Map<string, ProductPriceItem>();
      prev.forEach((p) => map.set(p.sku, p));
      newProducts.forEach((p) => map.set(p.sku, p));
      return Array.from(map.values());
    });

    // Ensure inventory entries exist
    setInventory((prev) => {
      const invMap = new Map<string, InventoryItem>();
      prev.forEach((i) => invMap.set(i.sku, i));
      newProducts.forEach((p) => {
        if (!invMap.has(p.sku)) {
          invMap.set(p.sku, {
            sku: p.sku,
            name: p.name,
            unit: p.unit,
            totalQuantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            warehouseLocation: 'Kho Mới',
            updatedAt: new Date().toISOString().split('T')[0],
          });
        }
      });
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
  };

  const quickAdjustStock = (sku: string, deltaQty: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.sku === sku) {
          const newTotal = Math.max(0, item.totalQuantity + deltaQty);
          const newAvailable = Math.max(0, newTotal - item.reservedQuantity);
          return {
            ...item,
            totalQuantity: newTotal,
            availableQuantity: newAvailable,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return item;
      })
    );
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
      return Array.from(map.values());
    });
  };

  // Quotations
  const filteredQuotations = quotations.filter((q) => {
    if (currentUser.role === 'super_admin' || currentUser.role === 'manager_c1') {
      return true;
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

    // Automatically update customer stage to 'quoting' if it was 'new' or 'contacted'
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === quoteData.customerId && (c.stage === 'new' || c.stage === 'contacted')) {
          return { ...c, stage: 'quoting', updatedAt: now };
        }
        return c;
      })
    );

    return newQuote;
  };

  const updateQuotation = (quotation: Quotation) => {
    const now = new Date().toISOString().split('T')[0];
    setQuotations((prev) =>
      prev.map((q) => (q.id === quotation.id ? { ...quotation, updatedAt: now } : q))
    );
  };

  const deleteQuotation = (id: string) => {
    setQuotations((prev) => prev.filter((q) => q.id !== id));
  };

  // CRITICAL REQUIREMENT: Finalize Quote to Contract + Automatic Split of Reserve & Order
  const finalizeQuoteToContract = (quoteId: string, contractDetails?: Partial<Contract>) => {
    const quote = quotations.find((q) => q.id === quoteId);
    if (!quote) throw new Error('Không tìm thấy báo giá');

    const now = new Date().toISOString().split('T')[0];
    const contractId = `contract-${Date.now()}`;
    const contractNumber = contractDetails?.contractNumber || `HĐKT-${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}-${quote.quoteNumber.replace(/[^a-zA-Z0-9]/g, '')}`;

    // 1. Mark quote as approved contract
    const updatedQuote: Quotation = {
      ...quote,
      status: 'approved_contract',
      isContractQuote: true,
      contractId,
      updatedAt: now,
    };
    setQuotations((prev) => prev.map((q) => (q.id === quoteId ? updatedQuote : q)));

    // 2. Update Customer stage to 'contract_signed'
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === quote.customerId ? { ...c, stage: 'contract_signed', updatedAt: now } : c
      )
    );

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

    // Cập nhật State
    setInventory(Array.from(updatedInventoryMap.values()));
    setReserveItems((prev) => [...newReserveList, ...prev]);
    setOrderItems((prev) => [...newOrderList, ...prev]);

    return {
      contract: newContract,
      reserveItems: newReserveList,
      orderItems: newOrderList,
    };
  };

  // Contracts
  const filteredContracts = contracts.filter((c) => {
    if (currentUser.role === 'super_admin' || currentUser.role === 'manager_c1') {
      return true;
    }
    return c.salesRepId === currentUser.id;
  });

  const updateContract = (updated: Contract) => {
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const updateContractMilestoneStatus = (contractId: string, milestoneId: string, status: 'pending' | 'completed' | 'overdue') => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id === contractId) {
          const updatedMs = c.milestones.map((m) => (m.id === milestoneId ? { ...m, status } : m));
          return { ...c, milestones: updatedMs };
        }
        return c;
      })
    );
  };

  // Logistics Split tables
  const updateReserveStatus = (id: string, status: 'holding' | 'dispatched' | 'cancelled') => {
    setReserveItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const updateOrderStatus = (id: string, status: 'pending_order' | 'ordered' | 'arrived_in_stock' | 'cancelled', notes?: string) => {
    setOrderItems((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, notes: notes !== undefined ? notes : o.notes } : o))
    );
  };

  const resetDataToDefault = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[3]);
    setCustomers(INITIAL_CUSTOMERS);
    setProducts(INITIAL_PRODUCTS);
    setInventory(INITIAL_INVENTORY);
    setQuotations(INITIAL_QUOTATIONS);
    setContracts(INITIAL_CONTRACTS);
    setReserveItems(INITIAL_RESERVE_ITEMS);
    setOrderItems(INITIAL_ORDER_ITEMS);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        approveManagerC1,
        rejectManagerC1,
        createSalesC2,
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
        deleteQuotation,
        finalizeQuoteToContract,
        contracts,
        filteredContracts,
        updateContract,
        updateContractMilestoneStatus,
        reserveItems,
        updateReserveStatus,
        orderItems,
        updateOrderStatus,
        activeTab,
        setActiveTab,
        isCreateQuoteModalOpen,
        setIsCreateQuoteModalOpen,
        selectedQuoteForModal,
        setSelectedQuoteForModal,
        selectedCustomerIdForQuote,
        setSelectedCustomerIdForQuote,
        pdfPreviewData,
        setPdfPreviewData,
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
