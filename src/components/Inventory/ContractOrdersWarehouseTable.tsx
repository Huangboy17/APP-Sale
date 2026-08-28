import React, { useState } from 'react';
import { OrderItem, Contract, Customer } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { EditOrderItemModal } from './EditOrderItemModal';
import {
  ShoppingCart,
  Search,
  Download,
  PackagePlus,
  FileText,
  User,
  Calendar,
  CheckCircle2,
  Save,
  X,
  RotateCcw,
  XCircle,
  Eye,
  Boxes,
  Truck,
  Receipt,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ContractOrdersWarehouseTableProps {
  orderItems: OrderItem[];
  contracts: Contract[];
  customers: Customer[];
  onOpenReceiveModal: (order: OrderItem) => void;
  onOpenContractPdf: (contractId: string) => void;
}

export const ContractOrdersWarehouseTable: React.FC<ContractOrdersWarehouseTableProps> = ({
  orderItems,
  contracts,
  customers,
  onOpenReceiveModal,
  onOpenContractPdf,
}) => {
  const {
    inventory,
    updateOrderItem,
    updateOrderWarehouseStatus,
    cancelOrderItem,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all_pending');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [editingOrderItem, setEditingOrderItem] = useState<OrderItem | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderItem | null>(null);

  const customerMap = React.useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

  const getAssignedSalesRepName = (o: OrderItem): string => {
    const cust = customerMap.get(o.customerId);
    if (cust) {
      return cust.assignedToName || 'Chưa phân công';
    }
    return o.salesRepName ? `${o.salesRepName} (Orphan)` : 'ORPHAN CUSTOMER';
  };

  const getCustomerDisplayName = (o: OrderItem): string => {
    const cust = customerMap.get(o.customerId);
    return cust?.name || o.customerName || 'ORPHAN CUSTOMER';
  };

  const getOrderMeta = (order: OrderItem) => {
    const orderQty = order.orderQuantity || 0;
    const receivedQty = order.receivedQuantity || 0;
    const remainingQty = order.remainingQuantity !== undefined ? order.remainingQuantity : Math.max(0, orderQty - receivedQty);
    const progress = orderQty > 0 ? Math.min(100, Math.round((receivedQty / orderQty) * 100)) : 0;

    switch (order.status) {
      case 'pending':
      case 'pending_order':
        return { label: '🔴 Chờ Kho Đáp Ứng', bgColor: 'bg-rose-50 text-rose-800 border-rose-300', dotColor: 'bg-rose-600', progress: 10, remainingQty };
      case 'ordered':
      case 'in_transit':
        return { label: '🟡 Hàng Đang Về', bgColor: 'bg-amber-50 text-amber-800 border-amber-300', dotColor: 'bg-amber-600', progress: 45, remainingQty };
      case 'arrived':
        return { label: '🔵 Đã Về Tới Kho', bgColor: 'bg-blue-50 text-blue-800 border-blue-300', dotColor: 'bg-blue-600', progress: 75, remainingQty };
      case 'partial':
        return { label: `🟠 Về 1 Phần (${receivedQty}/${orderQty})`, bgColor: 'bg-orange-50 text-orange-800 border-orange-300', dotColor: 'bg-orange-600', progress: Math.max(20, progress), remainingQty };
      case 'received':
      case 'ready_to_deliver':
      case 'arrived_in_stock':
        return { label: '🟢 Đã Đủ Hàng (Sẵn sàng giao)', bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-300', dotColor: 'bg-emerald-600', progress: 100, remainingQty: 0 };
      case 'delivered':
        return { label: '📦 Đã Giao Khách', bgColor: 'bg-slate-100 text-slate-800 border-slate-300', dotColor: 'bg-slate-500', progress: 100, remainingQty: 0 };
      default:
        return { label: order.status, bgColor: 'bg-slate-100 text-slate-800 border-slate-300', dotColor: 'bg-slate-500', progress: 0, remainingQty };
    }
  };

  const isPendingOrder = (status: string) => ['pending', 'pending_order', 'ordered', 'in_transit', 'arrived', 'partial'].includes(status);

  const filteredOrders = orderItems.filter((o) => {
    const resolvedSales = getAssignedSalesRepName(o);
    const resolvedCustomer = getCustomerDisplayName(o);
    const cust = customerMap.get(o.customerId);

    const matchSearch =
      o.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolvedCustomer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolvedSales.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust?.company && cust.company.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchStatus = true;
    if (statusFilter === 'all_pending') matchStatus = isPendingOrder(o.status);
    else if (statusFilter !== 'all') matchStatus = o.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const pendingActiveCount = orderItems.filter((o) => isPendingOrder(o.status)).length;
  const totalShortageQty = orderItems
    .filter((o) => isPendingOrder(o.status))
    .reduce((sum, o) => sum + Math.max(0, o.remainingQuantity ?? (o.orderQuantity - (o.receivedQuantity || 0))), 0);

  const handleExportExcel = () => {
    const data = filteredOrders.map((o, idx) => {
      const meta = getOrderMeta(o);
      return {
        'STT': idx + 1,
        'Mã SKU': o.sku,
        'Tên Sản Phẩm': o.productName,
        'Nhu Cầu Tối Thiểu (Sales)': o.orderQuantity,
        'Kho Đã Đáp Ứng': o.receivedQuantity || 0,
        'Còn Thiếu': meta.remainingQty,
        'Trạng Thái Đáp Ứng': meta.label,
        'Số Hợp Đồng': o.contractNumber,
        'Khách Hàng': getCustomerDisplayName(o),
        'Sales Phụ Trách': getAssignedSalesRepName(o),
        'Ngày Yêu Cầu': o.orderDate,
        'Ghi Chú': o.notes || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'NhuCau_DatHang');
    XLSX.writeFile(wb, `Danh_Sach_Nhu_Cau_Dat_Hang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSaveNotes = (id: string) => {
    const target = orderItems.find((o) => o.id === id);
    if (target) updateOrderItem({ ...target, notes: tempNotes });
    setEditingNotesId(null);
  };

  const handleCancelOrderPrompt = (order: OrderItem) => {
    const reason = window.prompt('Nhập lý do hủy yêu cầu đặt hàng:', 'Nhà cung cấp hết hàng');
    if (reason) cancelOrderItem(order.id, reason);
  };

  return (
    <div className="space-y-3">
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo SKU, tên sản phẩm, HĐ, khách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden bg-slate-50/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white">
            <option value="all_pending">Đang Cần Kho Đáp Ứng ({pendingActiveCount})</option>
            <option value="all">Tất cả ({orderItems.length})</option>
          </select>
          <button onClick={handleExportExcel} className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Xuất Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-3 bg-indigo-50/70 border-b border-indigo-200 flex items-center justify-between text-xs text-indigo-950">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4 text-indigo-600" />
            <span>Tổng nhu cầu Sales đang chờ Kho đáp ứng: <strong>{totalShortageQty.toLocaleString()}</strong> sản phẩm.</span>
          </div>
          <span className="text-[11px] text-slate-500 italic">Kho toàn quyền nhập số lượng thực tế ≥ nhu cầu</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="px-3.5 py-3">SKU & Sản Phẩm</th>
                <th className="px-3 py-3 text-center bg-indigo-50/40 border-x border-indigo-100">Nhu Cầu Sales</th>
                <th className="px-3 py-3 text-center bg-emerald-50/40 border-r border-emerald-100 text-emerald-900">Đã Đáp Ứng</th>
                <th className="px-3 py-3 text-center bg-amber-50/40 border-r border-amber-100 text-amber-900">Còn Thiếu</th>
                <th className="px-3.5 py-3">Hợp Đồng & Khách Hàng</th>
                <th className="px-3.5 py-3">Trạng Thái Đáp Ứng</th>
                <th className="px-3.5 py-3">Ghi Chú</th>
                <th className="px-3.5 py-3 text-center">Thao Tác Kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Không có yêu cầu đặt hàng nào trong danh sách.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const meta = getOrderMeta(order);
                  const isEditing = editingNotesId === order.id;
                  return (
                    <tr key={order.id} className="hover:bg-indigo-50/20 cursor-pointer" onClick={() => setDetailOrder(order)}>
                      <td className="px-3.5 py-2.5">
                        <div className="font-mono font-bold text-indigo-700">{order.sku}</div>
                        <div className="font-bold text-slate-900">{order.productName}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-900 border-x bg-indigo-50/10">
                        {order.orderQuantity} {order.unit}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-emerald-700 border-r bg-emerald-50/10">
                        {order.receivedQuantity || 0}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-amber-700 border-r bg-amber-50/10">
                        {meta.remainingQty}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="font-bold text-blue-600 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onOpenContractPdf(order.contractId); }}>
                          {order.contractNumber}
                        </div>
                        <div className="font-semibold text-slate-900">{getCustomerDisplayName(order)}</div>
                        <div className="text-[10px] text-slate-500">Sales: {getAssignedSalesRepName(order)}</div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.bgColor}`}>
                          {meta.label}
                        </span>
                        <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div className="bg-indigo-600 h-1.5 transition-all" style={{ width: `${meta.progress}%` }} />
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input type="text" value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} className="w-full border rounded px-1 text-xs" />
                            <Save className="w-3.5 h-3.5 text-emerald-600 cursor-pointer" onClick={() => handleSaveNotes(order.id)} />
                          </div>
                        ) : (
                          <span className="text-slate-600 truncate max-w-[120px] block" onClick={(e) => { e.stopPropagation(); setEditingNotesId(order.id); setTempNotes(order.notes || ''); }}>
                            {order.notes || '...'}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {isPendingOrder(order.status) && (
                            <>
                              <button
                                onClick={() => updateOrderWarehouseStatus(order.id, 'ordered')}
                                title="Đánh dấu Kho đã đặt NCC"
                                className="p-1 rounded hover:bg-blue-50 text-blue-600 transition cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onOpenReceiveModal(order)}
                                title="Nhập hàng vào kho & phân bổ"
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                                <span>Nhập Kho</span>
                              </button>
                            </>
                          )}
                          <button onClick={() => setDetailOrder(order)} title="Xem chi tiết" className="p-1 rounded hover:bg-slate-100 text-slate-600 transition cursor-pointer">
                            <Eye className="w-4 h-4" />
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

      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Boxes /> Chi tiết Đơn hàng: {detailOrder.sku}</h3>
            <div className="p-4 bg-indigo-50 rounded-xl space-y-2 text-sm">
              <p>Đã về: <strong>{detailOrder.receivedQuantity || 0} / {detailOrder.orderQuantity}</strong></p>
            </div>
            <button onClick={() => setDetailOrder(null)} className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold">Đóng</button>
          </div>
        </div>
      )}

      <EditOrderItemModal
        isOpen={!!editingOrderItem}
        order={editingOrderItem}
        contract={contracts.find((c) => c.id === editingOrderItem?.contractId)}
        customer={customers.find((c) => c.id === editingOrderItem?.customerId)}
        onClose={() => setEditingOrderItem(null)}
        onSave={(updated) => updateOrderItem(updated)}
      />
    </div>
  );
};
