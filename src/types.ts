export type UserRole = 'super_admin' | 'manager_c1' | 'sales_c2';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  status: 'active' | 'pending_approval' | 'inactive';
  department?: string;
  managerId?: string; // For Cấp 2, which Cấp 1 manages them
  createdAt: string;
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
  quoteNumber: string; // BG-2026-001
  version: number; // 1, 2, 3... (Đợt báo giá lần 1, 2, 3...)
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCompany?: string;
  customerAddress?: string;
  salesRepId: string; // Cấp 2
  salesRepName: string;
  salesRepPhone?: string;
  title: string; // Tiêu đề báo giá
  date: string;
  validUntil: string;
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
