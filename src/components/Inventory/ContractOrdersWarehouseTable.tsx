import React, { useState, useMemo } from 'react';
import { OrderItem, Contract, Customer } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { EditOrderItemModal } from './EditOrderItemModal';
import { ItemOrderRequirementsModal } from './ItemOrderRequirementsModal';
import { CreatePurchaseOrderModal } from './CreatePurchaseOrderModal';
import {
  ShoppingCart,
  Search,
  Download,
  PackagePlus,
  FileText,
  User,
  Calendar,
  CheckCircle2,
  Save,
  X,
  RotateCcw,
  XCircle,
  Eye,
  Boxes,
  Truck,
  Receipt,
  Layers,
  Building,
  ListOrdered,
  LayoutGrid,
  Plus,
  CheckSquare,
  Square,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ContractOrdersWarehouseTableProps {
  orderItems: OrderItem[];
  contracts: Contract[];
  customers: Customer[];
  onOpenReceiveModal: (order: OrderItem) => void;
  onOpenContractPdf: (contractId: string) => void;
}

export const ContractOrdersWarehouseTable: React.FC<ContractOrdersWarehouseTableProps> = ({
  orderItems,
  contracts,
  customers,
  onOpenReceiveModal,
  onOpenContractPdf,
}) => {
  const {
    inventory,
    products,
    updateOrderItem,
    updateOrderWarehouseStatus,
    cancelOrderItem,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all_pending');
  const [viewMode, setViewMode] = useState<'sku_summary' | 'contract_list'>('sku_summary');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [editingOrderItem, setEditingOrderItem] = useState<OrderItem | null>(null);
  const [selectedSkuForModal, setSelectedSkuForModal] = useState<{ sku: string; name: string; brand: string } | null>(null);

  // Multi-select state for PO creation
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);

  const canManage = currentUser.role === 'manager_c1' || currentUser.role === 'super_admin' || currentUser.role === 'sales_c2';

  // Lookup maps
  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const contractMap = useMemo(() => new Map(contracts.map((c) => [c.id, c])), [contracts]);
  const inventoryMap = useMemo(() => new Map(inventory.map((i) => [i.sku.trim().toUpperCase(), i])), [inventory]);
  const productMap = useMemo(() => new Map(products.map((p) => [p.sku.trim().toUpperCase(), p])), [products]);

  const getAssignedSalesRepName = (o: OrderItem): string => {
    const cust = customerMap.get(o.customerId);
    if (cust) {
      return cust.assignedToName || 'Chưa phân công';
    }
    return o.salesRepName ? `${o.salesRepName} (Orphan)` : 'ORPHAN CUSTOMER';
  };

  const getCustomerDisplayName = (o: OrderItem): string => {
    const cust = customerMap.get(o.customerId);
    return cust?.name || o.customerName || 'ORPHAN CUSTOMER';
  };

  const isPendingOrder = (status: string) =>
    ['pending', 'pending_order', 'ordered', 'in_transit', 'arrived', 'partial'].includes(status);

  // Filter individual orders
  const filteredOrders = useMemo(() => {
    return orderItems.filter((o) => {
      const resolvedSales = getAssignedSalesRepName(o);
      const resolvedCustomer = getCustomerDisplayName(o);
      const cust = customerMap.get(o.customerId);

      const matchSearch =
        o.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resolvedCustomer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resolvedSales.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cust?.company && cust.company.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === 'all_pending') matchStatus = isPendingOrder(o.status);
      else if (statusFilter !== 'all') matchStatus = o.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [orderItems, searchTerm, statusFilter, customerMap]);

  // Aggregate orders by SKU for the Warehouse Master SKU table
  const skuSummaries = useMemo(() => {
    const map = new Map<string, {
      sku: string;
      productName: string;
      brand: string;
      unit: string;
      totalOnHand: number;
      totalSalesDemand: number;
      totalReceived: number;
      totalShortage: number;
      plannedPoQuantity: number;
      earliestRequiredDate: string;
      status: string;
      orders: OrderItem[];
    }>();

    for (const order of filteredOrders) {
      const cleanSku = (order.sku || '').trim().toUpperCase();
      const existing = map.get(cleanSku);
      const inv = inventoryMap.get(cleanSku);
      const prod = productMap.get(cleanSku);
      const contract = contractMap.get(order.contractId);
      const reqDate = contract?.deliveryDate || order.supplierETA || order.orderDate;

      const orderRemaining =
        order.remainingQuantity !== undefined
          ? order.remainingQuantity
          : Math.max(0, order.orderQuantity - (order.receivedQuantity || 0));

      if (existing) {
        existing.totalSalesDemand += order.orderQuantity || 0;
        existing.totalReceived += order.receivedQuantity || 0;
        existing.totalShortage += orderRemaining;
        existing.orders.push(order);
        if (reqDate && (!existing.earliestRequiredDate || reqDate < existing.earliestRequiredDate)) {
          existing.earliestRequiredDate = reqDate;
        }
        // Highest priority status
        if (order.status === 'in_transit' && existing.status !== 'in_transit') {
          existing.status = 'in_transit';
        } else if (order.status === 'ordered' && existing.status === 'pending') {
          existing.status = 'ordered';
        }
      } else {
        map.set(cleanSku, {
          sku: order.sku,
          productName: order.productName,
          brand: order.brand || prod?.brand || 'Khác',
          unit: order.unit || 'Bộ',
          totalOnHand: inv ? inv.totalQuantity || 0 : 0,
          totalSalesDemand: order.orderQuantity || 0,
          totalReceived: order.receivedQuantity || 0,
          totalShortage: orderRemaining,
          plannedPoQuantity: Math.max(order.orderQuantity || 0, inv ? inv.onOrderQuantity || 0 : 0),
          earliestRequiredDate: reqDate || '',
          status: order.status || 'pending',
          orders: [order],
        });
      }
    }

    return Array.from(map.values());
  }, [filteredOrders, inventoryMap, productMap, contractMap]);

  const pendingActiveCount = orderItems.filter((o) => isPendingOrder(o.status)).length;
  const totalShortageQty = orderItems
    .filter((o) => isPendingOrder(o.status))
    .reduce((sum, o) => sum + Math.max(0, o.remainingQuantity ?? (o.orderQuantity - (o.receivedQuantity || 0))), 0);

  // Multi-select handlers
  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleToggleSelectSku = (orders: OrderItem[]) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      const allSelected = orders.every((o) => next.has(o.id));
      if (allSelected) {
        orders.forEach((o) => next.delete(o.id));
      } else {
        orders.forEach((o) => next.add(o.id));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  // Status Labels & Badge Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_order':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            🔴 1. Đã nhận yêu cầu
          </span>
        );
      case 'ordered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            🟡 2. Đã đặt NCC
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            🚚 3. Đang vận chuyển
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
            🟠 Về 1 phần
          </span>
        );
      case 'arrived':
      case 'ready_to_deliver':
      case 'received':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            🟢 4. Đã về kho
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            📦 5. Đã giao khách
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            ⚪ {status}
          </span>
        );
    }
  };

  const handleUpdateSkuStatus = (orders: OrderItem[], newStatus: any) => {
    for (const order of orders) {
      updateOrderWarehouseStatus(order.id, newStatus);
    }
  };

  const handleExportExcel = () => {
    const data = skuSummaries.map((s, idx) => ({
      'STT': idx + 1,
      'Mã Hàng': s.sku,
      'Tên Hàng': s.productName,
      'Hãng': s.brand,
      'Số Lượng Tồn Kho': s.totalOnHand,
      'Số Lượng Sales Đặt': s.totalSalesDemand,
      'Đã Đáp Ứng': s.totalReceived,
      'Còn Thiếu': s.totalShortage,
      'Ngày Cần Sớm Nhất': formatDate(s.earliestRequiredDate),
      'Trạng Thái Kho': s.status,
      'Số Đơn Ghép': s.orders.length,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dat_Hang_Kho');
    XLSX.writeFile(wb, `Bang_Dat_Hang_Kho_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {/* Search & Filter Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo SKU, tên sản phẩm, HĐ, khách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('sku_summary')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center space-x-1 cursor-pointer ${
                viewMode === 'sku_summary'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Gom Theo Mã SKU ({skuSummaries.length})</span>
            </button>
            <button
              onClick={() => setViewMode('contract_list')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center space-x-1 cursor-pointer ${
                viewMode === 'contract_list'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Chi Tiết Từng HĐ ({filteredOrders.length})</span>
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
          >
            <option value="all_pending">Đang Cần Kho Đáp Ứng ({pendingActiveCount})</option>
            <option value="all">Tất cả ({orderItems.length})</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Excel
          </button>

          {canManage && (
            <button
              onClick={() => {
                if (selectedOrderIds.size === 0) {
                  const pendingIds = new Set(filteredOrders.filter((o) => isPendingOrder(o.status)).map((o) => o.id));
                  if (pendingIds.size > 0) setSelectedOrderIds(pendingIds);
                }
                setIsCreatePOModalOpen(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tạo Đơn Đặt NCC {selectedOrderIds.size > 0 ? `(${selectedOrderIds.size})` : ''}</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: BẢNG ĐẶT HÀNG - GOM THEO MÃ SKU (9 CỘT CHUẨN SECTION 7) */}
      {viewMode === 'sku_summary' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-3 bg-indigo-50/70 border-b border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-950">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Tổng nhu cầu Sales đang chờ Kho đặt & đáp ứng:</strong>{' '}
                <strong className="text-indigo-900">{totalShortageQty.toLocaleString()}</strong> sản phẩm qua{' '}
                <strong>{skuSummaries.length}</strong> mã hàng. Click vào <strong>Số lượng Sales đặt</strong> để xem chi tiết phân rã.
              </span>
            </div>
            <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full self-start sm:self-auto border border-indigo-200">
              {skuSummaries.length} mã sản phẩm
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  {canManage && <th className="px-2 py-3 text-center w-8">Chọn</th>}
                  <th className="px-3.5 py-3">Mã Hàng</th>
                  <th className="px-3.5 py-3">Tên Hàng</th>
                  <th className="px-3.5 py-3">Hãng</th>
                  <th className="px-3.5 py-3 text-right bg-slate-50 border-x">Số Lượng Tồn Kho</th>
                  <th className="px-3.5 py-3 text-center bg-indigo-50/60 text-indigo-950 border-x border-indigo-200">
                    Số Lượng Sales Đặt
                  </th>
                  <th className="px-3.5 py-3 text-center bg-amber-50/40 text-amber-950 border-r border-amber-200">
                    Số Lượng Đặt Lần Này
                  </th>
                  <th className="px-3.5 py-3">Ngày Cần Hàng Về</th>
                  <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                  <th className="px-3.5 py-3 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {skuSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                      Không có mã hàng nào đang cần đặt thêm từ NCC.
                    </td>
                  </tr>
                ) : (
                  skuSummaries.map((item) => {
                    const firstOrder = item.orders[0];
                    const isAllSkuSelected = item.orders.every((o) => selectedOrderIds.has(o.id));
                    const isSomeSkuSelected = item.orders.some((o) => selectedOrderIds.has(o.id));

                    return (
                      <tr key={item.sku} className="hover:bg-indigo-50/20 transition-colors">
                        {canManage && (
                          <td className="px-2 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleToggleSelectSku(item.orders)}
                              className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                              title={isAllSkuSelected ? 'Bỏ chọn mã này' : 'Chọn mã này để tạo PO'}
                            >
                              {isAllSkuSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : isSomeSkuSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-400 opacity-60" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        )}
                        <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">
                          {item.sku}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">
                          {item.productName}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-700">
                          {item.brand}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-800 bg-slate-50/50 border-x">
                          {item.totalOnHand.toLocaleString()}{' '}
                          <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                        </td>
                        {/* SỐ LƯỢNG SALES ĐẶT - CLICK TO INSPECT */}
                        <td
                          className="px-3.5 py-2.5 text-center bg-indigo-50/30 border-x border-indigo-100 cursor-pointer group"
                          onClick={() =>
                            setSelectedSkuForModal({
                              sku: item.sku,
                              name: item.productName,
                              brand: item.brand,
                            })
                          }
                          title="Click xem chi tiết nhu cầu theo từng Khách / HĐ / Sales"
                        >
                          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-mono font-black text-sm group-hover:bg-indigo-200 transition shadow-2xs">
                            <span>{item.totalSalesDemand}</span>
                            <span className="text-[10px] font-normal text-indigo-700">{item.unit}</span>
                            <Eye className="w-3 h-3 text-indigo-600 opacity-60 group-hover:opacity-100 ml-0.5" />
                          </span>
                          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                            {item.orders.length} hợp đồng gom
                          </div>
                        </td>
                        {/* SỐ LƯỢNG ĐẶT LẦN NÀY (KHO QUYẾT ĐỊNH) */}
                        <td className="px-3.5 py-2.5 text-center bg-amber-50/20 border-r border-amber-100">
                          <span className="inline-block font-mono font-black text-sm text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                            {Math.max(item.totalSalesDemand, item.plannedPoQuantity)} {item.unit}
                          </span>
                          <span className="text-[10px] text-amber-700 block mt-0.5">Kho quyết định</span>
                        </td>
                        {/* NGÀY CẦN HÀNG VỀ (NGÀY SỚM NHẤT) */}
                        <td className="px-3.5 py-2.5 font-medium text-slate-800">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.earliestRequiredDate ? formatDate(item.earliestRequiredDate) : 'Sớm nhất có thể'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Ngày cần sớm nhất</div>
                        </td>
                        {/* TRẠNG THÁI KHO CẬP NHẬT */}
                        <td className="px-3.5 py-2.5 text-center">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateSkuStatus(item.orders, e.target.value)}
                            className="px-2 py-1 text-[11px] font-bold border border-slate-300 rounded-lg bg-white shadow-2xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="pending">🔴 1. Đã nhận yêu cầu</option>
                            <option value="ordered">🟡 2. Đã đặt NCC</option>
                            <option value="in_transit">🚚 3. Đang vận chuyển</option>
                            <option value="ready_to_deliver">🟢 4. Đã về kho</option>
                            <option value="delivered">📦 5. Đã giao khách</option>
                          </select>
                        </td>
                        {/* HÀNH ĐỘNG KHO */}
                        <td className="px-3.5 py-2.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() =>
                                setSelectedSkuForModal({
                                  sku: item.sku,
                                  name: item.productName,
                                  brand: item.brand,
                                })
                              }
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                              title="Xem chi tiết các yêu cầu Sales"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Chi Tiết</span>
                            </button>
                            <button
                              onClick={() => onOpenReceiveModal(firstOrder)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
                              title="Nhập hàng thực tế vào kho & phân bổ tồn khả dụng"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              <span>Nhập Kho</span>
                            </button>
                          </div>
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

      {/* VIEW 2: BẢNG CHI TIẾT TỪNG HỢP ĐỒNG */}
      {viewMode === 'contract_list' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-3 bg-indigo-50/70 border-b border-indigo-200 flex items-center justify-between text-xs text-indigo-950">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-indigo-600" />
              <span>Danh sách chi tiết từng yêu cầu đặt hàng theo hợp đồng: <strong>{filteredOrders.length}</strong> đơn.</span>
            </div>
            <div className="flex items-center space-x-2">
              {canManage && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition cursor-pointer"
                >
                  {selectedOrderIds.size === filteredOrders.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              )}
              <span className="text-[11px] text-slate-500 italic">Kho toàn quyền nhập số lượng thực tế ≥ nhu cầu</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  {canManage && <th className="px-2 py-3 text-center w-8">Chọn</th>}
                  <th className="px-3.5 py-3">Mã Hàng & Sản Phẩm</th>
                  <th className="px-3 py-3 text-center bg-indigo-50/40 border-x border-indigo-100">Nhu Cầu Sales</th>
                  <th className="px-3 py-3 text-center bg-emerald-50/40 border-r border-emerald-100 text-emerald-900">Đã Đáp Ứng</th>
                  <th className="px-3 py-3 text-center bg-amber-50/40 border-r border-amber-100 text-amber-900">Còn Thiếu</th>
                  <th className="px-3.5 py-3">Hợp Đồng & Khách Hàng</th>
                  <th className="px-3.5 py-3">Trạng Thái Đáp Ứng</th>
                  <th className="px-3.5 py-3">Ghi Chú</th>
                  <th className="px-3.5 py-3 text-center">Thao Tác Kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      Không có yêu cầu đặt hàng nào trong danh sách.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const shortage =
                      order.remainingQuantity !== undefined
                        ? order.remainingQuantity
                        : Math.max(0, order.orderQuantity - (order.receivedQuantity || 0));
                    const isSelected = selectedOrderIds.has(order.id);

                    return (
                      <tr key={order.id} className="hover:bg-indigo-50/20">
                        {canManage && (
                          <td className="px-2 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleToggleSelectOrder(order.id)}
                              className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                        )}
                        <td className="px-3.5 py-2.5">
                          <div className="font-mono font-bold text-indigo-700">{order.sku}</div>
                          <div className="font-bold text-slate-900">{order.productName}</div>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-slate-900 border-x bg-indigo-50/10">
                          {order.orderQuantity} {order.unit}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-emerald-700 border-r bg-emerald-50/10">
                          {order.receivedQuantity || 0}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-amber-700 border-r bg-amber-50/10">
                          {shortage}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div
                            className="font-bold text-blue-600 hover:underline cursor-pointer"
                            onClick={() => onOpenContractPdf(order.contractId)}
                          >
                            {order.contractNumber}
                          </div>
                          <div className="font-semibold text-slate-900">{getCustomerDisplayName(order)}</div>
                          <div className="text-[10px] text-slate-500">Sales: {getAssignedSalesRepName(order)}</div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-3.5 py-2.5">
                          {editingNotesId === order.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                className="w-full border rounded px-1 text-xs"
                              />
                              <Save
                                className="w-3.5 h-3.5 text-emerald-600 cursor-pointer"
                                onClick={() => {
                                  updateOrderItem({ ...order, notes: tempNotes });
                                  setEditingNotesId(null);
                                }}
                              />
                            </div>
                          ) : (
                            <span
                              className="text-slate-600 truncate max-w-[120px] block cursor-pointer"
                              onClick={() => {
                                setEditingNotesId(order.id);
                                setTempNotes(order.notes || '');
                              }}
                            >
                              {order.notes || '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPendingOrder(order.status) && (
                              <button
                                onClick={() => onOpenReceiveModal(order)}
                                title="Nhập hàng vào kho & phân bổ"
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                                <span>Nhập Kho</span>
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setSelectedSkuForModal({
                                  sku: order.sku,
                                  name: order.productName,
                                  brand: order.brand,
                                })
                              }
                              title="Xem chi tiết"
                              className="p-1 rounded hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Modal Chi Tiết Nhu Cầu Đặt Hàng (Triggered when clicking on Số lượng Sales đặt) */}
      {selectedSkuForModal && (
        <ItemOrderRequirementsModal
          sku={selectedSkuForModal.sku}
          productName={selectedSkuForModal.name}
          brand={selectedSkuForModal.brand}
          onClose={() => setSelectedSkuForModal(null)}
        />
      )}

      {/* Create Purchase Order Modal */}
      {isCreatePOModalOpen && (
        <CreatePurchaseOrderModal
          isOpen={isCreatePOModalOpen}
          selectedSalesRequests={orderItems.filter((o) => selectedOrderIds.has(o.id))}
          onClose={() => setIsCreatePOModalOpen(false)}
          onSuccess={() => {
            setSelectedOrderIds(new Set());
            setIsCreatePOModalOpen(false);
          }}
        />
      )}

      <EditOrderItemModal
        isOpen={!!editingOrderItem}
        order={editingOrderItem}
        contract={contracts.find((c) => c.id === editingOrderItem?.contractId)}
        customer={customers.find((c) => c.id === editingOrderItem?.customerId)}
        onClose={() => setEditingOrderItem(null)}
        onSave={(updated) => updateOrderItem(updated)}
      />
    </div>
  );
};

