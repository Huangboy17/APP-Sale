import React, { useState, useEffect } from 'react';
import { ReserveItem, Customer, Contract } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  X,
  Save,
  RotateCcw,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  Warehouse,
  Calendar,
  Layers,
  FileText,
  User,
  Building,
} from 'lucide-react';

interface EditReserveItemModalProps {
  item: ReserveItem | null;
  customer?: Customer;
  contract?: Contract;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: ReserveItem) => void;
}

export const EditReserveItemModal: React.FC<EditReserveItemModalProps> = ({
  item,
  customer,
  contract,
  isOpen,
  onClose,
  onSave,
}) => {
  const [status, setStatus] = useState<'holding' | 'dispatched' | 'cancelled'>('holding');
  const [reservedQuantity, setReservedQuantity] = useState<number>(0);
  const [warehouseLocation, setWarehouseLocation] = useState<string>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');

  useEffect(() => {
    if (item) {
      setStatus(item.status);
      setReservedQuantity(item.reservedQuantity);
      setWarehouseLocation(item.warehouseLocation || 'Kho Tổng TP.HCM (Kệ A1)');
      setExpectedDeliveryDate(item.expectedDeliveryDate || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reservedQuantity <= 0) {
      alert('Số lượng giữ hàng phải lớn hơn 0!');
      return;
    }

    onSave({
      ...item,
      status,
      reservedQuantity: Number(reservedQuantity),
      warehouseLocation: warehouseLocation.trim() || 'Kho Tổng TP.HCM',
      expectedDeliveryDate,
    });
    onClose();
  };

  const isStatusChanged = status !== item.status;
  const isRevertingDispatched = item.status === 'dispatched' && status === 'holding';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Sửa Trạng Thái & Thông Tin Giữ Hàng</h3>
              <p className="text-[11px] text-slate-400">
                Cho phép sửa lại khi ấn nhầm thao tác xuất kho hoặc đổi vị trí/số lượng
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
          {/* Target Item & Customer Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {item.sku}
                </span>
                <span className="ml-2 font-bold text-slate-900">{item.productName}</span>
              </div>
              <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 shrink-0">
                Gốc: {item.reservedQuantity} {item.unit}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-slate-600">
              <div className="flex items-center space-x-1.5 truncate">
                <Building className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  Khách: <strong>{item.customerName}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 truncate">
                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  HĐ: <strong>{item.contractNumber}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 truncate">
                <User className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  Sale: <strong>{customer?.assignedToName || item.salesRepName}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 truncate">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Ngày tạo: {formatDate(item.reservedDate)}</span>
              </div>
            </div>
          </div>

          {/* STATUS SELECTOR (Primary Fix for Accidental Clicks) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Trạng Thái Giữ Hàng / Xuất Kho <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {/* Option 1: Holding */}
              <button
                type="button"
                onClick={() => setStatus('holding')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  status === 'holding'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Đang Giữ</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Khóa tồn kho cho HĐ của khách</p>
              </button>

              {/* Option 2: Dispatched */}
              <button
                type="button"
                onClick={() => setStatus('dispatched')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  status === 'dispatched'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Đã Xuất Kho</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Đã giao hàng (trừ tồn thực tế)</p>
              </button>

              {/* Option 3: Cancelled */}
              <button
                type="button"
                onClick={() => setStatus('cancelled')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  status === 'cancelled'
                    ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-rose-800 font-bold text-xs">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Hủy Giữ</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Trả lại vào tồn khả dụng</p>
              </button>
            </div>

            {/* Smart helpful notices for accidental clicks */}
            {isRevertingDispatched && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Hoàn tác xuất kho:</strong> Bạn đang chuyển từ <em>Đã Xuất Kho</em> về lại{' '}
                  <em>Đang Giữ Kho</em>. Hệ thống sẽ tự động <strong>hoàn trả lại số lượng tồn thực tế (+{reservedQuantity} {item.unit})</strong> vào kho.
                </div>
              </div>
            )}
          </div>

          {/* EDITABLE FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số Lượng Giữ ({item.unit}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={reservedQuantity}
                onChange={(e) => setReservedQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono font-bold"
                required
              />
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hạn Giao Hàng Dự Kiến
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Warehouse Rack Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Vị Trí Kệ Lưu Trữ Trong Kho
            </label>
            <div className="relative">
              <Warehouse className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                placeholder="VD: Kho Tổng TP.HCM (Kệ A1 - Tầng 2)"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
              />
            </div>
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md transition cursor-pointer"
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
