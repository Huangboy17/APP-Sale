import React, { useState } from 'react';
import { Contract, PaymentMilestone } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatVND, formatDate, numberToVietnameseWords } from '../../utils/formatters';
import {
  FileSignature,
  Printer,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Layers,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ContractList: React.FC = () => {
  const {
    filteredContracts,
    updateContractMilestoneStatus,
    setPdfPreviewData,
    setActiveTab,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

  const displayedContracts = filteredContracts.filter((c) => {
    return (
      c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.customerCompany && c.customerCompany.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handlePrintContractPDF = (contract: Contract) => {
    setPdfPreviewData({ type: 'contract', data: contract });
  };

  const toggleExpand = (id: string) => {
    setExpandedContractId(expandedContractId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>📜</span>
            <span>Quản Lý Hợp Đồng Kinh Tế & Mốc Tạm Ứng / Thanh Toán</span>
          </h1>
          <p className="text-xs text-slate-500">
            Các hợp đồng được sinh tự động khi chốt Báo giá. Theo dõi tiến độ thanh toán từng đợt & xuất file PDF in ấn.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo số hợp đồng, tên khách hàng, số báo giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
          Tổng số: <span className="font-bold text-slate-900">{displayedContracts.length} hợp đồng</span>
        </div>
      </div>

      {/* Contracts List */}
      <div className="space-y-3">
        {displayedContracts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
            Chưa có hợp đồng nào được ký kết. Khi bạn chốt một báo giá thành công, hợp đồng sẽ xuất hiện tại đây.
          </div>
        ) : (
          displayedContracts.map((contract) => {
            const isExpanded = expandedContractId === contract.id;
            const completedMilestones = contract.milestones.filter((m) => m.status === 'completed').length;
            const totalMilestones = contract.milestones.length;

            return (
              <div
                key={contract.id}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs hover:border-blue-300 transition"
              >
                {/* Contract Summary Top Bar */}
                <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {contract.contractNumber}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">
                        Từ Báo Giá: <span className="font-mono text-slate-800">{contract.quoteNumber}</span>
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Đã Ký Kết
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {contract.customerName}
                      {contract.customerCompany && (
                        <span className="text-xs font-normal text-slate-500 ml-1.5">
                          ({contract.customerCompany})
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                      <span>Ngày ký: {formatDate(contract.contractDate)}</span>
                      <span>Dự kiến giao: {formatDate(contract.deliveryDate)}</span>
                      <span>Phụ trách: <strong>{contract.salesRepName}</strong></span>
                    </div>
                  </div>

                  {/* Value & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 lg:text-right">
                    <div>
                      <div className="text-[11px] text-slate-500">Tổng Giá Trị Hợp Đồng:</div>
                      <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono">
                        {formatVND(contract.totalValue)}
                      </div>
                      <div className="text-[10px] text-slate-400 italic max-w-xs truncate">
                        {numberToVietnameseWords(contract.totalValue)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handlePrintContractPDF(contract)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-2xs transition active:scale-95 flex items-center space-x-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Xuất PDF</span>
                      </button>

                      <button
                        onClick={() => toggleExpand(contract.id)}
                        className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 text-slate-600 transition"
                        title={isExpanded ? 'Thu gọn' : 'Xem chi tiết mốc thanh toán & hàng hóa'}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Payment Milestones & Split Goods Info */}
                {isExpanded && (
                  <div className="p-3.5 border-t border-slate-200 space-y-3.5 bg-white text-xs">
                    {/* Delivery address */}
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-start space-x-2 text-slate-700">
                      <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Địa điểm giao hàng:</span> {contract.deliveryAddress || 'Tại chân công trình'}
                        {contract.customerTaxCode && (
                          <div className="text-[10px] text-slate-500">Mã số thuế: {contract.customerTaxCode}</div>
                        )}
                      </div>
                    </div>

                    {/* Milestones Checkpoint */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>Tiến Độ Tạm Ứng & Mốc Thanh Toán ({completedMilestones}/{totalMilestones} Hoàn Thành)</span>
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Bấm nút để cập nhật trạng thái thu tiền
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {contract.milestones.map((ms) => {
                          const isDone = ms.status === 'completed';
                          return (
                            <div
                              key={ms.id}
                              className={`p-2.5 rounded border transition ${
                                isDone
                                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="font-bold text-xs">{ms.milestoneName}</div>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                    isDone ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {ms.percentage}%
                                </span>
                              </div>

                              <div className="text-sm font-bold mt-1 font-mono">
                                {formatVND(ms.amount)}
                              </div>

                              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                                {ms.conditionDescription}
                              </div>

                              {/* Status Toggle buttons */}
                              <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between">
                                <span className="text-[10px] font-medium text-slate-500">Trạng thái:</span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() =>
                                      updateContractMilestoneStatus(
                                        contract.id,
                                        ms.id,
                                        isDone ? 'pending' : 'completed'
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                                      isDone
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{isDone ? 'Đã Thu' : 'Chưa Thu'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Products summary & Jump to split tables */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100">
                      <div className="text-[11px] text-slate-500">
                        Bao gồm <span className="font-bold text-slate-800">{contract.items.length} mặt hàng</span> theo báo giá chốt {contract.quoteNumber}.
                      </div>

                      <button
                        onClick={() => setActiveTab('reserve_orders')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Xem Bảng Giữ Hàng & Đặt Hàng liên quan →</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
