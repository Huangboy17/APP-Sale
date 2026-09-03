import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Briefcase,
  UserCheck,
  Plus,
  FileSpreadsheet,
  RotateCcw,
  ChevronDown,
  RefreshCw,
  LogOut,
  Trash2,
  KeyRound,
  Mail,
  Building,
  Building2,
  Phone,
  Shield,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { ChangePasswordModal } from './Modals/ChangePasswordModal';
import { UserProfileCompanyModal } from './Modals/UserProfileCompanyModal';

export const Header: React.FC = () => {
  const {
    currentUser,
    companyInfo,
    logout,
    setIsCreateQuoteModalOpen,
    setSelectedQuoteForModal,
    setSelectedCustomerIdForQuote,
    resetDataToDefault,
    setIsClearDataModalOpen,
    setActiveTab,
    cloudSyncStatus,
    syncAllToCloudNow,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileModalInitialTab,
    setProfileModalInitialTab,
  } = useApp();

  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isTier1OrAdmin = currentUser.role === 'super_admin' || currentUser.role === 'manager_c1';

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'super_admin':
        return {
          label: 'Super Admin (L0)',
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: ShieldCheck,
        };
      case 'manager_c1':
        return {
          label: 'Director (L1)',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: Briefcase,
        };
      case 'sales_c2':
        return {
          label: 'Sales (L2)',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: UserCheck,
        };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  const handleOpenNewQuote = () => {
    setSelectedQuoteForModal(null);
    setSelectedCustomerIdForQuote(null);
    setIsCreateQuoteModalOpen(true);
  };

  const handleOpenProfileModal = (tab: 'profile' | 'company') => {
    setProfileModalInitialTab(tab);
    setIsProfileModalOpen(true);
    setIsProfileOpen(false);
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
        {/* Left Title & Google Cloud Firestore Badge */}
        <div className="flex items-center space-x-3">
          <h2 className="font-bold text-sm sm:text-base text-slate-800 tracking-tight flex items-center space-x-2">
            <span>{currentUser.role === 'super_admin' ? 'SUPER ADMIN • Quản Trị Nền Tảng' : 'Hệ thống quản lý kinh doanh & Báo giá'}</span>
          </h2>

          {/* Google Cloud Firestore Status Indicator */}
          <div
            onClick={() => syncAllToCloudNow()}
            className={`hidden md:inline-flex items-center space-x-1.5 border text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition shadow-2xs ${
              cloudSyncStatus === 'quota-exceeded'
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : cloudSyncStatus === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
            title={
              cloudSyncStatus === 'quota-exceeded'
                ? 'Hạn ngạch Google Cloud Free Tier hôm nay đã đạt giới hạn. Toàn bộ dữ liệu được lưu trữ an toàn tức thì vào bộ nhớ trình duyệt (LocalStorage).'
                : 'Google Cloud Firestore đang hoạt động. Bấm để đồng bộ dữ liệu.'
            }
          >
            {cloudSyncStatus === 'syncing' ? (
              <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
            ) : cloudSyncStatus === 'quota-exceeded' ? (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            ) : cloudSyncStatus === 'error' ? (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
            <span className="flex items-center space-x-1">
              <span>Google Cloud</span>
              <span className={`font-normal ${cloudSyncStatus === 'quota-exceeded' ? 'text-amber-700' : 'text-emerald-600'}`}>
                {cloudSyncStatus === 'quota-exceeded' ? '| Lưu Cục Bộ An Toàn' : '| Firestore Live'}
              </span>
            </span>
          </div>
        </div>

        {/* Right Quick Actions & Profile */}
        <div className="flex items-center space-x-2">
          {currentUser.role !== 'super_admin' && (
            <>
              {/* Quick Company Brand Button for Level 1 */}
              {currentUser.role === 'manager_c1' && (
                <button
                  onClick={() => handleOpenProfileModal('company')}
                  className="hidden lg:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                  title="Thông tin công ty & Nhận diện thương hiệu (Tên, MST, Địa chỉ, Logo cấp cho Cấp 2 và Báo giá/Hợp đồng)"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Cấu hình Thương hiệu Công ty</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-200 text-amber-900 font-bold">
                    Cấp 1
                  </span>
                </button>
              )}

              {/* Quick Import Data Shortcut (For Level 1) */}
              {currentUser.role === 'manager_c1' && (
                <button
                  onClick={() => setActiveTab('products')}
                  className="hidden md:inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span>Import Data Giá</span>
                </button>
              )}

              {/* Quick Clear Data Button */}
              {currentUser.role === 'manager_c1' && (
                <button
                  onClick={() => setIsClearDataModalOpen(true)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition shadow-2xs cursor-pointer"
                  title="Xoá toàn bộ dữ liệu: Khách hàng, Data giá, Báo giá, Tồn kho..."
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Xoá Dữ Liệu</span>
                </button>
              )}

              {/* Quick Create Quote Button */}
              <button
                id="header-create-quote-btn"
                onClick={handleOpenNewQuote}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tạo Báo Giá</span>
              </button>

              <div className="h-5 w-px bg-slate-200 mx-0.5"></div>
            </>
          )}

          {/* Authenticated User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition text-left"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600/15 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[130px]" title={currentUser.name}>
                    {currentUser.name}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-84 bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* User details header */}
                  <div className="flex items-start space-x-3 pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-blue-600/15 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        currentUser.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</h4>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${roleInfo.color} flex items-center space-x-1`}>
                          <RoleIcon className="w-3 h-3" />
                          <span>{roleInfo.label}</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-1 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{currentUser.email}</span>
                      </div>
                      {currentUser.phone && (
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{currentUser.phone}</span>
                        </div>
                      )}
                      {currentUser.department && (
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{currentUser.department}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Profile & Company Management Actions */}
                  <div className="py-2 border-b border-slate-100 space-y-1">
                    <button
                      type="button"
                      onClick={() => handleOpenProfileModal('profile')}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition font-semibold cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                        <span>Hồ sơ & Thông tin cá nhân</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Xem/Sửa</span>
                    </button>

                    {currentUser.role !== 'super_admin' && (
                      <button
                        type="button"
                        onClick={() => handleOpenProfileModal('company')}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition font-semibold cursor-pointer ${
                          currentUser.role === 'manager_c1'
                            ? 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-950 border border-amber-200/60'
                            : 'text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Building2 className={`w-4 h-4 ${currentUser.role === 'manager_c1' ? 'text-amber-600' : 'text-slate-500'}`} />
                          <span>Thông tin Công ty & Logo</span>
                        </div>
                        {currentUser.role === 'manager_c1' ? (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                            Cấp 1 Cài Đặt
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Xem</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* System Actions */}
                  <div className="space-y-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsChangePassOpen(true);
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-100 transition font-medium cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>Đổi mật khẩu tài khoản</span>
                    </button>

                    {currentUser.role === 'manager_c1' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsClearDataModalOpen(true);
                        }}
                        className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs text-rose-700 hover:bg-rose-50 transition font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Quản lý xoá dữ liệu doanh nghiệp...</span>
                      </button>
                    )}
                  </div>

                  {/* Logout Button */}
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất khỏi hệ thống</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* User Profile & Company Identity Modal */}
      <UserProfileCompanyModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileModalInitialTab}
        onOpenChangePassword={() => {
          setIsProfileModalOpen(false);
          setIsChangePassOpen(true);
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
      />
    </>
  );
};

