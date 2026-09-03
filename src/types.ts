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
  bankAccount?: string; // Alias for bankAccountNumber
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
  shippingAddress?: string;
  city?: string;
  taxCode?: string;
  contactPerson?: string;
  representative?: string; // Alias for contactPerson / legal representative
  position?: string;
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
  imageUrl?: string; // URL ảnh sản phẩm trên Cloud Storage
  image_url?: string; // Alias for imageUrl compatibility
  status: 'active' | 'discontinued';
  organizationId?: string; // Tenant Level 1 ID
  companyId?: string; // DEPRECATED — use organizationId. Kept for backward compatibility
  createdBy?: string; // ID của người tạo (C1 hoặc C2)
  createdByName?: string;
}

// Standard Intermediate Import Record (Excel/JSON -> PriceImportRecord)
export interface PriceImportRecord {
  product_code: string; // Mã SP / SKU
  product_name: string; // Tên SP
  unit: string; // ĐVT
  price: number; // Giá niêm yết
  dp_price?: number; // Giá DP (Giá sàn tối thiểu)
  category?: string; // Phân loại
  brand?: string; // Hãng sản xuất
  color?: string; // Màu sắc
  size?: string; // Kích thước / Quy cách
  description?: string; // Mô tả
  imageUrl?: string; // URL ảnh nếu có
  image_url?: string; // URL ảnh nếu có
  image_name?: string; // Tên file ảnh kèm theo (vd: AX-001.jpg)
}

export interface ValidatedPriceRow {
  rowIndex: number; // 1-indexed (row in file)
  record: PriceImportRecord;
  status: 'valid' | 'warning' | 'error';
  statusMessage: string;
  isExisting: boolean;
}

export interface PriceImportValidationResult {
  rows: ValidatedPriceRow[];
  totalCount: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  newItemsCount: number;
  updateItemsCount: number;
}

// =============================================================================
// PRODUCT IMAGE IMPORT TYPES
// =============================================================================

export interface MatchedImageItem {
  file: File;
  sku: string;
  fileName: string;
  fileSize: number;
  productName: string;
  brand?: string;
  unit?: string;
  existingImageUrl?: string;
  willOverwrite: boolean;
  previewUrl?: string;
}

export interface UnmatchedImageItem {
  file: File;
  fileName: string;
  derivedSku: string;
  reason: 'NOT_FOUND' | 'INVALID_FORMAT' | 'DUPLICATE' | 'EMPTY_SKU';
  reasonMessage: string;
}

export interface ImageImportMatchResult {
  matched: MatchedImageItem[];
  unmatched: UnmatchedImageItem[];
  totalFiles: number;
  matchedCount: number;
  unmatchedCount: number;
  overwriteCount: number;
  newImageCount: number;
}

export interface ImageImportProgress {
  total: number;
  completed: number;
  success: number;
  failed: number;
  currentSku: string;
  isProcessing: boolean;
  errors: Array<{ sku: string; fileName: string; errorMessage: string }>;
}

// =============================================================================
// INVENTORY ITEM
// =============================================================================

export interface InventoryItem {
  sku: string; // Mã hàng (SKU)
  name: string;
  unit: string;
  totalQuantity: number; // Tồn thực tế (On Hand)
  reservedQuantity: number; // Đang giữ hàng / đã phân bổ (Reserved / Allocated)
  availableQuantity: number; // Khả dụng = On Hand - Reserved
  onOrderQuantity?: number; // Đang đặt từ NCC / Hàng đang về (Incoming / On Order)
  incomingQuantity?: number; // Alias for onOrderQuantity
  reorderNeeded?: number; // Nhu cầu Sales chưa đáp ứng (Unfulfilled Demand)
  unfulfilledDemand?: number; // Alias for reorderNeeded
  warehouseLocation?: string; // Vị trí kho (Kho Tổng, Kho A1, Kho B2...)
  updatedAt: string;
  organizationId?: string; // Tenant Level 1 ID
  companyId?: string; // DEPRECATED — use organizationId
  createdBy?: string;
  createdByName?: string;
}

// =============================================================================
// STOCK TRANSACTION & LEDGER (LỊCH SỬ BIẾN ĐỘNG KHO)
// =============================================================================

export type StockTransactionType =
  | 'IMPORT' // Import Excel / Ban đầu
  | 'STOCK_IN' // Nhập kho từ NCC / Mua hàng
  | 'STOCK_OUT' // Xuất kho giao khách / Công trình
  | 'RESERVE' // Giữ hàng cho hợp đồng
  | 'RELEASE_RESERVATION' // Hủy giữ / Giải phóng tồn kho
  | 'ADJUSTMENT' // Điều chỉnh nhanh
  | 'AUDIT_ADJUSTMENT' // Cân bằng kiểm kê
  | 'RETURN'; // Khách trả hàng nhập lại kho

export interface StockTransaction {
  id: string;
  timestamp: string; // ISO DateTime
  date: string; // YYYY-MM-DD
  sku: string;
  productName: string;
  unit: string;
  type: StockTransactionType;
  deltaQuantity: number; // Số lượng thay đổi (+ hoặc -)
  beforeOnHand: number;
  afterOnHand: number;
  beforeReserved?: number;
  afterReserved?: number;
  beforeAvailable?: number;
  afterAvailable?: number;
  referenceCode?: string; // Số phiếu nhập/xuất, Mã hợp đồng, Mã giữ
  partnerName?: string; // Tên nhà cung cấp hoặc Tên khách hàng
  performedById: string;
  performedByName: string;
  organizationId: string;
  notes?: string;
}

// =============================================================================
// STOCK IN VOUCHER (PHIẾU NHẬP KHO)
// =============================================================================

export interface StockInVoucherItem {
  sku: string;
  productName: string;
  unit: string;
  expectedQuantity: number;
  actualQuantity: number;
  unitCost?: number;
  notes?: string;
}

export interface StockInVoucher {
  id: string;
  voucherNumber: string; // PNK-YYYYMMDD-XXXX
  purchaseOrderId?: string; // ID của PO liên kết (nếu nhập từ PO)
  purchaseOrderNumber?: string; // Mã PO liên kết
  date: string;
  supplierName: string;
  warehouseLocation: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  items: StockInVoucherItem[];
  totalQuantity: number;
  totalAmount?: number;
  createdById: string;
  createdByName: string;
  confirmedAt?: string;
  organizationId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// STOCK OUT VOUCHER (PHIẾU XUẤT KHO)
// =============================================================================

export type StockOutItemSourceType = 'RESERVE' | 'ORDER' | 'HYBRID';

export interface StockOutVoucherItem {
  id?: string;
  sku: string;
  productName: string;
  brand?: string;
  unit: string;
  quantity: number; // Số lượng xuất đợt này
  reservedQuantity?: number; // Số lượng giữ từ HĐ
  orderedQuantity?: number; // Số lượng đặt từ HĐ
  orderReceivedQuantity?: number; // Số lượng đặt đã về kho
  previouslyDispatchedQuantity?: number; // Số lượng đã xuất trước đó
  availableToDeliverQuantity?: number; // Số lượng còn có thể xuất
  sourceType?: StockOutItemSourceType;
  reserveItemId?: string;
  orderItemId?: string;
  notes?: string;
}

export interface StockOutVoucher {
  id: string;
  voucherNumber: string; // PXK-YYYYMMDD-XXXX
  date: string;
  contractId?: string;
  contractNumber?: string;
  customerName?: string;
  customerId?: string;
  reserveId?: string;
  warehouseLocation: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  items: StockOutVoucherItem[];
  totalQuantity: number;
  createdById: string;
  createdByName: string;
  confirmedAt?: string;
  receiverName?: string;
  receiverPhone?: string;
  organizationId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// STOCK AUDIT VOUCHER (PHIẾU KIỂM KÊ KHO)
// =============================================================================

export interface StockAuditVoucherItem {
  sku: string;
  productName: string;
  unit: string;
  systemQuantity: number; // Tồn hệ thống
  actualQuantity: number; // Tồn thực tế đếm được
  difference: number; // actual - system
  reason?: string;
}

export interface StockAuditVoucher {
  id: string;
  voucherNumber: string; // PKK-YYYYMMDD-XXXX
  date: string;
  warehouseLocation: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  items: StockAuditVoucherItem[];
  totalItemsAudited: number;
  totalDifference: number;
  createdById: string;
  createdByName: string;
  confirmedAt?: string;
  organizationId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  imageUrl?: string;
  image_url?: string;
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
// CONTRACT TEMPLATE (HỢP ĐỒNG MẪU)
// =============================================================================

export type ContractTemplateCategory =
  | 'cung_cap' // Cung cấp vật tư / thiết bị
  | 'thi_cong' // Thi công & lắp đặt
  | 'thuong_mai' // Thương mại & mua bán
  | 'dich_vu' // Dịch vụ kỹ thuật
  | 'khac'; // Khác

export interface ContractTemplate {
  id: string;
  organizationId?: string; // Tenant Level 1 ID
  name: string; // Tên mẫu (vd: Hợp đồng Cung cấp Thiết bị Chiếu sáng)
  code: string; // Mã mẫu (vd: HD-CUNG-CAP-VAT-TU)
  description: string;
  category: ContractTemplateCategory;
  categoryLabel?: string;
  version: string; // "1.0", "1.1", "2.0"
  status: 'active' | 'archived';
  content: string; // Nội dung mẫu chứa {{placeholders}} và {{items_table}}
  fileUrl?: string; // Tùy chọn file đính kèm/gốc
  templateVariables?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByName?: string;
}

// =============================================================================
// CONTRACT SNAPSHOT (DỮ LIỆU ĐÓNG BĂNG TẠI THỜI ĐIỂM KÝ)
// =============================================================================

export interface ContractSnapshot {
  templateId: string;
  templateName: string;
  templateCode: string;
  templateVersion: string;
  customerSnapshot: {
    id: string;
    name: string;
    company?: string;
    address?: string;
    taxCode?: string;
    phone?: string;
    email?: string;
    representative?: string;
    position?: string;
  };
  sellerSnapshot: {
    name: string;
    address?: string;
    taxCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    representative?: string;
    position?: string;
    bankAccount?: string;
    bankName?: string;
    logoUrl?: string;
  };
  quotationSnapshot: {
    id: string;
    quoteNumber: string;
    version: number;
    title: string;
    date: string;
  };
  itemsSnapshot: QuoteProductRow[];
  pricingSnapshot: {
    subtotal: number;
    discountTotal: number;
    taxRate: number;
    taxAmount: number;
    grandTotal: number;
    totalInWords: string;
  };
  renderedContent: string;
  generatedAt: string;
  generatedBy?: string;
  generatedByName?: string;
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
  title?: string;
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
  deliveryTerms?: string;
  paymentTermsDescription?: string;
  warrantyTerms?: string;
  generalTerms?: string;
  notes?: string;
  templateId?: string;
  templateName?: string;
  templateVersion?: string;
  snapshot?: ContractSnapshot;
  renderedContent?: string;
  items: QuoteProductRow[];
  totalValue: number;
  milestones: PaymentMilestone[];
  status: 'draft' | 'signed' | 'delivering' | 'completed' | 'terminated';
  reserveBatchId?: string;
  orderBatchId?: string;
  createdAt: string;
}

// =============================================================================
// =============================================================================
// RESERVE ITEM (BẢNG GIỮ HÀNG)
// =============================================================================

export type ReserveItemStatus =
  | 'active' // Sales đã giữ hàng thành công từ HĐ (tương đương 'holding')
  | 'allocated' // Kho đã xác nhận/phân bổ hàng
  | 'picking' // Kho đang lấy/chuẩn bị hàng
  | 'ready_to_ship' // Hàng đã chuẩn bị xong, sẵn sàng xuất
  | 'shipped' // Kho đã xuất hàng khỏi kho (tương đương 'dispatched')
  | 'partially_delivered' // Giao một phần cho khách
  | 'delivered' // Khách đã nhận hàng thành công (Hoàn tất)
  | 'released' // Hủy giữ hàng, giải phóng tồn khả dụng
  | 'cancelled' // Đã hủy
  | 'holding' // Tương thích ngược: đang giữ
  | 'dispatched'; // Tương thích ngược: đã xuất

export interface TimelineEvent {
  status: string;
  statusLabel: string;
  timestamp: string;
  actorId?: string;
  actorName: string;
  note?: string;
}

export interface ReserveItem {
  id: string;
  organizationId?: string; // Tenant Level 1 ID
  contractId: string;
  contractNumber: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  salesRepId?: string; // ID của Sales phụ trách khách hàng (Customer Master)
  salesRepName: string; // Tên Sales phụ trách
  createdBy?: string; // ID người thao tác tạo phiếu
  sku: string;
  productName: string;
  unit: string;
  reservedQuantity: number;
  dispatchedQuantity?: number;
  deliveredQuantity?: number;
  warehouseLocation: string;
  reservedDate: string;
  status: ReserveItemStatus;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  completedAt?: string; // Thời điểm hoàn thành phiếu (giao đủ 100%)
  completedBy?: string; // ID người hoàn thành phiếu
  completedByName?: string; // Tên người hoàn thành phiếu
  stockTransactionIds?: string[];
  timeline?: TimelineEvent[];
  releasedReason?: string;
  purchaseOrderId?: string; // ID PO liên kết
  stockInVoucherId?: string; // ID Phiếu nhập kho đã cấp hàng
  orderItemId?: string; // ID OrderItem gốc
}

// =============================================================================
// PURCHASE ORDER (ĐƠN ĐẶT NHÀ CUNG CẤP - KHO QUẢN LÝ & QUYẾT ĐỊNH)
// =============================================================================

export type PurchaseOrderStatus =
  | 'draft' // Nháp
  | 'ordered' // Đã đặt NCC
  | 'ORDERED' // Tương thích hoa/thường
  | 'in_transit' // Đang vận chuyển
  | 'partial_received' // Về một phần
  | 'completed' // Đã về đủ
  | 'cancelled'; // Đã hủy

export type POLineSourceType =
  | 'SALES_REQUEST' // Từ đề nghị của Sales
  | 'WAREHOUSE_PLANNED'; // Kho chủ động thêm

export interface POLineSalesDemand {
  orderItemId: string; // ID của OrderItem gốc
  contractId: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  salesRepId?: string;
  salesRepName: string;
  requiredQuantity: number; // Nhu cầu Sales cần
  requiredDate?: string; // Hạn cần giao
  fulfilledQuantity?: number; // Số lượng PO này đã đáp ứng
}

export interface PurchaseOrderItem {
  id?: string;
  sku: string;
  productName: string;
  brand?: string;
  unit: string;
  salesRequiredQuantity: number; // Tổng nhu cầu thực tế từ các Sales gom lại
  supplierOrderQuantity: number; // Số lượng Kho quyết định đặt NCC (>= salesRequiredQuantity)
  warehouseExtraQuantity: number; // Kho chủ động mua thêm = max(0, supplierOrderQuantity - salesRequiredQuantity)
  receivedQuantity?: number; // Số lượng thực tế đã nhập kho
  remainingQuantity?: number; // Số lượng còn chờ NCC giao = max(0, supplierOrderQuantity - receivedQuantity)
  unitCost?: number; // Giá mua dự kiến
  unitPrice?: number; // Alias for unitCost
  totalAmount?: number; // Tổng giá trị dòng
  earliestRequiredDate?: string; // Ngày cần sớm nhất
  notes?: string;
  sourceType?: POLineSourceType;
  salesDemands: POLineSalesDemand[]; // Danh sách phân rã từng Sales / HĐ
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // PO-YYYYMMDD-XXXX
  supplierId?: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  warehouseLocation: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalSalesDemand?: number;
  totalOrderQuantity?: number;
  totalQuantity?: number; // Alias for totalOrderQuantity
  totalReceivedQuantity?: number;
  totalAmount?: number;
  createdById: string;
  createdByName: string;
  organizationId: string;
  notes?: string;
  inboundVoucherIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// ORDER ITEM (BẢNG ĐẶT HÀNG NHÀ CUNG CẤP)
// =============================================================================

export type OrderItemStatus =
  | 'pending' // Nhu cầu thiếu hàng cần đặt (tương đương 'pending_order')
  | 'ordered' // Đã lên PO đặt hàng nhà cung cấp
  | 'in_transit' // Nhà cung cấp đang vận chuyển
  | 'arrived' // Hàng đã về tới kho nhưng đang chờ kiểm nhận
  | 'partial' // Đã về một phần (ví dụ 40/100)
  | 'received' // Kho đã nhập đủ hàng (tương đương 'arrived_in_stock')
  | 'ready_to_deliver' // Đã đủ hàng trong kho, sẵn sàng giao khách
  | 'partially_delivered' // Đã xuất giao một phần cho khách
  | 'delivered' // Đã giao hàng thành công cho khách (Hoàn tất)
  | 'cancelled' // Đã hủy đơn đặt hàng
  | 'pending_order' // Tương thích ngược
  | 'in_stock' // Tương thích ngược
  | 'arrived_in_stock'; // Tương thích ngược

export interface InboundReceiptEntry {
  id: string;
  receiptNumber: string;
  date: string;
  quantity: number;
  warehouseLocation: string;
  note?: string;
  transactionId?: string;
  actorId?: string;
  actorName?: string;
  receiverName?: string; // Alias for actorName
}

export interface OrderItem {
  id: string;
  organizationId?: string; // Tenant Level 1 ID
  contractId: string;
  contractNumber: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  salesRepId?: string; // ID của Sales phụ trách khách hàng (Customer Master)
  salesRepName: string; // Tên Sales phụ trách
  createdBy?: string; // ID người thao tác tạo đơn
  sku: string;
  productName: string;
  unit: string;
  warehouseLocation?: string;
  orderQuantity: number; // Tổng số lượng cần đặt mua
  receivedQuantity?: number; // Số lượng đã về kho thực tế (hỗ trợ nhập nhiều đợt)
  remainingQuantity?: number; // Số lượng còn thiếu (orderQuantity - receivedQuantity)
  dispatchedQuantity?: number; // Số lượng đã xuất kho giao khách
  deliveredQuantity?: number; // Số lượng khách đã nhận
  brand?: string;
  size?: string;
  color?: string;
  orderDate: string;
  status: OrderItemStatus;
  supplierETA?: string;
  completedAt?: string; // Thời điểm hoàn thành phiếu (giao khách đủ 100%)
  completedBy?: string; // ID người hoàn thành phiếu
  completedByName?: string; // Tên người hoàn thành phiếu
  notes?: string;
  stockTransactionIds?: string[];
  inboundReceipts?: InboundReceiptEntry[];
  timeline?: TimelineEvent[];
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
  if (user.role === 'super_admin') return 'org-system';
  
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
