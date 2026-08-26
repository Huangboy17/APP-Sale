import React, { useState } from 'react';
import { Customer, CustomerStage } from '../../types';
import { useApp } from '../../context/AppContext';
import { CustomerModal } from './CustomerModal';
import { formatVND, formatDate, getCustomerStageConfig } from '../../utils/formatters';
import {
  Plus,
  Search,
  Filter,
  Columns,
  Table as TableIcon,
  Phone,
  Mail,
  Building,
  MapPin,
  FileText,
  FileSignature,
  MoreVertical,
  Edit2,
  Trash2,
  UserCheck,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserPlus,
} from 'lucide-react';

export const CustomerList: React.FC = () => {
  const {
    currentUser,
    filteredCustomers,
    quotations,
    updateCustomerStage,
    deleteCustomer,
    assignCustomer,
    users,
    setIsCreateQuoteModalOpen,
    setSelectedCustomerIdForQuote,
    setSelectedQuoteForModal,
    setActiveTab,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerToEdit, setSelectedCustomerToEdit] = useState<Customer | null>(null);

  // History modal state
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  const isManagerOrAdmin = currentUser.role === 'super_admin' || currentUser.role === 'manager_c1';

  // Filtering
  const displayedCustomers = filteredCustomers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStage = stageFilter === 'all' || c.stage === stageFilter;
    const matchSales = salesFilter === 'all' || c.assignedToId === salesFilter;

    return matchSearch && matchStage && matchSales;
  });

  const handleCreateCustomer = () => {
    setSelectedCustomerToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomerToEdit(customer);
    setIsModalOpen(true);
  };

  const handleCreateQuoteForCustomer = (customerId: string) => {
    setSelectedQuoteForModal(null);
    setSelectedCustomerIdForQuote(customerId);
    setIsCreateQuoteModalOpen(true);
  };

  const stages: { key: CustomerStage; label: string; bg: string }[] = [
    { key: 'new', label: '1. Tạo Mới', bg: 'border-t-4 border-sky-500' },
    { key: 'contacted', label: '2. Đang Tiếp Cận', bg: 'border-t-4 border-blue-500' },
    { key: 'quoting', label: '3. Đang Báo Giá', bg: 'border-t-4 border-amber-500' },
    { key: 'contract_signed', label: '4. Chốt - Ký HĐ', bg: 'border-t-4 border-emerald-500' },
    { key: 'rejected', label: '5. Từ Chối / Mất', bg: 'border-t-4 border-rose-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>👥</span>
            <span>Quản Lý Khách Hàng & Pipeline Bán Hàng</span>
          </h1>
          <p className="text-xs text-slate-500">
            {currentUser.role === 'sales_c2'
              ? 'Danh sách khách hàng bạn được giao & tự tạo mới. Theo dõi từ khâu tạo mới đến chốt hợp đồng.'
              : 'Theo dõi tình hình khách hàng của toàn phòng kinh doanh, phân công Sales Cấp 2 chăm sóc.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="bg-slate-100 p-0.5 rounded-md flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === 'kanban' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Xem dạng bảng Kanban"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === 'table' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Xem dạng danh sách"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Bảng</span>
            </button>
          </div>

          <button
            onClick={handleCreateCustomer}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-2xs transition active:scale-95 flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm Khách Hàng</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, mã KH, công ty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-hidden font-medium text-slate-700"
          >
            <option value="all">Tất cả giai đoạn ({filteredCustomers.length})</option>
            <option value="new">1. Tạo mới</option>
            <option value="contacted">2. Đang tiếp cận</option>
            <option value="quoting">3. Đang báo giá</option>
            <option value="contract_signed">4. Chốt - Đã ký HĐ</option>
            <option value="rejected">5. Từ chối / Mất</option>
          </select>

          {/* Sales Filter (Manager / Admin) */}
          {isManagerOrAdmin && (
            <select
              value={salesFilter}
              onChange={(e) => setSalesFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-hidden font-medium text-slate-700"
            >
              <option value="all">Tất cả Sales phụ trách</option>
              {users
                .filter((u) => u.role === 'sales_c2')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {stages.map((st) => {
            const stageCustomers = displayedCustomers.filter((c) => c.stage === st.key);
            const totalStageValue = stageCustomers.reduce((sum, c) => sum + (c.expectedValue || 0), 0);

            return (
              <div
                key={st.key}
                className={`bg-slate-100/70 rounded-lg p-2.5 flex flex-col min-h-[500px] ${st.bg} shadow-xs border border-slate-200`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{st.label}</h3>
                    <div className="text-[10px] text-slate-500 font-medium">{formatVND(totalStageValue)}</div>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-white text-slate-700 text-[10px] font-bold flex items-center justify-center shadow-2xs border border-slate-200">
                    {stageCustomers.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {stageCustomers.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-400">
                      Chưa có khách hàng
                    </div>
                  ) : (
                    stageCustomers.map((cust) => {
                      const customerQuotes = quotations.filter((q) => q.customerId === cust.id);
                      const hasContractQuote = customerQuotes.some((q) => q.isContractQuote);

                      return (
                        <div
                          key={cust.id}
                          className="bg-white rounded-md p-2.5 border border-slate-200 shadow-2xs hover:border-blue-300 transition group relative text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded">
                              {cust.code}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEditCustomer(cust)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">{cust.name}</h4>
                          {cust.company && (
                            <p className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5 line-clamp-1">
                              <Building className="w-2.5 h-2.5 shrink-0" />
                              <span>{cust.company}</span>
                            </p>
                          )}

                          <div className="text-[10px] text-slate-600 mt-1 flex items-center space-x-1">
                            <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{cust.phone}</span>
                          </div>

                          {cust.expectedValue > 0 && (
                            <div className="mt-1.5 text-[11px] font-bold text-emerald-700">
                              Dự kiến: {formatVND(cust.expectedValue)}
                            </div>
                          )}

                          {/* Quotes badges */}
                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <button
                              onClick={() => setHistoryCustomer(cust)}
                              className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                            >
                              <History className="w-2.5 h-2.5" />
                              <span>{customerQuotes.length} đợt báo giá</span>
                            </button>

                            {hasContractQuote && (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                Đã chốt HĐ
                              </span>
                            )}
                          </div>

                          {/* Rejection reason alert */}
                          {cust.stage === 'rejected' && cust.rejectReason && (
                            <div className="mt-1.5 p-1.5 bg-rose-50 rounded text-[9px] text-rose-800 border border-rose-200">
                              <span className="font-bold">Lý do:</span> {cust.rejectReason}
                            </div>
                          )}

                          {/* Sales Rep tag */}
                          <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Phụ trách:</span>
                            <span className="font-medium text-slate-700">{cust.assignedToName}</span>
                          </div>

                          {/* Quick Action Button on Card */}
                          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1">
                            <button
                              onClick={() => handleCreateQuoteForCustomer(cust.id)}
                              className="flex-1 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              <span>+ Báo Giá</span>
                            </button>

                            {/* Quick Move Stage Dropdown */}
                            <select
                              value={cust.stage}
                              onChange={(e) => updateCustomerStage(cust.id, e.target.value as CustomerStage)}
                              className="w-16 py-1 px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold outline-hidden cursor-pointer"
                              title="Chuyển giai đoạn"
                            >
                              <option value="new">Tạo mới</option>
                              <option value="contacted">Tiếp cận</option>
                              <option value="quoting">Báo giá</option>
                              <option value="contract_signed">Chốt HĐ</option>
                              <option value="rejected">Từ chối</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3 py-2.5">Mã KH</th>
                  <th className="px-3 py-2.5">Tên Khách Hàng / Công Ty</th>
                  <th className="px-3 py-2.5">Liên Hệ</th>
                  <th className="px-3 py-2.5">Giai Đoạn</th>
                  <th className="px-3 py-2.5">Sales Phụ Trách</th>
                  <th className="px-3 py-2.5">Báo Giá</th>
                  <th className="px-3 py-2.5 text-right">Giá Trị Dự Kiến</th>
                  <th className="px-3 py-2.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Không tìm thấy khách hàng nào phù hợp
                    </td>
                  </tr>
                ) : (
                  displayedCustomers.map((cust) => {
                    const stageCfg = getCustomerStageConfig(cust.stage);
                    const customerQuotes = quotations.filter((q) => q.customerId === cust.id);

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 py-2 font-mono font-bold text-blue-600">{cust.code}</td>
                        <td className="px-3 py-2">
                          <div className="font-bold text-slate-900">{cust.name}</div>
                          {cust.company && <div className="text-[10px] text-slate-500">{cust.company}</div>}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-800">{cust.phone}</div>
                          {cust.email && <div className="text-[10px] text-slate-500">{cust.email}</div>}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageCfg.bg}`}>
                            {stageCfg.label}
                          </span>
                          {cust.stage === 'rejected' && cust.rejectReason && (
                            <div className="text-[9px] text-rose-600 mt-0.5 max-w-xs">{cust.rejectReason}</div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isManagerOrAdmin ? (
                            <select
                              value={cust.assignedToId}
                              onChange={(e) => {
                                const selectedU = users.find((u) => u.id === e.target.value);
                                if (selectedU) {
                                  assignCustomer(cust.id, selectedU.id, selectedU.name);
                                }
                              }}
                              className="text-xs border border-slate-300 rounded px-1.5 py-0.5 bg-white font-medium"
                            >
                              {users
                                .filter((u) => u.role === 'sales_c2' || u.id === currentUser.id)
                                .map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <span className="font-medium text-slate-800">{cust.assignedToName}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setHistoryCustomer(cust)}
                            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                          >
                            <History className="w-3 h-3" />
                            <span>{customerQuotes.length} phiên bản</span>
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono">
                          {formatVND(cust.expectedValue)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleCreateQuoteForCustomer(cust.id)}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold"
                              title="Tạo báo giá mới"
                            >
                              + Báo giá
                            </button>
                            <button
                              onClick={() => handleEditCustomer(cust)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-3 h-3" />
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
      )}

      {/* Customer Modal Create/Edit */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customerToEdit={selectedCustomerToEdit}
      />

      {/* Quote History Modal for Customer */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Lịch Sử Các Đợt Báo Giá - {historyCustomer.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Lưu trữ từng đợt báo giá (v1, v2, v3...) cho đến khi chọn báo giá chốt ký hợp đồng
                </p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {quotations.filter((q) => q.customerId === historyCustomer.id).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Chưa có báo giá nào cho khách hàng này.
                </div>
              ) : (
                quotations
                  .filter((q) => q.customerId === historyCustomer.id)
                  .sort((a, b) => b.version - a.version)
                  .map((q) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition flex items-center justify-between bg-slate-50/60"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-blue-700">{q.quoteNumber}</span>
                          {q.isContractQuote ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Báo Giá Chốt Ký HĐ
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              Báo Giá Lần {q.version}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 font-medium">{q.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Ngày tạo: {formatDate(q.date)} • {q.items.length} mặt hàng
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">{formatVND(q.grandTotal)}</div>
                        <button
                          onClick={() => {
                            setHistoryCustomer(null);
                            setSelectedQuoteForModal(q);
                            setIsCreateQuoteModalOpen(true);
                          }}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Mở cửa sổ báo giá →
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  const custId = historyCustomer.id;
                  setHistoryCustomer(null);
                  handleCreateQuoteForCustomer(custId);
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
              >
                + Tạo Đợt Báo Giá Mới (v{quotations.filter((q) => q.customerId === historyCustomer.id).length + 1})
              </button>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
