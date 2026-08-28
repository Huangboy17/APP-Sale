import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ReserveItem, OrderItem } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  isReserveInWorkQueue,
  isReserveCompleted,
  isReservePartiallyDelivered,
  getReserveDeliveredQuantity,
  isOrderInWorkQueue,
  isOrderCompleted,
  isOrderPartiallyDelivered,
  isOrderArrivedInStock,
  getOrderDeliveredQuantity,
} from '../../utils/orderLifecycle';
import {
  Layers,
  PackageCheck,
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Download,
  AlertTriangle,
  Building,
  Info,
  Calendar,
  History,
  Check,
  Filter,
  Sparkles,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ReserveAndOrderTables: React.FC = () => {
  const {
    filteredReserveItems,
    filteredOrderItems,
    filteredContracts,
    customers,
    inventory,
    currentUser,
  } = useApp();

  // Work Queue vs History Tab
  const [viewMode, setViewMode] = useState<'work_queue' | 'history'>('work_queue');
  const [activeSubTab, setActiveSubTab] = useState<'reserve' | 'order'>('reserve');
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState<string>('all');
  const [historyTimeFilter, setHistoryTimeFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'this_year'>('all');

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const contractMap = useMemo(() => new Map(filteredContracts.map((c) => [c.id, c])), [filteredContracts]);
  const inventoryMap = useMemo(() => new Map(inventory.map((i) => [i.sku.trim().toUpperCase(), i])), [inventory]);

  const getAssignedSalesRepName = (customerId: string, fallbackSalesName: string): string => {
    const cust = customerMap.get(customerId);
    if (cust) return cust.assignedToName || 'Chưa phân công';
    return fallbackSalesName || 'ORPHAN CUSTOMER';
  };

  const getCustomerDisplayName = (customerId: string, fallbackCustomerName: string): string => {
    const cust = customerMap.get(customerId);
    return cust?.name || fallbackCustomerName || 'ORPHAN CUSTOMER';
  };

  // Base list separated by Work Queue vs History
  const baseReserves = useMemo(() => {
    if (viewMode === 'work_queue') {
      return filteredReserveItems.filter(isReserveInWorkQueue);
    }
    return filteredReserveItems.filter(isReserveCompleted);
  }, [filteredReserveItems, viewMode]);

  const baseOrders = useMemo(() => {
    if (viewMode === 'work_queue') {
      return filteredOrderItems.filter(isOrderInWorkQueue);
    }
    return filteredOrderItems.filter(isOrderCompleted);
  }, [filteredOrderItems, viewMode]);

  // Total counts for badges
  const totalActiveReservesCount = useMemo(() => filteredReserveItems.filter(isReserveInWorkQueue).length, [filteredReserveItems]);
  const totalCompletedReservesCount = useMemo(() => filteredReserveItems.filter(isReserveCompleted).length, [filteredReserveItems]);
  const totalActiveOrdersCount = useMemo(() => filteredOrderItems.filter(isOrderInWorkQueue).length, [filteredOrderItems]);
  const totalCompletedOrdersCount = useMemo(() => filteredOrderItems.filter(isOrderCompleted).length, [filteredOrderItems]);

  const totalWorkQueueCount = totalActiveReservesCount + totalActiveOrdersCount;
  const totalHistoryCount = totalCompletedReservesCount + totalCompletedOrdersCount;

  // Filter reserve items by search, contract and time
  const filteredReserves = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return baseReserves.filter((r) => {
      const resolvedSales = getAssignedSalesRepName(r.customerId, r.salesRepName);
      const resolvedCustomer = getCustomerDisplayName(r.customerId, r.customerName);

      const matchSearch =
        (r.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        resolvedCustomer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resolvedSales.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.contractNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.completedByName && r.completedByName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchContract = contractFilter === 'all' || r.contractId === contractFilter;

      // History time filter
      let matchTime = true;
      if (viewMode === 'history' && historyTimeFilter !== 'all') {
        const itemDate = (r.completedAt || r.actualDeliveryDate || r.reservedDate || '').split('T')[0];
        if (historyTimeFilter === 'today') {
          matchTime = itemDate === todayStr;
        } else if (historyTimeFilter === 'this_week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          matchTime = new Date(itemDate) >= oneWeekAgo;
        } else if (historyTimeFilter === 'this_month') {
          const monthPrefix = todayStr.substring(0, 7);
          matchTime = itemDate.startsWith(monthPrefix);
        } else if (historyTimeFilter === 'this_year') {
          const yearPrefix = todayStr.substring(0, 4);
          matchTime = itemDate.startsWith(yearPrefix);
        }
      }

      return matchSearch && matchContract && matchTime;
    });
  }, [baseReserves, searchTerm, contractFilter, customerMap, viewMode, historyTimeFilter]);

  // Filter order items by search, contract and time
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return baseOrders.filter((o) => {
      const resolvedSales = getAssignedSalesRepName(o.customerId, o.salesRepName);
      const resolvedCustomer = getCustomerDisplayName(o.customerId, o.customerName);

      const matchSearch =
        (o.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        resolvedCustomer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resolvedSales.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.contractNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.brand && o.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.completedByName && o.completedByName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchContract = contractFilter === 'all' || o.contractId === contractFilter;

      // History time filter
      let matchTime = true;
      if (viewMode === 'history' && historyTimeFilter !== 'all') {
        const itemDate = (o.completedAt || o.orderDate || '').split('T')[0];
        if (historyTimeFilter === 'today') {
          matchTime = itemDate === todayStr;
        } else if (historyTimeFilter === 'this_week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          matchTime = new Date(itemDate) >= oneWeekAgo;
        } else if (historyTimeFilter === 'this_month') {
          const monthPrefix = todayStr.substring(0, 7);
          matchTime = itemDate.startsWith(monthPrefix);
        } else if (historyTimeFilter === 'this_year') {
          const yearPrefix = todayStr.substring(0, 4);
          matchTime = itemDate.startsWith(yearPrefix);
        }
      }

      return matchSearch && matchContract && matchTime;
    });
  }, [baseOrders, searchTerm, contractFilter, customerMap, viewMode, historyTimeFilter]);

  // Status Badge for Reserve Items
  const getReserveStatusBadge = (r: ReserveItem) => {
    const delivered = getReserveDeliveredQuantity(r);
    const reserved = Number(r.reservedQuantity) || 0;

    if (isReserveCompleted(r)) {
      const dateStr = r.completedAt ? r.completedAt.split('T')[0] : r.actualDeliveryDate || r.expectedDeliveryDate;
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          ✅ Đã giao đủ {dateStr ? `(${formatDate(dateStr)})` : ''}
        </span>
      );
    }
    if (isReservePartiallyDelivered(r)) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300">
          🚚 Giao một phần ({delivered}/{reserved})
        </span>
      );
    }
    if (r.status === 'ready_to_ship') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
          🟣 Sẵn sàng xuất
        </span>
      );
    }
    if (r.status === 'picking') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          🟠 Đang gom hàng
        </span>
      );
    }
    if (r.status === 'allocated') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
          🔵 Đã phân bổ
        </span>
      );
    }
    if (r.status === 'holding' || r.status === 'active') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
          🟡 Đang giữ hàng
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
        ⚪ {r.status === 'released' || r.status === 'cancelled' ? 'Đã hủy' : r.status}
      </span>
    );
  };

  // Status Badge for Order Items
  const getOrderStatusBadge = (o: OrderItem) => {
    const received = Number(o.receivedQuantity) || 0;
    const delivered = getOrderDeliveredQuantity(o);
    const orderQty = Number(o.orderQuantity) || 0;

    if (isOrderCompleted(o)) {
      const dateStr = o.completedAt ? o.completedAt.split('T')[0] : o.orderDate;
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          ✅ Đã giao đủ khách {dateStr ? `(${formatDate(dateStr)})` : ''}
        </span>
      );
    }
    if (isOrderPartiallyDelivered(o)) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300">
          🚚 Giao khách 1 phần ({delivered}/{orderQty})
        </span>
      );
    }
    if (isOrderArrivedInStock(o)) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          🟢 Đã về kho đủ (Chờ giao)
        </span>
      );
    }
    if (received > 0 && received < orderQty) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          🟠 Đã về kho 1 phần ({received}/{orderQty})
        </span>
      );
    }
    if (o.status === 'in_transit') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
          🚚 NCC Đang vận chuyển
        </span>
      );
    }
    if (o.status === 'ordered') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          🟡 Đã đặt NCC
        </span>
      );
    }
    if (o.status === 'pending' || o.status === 'pending_order') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          🔴 Đã nhận yêu cầu
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
        ⚪ {o.status === 'cancelled' ? 'Đã hủy' : o.status}
      </span>
    );
  };

  // Export Excel Reserve
  const handleExportReserveExcel = () => {
    const data = filteredReserves.map((r, idx) => {
      const itemInv = inventoryMap.get(r.sku.trim().toUpperCase());
      const delivered = getReserveDeliveredQuantity(r);
      const remaining = Math.max(0, r.reservedQuantity - delivered);

      return {
        'STT': idx + 1,
        'Mã Hàng': r.sku,
        'Tên Hàng': r.productName,
        'Số Lượng Yêu Cầu': r.reservedQuantity,
        'Đã Giao': delivered,
        'Còn Phải Giao': remaining,
        'ĐVT': r.unit || 'Bộ',
        'Khách Hàng': getCustomerDisplayName(r.customerId, r.customerName),
        'Hợp Đồng': r.contractNumber,
        'Tồn Kho Hiện Tại': itemInv ? itemInv.totalQuantity || 0 : 0,
        'Ngày Cần Giao': formatDate(r.expectedDeliveryDate || r.reservedDate),
        'Ngày Hoàn Thành': r.completedAt ? formatDate(r.completedAt) : (r.actualDeliveryDate ? formatDate(r.actualDeliveryDate) : '—'),
        'Người Xử Lý': r.completedByName || r.salesRepName || '—',
        'Tình Trạng': isReserveCompleted(r) ? 'Đã hoàn thành' : isReservePartiallyDelivered(r) ? `Giao một phần (${delivered}/${r.reservedQuantity})` : 'Đang xử lý',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    const sheetName = viewMode === 'work_queue' ? 'Giu_Hang_Dang_Xu_Ly' : 'Giu_Hang_Lich_Su';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export Excel Orders
  const handleExportOrderExcel = () => {
    const data = filteredOrders.map((o, idx) => {
      const contract = contractMap.get(o.contractId);
      const reqDate = contract?.deliveryDate || o.supplierETA || o.orderDate;
      const received = o.receivedQuantity || 0;
      const delivered = getOrderDeliveredQuantity(o);
      const remaining = Math.max(0, o.orderQuantity - delivered);

      return {
        'STT': idx + 1,
        'Mã Hàng': o.sku,
        'Tên Hàng': o.productName,
        'Hãng': o.brand || 'Khác',
        'Số Lượng Cần Đặt': o.orderQuantity,
        'Đã Về Kho': received,
        'Đã Giao Khách': delivered,
        'Còn Phải Giao': remaining,
        'ĐVT': o.unit || 'Bộ',
        'Ngày Cần Nhận Hàng': formatDate(reqDate),
        'Hợp Đồng': o.contractNumber,
        'Khách Hàng': getCustomerDisplayName(o.customerId, o.customerName),
        'Ngày Hoàn Thành': o.completedAt ? formatDate(o.completedAt) : '—',
        'Người Xử Lý': o.completedByName || o.salesRepName || '—',
        'Tình Trạng': isOrderCompleted(o) ? 'Đã hoàn thành' : isOrderPartiallyDelivered(o) ? `Giao khách 1 phần (${delivered}/${o.orderQuantity})` : received >= o.orderQuantity ? 'Đã về kho đủ (Chờ giao)' : 'Đang xử lý',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    const sheetName = viewMode === 'work_queue' ? 'Dat_Hang_Dang_Xu_Ly' : 'Dat_Hang_Lich_Su';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Work Queue vs History Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Theo Dõi Giữ Hàng & Đặt Hàng Của Sales</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh sách công việc đang xử lý của Kho & Lịch sử tra cứu phiếu đã hoàn thành toàn diện.
          </p>
        </div>

        {/* Work Queue vs History Primary Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => setViewMode('work_queue')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'work_queue'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>⚡ Đang Xử Lý (Cần Làm)</span>
            <span className={`px-2 py-0.2 text-[10px] rounded-full font-bold ${
              viewMode === 'work_queue' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              {totalWorkQueueCount}
            </span>
          </button>

          <button
            onClick={() => setViewMode('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'history'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>📜 Lịch Sử Đã Hoàn Thành</span>
            <span className={`px-2 py-0.2 text-[10px] rounded-full font-bold ${
              viewMode === 'history' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {totalHistoryCount}
            </span>
          </button>
        </div>
      </div>

      {/* Filter & Sub-tab Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Sub Tabs: 1. Giữ Hàng | 2. Đặt Hàng */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('reserve')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'reserve'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>1. Bảng Giữ Hàng</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              activeSubTab === 'reserve' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {filteredReserves.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('order')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'order'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>2. Bảng Đặt Hàng</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              activeSubTab === 'order' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {filteredOrders.length}
            </span>
          </button>
        </div>

        {/* Search, Contract Filter, Time Range & Export */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* History Time Filter */}
          {viewMode === 'history' && (
            <select
              value={historyTimeFilter}
              onChange={(e) => setHistoryTimeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer font-semibold text-slate-700"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="this_week">Trong 7 ngày qua</option>
              <option value="this_month">Trong tháng này</option>
              <option value="this_year">Trong năm nay</option>
            </select>
          )}

          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Tìm SKU, tên hàng, khách, HĐ, người xử lý..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
            />
          </div>

          <select
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer font-medium text-slate-700"
          >
            <option value="all">Tất cả hợp đồng ({filteredContracts.length})</option>
            {filteredContracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.contractNumber}
              </option>
            ))}
          </select>

          {activeSubTab === 'reserve' ? (
            <button
              onClick={handleExportReserveExcel}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
          ) : (
            <button
              onClick={handleExportOrderExcel}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TABLE 1: BẢNG GIỮ HÀNG */}
      {/* ===================================================================== */}
      {activeSubTab === 'reserve' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3.5 bg-emerald-50/70 border-b border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950">
            <div className="flex items-center space-x-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">
                {viewMode === 'work_queue' ? 'DANH SÁCH GIỮ HÀNG ĐANG XỬ LÝ (WORK QUEUE)' : 'LỊCH SỬ GIỮ HÀNG ĐÃ GIAO HOÀN THÀNH (HISTORY)'}
              </span>
              <span className="text-slate-500 text-[11px] hidden sm:inline">
                {viewMode === 'work_queue' ? '(Chỉ hiển thị các phiếu chưa hoàn thành)' : '(Lưu trữ toàn bộ phiếu đã giao đủ để đối soát & audit)'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full self-start sm:self-auto border border-emerald-200">
              {filteredReserves.length} yêu cầu {viewMode === 'work_queue' ? 'cần xử lý' : 'đã hoàn thành'}
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3.5 py-3 w-12 text-center whitespace-nowrap">STT</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Mã Hàng</th>
                  <th className="px-3.5 py-3 min-w-[220px]">Tên Sản Phẩm</th>
                  <th className="px-3.5 py-3 text-center bg-emerald-50/40 border-x border-emerald-100 whitespace-nowrap">Số Lượng Giữ</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Đã Giao</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Còn Phải Giao</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Khách Hàng</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Hợp Đồng</th>
                  <th className="px-3.5 py-3 text-right border-x bg-slate-50 whitespace-nowrap">Tồn Kho Hiện Tại</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">{viewMode === 'work_queue' ? 'Ngày Cần Giao' : 'Ngày Hoàn Thành'}</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Tình Trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReserves.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                      <PackageCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <span>
                        {viewMode === 'work_queue'
                          ? '🎉 Tuyệt vời! Không còn yêu cầu giữ hàng nào đang chờ xử lý.'
                          : 'Chưa có bản ghi giữ hàng nào trong lịch sử hoàn thành.'}
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredReserves.map((r, idx) => {
                    const itemInv = inventoryMap.get(r.sku.trim().toUpperCase());
                    const currentOnHand = itemInv ? itemInv.totalQuantity || 0 : 0;
                    const delivered = getReserveDeliveredQuantity(r);
                    const remaining = Math.max(0, r.reservedQuantity - delivered);

                    return (
                      <tr key={r.id} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="px-3.5 py-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700 whitespace-nowrap">{r.sku}</td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">{r.productName}</td>
                        <td className="px-3.5 py-2.5 text-center font-black text-emerald-800 bg-emerald-50/20 border-x border-emerald-100 font-mono whitespace-nowrap">
                          {r.reservedQuantity} {r.unit || 'Bộ'}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-blue-700 font-mono whitespace-nowrap">
                          {delivered} {r.unit || 'Bộ'}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-amber-700 font-mono whitespace-nowrap">
                          {remaining} {r.unit || 'Bộ'}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                          {getCustomerDisplayName(r.customerId, r.customerName)}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-blue-600 whitespace-nowrap">{r.contractNumber}</td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-700 border-x bg-slate-50/50 whitespace-nowrap">
                          {currentOnHand.toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600 font-medium whitespace-nowrap">
                          {viewMode === 'work_queue'
                            ? formatDate(r.expectedDeliveryDate || r.reservedDate)
                            : r.completedAt
                            ? formatDate(r.completedAt)
                            : (r.actualDeliveryDate ? formatDate(r.actualDeliveryDate) : formatDate(r.expectedDeliveryDate))}
                        </td>
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          {getReserveStatusBadge(r)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TABLE 2: BẢNG ĐẶT HÀNG */}
      {/* ===================================================================== */}
      {activeSubTab === 'order' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3.5 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-amber-600" />
              <span className="font-bold">
                {viewMode === 'work_queue' ? 'DANH SÁCH ĐẶT HÀNG NCC ĐANG XỬ LÝ (WORK QUEUE)' : 'LỊCH SỬ ĐẶT HÀNG NCC ĐÃ GIAO HOÀN THÀNH (HISTORY)'}
              </span>
              <span className="text-slate-500 text-[11px] hidden sm:inline">
                {viewMode === 'work_queue' ? '(Bao gồm cả hàng đã về kho chờ xuất và giao một phần)' : '(Lưu trữ toàn bộ đơn đặt đã giao đủ cho khách)'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full self-start sm:self-auto border border-amber-200">
              {filteredOrders.length} yêu cầu {viewMode === 'work_queue' ? 'cần xử lý' : 'đã hoàn thành'}
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[1200px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3.5 py-3 w-12 text-center whitespace-nowrap">STT</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Mã Hàng</th>
                  <th className="px-3.5 py-3 min-w-[220px]">Tên Sản Phẩm</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Hãng</th>
                  <th className="px-3.5 py-3 text-center bg-amber-50/40 border-x border-amber-100 whitespace-nowrap">Số Lượng Đặt</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Đã Về Kho</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Đã Giao Khách</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Còn Phải Giao</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Khách Hàng</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Hợp Đồng</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">{viewMode === 'work_queue' ? 'Ngày Cần Nhận' : 'Ngày Hoàn Thành'}</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Tình Trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                      <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <span>
                        {viewMode === 'work_queue'
                          ? '🎉 Tuyệt vời! Không có yêu cầu đặt hàng NCC nào đang chờ xử lý.'
                          : 'Chưa có bản ghi đặt hàng nào trong lịch sử hoàn thành.'}
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o, idx) => {
                    const contract = contractMap.get(o.contractId);
                    const reqDate = contract?.deliveryDate || o.supplierETA || o.orderDate;
                    const received = Number(o.receivedQuantity) || 0;
                    const delivered = getOrderDeliveredQuantity(o);
                    const remaining = Math.max(0, o.orderQuantity - delivered);

                    return (
                      <tr key={o.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="px-3.5 py-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700 whitespace-nowrap">{o.sku}</td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">{o.productName}</td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{o.brand || 'Khác'}</td>
                        <td className="px-3.5 py-2.5 text-center font-black text-amber-800 bg-amber-50/20 border-x border-amber-100 font-mono whitespace-nowrap">
                          {o.orderQuantity} {o.unit || 'Bộ'}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-emerald-700 font-mono whitespace-nowrap">
                          {received} {o.unit || 'Bộ'}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-blue-700 font-mono whitespace-nowrap">
                          {delivered} {o.unit || 'Bộ'}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-rose-700 font-mono whitespace-nowrap">
                          {remaining} {o.unit || 'Bộ'}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                          {getCustomerDisplayName(o.customerId, o.customerName)}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-blue-600 whitespace-nowrap">{o.contractNumber}</td>
                        <td className="px-3.5 py-2.5 font-medium text-slate-700 whitespace-nowrap">
                          {viewMode === 'work_queue'
                            ? formatDate(reqDate)
                            : o.completedAt
                            ? formatDate(o.completedAt)
                            : formatDate(reqDate)}
                        </td>
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          {getOrderStatusBadge(o)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
