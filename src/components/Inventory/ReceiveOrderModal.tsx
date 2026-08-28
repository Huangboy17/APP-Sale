import React, { useState } from 'react';
import { OrderItem, Contract, Customer } from '../../types';
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
  Receipt,
  Boxes,
} from 'lucide-react';

interface ReceiveOrderModalProps {
  order: OrderItem | null;
  customer?: Customer;
  contract?: Contract;
  onClose: () => void;
  onConfirm: (
    orderId: string,
    receiveQuantity: number,
    warehouseLocation: string,
    notes?: string,
    receiptNumber?: string
  ) => void;
}

export const ReceiveOrderModal: React.FC<ReceiveOrderModalProps> = ({
  order,
  customer,
  contract,
  onClose,
  onConfirm,
}) => {
  const currentRemaining = order
    ? order.remainingQuantity !== undefined
      ? order.remainingQuantity
      : order.orderQuantity - (order.receivedQuantity || 0)
    : 0;

  const [receiveQuantity, setReceiveQuantity] = useState<number>(currentRemaining > 0 ? currentRemaining : 1);
  const [receiptNumber, setReceiptNumber] = useState<string>(
    `PN-${new Date().getFullYear()}/${Date.now().toString().slice(-6)}`
  );
  const [warehouseLocation, setWarehouseLocation] = useState('Kho Tổng TP.HCM (Kệ A1-03)');
  const [notes, setNotes] = useState('Hàng nhà cung cấp giao nguyên kiện, đã kiểm tra đạt chuẩn');

  if (!order) return null;

  const assignedSalesName = customer?.assignedToName || order.salesRepName;
  const customerDisplayName = customer?.name || order.customerName;
  const prevReceived = order.receivedQuantity || 0;
  const nextRemaining = Math.max(0, currentRemaining - (receiveQuantity || 0));
  const isFullInbound = nextRemaining === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiveQuantity <= 0) {
      alert('Số lượng nhận phải lớn hơn 0');
      return;
    }
    if (receiveQuantity > currentRemaining) {
      if (
        !window.confirm(
          `Số lượng nhập (${receiveQuantity}) lớn hơn số lượng còn thiếu (${currentRemaining}). Bạn có chắc chắn muốn nhập vượt số lượng đặt?`
        )
      ) {
        return;
      }
    }
    onConfirm(order.id, receiveQuantity, warehouseLocation, notes, receiptNumber);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PackagePlus className="w-5 h-5" />
            <h3 className="font-bold text-sm">Nhập Hàng Vào Kho & Tự Động Phân Bổ Giữ Hàng</h3>
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
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-blue-700">{order.sku}</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                  Tổng đặt: {order.orderQuantity} {order.unit}
                </span>
                {prevReceived > 0 && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Đã về: {prevReceived}
                  </span>
                )}
              </div>
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
                <span className="text-slate-500">Còn thiếu:</span>{' '}
                <strong className="text-amber-700 font-mono font-bold">
                  {currentRemaining} {order.unit}
                </strong>
              </div>
            </div>
          </div>

          {/* Quantity Input with Batch Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Số Lượng Nhập Đợt Này <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={1}
                  max={order.orderQuantity * 2}
                  value={receiveQuantity}
                  onChange={(e) => setReceiveQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-bold text-blue-900 font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-hidden"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">{order.unit}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                <span>Còn thiếu: <strong>{currentRemaining}</strong></span>
                <button
                  type="button"
                  onClick={() => setReceiveQuantity(currentRemaining)}
                  className="text-blue-600 hover:underline font-bold"
                >
                  Nhập hết ({currentRemaining})
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Mã Số Phiếu Nhập Kho <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="PN-2026/08..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Location & Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Vị Trí / Kệ Kho Lưu Hàng <span className="text-rose-500">*</span>
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
            <label className="block text-xs font-bold text-slate-800 mb-1">Ghi Chú Kiểm Nhập Kho</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú về lô hàng, số hóa đơn VAT đầu vào hoặc kiểm định..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Inbound Progression Calculation Strip */}
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-[11px]">
              <span className="flex items-center space-x-1 text-indigo-800">
                <Boxes className="w-3.5 h-3.5" />
                <span>Tiến trình sau khi nhập:</span>
              </span>
              <span className={isFullInbound ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                {isFullInbound ? '🟢 Đã đủ 100% hàng' : `🟡 Hàng về 1 phần (còn thiếu ${nextRemaining} ${order.unit})`}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isFullInbound ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(((prevReceived + (receiveQuantity || 0)) / order.orderQuantity) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="text-[10px] text-indigo-800 flex items-center justify-between">
              <span>Đã về: <strong>{prevReceived + (receiveQuantity || 0)}</strong> / {order.orderQuantity} {order.unit}</span>
              <span>Tồn thực tế: <strong>+{receiveQuantity}</strong></span>
              <span>Tạo giữ hàng: <strong>+{receiveQuantity}</strong></span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Xác Nhận Nhập Kho ({receiveQuantity} {order.unit})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
