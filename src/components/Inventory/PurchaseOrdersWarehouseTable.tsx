import React, { useState, useMemo } from 'react';
import { PurchaseOrder } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { PurchaseOrderDetailModal } from './PurchaseOrderDetailModal';
import { ReceivePOInboundModal } from './ReceivePOInboundModal';
import {
  ShoppingCart,
  Search,
  Download,
  PackagePlus,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Boxes,
  Plus,
  Truck,
  RotateCcw,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface PurchaseOrdersWarehouseTableProps {
  onOpenCreatePOModal?: () => void;
}

export const PurchaseOrdersWarehouseTable: React.FC<PurchaseOrdersWarehouseTableProps> = ({
  onOpenCreatePOModal,
}) => {
  const { purchaseOrders, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null);
  const [receiveInboundPO, setReceiveInboundPO] = useState<PurchaseOrder | null>(null);

  const canManage = currentUser.role === 'manager_c1' || currentUser.role === 'super_admin' || currentUser.role === 'sales_c2';

  const isPendingStatus = (status: string) =>
    ['ordered', 'in_transit', 'partial_received', 'draft'].includes(status);

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        po.poNumber.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.warehouseLocation.toLowerCase().includes(q) ||
        po.createdByName.toLowerCase().includes(q) ||
        (po.items || []).some(
          (item) => item.sku.toLowerCase().includes(q) || item.productName.toLowerCase().includes(q)
        );

      let matchStatus = true;
      if (statusFilter === 'all_pending') matchStatus = isPendingStatus(po.status);
      else if (statusFilter !== 'all') matchStatus = po.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [purchaseOrders, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return { label: '⚪ Nháp', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'ordered':
        return { label: '🟡 Đã Đặt NCC', bg: 'bg-blue-50 text-blue-800 border-blue-300' };
      case 'in_transit':
        return { label: '🚚 Đang Vận Chuyển', bg: 'bg-purple-50 text-purple-800 border-purple-300' };
      case 'partial_received':
        return { label: '🟠 Về Một Phần', bg: 'bg-orange-50 text-orange-800 border-orange-300' };
      case 'completed':
        return { label: '🟢 Đã Về Đủ', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'cancelled':
        return { label: '🔴 Đã Hủy', bg: 'bg-rose-50 text-rose-800 border-rose-300' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  // Metric summaries
  const totalPOCount = purchaseOrders.length;
  const activePOCount = purchaseOrders.filter((p) => isPendingStatus(p.status)).length;
  const totalItemsOrdered = purchaseOrders.reduce((sum, p) => sum + (Number(p.totalOrderQuantity) || 0), 0);
  const totalItemsReceived = purchaseOrders.reduce((sum, p) => sum + (Number(p.totalReceivedQuantity) || 0), 0);
  const totalItemsWaiting = Math.max(0, totalItemsOrdered - totalItemsReceived);

  const handleExportExcel = () => {
    const data = filteredPOs.map((po, idx) => {
      const meta = getStatusBadge(po.status);
      return {
        'STT': idx + 1,
        'Mã PO': po.poNumber,
        'Nhà Cung Cấp': po.supplierName,
        'Ngày Đặt': formatDate(po.orderDate),
        'Dự Kiến Về': po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : 'Chưa định',
        'Kho Đích': po.warehouseLocation,
        'Số Mặt Hàng': po.items.length,
        'Tổng SL Đặt NCC': po.totalOrderQuantity,
        'Đã Nhập Kho': po.totalReceivedQuantity,
        'Còn Chờ Giao': Math.max(0, po.totalOrderQuantity - po.totalReceivedQuantity),
        'Trạng Thái': meta.label,
        'Người Lập': po.createdByName,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSach_PO');
    XLSX.writeFile(wb, `Danh_Sach_PO_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Tổng Đơn Đặt (PO)</span>
          <span className="text-lg font-black text-slate-900 font-mono">{totalPOCount}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{activePOCount} đơn đang chờ hàng</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-2xs">
          <span className="text-[10px] font-bold text-indigo-700 uppercase block">Tổng SL Đặt NCC</span>
          <span className="text-lg font-black text-indigo-900 font-mono">{totalItemsOrdered.toLocaleString()}</span>
          <span className="text-[10px] text-indigo-600 block mt-0.5">Sản phẩm kế hoạch mua</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Đã Nhập Kho</span>
          <span className="text-lg font-black text-emerald-800 font-mono">{totalItemsReceived.toLocaleString()}</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Đã ghi nhận tồn thực tế</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase block">Còn Chờ NCC Giao</span>
          <span className="text-lg font-black text-amber-900 font-mono">{totalItemsWaiting.toLocaleString()}</span>
          <span className="text-[10px] text-amber-600 block mt-0.5">Sản phẩm đang về</span>
        </div>
      </div>

      {/* Header Search & Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo mã PO, NCC, SKU, sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer font-medium"
          >
            <option value="all">Tất cả trạng thái ({purchaseOrders.length})</option>
            <option value="all_pending">Đang chờ hàng ({activePOCount})</option>
            <option value="ordered">🟡 Đã đặt NCC</option>
            <option value="in_transit">🚚 Đang vận chuyển</option>
            <option value="partial_received">🟠 Về một phần</option>
            <option value="completed">🟢 Đã về đủ</option>
            <option value="draft">⚪ Nháp</option>
            <option value="cancelled">🔴 Đã hủy</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Excel
          </button>

          {canManage && onOpenCreatePOModal && (
            <button
              onClick={onOpenCreatePOModal}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tạo Đơn Đặt NCC</span>
            </button>
          )}
        </div>
      </div>

      {/* PO Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3.5 py-3">Mã PO</th>
                <th className="px-3.5 py-3">Nhà Cung Cấp</th>
                <th className="px-3 py-3 text-center">Ngày Đặt / ETA</th>
                <th className="px-3 py-3 text-center">Mặt Hàng</th>
                <th className="px-3.5 py-3 text-right bg-indigo-50/50 text-indigo-950 border-x border-indigo-100">
                  Tổng Đặt NCC
                </th>
                <th className="px-3.5 py-3 text-right bg-emerald-50/50 text-emerald-950 border-r border-emerald-100">
                  Đã Nhập
                </th>
                <th className="px-3.5 py-3 text-right bg-amber-50/50 text-amber-950 border-r border-amber-100">
                  Còn Chờ
                </th>
                <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                <th className="px-3.5 py-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <ShoppingCart className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">Chưa có Đơn đặt NCC (PO) nào phù hợp.</p>
                      <p className="text-[11px] text-slate-400">
                        Bạn có thể chọn các đề nghị từ Sales ở tab "Đơn Cần Đặt" hoặc bấm "+ Tạo Đơn Đặt NCC".
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => {
                  const meta = getStatusBadge(po.status);
                  const waitingQty = Math.max(0, po.totalOrderQuantity - po.totalReceivedQuantity);
                  const progress =
                    po.totalOrderQuantity > 0
                      ? Math.min(100, Math.round((po.totalReceivedQuantity / po.totalOrderQuantity) * 100))
                      : 0;

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-indigo-50/20 transition-colors cursor-pointer"
                      onClick={() => setDetailPO(po)}
                    >
                      <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">
                        {po.poNumber}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="font-bold text-slate-900">{po.supplierName}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                          Kho: {po.warehouseLocation}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{formatDate(po.orderDate)}</div>
                        <div className="text-[10px] text-slate-400">
                          ETA: {po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">
                        {po.items.length} mã
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-indigo-900 bg-indigo-50/10 border-x border-indigo-100">
                        {po.totalOrderQuantity.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-800 bg-emerald-50/10 border-r border-emerald-100">
                        {po.totalReceivedQuantity.toLocaleString()}
                        <div className="text-[9px] text-emerald-600 font-semibold">{progress}%</div>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-amber-800 bg-amber-50/10 border-r border-amber-100">
                        {waitingQty.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${meta.bg}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td
                        className="px-3.5 py-2.5 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailPO(po)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                            title="Xem chi tiết PO & phân rã"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi Tiết</span>
                          </button>

                          {canManage && po.status !== 'completed' && po.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => setReceiveInboundPO(po)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
                              title="Tạo phiếu nhập kho theo PO"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              <span>Nhập Kho</span>
                            </button>
                          )}
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

      {/* Detail PO Modal */}
      {detailPO && (
        <PurchaseOrderDetailModal
          po={detailPO}
          onClose={() => setDetailPO(null)}
          onOpenReceiveInbound={(poTarget) => setReceiveInboundPO(poTarget)}
        />
      )}

      {/* Receive Inbound Modal */}
      {receiveInboundPO && (
        <ReceivePOInboundModal
          isOpen={!!receiveInboundPO}
          po={receiveInboundPO}
          onClose={() => setReceiveInboundPO(null)}
        />
      )}
    </div>
  );
};
