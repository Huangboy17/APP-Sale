import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatVND, formatDate, getCustomerStageConfig } from '../utils/formatters';
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

  const [selectedRepFilter, setSelectedRepFilter] = useState<string>('all');

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManagerC1 = currentUser.role === 'manager_c1';
  const isSalesC2 = currentUser.role === 'sales_c2';

  // Super Admin view logic
  if (isSuperAdmin) {
    const managersC1 = users.filter((u) => u.role === 'manager_c1');
    const pendingC1 = managersC1.filter((u) => u.status === 'pending_approval');
    const activeC1 = managersC1.filter((u) => u.status === 'active');
    const salesC2List = users.filter((u) => u.role === 'sales_c2');

    return (
      <div className="space-y-4">
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
                Tài khoản của bạn nắm giữ quyền quản trị cao nhất: Phê duyệt tài khoản Cấp 1, cấu hình kết nối Google Cloud Firestore, và quản lý danh mục dữ liệu. Theo chính sách bảo mật nội bộ, dữ liệu bán hàng & khách hàng của các Cấp 1, Cấp 2 được phân quyền độc lập.
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
              <span className="text-2xl font-extrabold text-slate-900">{products.length} mã</span>
              <span className="text-xs text-emerald-600 font-semibold">{inventory.length} kho</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Bảng giá & Tồn kho toàn hệ thống</p>
          </div>
        </div>

        {/* Super Admin Quick User Management & Security Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 8 cols: Pending & Active C1 Managers */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Danh Sách Tài Khoản Giám Đốc Cấp 1</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Duyệt hoặc cấp quyền cho tài khoản Cấp 1 để họ tạo và quản lý đội ngũ Cấp 2 của riêng họ.
                </p>
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
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center space-x-1 shadow-2xs"
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

          {/* Right 4 cols: Security & RBAC Isolation Guide */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg shadow-xs p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-purple-600" />
              <span>Chính Sách Phân Quyền (RBAC)</span>
            </h3>

            <div className="space-y-2 text-[11px] text-slate-600">
              <div className="p-2.5 bg-purple-50 rounded border border-purple-200">
                <div className="font-bold text-purple-900">👑 Super Admin (Bạn)</div>
                <div className="text-purple-700 mt-0.5">
                  Chỉ có giao diện quản lý hệ thống, phân quyền, cấu hình database. Không xem dữ liệu khách hàng & báo giá nội bộ C1/C2.
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 rounded border border-blue-200">
                <div className="font-bold text-blue-900">🏢 Cấp 1 (Giám đốc)</div>
                <div className="text-blue-700 mt-0.5">
                  Quản lý các tài khoản Cấp 2 do C1 đó tạo; xem dữ liệu khách hàng & báo giá của mình và đội ngũ C2 trực thuộc.
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200">
                <div className="font-bold text-emerald-900">💼 Cấp 2 (Sales)</div>
                <div className="text-emerald-700 mt-0.5">
                  Chỉ được xem thông tin khách hàng mà được phân công hoặc do chính Cấp 2 đó tạo.
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded border border-amber-200">
                <div className="font-bold text-amber-900">📦 Bảng Giá & Tồn Kho</div>
                <div className="text-amber-700 mt-0.5">
                  Cấp 1 và Cấp 2 được khai thác chung, xem giá niêm yết/giá sàn DP và đều có quyền import Excel.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Operational View for C1 and C2
  const totalSignedValue = filteredContracts.reduce((sum, c) => sum + c.totalValue, 0);
  const totalQuotingValue = filteredQuotations
    .filter((q) => q.status === 'sent' || q.status === 'negotiating')
    .reduce((sum, q) => sum + q.grandTotal, 0);

  const newCustomersCount = filteredCustomers.filter((c) => c.stage === 'new').length;
  const quotingCustomersCount = filteredCustomers.filter((c) => c.stage === 'quoting').length;
  const signedCustomersCount = filteredCustomers.filter((c) => c.stage === 'contract_signed').length;
  const lowStockItems = inventory.filter((i) => i.availableQuantity <= 5);

  const salesReps = isManagerC1
    ? users.filter((u) => u.role === 'sales_c2' && (u.managerId === currentUser.id || u.createdBy === currentUser.id))
    : [];

  const filteredQuotesForDashboard = filteredQuotations.filter((q) => {
    if (selectedRepFilter === 'all') return true;
    return q.salesRepId === selectedRepFilter;
  });

  return (
    <div className="space-y-4">
      {/* High Density Metric 4-Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 shrink-0">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
            {isManagerC1 ? 'Doanh số phòng ký HĐ' : 'Doanh số cá nhân ký HĐ'}
          </p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{formatVND(totalSignedValue)}</span>
            <span className="text-green-600 text-xs font-semibold">+{filteredContracts.length} HĐ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tổng giá trị hợp đồng chính thức</p>
        </div>

        {/* Metric 2: Active Quotes */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
            {isManagerC1 ? 'Báo giá đang mở (Phòng)' : 'Báo giá của tôi'}
          </p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{filteredQuotations.length}</span>
            <span className="text-blue-600 text-xs font-semibold">{quotingCustomersCount} đang đàm phán</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Giá trị pipeline: {formatVND(totalQuotingValue)}</p>
        </div>

        {/* Metric 3: Low stock / Reserve */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Tồn kho báo động</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-rose-600">{lowStockItems.length} mã</span>
            <span className="text-slate-500 text-xs font-medium">Cần đặt thêm</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tự tách Bảng Đặt Hàng khi chốt</p>
        </div>

        {/* Metric 4: Customers */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
            {isManagerC1 ? 'Khách hàng phụ trách (Phòng)' : 'Khách hàng của tôi'}
          </p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{filteredCustomers.length}</span>
            <span className="text-emerald-600 text-xs font-semibold">+{newCustomersCount} mới</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{signedCustomersCount} khách đã chốt hợp đồng</p>
        </div>
      </div>

      {/* High Density Main Workspace: 12-col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Sales Monitor / Quotations Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col min-h-0">
          <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center">
              <span className="mr-2">📝</span>
              <span>{isManagerC1 ? 'Theo dõi Sale C2 & Báo giá phòng' : 'Danh sách báo giá của tôi'}</span>
            </h3>
            <div className="flex items-center space-x-2">
              {isManagerC1 && salesReps.length > 0 && (
                <select
                  value={selectedRepFilter}
                  onChange={(e) => setSelectedRepFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded px-2 py-1 bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="all">Tất cả nhân viên phòng ({salesReps.length})</option>
                  {salesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name} (L2)
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setActiveTab('quotations')}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
              >
                Xem tất cả →
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider">Mã KH / Tiêu đề</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider">Nhân viên</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider">Giá trị Báo giá</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider">Giai đoạn</th>
                  <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {filteredQuotesForDashboard.slice(0, 6).map((quote) => {
                  const isContract = quote.isContractQuote;
                  return (
                    <tr
                      key={quote.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isContract ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="p-2.5 sm:p-3">
                        <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                          <span className="font-mono text-blue-600">{quote.quoteNumber}</span>
                          <span>-</span>
                          <span className="truncate max-w-[180px]">{quote.customerName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[240px]">
                          {quote.title} • {formatDate(quote.date)}
                        </div>
                      </td>

                      <td className="p-2.5 sm:p-3 text-slate-700 font-medium whitespace-nowrap">
                        {quote.salesRepName}
                      </td>

                      <td className="p-2.5 sm:p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className={isContract ? 'text-emerald-600' : 'text-blue-600'}>
                          {formatVND(quote.grandTotal)}
                        </span>
                      </td>

                      <td className="p-2.5 sm:p-3 whitespace-nowrap">
                        {isContract ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 border border-green-200 rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                            <span>✓ Ký HĐ / Đã Tách Kho</span>
                          </span>
                        ) : quote.status === 'negotiating' ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                            Đang đàm phán (Đợt {quote.version})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                            Đã gửi v{quote.version}
                          </span>
                        )}
                      </td>

                      <td className="p-2.5 sm:p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedQuoteForModal(quote);
                              setIsCreateQuoteModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs px-2 py-0.5 rounded hover:bg-blue-50"
                          >
                            Chi tiết
                          </button>
                          {isContract && (
                            <button
                              onClick={() => setPdfPreviewData({ type: 'quote', data: quote })}
                              className="bg-slate-800 hover:bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-medium"
                            >
                              Xuất PDF
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredQuotesForDashboard.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                      Chưa có báo giá nào phù hợp với dữ liệu được phân quyền.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (4 cols): Data Giá & Tồn Kho Flash Card */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col min-h-0">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
              <span>📦</span>
              <span>Data Giá & Tồn Kho (Dùng Chung)</span>
            </h3>
            <button
              onClick={() => setActiveTab('products')}
              className="text-[10px] text-blue-600 font-bold hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="p-2.5 bg-amber-50 text-[11px] text-amber-900 border-b border-amber-100 flex items-center space-x-1.5">
            <span className="font-bold text-amber-800 shrink-0">Lưu ý:</span>
            <span>Giá DP là giá tối thiểu sàn Sale được phép chào khách.</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[420px]">
            {products.slice(0, 5).map((p) => {
              const inv = inventory.find((i) => i.sku === p.sku);
              const isLow = inv ? inv.availableQuantity <= 5 : true;
              const isOut = inv ? inv.availableQuantity === 0 : true;

              return (
                <div
                  key={p.sku}
                  className="border border-slate-200 rounded-md p-2.5 text-xs space-y-1 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-900 font-mono">{p.sku}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isOut
                          ? 'bg-rose-100 text-rose-700'
                          : isLow
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {inv ? `Còn: ${inv.availableQuantity} ${inv.unit}` : 'Hết hàng'}
                    </span>
                  </div>

                  <div className="text-slate-600 text-[11px] truncate">
                    {p.name} ({p.color} - {p.size})
                  </div>

                  <div className="grid grid-cols-2 pt-1 border-t border-slate-100 mt-1">
                    <div>
                      <p className="text-[10px] text-slate-400">Giá Niêm Yết</p>
                      <p className="font-mono text-slate-700 font-medium">{formatVND(p.listPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-red-500 font-bold">Giá DP (Min)</p>
                      <p className="font-mono text-red-600 font-bold">{formatVND(p.dpPrice)}</p>
                    </div>
                  </div>

                  {isOut && (
                    <div className="mt-1 bg-red-50 text-red-700 text-[10px] py-0.5 px-1 text-center font-bold rounded">
                      Auto: Tự động chuyển Bảng Đặt Hàng khi chốt
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Customer Pipeline Flow Strip */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <span>🤝</span>
              <span>{isManagerC1 ? 'Tiến độ Khách Hàng Phòng & Pipeline' : 'Tiến độ Khách Hàng Của Tôi & Pipeline'}</span>
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('customers')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            Quản lý phễu khách hàng →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded bg-sky-50 border border-sky-200">
            <div className="flex items-center justify-between text-sky-800 text-xs font-bold">
              <span>1. Tạo mới</span>
              <span className="w-5 h-5 rounded-full bg-sky-200 flex items-center justify-center text-xs">
                {newCustomersCount}
              </span>
            </div>
            <div className="text-[10px] text-sky-600 mt-1">Phân bổ / Tiếp nhận</div>
          </div>

          <div className="p-2.5 rounded bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between text-blue-800 text-xs font-bold">
              <span>2. Đang tiếp cận</span>
              <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs">
                {filteredCustomers.filter((c) => c.stage === 'contacted').length}
              </span>
            </div>
            <div className="text-[10px] text-blue-600 mt-1">Khảo sát dự án</div>
          </div>

          <div className="p-2.5 rounded bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
              <span>3. Đang báo giá</span>
              <span className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-xs">
                {quotingCustomersCount}
              </span>
            </div>
            <div className="text-[10px] text-amber-600 mt-1">Gửi v1, v2 & đàm phán</div>
          </div>

          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
              <span>4. Chốt Ký HĐ</span>
              <span className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center text-xs">
                {signedCustomersCount}
              </span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-1">Đã ký HĐ & Tách kho</div>
          </div>
        </div>
      </div>
    </div>
  );
};
