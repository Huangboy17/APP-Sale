import React from 'react';
import { useApp } from '../context/AppContext';
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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    filteredCustomers,
    filteredQuotations,
    filteredContracts,
    reserveItems,
    orderItems,
    users,
  } = useApp();

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManagerC1 = currentUser.role === 'manager_c1';
  const isSalesC2 = currentUser.role === 'sales_c2';

  // Count badges
  const pendingC1Count = users.filter((u) => u.role === 'manager_c1' && u.status === 'pending_approval').length;
  const holdingCount = reserveItems.filter((r) => r.status === 'holding').length;
  const pendingOrderCount = orderItems.filter((o) => o.status === 'pending_order').length;

  const generalNavItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan hệ thống',
      icon: LayoutDashboard,
      roles: ['super_admin', 'manager_c1', 'sales_c2'],
    },
    {
      id: 'team',
      label: isSuperAdmin ? 'Duyệt Cấp 1 & Quyền hạn' : isManagerC1 ? 'Đội ngũ Sales (L2)' : 'Đội ngũ Kinh Doanh',
      icon: UserPlus,
      badge: isSuperAdmin && pendingC1Count > 0 ? `${pendingC1Count} chờ duyệt` : undefined,
      badgeColor: 'bg-rose-500 text-white',
      roles: ['super_admin', 'manager_c1', 'sales_c2'],
    },
  ];

  const salesNavItems = [
    {
      id: 'customers',
      label: 'Khách hàng & Pipeline',
      icon: Users,
      badge: filteredCustomers.length,
      roles: ['super_admin', 'manager_c1', 'sales_c2'],
    },
    {
      id: 'quotations',
      label: 'Cửa sổ Báo giá (v1, v2...)',
      icon: FileText,
      badge: filteredQuotations.length,
      roles: ['super_admin', 'manager_c1', 'sales_c2'],
    },
    {
      id: 'contracts',
      label: 'Tiến độ Hợp đồng',
      icon: FileSignature,
      badge: filteredContracts.length,
      roles: ['super_admin', 'manager_c1', 'sales_c2'],
    },
  ];

  const warehouseNavItems = [
    {
      id: 'reserve_orders',
      label: 'Bảng Giữ & Đặt hàng',
      icon: Layers,
      badge: holdingCount + pendingOrderCount > 0 ? `${holdingCount} giữ | ${pendingOrderCount} đặt` : undefined,
      badgeColor: 'bg-amber-500 text-slate-900',
      roles: ['super_admin', 'manager_c1', 'sales_c2'],
    },
    {
      id: 'products',
      label: 'Data Giá & Giá DP',
      icon: Tag,
      roles: ['super_admin', 'manager_c1', 'sales_c2'],
    },
    {
      id: 'inventory',
      label: 'Kho hàng & Tồn khả dụng',
      icon: Boxes,
      roles: ['super_admin', 'manager_c1', 'sales_c2'],
    },
  ];

  const renderNavGroup = (title: string, items: typeof generalNavItems) => (
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
        {renderNavGroup('Quản lý chung', generalNavItems)}
        {renderNavGroup('Khách hàng & Báo giá', salesNavItems)}
        {renderNavGroup('Kho hàng & Bảng giá', warehouseNavItems)}

        {/* Workflow Info Box */}
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
      </nav>

      {/* Profile Footer */}
      <div className="p-3 sm:p-3.5 border-t border-slate-700 text-xs text-slate-400 shrink-0 bg-[#172033]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center text-xs border border-slate-500 shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-200 text-xs truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 truncate">
              {currentUser.role === 'super_admin' ? 'Super Admin (Cấp 0)' : currentUser.role === 'manager_c1' ? 'Director (Cấp 1)' : 'Sales Executive (Cấp 2)'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
