import React, { useState } from 'react';
import { OrderItem, Contract } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  PackagePlus,
  X,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Layers,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ReceiveOrderModalProps {
  order: OrderItem | null;
  customer?: Customer;
  contract?: Contract;
  onClose: () => void;
  onConfirm: (orderId: string, warehouseLocation: string) => void;
}

export const ReceiveOrderModal: React.FC<ReceiveOrderModalProps> = ({
  order,
  customer,
  contract,
  onClose,
  onConfirm,
}) => {
  const [warehouseLocation, setWarehouseLocation] = useState('Kho Tổng TP.HCM (Kệ A1-03)');
  const [notes, setNotes] = useState('Hàng nhà cung cấp giao đủ, bao bì nguyên vẹn');

  if (!order) return null;

  const assignedSalesName = customer?.assignedToName || order.salesRepName;
  const customerDisplayName = customer?.name || order.customerName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(order.id, warehouseLocation);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PackagePlus className="w-5 h-5" />
            <h3 className="font-bold text-sm">Xác Nhận Hàng Đã Về Kho & Tự Động Giữ Hàng</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-blue-800/60 hover:bg-blue-800 text-blue-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Order Summary Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-blue-700">{order.sku}</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Nhập kho: {order.orderQuantity} {order.unit}
              </span>
            </div>
            <div className="font-bold text-slate-900 text-xs">{order.productName}</div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500">Hợp đồng:</span>{' '}
                <strong className="text-slate-900">{order.contractNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500">Khách hàng:</span>{' '}
                <strong className="text-slate-900">{customerDisplayName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Sales phụ trách:</span>{' '}
                <strong className="text-slate-900">{assignedSalesName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Dự kiến ETA:</span>{' '}
                <strong className="text-slate-900">{order.supplierETA ? formatDate(order.supplierETA) : 'Chưa ghi nhận'}</strong>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Chọn Vị Trí / Kệ Lưu Kho <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={warehouseLocation}
              onChange={(e) => setWarehouseLocation(e.target.value)}
              placeholder="VD: Kho Tổng TP.HCM (Kệ A1-03) hoặc Kho Hà Nội"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi Chú Kiểm Nhập Kho</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú về lô hàng, số hóa đơn VAT đầu vào hoặc kiểm định..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Smart Automation Notice */}
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
            <div className="font-bold flex items-center space-x-1 text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quy trình tự động hóa kho:</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-emerald-800">
              <li>Cộng <strong>+{order.orderQuantity} {order.unit}</strong> vào Tồn thực tế của mã <strong>{order.sku}</strong>.</li>
              <li>Tự động chuyển mã này sang <strong>Bảng Giữ Hàng</strong> cho hợp đồng <strong>{order.contractNumber}</strong> của Sale <strong>{assignedSalesName}</strong>.</li>
              <li>Đánh dấu đơn đặt hàng này là <strong>Đã về kho</strong>.</li>
            </ul>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Nhập Kho & Khóa Giữ Hàng ({order.orderQuantity} {order.unit})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
