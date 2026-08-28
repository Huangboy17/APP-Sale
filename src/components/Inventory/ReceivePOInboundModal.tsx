import React, { useState, useMemo } from 'react';
import { PurchaseOrder } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import {
  X,
  PackagePlus,
  Boxes,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ReceivePOInboundModalProps {
  isOpen: boolean;
  po: PurchaseOrder;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReceivePOInboundModal: React.FC<ReceivePOInboundModalProps> = ({
  isOpen,
  po,
  onClose,
  onSuccess,
}) => {
  const { confirmStockInFromPO, currentUser } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const defaultVoucherNo = `PNK-${today.replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

  const [voucherNumber, setVoucherNumber] = useState(defaultVoucherNo);
  const [inboundDate, setInboundDate] = useState(today);
  const [warehouseLocation, setWarehouseLocation] = useState(po.warehouseLocation || 'Kho Tổng TP.HCM');
  const [notes, setNotes] = useState(`Nhập kho từ đơn đặt NCC ${po.poNumber}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inbound quantities for each PO item: { [itemId]: number }
  const [actualQuantities, setActualQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    (po.items || []).forEach((item) => {
      init[item.id] = Math.max(0, item.remainingQuantity);
    });
    return init;
  });

  const handleQtyChange = (itemId: string, maxRemaining: number, val: string) => {
    const parsed = parseInt(val, 10);
    const qty = isNaN(parsed) ? 0 : Math.max(0, Math.min(maxRemaining, parsed));
    setActualQuantities((prev) => ({
      ...prev,
      [itemId]: qty,
    }));
  };

  const totalReceivingNow = useMemo(() => {
    return Object.values(actualQuantities).reduce((sum, q) => sum + (Number(q) || 0), 0);
  }, [actualQuantities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (totalReceivingNow <= 0) {
      setErrorMessage('Vui lòng nhập số lượng thực nhận ít nhất cho 1 mặt hàng (lớn hơn 0).');
      return;
    }

    try {
      setIsSubmitting(true);
      await confirmStockInFromPO(po.id, {
        actualQuantities,
        warehouseLocation,
        notes: notes.trim() || undefined,
        receiptNumber: voucherNumber.trim() || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã xảy ra lỗi khi tạo Phiếu Nhập Kho.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-emerald-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <PackagePlus className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Tạo Phiếu Nhập Kho Theo Đơn Đặt NCC</h2>
              <p className="text-xs text-emerald-200">
                Đơn đặt: <strong className="text-white font-mono">{po.poNumber}</strong> • NCC: {po.supplierName}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Inbound Info Inputs */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Số Phiếu Nhập Kho (PNK) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ngày Thực Nhập
              </label>
              <input
                type="date"
                required
                value={inboundDate}
                onChange={(e) => setInboundDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kho Nhận Hàng
              </label>
              <select
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
              >
                <option value="Kho Tổng TP.HCM">Kho Tổng TP.HCM</option>
                <option value="Kho Hà Nội">Kho Hà Nội</option>
                <option value="Kho Đà Nẵng">Kho Đà Nẵng</option>
                <option value="Kho Phụ Phân Phối">Kho Phụ Phân Phối</option>
              </select>
            </div>
          </div>

          {/* Table of Inbound Items */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-3 bg-emerald-50/60 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-950 font-bold">
              <span>Danh Sách Mặt Hàng Nhập Kho Đợt Này</span>
              <span>Tổng nhận đợt này: {totalReceivingNow.toLocaleString()} sản phẩm</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Mã SKU</th>
                    <th className="px-3.5 py-2.5">Tên Sản Phẩm</th>
                    <th className="px-3 py-2.5 text-center bg-slate-50 border-x">Đặt NCC</th>
                    <th className="px-3 py-2.5 text-center bg-blue-50/40 text-blue-900 border-r border-blue-100">Đã Nhập</th>
                    <th className="px-3 py-2.5 text-center bg-rose-50/40 text-rose-900 border-r border-rose-100">Còn Chờ</th>
                    <th className="px-3.5 py-2.5 text-center bg-emerald-50/70 text-emerald-950 min-w-36">
                      Thực Nhận Đợt Này <span className="text-rose-500">*</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {po.items.map((item) => {
                    const currentVal = actualQuantities[item.id] ?? 0;
                    const maxRem = item.remainingQuantity;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">{item.sku}</td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900 max-w-[220px] truncate" title={item.productName}>
                          {item.productName}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800 border-x bg-slate-50/50">
                          {item.supplierOrderQuantity} {item.unit}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-800 bg-blue-50/10 border-r border-blue-100">
                          {item.receivedQuantity} {item.unit}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-rose-800 bg-rose-50/10 border-r border-rose-100">
                          {maxRem} {item.unit}
                        </td>
                        <td className="px-3.5 py-2 text-center bg-emerald-50/30">
                          <input
                            type="number"
                            min={0}
                            max={maxRem}
                            value={currentVal}
                            onChange={(e) => handleQtyChange(item.id, maxRem, e.target.value)}
                            disabled={maxRem <= 0}
                            className={`w-28 px-2 py-1 text-center font-mono font-black text-sm rounded-lg border focus:ring-2 focus:ring-emerald-500 outline-hidden ${
                              maxRem <= 0
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allocation Preview */}
          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs space-y-1.5">
            <div className="font-bold text-indigo-950 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Nguyên Tắc Phân Bổ Tự Động Khi Xác Nhận:</span>
            </div>
            <ul className="list-disc list-inside text-indigo-900 space-y-0.5 pl-1">
              <li>Hàng thực nhận sẽ ưu tiên phân bổ cho các Sales Request theo thứ tự hạn cần giao sớm nhất.</li>
              <li>Hàng đã phân bổ sẽ chuyển sang trạng thái sẵn sàng xuất giao cho khách hàng (Reserved / Allocated).</li>
              <li>Phần số lượng mua thêm (vượt nhu cầu Sales) sẽ trực tiếp tăng Tồn kho khả dụng của công ty.</li>
            </ul>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ghi Chú Phiếu Nhập Kho
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalReceivingNow <= 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang xử lý nhập kho...' : 'Xác Nhận Nhập Kho & Phân Bổ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
