import React from 'react';
import { useApp } from '../../context/AppContext';
import { Ban, ShieldAlert, LogOut } from 'lucide-react';

export const BlockedScreen: React.FC = () => {
  const { currentUser, logout } = useApp();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <ShieldAlert className="h-16 w-16 text-red-500/20" />
            <Ban className="h-8 w-8 text-red-500 absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/4 bg-slate-800 rounded-full" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">Tài khoản đã bị khóa</h2>
        
        <p className="text-slate-300 mb-8 leading-relaxed">
          Tài khoản của bạn hiện đang bị tạm khóa hoặc lưu trữ. Vui lòng liên hệ Quản trị viên (Super Admin) để được hỗ trợ.
        </p>
        
        {currentUser && (
          <div className="bg-slate-700/50 rounded-lg p-4 mb-8 text-left">
            <div className="mb-2">
              <span className="text-slate-400 text-sm">Họ và tên:</span>
              <p className="text-white font-medium">{currentUser.name}</p>
            </div>
            <div className="mb-2">
              <span className="text-slate-400 text-sm">Email:</span>
              <p className="text-white font-medium">{currentUser.email}</p>
            </div>
            <div className="mb-3">
              <span className="text-slate-400 text-sm">Vai trò:</span>
              <p className="text-white font-medium">{currentUser.role === 'level1' ? 'Giám Đốc / Doanh Nghiệp (Level 1)' : currentUser.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Trạng thái:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                Đã bị khóa
              </span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};
