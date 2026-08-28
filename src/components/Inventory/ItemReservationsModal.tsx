import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, ReserveItem } from '../../types';
import { formatDate, formatVND } from '../../utils/formatters';
import { EditReserveItemModal } from './EditReserveItemModal';
import {
  X,
  Layers,
  User,
  Building,
  Calendar,
  Warehouse,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Download,
  Phone,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Edit2,
  RotateCcw,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ItemReservationsModalProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export const ItemReservationsModal: React.FC<ItemReservationsModalProps> = ({ item, onClose }) => {
  const {
    filteredReserveItems,
    contracts,
    filteredQuotations,
    customers,
    currentUser,
    updateReserveStatus,
    updateReserveItem,
    setActiveTab,
    setPdfPreviewData,
  } = useApp();

  const [activeViewTab, setActiveViewTab] = useState<'holds' | 'pipeline'>('holds');
  const [editingReserveItem, setEditingReserveItem] = useState<ReserveItem | null>(null);

  if (!item) return null;

  // Filter all reserve items for this SKU (case-insensitive & trimmed) - strictly excluding orphan data
  const itemReserves = filteredReserveItems.filter(
    (r) =>
      (r.sku || '').trim().toLowerCase() === (item.sku || '').trim().toLowerCase() ||
      (r.productName && item.name && r.productName.trim().toLowerCase() === item.name.trim().toLowerCase())
  );
  const activeHolds = itemReserves.filter((r) => r.status === 'holding');
  const pastHolds = itemReserves.filter((r) => r.status !== 'holding');
  const totalHoldingQty = activeHolds.reduce((sum, r) => sum + r.reservedQuantity, 0);

  // Find quotations in draft/sent/negotiating that contain this SKU
  const pipelineQuotes = filteredQuotations
    .filter(
      (q) =>
        (q.status === 'draft' || q.status === 'sent' || q.status === 'negotiating') &&
        q.items.some(
          (i) =>
            (i.sku || '').trim().toLowerCase() === (item.sku || '').trim().toLowerCase() ||
            (i.name && item.name && i.name.trim().toLowerCase() === item.name.trim().toLowerCase())
        )
    )
    .map((q) => {
      const row = q.items.find(
        (i) =>
          (i.sku || '').trim().toLowerCase() === (item.sku || '').trim().toLowerCase() ||
          (i.name && item.name && i.name.trim().toLowerCase() === item.name.trim().toLowerCase())
      );
      return {
        quote: q,
        itemRow: row!,
      };
    });

  const totalPipelineQty = pipelineQuotes.reduce((sum, p) => sum + p.itemRow.quantity, 0);

  // Helper to find customer phone / details
  const getCustomerInfo = (customerId: string) => {
    return customers.find((c) => c.id === customerId);
  };

  // Helper to find contract details
  const getContractDetails = (contractId: string) => {
    return contracts.find((c) => c.id === contractId);
  };

  // Export to Excel for this specific SKU holds
  const handleExportExcel = () => {
    const data = itemReserves.map((r, idx) => {
      const cust = getCustomerInfo(r.customerId);
      const resolvedSales = cust?.assignedToName || r.salesRepName;
      const resolvedCustomer = cust?.name || r.customerName;

      return {
        'STT': idx + 1,
        'Mã Hàng (SKU)': r.sku,
        'Tên Sản Phẩm': r.productName,
        'Sales Phụ Trách': resolvedSales,
        'Khách Hàng': resolvedCustomer,
        'Công Ty / Dự Án': cust?.company || '',
        'Số Điện Thoại': cust?.phone || '',
        'Số Hợp Đồng': r.contractNumber,
        'Số Báo Giá': r.quoteNumber,
        'Số Lượng Giữ': r.reservedQuantity,
        'ĐVT': r.unit,
        'Vị Trí Kho': r.warehouseLocation,
        'Ngày Bắt Đầu Giữ': r.reservedDate,
        'Hạn Giao Dự Kiến': r.expectedDeliveryDate,
        'Trạng Thái':
          r.status === 'holding'
            ? 'Đang giữ hàng'
            : r.status === 'dispatched'
            ? 'Đã xuất giao'
            : 'Đã hủy',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `GiuHang_${item.sku}`);
    XLSX.writeFile(workbook, `ChiTietGiuHang_${item.sku}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleOpenContract = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      setPdfPreviewData({ type: 'contract', data: contract });
      onClose();
    }
  };

  const handleGoToLogisticsTab = () => {
    onClose();
    setActiveTab('reserve_orders');
  };

  const isManagerOrAdmin =
    currentUser.role === 'super_admin' || currentUser.role === 'manager_c1';

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 border border-amber-400/30 rounded-lg text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Chi Tiết Giữ Hàng & Phân Bổ Kho
                </h2>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-400/30">
                  {item.sku}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium truncate max-w-lg mt-0.5">
                {item.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* INVENTORY SUMMARY KPI STRIP */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 shrink-0">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">Tồn Thực Tế Tại Kho</div>
            <div className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-0.5">
              {item.totalQuantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
            </div>
          </div>

          <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 shadow-2xs">
            <div className="text-[11px] text-amber-800 font-bold flex items-center space-x-1">
              <span>Đang Giữ (Đã Chốt HĐ)</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-amber-900 font-mono mt-0.5">
              {item.reservedQuantity} <span className="text-xs font-normal text-amber-700">{item.unit}</span>
            </div>
          </div>

          <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
            <div className="text-[11px] text-emerald-800 font-bold">Tồn Khả Dụng Để Bán</div>
            <div className="text-base sm:text-lg font-bold text-emerald-900 font-mono mt-0.5">
              {item.availableQuantity} <span className="text-xs font-normal text-emerald-700">{item.unit}</span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">Vị Trí Kho Lưu Trữ</div>
            <div className="text-xs font-bold text-slate-800 truncate mt-1 flex items-center space-x-1">
              <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{item.warehouseLocation || 'Kho Tổng'}</span>
            </div>
          </div>
        </div>

        {/* TABS HEADER */}
        <div className="px-4 sm:px-5 pt-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveViewTab('holds')}
              className={`pb-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
                activeViewTab === 'holds'
                  ? 'border-amber-600 text-amber-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Hợp Đồng Đang Giữ Hàng</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono">
                {activeHolds.length} HĐ ({totalHoldingQty} {item.unit})
              </span>
            </button>

            <button
              onClick={() => setActiveViewTab('pipeline')}
              className={`pb-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
                activeViewTab === 'pipeline'
                  ? 'border-blue-600 text-blue-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>Báo Giá Tiềm Năng (Chưa Chốt HĐ)</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-900 text-[10px] font-mono">
                {pipelineQuotes.length} BG ({totalPipelineQty} {item.unit})
              </span>
            </button>
          </div>

          {itemReserves.length > 0 && activeViewTab === 'holds' && (
            <button
              onClick={handleExportExcel}
              className="mb-2 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md flex items-center space-x-1 shadow-2xs transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Xuất Excel Giữ Hàng</span>
            </button>
          )}
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
          {activeViewTab === 'holds' ? (
            /* TAB 1: OFFICIAL HOLDING RECORDS */
            <div className="space-y-3">
              {itemReserves.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Mã hàng này hiện không có hợp đồng nào đang giữ hàng
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Toàn bộ tồn kho thực tế <strong>{item.totalQuantity} {item.unit}</strong> đang ở trạng thái khả dụng 100% để chào giá và chốt hợp đồng mới.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* ACTIVE HOLDS LIST */}
                  <div className="space-y-2.5">
                    {activeHolds.map((res) => {
                      const cust = getCustomerInfo(res.customerId);
                      const assignedSalesName = cust?.assignedToName || res.salesRepName;
                      const isMyHold = currentUser.name === assignedSalesName || (cust?.assignedToId && currentUser.id === cust.assignedToId);

                      return (
                        <div
                          key={res.id}
                          className="bg-white rounded-xl border border-amber-200 shadow-xs p-3.5 sm:p-4 hover:border-amber-400 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            {/* SALE INFO & CUSTOMER */}
                            <div className="flex items-start space-x-3">
                              <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {assignedSalesName.split(' ').pop()?.slice(0, 2).toUpperCase() || 'SA'}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <span className="font-bold text-sm text-slate-900">
                                    Sale: <span className="text-blue-700">{assignedSalesName}</span>
                                  </span>
                                  {isMyHold && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                      Đơn của bạn
                                    </span>
                                  )}
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                                    <span>Đang Khóa Giữ Hàng</span>
                                  </span>
                                </div>

                                <div className="mt-1 flex items-center space-x-3 text-xs text-slate-600 flex-wrap">
                                  <div className="flex items-center space-x-1 font-semibold text-slate-800">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Khách hàng: <strong>{res.customerName}</strong></span>
                                  </div>
                                  {cust?.phone && (
                                    <div className="flex items-center space-x-1 text-slate-500">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      <span>{cust.phone}</span>
                                    </div>
                                  )}
                                  {cust?.company && (
                                    <div className="flex items-center space-x-1 text-slate-500">
                                      <Building className="w-3 h-3 text-slate-400" />
                                      <span>{cust.company}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* QUANTITY HELD BADGE */}
                            <div className="sm:text-right bg-amber-50/60 sm:bg-transparent p-2 sm:p-0 rounded-lg shrink-0">
                              <div className="text-[10px] text-amber-800 uppercase tracking-wider font-bold">
                                Số lượng giữ
                              </div>
                              <div className="text-lg sm:text-xl font-bold font-mono text-amber-900">
                                {res.reservedQuantity} <span className="text-xs font-normal text-amber-700">{res.unit}</span>
                              </div>
                            </div>
                          </div>

                          {/* CONTRACT & DELIVERY TIMELINE STRIP */}
                          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600">
                            <div className="flex items-center space-x-4 flex-wrap">
                              <div className="flex items-center space-x-1.5 font-mono">
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-slate-500">HĐ:</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenContract(res.contractId)}
                                  className="font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center space-x-0.5"
                                  title="Xem chi tiết hợp đồng"
                                >
                                  <span>{res.contractNumber}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="text-slate-400">|</div>

                              <div className="flex items-center space-x-1.5">
                                <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-500">Kho giữ:</span>
                                <span className="font-medium text-slate-800">{res.warehouseLocation}</span>
                              </div>

                              <div className="text-slate-400">|</div>

                              <div className="flex items-center space-x-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-500">Ngày giữ:</span>
                                <span className="font-medium text-slate-700">{formatDate(res.reservedDate)}</span>
                              </div>

                              <div className="flex items-center space-x-1.5 text-amber-800 font-medium">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Giao dự kiến:</span>
                                <strong>{formatDate(res.expectedDeliveryDate)}</strong>
                              </div>
                            </div>

                            {/* QUICK ACTION BUTTONS */}
                            {(isManagerOrAdmin || isMyHold) && (
                              <div className="flex items-center space-x-1.5 self-end sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateReserveStatus(res.id, 'dispatched')}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                                  title="Xác nhận đã xuất kho giao cho khách hàng"
                                >
                                  <Truck className="w-3 h-3 text-emerald-600" />
                                  <span>Xuất Kho</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Bạn có chắc muốn hủy giữ ${res.reservedQuantity} ${res.unit} cho hợp đồng ${res.contractNumber}? Số lượng này sẽ được hoàn trả lại tồn khả dụng.`)) {
                                      updateReserveStatus(res.id, 'cancelled');
                                    }
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded text-xs font-semibold transition cursor-pointer"
                                  title="Hủy giữ hàng và trả về tồn khả dụng"
                                >
                                  Hủy Giữ
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditingReserveItem(res)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                                  title="Sửa thông tin / số lượng / trạng thái khi ấn nhầm"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* PAST COMPLETED / CANCELLED HOLDS */}
                  {pastHolds.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-bold text-slate-500 mb-2 flex items-center space-x-1.5">
                        <span>Lịch sử giữ hàng đã xử lý xong ({pastHolds.length})</span>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                        {pastHolds.map((res) => {
                          const cust = customers.find((c) => c.id === res.customerId);
                          return (
                            <div key={res.id} className="p-3 text-xs flex items-center justify-between text-slate-600 bg-slate-50/40">
                              <div className="flex items-center space-x-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    res.status === 'dispatched'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {res.status === 'dispatched' ? 'Đã xuất kho' : 'Đã hủy giữ'}
                                </span>
                                <span>
                                  Sale: <strong className="text-slate-800">{cust?.assignedToName || res.salesRepName}</strong> giữ cho{' '}
                                  <strong className="text-slate-800">{cust?.name || res.customerName}</strong> ({res.contractNumber})
                                </span>
                              </div>
                            <div className="flex items-center space-x-2">
                              <div className="font-mono font-bold text-slate-800">
                                {res.reservedQuantity} {res.unit}
                              </div>

                              {/* Undo / Edit for mistake handling */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Khôi phục trạng thái ĐANG GIỮ KHO cho ${res.productName}? Tồn kho sẽ tự động được điều chỉnh chính xác.`
                                    )
                                  ) {
                                    updateReserveStatus(res.id, 'holding');
                                  }
                                }}
                                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                                title="Hoàn tác về Đang Giữ Kho nếu ấn nhầm"
                              >
                                <RotateCcw className="w-3 h-3 text-amber-700" />
                                <span>Hoàn Tác</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingReserveItem(res)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition cursor-pointer"
                                title="Sửa trạng thái / số lượng khi ấn nhầm"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: PIPELINE QUOTATIONS */
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Đây là danh sách các <strong>Báo giá đang đàm phán</strong> có chào mã hàng này nhưng <strong>chưa chốt hợp đồng</strong> (chưa chính thức khóa tồn kho). Thông tin này giúp quản lý và sales nắm bắt trước nhu cầu sắp tới.
                </p>
              </div>

              {pipelineQuotes.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">
                    Chưa có báo giá nào đang thảo luận chứa mã hàng này
                  </h4>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Số Báo Giá</th>
                        <th className="px-3 py-2.5">Sales Phụ Trách</th>
                        <th className="px-3 py-2.5">Khách Hàng</th>
                        <th className="px-3 py-2.5 text-center">Số Lượng Báo</th>
                        <th className="px-3 py-2.5 text-right">Đơn Giá Chào</th>
                        <th className="px-3 py-2.5 text-right">Thành Tiền</th>
                        <th className="px-3 py-2.5 text-center">Trạng Thái Báo Giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {pipelineQuotes.map(({ quote, itemRow }) => (
                        <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 font-mono font-bold text-blue-700">
                            {quote.quoteNumber} (Lần {quote.version})
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-900">
                            {quote.salesRepName}
                          </td>
                          <td className="px-3 py-2.5 text-slate-800">
                            {quote.customerName}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold font-mono text-slate-900">
                            {itemRow.quantity} {item.unit}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                            {formatVND(itemRow.quotedPrice)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                            {formatVND(itemRow.totalAmount)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              {quote.status === 'negotiating'
                                ? 'Đang đàm phán'
                                : quote.status === 'sent'
                                ? 'Đã gửi khách'
                                : 'Bản nháp'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-4 sm:px-5 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Phân bổ kho:</span>
            <span className="font-bold text-slate-900">
              {item.reservedQuantity} đang giữ / {item.totalQuantity} tồn thực tế
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-700 font-bold">
              Khả dụng: {item.availableQuantity} {item.unit}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleGoToLogisticsTab}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs flex items-center space-x-1 shadow-2xs transition"
            >
              <span>Xem Toàn Bộ Bảng Giữ Hàng</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs shadow-2xs transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Edit Reserve Item Modal */}
      <EditReserveItemModal
        isOpen={!!editingReserveItem}
        item={editingReserveItem}
        customer={customers.find((c) => c.id === editingReserveItem?.customerId)}
        contract={contracts.find((c) => c.id === editingReserveItem?.contractId)}
        onClose={() => setEditingReserveItem(null)}
        onSave={(updated) => updateReserveItem(updated)}
      />
    </div>
  );
};
