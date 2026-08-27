import React, { useState } from 'react';
import { Contract, PaymentMilestone } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatVND, formatDate, numberToVietnameseWords } from '../../utils/formatters';
import * as XLSX from 'xlsx';
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
  Download,
  ExternalLink,
  DollarSign,
  Package,
} from 'lucide-react';

interface SalesSignedContractsTableProps {
  contracts: Contract[];
  timeLabel: string;
  salesRepLabel: string;
}

export const SalesSignedContractsTable: React.FC<SalesSignedContractsTableProps> = ({
  contracts,
  timeLabel,
  salesRepLabel,
}) => {
  const { setPdfPreviewData, setActiveTab, updateContractMilestoneStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const displayedContracts = contracts.filter((c) => {
    const matchesSearch =
      c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.customerCompany && c.customerCompany.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.salesRepName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handlePrintContractPDF = (contract: Contract) => {
    setPdfPreviewData({ type: 'contract', data: contract });
  };

  const toggleExpand = (id: string) => {
    setExpandedContractId(expandedContractId === id ? null : id);
  };

  const handleExportExcel = () => {
    const exportData = displayedContracts.map((c, index) => {
      const completedMilestones = c.milestones.filter((m) => m.status === 'completed').length;
      return {
        STT: index + 1,
        'Số Hợp Đồng': c.contractNumber,
        'Từ Báo Giá': c.quoteNumber,
        'Khách Hàng': c.customerName,
        'Công Ty': c.customerCompany || '',
        'Mã Số Thuế': c.customerTaxCode || '',
        'Nhân Viên Phụ Trách': c.salesRepName,
        'Tổng Giá Trị (VNĐ)': c.totalValue,
        'Bằng Chữ': numberToVietnameseWords(c.totalValue),
        'Ngày Ký': formatDate(c.contractDate),
        'Hạn Giao Hàng': formatDate(c.deliveryDate),
        'Địa Chỉ Giao Hàng': c.deliveryAddress || '',
        'Tiến Độ Mốc': `${completedMilestones}/${c.milestones.length} đợt`,
        'Trạng Thái':
          c.status === 'signed'
            ? 'Đã Ký Kết'
            : c.status === 'delivering'
            ? 'Đang Giao Hàng'
            : c.status === 'completed'
            ? 'Hoàn Tất'
            : 'Dự Thảo',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HopDongDaKy');
    const filename = `Danh_Sach_Hop_Dong_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const totalValueInList = displayedContracts.reduce((sum, c) => sum + c.totalValue, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
      {/* Table Header Section */}
      <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <FileSignature className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Danh Sách Hợp Đồng Kinh Tế Đã Ký
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {displayedContracts.length} Hợp Đồng
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Dữ liệu theo bộ lọc: <strong className="text-slate-800">{salesRepLabel}</strong> •{' '}
            <strong className="text-blue-600">{timeLabel}</strong> • Tổng giá trị:{' '}
            <strong className="text-emerald-700 font-mono">{formatVND(totalValueInList)}</strong>
          </p>
        </div>

        {/* Action buttons & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            title="Xuất file Excel danh sách hợp đồng đã lọc"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel HĐ</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo số HĐ, tên khách hàng, số báo giá, NVKD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 outline-hidden"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="signed">Đã ký kết</option>
            <option value="delivering">Đang giao hàng</option>
            <option value="completed">Đã hoàn tất</option>
          </select>
        </div>
      </div>

      {/* Contracts List Display */}
      <div className="divide-y divide-slate-100">
        {displayedContracts.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            Không có hợp đồng nào phù hợp với điều kiện lọc (
            <strong>{salesRepLabel}</strong>, <strong>{timeLabel}</strong>).
          </div>
        ) : (
          displayedContracts.map((contract) => {
            const isExpanded = expandedContractId === contract.id;
            const completedMilestones = contract.milestones.filter((m) => m.status === 'completed').length;
            const totalMilestones = contract.milestones.length;

            return (
              <div
                key={contract.id}
                className="hover:bg-slate-50/70 transition-colors duration-150"
              >
                {/* Main Row Summary */}
                <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {contract.contractNumber}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">
                        Từ Báo Giá: <span className="font-mono text-slate-800">{contract.quoteNumber}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Đã Ký Kết
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 mt-1 flex items-center space-x-1.5">
                      <span>{contract.customerName}</span>
                      {contract.customerCompany && (
                        <span className="text-xs font-normal text-slate-500">
                          ({contract.customerCompany})
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3.5 gap-y-1 pt-0.5">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Ngày ký: <strong>{formatDate(contract.contractDate)}</strong></span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Truck className="w-3 h-3 text-slate-400" />
                        <span>Dự kiến giao: <strong>{formatDate(contract.deliveryDate)}</strong></span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>Sale phụ trách: <strong className="text-slate-800">{contract.salesRepName}</strong></span>
                      </span>
                    </div>
                  </div>

                  {/* Value & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 lg:text-right">
                    <div>
                      <div className="text-[11px] text-slate-500">Tổng Giá Trị Hợp Đồng:</div>
                      <div className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                        {formatVND(contract.totalValue)}
                      </div>
                      <div className="text-[10px] text-slate-400 italic max-w-xs truncate">
                        {numberToVietnameseWords(contract.totalValue)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handlePrintContractPDF(contract)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition active:scale-95 flex items-center space-x-1 cursor-pointer"
                        title="Xuất file PDF in hợp đồng chính thức"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Xuất PDF</span>
                      </button>

                      <button
                        onClick={() => toggleExpand(contract.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center space-x-1 cursor-pointer ${
                          isExpanded
                            ? 'bg-slate-200 text-slate-800 border-slate-300'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <span>{isExpanded ? 'Thu Gọn' : 'Chi Tiết'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Accordion: Payment Milestones + Items Breakdown */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3.5">
                    {/* Payment Milestones Strip */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center space-x-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tiến Độ Tạm Ứng & Thanh Toán Từng Đợt:</span>
                        </span>
                        <span className="text-[11px] text-blue-600 font-semibold">
                          Hoàn thành: {completedMilestones}/{totalMilestones} đợt
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {contract.milestones.map((ms, idx) => (
                          <div
                            key={ms.id || idx}
                            className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                              ms.status === 'completed'
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-800">{ms.milestoneName}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                  ms.status === 'completed'
                                    ? 'bg-emerald-200 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {ms.percentage}% ({formatVND(ms.amount)})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">{ms.conditionDescription}</p>
                            <div className="flex items-center justify-between pt-1">
                              <span
                                className={`text-[10px] font-semibold ${
                                  ms.status === 'completed' ? 'text-emerald-700' : 'text-slate-400'
                                }`}
                              >
                                {ms.status === 'completed' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                              </span>
                              <button
                                onClick={() =>
                                  updateContractMilestoneStatus(
                                    contract.id,
                                    ms.id,
                                    ms.status === 'completed' ? 'pending' : 'completed'
                                  )
                                }
                                className={`text-[10px] px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                  ms.status === 'completed'
                                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                {ms.status === 'completed' ? 'Đánh dấu Chưa Thu' : 'Xác Nhận Đã Thu'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Products Included in this Contract */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center space-x-1.5">
                          <Package className="w-3.5 h-3.5 text-blue-600" />
                          <span>Danh Mục Sản Phẩm & Thiết Bị Theo Hợp Đồng ({contract.items?.length || 0} mục):</span>
                        </span>
                        <button
                          onClick={() => setActiveTab('reserve_orders')}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                        >
                          <span>Xem bảng giữ & đặt hàng kho →</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                              <th className="p-2">Mã SKU / Tên Hàng</th>
                              <th className="p-2">Hãng / Quy Cách</th>
                              <th className="p-2 text-center">ĐVT</th>
                              <th className="p-2 text-center">Số Lượng</th>
                              <th className="p-2 text-right">Đơn Giá Chốt</th>
                              <th className="p-2 text-right">Thành Tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {contract.items?.map((item, i) => (
                              <tr key={item.id || i} className="hover:bg-slate-50/50">
                                <td className="p-2 font-medium">
                                  <span className="font-mono text-blue-600 font-bold mr-1.5">{item.sku}</span>
                                  <span className="text-slate-800">{item.name}</span>
                                </td>
                                <td className="p-2 text-slate-500 text-[11px]">
                                  {item.brand} • {item.size || item.color || '-'}
                                </td>
                                <td className="p-2 text-center text-slate-600">{item.unit}</td>
                                <td className="p-2 text-center font-bold text-slate-900">{item.quantity}</td>
                                <td className="p-2 text-right font-mono text-slate-700">{formatVND(item.quotedPrice)}</td>
                                <td className="p-2 text-right font-mono font-bold text-emerald-700">
                                  {formatVND(item.totalAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
