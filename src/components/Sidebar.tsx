import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfileCompanyModal } from './Modals/UserProfileCompanyModal';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSignature,
  Tag,
  Boxes,
  Layers,
  UserPlus,
  PackageCheck,
  Building2,
  Trash2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    filteredCustomers,
    filteredQuotations,
    filteredContracts,
    filteredReserveItems,
    filteredOrderItems,
    users,
    setIsClearDataModalOpen,
    logout,
  } = useApp();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'profile' | 'company'>('profile');

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManagerC1 = currentUser.role === 'manager_c1';
  const isSalesC2 = currentUser.role === 'sales_c2';

  // Count badges
  const pendingC1Count = users.filter((u) => u.role === 'manager_c1' && u.status === 'pending_approval').length;
  const holdingCount = filteredReserveItems.filter((r) => r.status === 'holding').length;
  const pendingOrderCount = filteredOrderItems.filter((o) => o.status === 'pending_order').length;

  // Super Admin Navigation
  const superAdminNav = [
    {
      id: 'dashboard',
      label: 'Tổng quan hệ thống',
      icon: LayoutDashboard,
    },
    {
      id: 'team',
      label: 'Duyệt Cấp 1 & Quản trị TK',
      icon: UserPlus,
      badge: pendingC1Count > 0 ? `${pendingC1Count} chờ duyệt` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'products',
      label: 'Quản trị Data Giá',
      icon: Tag,
    },
    {
      id: 'inventory',
      label: 'Quản trị Kho hàng',
      icon: Boxes,
    },
  ];

  // Manager C1 Navigation
  const managerGeneralNav = [
    {
      id: 'dashboard',
      label: 'Tổng quan phòng kinh doanh',
      icon: LayoutDashboard,
    },
    {
      id: 'team',
      label: 'Quản lý Đội Sales (C2)',
      icon: UserPlus,
      badge: `${users.filter((u) => u.managerId === currentUser.id || u.createdBy === currentUser.id).length} nhân viên`,
      badgeColor: 'bg-blue-500/30 text-blue-300',
    },
  ];

  const managerSalesNav = [
    {
      id: 'customers',
      label: 'Khách hàng & Pipeline (C1 & C2)',
      icon: Users,
      badge: filteredCustomers.length,
    },
    {
      id: 'quotations',
      label: 'Báo giá phòng (v1, v2...)',
      icon: FileText,
      badge: filteredQuotations.length,
    },
    {
      id: 'contracts',
      label: 'Tiến độ Hợp đồng phòng',
      icon: FileSignature,
      badge: filteredContracts.length,
    },
  ];

  // Sales C2 Navigation
  const salesGeneralNav = [
    {
      id: 'dashboard',
      label: 'Bàn làm việc Sales',
      icon: LayoutDashboard,
    },
  ];

  const salesSalesNav = [
    {
      id: 'customers',
      label: 'Khách hàng của tôi',
      icon: Users,
      badge: filteredCustomers.length,
    },
    {
      id: 'quotations',
      label: 'Báo giá của tôi',
      icon: FileText,
      badge: filteredQuotations.length,
    },
    {
      id: 'contracts',
      label: 'Hợp đồng của tôi',
      icon: FileSignature,
      badge: filteredContracts.length,
    },
  ];

  // Shared Warehouse & Price Master (Available to both C1 and C2)
  const sharedWarehouseNav = [
    {
      id: 'reserve_orders',
      label: isManagerC1 ? 'Bảng Giữ & Đặt hàng phòng' : 'Hàng giữ & Đặt của tôi',
      icon: Layers,
      badge: holdingCount + pendingOrderCount > 0 ? `${holdingCount} giữ | ${pendingOrderCount} đặt` : undefined,
      badgeColor: 'bg-amber-500 text-slate-900',
    },
    {
      id: 'products',
      label: 'Data Giá & Giá DP (Dùng chung)',
      icon: Tag,
    },
    {
      id: 'inventory',
      label: 'Kho hàng & Tồn khả dụng (Dùng chung)',
      icon: Boxes,
    },
  ];

  const renderNavGroup = (title: string, items: { id: string; label: string; icon: any; badge?: any; badgeColor?: string }[]) => (
    <div className="space-y-1 mb-3">
      <div className="text-[10px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
        {title}
      </div>
      {items.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            id={`sidebar-nav-${item.id}`}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2.5 text-left truncate">
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </div>

            {item.badge !== undefined && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1.5 shrink-0 ${
                  item.badgeColor
                    ? item.badgeColor
                    : isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="w-64 bg-[#1E293B] text-white flex flex-col h-full shrink-0 border-r border-slate-700 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-700 shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span>SALEFLOW</span>
          <span className="text-blue-400 font-extrabold">PRO</span>
        </h1>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
          {currentUser.role === 'super_admin' && 'Super Admin Dashboard (L0)'}
          {currentUser.role === 'manager_c1' && 'Director Dashboard (L1)'}
          {currentUser.role === 'sales_c2' && 'Sales Dashboard (L2)'}
        </p>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-1">
        {isSuperAdmin && (
          <>
            {renderNavGroup('Quản trị hệ thống (L0)', superAdminNav)}
            <div className="mt-4 p-3 rounded-md bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-200">
              <div className="font-bold text-purple-300 flex items-center space-x-1.5 mb-1">
                <span>🔒 Phân quyền Super Admin</span>
              </div>
              <p className="text-[10px] text-purple-300/80 leading-relaxed">
                Tài khoản Super Admin quản trị hệ thống, phê duyệt tài khoản C1 & cấu hình database. Dữ liệu báo giá & khách hàng nội bộ của C1, C2 được bảo mật riêng biệt.
              </p>
            </div>
          </>
        )}

        {isManagerC1 && (
          <>
            {renderNavGroup('Quản lý chung', managerGeneralNav)}
            {renderNavGroup('Khách hàng & Báo giá', managerSalesNav)}
            {renderNavGroup('Kho hàng & Bảng giá (Dùng chung)', sharedWarehouseNav)}
          </>
        )}

        {isSalesC2 && (
          <>
            {renderNavGroup('Bàn làm việc', salesGeneralNav)}
            {renderNavGroup('Khách hàng & Báo giá của tôi', salesSalesNav)}
            {renderNavGroup('Kho hàng & Bảng giá (Dùng chung)', sharedWarehouseNav)}
          </>
        )}

        {/* Workflow Info Box (For C1 & C2) */}
        {!isSuperAdmin && (
          <div className="mt-4 p-2.5 rounded-md bg-slate-800/70 border border-slate-700/80 text-[11px] text-slate-300">
            <div className="font-semibold text-slate-200 flex items-center space-x-1.5 mb-1 text-[11px]">
              <PackageCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Quy trình chốt hợp đồng:</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Khi bấm <strong className="text-slate-200">Chốt Báo Giá</strong>, hệ thống tự động sinh HĐ và tách 2 bảng:
            </p>
            <div className="mt-1 text-[10px] space-y-0.5">
              <div className="text-emerald-400 font-medium">✓ Giữ hàng: Mã còn tồn</div>
              <div className="text-amber-400 font-medium">✓ Đặt hàng: Mã thiếu/hết</div>
            </div>
          </div>
        )}
      </nav>

      {/* Profile Footer & Logout */}
      <div className="p-3 border-t border-slate-700 text-xs text-slate-400 shrink-0 bg-[#172033]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setProfileModalInitialTab('profile');
              setIsProfileModalOpen(true);
            }}
            className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2 text-left hover:opacity-80 transition cursor-pointer group"
            title="Bấm để xem và chỉnh sửa thông tin cá nhân & thương hiệu công ty"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-200 text-xs truncate group-hover:text-blue-300 transition" title={currentUser.name}>
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser.role === 'super_admin' ? 'Super Admin (L0)' : currentUser.role === 'manager_c1' ? 'Director (L1)' : 'Sales (L2)'}
              </p>
            </div>
          </button>

          {/* Quick action buttons */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setProfileModalInitialTab('company');
                setIsProfileModalOpen(true);
              }}
              className="p-1.5 rounded-md hover:bg-slate-700 hover:text-amber-300 text-slate-400 border border-slate-700 transition cursor-pointer"
              title="Xem / Cài đặt thông tin thương hiệu công ty"
            >
              <Building2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsClearDataModalOpen(true)}
              className="p-1.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition cursor-pointer"
              title="Xoá dữ liệu: Khách hàng, Data giá, Báo giá, Tồn kho..."
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-md hover:bg-slate-700 hover:text-slate-200 text-slate-400 border border-slate-700 transition cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <UserProfileCompanyModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileModalInitialTab}
      />
    </aside>
  );
};
