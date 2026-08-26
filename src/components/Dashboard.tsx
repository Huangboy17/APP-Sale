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
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    currentUser,
    filteredCustomers,
    filteredQuotations,
    filteredContracts,
    reserveItems,
    orderItems,
    inventory,
    products,
    users,
    setActiveTab,
    setIsCreateQuoteModalOpen,
    setSelectedCustomerIdForQuote,
    setSelectedQuoteForModal,
    setPdfPreviewData,
  } = useApp();

  const [selectedRepFilter, setSelectedRepFilter] = useState<string>('all');

  // Metrics
  const totalSignedValue = filteredContracts.reduce((sum, c) => sum + c.totalValue, 0);
  const totalQuotingValue = filteredQuotations
    .filter((q) => q.status === 'sent' || q.status === 'negotiating')
    .reduce((sum, q) => sum + q.grandTotal, 0);

  const newCustomersCount = filteredCustomers.filter((c) => c.stage === 'new').length;
  const quotingCustomersCount = filteredCustomers.filter((c) => c.stage === 'quoting').length;
  const signedCustomersCount = filteredCustomers.filter((c) => c.stage === 'contract_signed').length;
  const lowStockItems = inventory.filter((i) => i.availableQuantity <= 5);

  const salesReps = users.filter((u) => u.role === 'sales_c2');

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
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Doanh số ký HĐ</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{formatVND(totalSignedValue)}</span>
            <span className="text-green-600 text-xs font-semibold">+{filteredContracts.length} HĐ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tổng giá trị hợp đồng chính thức</p>
        </div>

        {/* Metric 2: Active Quotes */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Báo giá đang mở</p>
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
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Khách hàng hệ thống</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{filteredCustomers.length}</span>
            <span className="text-emerald-600 text-xs font-semibold">+{newCustomersCount} mới</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{signedCustomersCount} khách đã chốt hợp đồng</p>
        </div>
      </div>

      {/* High Density Main Workspace: 12-col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Sales L2 Monitor & Quotations Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col min-h-0">
          <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center">
              <span className="mr-2">📝</span> Theo dõi Sale L2 & Báo giá chốt
            </h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedRepFilter}
                onChange={(e) => setSelectedRepFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="all">Tất cả nhân viên ({salesReps.length})</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name} (L2)
                  </option>
                ))}
              </select>
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
                      Chưa có báo giá nào phù hợp với bộ lọc nhân viên đã chọn.
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
              <span>Data Giá & Tồn Kho</span>
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
                    {p.name} ({p.color} - {p.spec})
                  </div>

                  <div className="grid grid-cols-2 pt-1 border-t border-slate-100 mt-1">
                    <div>
                      <p className="text-[10px] text-slate-400">Giá Niêm Yết</p>
                      <p className="font-mono text-slate-700 font-medium">{formatVND(p.listedPrice)}</p>
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
              <span>Tiến độ Khách Hàng & Phễu Chốt Đơn (Pipeline)</span>
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
