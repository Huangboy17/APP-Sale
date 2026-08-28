import React, { useState, useEffect } from 'react';
import { OrderItem, Contract, Customer, OrderItemStatus } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  X,
  Save,
  RotateCcw,
  ShoppingCart,
  PackagePlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Building,
  FileText,
  User,
  Tag,
} from 'lucide-react';

interface EditOrderItemModalProps {
  order: OrderItem | null;
  contract?: Contract;
  customer?: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOrder: OrderItem) => void;
}

export const EditOrderItemModal: React.FC<EditOrderItemModalProps> = ({
  order,
  contract,
  customer,
  isOpen,
  onClose,
  onSave,
}) => {
  const [status, setStatus] = useState<OrderItemStatus>('pending');
  const [orderQuantity, setOrderQuantity] = useState<number>(0);
  const [supplierETA, setSupplierETA] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setOrderQuantity(order.orderQuantity);
      setSupplierETA(order.supplierETA || '');
      setBrand(order.brand || '');
      setSize(order.size || '');
      setColor(order.color || '');
      setNotes(order.notes || '');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderQuantity <= 0) {
      alert('Số lượng cần đặt phải lớn hơn 0!');
      return;
    }

    onSave({
      ...order,
      status,
      orderQuantity: Number(orderQuantity),
      supplierETA,
      brand,
      size,
      color,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Sửa Trạng Thái & Thông Tin Đặt Hàng PO</h3>
              <p className="text-[11px] text-slate-400">
                Cho phép sửa đổi tiến độ, khôi phục khi ấn nhầm hoặc đổi số lượng đặt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Item & Contract Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  {order.sku}
                </span>
                <span className="ml-2 font-bold text-slate-900">{order.productName}</span>
              </div>
              <span className="font-mono font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300 shrink-0">
                Đang đặt: {order.orderQuantity} {order.unit}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-slate-600">
              <div className="flex items-center space-x-1.5 truncate">
                <Building className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  Khách: <strong>{order.customerName}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 truncate">
                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  HĐ: <strong>{order.contractNumber}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 truncate">
                <User className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  Sale: <strong>{customer?.assignedToName || order.salesRepName}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 truncate">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Tạo: {formatDate(order.orderDate)}</span>
              </div>
            </div>
          </div>

          {/* STATUS SELECTOR */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Trạng Thái Tiến Độ Đặt Hàng <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* Option 1: pending / pending_order */}
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  status === 'pending' || status === 'pending_order'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1 text-amber-800 font-bold text-[11px]">
                  <ShoppingCart className="w-3 h-3" />
                  <span>Chờ Đặt PO</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Khôi phục nếu ấn nhầm</p>
              </button>

              {/* Option 2: ordered */}
              <button
                type="button"
                onClick={() => setStatus('ordered')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  status === 'ordered'
                    ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1 text-blue-800 font-bold text-[11px]">
                  <PackagePlus className="w-3 h-3" />
                  <span>Đã Đặt NCC</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Đang chờ NCC giao</p>
              </button>

              {/* Option 3: in_transit */}
              <button
                type="button"
                onClick={() => setStatus('in_transit')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  status === 'in_transit'
                    ? 'border-purple-500 bg-purple-50/80 ring-2 ring-purple-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1 text-purple-800 font-bold text-[11px]">
                  <Truck className="w-3 h-3" />
                  <span>Đang Vận Chuyển</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Hàng đang trên đường</p>
              </button>

              {/* Option 4: ready_to_deliver / arrived_in_stock */}
              <button
                type="button"
                onClick={() => setStatus('ready_to_deliver')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  status === 'ready_to_deliver' || status === 'arrived_in_stock' || status === 'received'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1 text-emerald-800 font-bold text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Đã Về Kho</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Đã nhập & khóa giữ</p>
              </button>

              {/* Option 5: cancelled */}
              <button
                type="button"
                onClick={() => setStatus('cancelled')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  status === 'cancelled'
                    ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1 text-rose-800 font-bold text-[11px]">
                  <XCircle className="w-3 h-3" />
                  <span>Hủy Đơn</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Hủy không đặt mua</p>
              </button>
            </div>
          </div>

          {/* EDITABLE FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số Lượng Đặt Mua ({order.unit}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono font-bold"
                required
              />
            </div>

            {/* ETA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dự Kiến Hàng Về (ETA)
              </label>
              <input
                type="date"
                value={supplierETA}
                onChange={(e) => setSupplierETA(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hãng Sản Xuất</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="VD: Nhôm Xingfa, Euroha..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            {/* Specs / Size */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quy Cách / Kích Thước</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="VD: Cây 6m, 55x50..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi Chú Tiến Độ / Số PO / Nhà Cung Cấp
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã gửi email PO cho NCC Euroha, hẹn giao 28/08..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Đóng / Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Cập Nhật</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
