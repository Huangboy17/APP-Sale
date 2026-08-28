import React from 'react';
import { InventoryItem, ReserveItem, OrderItem, Customer } from '../../types';
import {
  Boxes,
  Layers,
  PackageCheck,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Warehouse,
  Users,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface WarehouseOverviewStatsProps {
  inventory: InventoryItem[];
  reserveItems: ReserveItem[];
  orderItems: OrderItem[];
  customers?: Customer[];
  onSelectTab: (tabKey: 'all_inventory' | 'holding_reserves' | 'contract_orders' | 'critical_alerts') => void;
}

export const WarehouseOverviewStats: React.FC<WarehouseOverviewStatsProps> = ({
  inventory,
  reserveItems,
  orderItems,
  customers = [],
  onSelectTab,
}) => {
  const customerMap = React.useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

  const isHolding = (status?: string) =>
    status === 'holding' ||
    status === 'active' ||
    status === 'allocated' ||
    status === 'picking' ||
    status === 'ready_to_ship';

  const isPendingOrder = (status?: string) =>
    status === 'pending' ||
    status === 'pending_order' ||
    status === 'ordered' ||
    status === 'in_transit' ||
    status === 'partial';

  // Calculations
  const totalSkus = inventory.length;
  const totalPhysicalStock = inventory.reduce((sum, i) => sum + (i.totalQuantity || 0), 0);

  const activeReserves = reserveItems.filter((r) => isHolding(r.status));
  const totalReservedStock = activeReserves.reduce((sum, r) => sum + (r.reservedQuantity || 0), 0);
  const holdingSkusCount = new Set(activeReserves.map((r) => (r.sku || '').trim().toLowerCase())).size;

  const totalAvailableStock = inventory.reduce((sum, i) => sum + (i.availableQuantity || 0), 0);
  const availableRate = totalPhysicalStock > 0 ? Math.round((totalAvailableStock / totalPhysicalStock) * 100) : 0;

  const activeOrders = orderItems.filter((o) => isPendingOrder(o.status));
  const totalOrderQty = activeOrders.reduce((sum, o) => {
    const rem = o.remainingQuantity !== undefined ? o.remainingQuantity : o.orderQuantity - (o.receivedQuantity || 0);
    return sum + Math.max(0, rem);
  }, 0);

  const outOfStockCount = inventory.filter((i) => i.availableQuantity === 0).length;
  const lowStockCount = inventory.filter((i) => i.availableQuantity > 0 && i.availableQuantity <= 5).length;

  const partialOrdersCount = orderItems.filter((o) => o.status === 'partial').length;
  const readyToDeliverOrdersCount = orderItems.filter(
    (o) => o.status === 'ready_to_deliver' || o.status === 'received' || o.status === 'arrived_in_stock'
  ).length;
  const readyToShipHoldsCount = reserveItems.filter((r) => r.status === 'ready_to_ship').length;

  const salesWithHolds = new Set(
    activeReserves.map((r) => customerMap.get(r.customerId)?.assignedToName || r.salesRepName)
  ).size;
  const customersWithHolds = new Set(
    activeReserves.map((r) => customerMap.get(r.customerId)?.name || r.customerName)
  ).size;

  return (
    <div className="space-y-3">
      {/* 4 Main Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Tổng Hàng Trong Kho */}
        <div
          onClick={() => onSelectTab('all_inventory')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Tổng Mặt Hàng Trong Kho
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {totalSkus}
              </span>
              <span className="text-xs font-semibold text-slate-500">mã SKU</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Tổng tồn thực tế: <strong className="text-slate-900 font-mono">{totalPhysicalStock.toLocaleString()}</strong> sản phẩm
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600">
            <span>Xem danh mục tồn kho</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Hàng Đang Bị Giữ Cho Sale & Khách */}
        <div
          onClick={() => onSelectTab('holding_reserves')}
          className="bg-white p-4 rounded-xl border border-amber-200/90 bg-amber-50/20 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
                <span>2. Hàng Đang Bị Giữ HĐ</span>
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-amber-950 font-mono tracking-tight">
                {totalReservedStock.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-amber-700">sp ({holdingSkusCount} mã)</span>
            </div>
            <div className="text-xs text-amber-900/80 mt-1 flex items-center space-x-2">
              <span>Đang khóa cho <strong>{salesWithHolds} Sale</strong></span>
              <span>•</span>
              <span><strong>{customersWithHolds} Khách hàng</strong></span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-[11px] font-bold text-amber-700">
            <span>Xem chi tiết Sale & Khách giữ</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Tồn Khả Dụng Để Bán */}
        <div
          onClick={() => onSelectTab('all_inventory')}
          className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                3. Tồn Khả Dụng Để Bán
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-950 font-mono tracking-tight">
                {totalAvailableStock.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-emerald-700">sp sẵn sàng</span>
            </div>
            <div className="text-xs text-emerald-900/80 mt-1">
              Tỷ lệ khả dụng: <strong className="text-emerald-900 font-mono">{availableRate}%</strong> tổng tồn
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-bold text-emerald-700">
            <span>Sẵn sàng xuất kho ngay</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: Hàng Cần Đặt Mua Theo HĐ Khách */}
        <div
          onClick={() => onSelectTab('contract_orders')}
          className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                4. Hàng Cần Đặt Theo HĐ Ký
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-indigo-950 font-mono tracking-tight">
                {totalOrderQty.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-indigo-700">sp ({activeOrders.length} dòng đơn)</span>
            </div>
            <div className="text-xs text-indigo-900/80 mt-1">
              Thiếu tồn khi ký HĐ, đang chờ đặt & về kho
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-indigo-200/60 flex items-center justify-between text-[11px] font-bold text-indigo-700">
            <span>Xem danh sách PO cần đặt</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Quick Alert Banner for Warehouse Staff */}
      {(outOfStockCount > 0 || lowStockCount > 0) && (
        <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-950">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Cảnh báo thủ kho:</strong> Có <strong>{outOfStockCount}</strong> mã hết hàng hoàn toàn và <strong>{lowStockCount}</strong> mã sắp hết hàng (tồn ≤ 5).
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('critical_alerts')}
            className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold rounded-md transition text-xs flex items-center space-x-1 shrink-0 cursor-pointer"
          >
            <span>Kiểm tra cảnh báo & Nhu cầu Pipeline</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3 Smart Notification Badges for Sales & Warehouse */}
      {(readyToDeliverOrdersCount > 0 || partialOrdersCount > 0 || readyToShipHoldsCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {readyToDeliverOrdersCount > 0 && (
            <div
              onClick={() => onSelectTab('contract_orders')}
              className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-900 cursor-pointer hover:bg-emerald-100/70 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>{readyToDeliverOrdersCount}</strong> đơn đặt đã về đủ hàng, sẵn sàng giao
              </span>
            </div>
          )}

          {partialOrdersCount > 0 && (
            <div
              onClick={() => onSelectTab('contract_orders')}
              className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg flex items-center space-x-2 text-orange-900 cursor-pointer hover:bg-orange-100/70 transition"
            >
              <Clock className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                <strong>{partialOrdersCount}</strong> đơn đã về 1 phần, chờ đợt tiếp theo
              </span>
            </div>
          )}

          {readyToShipHoldsCount > 0 && (
            <div
              onClick={() => onSelectTab('holding_reserves')}
              className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center space-x-2 text-purple-900 cursor-pointer hover:bg-purple-100/70 transition"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>{readyToShipHoldsCount}</strong> phiếu giữ đã gom xong, sẵn sàng xuất kho
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
