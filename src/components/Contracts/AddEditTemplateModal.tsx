import React, { useState, useEffect } from 'react';
import { ContractTemplate, ContractTemplateCategory } from '../../types';
import {
  CONTRACT_PLACEHOLDERS,
  renderContractContent,
  ContractMappingInput,
} from '../../services/contractTemplateService';
import {
  X,
  FileCode,
  Eye,
  Edit3,
  Save,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  Layers,
  ArrowRight,
  Shield,
  FileText,
  Upload,
} from 'lucide-react';

interface AddEditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: ContractTemplate | null;
  onSave: (templateData: any) => void;
}

export const AddEditTemplateModal: React.FC<AddEditTemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
}) => {
  const isEditing = !!template;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<ContractTemplateCategory>('cung_cap');
  const [version, setVersion] = useState('1.0');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setCode(template.code);
      setCategory(template.category || 'cung_cap');
      setVersion(template.version || '1.0');
      setStatus(template.status || 'active');
      setDescription(template.description || '');
      setContent(template.content || '');
    } else {
      setName('');
      setCode(`HD-MAU-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
      setCategory('cung_cap');
      setVersion('1.0');
      setStatus('active');
      setDescription('');
      setContent(`
<div style="font-family: 'Times New Roman', Times, serif; color: #111827; line-height: 1.6; font-size: 13pt;">
  <div style="text-align: center; margin-bottom: 20px;">
    <p style="font-weight: bold; margin: 0; font-size: 12pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
    <p style="font-weight: bold; margin: 0; font-size: 11pt;">Độc lập - Tự do - Hạnh phúc</p>
  </div>

  <div style="text-align: center; margin: 20px 0;">
    <h1 style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0;">{{contract_title}}</h1>
    <p style="font-style: italic; margin: 4px 0 0 0;">Số HĐ: <strong>{{contract_number}}</strong></p>
  </div>

  <p>Hôm nay, ngày {{contract_date}}, các bên gồm:</p>
  <p><strong>Bên Bán:</strong> {{seller_name}} | MST: {{seller_tax_code}} | ĐT: {{seller_phone}}</p>
  <p><strong>Bên Mua:</strong> {{customer_company}} | MST: {{customer_tax_code}} | ĐT: {{customer_phone}}</p>

  <p style="font-weight: bold; margin-top: 10px;">Chi tiết hàng hóa cung cấp:</p>
  {{items_table}}

  <p><strong>Tổng giá trị thanh toán:</strong> {{contract_grand_total}}</p>
  <p style="font-style: italic;">(Bằng chữ: {{contract_total_in_words}})</p>

  <p><strong>Điều khoản thanh toán:</strong> {{payment_terms}}</p>
  <p><strong>Địa điểm giao hàng:</strong> {{delivery_address}}</p>

  <table style="width: 100%; border: none; margin-top: 30px; text-align: center;">
    <tr>
      <td style="width: 50%; font-weight: bold;">ĐẠI DIỆN BÊN MUA<br/><br/><br/><br/><strong>{{customer_representative}}</strong></td>
      <td style="width: 50%; font-weight: bold;">ĐẠI DIỆN BÊN BÁN<br/><br/><br/><br/><strong>{{seller_representative}}</strong></td>
    </tr>
  </table>
</div>
      `.trim());
    }
  }, [template, isOpen]);

  if (!isOpen) return null;

  const handleInsertPlaceholder = (placeholderKey: string) => {
    setContent((prev) => prev + ` ${placeholderKey} `);
    setCopiedKey(placeholderKey);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleBumpVersion = (type: 'patch' | 'minor' | 'major') => {
    const parts = (version || '1.0').split('.').map(Number);
    const major = isNaN(parts[0]) ? 1 : parts[0];
    const minor = isNaN(parts[1]) ? 0 : parts[1];

    if (type === 'minor') {
      setVersion(`${major}.${minor + 1}`);
    } else if (type === 'major') {
      setVersion(`${major + 1}.0`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !content.trim()) {
      alert('Vui lòng điền đầy đủ Tên mẫu, Mã mẫu và Nội dung văn bản hợp đồng.');
      return;
    }

    onSave({
      id: template?.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category,
      categoryLabel:
        category === 'cung_cap'
          ? 'Cung Cấp Vật Tư'
          : category === 'thi_cong'
          ? 'Thi Công Lắp Đặt'
          : category === 'thuong_mai'
          ? 'Thương Mại Chuẩn'
          : category === 'dich_vu'
          ? 'Dịch Vụ Kỹ Thuật'
          : 'Khác',
      version: version.trim() || '1.0',
      status,
      description: description.trim(),
      content: content.trim(),
    });
    onClose();
  };

  // Mock dummy data for preview
  const sampleData: ContractMappingInput = {
    contractNumber: code || 'HĐKT-2026/08-001',
    contractDate: new Date().toISOString().split('T')[0],
    contractTitle: name || 'HỢP ĐỒNG KINH TẾ MẪU',
    deliveryDate: '2026-09-15',
    deliveryAddress: 'Số 188 Phạm Văn Đồng, Mai Dịch, Cầu Giấy, Hà Nội',
    deliveryTerms: 'Hàng mới 100%, nguyên đai nguyên kiện từ nhà sản xuất.',
    paymentTerms: 'Thanh toán bằng chuyển khoản: Tạm ứng 30% khi ký HĐ, 70% khi nhận đủ hàng.',
    warrantyTerms: 'Bảo hành chính hãng 24 tháng theo tiêu chuẩn nhà sản xuất.',
    generalTerms: 'Hai bên cam kết thực hiện đúng và đầy đủ các điều khoản trong hợp đồng.',
    customer: {
      name: 'KTS. Nguyễn Đình Khoa',
      company: 'CÔNG TY CP ĐẦU TƯ & THIẾT KẾ KIẾN TRÚC A-PLUS',
      address: 'Toà nhà Golden King, 15 Nguyễn Lương Bằng, P. Tân Phú, Quận 7, TP.HCM',
      taxCode: '0314889988',
      phone: '0903 123 456',
      email: 'khoa.nguyen@aplus-arch.vn',
      representative: 'Nguyễn Đình Khoa',
      position: 'Tổng Giám Đốc',
    },
    seller: {
      name: 'CÔNG TY TNHH HHG HOLDINGS',
      address: 'Số 5-6-7 The Premier, Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
      taxCode: '0108999888',
      phone: '+84 243 821 6666',
      email: 'info@hhg.vn',
      website: 'www.hhg.vn',
      representative: 'Bùi Viết Hoàng',
      position: 'Tổng Giám Đốc',
      bankAccount: '19038889999018',
      bankName: 'Techcombank - Chi nhánh Thăng Long',
    },
    quotation: {
      quoteNumber: 'BG-2026-001-V2',
      date: '2026-08-20',
    },
    items: [
      {
        id: '1',
        sku: 'LED-TRACK-03',
        name: 'Đèn Rọi Ray Nam Châm Từ Tính Ultra-Slim 20W',
        brand: 'Opple Luxury',
        category: 'Đèn Chiếu Sáng',
        color: 'Đen Anode / 3000K',
        size: 'L220xW22xH45mm',
        unit: 'Cái',
        listPrice: 1250000,
        dpPrice: 900000,
        quotedPrice: 1150000,
        quantity: 30,
        discountPercent: 0,
        totalAmount: 34500000,
        inventoryAvailable: 5,
        isBelowDP: false,
      },
      {
        id: '2',
        sku: 'SMART-HUB-01',
        name: 'Bộ Điều Khiển Trung Tâm Smart Gateway Zigbee 3.0',
        brand: 'Aqara Pro',
        category: 'Smart Home',
        color: 'Trắng Ngọc Trai',
        size: 'D80xH28mm',
        unit: 'Bộ',
        listPrice: 2800000,
        dpPrice: 2100000,
        quotedPrice: 2650000,
        quantity: 4,
        discountPercent: 0,
        totalAmount: 10600000,
        inventoryAvailable: 0,
        isBelowDP: false,
      },
    ],
    totals: {
      subtotal: 45100000,
      taxRate: 10,
      taxAmount: 4510000,
      grandTotal: 49610000,
    },
  };

  const renderedPreview = renderContractContent(content, sampleData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
              <FileCode className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {isEditing ? `Chỉnh Sửa Hợp Đồng Mẫu: ${template.name}` : 'Thêm Mới Hợp Đồng Mẫu'}
              </h2>
              <p className="text-xs text-slate-400">
                Gắn các biến đại diện để tự động mapping thông tin từ báo giá chốt và khách hàng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 font-bold text-xs rounded-t-lg border-t-2 transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white border-blue-600 text-blue-700 shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Trình Soạn Thảo & Cấu Hình Mẫu</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 font-bold text-xs rounded-t-lg border-t-2 transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white border-blue-600 text-blue-700 shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem Trước Bản In (Live Preview)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:flex items-center space-x-1.5 pb-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Phiên bản hiện tại: <strong className="text-slate-800">v{version}</strong></span>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'editor' ? (
            <form id="template-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 text-xs">
                <div className="lg:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên Mẫu Hợp Đồng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="vd: Hợp đồng Cung cấp Vật tư Thiết bị Điện"
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã Mẫu (Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="vd: HD-CUNG-CAP"
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 font-mono font-bold uppercase focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phân Loại Danh Mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ContractTemplateCategory)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden font-medium"
                  >
                    <option value="cung_cap">Cung cấp vật tư / thiết bị</option>
                    <option value="thi_cong">Thi công & lắp đặt</option>
                    <option value="thuong_mai">Thương mại & mua bán chuẩn</option>
                    <option value="dich_vu">Dịch vụ kỹ thuật</option>
                    <option value="khac">Khác</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Phiên Bản (Version)</label>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleBumpVersion('minor')}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        +v0.1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBumpVersion('major')}
                        className="text-[10px] text-blue-600 hover:underline font-bold ml-1"
                      >
                        +v1.0
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 font-mono focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng Thái</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden font-medium"
                  >
                    <option value="active">🟢 Đang sử dụng (Active)</option>
                    <option value="archived">⚪ Tạm ngưng / Lưu trữ (Archived)</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Mô Tả Mục Đích Sử Dụng</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả trường hợp áp dụng mẫu hợp đồng này..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Placeholder helper toolbar */}
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thư Viện Biến Dữ Liệu Tự Động (Bấm để chèn vào văn bản):</span>
                  </div>
                  {copiedKey && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1 bg-emerald-100 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" />
                      <span>Đã chèn {copiedKey}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {CONTRACT_PLACEHOLDERS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleInsertPlaceholder(p.key)}
                      title={`${p.description} (Ví dụ: ${p.sampleValue})`}
                      className={`text-[11px] px-2 py-1 rounded font-mono font-medium border transition cursor-pointer flex items-center space-x-1 ${
                        p.key === '{{items_table}}'
                          ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200 font-bold'
                          : p.category === 'customer'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : p.category === 'seller'
                          ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                          : p.category === 'totals'
                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>+ {p.key}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Body Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>Nội Dung Hợp Đồng Mẫu (HTML / Text Formatted) <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Bắt buộc có placeholder <code className="font-mono text-purple-700 bg-purple-50 px-1 rounded">{'{{items_table}}'}</code> để sinh bảng sản phẩm.
                  </span>
                </div>

                <textarea
                  rows={16}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung mẫu hợp đồng..."
                  required
                  className="w-full p-3.5 font-mono text-xs text-slate-900 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden leading-relaxed"
                />
              </div>
            </form>
          ) : (
            /* Live Preview Area */
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>
                  💡 <strong>Bản xem trước trực tiếp:</strong> Dữ liệu bên dưới được mô phỏng từ khách hàng mẫu và báo giá mẫu để bạn kiểm tra cấu trúc định dạng.
                </span>
                <span className="font-mono text-[11px] bg-amber-200/70 px-2 py-0.5 rounded font-bold">
                  v{version}
                </span>
              </div>

              <div className="bg-white p-8 rounded-lg border border-slate-300 shadow-sm max-w-4xl mx-auto overflow-x-auto min-h-[500px]">
                <div dangerouslySetInnerHTML={{ __html: renderedPreview }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="submit"
            form="template-form"
            onClick={activeTab === 'preview' ? handleSubmit : undefined}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Lưu Cập Nhật Mẫu' : 'Tạo Mẫu Hợp Đồng'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
