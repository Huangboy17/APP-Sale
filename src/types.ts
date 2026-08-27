export type UserRole = 'super_admin' | 'manager_c1' | 'sales_c2';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  password?: string; // Mật khẩu tài khoản
  avatar?: string;
  status: 'active' | 'pending_approval' | 'inactive';
  department?: string;
  position?: string; // Chức danh/vị trí (VD: Giám đốc kinh doanh, Kỹ sư dự án...)
  managerId?: string; // For Cấp 2, which Cấp 1 manages them
  createdBy?: string; // Which Cấp 1 or Super Admin created this user
  createdAt: string;
}

export interface CompanyInfo {
  id: string;
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
  assignedToId: string; // Cấp 2 user id
  assignedToName: string;
  createdBy: string;
  rejectReason?: string;
  notes?: string;
  expectedValue: number;
  createdAt: string;
  updatedAt: string;
}

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
}

export interface InventoryItem {
  sku: string; // Mã hàng
  name: string;
  unit: string;
  totalQuantity: number; // Tồn thực tế
  reservedQuantity: number; // Đang giữ hàng
  availableQuantity: number; // Khả dụng = total - reserved
  warehouseLocation?: string; // Vị trí kho (Kho A1, Kho B2, Tổng kho HCM, Kho Hà Nội...)
  updatedAt: string;
}

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

export interface PaymentMilestone {
  id: string;
  milestoneName: string; // "Đợt 1: Tạm ứng khi ký HĐ", "Đợt 2: Thanh toán khi giao hàng", "Đợt 3: Quyết toán"
  percentage: number; // 30, 50, 20
  amount: number;
  expectedDate?: string;
  conditionDescription: string; // "Sau 03 ngày kể từ ngày ký HĐ", "Khi hàng tập kết tại công trình"
  status: 'pending' | 'completed' | 'overdue';
}

export type QuotationStatus = 'draft' | 'sent' | 'negotiating' | 'approved_contract' | 'cancelled';

export interface Quotation {
  id: string;
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
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  contractNumber: string; // HĐKT-2026-001
  quotationId: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
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

export interface ReserveItem {
  id: string;
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

export interface OrderItem {
  id: string;
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
