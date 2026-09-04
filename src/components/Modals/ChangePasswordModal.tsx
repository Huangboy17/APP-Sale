import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { auth, updatePassword } from '../../lib/firebase';
import { Lock, KeyRound, Eye, EyeOff, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If user has existing password, check it
    const expectedPass = (currentUser.password || '').trim();
    const isSuperAdmin = currentUser.role === 'super_admin';
    
    // Check if input matches stored password, or fallback defaults
    const isMatch =
      (expectedPass && currentPassword.trim() === expectedPass) ||
      (isSuperAdmin && (currentPassword.trim() === 'admin' || currentPassword.trim() === '123456')) ||
      (!expectedPass && (currentPassword.trim() === '123456' || currentPassword.trim() === 'admin'));

    if (!isMatch) {
      setError('Mật khẩu hiện tại không chính xác. (Mặc định: ' + (isSuperAdmin ? '"admin"' : '"123456"') + ')');
      return;
    }

    if (newPassword.trim().length < 4) {
      setError('Mật khẩu mới phải có tối thiểu 4 ký tự.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Update in State, LocalStorage & Supabase PostgreSQL
      updateUser({
        ...currentUser,
        password: newPassword.trim(),
      });

      // 2. Sync to Firebase Auth if logged in
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, newPassword.trim());
          console.log('[Firebase Auth] Password updated successfully in Firebase Auth');
        } catch (fbErr: any) {
          console.warn('[Firebase Auth] Could not update Firebase Auth password directly:', fbErr?.code || fbErr);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsSubmitting(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(`Lỗi cập nhật: ${err?.message || 'Không thể lưu mật khẩu mới'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">Đổi Mật Khẩu Cá Nhân</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/10 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-800">{currentUser.name}</div>
              <div className="text-slate-500">{currentUser.email}</div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Đổi mật khẩu thành công!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu hiện tại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                required
                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 4 ký tự"
                required
                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={success}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              Cập Nhật Mật Khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
