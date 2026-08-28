import React, { useState } from 'react';
import { PurchaseOrder, StockInVoucher } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import {
  X,
  Boxes,
  Building,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  FileText,
  PackagePlus,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Receipt,
  Download,
  Share2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface PurchaseOrderDetailModalProps {
  po: PurchaseOrder;
  onClose: () => void;
  onOpenReceiveInbound?: (po: PurchaseOrder) => void;
}

export const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
  po,
  onClose,
  onOpenReceiveInbound,
}) => {
  const { updatePurchaseOrderStatus, stockInVouchers, currentUser } = useApp();
  const [expandedBreakdown, setExpandedBreakdown] = useState<Record<string, boolean>>({});

  const canManage = currentUser.role === 'manager_c1' || currentUser.role === 'super_admin' || currentUser.role === 'sales_c2';

  const toggleBreakdown = (sku: string) => {
    setExpandedBreakdown((prev) => ({ ...prev, [sku]: !prev[sku] }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return { label: '⚪ Nháp', bg: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-500' };
      case 'ordered':
        return { label: '🟡 Đã Đặt NCC', bg: 'bg-blue-50 text-blue-800 border-blue-300', dot: 'bg-blue-600' };
      case 'in_transit':
        return { label: '🚚 Đang Vận Chuyển', bg: 'bg-purple-50 text-purple-800 border-purple-300', dot: 'bg-purple-600' };
      case 'partial_received':
        return { label: '🟠 Về Một Phần', bg: 'bg-orange-50 text-orange-800 border-orange-300', dot: 'bg-orange-600' };
      case 'completed':
        return { label: '🟢 Đã Về Đủ Kho', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-600' };
      case 'cancelled':
        return { label: '🔴 Đã Hủy', bg: 'bg-rose-50 text-rose-800 border-rose-300', dot: 'bg-rose-600' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-500' };
    }
  };

  const statusMeta = getStatusBadge(po.status);
  const overallProgress =
    po.totalOrderQuantity > 0
      ? Math.min(100, Math.round((po.totalReceivedQuantity / po.totalOrderQuantity) * 100))
      : 0;

  // Find linked StockInVouchers
  const linkedVouchers = stockInVouchers.filter(
    (v) => v.purchaseOrderId === po.id || (po.inboundVoucherIds || []).includes(v.id) || (po.inboundVoucherIds || []).includes(v.voucherNumber)
  );

  const handleExportExcel = () => {
    const data = (po.items || []).map((item, idx) => ({
      'STT': idx + 1,
      'Mã SKU': item.sku,
      'Tên Sản Phẩm': item.productName,
      'Hãng': item.brand,
      'ĐVT': item.unit,
      'Nhu Cầu Sales': item.salesRequiredQuantity,
      'SL Đặt NCC': item.supplierOrderQuantity,
      'Kho Mua Thêm': item.warehouseExtraQuantity,
      'Đã Nhập Kho': item.receivedQuantity,
      'Còn Chờ Giao': item.remainingQuantity,
      'Nguồn': item.sourceType === 'WAREHOUSE_PLANNED' ? 'Kho chủ động' : 'Sales Request',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ChiTiet_PO');
    XLSX.writeFile(wb, `${po.poNumber}_ChiTiet_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold font-mono text-indigo-200">{po.poNumber}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.bg}`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Nhà cung cấp: <strong className="text-white">{po.supplierName}</strong> • Kho: {po.warehouseLocation}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Top Progress & Metrics Overview */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider">
                  Tiến Độ Nhập Kho PO: {po.totalReceivedQuantity} / {po.totalOrderQuantity} sản phẩm ({overallProgress}%)
                </span>
                <div className="text-[11px] text-slate-500">
                  Ngày lập: {formatDate(po.orderDate)} • ETA dự kiến: {po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : 'Chưa định'} • Người lập: {po.createdByName}
                </div>
              </div>

              {/* Status updater for warehouse role */}
              {canManage && po.status !== 'completed' && po.status !== 'cancelled' && (
                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <span className="text-[11px] font-semibold text-slate-600">Trạng thái PO:</span>
                  <select
                    value={po.status}
                    onChange={(e) => updatePurchaseOrderStatus(po.id, e.target.value as any)}
                    className="px-2.5 py-1 text-xs font-bold border border-indigo-300 rounded-lg bg-white shadow-2xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">⚪ Nháp</option>
                    <option value="ordered">🟡 Đã Đặt NCC</option>
                    <option value="in_transit">🚚 Đang Vận Chuyển</option>
                    <option value="partial_received">🟠 Về Một Phần</option>
                    <option value="completed">🟢 Đã Về Đủ</option>
                    <option value="cancelled">🔴 Hủy PO</option>
                  </select>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  overallProgress === 100 ? 'bg-emerald-500' : overallProgress > 0 ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Items Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-indigo-600" />
                <span>Chi Tiết Mặt Hàng & Phân Rã Nhu Cầu ({po.items.length} mã)</span>
              </h3>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center space-x-1 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-3.5 py-2.5">Mã Hàng</th>
                      <th className="px-3.5 py-2.5">Tên Sản Phẩm</th>
                      <th className="px-3 py-2.5 text-center">Hãng</th>
                      <th className="px-3 py-2.5 text-center bg-indigo-50/50 text-indigo-950 border-x border-indigo-100">
                        Nhu Cầu Sales
                      </th>
                      <th className="px-3 py-2.5 text-center bg-amber-50/50 text-amber-950 border-r border-amber-100">
                        Đặt NCC
                      </th>
                      <th className="px-3 py-2.5 text-center bg-emerald-50/50 text-emerald-950 border-r border-emerald-100">
                        Mua Thêm
                      </th>
                      <th className="px-3.5 py-2.5 text-center bg-blue-50/40 text-blue-950 border-r border-blue-100">
                        Đã Nhập / Tiến Độ
                      </th>
                      <th className="px-3 py-2.5 text-center bg-rose-50/40 text-rose-950">Còn Chờ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {po.items.map((item) => {
                      const itemProgress =
                        item.supplierOrderQuantity > 0
                          ? Math.min(100, Math.round((item.receivedQuantity / item.supplierOrderQuantity) * 100))
                          : 0;
                      const hasDemands = item.salesDemands && item.salesDemands.length > 0;
                      const isExpanded = expandedBreakdown[item.sku] ?? true;

                      return (
                        <React.Fragment key={item.id}>
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">
                              <div className="flex items-center space-x-1">
                                <span>{item.sku}</span>
                                {hasDemands && (
                                  <button
                                    type="button"
                                    onClick={() => toggleBreakdown(item.sku)}
                                    className="p-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5 font-bold text-slate-900 max-w-[200px] truncate" title={item.productName}>
                              {item.productName}
                            </td>
                            <td className="px-3 py-2.5 text-center text-slate-600">
                              {item.brand || 'Khác'}
                            </td>
                            <td className="px-3 py-2.5 text-center bg-indigo-50/20 border-x border-indigo-100 font-mono font-bold text-indigo-900">
                              {item.salesRequiredQuantity} {item.unit}
                            </td>
                            <td className="px-3 py-2.5 text-center bg-amber-50/20 border-r border-amber-100 font-mono font-black text-amber-950">
                              {item.supplierOrderQuantity} {item.unit}
                            </td>
                            <td className="px-3 py-2.5 text-center bg-emerald-50/20 border-r border-emerald-100 font-mono font-bold text-emerald-800">
                              {item.warehouseExtraQuantity > 0 ? `+${item.warehouseExtraQuantity} ${item.unit}` : '0'}
                            </td>
                            <td className="px-3.5 py-2.5 bg-blue-50/20 border-r border-blue-100 min-w-36">
                              <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                                <span>{item.receivedQuantity} / {item.supplierOrderQuantity}</span>
                                <span className={itemProgress === 100 ? 'text-emerald-600' : 'text-slate-500'}>
                                  {itemProgress}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full ${itemProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                  style={{ width: `${itemProgress}%` }}
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center bg-rose-50/20 font-mono font-bold text-rose-800">
                              {item.remainingQuantity} {item.unit}
                            </td>
                          </tr>

                          {/* SOURCE BREAKDOWN TREE */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={8} className="px-6 py-2.5 border-b border-slate-200">
                                <div className="space-y-1.5 text-[11px]">
                                  <div className="font-bold text-slate-700">
                                    Nguồn hình thành ({item.supplierOrderQuantity} {item.unit}):
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {item.salesDemands.map((d, dIdx) => (
                                      <div
                                        key={`${d.orderItemId}-${dIdx}`}
                                        className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between"
                                      >
                                        <div className="flex items-center justify-between font-bold">
                                          <span className="text-blue-600 font-mono">HĐ: {d.contractNumber}</span>
                                          <span className="text-slate-900 font-mono">{d.requiredQuantity} {item.unit}</span>
                                        </div>
                                        <div className="text-slate-600 truncate mt-0.5">{d.customerName}</div>
                                        <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
                                          <span>Sales: {d.salesRepName}</span>
                                          <span>Đã cấp: {d.fulfilledQuantity || 0} {item.unit}</span>
                                        </div>
                                      </div>
                                    ))}

                                    {item.warehouseExtraQuantity > 0 && (
                                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 shadow-2xs flex flex-col justify-between">
                                        <div className="flex items-center justify-between font-bold text-emerald-900">
                                          <span>Kho chủ động mua thêm</span>
                                          <span className="font-mono">+{item.warehouseExtraQuantity} {item.unit}</span>
                                        </div>
                                        <div className="text-emerald-700 text-[10px] mt-1">
                                          Nhập kho sẽ vào Tồn khả dụng công ty.
                                        </div>
                                      </div>
                                    )}

                                    {item.sourceType === 'WAREHOUSE_PLANNED' && item.salesDemands.length === 0 && (
                                      <div className="p-2 bg-purple-50 rounded-lg border border-purple-200 shadow-2xs text-purple-900">
                                        <div className="font-bold">Mặt hàng Kho chủ động hoàn toàn</div>
                                        <div className="text-[10px] text-purple-700 mt-0.5">Không có Sales Request gốc.</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Linked Inbound Stock Vouchers History */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Lịch Sử Các Phiếu Nhập Kho Từ PO Này ({linkedVouchers.length} đợt nhập)</span>
            </h3>

            {linkedVouchers.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400">
                Chưa có đợt nhập kho nào được ghi nhận cho PO này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {linkedVouchers.map((v) => (
                  <div key={v.id} className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-800">{v.voucherNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {formatDate(v.date)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700">
                      Tổng số lượng thực nhận: <strong className="font-mono">{v.totalQuantity.toLocaleString()}</strong> sản phẩm.
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Người tạo: {v.createdByName} • Kho: {v.warehouseLocation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold transition cursor-pointer"
          >
            Đóng
          </button>

          {canManage && po.status !== 'completed' && po.status !== 'cancelled' && onOpenReceiveInbound && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReceiveInbound(po);
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Tạo Phiếu Nhập Kho Theo PO</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
