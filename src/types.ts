// =============================================================================
// ROLE & STATUS TYPES
// =============================================================================

// Backward-compatible role names: manager_c1 = Level 1, sales_c2 = Level 2
export type UserRole = 'super_admin' | 'manager_c1' | 'sales_c2';
export type UserStatus = 'active' | 'pending' | 'pending_approval' | 'blocked' | 'archived' | 'inactive';

// Role helper constants for clarity
export const ROLE = {
  SUPER_ADMIN: 'super_admin' as UserRole,
  LEVEL_1: 'manager_c1' as UserRole,
  LEVEL_2: 'sales_c2' as UserRole,
} as const;

// Normalized status (pending_approval & inactive map to pending/blocked for backward compat)
export const STATUS = {
  PENDING: 'pending' as UserStatus,
  ACTIVE: 'active' as UserStatus,
  BLOCKED: 'blocked' as UserStatus,
  ARCHIVED: 'archived' as UserStatus,
} as const;

// Helper: check if user status allows app access
export function isUserActive(status: UserStatus): boolean {
  return status === 'active';
}

// Helper: check if user status is pending (both old and new format)
export function isUserPending(status: UserStatus): boolean {
  return status === 'pending' || status === 'pending_approval';
}

// Helper: check if user is blocked/archived/inactive
export function isUserBlocked(status: UserStatus): boolean {
  return status === 'blocked' || status === 'archived' || status === 'inactive';
}

// =============================================================================
// ORGANIZATION (Tenant)
// =============================================================================

export interface Organization {
  id: string;
  ownerId: string; // Level 1 user ID who owns this organization
  ownerName: string;
  name: string; // Organization / Company name
  createdAt: string;
}

// =============================================================================
// USER
// =============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  password?: string; // Mật khẩu tài khoản
  avatar?: string;
  status: UserStatus;
  organizationId: string; // REQUIRED — Tenant ID (Mỗi Level 1 là 1 organizationId độc lập)
  parentId?: string; // Level 1 user ID who manages this Level 2
  managerId?: string; // Alias for parentId — Level 1 user ID who manages this Level 2
  department?: string;
  position?: string; // Chức danh/vị trí (VD: Giám đốc kinh doanh, Kỹ sư dự án...)
  createdBy?: string; // Which Cấp 1 or Super Admin created this user
  createdAt: string;
}

// =============================================================================
// CUSTOMER MEMBER (Phân quyền khách hàng cho Level 2)
// =============================================================================

export interface CustomerMember {
  id: string;
  customerId: string;
  userId: string;
  userName: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
}

// =============================================================================
// COMPANY INFO (Brand Identity per Organization)
// =============================================================================

export interface CompanyInfo {
  id: string;
  organizationId?: string;
  name: string; // Tên hiển thị công ty
  legalName?: string; // Tên đăng ký doanh nghiệp
  address: string; // Trụ sở / Showroom
  taxCode: string; // Mã số thuế (MST)
  logoUrl?: string; // Logo (Base64 hoặc URL)
  logo?: string; // Alias for logoUrl
  industry?: string;
  phone: string; // Hotline / Điện thoại
  hotline?: string;
  email: string; // Email công ty
  website: string; // Website
  bankName?: string; // Tên ngân hàng
  bankAccountNumber?: string; // Số tài khoản ngân hàng
  bankAccountHolder?: string; // Tên chủ tài khoản
  directorName?: string; // Người đại diện pháp luật / Giám đốc
  directorTitle?: string; // Chức vụ người đại diện (VD: Tổng Giám Đốc)
  updatedBy?: string; // Người cập nhật cuối
  updatedAt?: string; // Thời gian cập nhật
}

// =============================================================================
// CUSTOMER
// =============================================================================

export type CustomerStage = 'new' | 'contacted' | 'quoting' | 'contract_signed' | 'rejected';

export interface Customer {
  id: string;
  code: string; // KH-001
  name: string;
  company?: string;
  phone: string;
  email: string;
  address?: string;
  taxCode?: string;
  stage: CustomerStage;
  organizationId: string; // REQUIRED — Organization ID (Tenant Level 1)
  assignedToId: string; // Level 2 user id phụ trách chính
  assignedToName: string;
  memberIds?: string[]; // Danh sách ID các Level 2 được Level 1 phân quyền truy cập khách hàng này
  createdBy: string;
  rejectReason?: string;
  notes?: string;
  expectedValue: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// PRODUCT PRICE ITEM
// =============================================================================

export interface ProductPriceItem {
  sku: string; // Mã hàng (khóa chính xuyên suốt)
  name: string; // Tên hàng
  category: string; // Phân loại (Đèn trang trí, Thiết bị điện, Cáp điện, Nội thất...)
  brand: string; // Hãng (Philips, Panasonic, Schneider, Rạng Đông, Paragon...)
  color: string; // Màu sắc (Trắng, Đen, Vàng, Bạc, Warm 3000K...)
  size: string; // Kích thước / Quy cách (D600, L1200, 15W, 3x2.5mm2...)
  unit: string; // Đơn vị tính (Bộ, Cái, Mét, Cuộn...)
  listPrice: number; // Giá niêm yết
  dpPrice: number; // Giá DP (Giá thấp nhất có thể bán ra - Floor Price)
  description?: string;
  status: 'active' | 'discontinued';
  organizationId?: string; // Tenant Level 1 ID
  companyId?: string; // DEPRECATED — use organizationId. Kept for backward compatibility
  createdBy?: string; // ID của người tạo (C1 hoặc C2)
  createdByName?: string;
}

// =============================================================================
// INVENTORY ITEM
// =============================================================================

export interface InventoryItem {
  sku: string; // Mã hàng
  name: string;
  unit: string;
  totalQuantity: number; // Tồn thực tế
  reservedQuantity: number; // Đang giữ hàng
  availableQuantity: number; // Khả dụng = total - reserved
  warehouseLocation?: string; // Vị trí kho (Kho A1, Kho B2, Tổng kho HCM, Kho Hà Nội...)
  updatedAt: string;
  organizationId?: string; // Tenant Level 1 ID
  companyId?: string; // DEPRECATED — use organizationId. Kept for backward compatibility
  createdBy?: string; // ID của người tạo/cập nhật (C1 hoặc C2)
  createdByName?: string;
}

// =============================================================================
// QUOTE PRODUCT ROW
// =============================================================================

export interface QuoteProductRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  color: string;
  size: string;
  unit: string;
  listPrice: number;
  dpPrice: number;
  quotedPrice: number; // Đơn giá chào bán cho khách
  quantity: number;
  discountPercent: number; // % chiết khấu
  totalAmount: number; // (quotedPrice * quantity)
  inventoryAvailable: number; // Số tồn khả dụng tại thời điểm báo
  isBelowDP: boolean; // Cảnh báo dưới giá sàn DP
  notes?: string;
}

// =============================================================================
// PAYMENT MILESTONE
// =============================================================================

export interface PaymentMilestone {
  id: string;
  milestoneName: string; // "Đợt 1: Tạm ứng khi ký HĐ", "Đợt 2: Thanh toán khi giao hàng", "Đợt 3: Quyết toán"
  percentage: number; // 30, 50, 20
  amount: number;
  expectedDate?: string;
  conditionDescription: string; // "Sau 03 ngày kể từ ngày ký HĐ", "Khi hàng tập kết tại công trình"
  status: 'pending' | 'completed' | 'overdue';
}

// =============================================================================
// QUOTATION
// =============================================================================

export type QuotationStatus = 'draft' | 'sent' | 'negotiating' | 'approved_contract' | 'cancelled';

export interface Quotation {
  id: string;
  organizationId?: string; // Tenant Level 1 ID
  quoteNumber: string; // BG-2026-001 hoặc 01/HHG
  version: number; // 1, 2, 3... (Đợt báo giá lần 1, 2, 3...)
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCompany?: string;
  customerAddress?: string;
  customerTaxCode?: string;
  salesRepId: string; // Cấp 2
  salesRepName: string;
  salesRepPhone?: string;
  salesRepEmail?: string;
  title: string; // Tiêu đề báo giá (ví dụ: BÁO GIÁ THIẾT BỊ VỆ SINH)
  date: string;
  validUntil: string;
  
  // Customizable Header & Company Info (Như form HHG Holdings)
  companyName?: string; // Tên công ty (ví dụ: CÔNG TY TNHH HHG HOLDINGS)
  companyAddress?: string; // Địa chỉ công ty
  companyTaxCode?: string; // Mã số thuế
  companyLogo?: string; // Logo công ty
  companyLogoUrl?: string; // Alias for company logo
  companyHotline?: string; // Hotline
  companyWebsite?: string; // Website
  companyEmail?: string; // Email công ty
  orderCode?: string; // Số ĐH (ví dụ: 01/HHG)
  projectLocation?: string; // ĐỊA CHỈ/CÔNG TRÌNH (ví dụ: STARLAKE)
  contactPerson?: string; // NGƯỜI LIÊN HỆ (ví dụ: CHỊ HUYỀN)
  openingGreeting?: string; // Lời chào mở đầu

  // Customizable Footer & Terms Info (Như form trang 10)
  priceTerms?: string; // Điều khoản 1: Đơn giá & VAT
  deliveryTerms?: string; // Điều khoản 2: Địa chỉ giao hàng
  shippingTerms?: string; // Điều khoản 3: Chi phí vận chuyển
  warrantyTerms?: string; // Điều khoản 4: Bảo hành
  leadTimeTerms?: string; // Điều khoản 5: Tiến độ cấp hàng
  customTerms?: string; // Các điều khoản bổ sung
  closingNotes?: string; // Lời kết & cảm ơn
  signatoryTitle?: string; // Đơn vị ký (ví dụ: CÔNG TY TNHH HHG HOLDINGS)

  items: QuoteProductRow[];
  subtotal: number;
  discountTotal: number;
  taxRate: number; // 8% or 10%
  taxAmount: number;
  grandTotal: number;
  milestones: PaymentMilestone[];
  status: QuotationStatus;
  isContractQuote: boolean; // Đã chốt thành báo giá ký hợp đồng
  contractId?: string;
  createdBy?: string;
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CONTRACT
// =============================================================================

export interface Contract {
  id: string;
  organizationId?: string; // Tenant Level 1 ID
  contractNumber: string; // HĐKT-2026-001
  quotationId: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  createdBy?: string;
  customerCompany?: string;
  customerTaxCode?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerRepresentative?: string;
  customerPosition?: string;
  companyName?: string;
  companyAddress?: string;
  companyTaxCode?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyLogo?: string;
  companyLogoUrl?: string;
  salesRepId: string;
  salesRepName: string;
  salesRepPhone?: string;
  contractDate: string;
  deliveryDate: string;
  deliveryAddress: string;
  items: QuoteProductRow[];
  totalValue: number;
  milestones: PaymentMilestone[];
  status: 'draft' | 'signed' | 'delivering' | 'completed' | 'terminated';
  reserveBatchId?: string;
  orderBatchId?: string;
  createdAt: string;
}

// =============================================================================
// RESERVE ITEM
// =============================================================================

export interface ReserveItem {
  id: string;
  organizationId?: string; // Tenant Level 1 ID
  contractId: string;
  contractNumber: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  salesRepName: string;
  sku: string;
  productName: string;
  unit: string;
  reservedQuantity: number;
  warehouseLocation: string;
  reservedDate: string;
  status: 'holding' | 'dispatched' | 'cancelled';
  expectedDeliveryDate: string;
}

// =============================================================================
// ORDER ITEM
// =============================================================================

export interface OrderItem {
  id: string;
  organizationId?: string; // Tenant Level 1 ID
  contractId: string;
  contractNumber: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  salesRepName: string;
  sku: string;
  productName: string;
  unit: string;
  orderQuantity: number; // Số lượng cần đặt mua thêm
  brand: string;
  size: string;
  color: string;
  orderDate: string;
  status: 'pending_order' | 'ordered' | 'arrived_in_stock' | 'cancelled';
  supplierETA?: string;
  notes?: string;
}

// =============================================================================
// PERMISSION HELPERS
// =============================================================================

/**
 * Resolves the organizationId for a user.
 * - Super Admin: 'system_admin'
 * - Level 1: their own organizationId (or their user id as fallback)
 * - Level 2: inherited from their Level 1 manager's organizationId
 */
export function resolveOrganizationId(user: User, allUsers?: User[]): string {
  if (user.role === 'super_admin') return 'system_admin';
  
  // Use organizationId if set
  if (user.organizationId && user.organizationId !== '') return user.organizationId;
  
  // Level 1: use own id as org id (backward compat)
  if (user.role === 'manager_c1') return user.id;
  
  // Level 2: find manager's org id
  if (user.role === 'sales_c2' && allUsers) {
    const mgrId = user.managerId || user.parentId || user.createdBy;
    if (mgrId) {
      const mgr = allUsers.find(u => u.id === mgrId);
      if (mgr) return resolveOrganizationId(mgr);
    }
  }
  
  return user.id; // Absolute fallback
}

/**
 * Check if a Level 2 user has permission to access a specific customer.
 * Level 2 can see a customer if:
 * 1. They created the customer (createdBy === userId)
 * 2. They are assigned to the customer (assignedToId === userId)
 * 3. They are in the customer's memberIds array (explicitly granted by Level 1)
 */
export function canLevel2AccessCustomer(userId: string, customer: Customer): boolean {
  return (
    customer.createdBy === userId ||
    customer.assignedToId === userId ||
    (customer.memberIds?.includes(userId) ?? false)
  );
}

/**
 * Check if a Level 2 user has permission to access a specific quotation.
 * Permission is inherited from the associated customer.
 */
export function canLevel2AccessQuotation(userId: string, quotation: Quotation, customers: Customer[]): boolean {
  // Direct match: created by or sales rep
  if (quotation.createdBy === userId || quotation.salesRepId === userId) return true;
  
  // Inherited from customer
  const customer = customers.find(c => c.id === quotation.customerId);
  if (customer) return canLevel2AccessCustomer(userId, customer);
  
  return false;
}

/**
 * Check if a Level 2 user has permission to access a specific contract.
 * Permission is inherited from the associated customer.
 */
export function canLevel2AccessContract(userId: string, contract: Contract, customers: Customer[]): boolean {
  // Direct match: created by or sales rep
  if (contract.createdBy === userId || contract.salesRepId === userId) return true;
  
  // Inherited from customer
  const customer = customers.find(c => c.id === contract.customerId);
  if (customer) return canLevel2AccessCustomer(userId, customer);
  
  return false;
}

/**
 * Validate that a user update does not tamper with protected fields.
 * Returns list of violations.
 */
export function validateUserUpdate(
  currentUser: User,
  targetUser: User,
  updatedFields: Partial<User>
): string[] {
  const violations: string[] = [];
  
  // Only Super Admin can change roles
  if (updatedFields.role !== undefined && updatedFields.role !== targetUser.role) {
    if (currentUser.role !== 'super_admin') {
      violations.push('Không được phép thay đổi vai trò (role)');
    }
  }
  
  // Nobody can change their own organizationId (except through proper flows)
  if (updatedFields.organizationId !== undefined && updatedFields.organizationId !== targetUser.organizationId) {
    if (currentUser.role !== 'super_admin') {
      violations.push('Không được phép thay đổi tổ chức (organizationId)');
    }
  }
  
  // Level 2 cannot change their managerId/parentId
  if (currentUser.role === 'sales_c2') {
    if (updatedFields.managerId !== undefined && updatedFields.managerId !== targetUser.managerId) {
      violations.push('Không được phép thay đổi quản lý (managerId)');
    }
    if (updatedFields.parentId !== undefined && updatedFields.parentId !== targetUser.parentId) {
      violations.push('Không được phép thay đổi parentId');
    }
  }
  
  return violations;
}
