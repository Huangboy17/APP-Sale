import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { formatVND, formatDate } from '../../utils/formatters';
import {
  Users,
  Shield,
  UserCheck,
  UserPlus,
  Building,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  ArrowRight,
  X,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  Check,
  Trash2,
  Search,
  AlertTriangle,
  Calendar,
  Layers,
  Download,
  Upload,
  Database,
  Share2,
} from 'lucide-react';

export const TeamManagement: React.FC = () => {
  const {
    currentUser,
    users,
    customers,
    contracts,
    quotations,
    addUser,
    updateUser,
    deleteUser,
    approveUser,
    resetPassword,
    exportAccountsData,
    importAccountsData,
  } = useApp();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState<UserRole>('sales_c2');
  const [newUserDepartment, setNewUserDepartment] = useState('Phòng Kinh Doanh 1');

  // Export / Import Accounts State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExportCopied, setIsExportCopied] = useState(false);

  // Super Admin Filter & Search state
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'pending' | 'blocked'>('all');

  // Reset Password Modal State for existing user
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [modalNewPassword, setModalNewPassword] = useState('123456');
  const [showModalNewPassword, setShowModalNewPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Success Created Notification with Copy credentials
  const [createdUserInfo, setCreatedUserInfo] = useState<{ name: string; email: string; pass: string; roleName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManagerC1 = currentUser.role === 'manager_c1';

  // Calculate statistics per Sales C2 (C1 only sees C2s they created or manage)
  const salesStaff = users.filter((u) => {
    if (u.role !== 'sales_c2') return false;
    if (isSuperAdmin) return true;
    if (isManagerC1) {
      return u.managerId === currentUser.id || u.createdBy === currentUser.id;
    }
    return false;
  });
  const managersC1 = users.filter((u) => u.role === 'manager_c1');

  // Super Admin filtered Level 1 accounts
  const filteredManagersC1 = useMemo(() => {
    return managersC1.filter((mgr) => {
      // Status filter
      if (adminStatusFilter === 'active' && mgr.status !== 'active') return false;
      if (adminStatusFilter === 'pending' && mgr.status !== 'pending_approval' && mgr.status !== 'pending') return false;
      if (adminStatusFilter === 'blocked' && mgr.status !== 'blocked' && mgr.status !== 'inactive' && mgr.status !== 'archived') return false;

      // Search term
      if (adminSearchTerm.trim()) {
        const query = adminSearchTerm.toLowerCase();
        const matchName = (mgr.name || '').toLowerCase().includes(query);
        const matchEmail = (mgr.email || '').toLowerCase().includes(query);
        const matchPhone = (mgr.phone || '').toLowerCase().includes(query);
        const matchDept = (mgr.department || '').toLowerCase().includes(query);
        return matchName || matchEmail || matchPhone || matchDept;
      }
      return true;
    });
  }, [managersC1, adminStatusFilter, adminSearchTerm]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert('Vui lòng nhập tên và email');
      return;
    }

    const assignedPass = newUserPassword.trim() || '123456';
    const assignedRole: UserRole = isSuperAdmin ? 'manager_c1' : 'sales_c2';

    const result = addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      phone: newUserPhone.trim() || '0901234567',
      password: assignedPass,
      role: assignedRole,
      department: newUserDepartment || (isSuperAdmin ? 'Doanh Nghiệp Mới' : (currentUser.department || 'Phòng Kinh Doanh')),
      organizationId: isSuperAdmin ? `org-${Date.now()}` : (currentUser.organizationId || ''),
      managerId: isManagerC1 ? currentUser.id : undefined,
      status: 'active',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?w=120&auto=format&fit=crop&q=80`,
    });

    // If addUser returned null, email was duplicate — don't close modal or reset form
    if (!result) return;

    setCreatedUserInfo({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      pass: assignedPass,
      roleName: isSuperAdmin ? 'Doanh Nghiệp / Giám Đốc (Level 1)' : 'Nhân Viên Kinh Doanh (Level 2)',
    });

    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserPassword('123456');
    setNewUserDepartment(isSuperAdmin ? 'Công Ty TNHH...' : 'Phòng Kinh Doanh 1');
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;

    if (!modalNewPassword.trim()) {
      alert('Vui lòng nhập mật khẩu mới');
      return;
    }

    const res = resetPassword(resetModalUser.email, modalNewPassword.trim());
    if (res.success) {
      setResetSuccessMessage(`Đã cập nhật mật khẩu mới cho ${resetModalUser.name} thành công!`);
      setTimeout(() => {
        setResetModalUser(null);
        setResetSuccessMessage(null);
      }, 1800);
    } else {
      alert(res.message);
    }
  };

  const copyCreatedCredentials = () => {
    if (!createdUserInfo) return;
    const text = `Tài khoản SalesFlow CRM của bạn:\n- Họ tên: ${createdUserInfo.name}\n- Email: ${createdUserInfo.email}\n- Mật khẩu: ${createdUserInfo.pass}\n- Vai trò: ${createdUserInfo.roleName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportAccountsJSON = () => {
    const dataStr = exportAccountsData();
    navigator.clipboard.writeText(dataStr);
    setIsExportCopied(true);
    setTimeout(() => setIsExportCopied(false), 2500);

    // Also download as a JSON file
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salesflow_accounts_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleProcessImport = async () => {
    if (!importJsonText.trim()) {
      setImportFeedback({ type: 'error', message: 'Vui lòng dán nội dung JSON tài khoản cần nhập.' });
      return;
    }
    const res = await importAccountsData(importJsonText);
    if (res.success) {
      setImportFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportJsonText('');
        setImportFeedback(null);
      }, 1500);
    } else {
      setImportFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* SECTION 1: SUPER ADMIN — QUẢN LÝ TÀI KHOẢN LEVEL 1 */}
      {/* ========================================================================= */}
      {isSuperAdmin ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span>Quản Lý Tài Khoản Doanh Nghiệp (Level 1)</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản trị nền tảng: Tạo mới, phê duyệt, khóa/mở khóa và quản lý các tài khoản Doanh nghiệp / Giám đốc Cấp 1.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleExportAccountsJSON}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Xuất file JSON sao lưu toàn bộ tài khoản và sao chép mã đồng bộ"
              >
                {isExportCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5 text-slate-600" />}
                <span>{isExportCopied ? 'Đã sao chép JSON!' : 'Xuất File / Mã Tài Khoản'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImportJsonText('');
                  setImportFeedback(null);
                  setIsImportModalOpen(true);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Nhập danh sách tài khoản từ file hoặc mã JSON"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Đồng Bộ / Nhập Tài Khoản</span>
              </button>

              <button
                onClick={() => {
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserPhone('');
                  setNewUserPassword('123456');
                  setNewUserDepartment('Công ty TNHH...');
                  setIsAddUserModalOpen(true);
                }}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tạo Tài Khoản Level 1 Mới</span>
              </button>
            </div>
          </div>

          {/* Success Notification Banner for Newly Created User */}
          {createdUserInfo && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-emerald-950 flex items-center space-x-2">
                    <span>Đã tạo tài khoản {createdUserInfo.roleName} thành công!</span>
                  </div>
                  <div className="text-emerald-800 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Họ tên: <strong>{createdUserInfo.name}</strong></span>
                    <span>Email: <strong>{createdUserInfo.email}</strong></span>
                    <span className="bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">
                      Mật khẩu: {createdUserInfo.pass}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Doanh nghiệp có thể dùng Email và Mật khẩu trên để đăng nhập trực tiếp vào hệ thống.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={copyCreatedCredentials}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép thông tin'}</span>
                </button>
                <button
                  onClick={() => setCreatedUserInfo(null)}
                  className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg cursor-pointer"
                  title="Đóng thông báo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Super Admin Level 1 Management Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Filter Bar */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={adminSearchTerm}
                    onChange={(e) => setAdminSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên, email, công ty, số điện thoại..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setAdminStatusFilter('all')}
                  className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                    adminStatusFilter === 'all'
                      ? 'bg-white text-purple-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({managersC1.length})
                </button>
                <button
                  onClick={() => setAdminStatusFilter('active')}
                  className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                    adminStatusFilter === 'active'
                      ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hoạt động ({managersC1.filter((u) => u.status === 'active').length})
                </button>
                <button
                  onClick={() => setAdminStatusFilter('pending')}
                  className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                    adminStatusFilter === 'pending'
                      ? 'bg-white text-amber-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chờ duyệt ({managersC1.filter((u) => u.status === 'pending_approval' || u.status === 'pending').length})
                </button>
                <button
                  onClick={() => setAdminStatusFilter('blocked')}
                  className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                    adminStatusFilter === 'blocked'
                      ? 'bg-white text-rose-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đang khóa ({managersC1.filter((u) => u.status === 'blocked' || u.status === 'inactive').length})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3.5 py-3 w-12 text-center whitespace-nowrap">STT</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Doanh Nghiệp / Giám Đốc (L1)</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Email & Số Điện Thoại</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Tên Doanh Nghiệp / Đơn Vị</th>
                    <th className="px-3.5 py-3 text-center whitespace-nowrap">Quy Mô Sales (L2)</th>
                    <th className="px-3.5 py-3 text-center whitespace-nowrap">Ngày Đăng Ký</th>
                    <th className="px-3.5 py-3 text-center whitespace-nowrap">Trạng Thái</th>
                    <th className="px-3.5 py-3 text-center whitespace-nowrap">Thao Tác Quản Trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredManagersC1.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <span>Không tìm thấy tài khoản Level 1 nào phù hợp điều kiện lọc.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredManagersC1.map((mgr, idx) => {
                      const l2Count = users.filter((u) => u.role === 'sales_c2' && (u.managerId === mgr.id || u.createdBy === mgr.id)).length;
                      const isPending = mgr.status === 'pending_approval' || mgr.status === 'pending';
                      const isBlocked = mgr.status === 'blocked' || mgr.status === 'inactive' || mgr.status === 'archived';
                      const isActive = mgr.status === 'active';

                      return (
                        <tr key={mgr.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3.5 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-3.5 py-3">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={mgr.avatar}
                                alt={mgr.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-slate-900">{mgr.name}</div>
                                <div className="text-[10px] text-purple-700 font-semibold">Tài khoản Cấp 1</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3.5 py-3">
                            <div className="font-medium text-slate-800">{mgr.email}</div>
                            <div className="text-[11px] text-slate-500">{mgr.phone || '—'}</div>
                          </td>
                          <td className="px-3.5 py-3">
                            <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{mgr.department || 'Doanh Nghiệp'}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full font-bold text-xs border border-blue-200">
                              {l2Count} nhân viên
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-center font-mono text-slate-500">
                            {mgr.createdAt ? formatDate(mgr.createdAt) : '—'}
                          </td>
                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            {isActive && (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px] border border-emerald-300">
                                🟢 Đang Hoạt Động
                              </span>
                            )}
                            {isPending && (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-[11px] border border-amber-300">
                                🟠 Chờ Phê Duyệt
                              </span>
                            )}
                            {isBlocked && (
                              <span className="px-2.5 py-1 bg-rose-100 text-rose-900 rounded-full font-bold text-[11px] border border-rose-300">
                                🔴 Đang Khóa
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* Action 1: Approve if pending */}
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => approveUser(mgr.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
                                  title="Phê duyệt tài khoản Level 1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Duyệt</span>
                                </button>
                              )}

                              {/* Action 2: Lock / Unlock */}
                              {isActive && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Khóa tài khoản Level 1 của "${mgr.name}" (${mgr.email})? Người dùng sẽ bị chặn đăng nhập.`)) {
                                      updateUser({ ...mgr, status: 'blocked' });
                                    }
                                  }}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                                  title="Khóa tạm thời tài khoản này"
                                >
                                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Khóa</span>
                                </button>
                              )}

                              {isBlocked && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Mở khóa tài khoản Level 1 cho "${mgr.name}" (${mgr.email})?`)) {
                                      updateUser({ ...mgr, status: 'active' });
                                    }
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                                  title="Kích hoạt lại tài khoản này"
                                >
                                  <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Mở Khóa</span>
                                </button>
                              )}

                              {/* Action 3: Reset Password */}
                              <button
                                type="button"
                                onClick={() => {
                                  setResetModalUser(mgr);
                                  setModalNewPassword('123456');
                                  setResetSuccessMessage(null);
                                }}
                                className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 transition cursor-pointer"
                                title="Cấp lại mật khẩu mới"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Action 4: Delete Level 1 */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Xác nhận XÓA tài khoản Level 1 "${mgr.name}" (${mgr.email})?\n\nCẢNH BÁO: Thao tác này sẽ gỡ bỏ tài khoản khỏi hệ thống và không thể hoàn tác.`)) {
                                    deleteUser(mgr.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-300 transition cursor-pointer"
                                title="Xóa tài khoản Level 1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* SECTION 2: LEVEL 1 (MANAGER C1) — QUẢN LÝ ĐỘI SALES & THEO DÕI HIỆU SUẤT */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Quản Lý Đội Ngũ Sales (Cấp 2) & Theo Dõi Tình Hình Kinh Doanh</span>
              </h1>
              <p className="text-xs text-slate-500">
                Giám đốc / Trưởng phòng tạo nhân viên Cấp 2, theo dõi số khách hàng, báo giá và doanh thu chốt hợp đồng của từng nhân viên.
              </p>
            </div>

            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition active:scale-95 self-start sm:self-auto cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Cấp 1 Tạo Nhân Viên C2 Mới</span>
            </button>
          </div>

          {/* Success Notification Banner for Newly Created User */}
          {createdUserInfo && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-emerald-950 flex items-center space-x-2">
                    <span>Đã tạo tài khoản {createdUserInfo.roleName} thành công!</span>
                  </div>
                  <div className="text-emerald-800 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Họ tên: <strong>{createdUserInfo.name}</strong></span>
                    <span>Email: <strong>{createdUserInfo.email}</strong></span>
                    <span className="bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">
                      Mật khẩu: {createdUserInfo.pass}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Nhân viên có thể dùng Email và Mật khẩu trên để đăng nhập trực tiếp vào hệ thống.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={copyCreatedCredentials}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép thông tin'}</span>
                </button>
                <button
                  onClick={() => setCreatedUserInfo(null)}
                  className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded cursor-pointer"
                  title="Đóng thông báo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* C1 MONITORING C2 PERFORMANCE */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bảng Theo Dõi Tình Hình Kinh Doanh Của Nhân Viên Cấp 2</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Trưởng phòng theo dõi số lượng khách hàng, số báo giá đã phát hành và doanh thu hợp đồng của từng sale.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3 py-2.5">Nhân Viên Sale (C2)</th>
                    <th className="px-3 py-2.5">Phòng Ban</th>
                    <th className="px-3 py-2.5 text-center">Khách Phụ Trách</th>
                    <th className="px-3 py-2.5 text-center">Số Báo Giá</th>
                    <th className="px-3 py-2.5 text-center">Hợp Đồng Ký</th>
                    <th className="px-3 py-2.5 text-right font-bold text-blue-900">Doanh Thu Chốt HĐ</th>
                    <th className="px-3 py-2.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {salesStaff.map((staff) => {
                    const staffCusts = customers.filter(
                      (c) => c.assignedToId === staff.id || c.createdBy === staff.id
                    );
                    const staffQuotes = quotations.filter((q) => q.salesRepId === staff.id);
                    const staffContracts = contracts.filter((ct) => ct.salesRepId === staff.id);
                    const staffRevenue = staffContracts.reduce((sum, ct) => sum + ct.totalValue, 0);

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={staff.avatar}
                              alt={staff.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{staff.name}</div>
                              <div className="text-[10px] text-slate-500">{staff.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-600 font-medium">{staff.department}</td>
                        <td className="px-3 py-2 text-center font-bold text-slate-800">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{staffCusts.length}</span>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-slate-800">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                            {staffQuotes.length}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-emerald-800">
                          <span className="px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200 text-xs">
                            {staffContracts.length}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-extrabold text-xs text-emerald-700 font-mono">
                          {formatVND(staffRevenue)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => {
                                setResetModalUser(staff);
                                setModalNewPassword('123456');
                                setResetSuccessMessage(null);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                              title="Cấp lại / Đổi mật khẩu cho sale này"
                            >
                              <KeyRound className="w-3 h-3 text-slate-500" />
                              <span>Cấp Lại Mật Khẩu</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <UserPlus className={`w-4 h-4 ${isSuperAdmin ? 'text-purple-600' : 'text-blue-600'}`} />
                <span>{isSuperAdmin ? 'Tạo Tài Khoản Doanh Nghiệp (Level 1)' : 'Cấp 1 Tạo Tài Khoản Nhân Viên Sale (C2)'}</span>
              </h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isSuperAdmin ? 'Họ Và Tên Giám Đốc / Người Đại Diện' : 'Họ Và Tên Nhân Viên'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isSuperAdmin ? 'VD: Nguyễn Văn Hoàng' : 'VD: Trần Văn Bình'}
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isSuperAdmin ? 'Tên Doanh Nghiệp / Công Ty' : 'Phòng Ban / Đội Nhóm'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isSuperAdmin ? 'VD: Công Ty Cổ Phần Công Nghệ ABC' : 'VD: Phòng Kinh Doanh 1'}
                  value={newUserDepartment}
                  onChange={(e) => setNewUserDepartment(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Đăng Nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder={isSuperAdmin ? 'giamdoc@congtyabc.com' : 'binh.tran@salesflow.vn'}
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              {/* Password configuration for newly created account */}
              <div className="p-2.5 bg-purple-50/50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Mật Khẩu Đăng Nhập <span className="text-rose-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-purple-700 hover:text-purple-900 font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Ẩn' : 'Hiện'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mật khẩu tối thiểu 3 ký tự (VD: 123456)"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-purple-700 mt-1">
                  ℹ️ Cung cấp Email và Mật khẩu này cho {isSuperAdmin ? 'Doanh nghiệp Level 1' : 'nhân viên C2'} để họ đăng nhập vào hệ thống.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số Điện Thoại Liên Hệ
                </label>
                <input
                  type="text"
                  placeholder="0918 234 567"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center space-x-1.5 cursor-pointer ${
                    isSuperAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSuperAdmin ? 'Xác Nhận Tạo Level 1' : 'Xác Nhận Tạo Tài Khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset / Update Password for Existing User */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Cấp Lại / Đổi Mật Khẩu</span>
              </h3>
              <button
                onClick={() => {
                  setResetModalUser(null);
                  setResetSuccessMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="p-4 space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <div className="font-bold text-slate-800 text-xs">{resetModalUser.name}</div>
                <div className="text-[11px] text-slate-500">{resetModalUser.email}</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                  {resetModalUser.role === 'manager_c1' ? 'Giám Đốc (C1)' : 'Nhân Viên Sales (C2)'} • {resetModalUser.department}
                </div>
              </div>

              {resetSuccessMessage ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetSuccessMessage}</span>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Mật khẩu mới <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowModalNewPassword(!showModalNewPassword)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                      >
                        {showModalNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showModalNewPassword ? 'Ẩn' : 'Hiện'}</span>
                      </button>
                    </div>
                    <input
                      type={showModalNewPassword ? 'text' : 'password'}
                      required
                      value={modalNewPassword}
                      onChange={(e) => setModalNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Sau khi lưu, nhân viên có thể sử dụng mật khẩu mới này để đăng nhập ngay vào hệ thống.
                  </p>

                  <div className="pt-2.5 border-t border-slate-200 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setResetModalUser(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs transition"
                    >
                      Cập Nhật Mật Khẩu
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPORT / SYNC ACCOUNTS FROM JSON */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-800 text-sm">Đồng Bộ & Nhập Danh Sách Tài Khoản</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Dán mã JSON sao lưu tài khoản (hoặc danh sách tài khoản đã xuất từ máy khác) vào ô bên dưới. Hệ thống sẽ ngay lập tức đồng bộ danh sách tài khoản vào bộ nhớ hệ thống.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung JSON tài khoản:
                </label>
                <textarea
                  rows={6}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder={`{\n  "version": "1.0",\n  "users": [\n    {\n      "id": "...",\n      "email": "...",\n      "role": "manager_c1"\n    }\n  ]\n}`}
                  className="w-full p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] border border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {importFeedback && (
                <div
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center space-x-2 ${
                    importFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {importFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{importFeedback.message}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded shadow-xs transition cursor-pointer"
                >
                  Xác Nhận Nhập Tài Khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
