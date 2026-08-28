import React, { useState } from 'react';
import {
  X,
  Boxes,
  Layers,
  ShoppingCart,
  History,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  User,
  FileText,
  Calendar,
  Warehouse,
  Plus,
  Minus,
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface ProductInventoryDrawerProps {
  item: InventoryItem | null;
  onClose: () => void;
  onOpenAddStockIn?: (sku: string) => void;
  onOpenAddStockOut?: (sku: string) => void;
}

export const ProductInventoryDrawer: React.FC<ProductInventoryDrawerProps> = ({
  item,
  onClose,
  onOpenAddStockIn,
  onOpenAddStockOut,
}) => {
  const {
    filteredReserveItems,
    filteredOrderItems,
    stockTransactions,
    quickAdjustStock,
    setPdfPreviewData,
    contracts,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'holds' | 'orders' | 'history'>('holds');
  const [isQuickAdjusting, setIsQuickAdjusting] = useState(false);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustNote, setAdjustNote] = useState('');

  if (!item) return null;

  const cleanSku = (item.sku || '').trim().toLowerCase();

  // 1. Reserves for this SKU
  const itemReserves = filteredReserveItems.filter(
    (r) =>
      (r.sku || '').trim().toLowerCase() === cleanSku ||
      (r.productName && item.name && r.productName.trim().toLowerCase() === item.name.trim().toLowerCase())
  );
  const activeHolds = itemReserves.filter((r) => r.status === 'holding');

  // 2. Orders for this SKU
  const itemOrders = filteredOrderItems.filter(
    (o) =>
      (o.sku || '').trim().toLowerCase() === cleanSku ||
      (o.productName && item.name && o.productName.trim().toLowerCase() === item.name.trim().toLowerCase())
  );
  const pendingOrders = itemOrders.filter((o) => o.status === 'pending_order' || o.status === 'ordered');

  // 3. Stock transactions for this SKU
  const itemTransactions = stockTransactions.filter(
    (tx) => (tx.sku || '').trim().toLowerCase() === cleanSku
  );

  const onHand = item.totalQuantity || 0;
  const reserved = item.reservedQuantity || 0;
  const available = item.availableQuantity || 0;
  const onOrder = item.onOrderQuantity || 0;

  // Status Badge Helper
  const getStatusBadge = () => {
    if (onHand === 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          <span>🔴 Hết Hàng (Out of Stock)</span>
        </span>
      );
    }
    if (available <= 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>🟡 Đã Bị Giữ Hết (Reserved 100%)</span>
        </span>
      );
    }
    if (available <= 5) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>🟠 Sắp Hết (Low Stock &le; 5)</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>🟢 Đủ Hàng Sẵn Có (In Stock)</span>
      </span>
    );
  };

  const handleApplyQuickAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustQty === 0) return;
    quickAdjustStock(item.sku, adjustQty, adjustNote);
    setIsQuickAdjusting(false);
    setAdjustQty(0);
    setAdjustNote('');
  };

  const handleOpenContractPdf = (contractId?: string) => {
    if (!contractId) return;
    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      setPdfPreviewData({ type: 'contract', data: contract });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-slate-200 animate-slideLeft">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-start justify-between shrink-0 shadow-sm">
          <div className="space-y-1.5 max-w-[85%]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono px-2 py-0.5 rounded-md text-xs font-bold bg-blue-600/90 text-white tracking-wider">
                SKU: {item.sku}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-700 text-slate-200">
                ĐVT: {item.unit || 'Bộ'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-700 text-slate-200 flex items-center space-x-1">
                <Warehouse className="w-3 h-3 text-slate-400" />
                <span>{item.warehouseLocation || 'Kho Tổng TP.HCM'}</span>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
              {item.name}
            </h2>
            <div>{getStatusBadge()}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 4 KPI Metrics Strip */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          {/* Card 1: On Hand */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Tồn thực tế</span>
              <Boxes className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
              {onHand.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">On Hand (Thực có trong kho)</div>
          </div>

          {/* Card 2: Reserved */}
          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
              <span>Đang giữ hàng</span>
              <Layers className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1 font-mono">
              {reserved.toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-600/80 mt-0.5">Reserved (Giữ theo HĐ)</div>
          </div>

          {/* Card 3: Available */}
          <div
            className={`p-3 rounded-xl border shadow-2xs ${
              available <= 0
                ? 'bg-rose-50 border-rose-200'
                : available <= 5
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div
              className={`text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${
                available <= 0
                  ? 'text-rose-700'
                  : available <= 5
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              <span>Tồn khả dụng</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div
              className={`text-xl sm:text-2xl font-black mt-1 font-mono ${
                available <= 0
                  ? 'text-rose-700'
                  : available <= 5
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {available.toLocaleString()}
            </div>
            <div className="text-[10px] opacity-80 mt-0.5">Available = On Hand - Reserved</div>
          </div>

          {/* Card 4: On Order */}
          <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-2xs">
            <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center justify-between">
              <span>Đang đặt NCC</span>
              <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-1 font-mono">
              {onOrder.toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-600/80 mt-0.5">On Order (Chờ NCC giao)</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white px-4 border-b border-slate-200 flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveTab('holds')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'holds'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hàng Đang Giữ Cho Khách ({itemReserves.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Đơn Đặt Chờ Về ({itemOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch Sử Biến Động ({itemTransactions.length})</span>
          </button>
        </div>

        {/* Main Scrollable Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: HOLDS */}
          {activeTab === 'holds' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Danh sách các khách hàng đang giữ sản phẩm này:</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Tổng đang giữ:{' '}
                  <strong className="text-amber-700 font-mono">
                    {activeHolds.reduce((s, r) => s + r.reservedQuantity, 0)}
                  </strong>{' '}
                  {item.unit}
                </span>
              </div>

              {itemReserves.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                  <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>Chưa có phiếu giữ hàng nào cho sản phẩm này.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {itemReserves.map((res) => {
                    const isHolding = res.status === 'holding';
                    return (
                      <div
                        key={res.id}
                        className={`p-3.5 rounded-xl border transition ${
                          isHolding
                            ? 'bg-amber-50/50 border-amber-200'
                            : res.status === 'dispatched'
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {res.customerName || 'Khách hàng'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isHolding
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : res.status === 'dispatched'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isHolding
                                  ? 'Đang giữ (Holding)'
                                  : res.status === 'dispatched'
                                  ? 'Đã xuất kho (Dispatched)'
                                  : 'Đã hủy (Cancelled)'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-3">
                              <span className="flex items-center space-x-1">
                                <FileText className="w-3 h-3 text-slate-400" />
                                <span>HĐ: {res.contractNumber || '---'}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>Sales: {res.salesRepName || '---'}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>Hạn giao: {res.expectedDeliveryDate || res.reservedDate || '---'}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 self-end sm:self-center">
                            <div className="text-right">
                              <div className="text-sm font-black font-mono text-slate-900">
                                {res.reservedQuantity} {item.unit}
                              </div>
                              <div className="text-[10px] text-slate-400">SL Giữ</div>
                            </div>
                            {res.contractId && (
                              <button
                                onClick={() => handleOpenContractPdf(res.contractId)}
                                className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-[11px] font-bold transition cursor-pointer"
                                title="Xem Hợp đồng PDF"
                              >
                                Xem HĐ
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Đơn đặt hàng nhà cung cấp chờ nhập kho:</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Tổng đang đặt:{' '}
                  <strong className="text-indigo-700 font-mono">
                    {pendingOrders.reduce((s, o) => s + o.orderQuantity, 0)}
                  </strong>{' '}
                  {item.unit}
                </span>
              </div>

              {itemOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                  <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>Chưa có đơn đặt hàng nào cho sản phẩm này.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {itemOrders.map((ord) => {
                    const isPending = ord.status === 'pending_order' || ord.status === 'ordered';
                    return (
                      <div
                        key={ord.id}
                        className={`p-3.5 rounded-xl border transition ${
                          isPending
                            ? 'bg-indigo-50/50 border-indigo-200'
                            : ord.status === 'arrived_in_stock'
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {ord.customerName || 'Đơn đặt mua'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  ord.status === 'pending_order'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : ord.status === 'ordered'
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                    : ord.status === 'arrived_in_stock'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {ord.status === 'pending_order'
                                  ? 'Cần đặt (Pending)'
                                  : ord.status === 'ordered'
                                  ? 'Đã đặt NCC (Ordered)'
                                  : ord.status === 'arrived_in_stock'
                                  ? 'Đã nhập kho (Arrived)'
                                  : 'Đã hủy'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-3">
                              <span>HĐ: {ord.contractNumber || '---'}</span>
                              <span>Sales: {ord.salesRepName || '---'}</span>
                              <span>Ngày tạo: {ord.orderDate || '---'}</span>
                            </div>
                            {ord.notes && (
                              <div className="text-[11px] text-slate-500 italic bg-white/70 px-2 py-0.5 rounded border border-slate-200">
                                {ord.notes}
                              </div>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm font-black font-mono text-indigo-900">
                              {ord.orderQuantity} {item.unit}
                            </div>
                            <div className="text-[10px] text-slate-400">SL Cần Đặt</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STOCK LEDGER HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Nhật ký giao dịch kho của mã SKU này:</span>
                <span className="text-[11px] text-slate-500">
                  {itemTransactions.length} giao dịch ghi nhận
                </span>
              </div>

              {itemTransactions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                  <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>Chưa có giao dịch biến động nào được ghi nhận cho sản phẩm này.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {itemTransactions.map((tx) => {
                    const isPositive = tx.deltaQuantity > 0;
                    return (
                      <div
                        key={tx.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`p-2 rounded-lg ${
                                tx.type === 'STOCK_IN' || tx.type === 'IMPORT'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : tx.type === 'STOCK_OUT'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {isPositive ? (
                                <ArrowDownRight className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-xs text-slate-900">
                                  {tx.type === 'STOCK_IN'
                                    ? '📥 Nhập kho'
                                    : tx.type === 'STOCK_OUT'
                                    ? '📤 Xuất kho'
                                    : tx.type === 'IMPORT'
                                    ? '📊 Import ban đầu'
                                    : tx.type === 'AUDIT_ADJUSTMENT'
                                    ? '📋 Cân bằng kiểm kê'
                                    : '⚡ Điều chỉnh tồn'}
                                </span>
                                {tx.referenceCode && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200">
                                    {tx.referenceCode}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-2">
                                <span>{tx.date}</span>
                                <span>•</span>
                                <span>Bởi: {tx.performedByName || 'Hệ thống'}</span>
                                {tx.partnerName && (
                                  <>
                                    <span>•</span>
                                    <span>Đối tác: {tx.partnerName}</span>
                                  </>
                                )}
                              </div>
                              {tx.notes && (
                                <div className="text-[10px] text-slate-600 mt-1 italic">
                                  {tx.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div
                              className={`text-sm font-black font-mono ${
                                isPositive ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {isPositive ? `+${tx.deltaQuantity}` : tx.deltaQuantity} {item.unit}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {tx.beforeOnHand} &rarr; {tx.afterOnHand}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Quick Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          {isQuickAdjusting ? (
            <form onSubmit={handleApplyQuickAdjust} className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>⚡ Điều chỉnh nhanh số lượng tồn thực tế:</span>
                <button
                  type="button"
                  onClick={() => setIsQuickAdjusting(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Số lượng (+/-)..."
                  value={adjustQty || ''}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono w-36 focus:outline-none focus:border-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Lý do điều chỉnh..."
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs flex-1 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {onOpenAddStockIn && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddStockIn(item.sku);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo Phiếu Nhập</span>
                  </button>
                )}
                {onOpenAddStockOut && onHand > 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddStockOut(item.sku);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Tạo Phiếu Xuất</span>
                  </button>
                )}
                <button
                  onClick={() => setIsQuickAdjusting(true)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  ⚡ Điều chỉnh nhanh
                </button>
              </div>

              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
