import React, { useState } from 'react';
import { Customer, CustomerStage, Quotation, QuotationStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { CustomerModal } from './CustomerModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { formatVND, formatDate, getCustomerStageConfig, getQuotationStatusConfig } from '../../utils/formatters';
import confetti from 'canvas-confetti';
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
  Printer,
  Copy,
  Check,
  ChevronRight,
  Eye,
  Layers,
} from 'lucide-react';

export const CustomerList: React.FC = () => {
  const {
    currentUser,
    filteredCustomers,
    filteredQuotations,
    updateCustomerStage,
    deleteCustomer,
    assignCustomer,
    clearSpecificData,
    setIsClearDataModalOpen,
    users,
    setIsCreateQuoteModalOpen,
    setSelectedCustomerIdForQuote,
    setSelectedQuoteForModal,
    setPdfPreviewData,
    updateQuotationStatus,
    cloneQuotationToNextRound,
    finalizeQuoteToContract,
    setActiveTab,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerToEdit, setSelectedCustomerToEdit] = useState<Customer | null>(null);

  // Selected customer for full detail modal
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);

  const isManagerOrAdmin = currentUser.role === 'super_admin' || currentUser.role === 'manager_c1';

  // Selectable sales reps for filter: if manager C1, only show their managed C2s
  const selectableSalesReps = users.filter((u) => {
    if (u.role !== 'sales_c2') return false;
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'manager_c1') {
      return u.managerId === currentUser.id || u.createdBy === currentUser.id;
    }
    return false;
  });

  // Filtering
  const displayedCustomers = filteredCustomers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStage = stageFilter === 'all' || c.stage === stageFilter;
    const matchSales = salesFilter === 'all' || c.assignedToId === salesFilter;

    return matchSearch && matchStage && matchSales;
  });

  const handleCreateCustomer = () => {
    setSelectedCustomerToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCustomerToEdit(customer);
    setIsModalOpen(true);
  };

  const handleOpenCustomerDetail = (customer: Customer) => {
    setSelectedCustomerForDetail(customer);
  };

  const handleCreateQuoteForCustomer = (customerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
            <span>Danh Sách Khách Hàng & Quản Lý Báo Giá</span>
          </h1>
          <p className="text-xs text-slate-500">
            Bảng theo dõi khách hàng theo Tên, Mã KH, SĐT, Địa chỉ, Tình trạng. Nhấp vào khách hàng để xem chi tiết & theo dõi các đợt báo giá.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="bg-slate-100 p-0.5 rounded-md flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === 'table' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Xem dạng danh sách bảng"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Bảng Danh Sách</span>
            </button>
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
          </div>

          {currentUser.role === 'manager_c1' && (
            <button
              onClick={() => {
                if (filteredCustomers.length === 0) {
                  alert('Không có khách hàng nào để xoá.');
                  return;
                }
                if (window.confirm(`Bạn có chắc chắn muốn xoá ${filteredCustomers.length} khách hàng của doanh nghiệp bạn không? Hành động này sẽ xoá trên cả máy và Cloud Firestore. Dữ liệu của các doanh nghiệp khác và tài khoản đăng nhập không bị ảnh hưởng.`)) {
                  clearSpecificData({ clearCustomers: true });
                }
              }}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
              title="Xoá danh sách khách hàng của doanh nghiệp"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Xoá Hết KH</span>
            </button>
          )}

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
        <div className="relative w-full md:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, mã KH, địa chỉ, công ty..."
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
            <option value="all">Tất cả tình trạng ({filteredCustomers.length})</option>
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
              <option value="all">Tất cả Sales phụ trách ({selectableSalesReps.length})</option>
              {selectableSalesReps.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* PRIMARY VIEW: TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3.5 py-3 w-24">Mã KH</th>
                  <th className="px-3.5 py-3">Tên Khách Hàng / Công Ty</th>
                  <th className="px-3.5 py-3">Số Điện Thoại</th>
                  <th className="px-3.5 py-3">Địa Chỉ / Công Trình</th>
                  <th className="px-3.5 py-3 text-center">Tình Trạng</th>
                  <th className="px-3.5 py-3">Báo Giá Từng Đợt</th>
                  <th className="px-3.5 py-3">Sales Phụ Trách</th>
                  <th className="px-3.5 py-3 text-right">Giá Trị Dự Kiến</th>
                  <th className="px-3.5 py-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      Không tìm thấy khách hàng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  displayedCustomers.map((cust) => {
                    const stageCfg = getCustomerStageConfig(cust.stage);
                    const customerQuotes = filteredQuotations.filter((q) => q.customerId === cust.id);
                    const contractQuote = customerQuotes.find((q) => q.isContractQuote);

                    return (
                      <tr
                        key={cust.id}
                        onClick={() => handleOpenCustomerDetail(cust)}
                        className="hover:bg-blue-50/50 transition cursor-pointer group"
                      >
                        {/* Mã KH */}
                        <td className="px-3.5 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          <span className="bg-blue-50 group-hover:bg-blue-100 px-1.5 py-0.5 rounded transition">
                            {cust.code}
                          </span>
                        </td>

                        {/* Tên & Công ty */}
                        <td className="px-3.5 py-3">
                          <div className="font-bold text-slate-900 text-xs flex items-center space-x-1">
                            <span className="group-hover:text-blue-700 transition">{cust.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                          </div>
                          {cust.company && (
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                              <Building className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="line-clamp-1">{cust.company}</span>
                            </div>
                          )}
                        </td>

                        {/* Số điện thoại */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <a
                              href={`tel:${cust.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-blue-600 hover:underline"
                            >
                              {cust.phone}
                            </a>
                          </div>
                          {cust.email && (
                            <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                              <Mail className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate max-w-[140px]">{cust.email}</span>
                            </div>
                          )}
                        </td>

                        {/* Địa chỉ */}
                        <td className="px-3.5 py-3 max-w-xs">
                          {cust.address ? (
                            <div className="text-xs text-slate-700 flex items-start space-x-1">
                              <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{cust.address}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa có địa chỉ</span>
                          )}
                        </td>

                        {/* Tình trạng */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageCfg.bg}`}>
                              {stageCfg.label}
                            </span>
                            {contractQuote && (
                              <span className="text-[9px] font-bold text-emerald-700 mt-0.5 flex items-center space-x-0.5">
                                <Check className="w-2.5 h-2.5" />
                                <span>Đã ký HĐ</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Báo giá từng đợt */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCustomerDetail(cust);
                            }}
                            className="px-2 py-1 rounded bg-slate-100 group-hover:bg-white text-blue-700 hover:bg-blue-100 font-semibold text-[11px] flex items-center space-x-1.5 transition border border-slate-200"
                          >
                            <Layers className="w-3 h-3 text-blue-600" />
                            <span>{customerQuotes.length} đợt báo giá</span>
                          </button>
                        </td>

                        {/* Sales phụ trách */}
                        <td className="px-3.5 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {isManagerOrAdmin ? (
                            <select
                              value={cust.assignedToId}
                              onChange={(e) => {
                                const selectedU = users.find((u) => u.id === e.target.value);
                                if (selectedU) {
                                  assignCustomer(cust.id, selectedU.id, selectedU.name);
                                }
                              }}
                              className="text-xs border border-slate-300 rounded px-2 py-1 bg-white font-medium focus:ring-1 focus:ring-blue-500 outline-hidden"
                            >
                              {users
                                .filter((u) => (u.role === 'sales_c2' || u.id === currentUser.id) && (u.managerId === currentUser.id || u.createdBy === currentUser.id || u.organizationId === currentUser.organizationId || u.id === currentUser.id))
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

                        {/* Giá trị dự kiến */}
                        <td className="px-3.5 py-3 text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                          {formatVND(cust.expectedValue)}
                        </td>

                        {/* Thao tác */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenCustomerDetail(cust)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold transition flex items-center space-x-1"
                              title="Xem chi tiết & lịch sử báo giá"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Chi Tiết</span>
                            </button>
                            <button
                              onClick={(e) => handleCreateQuoteForCustomer(cust.id, e)}
                              className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition"
                              title="Tạo báo giá mới"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleEditCustomer(cust, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
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
      ) : (
        /* KANBAN BOARD VIEW */
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
                      const customerQuotes = filteredQuotations.filter((q) => q.customerId === cust.id);
                      const hasContractQuote = customerQuotes.some((q) => q.isContractQuote);

                      return (
                        <div
                          key={cust.id}
                          onClick={() => handleOpenCustomerDetail(cust)}
                          className="bg-white rounded-md p-2.5 border border-slate-200 shadow-2xs hover:border-blue-300 transition group relative text-xs cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded">
                              {cust.code}
                            </span>
                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleEditCustomer(cust, e)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1 group-hover:text-blue-700 transition">
                            {cust.name}
                          </h4>
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

                          {cust.address && (
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-start space-x-1 line-clamp-1">
                              <MapPin className="w-2.5 h-2.5 text-slate-400 mt-0.5 shrink-0" />
                              <span>{cust.address}</span>
                            </div>
                          )}

                          {cust.expectedValue > 0 && (
                            <div className="mt-1.5 text-[11px] font-bold text-emerald-700">
                              Dự kiến: {formatVND(cust.expectedValue)}
                            </div>
                          )}

                          {/* Quotes badges */}
                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCustomerDetail(cust);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                            >
                              <Layers className="w-2.5 h-2.5" />
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
                          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleCreateQuoteForCustomer(cust.id, e)}
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
      )}

      {/* Customer Modal Create/Edit */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customerToEdit={selectedCustomerToEdit}
      />

      {/* Customer Detail & Quotations Tracker Modal */}
      <CustomerDetailModal
        isOpen={!!selectedCustomerForDetail}
        customer={selectedCustomerForDetail}
        onClose={() => setSelectedCustomerForDetail(null)}
        onEditCustomer={(cust) => {
          setSelectedCustomerToEdit(cust);
          setIsModalOpen(true);
        }}
      />
    </div>
  );
};

