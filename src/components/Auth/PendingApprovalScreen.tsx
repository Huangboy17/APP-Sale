import React from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

export const PendingApprovalScreen: React.FC = () => {
  const { currentUser, logout } = useApp();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700 text-center">
        <div className="flex justify-center mb-6 relative">
          <ShieldAlert className="h-16 w-16 text-amber-500/20" />
          <Clock className="h-8 w-8 text-amber-400 absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/4" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">Tài khoản đang chờ phê duyệt</h2>
        
        <p className="text-slate-300 mb-8 leading-relaxed">
          Tài khoản của bạn đã được đăng ký thành công. Vui lòng chờ Super Admin xét duyệt kích hoạt trước khi sử dụng hệ thống.
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
              <p className="text-white font-medium">Giám Đốc / Doanh Nghiệp (Level 1)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Trạng thái:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Đang chờ duyệt
              </span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại trang
          </button>
          
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium border border-slate-600"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};
