import React, { useState } from 'react';
import { Quotation, QuotationStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatVND, formatDate, getQuotationStatusConfig } from '../../utils/formatters';
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
} from 'lucide-react';

export const QuotationManager: React.FC = () => {
  const {
    currentUser,
    filteredQuotations,
    customers,
    setIsCreateQuoteModalOpen,
    setSelectedQuoteForModal,
    setSelectedCustomerIdForQuote,
    setPdfPreviewData,
    deleteQuotation,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomerIdFilter, setSelectedCustomerIdFilter] = useState<string>('all');

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

  const handleOpenNewQuote = () => {
    setSelectedQuoteForModal(null);
    setSelectedCustomerIdForQuote(null);
    setIsCreateQuoteModalOpen(true);
  };

  const handleEditQuote = (quote: Quotation) => {
    setSelectedQuoteForModal(quote);
    setIsCreateQuoteModalOpen(true);
  };

  const handlePreviewPDF = (quote: Quotation) => {
    setPdfPreviewData({ type: 'quote', data: quote });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>📑</span>
            <span>Cửa Sổ & Danh Sách Báo Giá Nhân Viên</span>
          </h1>
          <p className="text-xs text-slate-500">
            Quản lý từng đợt báo giá (v1, v2, v3...), kiểm tra giá DP sàn, và chọn báo giá chốt để ký hợp đồng.
          </p>
        </div>

        <button
          id="btn-create-new-quote"
          onClick={handleOpenNewQuote}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-2xs transition active:scale-95 flex items-center space-x-1 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tạo Báo Giá Mới</span>
        </button>
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
            <option value="all">Tất cả khách hàng</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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

      {/* Quotations List Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 py-2.5">Số Báo Giá</th>
                <th className="px-3 py-2.5">Khách Hàng / Công Ty</th>
                <th className="px-3 py-2.5">Tiêu Đề Dự Án</th>
                <th className="px-3 py-2.5 text-center">Đợt Báo Giá</th>
                <th className="px-3 py-2.5">Ngày Lập</th>
                <th className="px-3 py-2.5">Sales Phụ Trách</th>
                <th className="px-3 py-2.5 text-right">Tổng Tiền (Có VAT)</th>
                <th className="px-3 py-2.5 text-center">Trạng Thái</th>
                <th className="px-3 py-2.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                    Chưa có báo giá nào phù hợp. Hãy bấm "Tạo Báo Giá Mới" để bắt đầu.
                  </td>
                </tr>
              ) : (
                displayedQuotes.map((q) => {
                  const statusCfg = getQuotationStatusConfig(q.status);
                  const hasBelowDP = q.items.some((i) => i.isBelowDP);

                  return (
                    <tr
                      key={q.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        q.isContractQuote ? 'bg-blue-50/30' : ''
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
                        <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">
                          Lần {q.version}
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
                        {q.isContractQuote ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Đã Chốt Ký HĐ
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.bg}`}>
                            {statusCfg.label}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handlePreviewPDF(q)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition"
                            title="Xem & Xuất PDF Báo Giá"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditQuote(q)}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition"
                          >
                            {q.isContractQuote ? 'Chi Tiết' : 'Sửa / Chốt'}
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
  );
};
