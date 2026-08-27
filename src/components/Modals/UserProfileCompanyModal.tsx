import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanyInfo, User } from '../../types';
import {
  X,
  User as UserIcon,
  Building2,
  Upload,
  Image as ImageIcon,
  Check,
  Shield,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  FileText,
  Globe,
  CreditCard,
  KeyRound,
  Sparkles,
  Info,
  CheckCircle2,
  Copy,
  Trash2,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface UserProfileCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'company';
  onOpenChangePassword?: () => void;
}

export const UserProfileCompanyModal: React.FC<UserProfileCompanyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
  onOpenChangePassword,
}) => {
  const {
    currentUser,
    updateUserProfile,
    companyInfo,
    updateCompanyInfo,
    users,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'company'>(initialTab);

  // User Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    avatar: '',
  });

  // Company Info Form State
  const [companyForm, setCompanyForm] = useState<CompanyInfo>({
    id: 'company-master',
    name: '',
    legalName: '',
    address: '',
    taxCode: '',
    logoUrl: '',
    phone: '',
    email: '',
    website: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    directorName: '',
    directorTitle: '',
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [companySuccessMsg, setCompanySuccessMsg] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Populate data when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        department: currentUser.department || '',
        position: currentUser.position || (currentUser.role === 'super_admin' ? 'Tổng Giám Đốc / Quản trị hệ thống' : currentUser.role === 'manager_c1' ? 'Giám đốc / Trưởng phòng kinh doanh' : 'Chuyên viên tư vấn dự án'),
        avatar: currentUser.avatar || '',
      });

      setCompanyForm({
        id: companyInfo?.id || 'company-master',
        name: companyInfo?.name || 'CÔNG TY CỔ PHẦN CÔNG NGHỆ & THIẾT BỊ SALESFLOW',
        legalName: companyInfo?.legalName || companyInfo?.name || 'CÔNG TY CỔ PHẦN CÔNG NGHỆ & THIẾT BỊ SALESFLOW',
        address: companyInfo?.address || 'Tòa nhà Bitexco Financial Tower, Số 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM',
        taxCode: companyInfo?.taxCode || '0318999888',
        logoUrl: companyInfo?.logoUrl || '',
        phone: companyInfo?.phone || '1900 6868 - (028) 3822 9999',
        email: companyInfo?.email || 'contact@salesflow.vn',
        website: companyInfo?.website || 'www.salesflow.vn',
        bankName: companyInfo?.bankName || 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank) - Chi nhánh TP.HCM',
        bankAccountNumber: companyInfo?.bankAccountNumber || '0071000999888',
        bankAccountHolder: companyInfo?.bankAccountHolder || 'CONG TY CP CONG NGHE & THIET BI SALESFLOW',
        directorName: companyInfo?.directorName || 'Bùi Viết Hoàng',
        directorTitle: companyInfo?.directorTitle || 'Tổng Giám Đốc',
      });

      setProfileSuccessMsg('');
      setCompanySuccessMsg('');
    }
  }, [isOpen, currentUser, companyInfo, initialTab]);

  if (!isOpen) return null;

  const isTier1OrAdmin = currentUser.role === 'super_admin' || currentUser.role === 'manager_c1';
  const managerUser = currentUser.managerId ? users.find((u) => u.id === currentUser.managerId) : null;

  // Handle Logo Upload via File
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Vui lòng chọn file logo có dung lượng dưới 2MB để tối ưu hiển thị và xuất PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCompanyForm((prev) => ({ ...prev, logoUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save User Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      alert('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateUserProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        department: profileForm.department.trim(),
        position: profileForm.position.trim(),
        avatar: profileForm.avatar.trim(),
      });
      setProfileSuccessMsg('Cập nhật hồ sơ cá nhân thành công!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi lưu hồ sơ cá nhân.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Save Company Info (Tier 1 & Super Admin only)
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name.trim()) {
      alert('Vui lòng nhập tên công ty.');
      return;
    }

    setIsSavingCompany(true);
    try {
      await updateCompanyInfo({
        ...companyForm,
        name: companyForm.name.trim(),
        legalName: companyForm.legalName?.trim() || companyForm.name.trim(),
        address: companyForm.address.trim(),
        taxCode: companyForm.taxCode.trim(),
        phone: companyForm.phone.trim(),
        email: companyForm.email.trim(),
        website: companyForm.website.trim(),
        bankName: companyForm.bankName?.trim() || '',
        bankAccountNumber: companyForm.bankAccountNumber?.trim() || '',
        bankAccountHolder: companyForm.bankAccountHolder?.trim() || '',
        directorName: companyForm.directorName?.trim() || '',
        directorTitle: companyForm.directorTitle?.trim() || 'Giám Đốc',
        updatedBy: `${currentUser.name} (${currentUser.role === 'super_admin' ? 'Super Admin' : 'Cấp 1'})`,
        updatedAt: new Date().toISOString(),
      });
      setCompanySuccessMsg('Đã lưu thông tin công ty và tự động đồng bộ cho toàn bộ tài khoản Cấp 2, Báo giá & Hợp đồng!');
      setTimeout(() => setCompanySuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi lưu thông tin công ty.');
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Quick Copy Helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black">
              {activeTab === 'profile' ? <UserIcon className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center space-x-2">
                <span>Hồ sơ Cá nhân & Thông tin Doanh nghiệp</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {currentUser.role === 'super_admin'
                    ? 'Super Admin'
                    : currentUser.role === 'manager_c1'
                    ? 'Tài khoản Cấp 1'
                    : 'Tài khoản Cấp 2'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isTier1OrAdmin
                  ? 'Quản lý thông tin cá nhân và thiết lập nhận diện thương hiệu công ty cấp cho toàn hệ thống'
                  : 'Xem và cập nhật hồ sơ cá nhân, xem thông tin nhận diện thương hiệu công ty được cấp từ Cấp 1'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-5 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 py-2.5 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>1. Thông tin cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`flex items-center space-x-2 py-2.5 px-4 font-bold text-xs border-b-2 transition cursor-pointer relative ${
              activeTab === 'company'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>2. Thông tin Công ty & Logo thương hiệu</span>
            {isTier1OrAdmin && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Cấp 1 Quản trị
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* ============================================================== */}
          {/* TAB 1: USER PROFILE FORM                                       */}
          {/* ============================================================== */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{profileSuccessMsg}</span>
                </div>
              )}

              {/* User Role Card & Permissions */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                    {profileForm.avatar ? (
                      <img src={profileForm.avatar} alt={profileForm.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-900">{currentUser.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        {currentUser.role === 'super_admin' ? 'Super Admin (Cấp 0)' : currentUser.role === 'manager_c1' ? 'Giám đốc / Quản lý (Cấp 1)' : 'Kinh doanh / Sales (Cấp 2)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{currentUser.email}</span>
                    </p>
                    {managerUser && (
                      <p className="text-[10px] text-blue-700 font-medium mt-0.5">
                        Quản lý trực tiếp: <strong>{managerUser.name}</strong> ({managerUser.department || 'Cấp 1'})
                      </p>
                    )}
                  </div>
                </div>

                {onOpenChangePassword && (
                  <button
                    type="button"
                    onClick={onOpenChangePassword}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition cursor-pointer shrink-0"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>Đổi mật khẩu</span>
                  </button>
                )}
              </div>

              {/* Profile Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="0912 345 678"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phòng ban / Đơn vị
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                      placeholder="Phòng Kinh Doanh Dự Án 1"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chức vụ / Vị trí
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={profileForm.position}
                      onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                      placeholder="Chuyên viên tư vấn giải pháp"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ảnh đại diện URL (Tùy chọn)
                  </label>
                  <input
                    type="url"
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Save profile button */}
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <span>Đang lưu...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lưu thông tin cá nhân</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 2: COMPANY INFORMATION & BRAND IDENTITY                    */}
          {/* ============================================================== */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              {/* Notice Banner */}
              {isTier1OrAdmin ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="font-bold">Quyền cấp thông tin thương hiệu (Dành cho Cấp 1 & Ban Giám Đốc):</strong>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Toàn bộ thông tin công ty, mã số thuế, địa chỉ, hotline và logo dưới đây sẽ được tự động đồng bộ cấp cho các tài khoản Cấp 2 và áp dụng xuyên suốt trên toàn bộ Báo giá & Hợp đồng.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="font-bold">Nhận diện thương hiệu công ty (Được cấp từ Quản lý Cấp 1):</strong>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Thông tin công ty và Logo được quản lý bởi Cấp 1 / Ban Giám Đốc. Khi bạn tạo Báo giá hoặc Hợp đồng, hệ thống sẽ tự động đưa thông tin thương hiệu chuẩn này vào tài liệu gửi khách hàng.
                    </p>
                  </div>
                </div>
              )}

              {companySuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{companySuccessMsg}</span>
                </div>
              )}

              {/* Form or Read-Only Card */}
              {isTier1OrAdmin ? (
                <form onSubmit={handleSaveCompany} className="space-y-4">
                  {/* LOGO UPLOAD & PREVIEW */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        <span>Logo công ty (Hiển thị góc trên Báo giá & Hợp đồng)</span>
                      </label>
                      {companyForm.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setCompanyForm((prev) => ({ ...prev, logoUrl: '' }))}
                          className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center space-x-1 font-semibold"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Gỡ logo</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                      {/* Logo Preview Box */}
                      <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-slate-300 bg-white min-h-[100px]">
                        {companyForm.logoUrl ? (
                          <div className="flex flex-col items-center space-y-1.5">
                            <img
                              src={companyForm.logoUrl}
                              alt="Company Logo Preview"
                              className="max-h-16 max-w-[160px] object-contain"
                            />
                            <span className="text-[10px] font-semibold text-emerald-600 flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>Logo hợp lệ</span>
                            </span>
                          </div>
                        ) : (
                          <div className="text-center text-slate-400 space-y-1">
                            <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                            <span className="text-[11px] block font-medium">Chưa có ảnh Logo</span>
                            <span className="text-[9px] text-slate-400 block">Sử dụng huy hiệu chữ mặc định</span>
                          </div>
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="md:col-span-8 space-y-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleLogoFileUpload}
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-blue-600" />
                            <span>Tải ảnh từ máy tính (PNG, JPG, SVG)</span>
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Hoặc dán trực tiếp đường link ảnh Logo URL:
                        </div>
                        <input
                          type="url"
                          value={companyForm.logoUrl}
                          onChange={(e) => setCompanyForm({ ...companyForm, logoUrl: e.target.value })}
                          placeholder="https://example.com/logo.png"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* COMPANY DETAILS INPUTS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tên công ty (Hiển thị tiêu đề Báo giá & Hợp đồng) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={companyForm.name}
                          onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                          placeholder="CÔNG TY CỔ PHẦN CÔNG NGHỆ & THIẾT BỊ SALESFLOW"
                          className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mã số thuế (MST) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={companyForm.taxCode}
                          onChange={(e) => setCompanyForm({ ...companyForm, taxCode: e.target.value })}
                          placeholder="0318999888"
                          className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold text-blue-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hotline / Số điện thoại công ty <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={companyForm.phone}
                          onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                          placeholder="1900 6868 - (028) 3822 9999"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Địa chỉ trụ sở chính / Showroom <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={companyForm.address}
                          onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                          placeholder="Tòa nhà Bitexco Financial Tower, Số 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email liên hệ công ty
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          value={companyForm.email}
                          onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                          placeholder="contact@salesflow.vn"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Website công ty
                      </label>
                      <div className="relative">
                        <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={companyForm.website}
                          onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                          placeholder="www.salesflow.vn"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BANK ACCOUNT & SIGNATURE SECTION */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Thông tin Tài khoản Ngân hàng & Người đại diện ký hợp đồng</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Tên ngân hàng & Chi nhánh
                        </label>
                        <input
                          type="text"
                          value={companyForm.bankName || ''}
                          onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })}
                          placeholder="Ngân hàng TMCP Ngoại Thương VN (Vietcombank) - CN TP.HCM"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Số tài khoản ngân hàng
                        </label>
                        <input
                          type="text"
                          value={companyForm.bankAccountNumber || ''}
                          onChange={(e) => setCompanyForm({ ...companyForm, bankAccountNumber: e.target.value })}
                          placeholder="0071000999888"
                          className="w-full px-3 py-1.5 text-xs font-mono font-bold text-slate-800 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Chủ tài khoản (Viết hoa không dấu)
                        </label>
                        <input
                          type="text"
                          value={companyForm.bankAccountHolder || ''}
                          onChange={(e) => setCompanyForm({ ...companyForm, bankAccountHolder: e.target.value })}
                          placeholder="CONG TY CP CONG NGHE SALESFLOW"
                          className="w-full px-3 py-1.5 text-xs font-semibold uppercase border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Người đại diện pháp luật (Giám đốc)
                        </label>
                        <input
                          type="text"
                          value={companyForm.directorName || ''}
                          onChange={(e) => setCompanyForm({ ...companyForm, directorName: e.target.value })}
                          placeholder="Bùi Viết Hoàng"
                          className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Chức vụ người đại diện
                        </label>
                        <input
                          type="text"
                          value={companyForm.directorTitle || ''}
                          onChange={(e) => setCompanyForm({ ...companyForm, directorTitle: e.target.value })}
                          placeholder="Tổng Giám Đốc"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button for Tier 1 */}
                  <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCompany}
                      className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                    >
                      {isSavingCompany ? (
                        <span>Đang đồng bộ...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Lưu & Đồng bộ Thương hiệu cho Toàn Hệ Thống</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* READ ONLY VIEW FOR TIER 2 (SALES C2) */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                    {/* Header with Logo & Name */}
                    <div className="flex items-start space-x-3.5 pb-3 border-b border-slate-200">
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                        {companyInfo.logoUrl ? (
                          <img
                            src={companyInfo.logoUrl}
                            alt={companyInfo.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-900 text-amber-400 font-black rounded flex items-center justify-center text-sm">
                            SF
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{companyInfo.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Chính Thức
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 flex items-center">
                          <MapPin className="w-3 h-3 text-slate-400 mr-1 shrink-0" />
                          <span>{companyInfo.address}</span>
                        </p>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                          <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            MST: {companyInfo.taxCode}
                          </span>
                          <span>Hotline: <strong className="text-slate-800">{companyInfo.phone}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Specs Grid with Copy Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Mã số thuế:</span>
                          <span className="font-mono font-bold text-slate-900">{companyInfo.taxCode}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(companyInfo.taxCode, 'mst')}
                          className="p-1 text-slate-400 hover:text-blue-600 transition"
                          title="Sao chép MST"
                        >
                          {copiedField === 'mst' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Hotline công ty:</span>
                          <span className="font-bold text-slate-900">{companyInfo.phone}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(companyInfo.phone, 'phone')}
                          className="p-1 text-slate-400 hover:text-blue-600 transition"
                          title="Sao chép Hotline"
                        >
                          {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Email công ty:</span>
                          <span className="font-medium text-slate-900">{companyInfo.email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(companyInfo.email, 'email')}
                          className="p-1 text-slate-400 hover:text-blue-600 transition"
                          title="Sao chép Email"
                        >
                          {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Website:</span>
                          <span className="font-medium text-blue-700">{companyInfo.website}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(companyInfo.website, 'web')}
                          className="p-1 text-slate-400 hover:text-blue-600 transition"
                          title="Sao chép Website"
                        >
                          {copiedField === 'web' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Bank Info Box */}
                    {companyInfo.bankAccountNumber && (
                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center space-x-1">
                          <CreditCard className="w-3 h-3 text-emerald-600" />
                          <span>Tài khoản ngân hàng nhận thanh toán của công ty:</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {companyInfo.bankName}
                            </div>
                            <div className="font-mono font-extrabold text-blue-900 text-sm">
                              {companyInfo.bankAccountNumber}{' '}
                              <span className="text-xs font-normal text-slate-600">({companyInfo.bankAccountHolder})</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(`${companyInfo.bankAccountNumber} - ${companyInfo.bankName} - ${companyInfo.bankAccountHolder}`, 'bank')}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer"
                          >
                            {copiedField === 'bank' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'bank' ? 'Đã chép' : 'Sao chép STK'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
                    >
                      Đã hiểu & Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
