import {
  ContractTemplate,
  ContractSnapshot,
  Quotation,
  Customer,
  CompanyInfo,
  QuoteProductRow,
} from '../types';
import { formatVND, formatNumber, formatDate, numberToVietnameseWords } from '../utils/formatters';

// =============================================================================
// PLACEHOLDER DEFINITIONS & METADATA
// =============================================================================

export interface PlaceholderDefinition {
  key: string;
  label: string;
  category: 'contract' | 'customer' | 'seller' | 'quotation' | 'totals' | 'table';
  description: string;
  sampleValue: string;
}

export const CONTRACT_PLACEHOLDERS: PlaceholderDefinition[] = [
  // Hợp đồng
  { key: '{{contract_number}}', label: 'Số hợp đồng', category: 'contract', description: 'Số hiệu hợp đồng (vd: HĐKT-2026/08-001)', sampleValue: 'HĐKT-2026/08-001' },
  { key: '{{contract_date}}', label: 'Ngày ký hợp đồng', category: 'contract', description: 'Ngày ký hợp đồng theo định dạng ngày/tháng/năm', sampleValue: '28/08/2026' },
  { key: '{{contract_title}}', label: 'Tiêu đề hợp đồng', category: 'contract', description: 'Tên hoặc tiêu đề hợp đồng', sampleValue: 'HỢP ĐỒNG MUA BÁN THIẾT BỊ ĐIỆN VÀ CHIẾU SÁNG' },
  { key: '{{delivery_date}}', label: 'Thời hạn giao hàng', category: 'contract', description: 'Ngày hoặc thời hạn giao hàng dự kiến', sampleValue: '15/09/2026' },
  { key: '{{delivery_address}}', label: 'Địa điểm giao hàng', category: 'contract', description: 'Địa chỉ chân công trình hoặc kho bên mua', sampleValue: 'Tầng 12, Tòa nhà Landmark, Cầu Giấy, Hà Nội' },
  { key: '{{delivery_terms}}', label: 'Điều khoản giao hàng', category: 'contract', description: 'Quy cách đóng gói, vận chuyển và bàn giao', sampleValue: 'Hàng mới 100%, nguyên đai nguyên kiện từ nhà sản xuất.' },
  { key: '{{payment_terms}}', label: 'Điều khoản thanh toán', category: 'contract', description: 'Hình thức chuyển khoản, các đợt tạm ứng', sampleValue: 'Thanh toán bằng chuyển khoản: Tạm ứng 30% khi ký HĐ, 70% khi nhận hàng.' },
  { key: '{{warranty_terms}}', label: 'Điều khoản bảo hành', category: 'contract', description: 'Thời hạn và chính sách bảo hành thiết bị', sampleValue: 'Bảo hành chính hãng 24 tháng theo tiêu chuẩn của nhà sản xuất.' },
  { key: '{{general_terms}}', label: 'Điều khoản chung', category: 'contract', description: 'Cam kết và giải quyết tranh chấp pháp lý', sampleValue: 'Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận.' },
  { key: '{{notes}}', label: 'Ghi chú bổ sung', category: 'contract', description: 'Các thỏa thuận riêng nếu có', sampleValue: 'Không có ghi chú thêm.' },

  // Khách hàng (Bên Mua)
  { key: '{{customer_name}}', label: 'Tên khách hàng / Đại diện', category: 'customer', description: 'Tên người liên hệ hoặc chủ doanh nghiệp bên mua', sampleValue: 'Nguyễn Văn Hùng' },
  { key: '{{customer_company}}', label: 'Tên công ty bên mua', category: 'customer', description: 'Tên đầy đủ của công ty hoặc tổ chức mua hàng', sampleValue: 'CÔNG TY CP ĐẦU TƯ XÂY DỰNG MINH PHÁT' },
  { key: '{{customer_address}}', label: 'Địa chỉ bên mua', category: 'customer', description: 'Địa chỉ trụ sở đăng ký kinh doanh bên mua', sampleValue: 'Số 188 Phạm Văn Đồng, Cầu Giấy, Hà Nội' },
  { key: '{{customer_tax_code}}', label: 'Mã số thuế bên mua', category: 'customer', description: 'Mã số thuế bên mua', sampleValue: '0109887766' },
  { key: '{{customer_phone}}', label: 'Số điện thoại bên mua', category: 'customer', description: 'Điện thoại liên lạc của bên mua', sampleValue: '0912 345 678' },
  { key: '{{customer_email}}', label: 'Email bên mua', category: 'customer', description: 'Email của bên mua', sampleValue: 'contact@minhphat.vn' },
  { key: '{{customer_representative}}', label: 'Đại diện bên mua', category: 'customer', description: 'Người đại diện ký kết của bên mua', sampleValue: 'Ông Nguyễn Văn Hùng' },
  { key: '{{customer_position}}', label: 'Chức danh đại diện bên mua', category: 'customer', description: 'Chức vụ người đại diện bên mua', sampleValue: 'Tổng Giám Đốc' },

  // Bên Bán (Doanh Nghiệp Bán Hàng)
  { key: '{{seller_name}}', label: 'Tên công ty bên bán', category: 'seller', description: 'Tên đầy đủ của doanh nghiệp bán hàng', sampleValue: 'CÔNG TY TNHH HHG HOLDINGS' },
  { key: '{{seller_address}}', label: 'Địa chỉ bên bán', category: 'seller', description: 'Địa chỉ trụ sở công ty bên bán', sampleValue: 'Số 5-6-7 The Premier, Tôn Thất Thuyết, Cầu Giấy, Hà Nội' },
  { key: '{{seller_tax_code}}', label: 'Mã số thuế bên bán', category: 'seller', description: 'Mã số thuế của công ty bên bán', sampleValue: '0108999888' },
  { key: '{{seller_phone}}', label: 'Điện thoại bên bán', category: 'seller', description: 'Hotline/Điện thoại liên hệ bên bán', sampleValue: '+84 243 821 6666' },
  { key: '{{seller_email}}', label: 'Email bên bán', category: 'seller', description: 'Email chính thức của bên bán', sampleValue: 'info@hhg.vn' },
  { key: '{{seller_website}}', label: 'Website bên bán', category: 'seller', description: 'Trang thông tin điện tử của bên bán', sampleValue: 'www.hhg.vn' },
  { key: '{{seller_representative}}', label: 'Đại diện bên bán', category: 'seller', description: 'Người đại diện ký kết của bên bán', sampleValue: 'Bùi Viết Hoàng' },
  { key: '{{seller_position}}', label: 'Chức danh đại diện bên bán', category: 'seller', description: 'Chức vụ người đại diện bên bán', sampleValue: 'Tổng Giám Đốc' },
  { key: '{{seller_bank_account}}', label: 'Số tài khoản bên bán', category: 'seller', description: 'Số tài khoản ngân hàng bên bán', sampleValue: '19038889999018' },
  { key: '{{seller_bank_name}}', label: 'Tên ngân hàng bên bán', category: 'seller', description: 'Ngân hàng & Chi nhánh bên bán', sampleValue: 'Techcombank - Chi nhánh Thăng Long' },

  // Báo giá
  { key: '{{quotation_number}}', label: 'Số báo giá chốt', category: 'quotation', description: 'Số hiệu báo giá gốc đã chốt', sampleValue: 'BG-2026-001-V2' },
  { key: '{{quotation_date}}', label: 'Ngày báo giá', category: 'quotation', description: 'Ngày lập báo giá gốc', sampleValue: '25/08/2026' },

  // Tổng giá trị & Thuế
  { key: '{{contract_subtotal}}', label: 'Tổng tiền trước thuế (VNĐ)', category: 'totals', description: 'Tổng giá trị hàng hóa trước VAT', sampleValue: '100.000.000 VNĐ' },
  { key: '{{vat_rate}}', label: 'Thuế suất VAT (%)', category: 'totals', description: 'Phần trăm thuế VAT', sampleValue: '10%' },
  { key: '{{vat_amount}}', label: 'Tiền thuế VAT (VNĐ)', category: 'totals', description: 'Số tiền thuế giá trị gia tăng', sampleValue: '10.000.000 VNĐ' },
  { key: '{{contract_grand_total}}', label: 'Tổng giá trị hợp đồng (VNĐ)', category: 'totals', description: 'Tổng thanh toán sau thuế VAT', sampleValue: '110.000.000 VNĐ' },
  { key: '{{contract_total_in_words}}', label: 'Tổng tiền bằng chữ', category: 'totals', description: 'Số tiền bằng chữ tiếng Việt có dấu', sampleValue: 'Một trăm mười triệu đồng chẵn.' },

  // Bảng sản phẩm
  { key: '{{items_table}}', label: 'Bảng danh mục sản phẩm', category: 'table', description: 'Bảng HTML đầy đủ chi tiết mã hàng, tên, ĐVT, số lượng, đơn giá, thành tiền', sampleValue: '[Bảng sản phẩm]' },
];

// =============================================================================
// HTML ITEMS TABLE GENERATOR
// =============================================================================

export const generateItemsTableHtml = (items: QuoteProductRow[]): string => {
  if (!items || items.length === 0) {
    return `<div style="text-align:center; padding: 12px; color: #64748b; font-style: italic; border: 1px dashed #cbd5e1; border-radius: 6px;">(Không có sản phẩm nào)</div>`;
  }

  const rowsHtml = items
    .map((item, idx) => {
      const price = item.quotedPrice ?? item.listPrice ?? 0;
      const amount = item.totalAmount ?? price * (item.quantity || 1);

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 6px; text-align: center; font-size: 11.5px; color: #475569; width: 40px;">${idx + 1}</td>
          <td style="padding: 8px 6px; text-align: left; font-family: monospace; font-weight: bold; font-size: 11px; color: #1e3a8a; width: 110px;">${item.sku || '—'}</td>
          <td style="padding: 8px 6px; text-align: left; font-size: 12px; color: #0f172a;">
            <div style="font-weight: bold;">${item.name || 'Sản phẩm'}</div>
            ${item.brand ? `<div style="font-size: 10.5px; color: #64748b;">Hãng: ${item.brand}${item.size ? ` | QC: ${item.size}` : ''}${item.color ? ` | Màu: ${item.color}` : ''}</div>` : ''}
          </td>
          <td style="padding: 8px 6px; text-align: center; font-size: 11.5px; color: #334155; width: 60px;">${item.unit || 'Bộ'}</td>
          <td style="padding: 8px 6px; text-align: right; font-weight: bold; font-size: 12px; color: #0f172a; width: 65px; font-family: monospace;">${(item.quantity || 0).toLocaleString('vi-VN')}</td>
          <td style="padding: 8px 6px; text-align: right; font-size: 11.5px; color: #334155; width: 110px; font-family: monospace;">${formatNumber(price)}</td>
          <td style="padding: 8px 6px; text-align: right; font-weight: bold; font-size: 12px; color: #1e3a8a; width: 120px; font-family: monospace;">${formatNumber(amount)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 14px 0; border: 1px solid #cbd5e1; font-family: sans-serif;">
      <thead>
        <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #1e293b; font-size: 11px; text-transform: uppercase; font-weight: bold;">
          <th style="padding: 8px 4px; text-align: center; width: 40px; border-right: 1px solid #e2e8f0;">STT</th>
          <th style="padding: 8px 6px; text-align: left; width: 110px; border-right: 1px solid #e2e8f0;">Mã SP</th>
          <th style="padding: 8px 6px; text-align: left; border-right: 1px solid #e2e8f0;">Tên Sản Phẩm / Quy Cách</th>
          <th style="padding: 8px 6px; text-align: center; width: 60px; border-right: 1px solid #e2e8f0;">ĐVT</th>
          <th style="padding: 8px 6px; text-align: right; width: 65px; border-right: 1px solid #e2e8f0;">Số Lượng</th>
          <th style="padding: 8px 6px; text-align: right; width: 110px; border-right: 1px solid #e2e8f0;">Đơn Giá (VNĐ)</th>
          <th style="padding: 8px 6px; text-align: right; width: 120px;">Thành Tiền (VNĐ)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
};

// =============================================================================
// CONTRACT DATA MAPPING INTERFACE
// =============================================================================

export interface ContractMappingInput {
  contractNumber: string;
  contractDate: string;
  contractTitle?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  deliveryTerms?: string;
  paymentTerms?: string;
  warrantyTerms?: string;
  generalTerms?: string;
  notes?: string;

  customer: {
    name: string;
    company?: string;
    address?: string;
    taxCode?: string;
    phone?: string;
    email?: string;
    representative?: string;
    position?: string;
  };

  seller: {
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
  };

  quotation?: {
    quoteNumber: string;
    date: string;
  };

  items: QuoteProductRow[];

  totals: {
    subtotal: number;
    discountTotal?: number;
    taxRate: number;
    taxAmount: number;
    grandTotal: number;
  };
}

// =============================================================================
// RENDER CONTRACT CONTENT WITH PLACEHOLDER REPLACEMENT
// =============================================================================

export const renderContractContent = (
  templateContent: string,
  data: ContractMappingInput
): string => {
  if (!templateContent) return '';

  const totalInWords = numberToVietnameseWords(data.totals.grandTotal);
  const itemsTableHtml = generateItemsTableHtml(data.items);

  const replacements: Record<string, string> = {
    // Contract
    '{{contract_number}}': data.contractNumber || 'HĐKT-2026/01',
    '{{contract_date}}': formatDate(data.contractDate) || '28/08/2026',
    '{{contract_title}}': data.contractTitle || 'HỢP ĐỒNG MUA BÁN HÀNG HÓA',
    '{{delivery_date}}': formatDate(data.deliveryDate) || 'Theo thỏa thuận',
    '{{delivery_address}}': data.deliveryAddress || 'Tại chân công trình bên mua',
    '{{delivery_terms}}': data.deliveryTerms || 'Giao hàng nguyên đai nguyên kiện, đúng chủng loại kỹ thuật.',
    '{{payment_terms}}': data.paymentTerms || 'Thanh toán bằng chuyển khoản ngân hàng theo tiến độ hợp đồng.',
    '{{warranty_terms}}': data.warrantyTerms || 'Bảo hành chính hãng 24 tháng kể từ ngày ký biên bản bàn giao.',
    '{{general_terms}}': data.generalTerms || 'Hai bên cam kết thực hiện đúng và đầy đủ các điều khoản trong hợp đồng.',
    '{{notes}}': data.notes || '',

    // Customer
    '{{customer_name}}': data.customer.name || 'Khách hàng',
    '{{customer_company}}': data.customer.company || data.customer.name || '—',
    '{{customer_address}}': data.customer.address || '—',
    '{{customer_tax_code}}': data.customer.taxCode || '—',
    '{{customer_phone}}': data.customer.phone || '—',
    '{{customer_email}}': data.customer.email || '—',
    '{{customer_representative}}': data.customer.representative || data.customer.name || 'Đại diện bên mua',
    '{{customer_position}}': data.customer.position || 'Giám Đốc / Đại diện pháp luật',

    // Seller
    '{{seller_name}}': data.seller.name || 'CÔNG TY TNHH HHG HOLDINGS',
    '{{seller_address}}': data.seller.address || 'Số 5-6-7 The Premier, Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
    '{{seller_tax_code}}': data.seller.taxCode || '0108999888',
    '{{seller_phone}}': data.seller.phone || '+84 243 821 6666',
    '{{seller_email}}': data.seller.email || 'info@hhg.vn',
    '{{seller_website}}': data.seller.website || 'www.hhg.vn',
    '{{seller_representative}}': data.seller.representative || 'Bùi Viết Hoàng',
    '{{seller_position}}': data.seller.position || 'Tổng Giám Đốc',
    '{{seller_bank_account}}': data.seller.bankAccount || '19038889999018',
    '{{seller_bank_name}}': data.seller.bankName || 'Techcombank - Chi nhánh Thăng Long',

    // Quotation
    '{{quotation_number}}': data.quotation?.quoteNumber || '—',
    '{{quotation_date}}': data.quotation?.date ? formatDate(data.quotation.date) : '—',

    // Totals
    '{{contract_subtotal}}': formatVND(data.totals.subtotal),
    '{{vat_rate}}': `${data.totals.taxRate}%`,
    '{{vat_amount}}': formatVND(data.totals.taxAmount),
    '{{contract_grand_total}}': formatVND(data.totals.grandTotal),
    '{{contract_total_in_words}}': totalInWords,

    // Items table
    '{{items_table}}': itemsTableHtml,
  };

  let rendered = templateContent;
  for (const [placeholder, value] of Object.entries(replacements)) {
    rendered = rendered.split(placeholder).join(value);
  }

  return rendered;
};

// =============================================================================
// VALIDATION HELPER BEFORE CONTRACT GENERATION
// =============================================================================

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export const validateContractRequirements = (
  quotation: Quotation | null | undefined,
  customer: Customer | null | undefined,
  template: ContractTemplate | null | undefined,
  contractNumber?: string
): { isValid: boolean; issues: ValidationIssue[] } => {
  const issues: ValidationIssue[] = [];

  if (!quotation) {
    issues.push({ field: 'quotation', message: 'Không tìm thấy thông tin Báo giá gốc.', severity: 'error' });
  }

  if (!template) {
    issues.push({ field: 'template', message: 'Vui lòng chọn một Hợp đồng mẫu hợp lệ.', severity: 'error' });
  } else if (template.status === 'archived') {
    issues.push({ field: 'template', message: 'Mẫu hợp đồng đã ngừng sử dụng. Vui lòng chọn mẫu khác.', severity: 'error' });
  }

  if (!contractNumber || !contractNumber.trim()) {
    issues.push({ field: 'contractNumber', message: 'Số hợp đồng không được để trống.', severity: 'error' });
  }

  if (quotation && (!quotation.items || quotation.items.length === 0)) {
    issues.push({ field: 'items', message: 'Báo giá chưa có danh mục sản phẩm.', severity: 'error' });
  }

  // Warnings for missing customer details
  if (customer) {
    if (!customer.name && !customer.company) {
      issues.push({ field: 'customer_name', message: 'Chưa có tên khách hàng hoặc tên công ty.', severity: 'error' });
    }
    if (!customer.taxCode && !customer.company) {
      issues.push({ field: 'customer_tax_code', message: 'Khách hàng chưa có Mã số thuế (MST). Hợp đồng sẽ hiển thị "—".', severity: 'warning' });
    }
    if (!customer.address) {
      issues.push({ field: 'customer_address', message: 'Khách hàng chưa có Địa chỉ cụ thể.', severity: 'warning' });
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  return {
    isValid: !hasErrors,
    issues,
  };
};

// =============================================================================
// DEFAULT INITIAL CONTRACT TEMPLATES
// =============================================================================

export const INITIAL_CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'tmpl-cung-cap-vat-tu',
    name: 'Hợp đồng Mua bán & Cung cấp Thiết bị Điện - Chiếu sáng',
    code: 'HD-CUNG-CAP-VAT-TU',
    description: 'Áp dụng cho các gói mua bán, cung cấp vật tư đèn trang trí, thiết bị điện, cáp điện cho dự án và công trình.',
    category: 'cung_cap',
    categoryLabel: 'Cung Cấp Vật Tư',
    version: '1.0',
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    content: `
<div style="font-family: 'Times New Roman', Times, serif; color: #111827; line-height: 1.6; font-size: 13pt;">
  <div style="text-align: center; margin-bottom: 20px;">
    <p style="font-weight: bold; margin: 0; font-size: 12pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p style="font-weight: bold; margin: 0; font-size: 11pt;">Độc lập - Tự do - Hạnh phúc</p>
    <p style="margin: 4px 0 0 0; font-size: 10pt;">------------------o0o------------------</p>
  </div>

  <div style="text-align: center; margin: 25px 0 20px 0;">
    <h1 style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0;">{{contract_title}}</h1>
    <p style="font-style: italic; margin: 5px 0 0 0; font-size: 11pt;">Số: <strong>{{contract_number}}</strong></p>
    <p style="font-size: 11pt; margin: 2px 0 0 0;">(Căn cứ theo Báo giá số: <strong>{{quotation_number}}</strong> ngày {{quotation_date}})</p>
  </div>

  <p style="font-style: italic; text-align: justify;">
    - Căn cứ Bộ luật Dân sự số 91/2015/QH13 và Luật Thương mại số 36/2005/QH11 của Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam;<br/>
    - Căn cứ nhu cầu và khả năng thực tế của hai Bên.
  </p>

  <p>Hôm nay, ngày {{contract_date}}, tại văn phòng đại diện, chúng tôi gồm có:</p>

  <div style="margin-bottom: 12px;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; color: #1e3a8a;">BÊN BÁN (BÊN A): {{seller_name}}</p>
    <table style="width: 100%; border: none; font-size: 12pt;">
      <tr><td style="width: 140px; vertical-align: top;">- Địa chỉ:</td><td>{{seller_address}}</td></tr>
      <tr><td>- Mã số thuế:</td><td><strong>{{seller_tax_code}}</strong></td></tr>
      <tr><td>- Đại diện:</td><td><strong>{{seller_representative}}</strong> - Chức vụ: {{seller_position}}</td></tr>
      <tr><td>- Điện thoại:</td><td>{{seller_phone}} | Email: {{seller_email}}</td></tr>
      <tr><td>- Tài khoản ngân hàng:</td><td><strong>{{seller_bank_account}}</strong> tại {{seller_bank_name}}</td></tr>
    </table>
  </div>

  <div style="margin-bottom: 16px;">
    <p style="font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; color: #1e3a8a;">BÊN MUA (BÊN B): {{customer_company}}</p>
    <table style="width: 100%; border: none; font-size: 12pt;">
      <tr><td style="width: 140px; vertical-align: top;">- Địa chỉ:</td><td>{{customer_address}}</td></tr>
      <tr><td>- Mã số thuế:</td><td><strong>{{customer_tax_code}}</strong></td></tr>
      <tr><td>- Đại diện:</td><td><strong>{{customer_representative}}</strong> - Chức vụ: {{customer_position}}</td></tr>
      <tr><td>- Điện thoại:</td><td>{{customer_phone}} | Email: {{customer_email}}</td></tr>
    </table>
  </div>

  <p style="text-align: justify;">Sau khi bàn bạc thảo luận, hai Bên thống nhất ký kết Hợp đồng kinh tế với các điều khoản sau:</p>

  <p style="font-weight: bold; margin: 12px 0 4px 0;">ĐIỀU 1: ĐỐI TƯỢNG VÀ DANH MỤC HÀNG HÓA</p>
  <p style="text-align: justify; margin: 0 0 6px 0;">Bên A đồng ý cung cấp và Bên B đồng ý mua toàn bộ danh mục vật tư, thiết bị theo quy cách và số lượng chi tiết sau:</p>
  
  {{items_table}}

  <p style="font-weight: bold; margin: 12px 0 4px 0;">ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</p>
  <div style="background: #f8fafc; padding: 10px; border-left: 3px solid #3b82f6; margin-bottom: 8px;">
    <p style="margin: 0;">- Tổng giá trị trước thuế: <strong>{{contract_subtotal}}</strong></p>
    <p style="margin: 2px 0;">- Thuế GTGT ({{vat_rate}}): <strong>{{vat_amount}}</strong></p>
    <p style="margin: 2px 0; font-size: 13pt; color: #1e3a8a;">- Tổng giá trị thanh toán: <strong>{{contract_grand_total}}</strong></p>
    <p style="margin: 4px 0 0 0; font-style: italic;">(Bằng chữ: <strong>{{contract_total_in_words}}</strong>)</p>
  </div>
  <p style="text-align: justify;">- <strong>Điều kiện thanh toán:</strong> {{payment_terms}}</p>

  <p style="font-weight: bold; margin: 12px 0 4px 0;">ĐIỀU 3: THỜI GIAN, ĐỊA ĐIỂM VÀ ĐIỀU KIỆN GIAO HÀNG</p>
  <p style="margin: 0 0 4px 0;">- <strong>Địa điểm giao hàng:</strong> {{delivery_address}}</p>
  <p style="margin: 0 0 4px 0;">- <strong>Thời gian giao hàng:</strong> Dự kiến ngày {{delivery_date}} hoặc theo thông báo bằng văn bản của Bên B.</p>
  <p style="margin: 0 0 4px 0;">- <strong>Quy cách giao hàng:</strong> {{delivery_terms}}</p>

  <p style="font-weight: bold; margin: 12px 0 4px 0;">ĐIỀU 4: BẢO HÀNH VÀ TRÁCH NHIỆM KỸ THUẬT</p>
  <p style="text-align: justify; margin: 0 0 4px 0;">{{warranty_terms}}</p>

  <p style="font-weight: bold; margin: 12px 0 4px 0;">ĐIỀU 5: ĐIỀU KHOẢN CHUNG VÀ HIỆU LỰC HỢP ĐỒNG</p>
  <p style="text-align: justify; margin: 0 0 4px 0;">{{general_terms}}</p>
  <p style="text-align: justify; margin: 0 0 4px 0;">Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi Bên giữ 01 bản để thực hiện.</p>

  <table style="width: 100%; border: none; margin-top: 30px; text-align: center;">
    <tr>
      <td style="width: 50%; font-weight: bold; text-transform: uppercase;">
        ĐẠI DIỆN BÊN MUA (BÊN B)<br/>
        <span style="font-size: 10pt; font-weight: normal; font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</span>
        <br/><br/><br/><br/><br/>
        <strong>{{customer_representative}}</strong>
      </td>
      <td style="width: 50%; font-weight: bold; text-transform: uppercase;">
        ĐẠI DIỆN BÊN BÁN (BÊN A)<br/>
        <span style="font-size: 10pt; font-weight: normal; font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</span>
        <br/><br/><br/><br/><br/>
        <strong>{{seller_representative}}</strong>
      </td>
    </tr>
  </table>
</div>
    `,
  },
  {
    id: 'tmpl-thi-cong-lap-dat',
    name: 'Hợp đồng Thi công & Lắp đặt Hệ thống Điện Công trình',
    code: 'HD-THI-CONG-LAP-DAT',
    description: 'Áp dụng cho các gói thầu vừa cung cấp thiết bị vừa đảm nhận trọn gói thi công, đấu nối và kiểm thử tại công trường.',
    category: 'thi_cong',
    categoryLabel: 'Thi Công Lắp Đặt',
    version: '1.0',
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    content: `
<div style="font-family: 'Times New Roman', Times, serif; color: #111827; line-height: 1.6; font-size: 13pt;">
  <div style="text-align: center; margin-bottom: 20px;">
    <p style="font-weight: bold; margin: 0; font-size: 12pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p style="font-weight: bold; margin: 0; font-size: 11pt;">Độc lập - Tự do - Hạnh phúc</p>
    <p style="margin: 4px 0 0 0; font-size: 10pt;">------------------o0o------------------</p>
  </div>

  <div style="text-align: center; margin: 25px 0 20px 0;">
    <h1 style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0;">{{contract_title}}</h1>
    <p style="font-style: italic; margin: 5px 0 0 0; font-size: 11pt;">Số: <strong>{{contract_number}}</strong></p>
    <p style="font-size: 11pt; margin: 2px 0 0 0;">(Căn cứ Báo giá đính kèm: <strong>{{quotation_number}}</strong> ngày {{quotation_date}})</p>
  </div>

  <p>Hôm nay, ngày {{contract_date}}, các bên đại diện gồm:</p>

  <p style="font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; color: #1e3a8a;">NHÀ THẦU THI CÔNG (BÊN A): {{seller_name}}</p>
  <table style="width: 100%; border: none; font-size: 12pt; margin-bottom: 10px;">
    <tr><td style="width: 130px;">- Địa chỉ:</td><td>{{seller_address}}</td></tr>
    <tr><td>- Mã số thuế:</td><td><strong>{{seller_tax_code}}</strong></td></tr>
    <tr><td>- Đại diện:</td><td><strong>{{seller_representative}}</strong> - {{seller_position}}</td></tr>
    <tr><td>- Điện thoại:</td><td>{{seller_phone}}</td></tr>
  </table>

  <p style="font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; color: #1e3a8a;">CHỦ ĐẦU TƯ / KHÁCH HÀNG (BÊN B): {{customer_company}}</p>
  <table style="width: 100%; border: none; font-size: 12pt; margin-bottom: 15px;">
    <tr><td style="width: 130px;">- Địa chỉ:</td><td>{{customer_address}}</td></tr>
    <tr><td>- Mã số thuế:</td><td><strong>{{customer_tax_code}}</strong></td></tr>
    <tr><td>- Đại diện:</td><td><strong>{{customer_representative}}</strong> - {{customer_position}}</td></tr>
    <tr><td>- Điện thoại:</td><td>{{customer_phone}}</td></tr>
  </table>

  <p style="font-weight: bold; margin: 12px 0 4px 0;">ĐIỀU 1: PHẠM VI CÔNG VIỆC VÀ VẬT TƯ THI CÔNG</p>
  <p style="text-align: justify;">Bên A chịu trách nhiệm cung cấp vật tư thiết bị và thi công hoàn thiện theo bảng khối lượng:</p>

  {{items_table}}

  <p style="font-weight: bold; margin: 12px 0 4px 0;">ĐIỀU 2: GIÁ TRỊ VÀ TIẾN ĐỘ THANH TOÁN</p>
  <p style="margin: 0;">- Tổng giá trị trọn gói: <strong>{{contract_grand_total}}</strong> (Bằng chữ: <strong>{{contract_total_in_words}}</strong>)</p>
  <p style="margin: 4px 0 0 0;">- Tiến độ thanh toán: {{payment_terms}}</p>

  <p style="font-weight: bold; margin: 12px 0 4px 0;">ĐIỀU 3: TIẾN ĐỘ BÀN GIAO VÀ NGHIỆM THU</p>
  <p style="margin: 0;">- Địa điểm thi công: {{delivery_address}}</p>
  <p style="margin: 4px 0 0 0;">- Thời hạn hoàn thành: Ngày {{delivery_date}}.</p>

  <p style="font-weight: bold; margin: 12px 0 4px 0;">ĐIỀU 4: BẢO HÀNH CÔNG TRÌNH</p>
  <p style="margin: 0;">{{warranty_terms}}</p>

  <table style="width: 100%; border: none; margin-top: 30px; text-align: center;">
    <tr>
      <td style="width: 50%; font-weight: bold;">
        ĐẠI DIỆN BÊN B<br/><br/><br/><br/><br/>
        <strong>{{customer_representative}}</strong>
      </td>
      <td style="width: 50%; font-weight: bold;">
        ĐẠI DIỆN BÊN A<br/><br/><br/><br/><br/>
        <strong>{{seller_representative}}</strong>
      </td>
    </tr>
  </table>
</div>
    `,
  },
  {
    id: 'tmpl-thuong-mai-tong-hop',
    name: 'Hợp đồng Mua bán Hàng hóa Thương mại Chuẩn',
    code: 'HD-THUONG-MAI-CHUN',
    description: 'Mẫu hợp đồng thương mại tinh gọn, chuẩn mực pháp lý cho các đơn hàng bán lẻ và đơn hàng thương mại giao dịch nhanh.',
    category: 'thuong_mai',
    categoryLabel: 'Thương Mại Chuẩn',
    version: '1.0',
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    content: `
<div style="font-family: 'Times New Roman', Times, serif; color: #111827; line-height: 1.6; font-size: 13pt;">
  <div style="text-align: center; margin-bottom: 20px;">
    <p style="font-weight: bold; margin: 0; font-size: 12pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p style="font-weight: bold; margin: 0; font-size: 11pt;">Độc lập - Tự do - Hạnh phúc</p>
  </div>

  <div style="text-align: center; margin: 20px 0;">
    <h1 style="font-size: 15pt; font-weight: bold; text-transform: uppercase; margin: 0;">{{contract_title}}</h1>
    <p style="font-style: italic; margin: 4px 0 0 0;">Số HĐ: <strong>{{contract_number}}</strong></p>
  </div>

  <p>Ngày ký: {{contract_date}}</p>

  <p><strong>Bên Bán:</strong> {{seller_name}} | MST: {{seller_tax_code}} | ĐT: {{seller_phone}}</p>
  <p><strong>Bên Mua:</strong> {{customer_company}} | MST: {{customer_tax_code}} | ĐT: {{customer_phone}}</p>

  <p style="font-weight: bold; margin-top: 10px;">Chi tiết hàng hóa đặt mua:</p>
  {{items_table}}

  <p><strong>Tổng cộng thanh toán (đã có VAT):</strong> {{contract_grand_total}}</p>
  <p style="font-style: italic;">(Bằng chữ: {{contract_total_in_words}})</p>

  <p><strong>Điều khoản thanh toán:</strong> {{payment_terms}}</p>
  <p><strong>Địa chỉ & Thời hạn giao nhận:</strong> {{delivery_address}} (Hạn giao: {{delivery_date}})</p>

  <table style="width: 100%; border: none; margin-top: 25px; text-align: center;">
    <tr>
      <td style="width: 50%; font-weight: bold;">ĐẠI DIỆN BÊN MUA<br/><br/><br/><br/><strong>{{customer_representative}}</strong></td>
      <td style="width: 50%; font-weight: bold;">ĐẠI DIỆN BÊN BÁN<br/><br/><br/><br/><strong>{{seller_representative}}</strong></td>
    </tr>
  </table>
</div>
    `,
  },
];
