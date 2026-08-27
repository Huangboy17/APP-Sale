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
  Phone,
  Shield,
} from 'lucide-react';
import { ChangePasswordModal } from './Modals/ChangePasswordModal';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    setIsCreateQuoteModalOpen,
    setSelectedQuoteForModal,
    setSelectedCustomerIdForQuote,
    resetDataToDefault,
    setIsClearDataModalOpen,
    setActiveTab,
    cloudSyncStatus,
    syncAllToCloudNow,
  } = useApp();

  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
        {/* Left Title & Google Cloud Firestore Badge */}
        <div className="flex items-center space-x-3">
          <h2 className="font-bold text-sm sm:text-base text-slate-800 tracking-tight">
            Hệ thống quản lý kinh doanh & Báo giá
          </h2>

          {/* Google Cloud Firestore Status Indicator */}
          <div
            onClick={() => syncAllToCloudNow()}
            className="hidden md:inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:bg-emerald-100 transition shadow-2xs"
            title="Google Cloud Firestore đang hoạt động theo thời gian thực. Bấm để ép đồng bộ lại."
          >
            {cloudSyncStatus === 'syncing' ? (
              <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
            <span className="flex items-center space-x-1">
              <span>Google Cloud</span>
              <span className="font-normal text-emerald-600">| Firestore Live</span>
            </span>
          </div>
        </div>

        {/* Right Quick Actions & Profile */}
        <div className="flex items-center space-x-2.5">
          {/* Quick Import Data Shortcut (For Admin & C1) */}
          {currentUser.role !== 'sales_c2' && (
            <button
              onClick={() => setActiveTab('products')}
              className="hidden md:inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-medium transition-colors border border-slate-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Data Giá & Kho</span>
            </button>
          )}

          {/* Quick Clear Data Button */}
          <button
            onClick={() => setIsClearDataModalOpen(true)}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition shadow-2xs cursor-pointer"
            title="Xoá toàn bộ dữ liệu: Khách hàng, Data giá, Báo giá, Tồn kho..."
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Xoá Dữ Liệu</span>
          </button>

          {/* Quick Create Quote Button */}
          <button
            id="header-create-quote-btn"
            onClick={handleOpenNewQuote}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tạo Báo Giá Mới</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* Authenticated User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition text-left"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600/15 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser.name.charAt(0)}
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
                <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* User details header */}
                  <div className="flex items-start space-x-3 pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-blue-600/15 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                      {currentUser.name.charAt(0)}
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

                  {/* Security notice */}
                  <div className="my-2.5 px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 flex items-center space-x-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Phiên làm việc độc lập & bảo mật. Để chuyển tài khoản, vui lòng đăng xuất.</span>
                  </div>

                  {/* Actions */}
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
                      <span>Đổi mật khẩu cá nhân</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsClearDataModalOpen(true);
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs text-rose-700 hover:bg-rose-50 transition font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Quản lý xoá dữ liệu...</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        resetDataToDefault();
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition font-medium cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Khôi phục dữ liệu mẫu ban đầu</span>
                    </button>
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

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
      />
    </>
  );
};
