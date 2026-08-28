import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ContractTemplate, ContractTemplateCategory } from '../../types';
import { AddEditTemplateModal } from './AddEditTemplateModal';
import {
  FileCode,
  Plus,
  Search,
  Edit2,
  Copy,
  Trash2,
  Eye,
  CheckCircle2,
  Archive,
  Layers,
  Sparkles,
  Shield,
  HelpCircle,
  FileText,
  Building,
  X,
} from 'lucide-react';
import { CONTRACT_PLACEHOLDERS, renderContractContent, ContractMappingInput } from '../../services/contractTemplateService';

export const ContractTemplatesManager: React.FC = () => {
  const {
    filteredContractTemplates,
    addContractTemplate,
    updateContractTemplate,
    deleteContractTemplate,
    duplicateContractTemplate,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);

  const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);
  const [showPlaceholderGuide, setShowPlaceholderGuide] = useState(false);

  // Filter templates
  const displayedTemplates = filteredContractTemplates.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tmpl: ContractTemplate) => {
    setEditingTemplate(tmpl);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (tmpl: ContractTemplate) => {
    const newStatus = tmpl.status === 'active' ? 'archived' : 'active';
    updateContractTemplate({
      ...tmpl,
      status: newStatus,
    });
  };

  const handleDelete = (tmpl: ContractTemplate) => {
    const confirm = window.confirm(`Bạn có chắc chắn muốn xóa mẫu hợp đồng "${tmpl.name}" (${tmpl.code})?`);
    if (confirm) {
      deleteContractTemplate(tmpl.id);
    }
  };

  const handleDuplicate = (tmpl: ContractTemplate) => {
    duplicateContractTemplate(tmpl.id);
  };

  const handleSaveTemplate = (data: any) => {
    if (editingTemplate) {
      updateContractTemplate({
        ...editingTemplate,
        ...data,
      });
    } else {
      addContractTemplate(data);
    }
  };

  // Sample data for quick preview modal
  const sampleData: ContractMappingInput = {
    contractNumber: previewTemplate?.code || 'HĐKT-2026/08-001',
    contractDate: new Date().toISOString().split('T')[0],
    contractTitle: previewTemplate?.name || 'HỢP ĐỒNG KINH TẾ MẪU',
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
    ],
    totals: {
      subtotal: 34500000,
      taxRate: 10,
      taxAmount: 3450000,
      grandTotal: 37950000,
    },
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>📑</span>
            <span>Kho Hợp Đồng Mẫu & Cấu Hình Biến Dữ Liệu</span>
          </h2>
          <p className="text-xs text-slate-500">
            Quản lý các mẫu hợp đồng pháp lý, gán placeholders tự động sinh hợp đồng từ Báo giá đã chốt và đóng băng snapshot.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPlaceholderGuide(!showPlaceholderGuide)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Thư Viện Biến</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Mẫu Hợp Đồng</span>
          </button>
        </div>
      </div>

      {/* Placeholder Reference Guide Banner (Collapsible) */}
      {showPlaceholderGuide && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <h3 className="font-bold text-sm text-white">Quy ước Biến Dữ Liệu Hợp Đồng (Placeholders)</h3>
            </div>
            <button
              onClick={() => setShowPlaceholderGuide(false)}
              className="text-slate-300 hover:text-white text-xs underline cursor-pointer"
            >
              Đóng lại
            </button>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">
            Chèn các thẻ biến dưới đây vào nội dung văn bản mẫu. Khi người dùng bấm <strong>[ Tạo Hợp Đồng ]</strong> từ báo giá chốt, hệ thống sẽ tự động thay thế bằng dữ liệu thực tế tương ứng:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-[11px]">
            {CONTRACT_PLACEHOLDERS.map((p) => (
              <div key={p.key} className="bg-white/10 p-2 rounded border border-white/10">
                <div className="font-mono font-bold text-amber-300">{p.key}</div>
                <div className="text-slate-200">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên mẫu, mã code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-hidden bg-slate-50/50"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 outline-hidden"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="cung_cap">Cung cấp vật tư</option>
            <option value="thi_cong">Thi công lắp đặt</option>
            <option value="thuong_mai">Thương mại chuẩn</option>
            <option value="dich_vu">Dịch vụ kỹ thuật</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 outline-hidden"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">🟢 Đang sử dụng</option>
            <option value="archived">⚪ Đã lưu trữ</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
          Hiển thị: <strong className="text-slate-900">{displayedTemplates.length}</strong> / {filteredContractTemplates.length} mẫu
        </div>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayedTemplates.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
            Không tìm thấy mẫu hợp đồng nào phù hợp. Bấm <strong>[ + Thêm Mẫu Hợp Đồng ]</strong> để tạo mẫu mới.
          </div>
        ) : (
          displayedTemplates.map((tmpl) => {
            const isActive = tmpl.status === 'active';
            return (
              <div
                key={tmpl.id}
                className={`bg-white rounded-xl border transition shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-md ${
                  isActive ? 'border-slate-200 hover:border-blue-300' : 'border-slate-200 bg-slate-50/60 opacity-80'
                }`}
              >
                <div className="p-4 space-y-2.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {tmpl.code}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                        v{tmpl.version || '1.0'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {isActive ? '✓ Đang dùng' : 'Đã lưu trữ'}
                      </span>
                    </div>
                  </div>

                  {/* Template Title */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-blue-600 transition">
                      {tmpl.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {tmpl.description || 'Chưa có mô tả chi tiết cho mẫu hợp đồng này.'}
                    </p>
                  </div>

                  {/* Category Tag */}
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                    <span className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{tmpl.categoryLabel || tmpl.category}</span>
                    </span>
                    <span>Cập nhật: {tmpl.updatedAt || tmpl.createdAt}</span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  <button
                    onClick={() => setPreviewTemplate(tmpl)}
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition flex items-center space-x-1 cursor-pointer font-medium"
                    title="Xem trước mẫu"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem mẫu</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDuplicate(tmpl)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition cursor-pointer"
                      title="Nhân bản mẫu"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(tmpl)}
                      className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                      title={isActive ? 'Lưu trữ mẫu' : 'Kích hoạt lại mẫu'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(tmpl)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer"
                      title="Chỉnh sửa mẫu"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(tmpl)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition cursor-pointer"
                      title="Xóa mẫu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Template Modal */}
      <AddEditTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />

      {/* Quick Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>👁️ Xem Trước Hợp Đồng Mẫu:</span>
                  <span className="text-blue-400">{previewTemplate.name}</span>
                  <span className="font-mono text-xs text-slate-300">v{previewTemplate.version}</span>
                </h3>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
              <div className="bg-white p-8 rounded-lg border border-slate-300 shadow-sm max-w-3xl mx-auto">
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderContractContent(previewTemplate.content, sampleData),
                  }}
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Mã: {previewTemplate.code}</span>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
