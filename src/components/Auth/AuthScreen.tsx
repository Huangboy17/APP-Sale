import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  Briefcase,
  UserCheck,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Building,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  Cloud,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const {
    login,
    register,
    resetPassword,
    quickDemoLogin,
    users,
    authScreenMode,
    setAuthScreenMode,
  } = useApp();

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form State (Always Cấp 1 - Giám Đốc / Doanh Nghiệp)
  const [regName, setRegName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regPosition, setRegPosition] = useState('Giám Đốc / Chủ Doanh Nghiệp');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Feedback notifications
  const [alert, setAlert] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!loginEmail.trim()) {
      setAlert({ type: 'error', message: 'Vui lòng nhập địa chỉ Email hoặc Tên tài khoản.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(loginEmail, loginPassword);
      setIsLoading(false);
      if (!res.success) {
        setAlert({ type: 'error', message: res.message });
      }
    }, 250);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!regName.trim() || !regEmail.trim()) {
      setAlert({ type: 'error', message: 'Vui lòng điền đầy đủ Họ tên và Email công việc.' });
      return;
    }

    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setAlert({ type: 'error', message: 'Định dạng Email không hợp lệ. Ví dụ: giamdoc@company.vn' });
      return;
    }

    if (regPassword && regPassword.length < 3) {
      setAlert({ type: 'error', message: 'Mật khẩu cần tối thiểu 3 ký tự.' });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setAlert({ type: 'error', message: 'Mật khẩu xác nhận không khớp. Vui lòng nhập lại.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Đăng ký tài khoản công khai luôn luôn là Cấp 1 (Chờ Super Admin phê duyệt)
      const res = register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim() || '0901234567',
        password: regPassword || '123456',
        department: regCompany.trim() || 'Công Ty Đối Tác / Ban Giám Đốc C1',
        position: regPosition.trim() || 'Giám Đốc / Chủ Doanh Nghiệp',
        role: 'manager_c1',
      });

      setIsLoading(false);
      if (!res.success) {
        setAlert({ type: 'error', message: res.message });
      } else {
        setAlert({
          type: 'success',
          message: 'Đăng ký tài khoản Doanh Nghiệp (Cấp 1) thành công! Hồ sơ của bạn đã được chuyển tới Super Admin để xét duyệt kích hoạt.',
        });
      }
    }, 300);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!forgotEmail.trim()) {
      setAlert({ type: 'error', message: 'Vui lòng nhập Email tài khoản cần đặt lại mật khẩu.' });
      return;
    }

    if (!newPassword.trim()) {
      setAlert({ type: 'error', message: 'Vui lòng nhập mật khẩu mới.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setAlert({ type: 'error', message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = resetPassword(forgotEmail, newPassword);
      setIsLoading(false);
      if (!res.success) {
        setAlert({ type: 'error', message: res.message });
      } else {
        setAlert({ type: 'success', message: res.message });
        setLoginEmail(forgotEmail);
        setLoginPassword(newPassword);
        setTimeout(() => {
          setAuthScreenMode('login');
        }, 1500);
      }
    }, 300);
  };

  const handleFillCredentials = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setAlert({
      type: 'info',
      message: `Đã điền thông tin tài khoản: ${email}. Nhấn "Đăng Nhập Vào Hệ Thống" bên dưới để đăng nhập.`,
    });
    setAuthScreenMode('login');
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 px-6 sm:px-10 flex items-center justify-between z-10 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/25">
            SF
          </div>
          <div>
            <div className="flex items-center space-x-1.5 font-bold tracking-tight text-white text-base">
              <span>SALESFLOW</span>
              <span className="text-blue-400 font-extrabold">PRO</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-400/30">
                v2.4 Enterprise
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Hệ thống Quản lý Bán hàng & Báo giá 3 Cấp
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Google Cloud Firestore Live</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Info Column (Brand story, 3-Tier explanation, Quick Login) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quy trình Kinh doanh Khép kín</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Cổng Đăng Nhập <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Phân Quyền 3 Cấp
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Đồng bộ dữ liệu thời gian thực giữa Super Admin, Trưởng phòng/Giám đốc Cấp 1 và Nhân viên kinh doanh Cấp 2.
              </p>
            </div>

            {/* 3 Tier Role Highlights */}
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start space-x-3 hover:border-purple-500/40 transition">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Super Admin (Cấp 0)</span>
                    <span className="text-[10px] text-purple-400 font-mono">L0 System</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Quản trị hệ thống, phê duyệt C1, kiểm soát Data Giá & Danh mục kho. Bảo mật danh sách khách hàng C1/C2.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start space-x-3 hover:border-blue-500/40 transition">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Trưởng Phòng / Giám Đốc (Cấp 1)</span>
                    <span className="text-[10px] text-blue-400 font-mono">L1 Director</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Đăng ký tài khoản doanh nghiệp (chờ Super Admin duyệt). Trực tiếp tạo & cấp tài khoản cho nhân viên C2, quản lý toàn bộ khách hàng & doanh số phòng.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start space-x-3 hover:border-emerald-500/40 transition">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Sales Executive (Cấp 2)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">L2 Sales</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Do Giám đốc Cấp 1 tạo và cấp quyền (không cần tự đăng ký). Lập báo giá nhiều phiên bản, kiểm tra giá DP sàn, chốt HĐ tự động tách bảng Giữ/Đặt hàng.
                  </p>
                </div>
              </div>
            </div>

            {/* Account Suggestions Guide */}
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50">
              <div className="text-xs font-bold text-blue-300 flex items-center justify-between mb-1">
                <span>🔑 Tài khoản mẫu (Bấm để điền thông tin đăng nhập):</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Hệ thống yêu cầu đăng nhập độc lập cho từng tài khoản với mật khẩu riêng biệt.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFillCredentials('buiviethoangktxd@gmail.com', 'admin')}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-900/70 border border-purple-700/60 text-purple-200 text-xs font-semibold flex items-center justify-between transition cursor-pointer text-left"
                  title="Điền tài khoản Super Admin (Mật khẩu: admin)"
                >
                  <div className="truncate">
                    <div className="font-bold text-[11px]">Bùi Viết Hoàng</div>
                    <div className="text-[9px] text-purple-300">Super Admin (L0) • pass: admin</div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-purple-400 shrink-0 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={() => handleFillCredentials('hung.nguyen@salesflow.vn', '123456')}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-900/40 hover:bg-blue-900/70 border border-blue-700/60 text-blue-200 text-xs font-semibold flex items-center justify-between transition cursor-pointer text-left"
                  title="Điền tài khoản Giám Đốc C1 (Mật khẩu: 123456)"
                >
                  <div className="truncate">
                    <div className="font-bold text-[11px]">Nguyễn Văn Hùng</div>
                    <div className="text-[9px] text-blue-300">Giám Đốc (C1) • pass: 123456</div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-blue-400 shrink-0 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={() => handleFillCredentials('toan.tran@salesflow.vn', '123456')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-700/60 text-emerald-200 text-xs font-semibold flex items-center justify-between transition cursor-pointer text-left"
                  title="Điền tài khoản Sales C2 (Mật khẩu: 123456)"
                >
                  <div className="truncate">
                    <div className="font-bold text-[11px]">Trần Đức Toàn</div>
                    <div className="text-[9px] text-emerald-300">Sales Dự Án (C2) • pass: 123456</div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={() => handleFillCredentials('bao.dang@salesflow.vn', '123456')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-900/70 border border-amber-700/60 text-amber-200 text-xs font-semibold flex items-center justify-between transition cursor-pointer text-left"
                  title="Điền tài khoản Sales C2 (Mật khẩu: 123456)"
                >
                  <div className="truncate">
                    <div className="font-bold text-[11px]">Đặng Quốc Bảo</div>
                    <div className="text-[9px] text-amber-300">Sales Bán Lẻ (C2) • pass: 123456</div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-amber-400 shrink-0 ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Card: Interactive Form Container */}
          <div className="lg:col-span-7">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
              
              {/* Tab Navigation Header */}
              <div className="flex border-b border-slate-700/80 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAlert(null);
                    setAuthScreenMode('login');
                  }}
                  className={`pb-3 px-4 font-bold text-sm sm:text-base border-b-2 transition flex items-center space-x-2 ${
                    authScreenMode === 'login'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Đăng Nhập</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAlert(null);
                    setAuthScreenMode('register');
                  }}
                  className={`pb-3 px-4 font-bold text-sm sm:text-base border-b-2 transition flex items-center space-x-2 ${
                    authScreenMode === 'register'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Đăng Ký Cấp 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAlert(null);
                    setAuthScreenMode('forgot_password');
                  }}
                  className={`pb-3 px-4 font-bold text-sm sm:text-base border-b-2 transition flex items-center space-x-2 ${
                    authScreenMode === 'forgot_password'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Quên Mật Khẩu</span>
                </button>
              </div>

              {/* Alert Feedback Banner */}
              {alert && (
                <div
                  className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 transition-all ${
                    alert.type === 'error'
                      ? 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                      : alert.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
                      : 'bg-blue-950/60 border-blue-800/80 text-blue-200'
                  }`}
                >
                  {alert.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : alert.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  )}
                  <p className="leading-relaxed font-medium">{alert.message}</p>
                </div>
              )}

              {/* MODE 1: LOGIN FORM */}
              {authScreenMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email đăng nhập / Tài khoản <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="buiviethoangktxd@gmail.com hoặc toan.tran@salesflow.vn"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Mật khẩu <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAlert(null);
                          setForgotEmail(loginEmail);
                          setAuthScreenMode('forgot_password');
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition font-medium cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Nhập mật khẩu tài khoản (vd: 123456 hoặc admin)"
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                      />
                      <span>Ghi nhớ phiên đăng nhập</span>
                    </label>
                    <span className="text-[11px] text-slate-500">Mật khẩu mẫu: 123 hoặc admin</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Đăng Nhập Vào Hệ Thống</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2 text-xs text-slate-400">
                    Chưa có tài khoản nhân viên?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAlert(null);
                        setAuthScreenMode('register');
                      }}
                      className="text-blue-400 hover:underline font-bold"
                    >
                      Đăng ký tài khoản mới ngay
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 2: REGISTER FORM (STRICTLY C1 & PENDING SUPER ADMIN APPROVAL) */}
              {authScreenMode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {/* Notice Banner */}
                  <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/60 text-xs space-y-1.5 text-slate-300">
                    <div className="flex items-center space-x-2 font-bold text-blue-300">
                      <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Quy định Đăng ký Tài khoản Doanh nghiệp:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 pl-1">
                      <li>Tài khoản đăng ký mới sẽ <strong className="text-white">luôn là Cấp 1 (Giám Đốc / Chủ Doanh Nghiệp)</strong> và sẽ được Super Admin xem xét phê duyệt kích hoạt.</li>
                      <li>Tài khoản <strong className="text-emerald-300">Nhân viên Sales (Cấp 2)</strong> không cần đăng ký tại đây mà do tài khoản Cấp 1 trực tiếp tạo và quản lý trong hệ thống.</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Họ và tên Giám đốc / Đại diện <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn Hùng"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Số điện thoại liên hệ <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Tên Doanh nghiệp / Công ty C1 <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={regCompany}
                          onChange={(e) => setRegCompany(e.target.value)}
                          placeholder="Công ty CP Thiết Bị & Thương Mại..."
                          required
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Chức vụ / Vị trí
                      </label>
                      <div className="relative">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={regPosition}
                          onChange={(e) => setRegPosition(e.target.value)}
                          placeholder="Giám Đốc / Chủ Doanh Nghiệp"
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email công việc (Tài khoản đăng nhập) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="giamdoc@congty.vn"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Mật khẩu <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Tối thiểu 3 ký tự"
                          required
                          className="w-full pl-9 pr-8 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nhập lại mật khẩu <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Xác nhận lại mật khẩu"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Briefcase className="w-4 h-4" />
                        <span>Gửi Đăng Ký Tài Khoản Cấp 1 (Chờ Super Admin Duyệt)</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1 text-xs text-slate-400">
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAlert(null);
                        setAuthScreenMode('login');
                      }}
                      className="text-blue-400 hover:underline font-bold cursor-pointer"
                    >
                      Đăng nhập ngay
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 3: FORGOT PASSWORD FORM */}
              {authScreenMode === 'forgot_password' && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Nhập email tài khoản của bạn để thiết lập mật khẩu mới ngay lập tức trên hệ thống Google Cloud Firestore.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email đã đăng ký <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="buiviethoangktxd@gmail.com hoặc toan.tran@salesflow.vn"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Mật khẩu mới <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mật khẩu mới"
                          required
                          className="w-full pl-9 pr-8 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Xác nhận mật khẩu mới <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Đặt Lại Mật Khẩu & Chuyển Về Đăng Nhập</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1 text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        setAlert(null);
                        setAuthScreenMode('login');
                      }}
                      className="text-blue-400 hover:underline font-bold"
                    >
                      ← Quay lại màn hình Đăng Nhập
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Info */}
      <footer className="h-12 border-t border-slate-800/80 px-6 sm:px-10 flex items-center justify-between text-xs text-slate-400 z-10 bg-slate-900/40">
        <div className="flex items-center space-x-4 text-[11px]">
          <span>© 2026 SalesFlow CRM Systems</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Bảo mật đa cấp Zero-Trust</span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center space-x-2">
          <span>Tài khoản hiện có: {users.length}</span>
        </div>
      </footer>
    </div>
  );
};
