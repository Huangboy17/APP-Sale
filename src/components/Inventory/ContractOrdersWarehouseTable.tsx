import React, { useState } from 'react';
import { OrderItem, Contract, Customer } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { EditOrderItemModal } from './EditOrderItemModal';
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  PackagePlus,
  FileText,
  User,
  Building,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  Edit2,
  Save,
  X,
  Sparkles,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ContractOrdersWarehouseTableProps {
  orderItems: OrderItem[];
  contracts: Contract[];
  customers: Customer[];
  onOpenReceiveModal: (order: OrderItem) => void;
  onUpdateOrderStatus: (id: string, status: 'pending_order' | 'ordered' | 'arrived_in_stock' | 'cancelled', notes?: string) => void;
  onOpenContractPdf: (contractId: string) => void;
}

export const ContractOrdersWarehouseTable: React.FC<ContractOrdersWarehouseTableProps> = ({
  orderItems,
  contracts,
  customers,
  onOpenReceiveModal,
  onUpdateOrderStatus,
  onOpenContractPdf,
}) => {
  const { updateOrderItem } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_order' | 'ordered' | 'arrived_in_stock' | 'cancelled'>('all');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [editingOrderItem, setEditingOrderItem] = useState<OrderItem | null>(null);

  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const filteredOrders = orderItems.filter((o) => {
    const matchSearch =
      o.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.salesRepName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = orderItems.filter((o) => o.status === 'pending_order').length;
  const orderedCount = orderItems.filter((o) => o.status === 'ordered').length;
  const arrivedCount = orderItems.filter((o) => o.status === 'arrived_in_stock').length;

  const totalNeededQuantity = orderItems
    .filter((o) => o.status === 'pending_order' || o.status === 'ordered')
    .reduce((sum, o) => sum + o.orderQuantity, 0);

  // Export Excel for Procurement POs
  const handleExportExcel = () => {
    const data = filteredOrders.map((o, idx) => {
      const cust = customerMap.get(o.customerId);
      return {
        'STT': idx + 1,
        'Mã Hàng (SKU)': o.sku,
        'Tên Sản Phẩm': o.productName,
        'Hãng Sản Xuất': o.brand,
        'Quy Cách / Kích Thước': o.size,
        'Màu Sắc': o.color,
        'Số Lượng Cần Đặt': o.orderQuantity,
        'ĐVT': o.unit,
        'Khách Hàng': o.customerName,
        'Công Ty Khách': cust?.company || '',
        'Số Hợp Đồng': o.contractNumber,
        'Số Báo Giá': o.quoteNumber,
        'Sales Phụ Trách': o.salesRepName,
        'Ngày Tạo Đơn HĐ': o.orderDate,
        'Dự Kiến Hàng Về (ETA)': o.supplierETA || '',
        'Ghi Chú Tiến Độ PO': o.notes || '',
        'Trạng Thái':
          o.status === 'pending_order'
            ? 'Chờ đặt hàng NCC'
            : o.status === 'ordered'
            ? 'Đã đặt hàng NCC'
            : o.status === 'arrived_in_stock'
            ? 'Đã về kho'
            : 'Đã hủy',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hang_Can_Dat_PO_KHO');
    XLSX.writeFile(workbook, `Danh_Sach_Hang_Can_Dat_PO_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSaveNotes = (id: string) => {
    const item = orderItems.find((o) => o.id === id);
    if (item) {
      onUpdateOrderStatus(id, item.status, tempNotes);
    }
    setEditingNotesId(null);
  };

  return (
    <div className="space-y-3">
      {/* Search & Filter Header */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo SKU, tên sản phẩm, hãng, khách hàng, số HĐ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium text-slate-700"
          >
            <option value="all">Tất cả tiến độ đặt ({orderItems.length})</option>
            <option value="pending_order">Chờ đặt NCC ({pendingCount})</option>
            <option value="ordered">Đã đặt NCC / Đang về ({orderedCount})</option>
            <option value="arrived_in_stock">Đã nhập kho ({arrivedCount})</option>
            <option value="cancelled">Đã hủy đơn đặt</option>
          </select>

          {/* Export button */}
          <button
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-700" />
            <span>Xuất Excel Đặt Hàng PO ({filteredOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Banner Info */}
        <div className="p-3 bg-indigo-50/70 border-b border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-indigo-950">
            <ShoppingCart className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Hàng cần đặt mua từ nhà cung cấp:</strong> Cần mua thêm <strong>{totalNeededQuantity.toLocaleString()}</strong> sản phẩm theo các hợp đồng đã ký của khách.
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-semibold text-indigo-900">
            <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 rounded text-amber-900">
              Chờ đặt: {pendingCount}
            </span>
            <span className="px-2 py-0.5 bg-blue-100 border border-blue-300 rounded text-blue-900">
              Đã đặt: {orderedCount}
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 rounded text-emerald-900">
              Đã về kho: {arrivedCount}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3.5 py-3">Mã SKU & Sản Phẩm</th>
                <th className="px-3 py-3 text-center bg-indigo-50/80 text-indigo-950 border-x border-indigo-200">
                  SL Cần Đặt
                </th>
                <th className="px-3.5 py-3">Hãng / Quy Cách / Màu</th>
                <th className="px-3.5 py-3">Hợp Đồng & Khách Hàng</th>
                <th className="px-3.5 py-3">Sales Phụ Trách</th>
                <th className="px-3.5 py-3">Ngày Đặt & Dự Kiến (ETA)</th>
                <th className="px-3.5 py-3">Ghi Chú PO / Tiến Độ</th>
                <th className="px-3.5 py-3 text-center">Trạng Thái & Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShoppingCart className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">Không có đơn đặt hàng nào phù hợp</p>
                      <p className="text-xs text-slate-400">Tất cả sản phẩm theo hợp đồng đã đủ tồn kho hoặc chưa phát sinh đơn mới</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const cust = customerMap.get(order.customerId);
                  const isEditingThisNotes = editingNotesId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-indigo-50/20 transition-colors">
                      {/* SKU & Name */}
                      <td className="px-3.5 py-2.5">
                        <div className="font-mono font-bold text-indigo-700">{order.sku}</div>
                        <div className="font-bold text-slate-900 line-clamp-1" title={order.productName}>
                          {order.productName}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-2.5 text-center bg-indigo-50/40 border-x border-indigo-100">
                        <span className="font-mono font-black text-sm text-indigo-950 block">
                          {order.orderQuantity}
                        </span>
                        <span className="text-[10px] text-indigo-800 font-semibold">{order.unit}</span>
                      </td>

                      {/* Specs */}
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-slate-800">{order.brand}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">{order.size}</div>
                        {order.color && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{order.color}</div>
                        )}
                      </td>

                      {/* Contract & Customer */}
                      <td className="px-3.5 py-2.5">
                        <button
                          type="button"
                          onClick={() => onOpenContractPdf(order.contractId)}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 cursor-pointer"
                          title="Bấm để xem hợp đồng PDF"
                        >
                          <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{order.contractNumber}</span>
                        </button>
                        <div className="font-semibold text-slate-900 mt-0.5">{order.customerName}</div>
                        {cust?.company && (
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">{cust.company}</div>
                        )}
                      </td>

                      {/* Sales Rep */}
                      <td className="px-3.5 py-2.5">
                        <div className="font-bold text-slate-900 flex items-center space-x-1">
                          <User className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{order.salesRepName}</span>
                        </div>
                      </td>

                      {/* Date & ETA */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <div className="text-[11px] font-semibold text-slate-800 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>ETA: {order.supplierETA ? formatDate(order.supplierETA) : 'Chưa có'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Tạo ngày: {formatDate(order.orderDate)}
                        </div>
                      </td>

                      {/* Notes & Supplier updates */}
                      <td className="px-3.5 py-2.5 max-w-xs">
                        {isEditingThisNotes ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Nhập ghi chú PO..."
                              className="px-2 py-1 text-xs border border-indigo-400 rounded w-full outline-hidden"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNotes(order.id)}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                              title="Lưu ghi chú"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 cursor-pointer"
                              title="Hủy"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNotesId(order.id);
                              setTempNotes(order.notes || '');
                            }}
                            className="group flex items-start justify-between p-1 rounded hover:bg-slate-100 cursor-pointer transition"
                            title="Bấm để sửa ghi chú tiến độ PO"
                          >
                            <span className="text-[11px] text-slate-600 line-clamp-2">
                              {order.notes || <span className="text-slate-400 italic">+ Thêm ghi chú PO...</span>}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 ml-1 shrink-0 transition-opacity" />
                          </div>
                        )}
                      </td>

                      {/* Status & Actions */}
                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {order.status === 'pending_order' && (
                            <>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                                <span>Chờ Đặt PO</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(order.id, 'ordered', 'Đã đặt hàng nhà cung cấp')}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                                title="Đánh dấu đã gửi đơn PO cho nhà cung cấp"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                <span>1. Gửi Đặt PO</span>
                              </button>
                            </>
                          )}

                          {order.status === 'ordered' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenReceiveModal(order)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                                title="Hàng đã về tới kho: Nhập kho & Khóa giữ hàng cho hợp đồng"
                              >
                                <PackagePlus className="w-3 h-3" />
                                <span>2. Hàng Về Nhập Kho</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm('Hoàn tác về trạng thái "Chờ Đặt PO" (nếu ấn nhầm)?')) {
                                    onUpdateOrderStatus(order.id, 'pending_order', 'Đã hoàn tác về chờ đặt');
                                  }
                                }}
                                className="px-1.5 py-1 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-200 rounded text-xs font-bold transition cursor-pointer"
                                title="Hoàn tác về Chờ Đặt PO (nếu ấn nhầm)"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </>
                          )}

                          {order.status === 'arrived_in_stock' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã Nhập & Giữ Kho</span>
                            </span>
                          )}

                          {order.status === 'cancelled' && (
                            <>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center space-x-1">
                                <XCircle className="w-2.5 h-2.5 text-rose-600" />
                                <span>Đã Hủy Đơn</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(order.id, 'pending_order')}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                                title="Khôi phục lại đơn đặt hàng"
                              >
                                <RotateCcw className="w-3 h-3 text-blue-600" />
                                <span>Khôi Phục</span>
                              </button>
                            </>
                          )}

                          {/* Quick Edit modal trigger */}
                          <button
                            type="button"
                            onClick={() => setEditingOrderItem(order)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Sửa trạng thái / số lượng / ETA / ghi chú PO khi ấn nhầm"
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

      {/* Edit Order Item Modal */}
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
