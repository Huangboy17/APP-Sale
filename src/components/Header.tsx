import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Briefcase,
  UserCheck,
  Plus,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Bell,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    users,
    setIsCreateQuoteModalOpen,
    setSelectedQuoteForModal,
    setSelectedCustomerIdForQuote,
    resetDataToDefault,
    setActiveTab,
  } = useApp();

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

  const handleOpenNewQuote = () => {
    setSelectedQuoteForModal(null);
    setSelectedCustomerIdForQuote(null);
    setIsCreateQuoteModalOpen(true);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
      {/* Left Title & System Badge */}
      <div className="flex items-center space-x-3">
        <h2 className="font-bold text-sm sm:text-base text-slate-800 tracking-tight">
          Hệ thống quản lý kinh doanh & Báo giá
        </h2>
        <div className="hidden sm:inline-flex items-center space-x-1.5 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>Live System</span>
        </div>
      </div>

      {/* Right Quick Actions & Role Switcher */}
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

        {/* Switch User Simulation Dropdown */}
        <div className="relative group">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded border border-slate-200 hover:border-slate-300 bg-slate-50 cursor-pointer transition">
            <div className="text-left">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-800">{currentUser.name}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          {/* Dropdown Menu to switch user */}
          <div className="absolute right-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-2 hidden group-hover:block hover:block z-50">
            <div className="px-2 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Chuyển đổi tài khoản mô phỏng:
            </div>
            <div className="space-y-1 mt-1 max-h-60 overflow-y-auto">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setCurrentUser(u)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition flex items-center justify-between ${
                    currentUser.id === u.id
                      ? 'bg-blue-50 text-blue-900 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-900 flex items-center space-x-1">
                      <span>{u.name}</span>
                      {u.status === 'pending_approval' && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded">Chờ duyệt</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{u.department}</div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {u.role === 'super_admin' ? 'Super Admin' : u.role === 'manager_c1' ? 'Cấp 1' : 'Cấp 2'}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={resetDataToDefault}
                className="text-[10px] text-slate-500 hover:text-rose-600 flex items-center space-x-1 px-1.5 py-0.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Khôi phục mẫu</span>
              </button>
              <span className="text-[9px] text-slate-400 font-mono">v2.4.0</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
