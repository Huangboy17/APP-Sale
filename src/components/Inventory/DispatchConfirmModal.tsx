import React, { useState } from 'react';
import { ReserveItem, Customer, Contract } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  Truck,
  X,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Phone,
  MapPin,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';

interface DispatchConfirmModalProps {
  item: ReserveItem | null;
  customer?: Customer;
  contract?: Contract;
  onClose: () => void;
  onConfirm: (reserveId: string, dispatchData: { receiverName: string; receiverPhone: string; notes: string; dispatchDate: string }) => void;
}

export const DispatchConfirmModal: React.FC<DispatchConfirmModalProps> = ({
  item,
  customer,
  contract,
  onClose,
  onConfirm,
}) => {
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiverName, setReceiverName] = useState(
    customer?.name || contract?.customerRepresentative || item?.customerName || ''
  );
  const [receiverPhone, setReceiverPhone] = useState(customer?.phone || contract?.customerPhone || '');
  const [notes, setNotes] = useState('Xuất kho bàn giao công trình theo hợp đồng');

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(item.id, {
      dispatchDate,
      receiverName,
      receiverPhone,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/60 border border-emerald-500/50 flex items-center justify-center text-white">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Xác Nhận Xuất Kho Giao Hàng</h3>
              <p className="text-xs text-emerald-200">Phiếu xuất kho theo hợp đồng ký kết</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-600/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-bold text-xs text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {item.sku}
                </span>
                <h4 className="font-bold text-slate-900 mt-1 text-xs">{item.productName}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Số lượng xuất</span>
                <span className="font-mono font-extrabold text-base text-emerald-800">
                  {item.reservedQuantity} {item.unit}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-[11px]">
              <div>
                <span className="text-slate-500">Hợp đồng:</span>{' '}
                <strong className="text-slate-900">{item.contractNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500">Khách hàng:</span>{' '}
                <strong className="text-slate-900">{customer?.name || item.customerName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Sales phụ trách:</span>{' '}
                <strong className="text-slate-900">{customer?.assignedToName || item.salesRepName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Vị trí xuất:</span>{' '}
                <strong className="text-slate-900">{item.warehouseLocation || 'Kho Tổng'}</strong>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ngày Xuất Kho Thực Tế <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Người Nhận Hàng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Họ tên người nhận tại công trình"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại Nhận</label>
              <input
                type="text"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="Số điện thoại nhận hàng"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Địa Chỉ Bàn Giao</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 truncate" title={contract?.deliveryAddress || customer?.address || 'Tại chân công trình'}>
                {contract?.deliveryAddress || customer?.address || 'Theo địa chỉ hợp đồng'}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi Chú Xuất Kho / Đơn Vị Vận Chuyển</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Xe tải giao nhận số 51C-xxx, bàn giao nguyên đai nguyên kiện..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Warning Notice */}
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Khi xác nhận xuất kho: Hệ thống sẽ tự động trừ <strong>{item.reservedQuantity} {item.unit}</strong> khỏi Tồn thực tế tại kho và chuyển trạng thái giữ hàng sang <strong>Đã xuất kho</strong>.
            </p>
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
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Xác Nhận Xuất Kho ({item.reservedQuantity} {item.unit})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
