import React from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, User, MapPin, Phone, Mail, Globe, FileText, Calendar, Sparkles, Check, RotateCcw, HelpCircle, Image as ImageIcon, ShieldCheck } from 'lucide-react';

export interface HeaderFooterConfigState {
  quoteTitle: string;
  orderCode: string;
  quoteDate: string;
  validUntilDate: string;
  
  // Bên Mua
  customerName: string;
  projectLocation: string;
  customerPhone: string;
  contactPerson: string;
  
  // Bên Bán
  companyName: string;
  companyAddress: string;
  companyHotline: string;
  companyWebsite: string;
  companyEmail: string;
  companyLogo?: string;
  salesRepName: string;
  salesRepPhone: string;
  salesRepEmail: string;
  
  // Lời mở đầu
  openingGreeting: string;
  
  // 5 Điều khoản kết thúc
  priceTerms: string;
  deliveryTerms: string;
  shippingTerms: string;
  warrantyTerms: string;
  leadTimeTerms: string;
  closingNotes: string;
  signatoryTitle: string;
}

interface QuotationHeaderFooterConfigProps {
  config: HeaderFooterConfigState;
  onChange: (newConfig: HeaderFooterConfigState) => void;
  onApplyHHGTemplate: () => void;
  onApplyDefaultTemplate: () => void;
}

export const QuotationHeaderFooterConfig: React.FC<QuotationHeaderFooterConfigProps> = ({
  config,
  onChange,
  onApplyHHGTemplate,
  onApplyDefaultTemplate,
}) => {
  const { companyInfo, currentUser } = useApp();
  const activeLogo = config.companyLogo || companyInfo?.logoUrl || companyInfo?.logo;

  const updateField = (field: keyof HeaderFooterConfigState, value: string) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const titlePresets = [
    'BÁO GIÁ THIẾT BỊ VỆ SINH',
    'BÁO GIÁ THIẾT BỊ HOÀN THIỆN',
    'BÁO GIÁ THIẾT BỊ CHIẾU SÁNG & ĐIỆN',
    'BẢNG BÁO GIÁ THƯƠNG MẠI',
    'XÁC NHẬN ĐƠN HÀNG & BÁO GIÁ',
  ];

  return (
    <div className="space-y-4 text-xs">
      {/* Template Quick Presets Bar */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 p-3.5 rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">Tùy Chọn Mẫu Form Mở Đầu & Kết Thúc Báo Giá</div>
            <div className="text-[11px] text-slate-500">Mẫu chuẩn 2 cột bảng khung (HHG Holdings) hoặc mẫu hiện đại SalesFlow</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onApplyHHGTemplate}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Nạp Mẫu Báo Giá HHG Holdings</span>
          </button>

          <button
            type="button"
            onClick={onApplyDefaultTemplate}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mẫu Tiêu Chuẩn</span>
          </button>
        </div>
      </div>

      {/* 1. PHẦN MỞ ĐẦU (HEADER) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex items-center space-x-2 text-blue-900 font-bold border-b border-slate-100 pb-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-xs sm:text-sm">1. THIẾT KẾ PHẦN MỞ ĐẦU (TIÊU ĐỀ & KHUNG BẢNG 2 CỘT)</span>
        </div>

        {/* Tiêu đề & Mã đơn hàng */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="block font-bold text-slate-700">
              Tiêu Đề Báo Giá (In Hoa Giữa Trang) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={config.quoteTitle}
              onChange={(e) => updateField('quoteTitle', e.target.value)}
              placeholder="VD: BÁO GIÁ THIẾT BỊ VỆ SINH"
              className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
            />
            {/* Quick Presets for Title */}
            <div className="flex flex-wrap gap-1 pt-1">
              {titlePresets.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateField('quoteTitle', t)}
                  className={`text-[10px] px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    config.quoteTitle === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Số ĐH / Số Báo Giá (Ô Góc Phải) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={config.orderCode}
              onChange={(e) => updateField('orderCode', e.target.value)}
              placeholder="VD: 01/HHG hoặc BG-2026-001"
              className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-[10px] text-slate-400">Hiển thị trong ô bảng góc trên bên phải</div>
          </div>
        </div>

        {/* Khung Bảng 2 Cột: Bên Mua & Bên Bán */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Cột Bên Mua / Khách Hàng */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="font-bold text-blue-900 text-xs flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>CỘT TRÁI: BÊN MUA / KHÁCH HÀNG & CÔNG TRÌNH</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                KHÁCH HÀNG:
              </label>
              <input
                type="text"
                value={config.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                placeholder="VD: CÔNG TRÌNH NHÀ CHỊ HẠNH"
                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-md bg-white uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                ĐỊA CHỈ/CÔNG TRÌNH:
              </label>
              <input
                type="text"
                value={config.projectLocation}
                onChange={(e) => updateField('projectLocation', e.target.value)}
                placeholder="VD: STARLAKE TÂY HỒ"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  SỐ ĐIỆN THOẠI:
                </label>
                <input
                  type="text"
                  value={config.customerPhone}
                  onChange={(e) => updateField('customerPhone', e.target.value)}
                  placeholder="VD: 0978 322 208"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  NGƯỜI LIÊN HỆ:
                </label>
                <input
                  type="text"
                  value={config.contactPerson}
                  onChange={(e) => updateField('contactPerson', e.target.value)}
                  placeholder="VD: CHỊ HUYỀN"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white uppercase font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Cột Bên Bán / Đơn Vị Báo Giá */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-blue-900 text-xs flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>CỘT PHẢI: BÊN BÁN / CÔNG TY & PHỤ TRÁCH</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Đồng bộ từ Cấp 1</span>
              </span>
            </div>

            {/* Logo Display & Sync Preview */}
            <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center space-x-3">
              {activeLogo ? (
                <div className="h-10 w-24 bg-slate-50 border border-slate-200 rounded flex items-center justify-center p-1 overflow-hidden shrink-0">
                  <img src={activeLogo} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-10 w-10 bg-slate-900 text-amber-400 font-black rounded flex items-center justify-center text-xs shrink-0">
                  {config.companyName?.includes('HHG') ? 'HHG' : 'SF'}
                </div>
              )}
              <div className="text-[10.5px] leading-tight">
                <div className="font-bold text-slate-800 flex items-center space-x-1">
                  <span>Logo Báo Giá:</span>
                  <span className="text-blue-700 font-semibold">{activeLogo ? 'Đã cài đặt logo' : 'Chưa có logo (dùng chữ viết tắt)'}</span>
                </div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">
                  Logo được lấy tự động từ phần thông tin tài khoản Cấp 1 và hiển thị trên đầu báo giá A4 & Hợp đồng.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                TÊN CÔNG TY BÁN HÀNG:
              </label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="VD: CÔNG TY TNHH HHG HOLDINGS"
                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-md bg-white uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  ĐỊA CHỈ:
                </label>
                <input
                  type="text"
                  value={config.companyAddress}
                  onChange={(e) => updateField('companyAddress', e.target.value)}
                  placeholder="VD: Số 5-6-7 The Premier, Tôn Thất Thuyết, Cầu Giấy, Hà Nội"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  HOTLINE:
                </label>
                <input
                  type="text"
                  value={config.companyHotline}
                  onChange={(e) => updateField('companyHotline', e.target.value)}
                  placeholder="VD: +84 243 821 6666"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  WEBSITE:
                </label>
                <input
                  type="text"
                  value={config.companyWebsite}
                  onChange={(e) => updateField('companyWebsite', e.target.value)}
                  placeholder="VD: www.hhg.vn"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  EMAIL CÔNG TY:
                </label>
                <input
                  type="text"
                  value={config.companyEmail}
                  onChange={(e) => updateField('companyEmail', e.target.value)}
                  placeholder="VD: info@hhg.vn"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                PHỤ TRÁCH (SALE REP):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={config.salesRepName}
                  onChange={(e) => updateField('salesRepName', e.target.value)}
                  placeholder="Họ tên: Nguyễn Thị Hương"
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md bg-white"
                />
                <input
                  type="text"
                  value={config.salesRepPhone}
                  onChange={(e) => updateField('salesRepPhone', e.target.value)}
                  placeholder="Mobile: 0978322208"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lời mở đầu */}
        <div className="pt-2">
          <label className="block font-bold text-slate-700 mb-1">
            Lời Chào Mở Đầu Báo Giá:
          </label>
          <input
            type="text"
            value={config.openingGreeting}
            onChange={(e) => updateField('openingGreeting', e.target.value)}
            placeholder="Thay mặt Công ty TNHH HHG HOLDINGS, xin hân hạnh gửi đến quý khách xác nhận đơn hàng gồm các hạng mục như sau:"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg italic text-slate-700 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* 2. PHẦN KẾT THÚC (FOOTER & TERMS) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex items-center space-x-2 text-emerald-900 font-bold border-b border-slate-100 pb-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs sm:text-sm">2. THIẾT KẾ PHẦN KẾT THÚC (CÁC ĐIỀU KHOẢN KÈM THEO & LỜI CẢM ƠN)</span>
        </div>

        {/* 5 Điều khoản kèm theo chuẩn form */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-700">
            Các Điều Khoản Kèm Theo (Được đánh số 1, 2, 3, 4, 5... trên bản in):
          </div>

          {/* Điều 1: Đơn giá */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Đơn Giá & Quy Cách Tính:</span>
            </div>
            <textarea
              rows={2}
              value={config.priceTerms}
              onChange={(e) => updateField('priceTerms', e.target.value)}
              placeholder="VD: - VNĐ, đã bao gồm thuế VAT và chưa bao gồm chi phí lắp đặt.&#10;- Khối lượng là tạm tính, giá trị thanh toán là khối lượng giao nhận thực tế."
              className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white"
            />
          </div>

          {/* Điều 2: Địa chỉ giao hàng */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Địa Chỉ Giao Hàng:</span>
            </div>
            <input
              type="text"
              value={config.deliveryTerms}
              onChange={(e) => updateField('deliveryTerms', e.target.value)}
              placeholder="VD: Starlake"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-semibold"
            />
          </div>

          {/* Điều 3: Chi phí vận chuyển */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Chi Phí Vận Chuyển:</span>
            </div>
            <input
              type="text"
              value={config.shippingTerms}
              onChange={(e) => updateField('shippingTerms', e.target.value)}
              placeholder="VD: Miễn phí giao hàng đến chân công trình vào các ngày thứ 3 và thứ 5 hàng tuần trong nội thành Hà Nội"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
            />
          </div>

          {/* Điều 4: Bảo hành */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">4</span>
              <span>Thời Hạn Bảo Hành:</span>
            </div>
            <input
              type="text"
              value={config.warrantyTerms}
              onChange={(e) => updateField('warrantyTerms', e.target.value)}
              placeholder="VD: Bảo hành 24 tháng"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-semibold"
            />
          </div>

          {/* Điều 5: Tiến độ cấp hàng */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">5</span>
              <span>Tiến Độ Cấp Hàng:</span>
            </div>
            <input
              type="text"
              value={config.leadTimeTerms}
              onChange={(e) => updateField('leadTimeTerms', e.target.value)}
              placeholder="VD: 180 ngày kể từ ngày nhận tạm ứng"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-semibold"
            />
          </div>
        </div>

        {/* Lời kết cảm ơn & Tên đại diện ký */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Lời Kết & Liên Hệ (Cuối Báo Giá):
            </label>
            <textarea
              rows={2}
              value={config.closingNotes}
              onChange={(e) => updateField('closingNotes', e.target.value)}
              placeholder="Mọi thông tin cần làm rõ, Quý khách vui lòng liên hệ với nhân viên phụ trách hoặc Công ty TNHH HHG Holdings;&#10;Chân thành cám ơn Quý khách!"
              className="w-full p-2 text-xs border border-slate-300 rounded-md italic"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tên Đơn Vị Ký Xác Nhận (Góc Phải Cuối Trang):
            </label>
            <input
              type="text"
              value={config.signatoryTitle}
              onChange={(e) => updateField('signatoryTitle', e.target.value)}
              placeholder="VD: CÔNG TY TNHH HHG HOLDINGS"
              className="w-full px-2.5 py-2 text-xs font-bold border border-slate-300 rounded-md uppercase"
            />
            <div className="text-[10px] text-slate-400 mt-1">Được in nổi bật ở phía dưới bên phải các điều khoản</div>
          </div>
        </div>
      </div>
    </div>
  );
};
