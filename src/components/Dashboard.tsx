import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatVND, formatDate } from '../utils/formatters';
import { TimeFilterState, isDateInFilter, getTimeFilterLabel, getCurrentQuarter } from '../utils/dateFilters';
import { SalesFilterControls } from './Dashboard/SalesFilterControls';
import { SalesKPIStats } from './Dashboard/SalesKPIStats';
import { SalesAnalyticsSection } from './Dashboard/SalesAnalyticsSection';
import { SalesSignedContractsTable } from './Dashboard/SalesSignedContractsTable';
import {
  TrendingUp,
  Users,
  FileSignature,
  FileText,
  Boxes,
  Layers,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  Package,
  ShoppingCart,
  UserCheck,
  Tag,
  Search,
  ExternalLink,
  Shield,
  ShieldCheck,
  Database,
  Cloud,
  UserPlus,
  Lock,
  PlusCircle,
  BarChart3,
  Calendar,
  Briefcase,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    currentUser,
    filteredCustomers,
    filteredQuotations,
    filteredContracts,
    filteredReserveItems,
    filteredOrderItems,
    inventory,
    products,
    allProducts,
    allInventory,
    users,
    setActiveTab,
    setIsCreateQuoteModalOpen,
    setSelectedCustomerIdForQuote,
    setSelectedQuoteForModal,
    setPdfPreviewData,
    approveUser,
    syncAllToCloudNow,
    cloudSyncStatus,
  } = useApp();

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManagerC1 = currentUser.role === 'manager_c1';
  const isSalesC2 = currentUser.role === 'sales_c2';

  // State for Super Admin mode toggle (System View vs Sales Overview)
  const [adminViewMode, setAdminViewMode] = useState<'sales_overview' | 'system_admin'>('system_admin');

  // Filter state for Sales Overview
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentQuarter = getCurrentQuarter();

  const [timeFilter, setTimeFilter] = useState<TimeFilterState>({
    period: 'all',
    selectedYear: currentYear,
    selectedMonth: currentMonth,
    selectedQuarter: currentQuarter,
  });

  const [selectedRepId, setSelectedRepId] = useState<string>('all');

  // Available sales reps according to role
  const availableSalesReps = useMemo(() => {
    if (isSuperAdmin) {
      return users.filter((u) => u.role === 'sales_c2' || u.role === 'manager_c1');
    }
    if (isManagerC1) {
      return users.filter(
        (u) =>
          u.role === 'sales_c2' &&
          (u.managerId === currentUser.id || u.createdBy === currentUser.id)
      );
    }
    // Sales C2: show only self
    return users.filter((u) => u.id === currentUser.id);
  }, [users, currentUser, isSuperAdmin, isManagerC1]);

  // Apply Sales Rep filter
  const repFilteredData = useMemo(() => {
    if (selectedRepId === 'all') {
      return {
        contracts: filteredContracts,
        quotations: filteredQuotations,
        customers: filteredCustomers,
      };
    }
    return {
      contracts: filteredContracts.filter((c) => c.salesRepId === selectedRepId),
      quotations: filteredQuotations.filter((q) => q.salesRepId === selectedRepId),
      customers: filteredCustomers.filter(
        (cust) => cust.assignedToId === selectedRepId || cust.createdBy === selectedRepId
      ),
    };
  }, [selectedRepId, filteredContracts, filteredQuotations, filteredCustomers]);

  // Apply Time Filter strictly to all collections
  const finalFilteredData = useMemo(() => {
    const contracts = repFilteredData.contracts.filter((c) =>
      isDateInFilter(c.contractDate || c.createdAt, timeFilter)
    );

    const quotations = repFilteredData.quotations.filter((q) =>
      isDateInFilter(q.date || q.createdAt, timeFilter)
    );

    const customers = repFilteredData.customers.filter((c) =>
      isDateInFilter(c.createdAt, timeFilter)
    );

    return {
      contracts,
      quotations,
      customers,
    };
  }, [repFilteredData, timeFilter]);

  // Calculated reactive metrics
  const totalRevenue = useMemo(() => {
    return finalFilteredData.contracts.reduce((sum, c) => sum + (c.totalValue || 0), 0);
  }, [finalFilteredData.contracts]);

  const pipelineQuotes = useMemo(() => {
    return finalFilteredData.quotations.filter(
      (q) => q.status === 'sent' || q.status === 'negotiating'
    );
  }, [finalFilteredData.quotations]);

  const pipelineValue = useMemo(() => {
    return pipelineQuotes.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
  }, [pipelineQuotes]);

  const newCustomersCount = useMemo(() => {
    return finalFilteredData.customers.filter((c) => c.stage === 'new').length;
  }, [finalFilteredData.customers]);

  const signedCustomersCount = useMemo(() => {
    return finalFilteredData.customers.filter((c) => c.stage === 'contract_signed').length;
  }, [finalFilteredData.customers]);

  const timeLabel = getTimeFilterLabel(timeFilter);
  const selectedRepObj = availableSalesReps.find((r) => r.id === selectedRepId);
  const salesRepLabel = selectedRepId === 'all' ? (isManagerC1 ? 'Toàn Phòng Kinh Doanh' : 'Tất cả nhân viên') : (selectedRepObj?.name || selectedRepId);

  // Super Admin view logic when in system_admin mode
  if (isSuperAdmin && adminViewMode === 'system_admin') {
    const managersC1 = users.filter((u) => u.role === 'manager_c1');
    const pendingC1 = managersC1.filter((u) => u.status === 'pending_approval');
    const activeC1 = managersC1.filter((u) => u.status === 'active');
    const salesC2List = users.filter((u) => u.role === 'sales_c2');

    return (
      <div className="space-y-4">
        {/* Super Admin Top Switch */}
        <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-slate-800 text-sm">Chế độ xem Quản Trị Hệ Thống (Cấp 0)</span>
          </div>
          <button
            onClick={() => setAdminViewMode('sales_overview')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Chuyển sang Tổng Quan Phòng Kinh Doanh →</span>
          </button>
        </div>

        {/* Super Admin Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-5 rounded-xl text-white shadow-md border border-purple-800/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Super Admin Hệ Thống (Cấp 0)</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                Xin chào, <span className="text-purple-300">{currentUser.name}</span> ({currentUser.email})
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Tài khoản của bạn nắm giữ quyền quản trị cao nhất: Phê duyệt tài khoản Cấp 1, cấu hình kết nối Google Cloud Firestore, và quản lý danh mục dữ liệu.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setActiveTab('team')}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Quản Lý Phân Quyền & C1</span>
              </button>
              <button
                onClick={() => syncAllToCloudNow()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span>Đồng Bộ Google Cloud</span>
              </button>
            </div>
          </div>
        </div>

        {/* Super Admin Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Tài khoản Cấp 1</span>
              <span className="p-1 rounded bg-purple-50 text-purple-700">L1</span>
            </div>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-extrabold text-slate-900">{managersC1.length}</span>
              <span className="text-xs text-emerald-600 font-semibold">{activeC1.length} đã duyệt</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Giám đốc / Trưởng phòng phụ trách L2</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Cấp 1 Chờ Phê Duyệt</span>
              <span className={`p-1 rounded text-xs font-bold ${pendingC1.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                {pendingC1.length}
              </span>
            </div>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className={`text-2xl font-extrabold ${pendingC1.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {pendingC1.length} tài khoản
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {pendingC1.length > 0 ? 'Cần Super Admin xem xét duyệt' : 'Không có yêu cầu chờ duyệt'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Nhân viên Cấp 2 (Sales)</span>
              <span className="p-1 rounded bg-blue-50 text-blue-700">L2</span>
            </div>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-extrabold text-slate-900">{salesC2List.length}</span>
              <span className="text-xs text-blue-600 font-semibold">NVKD trực tiếp</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Do các Giám đốc Cấp 1 quản lý & tạo</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Dữ liệu Master Data</span>
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-extrabold text-slate-900">{allProducts.length} mã</span>
              <span className="text-xs text-emerald-600 font-semibold">{allInventory.length} mã kho</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Bảng giá & Tồn kho toàn hệ thống</p>
          </div>
        </div>

        {/* Super Admin User list */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Danh Sách Tài Khoản Giám Đốc Cấp 1</span>
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('team')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Quản lý chi tiết →
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {managersC1.map((mgr) => (
              <div key={mgr.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center space-x-3">
                  <img src={mgr.avatar} alt={mgr.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                  <div>
                    <div className="font-bold text-slate-900">{mgr.name}</div>
                    <div className="text-[11px] text-slate-500">{mgr.email} • {mgr.phone}</div>
                    <div className="text-[10px] text-blue-600 font-semibold">{mgr.department}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {mgr.status === 'pending_approval' ? (
                    <button
                      onClick={() => approveUser(mgr.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center space-x-1 shadow-2xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Phê Duyệt</span>
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[11px] font-bold">
                      ✓ Đã Kích Hoạt
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Standard Sales Department Overview Window for Sales, Manager C1, Director, and Super Admin
  return (
    <div className="space-y-4">
      {/* Super Admin Mode Switch banner (if Super Admin) */}
      {isSuperAdmin && (
        <div className="flex items-center justify-between bg-purple-50 border border-purple-200 p-3 rounded-xl">
          <div className="flex items-center space-x-2 text-purple-900 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Bạn đang xem với tư cách Super Admin (Quyền xem toàn bộ doanh số phòng & nhân viên).</span>
          </div>
          <button
            onClick={() => setAdminViewMode('system_admin')}
            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition"
          >
            Quản trị Cấp 1 & Hệ thống →
          </button>
        </div>
      )}

      {/* Action Header Banner */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Briefcase className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                {isManagerC1
                  ? 'Tổng Quan Phòng Kinh Doanh & Hiệu Suất Bán Hàng'
                  : isSalesC2
                  ? 'Bàn Làm Việc & Hiệu Suất Doanh Số Cá Nhân'
                  : 'Tổng Quan Doanh Số & Hợp Đồng Toàn Hệ Thống'}
              </h1>
              <p className="text-xs text-slate-500">
                Theo dõi tức thời doanh số, hợp đồng đã ký, giá trị báo giá đàm phán và phân tích theo tuần/tháng/quý/năm & nhân viên.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedCustomerIdForQuote(undefined);
              setSelectedQuoteForModal(null);
              setIsCreateQuoteModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo Báo Giá Mới</span>
          </button>

          <button
            onClick={() => setActiveTab('reserve_orders')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Boxes className="w-4 h-4 text-slate-600" />
            <span>Xem Kho & Giữ Hàng</span>
          </button>
        </div>
      </div>

      {/* 1. Time & Sales Rep Filter Suite */}
      <SalesFilterControls
        currentUser={currentUser}
        salesReps={availableSalesReps}
        selectedRepId={selectedRepId}
        onSelectRepId={setSelectedRepId}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        totalContractsCount={filteredContracts.length}
        filteredContractsCount={finalFilteredData.contracts.length}
        filteredRevenue={totalRevenue}
      />

      {/* 2. Key Metric KPI Cards (Always responsive & reactive to filters) */}
      <SalesKPIStats
        totalRevenue={totalRevenue}
        totalContractsCount={finalFilteredData.contracts.length}
        pipelineValue={pipelineValue}
        pipelineQuotesCount={pipelineQuotes.length}
        totalQuotesCount={finalFilteredData.quotations.length}
        newCustomersCount={newCustomersCount}
        signedCustomersCount={signedCustomersCount}
        totalCustomersCount={finalFilteredData.customers.length}
        salesRepLabel={salesRepLabel}
        timeLabel={timeLabel}
      />

      {/* 3. Sales Analytics Section: Leaderboard + Customer Funnel & Payment Milestones */}
      <SalesAnalyticsSection
        salesReps={availableSalesReps}
        contracts={finalFilteredData.contracts}
        quotations={finalFilteredData.quotations}
        customers={finalFilteredData.customers}
        selectedRepId={selectedRepId}
        onSelectRepId={setSelectedRepId}
        totalRevenue={totalRevenue}
      />

      {/* 4. Signed Contracts Table at the Bottom with original detailed information */}
      <SalesSignedContractsTable
        contracts={finalFilteredData.contracts}
        timeLabel={timeLabel}
        salesRepLabel={salesRepLabel}
      />
    </div>
  );
};
