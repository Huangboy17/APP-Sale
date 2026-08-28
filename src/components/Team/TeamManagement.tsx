import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { formatVND } from '../../utils/formatters';
import {
  Users,
  Shield,
  UserCheck,
  UserPlus,
  Building,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  ArrowRight,
  X,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';

export const TeamManagement: React.FC = () => {
  const {
    currentUser,
    users,
    customers,
    contracts,
    quotations,
    addUser,
    approveUser,
    resetPassword,
  } = useApp();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState<UserRole>('sales_c2');
  const [newUserDepartment, setNewUserDepartment] = useState('Phòng Kinh Doanh 1');

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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert('Vui lòng nhập tên và email');
      return;
    }

    const assignedPass = newUserPassword.trim() || '123456';
    const assignedRole = isManagerC1 ? 'sales_c2' : newUserRole;

    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      phone: newUserPhone.trim() || '0901234567',
      password: assignedPass,
      role: assignedRole,
      department: newUserDepartment || (isManagerC1 ? currentUser.department || 'Phòng Kinh Doanh' : 'Phòng Dự Án'),
      managerId: isManagerC1 ? currentUser.id : undefined,
      status: 'active',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?w=120&auto=format&fit=crop&q=80`,
    });

    setCreatedUserInfo({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      pass: assignedPass,
      roleName: assignedRole === 'sales_c2' ? 'Nhân Viên Kinh Doanh (C2)' : 'Giám Đốc / Trưởng Phòng (C1)',
    });

    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserPassword('123456');
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Phân Cấp Tài Khoản (3 Cấp) & Theo Dõi Tình Hình Kinh Doanh</span>
          </h1>
          <p className="text-xs text-slate-500">
            Hệ thống 3 cấp: <strong>Super Admin</strong> (Duyệt C1) → <strong>Cấp 1</strong> (Giám đốc/Trưởng phòng tạo C2, theo dõi doanh số) → <strong>Cấp 2</strong> (NVKD trực tiếp).
          </p>
        </div>

        {(isSuperAdmin || isManagerC1) && (
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition active:scale-95 self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isSuperAdmin ? '+ Thêm Tài Khoản C1 / C2' : '+ Cấp 1 Tạo Nhân Viên C2 Mới'}</span>
          </button>
        )}
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
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép thông tin'}</span>
            </button>
            <button
              onClick={() => setCreatedUserInfo(null)}
              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Role Structure Hierarchy Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-purple-50/80 rounded-lg border border-purple-200 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-purple-900 font-bold text-xs">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>CẤP 0: SUPER ADMIN</span>
          </div>
          <p className="text-[11px] text-purple-700 mt-1">
            Quyền tối cao: Phê duyệt tài khoản Cấp 1, cấu hình hệ thống, xem toàn bộ dữ liệu toàn công ty.
          </p>
        </div>

        <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>CẤP 1: GIÁM ĐỐC / TRƯỞNG PHÒNG</span>
          </div>
          <p className="text-[11px] text-blue-700 mt-1">
            Quản lý và tạo nhân viên Cấp 2, phân bổ khách hàng, import Data Giá & Tồn kho, theo dõi KPI phòng.
          </p>
        </div>

        <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-emerald-900 font-bold text-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>CẤP 2: NHÂN VIÊN KINH DOANH</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            Tạo khách hàng mới & nhận khách được giao, mở cửa sổ báo giá, chốt báo giá ký hợp đồng.
          </p>
        </div>
      </div>

      {/* SUPER ADMIN APPROVAL SECTION: Pending C1 accounts */}
      {isSuperAdmin && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>Duyệt Tài Khoản Cấp 1 (Dành Cho Super Admin)</span>
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {managersC1.map((mgr) => (
              <div key={mgr.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2.5">
                  <img src={mgr.avatar} alt={mgr.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{mgr.name}</div>
                    <div className="text-[11px] text-slate-500">{mgr.email} • {mgr.phone}</div>
                    <div className="text-[10px] text-blue-600 font-semibold">{mgr.department}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {mgr.status === 'pending_approval' || mgr.status === 'pending' ? (
                    <button
                      onClick={() => approveUser(mgr.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition flex items-center space-x-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Phê Duyệt Cấp 1</span>
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[11px] font-bold">
                      ✓ Đã Phê Duyệt
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setResetModalUser(mgr);
                      setModalNewPassword('123456');
                      setResetSuccessMessage(null);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                    title="Đặt lại mật khẩu cho tài khoản này"
                  >
                    <KeyRound className="w-3 h-3 text-slate-500" />
                    <span>Cấp Lại Mật Khẩu</span>
                  </button>
                </div>
              </div>
            ))}
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

      {/* Modal Add User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>{isSuperAdmin ? 'Tạo Tài Khoản Mới (C1 / C2)' : 'Cấp 1 Tạo Tài Khoản Nhân Viên Sale (C2)'}</span>
              </h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ Và Tên Nhân Viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trần Văn Bình"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Đăng Nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="binh.tran@salesflow.vn"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Password configuration for newly created account */}
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mật Khẩu Đăng Nhập Cho Tài Khoản <span className="text-rose-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-medium flex items-center space-x-1"
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
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-blue-700 mt-1">
                  ℹ️ Cung cấp Email và Mật khẩu này cho nhân viên C2 để họ đăng nhập vào hệ thống.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    placeholder="0918 234 567"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phòng Ban / Đội Nhóm
                  </label>
                  <input
                    type="text"
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cấp Độ Tài Khoản
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="sales_c2">Cấp 2: Nhân Viên Kinh Doanh (Sales Executive)</option>
                    <option value="manager_c1">Cấp 1: Giám Đốc / Trưởng Phòng Kinh Doanh</option>
                  </select>
                </div>
              )}

              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Xác Nhận Tạo Tài Khoản</span>
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
    </div>
  );
};
