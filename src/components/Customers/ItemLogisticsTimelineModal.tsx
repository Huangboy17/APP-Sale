import React from 'react';
import { Customer360ItemRow } from '../../services/customer360Service';
import { formatDate } from '../../utils/formatters';
import {
  X,
  PackageCheck,
  Building,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Boxes,
  ArrowRight,
  ShieldCheck,
  Receipt,
  ShoppingCart,
} from 'lucide-react';

interface ItemLogisticsTimelineModalProps {
  itemRow: Customer360ItemRow;
  customerName: string;
  onClose: () => void;
  onViewContract?: (contractId: string) => void;
  onViewPO?: (poId: string) => void;
  onViewStockIn?: (voucherId: string) => void;
  onViewStockOut?: (voucherId: string) => void;
}

export const ItemLogisticsTimelineModal: React.FC<ItemLogisticsTimelineModalProps> = ({
  itemRow,
  customerName,
  onClose,
  onViewContract,
  onViewPO,
  onViewStockIn,
  onViewStockOut,
}) => {
  const { logistics } = itemRow;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                  {itemRow.sku}
                </span>
                <h3 className="text-base font-bold">{itemRow.productName}</h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Hợp đồng: <strong className="text-white font-mono">{itemRow.contractNumber}</strong> • Khách hàng: <strong className="text-white">{customerName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Mini-Dashboard */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs shrink-0">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">SL Hợp Đồng</span>
            <span className="text-base font-black font-mono text-slate-900">
              {itemRow.contractQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-500">{itemRow.unit}</span>
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
            <span className="text-[10px] text-blue-700 font-bold uppercase block">Đã Lên Đơn NCC</span>
            <span className="text-base font-black font-mono text-blue-900">
              {logistics.supplierOrderedQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-500">{itemRow.unit}</span>
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-orange-200 bg-orange-50/20 shadow-2xs">
            <span className="text-[10px] text-orange-700 font-bold uppercase block">Đã Về Kho</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-base font-black font-mono text-orange-900">
                {logistics.receivedQuantity.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">/ {itemRow.contractQuantity}</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Đã Giao Khách</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-base font-black font-mono text-emerald-900">
                {logistics.deliveredQuantity.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">/ {itemRow.contractQuantity}</span>
            </div>
          </div>
        </div>

        {/* Body: Vertical Logistics Stepper Timeline */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 mb-4">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Tiến Trình Cung Ứng & Giao Nhận Hàng Hóa (Supply Chain Timeline)</span>
            </h4>

            {/* Stepper list */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {logistics.timelineSteps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isInProgress = step.status === 'in_progress';

                let icon = <CheckCircle2 className="w-3.5 h-3.5" />;
                let dotClass = 'bg-emerald-500 text-white ring-4 ring-emerald-100';

                if (isInProgress) {
                  dotClass = 'bg-blue-500 text-white ring-4 ring-blue-100 animate-pulse';
                } else if (!isCompleted) {
                  dotClass = 'bg-slate-300 text-slate-600 ring-4 ring-slate-100';
                }

                return (
                  <div key={idx} className="relative group">
                    {/* Circle Dot */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${dotClass}`}
                    >
                      {idx + 1}
                    </div>

                    {/* Step Content Card */}
                    <div className="bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-xl border border-slate-200 transition space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 flex items-center space-x-2">
                          <span>{step.title}</span>
                          {isCompleted && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                              ✓ Hoàn tất
                            </span>
                          )}
                          {isInProgress && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-300">
                              Đang thực hiện
                            </span>
                          )}
                        </span>

                        {step.date && (
                          <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {formatDate(step.date)}
                          </span>
                        )}
                      </div>

                      {step.details && (
                        <p className="text-xs text-slate-600 font-medium">
                          {step.details}
                        </p>
                      )}

                      {step.quantity !== undefined && (
                        <div className="text-[11px] text-slate-500 font-mono font-semibold pt-1">
                          Số lượng ghi nhận: <strong className="text-slate-800">{step.quantity} {itemRow.unit}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Linked Documents */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Chứng Từ Gốc Liên Quan
            </h5>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500">Hợp đồng:</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {itemRow.contractNumber}
              </span>

              {logistics.purchaseOrders.map((po) => (
                <div key={po.id} className="flex items-center space-x-1">
                  <span className="text-slate-500 ml-2">Đơn đặt NCC:</span>
                  <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {po.poNumber} ({po.supplierName})
                  </span>
                </div>
              ))}

              {logistics.stockInVouchers.map((inV) => (
                <div key={inV.id} className="flex items-center space-x-1">
                  <span className="text-slate-500 ml-2">Phiếu nhập:</span>
                  <span className="font-mono font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    {inV.voucherNumber} ({inV.quantity} sp)
                  </span>
                </div>
              ))}

              {logistics.stockOutVouchers.map((outV) => (
                <div key={outV.id} className="flex items-center space-x-1">
                  <span className="text-slate-500 ml-2">Phiếu xuất:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {outV.voucherNumber} ({outV.quantity} sp)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
