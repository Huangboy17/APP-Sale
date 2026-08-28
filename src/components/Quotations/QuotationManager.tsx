import React, { useState } from 'react';
import { Quotation, QuotationStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatVND, formatDate, getQuotationStatusConfig } from '../../utils/formatters';
import { CreateContractFromQuoteModal } from '../Contracts/CreateContractFromQuoteModal';
import confetti from 'canvas-confetti';
import {
  Plus,
  Search,
  FileText,
  Printer,
  FileSignature,
  History,
  CheckCircle2,
  Trash2,
  Edit,
  ExternalLink,
  ChevronRight,
  Filter,
  User,
  Building,
  Send,
  Copy,
  Layers,
  List,
  Sparkles,
  ChevronDown,
  Check,
} from 'lucide-react';

export const QuotationManager: React.FC = () => {
  const {
    currentUser,
    filteredQuotations,
    filteredCustomers,
    setIsCreateQuoteModalOpen,
    setSelectedQuoteForModal,
    setSelectedCustomerIdForQuote,
    setPdfPreviewData,
    updateQuotationStatus,
    cloneQuotationToNextRound,
    deleteQuotation,
    finalizeQuoteToContract,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomerIdFilter, setSelectedCustomerIdFilter] = useState<string>('all');
  const [activeViewMode, setActiveViewMode] = useState<'by_customer' | 'all_table'>('by_customer');
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<Record<string, boolean>>({});

  // Contract Generation Modal State
  const [createContractQuote, setCreateContractQuote] = useState<Quotation | null>(null);
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);

  // Filtered quotations
  const displayedQuotes = filteredQuotations.filter((q) => {
    const matchSearch =
      q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customerCompany && q.customerCompany.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchCust = selectedCustomerIdFilter === 'all' || q.customerId === selectedCustomerIdFilter;

    return matchSearch && matchStatus && matchCust;
  });

  // Group quotations by customer
  const customerGroupMap = new Map<string, Quotation[]>();
  filteredCustomers.forEach((cust) => {
    customerGroupMap.set(cust.id, []);
  });

  displayedQuotes.forEach((q) => {
    const list = customerGroupMap.get(q.customerId) || [];
    list.push(q);
    customerGroupMap.set(q.customerId, list);
  });

  // Sort rounds inside each customer from newest version to oldest
  customerGroupMap.forEach((quotes) => {
    quotes.sort((a, b) => b.version - a.version);
  });

  const toggleExpandCustomer = (customerId: string) => {
    setExpandedCustomerIds((prev) => ({
      ...prev,
      [customerId]: !prev[customerId],
    }));
  };

  const handleOpenNewQuote = (customerId?: string) => {
    setSelectedQuoteForModal(null);
    setSelectedCustomerIdForQuote(customerId || null);
    setIsCreateQuoteModalOpen(true);
  };

  const handleEditQuote = (quote: Quotation) => {
    setSelectedQuoteForModal(quote);
    setIsCreateQuoteModalOpen(true);
  };

  const handlePreviewPDF = (quote: Quotation) => {
    setPdfPreviewData({ type: 'quote', data: quote });
  };

  const handleOpenCreateContract = (quote: Quotation) => {
    setCreateContractQuote(quote);
    setIsCreateContractOpen(true);
  };

  const handleStatusChange = (quote: Quotation, newStatus: QuotationStatus) => {
    if (newStatus === 'approved_contract') {
      // Mở modal tạo hợp đồng để người dùng chọn mẫu, kiểm tra và xác nhận
      setCreateContractQuote(quote);
      setIsCreateContractOpen(true);
    } else {
      updateQuotationStatus(quote.id, newStatus);
    }
  };

  const handleCloneNextRound = (quote: Quotation) => {
    const newQuote = cloneQuotationToNextRound(quote.id);
    if (newQuote) {
      setSelectedQuoteForModal(newQuote);
      setIsCreateQuoteModalOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>📑</span>
            <span>Quản Lý Báo Giá Theo Khách Hàng & Từng Đợt</span>
          </h1>
          <p className="text-xs text-slate-500">
            Lưu vết từng đợt báo giá (v1, v2, v3...) theo từng khách hàng. Khi báo giá chuyển sang trạng thái{' '}
            <strong className="text-emerald-700 font-bold">"Đã Chốt"</strong> sẽ tự động làm hợp đồng và khách hàng chuyển sang{' '}
            <strong className="text-emerald-700 font-bold">"Đã Chốt"</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className="bg-slate-100 p-0.5 rounded-md flex items-center border border-slate-200">
            <button
              onClick={() => setActiveViewMode('by_customer')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition ${
                activeViewMode === 'by_customer' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Theo Khách Hàng</span>
            </button>
            <button
              onClick={() => setActiveViewMode('all_table')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition ${
                activeViewMode === 'all_table' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tất Cả Báo Giá</span>
            </button>
          </div>

          <button
            id="btn-create-new-quote"
            onClick={() => handleOpenNewQuote()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-2xs transition active:scale-95 flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tạo Báo Giá Mới</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo số báo giá, khách hàng, tên dự án..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Customer filter */}
          <select
            value={selectedCustomerIdFilter}
            onChange={(e) => setSelectedCustomerIdFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-hidden font-medium text-slate-700"
          >
            <option value="all">Tất cả khách hàng ({filteredCustomers.length})</option>
            {filteredCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.company ? `(${c.company})` : ''}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-hidden font-medium text-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="sent">Đã gửi khách</option>
            <option value="negotiating">Đang đàm phán</option>
            <option value="approved_contract">Đã chốt ký HĐ</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: CUSTOMER-CENTRIC BATCHES VIEW */}
      {activeViewMode === 'by_customer' && (
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
              Chưa có khách hàng nào.
            </div>
          ) : (
            filteredCustomers
              .filter((cust) => {
                if (selectedCustomerIdFilter !== 'all' && cust.id !== selectedCustomerIdFilter) return false;
                const custQuotes = customerGroupMap.get(cust.id) || [];
                if (searchTerm && custQuotes.length === 0) {
                  const matchName =
                    cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cust.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cust.company && cust.company.toLowerCase().includes(searchTerm.toLowerCase()));
                  return matchName;
                }
                return true;
              })
              .map((cust) => {
                const custQuotes = customerGroupMap.get(cust.id) || [];
                const contractQuote = custQuotes.find((q) => q.isContractQuote);
                const isExpanded = expandedCustomerIds[cust.id] !== false; // Default expanded

                return (
                  <div
                    key={cust.id}
                    className={`bg-white rounded-lg border transition shadow-2xs overflow-hidden ${
                      contractQuote ? 'border-emerald-300 bg-emerald-50/10' : 'border-slate-200'
                    }`}
                  >
                    {/* Customer Header Bar */}
                    <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleExpandCustomer(cust.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                          title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                        </button>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                              {cust.code}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900">{cust.name}</h3>
                            {cust.company && (
                              <span className="text-xs text-slate-500 flex items-center space-x-1">
                                <Building className="w-3 h-3 text-slate-400" />
                                <span>{cust.company}</span>
                              </span>
                            )}
                            {contractQuote ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>Khách Hàng Đã Chốt HĐ</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                                Đang Đàm Phán / Báo Giá
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3">
                            <span>SĐT: {cust.phone}</span>
                            <span>Phụ trách: <strong>{cust.assignedToName}</strong></span>
                            <span>Số đợt báo giá: <strong>{custQuotes.length} đợt</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Quick action buttons for this customer */}
                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenNewQuote(cust.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition flex items-center space-x-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Tạo Đợt {custQuotes.length + 1}</span>
                        </button>
                      </div>
                    </div>

                    {/* Quotation Batches List */}
                    {isExpanded && (
                      <div className="p-3">
                        {custQuotes.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs bg-slate-50/50 rounded border border-dashed border-slate-200">
                            Chưa có đợt báo giá nào cho khách hàng này.{' '}
                            <button
                              onClick={() => handleOpenNewQuote(cust.id)}
                              className="text-blue-600 hover:underline font-bold"
                            >
                              Tạo Đợt 1 ngay →
                            </button>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="px-3 py-2 text-center w-16">Đợt (Lần)</th>
                                  <th className="px-3 py-2">Số Báo Giá</th>
                                  <th className="px-3 py-2">Tiêu Đề / Dự Án</th>
                                  <th className="px-3 py-2">Ngày Lập</th>
                                  <th className="px-3 py-2 text-right">Tổng Tiền (VAT)</th>
                                  <th className="px-3 py-2 text-center">Trạng Thái Báo Giá</th>
                                  <th className="px-3 py-2 text-center">Thao Tác</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {custQuotes.map((q) => {
                                  const statusCfg = getQuotationStatusConfig(q.status);
                                  const isContract = q.isContractQuote;

                                  return (
                                    <tr
                                      key={q.id}
                                      className={`hover:bg-slate-50 transition ${
                                        isContract ? 'bg-emerald-50/40 font-medium' : ''
                                      }`}
                                    >
                                      <td className="px-3 py-2.5 text-center">
                                        <span
                                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                            isContract
                                              ? 'bg-emerald-600 text-white'
                                              : 'bg-slate-200 text-slate-800'
                                          }`}
                                        >
                                          Đợt {q.version}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 font-mono font-bold text-blue-700">
                                        {q.quoteNumber}
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <div className="font-semibold text-slate-800">{q.title}</div>
                                        <div className="text-[10px] text-slate-400">
                                          {q.items.length} mặt hàng • {q.milestones.length} đợt thanh toán
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                                        {formatDate(q.date)}
                                      </td>
                                      <td className="px-3 py-2.5 text-right font-bold text-slate-900 font-mono">
                                        {formatVND(q.grandTotal)}
                                      </td>
                                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                        {/* Status Switcher Selector */}
                                        <div className="inline-flex items-center space-x-1">
                                          <select
                                            value={q.status}
                                            onChange={(e) =>
                                              handleStatusChange(q, e.target.value as QuotationStatus)
                                            }
                                            className={`px-2 py-1 rounded text-[11px] font-bold border outline-hidden cursor-pointer ${
                                              q.status === 'approved_contract'
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                : q.status === 'sent'
                                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                                : q.status === 'negotiating'
                                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                                : 'bg-slate-100 text-slate-700 border-slate-300'
                                            }`}
                                          >
                                            <option value="draft">📝 Bản nháp</option>
                                            <option value="sent">📨 Đã gửi khách</option>
                                            <option value="negotiating">🤝 Đang đàm phán</option>
                                            <option value="approved_contract">🏆 Đã chốt (Làm HĐ)</option>
                                          </select>

                                          {isContract && (
                                            <span
                                              className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded ml-1"
                                              title="Báo giá chính thức làm Hợp Đồng"
                                            >
                                              ★ HĐ
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center space-x-1">
                                          <button
                                            onClick={() => handlePreviewPDF(q)}
                                            className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition cursor-pointer"
                                            title="Xem & Xuất PDF"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleCloneNextRound(q)}
                                            className="p-1 text-slate-500 hover:text-purple-600 rounded hover:bg-purple-50 transition cursor-pointer"
                                            title="Nhân bản tạo Đợt tiếp theo"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleOpenCreateContract(q)}
                                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer border border-emerald-200"
                                            title="Tạo hợp đồng từ báo giá này"
                                          >
                                            <FileSignature className="w-3 h-3 text-emerald-600" />
                                            <span>Tạo HĐ</span>
                                          </button>
                                          <button
                                            onClick={() => handleEditQuote(q)}
                                            className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition cursor-pointer"
                                          >
                                            {isContract ? 'Xem Chi Tiết' : 'Sửa / Chốt'}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* VIEW 2: FLAT ALL QUOTATIONS TABLE */}
      {activeViewMode === 'all_table' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3 py-2.5">Số Báo Giá</th>
                  <th className="px-3 py-2.5">Khách Hàng / Công Ty</th>
                  <th className="px-3 py-2.5">Tiêu Đề Dự Án</th>
                  <th className="px-3 py-2.5 text-center">Đợt (Lần)</th>
                  <th className="px-3 py-2.5">Ngày Lập</th>
                  <th className="px-3 py-2.5">Sales Phụ Trách</th>
                  <th className="px-3 py-2.5 text-right">Tổng Tiền (Có VAT)</th>
                  <th className="px-3 py-2.5 text-center">Trạng Thái Báo Giá</th>
                  <th className="px-3 py-2.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                      Chưa có báo giá nào phù hợp. Hãy bấm "+ Tạo Báo Giá Mới" để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  displayedQuotes.map((q) => {
                    const statusCfg = getQuotationStatusConfig(q.status);
                    const hasBelowDP = q.items.some((i) => i.isBelowDP);
                    const isContract = q.isContractQuote;

                    return (
                      <tr
                        key={q.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isContract ? 'bg-emerald-50/30 font-medium' : ''
                        }`}
                      >
                        <td className="px-3 py-2 font-mono font-bold text-blue-700">
                          <div>{q.quoteNumber}</div>
                          {hasBelowDP && (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1 py-0.2 rounded">
                              Dưới DP
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-bold text-slate-900">{q.customerName}</div>
                          {q.customerCompany && (
                            <div className="text-[10px] text-slate-500 line-clamp-1">{q.customerCompany}</div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-800 line-clamp-1">{q.title}</div>
                          <div className="text-[10px] text-slate-400">{q.items.length} chủng loại hàng</div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              isContract ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            Đợt {q.version}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 font-medium whitespace-nowrap">
                          {formatDate(q.date)}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                          {q.salesRepName}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono">
                          {formatVND(q.grandTotal)}
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <select
                            value={q.status}
                            onChange={(e) => handleStatusChange(q, e.target.value as QuotationStatus)}
                            className={`px-2 py-1 rounded text-[11px] font-bold border outline-hidden cursor-pointer ${
                              q.status === 'approved_contract'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : q.status === 'sent'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : q.status === 'negotiating'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="draft">📝 Bản nháp</option>
                            <option value="sent">📨 Đã gửi khách</option>
                            <option value="negotiating">🤝 Đang đàm phán</option>
                            <option value="approved_contract">🏆 Đã chốt (Làm HĐ)</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handlePreviewPDF(q)}
                              className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition cursor-pointer"
                              title="Xem & Xuất PDF Báo Giá"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCloneNextRound(q)}
                              className="p-1 text-slate-500 hover:text-purple-600 rounded hover:bg-purple-50 transition cursor-pointer"
                              title="Nhân bản tạo Đợt tiếp theo"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenCreateContract(q)}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer border border-emerald-200"
                              title="Tạo hợp đồng từ báo giá này"
                            >
                              <FileSignature className="w-3 h-3 text-emerald-600" />
                              <span>Tạo HĐ</span>
                            </button>
                            <button
                              onClick={() => handleEditQuote(q)}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition cursor-pointer"
                            >
                              {isContract ? 'Chi Tiết' : 'Sửa / Báo'}
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

      {/* Modal: Tự động sinh Hợp Đồng từ Báo Giá đã chốt */}
      <CreateContractFromQuoteModal
        isOpen={isCreateContractOpen}
        onClose={() => setIsCreateContractOpen(false)}
        quote={createContractQuote}
      />
    </div>
  );
};
