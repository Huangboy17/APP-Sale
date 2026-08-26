import React, { useState } from 'react';
import { Customer, CustomerStage, Quotation, QuotationStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatVND, formatDate, getCustomerStageConfig, getQuotationStatusConfig } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  Printer,
  Copy,
  Check,
  Edit2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onEditCustomer: (customer: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  isOpen,
  onClose,
  onEditCustomer,
}) => {
  const {
    customers,
    filteredQuotations,
    updateCustomerStage,
    updateQuotationStatus,
    cloneQuotationToNextRound,
    finalizeQuoteToContract,
    setIsCreateQuoteModalOpen,
    setSelectedQuoteForModal,
    setSelectedCustomerIdForQuote,
    setPdfPreviewData,
  } = useApp();

  if (!isOpen || !customer) return null;

  // Retrieve latest live customer from state
  const liveCustomer = customers.find((c) => c.id === customer.id) || customer;

  // Get all quotations for this customer, sorted by version descending
  const customerQuotes = filteredQuotations
    .filter((q) => q.customerId === liveCustomer.id)
    .sort((a, b) => b.version - a.version);

  const contractQuote = customerQuotes.find((q) => q.isContractQuote);
  const stageCfg = getCustomerStageConfig(liveCustomer.stage);

  // Total value of all finalized contracts or latest quote
  const totalQuoteValue = customerQuotes.length > 0 ? customerQuotes[0].grandTotal : 0;

  const handleOpenQuote = (quote: Quotation) => {
    setSelectedQuoteForModal(quote);
    setIsCreateQuoteModalOpen(true);
  };

  const handleCreateNewQuoteRound = () => {
    setSelectedQuoteForModal(null);
    setSelectedCustomerIdForQuote(liveCustomer.id);
    setIsCreateQuoteModalOpen(true);
  };

  const handleCloneQuote = (quote: Quotation) => {
    const newQuote = cloneQuotationToNextRound(quote.id);
    if (newQuote) {
      setSelectedQuoteForModal(newQuote);
      setIsCreateQuoteModalOpen(true);
    }
  };

  const handleStatusChange = (quote: Quotation, newStatus: QuotationStatus) => {
    if (newStatus === 'approved_contract') {
      const confirmClose = window.confirm(
        `Xác nhận chọn Báo giá "${quote.quoteNumber}" (Đợt ${quote.version}) làm BÁO GIÁ CHỐT HỢP ĐỒNG?\n\nHệ thống sẽ:\n1. Tự động chuyển khách hàng "${liveCustomer.name}" sang trạng thái "ĐÃ CHỐT - ĐÃ KÝ HĐ"\n2. Tự động sinh Hợp đồng kinh tế\n3. Tự động phân tách Bảng Giữ Hàng (kho sẵn) & Bảng Đặt Hàng (cần nhập thêm)`
      );
      if (!confirmClose) return;

      finalizeQuoteToContract(quote.id);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } else {
      updateQuotationStatus(quote.id, newStatus);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {liveCustomer.code.slice(-3) || 'KH'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  {liveCustomer.code}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{liveCustomer.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stageCfg.bg}`}>
                  {stageCfg.label}
                </span>
                {contractQuote && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã Ký Hợp Đồng</span>
                  </span>
                )}
              </div>
              {liveCustomer.company && (
                <p className="text-xs text-slate-600 font-medium flex items-center space-x-1 mt-0.5">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{liveCustomer.company}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEditCustomer(liveCustomer)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 border border-slate-200"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Sửa Thông Tin</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50/40">
          {/* Customer Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Contact & Location Info */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Thông Tin Liên Hệ</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-start space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-400 text-[10px]">Số điện thoại</div>
                    <a
                      href={`tel:${liveCustomer.phone}`}
                      className="font-bold text-slate-800 hover:text-blue-600 hover:underline"
                    >
                      {liveCustomer.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-400 text-[10px]">Email</div>
                    <div className="font-medium text-slate-800 break-all">
                      {liveCustomer.email || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-400 text-[10px]">Địa chỉ / Công trình</div>
                    <div className="font-medium text-slate-800">
                      {liveCustomer.address || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>

                {liveCustomer.taxCode && (
                  <div className="flex items-start space-x-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-slate-400 text-[10px]">Mã số thuế</div>
                      <div className="font-mono font-semibold text-slate-800">{liveCustomer.taxCode}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sales Rep & Pipeline Stage */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Phụ Trách & Tình Trạng</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">Sales phụ trách</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{liveCustomer.assignedToName}</div>
                </div>

                <div>
                  <div className="text-slate-400 text-[10px] mb-1">Chuyển nhanh giai đoạn</div>
                  <select
                    value={liveCustomer.stage}
                    onChange={(e) => updateCustomerStage(liveCustomer.id, e.target.value as CustomerStage)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-blue-500 outline-hidden cursor-pointer"
                  >
                    <option value="new">1. Tạo Mới</option>
                    <option value="contacted">2. Đang Tiếp Cận</option>
                    <option value="quoting">3. Đang Báo Giá</option>
                    <option value="contract_signed">4. Chốt - Ký Hợp Đồng</option>
                    <option value="rejected">5. Từ Chối / Mất Khách</option>
                  </select>
                </div>

                {liveCustomer.stage === 'rejected' && liveCustomer.rejectReason && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                    <strong>Lý do từ chối:</strong> {liveCustomer.rejectReason}
                  </div>
                )}

                <div>
                  <div className="text-slate-400 text-[10px]">Ngày tạo hồ sơ</div>
                  <div className="font-medium text-slate-700">{formatDate(liveCustomer.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Financial & Deal Summary */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tổng Quan Giá Trị</span>
                </h3>

                <div className="mt-2.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Giá trị dự kiến:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {formatVND(liveCustomer.expectedValue || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Số đợt báo giá:</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {customerQuotes.length} đợt
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-slate-700 font-bold">
                      {contractQuote ? 'Giá trị HĐ chốt:' : 'Báo giá gần nhất:'}
                    </span>
                    <span className="font-extrabold text-sm text-emerald-700 font-mono">
                      {formatVND(contractQuote ? contractQuote.grandTotal : totalQuoteValue)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCreateNewQuoteRound}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tạo Báo Giá Đợt {customerQuotes.length + 1}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notes Section if available */}
          {liveCustomer.notes && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
              <strong className="font-bold block mb-0.5">📌 Ghi chú & Yêu cầu của khách hàng:</strong>
              <p className="whitespace-pre-wrap">{liveCustomer.notes}</p>
            </div>
          )}

          {/* BẢNG THEO DÕI BÁO GIÁ TỪNG ĐỢT */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Bảng Theo Dõi Báo Giá Từng Đợt (v1, v2, v3...)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lưu trữ lịch sử tất cả các lần gửi báo giá. Nhấp vào bất kỳ báo giá nào để mở xem & chỉnh sửa chi tiết.
                </p>
              </div>

              <button
                onClick={handleCreateNewQuoteRound}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-2xs self-start sm:self-center"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tạo Đợt {customerQuotes.length + 1}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5 text-center w-16">Đợt</th>
                    <th className="px-3.5 py-2.5">Số Báo Giá</th>
                    <th className="px-3.5 py-2.5">Tiêu Đề / Dự Án</th>
                    <th className="px-3.5 py-2.5">Ngày Lập</th>
                    <th className="px-3.5 py-2.5">Hàng Hóa</th>
                    <th className="px-3.5 py-2.5 text-right">Giá Trị (Có VAT)</th>
                    <th className="px-3.5 py-2.5 text-center">Tình Trạng</th>
                    <th className="px-3.5 py-2.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 bg-slate-50/50">
                        Chưa có đợt báo giá nào cho khách hàng này.{' '}
                        <button
                          onClick={handleCreateNewQuoteRound}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Tạo Đợt 1 ngay →
                        </button>
                      </td>
                    </tr>
                  ) : (
                    customerQuotes.map((q) => {
                      const isContract = q.isContractQuote;
                      const statusCfg = getQuotationStatusConfig(q.status);

                      return (
                        <tr
                          key={q.id}
                          className={`hover:bg-blue-50/40 transition cursor-pointer ${
                            isContract ? 'bg-emerald-50/40 font-medium' : ''
                          }`}
                          onClick={() => handleOpenQuote(q)}
                        >
                          {/* Round / Version */}
                          <td className="px-3.5 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                isContract
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              Đợt {q.version}
                            </span>
                          </td>

                          {/* Quote Number */}
                          <td className="px-3.5 py-3 font-mono font-bold text-blue-700">
                            <div className="flex items-center space-x-1">
                              <span>{q.quoteNumber}</span>
                              <ExternalLink className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition" />
                            </div>
                          </td>

                          {/* Title */}
                          <td className="px-3.5 py-3">
                            <div className="font-semibold text-slate-900 line-clamp-1">{q.title}</div>
                            <div className="text-[10px] text-slate-400">
                              Người tạo: {q.salesRepName}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-3.5 py-3 text-slate-600 whitespace-nowrap">
                            {formatDate(q.date)}
                          </td>

                          {/* Items count */}
                          <td className="px-3.5 py-3 text-slate-600 whitespace-nowrap">
                            <span className="font-medium">{q.items.length} mặt hàng</span>
                          </td>

                          {/* Total Value */}
                          <td className="px-3.5 py-3 text-right font-bold text-slate-900 font-mono whitespace-nowrap text-sm">
                            {formatVND(q.grandTotal)}
                          </td>

                          {/* Status Dropdown */}
                          <td
                            className="px-3.5 py-3 text-center whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                                  className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 ml-1"
                                  title="Báo giá chính thức làm Hợp Đồng"
                                >
                                  ★ HĐ
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td
                            className="px-3.5 py-3 text-center whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => setPdfPreviewData({ type: 'quote', data: q })}
                                className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition"
                                title="Xem & Xuất PDF"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleCloneQuote(q)}
                                className="p-1.5 text-slate-500 hover:text-purple-600 rounded hover:bg-purple-50 transition"
                                title="Nhân bản tạo Đợt tiếp theo"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenQuote(q)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition shadow-2xs"
                              >
                                {isContract ? 'Xem HĐ' : 'Mở Báo Giá'}
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

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Tổng cộng: <strong>{customerQuotes.length} đợt báo giá</strong> cho khách hàng này.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
