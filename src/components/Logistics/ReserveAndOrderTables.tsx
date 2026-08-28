import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ReserveItem, OrderItem } from '../../types';
import { formatDate } from '../../utils/formatters';
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

  const [activeSubTab, setActiveSubTab] = useState<'reserve' | 'order'>('reserve');
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState<string>('all');

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

  // Filter reserve items
  const filteredReserves = useMemo(() => {
    return filteredReserveItems.filter((r) => {
      const resolvedSales = getAssignedSalesRepName(r.customerId, r.salesRepName);
      const resolvedCustomer = getCustomerDisplayName(r.customerId, r.customerName);

      const matchSearch =
        r.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resolvedCustomer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resolvedSales.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchContract = contractFilter === 'all' || r.contractId === contractFilter;
      return matchSearch && matchContract;
    });
  }, [filteredReserveItems, searchTerm, contractFilter, customerMap]);

  // Filter order items
  const filteredOrders = useMemo(() => {
    return filteredOrderItems.filter((o) => {
      const resolvedSales = getAssignedSalesRepName(o.customerId, o.salesRepName);
      const resolvedCustomer = getCustomerDisplayName(o.customerId, o.customerName);

      const matchSearch =
        o.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resolvedCustomer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resolvedSales.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.brand && o.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchContract = contractFilter === 'all' || o.contractId === contractFilter;
      return matchSearch && matchContract;
    });
  }, [filteredOrderItems, searchTerm, contractFilter, customerMap]);

  // Status Badge for Reserve Items (Read-only for Sales)
  const getReserveStatusBadge = (r: ReserveItem) => {
    if (r.status === 'delivered') {
      const dateStr =
        r.actualDeliveryDate ||
        r.timeline?.find((t) => t.status === 'delivered')?.timestamp?.split('T')[0] ||
        r.timeline?.find((t) => t.status === 'shipped')?.timestamp?.split('T')[0];
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          🟢 Đã giao {dateStr ? `(${formatDate(dateStr)})` : ''}
        </span>
      );
    }
    if (r.status === 'dispatched' || r.status === 'shipped') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          🚚 Đã xuất kho
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
          🟡 Đang giữ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
        ⚪ {r.status === 'released' || r.status === 'cancelled' ? 'Đã hủy' : r.status}
      </span>
    );
  };

  // Status Badge for Order Items (Read-only for Sales)
  const getOrderStatusBadge = (o: OrderItem) => {
    if (o.status === 'delivered') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          📦 Đã giao khách
        </span>
      );
    }
    if (o.status === 'ready_to_deliver' || o.status === 'received' || o.status === 'arrived_in_stock') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          🟢 Đã về kho
        </span>
      );
    }
    if (o.status === 'partial') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
          🟠 Đã về kho ({o.receivedQuantity || 0}/{o.orderQuantity})
        </span>
      );
    }
    if (o.status === 'arrived') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          🔵 Đã về tới kho
        </span>
      );
    }
    if (o.status === 'in_transit') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
          🚚 Đang vận chuyển
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
      return {
        'STT': idx + 1,
        'Mã Hàng': r.sku,
        'Tên Hàng': r.productName,
        'Số Lượng Giữ': r.reservedQuantity,
        'ĐVT': r.unit || 'Bộ',
        'Giữ Cho Khách Nào': getCustomerDisplayName(r.customerId, r.customerName),
        'Hợp Đồng': r.contractNumber,
        'Tồn Kho Hiện Tại': itemInv ? itemInv.totalQuantity || 0 : 0,
        'Ngày Cần Giao': formatDate(r.expectedDeliveryDate || r.reservedDate),
        'Tình Trạng':
          r.status === 'delivered'
            ? 'Đã giao'
            : r.status === 'shipped' || r.status === 'dispatched'
            ? 'Đã xuất kho'
            : r.status === 'ready_to_ship'
            ? 'Sẵn sàng xuất'
            : r.status === 'allocated'
            ? 'Đã phân bổ'
            : 'Đang giữ',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Giu_Hang_Sale');
    XLSX.writeFile(workbook, `Giu_Hang_Sale_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export Excel Orders
  const handleExportOrderExcel = () => {
    const data = filteredOrders.map((o, idx) => {
      const contract = contractMap.get(o.contractId);
      const reqDate = contract?.deliveryDate || o.supplierETA || o.orderDate;
      return {
        'STT': idx + 1,
        'Mã Hàng': o.sku,
        'Tên Hàng': o.productName,
        'Hãng': o.brand || 'Khác',
        'Số Lượng Cần Đặt': o.orderQuantity,
        'ĐVT': o.unit || 'Bộ',
        'Ngày Cần Nhận Hàng': formatDate(reqDate),
        'Hợp Đồng': o.contractNumber,
        'Khách Hàng': getCustomerDisplayName(o.customerId, o.customerName),
        'Tình Trạng':
          o.status === 'delivered'
            ? 'Đã giao khách'
            : o.status === 'ready_to_deliver'
            ? 'Đã về kho'
            : o.status === 'partial'
            ? 'Đã về kho 1 phần'
            : o.status === 'in_transit'
            ? 'Đang vận chuyển'
            : o.status === 'ordered'
            ? 'Đã đặt NCC'
            : 'Đã nhận yêu cầu',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dat_Hang_Sale');
    XLSX.writeFile(workbook, `Dat_Hang_Sale_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Theo Dõi Giữ Hàng & Đặt Hàng Của Sales</span>
          </h1>
          <p className="text-xs text-slate-500">
            Sales tạo nhu cầu và theo dõi tiến độ. Tồn kho và trạng thái được tự động cập nhật từ Kho hàng.
          </p>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Tab switch */}
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
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${activeSubTab === 'reserve' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
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
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${activeSubTab === 'order' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {filteredOrders.length}
            </span>
          </button>
        </div>

        {/* Search & Export Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo SKU, tên, khách hàng, HĐ..."
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
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
          ) : (
            <button
              onClick={handleExportOrderExcel}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE 1: BẢNG GIỮ HÀNG - SALE */}
      {activeSubTab === 'reserve' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-3 bg-emerald-50/60 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center space-x-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">BẢNG GIỮ HÀNG - SALES</span>
              <span className="text-slate-500 text-[11px] hidden sm:inline">(Tồn kho và tình trạng do Kho quản lý và cập nhật)</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {filteredReserves.length} yêu cầu giữ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3.5 py-3">Mã Hàng</th>
                  <th className="px-3.5 py-3">Tên Hàng</th>
                  <th className="px-3 py-3 text-center bg-emerald-50/40 border-x border-emerald-100">Số Lượng Giữ</th>
                  <th className="px-3.5 py-3">Giữ Cho Khách Nào</th>
                  <th className="px-3.5 py-3">Hợp Đồng</th>
                  <th className="px-3 py-3 text-right border-x bg-slate-50">Tồn Kho Hiện Tại</th>
                  <th className="px-3.5 py-3">Ngày Cần Giao</th>
                  <th className="px-3.5 py-3 text-center">Tình Trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReserves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Chưa có mã hàng nào trong danh sách Giữ hàng.
                    </td>
                  </tr>
                ) : (
                  filteredReserves.map((r) => {
                    const itemInv = inventoryMap.get(r.sku.trim().toUpperCase());
                    const currentOnHand = itemInv ? itemInv.totalQuantity || 0 : 0;
                    return (
                      <tr key={r.id} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">{r.sku}</td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">{r.productName}</td>
                        <td className="px-3 py-2.5 text-center font-black text-emerald-800 bg-emerald-50/20 border-x border-emerald-100 font-mono">
                          {r.reservedQuantity} {r.unit || 'Bộ'}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                          {getCustomerDisplayName(r.customerId, r.customerName)}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-blue-600">{r.contractNumber}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-700 border-x bg-slate-50/50">
                          {currentOnHand.toLocaleString()}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600 font-medium">
                          {formatDate(r.expectedDeliveryDate || r.reservedDate)}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
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

      {/* TABLE 2: BẢNG ĐẶT HÀNG - SALE */}
      {activeSubTab === 'order' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-3 bg-amber-50/60 border-b border-amber-200 flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-amber-600" />
              <span className="font-bold">BẢNG ĐẶT HÀNG - SALES</span>
              <span className="text-slate-500 text-[11px] hidden sm:inline">(Tình trạng hàng về do Kho quản lý và đồng bộ)</span>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              {filteredOrders.length} yêu cầu đặt
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3.5 py-3">Mã Hàng</th>
                  <th className="px-3.5 py-3">Tên Hàng</th>
                  <th className="px-3.5 py-3">Hãng</th>
                  <th className="px-3 py-3 text-center bg-amber-50/40 border-x border-amber-100">Số Lượng Cần Đặt</th>
                  <th className="px-3.5 py-3">Ngày Cần Nhận Hàng</th>
                  <th className="px-3.5 py-3 text-center">Tình Trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Không có yêu cầu đặt hàng nào trong danh sách.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const contract = contractMap.get(o.contractId);
                    const reqDate = contract?.deliveryDate || o.supplierETA || o.orderDate;
                    return (
                      <tr key={o.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">{o.sku}</td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">{o.productName}</td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-700">{o.brand || 'Khác'}</td>
                        <td className="px-3 py-2.5 text-center font-black text-amber-800 bg-amber-50/20 border-x border-amber-100 font-mono">
                          {o.orderQuantity} {o.unit || 'Bộ'}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-slate-700">
                          {formatDate(reqDate)}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
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
