import React, { useState, useMemo } from 'react';
import { Customer, Quotation } from '../../types';
import { formatVND, formatDate } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  History,
  AlertCircle,
  Hash,
} from 'lucide-react';

interface CustomerPickerStepProps {
  customers: Customer[];
  quotations: Quotation[];
  selectedCustomer: Customer | null;
  onSelectExistingCustomer: (customer: Customer) => void;
  onCreateNewCustomer: (customerData: {
    name: string;
    company: string;
    phone: string;
    email: string;
    address: string;
    taxCode: string;
    notes?: string;
  }) => Customer;
  onProceedToBuilder: () => void;
}

export const CustomerPickerStep: React.FC<CustomerPickerStepProps> = ({
  customers,
  quotations,
  selectedCustomer,
  onSelectExistingCustomer,
  onCreateNewCustomer,
  onProceedToBuilder,
}) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
  const [searchTerm, setSearchTerm] = useState('');

  // New Customer Form State
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Map each customer to their quotation count & next version
  const customerQuotesMap = useMemo(() => {
    const map = new Map<string, Quotation[]>();
    quotations.forEach((q) => {
      const list = map.get(q.customerId) || [];
      list.push(q);
      map.set(q.customerId, list);
    });
    return map;
  }, [quotations]);

  // Filtered existing customers
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter((c) => {
      const matchCode = c.code.toLowerCase().includes(term);
      const matchName = c.name.toLowerCase().includes(term);
      const matchCompany = c.company ? c.company.toLowerCase().includes(term) : false;
      const matchPhone = c.phone.toLowerCase().includes(term);
      const matchEmail = c.email ? c.email.toLowerCase().includes(term) : false;
      const matchTax = c.taxCode ? c.taxCode.toLowerCase().includes(term) : false;
      return matchCode || matchName || matchCompany || matchPhone || matchEmail || matchTax;
    });
  }, [customers, searchTerm]);

  // Handle New Customer Submit
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Vui lòng nhập họ và tên khách hàng.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Vui lòng nhập số điện thoại liên hệ.');
      return;
    }

    const created = onCreateNewCustomer({
      name: name.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      taxCode: taxCode.trim(),
      notes: notes.trim(),
    });

    onSelectExistingCustomer(created);
    onProceedToBuilder();
  };

  const handleSelectAndProceed = (cust: Customer) => {
    onSelectExistingCustomer(cust);
    onProceedToBuilder();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* STEP HEADER */}
      <div className="text-center space-y-1.5 max-w-xl mx-auto">
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <span>BƯỚC 1 / 3</span>
          <span>•</span>
          <span>XÁC ĐỊNH KHÁCH HÀNG</span>
        </span>
        <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
          Bạn muốn lập báo giá cho khách hàng nào?
        </h2>
        <p className="text-xs text-slate-500">
          Chọn khách hàng đã lưu trong hệ thống để tự động đồng bộ hồ sơ & lịch sử báo giá, hoặc tạo mới khách hàng ngay lập tức.
        </p>
      </div>

      {/* TWO BIG SELECTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
        {/* CARD A: KHÁCH HÀNG ĐÃ CÓ */}
        <div
          onClick={() => setActiveTab('existing')}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start space-x-3.5 ${
            activeTab === 'existing'
              ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
              activeTab === 'existing' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">A. Khách Hàng Đã Có</h3>
              {activeTab === 'existing' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            </div>
            <p className="text-xs text-slate-500">
              Chọn khách hàng đã có trong hệ thống ({customers.length} khách hàng). Tự động lấy toàn bộ thông tin & xác định số lần báo giá.
            </p>
          </div>
        </div>

        {/* CARD B: KHÁCH HÀNG MỚI */}
        <div
          onClick={() => setActiveTab('new')}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start space-x-3.5 ${
            activeTab === 'new'
              ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
              activeTab === 'new' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">B. Khách Hàng Mới</h3>
              {activeTab === 'new' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            </div>
            <p className="text-xs text-slate-500">
              Nhập nhanh thông tin khách hàng mới. Hệ thống sẽ tự động lưu vào Customer Database và đặt là Báo Giá Lần 1.
            </p>
          </div>
        </div>
      </div>

      {/* TAB CONTENT A: EXISTING CUSTOMER SEARCH & LIST */}
      {activeTab === 'existing' && (
        <div className="space-y-3 max-w-4xl mx-auto bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              autoFocus
              placeholder="🔎 Tìm theo tên, mã khách hàng (KH-...), số điện thoại, công ty, email, MST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50/80 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-medium text-slate-900 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Customer list */}
          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-semibold text-slate-600">Không tìm thấy khách hàng phù hợp</div>
                <button
                  type="button"
                  onClick={() => setActiveTab('new')}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition"
                >
                  + Tạo mới khách hàng này
                </button>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const pastQuotes = customerQuotesMap.get(cust.id) || [];
                const nextVersion = pastQuotes.length + 1;
                const isSelected = selectedCustomer?.id === cust.id;

                return (
                  <div
                    key={cust.id}
                    onClick={() => onSelectExistingCustomer(cust)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Customer details */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-mono font-bold text-blue-700 text-xs bg-blue-100/80 px-2 py-0.5 rounded">
                          {cust.code}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{cust.name}</h4>
                        {cust.company && (
                          <span className="text-xs font-medium text-slate-600 flex items-center space-x-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{cust.company}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-slate-700">{cust.phone}</span>
                        </div>
                        {cust.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{cust.email}</span>
                          </div>
                        )}
                        {cust.address && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-xs">{cust.address}</span>
                          </div>
                        )}
                        {cust.taxCode && (
                          <div className="flex items-center space-x-1">
                            <Hash className="w-3 h-3 text-slate-400" />
                            <span>MST: {cust.taxCode}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Version badge & action */}
                    <div className="flex items-center space-x-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-between md:justify-end">
                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-extrabold ${
                            nextVersion === 1
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          BÁO GIÁ LẦN {nextVersion}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {pastQuotes.length === 0
                            ? 'Chưa từng có báo giá'
                            : `Đã có ${pastQuotes.length} lần báo giá trước`}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndProceed(cust);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-2xs ${
                          isSelected
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-900 text-white hover:bg-blue-600'
                        }`}
                      >
                        <span>Lập Báo Giá</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedCustomer && (
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Đang chọn: <strong className="text-slate-900">{selectedCustomer.name}</strong> ({selectedCustomer.code})
              </div>
              <button
                type="button"
                onClick={onProceedToBuilder}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95 flex items-center space-x-1.5"
              >
                <span>Tiếp Tục Tạo Báo Giá (Lần {(customerQuotesMap.get(selectedCustomer.id)?.length || 0) + 1})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT B: NEW CUSTOMER CREATION FORM */}
      {activeTab === 'new' && (
        <form
          onSubmit={handleCreateCustomerSubmit}
          className="space-y-4 max-w-3xl mx-auto bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-xs text-slate-800"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Nhập Thông Tin Khách Hàng Mới</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Khách hàng này sẽ được tự động lưu vào Customer Database và gắn trực tiếp vào báo giá lần 1.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Tự động là Báo Giá Lần 1
            </span>
          </div>

          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tên khách hàng */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Khách Hàng / Người Đại Diện <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Anh Tuấn / Chị Lan..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số Điện Thoại Liên Hệ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: 0912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
              />
            </div>

            {/* Công ty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Công Ty / Tổ Chức</label>
              <input
                type="text"
                placeholder="VD: Công ty CP Đầu Tư Xây Dựng Nam Long"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="khachhang@congty.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
              />
            </div>

            {/* Địa chỉ giao hàng / Dự án */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa Chỉ Giao Hàng / Địa Điểm Công Trình
              </label>
              <input
                type="text"
                placeholder="VD: Villa 12, Khu đô thị Sala, TP. Thủ Đức, TP.HCM"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
              />
            </div>

            {/* Mã số thuế */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã Số Thuế (MST)</label>
              <input
                type="text"
                placeholder="0312345678"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
              />
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Ban Đầu</label>
              <input
                type="text"
                placeholder="Khách cần tiến độ giao hàng trước tháng sau..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('existing')}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600"
            >
              Quay lại chọn khách cũ
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95 flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo Khách Hàng & Chuyển Sang Lập Báo Giá</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
