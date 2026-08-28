import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Layers,
  ShoppingCart,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  Plus,
  Search,
  Warehouse,
  ShieldCheck,
  Building2,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Truck,
  PackageCheck,
  ClipboardCheck,
  History,
  LayoutDashboard,
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, ReserveItem, OrderItem } from '../../types';
import { exportInventoryToExcel, downloadInventoryTemplateExcel } from '../../utils/formatters';
import { WarehouseOverviewStats } from './WarehouseOverviewStats';
import { ReservedItemsWarehouseTable } from './ReservedItemsWarehouseTable';
import { ContractOrdersWarehouseTable } from './ContractOrdersWarehouseTable';
import { ReorderAlertsTable } from './ReorderAlertsTable';
import { AddEditInventoryModal } from './AddEditInventoryModal';
import { InventoryImportModal } from './InventoryImportModal';
import { ProductInventoryDrawer } from './ProductInventoryDrawer';
import { StockInWarehouseView } from './StockInWarehouseView';
import { StockOutWarehouseView } from './StockOutWarehouseView';
import { StockAuditWarehouseView } from './StockAuditWarehouseView';
import { StockLedgerWarehouseView } from './StockLedgerWarehouseView';
import { DispatchConfirmModal } from './DispatchConfirmModal';
import { ReceiveOrderModal } from './ReceiveOrderModal';
import { ErrorBoundary } from '../Common/ErrorBoundary';

type WarehouseTabType =
  | 'overview'
  | 'all_inventory'
  | 'holding_reserves'
  | 'contract_orders'
  | 'stock_in'
  | 'stock_out'
  | 'stock_audit'
  | 'stock_ledger'
  | 'critical_alerts';

type SortField = 'sku' | 'name' | 'totalQuantity' | 'reservedQuantity' | 'availableQuantity' | 'onOrderQuantity';

const InventoryMasterContent: React.FC = () => {
  const {
    inventory,
    filteredReserveItems,
    filteredOrderItems,
    customers,
    contracts,
    updateInventoryItem,
    deleteInventoryItem,
    quickAdjustStock,
    updateReserveStatus,
    updateOrderStatus,
    receiveOrderToWarehouseAndReserve,
    setPdfPreviewData,
    currentUser,
    companyScope,
  } = useApp();

  // Navigation tab inside Inventory & Warehouse module
  const [activeSubTab, setActiveSubTab] = useState<WarehouseTabType>('all_inventory');

  // Search, Filter & Sort for All Inventory Tab
  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<
    'all' | 'available' | 'holding' | 'low' | 'out_of_stock' | 'on_order'
  >('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('sku');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals & Drawers state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [drawerSelectedItem, setDrawerSelectedItem] = useState<InventoryItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Dispatch & Receive Order modals
  const [dispatchModalItem, setDispatchModalItem] = useState<ReserveItem | null>(null);
  const [receiveModalOrder, setReceiveModalOrder] = useState<OrderItem | null>(null);

  // Cross-tab trigger state
  const [targetStockInSku, setTargetStockInSku] = useState<string | undefined>(undefined);
  const [targetStockOutSku, setTargetStockOutSku] = useState<string | undefined>(undefined);

  const canManageInventory = currentUser.role === 'manager_c1' || currentUser.role === 'sales_c2' || currentUser.role === 'super_admin';

  // Extract distinct warehouse locations
  const locationList = useMemo(() => {
    return Array.from(
      new Set(inventory.map((i) => i.warehouseLocation || 'Kho Tổng TP.HCM').filter(Boolean))
    );
  }, [inventory]);

  // Handle Sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered & Sorted inventory list
  const processedInventory = useMemo(() => {
    const sTerm = (searchTerm || '').toLowerCase();

    // 1. Filter
    const filtered = inventory.filter((item) => {
      const iSku = (item.sku || '').toLowerCase();
      const iName = (item.name || '').toLowerCase();
      const iLoc = (item.warehouseLocation || '').toLowerCase();

      const matchSearch = iSku.includes(sTerm) || iName.includes(sTerm) || iLoc.includes(sTerm);

      let matchStock = true;
      const onHand = item.totalQuantity || 0;
      const reserved = item.reservedQuantity || 0;
      const available = item.availableQuantity || 0;
      const onOrder = item.onOrderQuantity || 0;

      if (stockStatusFilter === 'available') {
        matchStock = available > 5;
      } else if (stockStatusFilter === 'holding') {
        matchStock = reserved > 0;
      } else if (stockStatusFilter === 'low') {
        matchStock = available > 0 && available <= 5;
      } else if (stockStatusFilter === 'out_of_stock') {
        matchStock = onHand === 0 || available <= 0;
      } else if (stockStatusFilter === 'on_order') {
        matchStock = onOrder > 0;
      }

      const matchLocation =
        locationFilter === 'all' || (item.warehouseLocation || 'Kho Tổng TP.HCM') === locationFilter;

      return matchSearch && matchStock && matchLocation;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      let valA: any = a[sortField] ?? '';
      let valB: any = b[sortField] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [inventory, searchTerm, stockStatusFilter, locationFilter, sortField, sortDirection]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const totalPages = Math.ceil(processedInventory.length / pageSize) || 1;
  const paginatedInventory = processedInventory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Action handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteItem = (sku: string, name: string, reservedQty: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (reservedQty > 0) {
      alert(`Không thể xóa mặt hàng này vì đang có ${reservedQty} sản phẩm bị giữ cho hợp đồng!`);
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa mã SKU ${sku} (${name}) khỏi danh mục kho?`)) {
      deleteInventoryItem(sku);
    }
  };

  const handleOpenContractPdf = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      setPdfPreviewData({ type: 'contract', data: contract });
    }
  };

  const handleConfirmDispatch = (
    reserveId: string,
    dispatchData: { receiverName: string; receiverPhone: string; notes: string; dispatchDate: string; dispatchQty?: number }
  ) => {
    dispatchReserveWarehouse(reserveId, dispatchData);
    setDispatchModalItem(null);
  };

  const handleConfirmReceiveOrder = (
    orderId: string,
    receiveQuantity: number,
    warehouseLocation: string,
    notes?: string,
    receiptNumber?: string
  ) => {
    receiveInboundOrderBatch(orderId, receiveQuantity, warehouseLocation, notes, receiptNumber);
    setReceiveModalOrder(null);
  };

  // Holding & Pending Order counts
  const isHolding = (status?: string) =>
    status === 'holding' || status === 'active' || status === 'allocated' || status === 'picking' || status === 'ready_to_ship';
  const activeReservesCount = filteredReserveItems.filter((r) => isHolding(r.status)).length;
  const activeOrdersCount = filteredOrderItems.filter(
    (o) => o.status === 'pending' || o.status === 'pending_order' || o.status === 'ordered' || o.status === 'in_transit' || o.status === 'partial'
  ).length;
  const criticalCount = inventory.filter((i) => i.availableQuantity <= 5).length;

  return (
    <div className="space-y-4">
      {/* Company Tenant Scope Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-600 text-white rounded-md shrink-0 shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center space-x-2">
              <span>{companyScope.companyName}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                {currentUser.role === 'manager_c1'
                  ? 'Quản lý Cấp 1 (Công ty)'
                  : currentUser.role === 'sales_c2'
                  ? 'Kinh doanh Cấp 2 (Thuộc công ty)'
                  : 'Super Admin Quản trị'}
              </span>
            </div>
            <p className="text-slate-600 text-[11px] mt-0.5">
              {currentUser.role === 'super_admin'
                ? 'Super Admin chỉ quản trị tài khoản hệ thống. Mỗi công ty Cấp 1 sở hữu và quản lý dữ liệu kho độc lập.'
                : 'Kho hàng và dữ liệu giữ hàng được cách ly theo từng công ty. Cấp 1 và Cấp 2 thuộc cùng công ty dùng chung kho hàng này.'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white/80 border border-blue-200 rounded-md font-medium text-slate-700 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã kết nối Firestore & IndexedDB</span>
          </span>
        </div>
      </div>

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <Warehouse className="w-4 h-4" />
            </div>
            <span>Trung Tâm Quản Lý Kho Hàng & Tồn Kho (Warehouse Center)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dashboard quản lý xuất nhập tồn, tra cứu hàng đang giữ theo Sale & Khách hàng, theo dõi đơn cần đặt theo hợp đồng ký kết.
          </p>
        </div>

        {/* Global Warehouse Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
          <button
            onClick={downloadInventoryTemplateExcel}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
            title="Tải file mẫu nhập tồn kho Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">File Mẫu</span>
          </button>

          <button
            onClick={() => exportInventoryToExcel(inventory)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
            title="Xuất danh mục tồn kho Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel ({inventory.length})</span>
          </button>

          {canManageInventory && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
                title="Import tồn kho từ file Excel"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Excel</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Mã Hàng</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* DASHBOARD KPI OVERVIEW STRIP */}
      <WarehouseOverviewStats
        inventory={inventory}
        reserveItems={filteredReserveItems}
        orderItems={filteredOrderItems}
        customers={customers}
        onSelectTab={(tabKey) => setActiveSubTab(tabKey)}
      />

      {/* 8 TABS NAVIGATION */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex flex-wrap items-center gap-1 shadow-2xs">
        {/* Tab 1: Tổng quan kho */}
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Tổng Quan Kho</span>
        </button>

        {/* Tab 2: Danh mục Tồn kho */}
        <button
          onClick={() => setActiveSubTab('all_inventory')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'all_inventory'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Tồn Kho ({inventory.length})</span>
        </button>

        {/* Tab 3: Hàng đang giữ */}
        <button
          onClick={() => setActiveSubTab('holding_reserves')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'holding_reserves'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Hàng Đang Giữ ({activeReservesCount})</span>
        </button>

        {/* Tab 4: Đơn hàng cần xử lý */}
        <button
          onClick={() => setActiveSubTab('contract_orders')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'contract_orders'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-indigo-50'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Đơn Cần Đặt ({activeOrdersCount})</span>
        </button>

        {/* Tab 5: Nhập kho */}
        <button
          onClick={() => setActiveSubTab('stock_in')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'stock_in'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-50'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Nhập Kho</span>
        </button>

        {/* Tab 6: Xuất kho */}
        <button
          onClick={() => setActiveSubTab('stock_out')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'stock_out'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-rose-50'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Xuất Kho</span>
        </button>

        {/* Tab 7: Kiểm kê */}
        <button
          onClick={() => setActiveSubTab('stock_audit')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'stock_audit'
              ? 'bg-purple-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Kiểm Kê</span>
        </button>

        {/* Tab 8: Lịch sử biến động */}
        <button
          onClick={() => setActiveSubTab('stock_ledger')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'stock_ledger'
              ? 'bg-slate-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Lịch Sử Biến Động</span>
        </button>

        {/* Tab 9: Cảnh báo hết hàng */}
        {criticalCount > 0 && (
          <button
            onClick={() => setActiveSubTab('critical_alerts')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'critical_alerts'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-600 hover:text-rose-900 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Cảnh Báo ({criticalCount})</span>
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW SUMMARY */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Hoạt Động Nhập - Xuất Gần Đây</span>
              </h3>
              <p className="text-xs text-slate-500">
                Theo dõi tiến độ giao nhận kho và lập phiếu luân chuyển hàng hóa.
              </p>
              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setActiveSubTab('stock_in')}
                  className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition cursor-pointer"
                >
                  📥 Vào Quản Lý Nhập Kho &rarr;
                </button>
                <button
                  onClick={() => setActiveSubTab('stock_out')}
                  className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold border border-rose-200 transition cursor-pointer"
                >
                  📤 Vào Quản Lý Xuất Kho &rarr;
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ClipboardCheck className="w-4 h-4 text-purple-600" />
                <span>Kiểm Kê & Sổ Nhật Ký Biến Động</span>
              </h3>
              <p className="text-xs text-slate-500">
                Đảm bảo tính chính xác giữa thực tế và phần mềm, không thất thoát hàng hóa.
              </p>
              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setActiveSubTab('stock_audit')}
                  className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold border border-purple-200 transition cursor-pointer"
                >
                  📋 Vào Kiểm Kê Kho &rarr;
                </button>
                <button
                  onClick={() => setActiveSubTab('stock_ledger')}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition cursor-pointer"
                >
                  📜 Xem Sổ Nhật Ký &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL INVENTORY MASTER */}
      {activeSubTab === 'all_inventory' && (
        <div className="space-y-3">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo mã SKU, tên sản phẩm, vị trí kho..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-medium text-slate-700 cursor-pointer"
              >
                <option value="all">Tất cả tình trạng kho ({inventory.length})</option>
                <option value="available">🟢 Tồn khả dụng dồi dào (&gt;5)</option>
                <option value="holding">🟡 Đang có hàng giữ theo HĐ</option>
                <option value="low">🟠 Sắp hết hàng (1-5)</option>
                <option value="out_of_stock">🔴 Hết hàng tồn (0)</option>
                <option value="on_order">🔵 Đang có đơn đặt chờ về</option>
              </select>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-medium text-slate-700 cursor-pointer"
              >
                <option value="all">Tất cả vị trí kho ({locationList.length})</option>
                {locationList.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Master Inventory Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th
                      onClick={() => handleSort('sku')}
                      className="px-3.5 py-3 cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Mã SKU</span>
                        {sortField === 'sku' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('name')}
                      className="px-3.5 py-3 cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Tên Hàng Hóa</span>
                        {sortField === 'name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center">ĐVT</th>
                    <th
                      onClick={() => handleSort('totalQuantity')}
                      className="px-3.5 py-3 text-right cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Tồn Thực Tế</span>
                        {sortField === 'totalQuantity' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('reservedQuantity')}
                      className="px-3.5 py-3 text-right bg-amber-50/90 text-amber-950 border-x border-amber-200 cursor-pointer hover:bg-amber-100 transition"
                      title="Bấm để xem chi tiết Khách nào đang giữ"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Đang Giữ HĐ</span>
                        <Layers className="w-3 h-3 text-amber-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('availableQuantity')}
                      className="px-3.5 py-3 text-right bg-emerald-50/80 text-emerald-950 font-bold cursor-pointer hover:bg-emerald-100 transition"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Khả Dụng</span>
                        {sortField === 'availableQuantity' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('onOrderQuantity')}
                      className="px-3.5 py-3 text-right bg-indigo-50/60 text-indigo-950 cursor-pointer hover:bg-indigo-100 transition"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Đang Đặt NCC</span>
                        <ShoppingCart className="w-3 h-3 text-indigo-600" />
                      </div>
                    </th>
                    <th className="px-3.5 py-3">Vị Trí Kho</th>
                    <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                    <th className="px-3.5 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {processedInventory.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Boxes className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-sm">
                            Không tìm thấy dữ liệu tồn kho nào phù hợp
                          </p>
                          <p className="text-xs text-slate-400">
                            Thử thay đổi từ khóa tìm kiếm hoặc nạp tồn kho từ file Excel.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedInventory.map((item, idx) => {
                      const onHand = item.totalQuantity || 0;
                      const reserved = item.reservedQuantity || 0;
                      const available = item.availableQuantity || 0;
                      const onOrder = item.onOrderQuantity || 0;

                      return (
                        <tr
                          key={item.sku || `inv-${idx}`}
                          onClick={() => setDrawerSelectedItem(item)}
                          className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">
                            {item.sku}
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-slate-900 max-w-[200px] truncate" title={item.name}>
                            {item.name}
                          </td>
                          <td className="px-3 py-2.5 text-center font-medium text-slate-600">
                            {item.unit || 'Bộ'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-black text-slate-900 font-mono text-xs sm:text-sm">
                            {onHand.toLocaleString()}
                          </td>

                          {/* RESERVED */}
                          <td className="px-3.5 py-2.5 text-right bg-amber-50/40 border-x border-amber-100">
                            <span
                              className={`font-mono font-bold ${
                                reserved > 0 ? 'text-amber-800' : 'text-slate-300'
                              }`}
                            >
                              {reserved.toLocaleString()}
                            </span>
                          </td>

                          {/* AVAILABLE */}
                          <td className="px-3.5 py-2.5 text-right bg-emerald-50/30">
                            <span
                              className={`font-mono font-black text-xs sm:text-sm ${
                                available <= 0
                                  ? 'text-rose-600'
                                  : available <= 5
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {available.toLocaleString()}
                            </span>
                          </td>

                          {/* ON ORDER */}
                          <td className="px-3.5 py-2.5 text-right bg-indigo-50/20">
                            <span
                              className={`font-mono font-bold ${
                                onOrder > 0 ? 'text-indigo-800' : 'text-slate-300'
                              }`}
                            >
                              {onOrder.toLocaleString()}
                            </span>
                          </td>

                          <td className="px-3.5 py-2.5 text-slate-600 text-[11px] max-w-[130px] truncate">
                            {item.warehouseLocation || 'Kho Tổng TP.HCM'}
                          </td>

                          <td className="px-3.5 py-2.5 text-center">
                            {onHand === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                🔴 Hết hàng
                              </span>
                            ) : available <= 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                🟡 Giữ hết
                              </span>
                            ) : available <= 5 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                🟠 Sắp hết
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                🟢 Đủ hàng
                              </span>
                            )}
                          </td>

                          <td className="px-3.5 py-2.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setDrawerSelectedItem(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                              title="Xem chi tiết đa chiều"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {canManageInventory && (
                              <>
                                <button
                                  onClick={(e) => handleOpenEditModal(item, e)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
                                  title="Sửa thông tin mặt hàng"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteItem(item.sku, item.name, reserved, e)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                  title="Xóa mã hàng"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <span>
                  Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
                  {Math.min(currentPage * pageSize, processedInventory.length)} trong tổng số{' '}
                  <strong>{processedInventory.length}</strong> mã hàng
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                >
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                  <option value={100}>100 / trang</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs disabled:opacity-40"
                >
                  Đầu
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs disabled:opacity-40"
                >
                  Trước
                </button>
                <span className="px-2 py-1 font-mono font-bold">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs disabled:opacity-40"
                >
                  Sau
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs disabled:opacity-40"
                >
                  Cuối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOLDING RESERVES */}
      {activeSubTab === 'holding_reserves' && (
        <ReservedItemsWarehouseTable
          reserveItems={filteredReserveItems}
          customers={customers}
          contracts={contracts}
          onOpenDispatchModal={(resItem) => setDispatchModalItem(resItem)}
          onOpenContractPdf={handleOpenContractPdf}
        />
      )}

      {/* TAB 4: CONTRACT ORDERS NEEDED */}
      {activeSubTab === 'contract_orders' && (
        <ContractOrdersWarehouseTable
          orderItems={filteredOrderItems}
          contracts={contracts}
          customers={customers}
          onOpenReceiveModal={(order) => setReceiveModalOrder(order)}
          onOpenContractPdf={handleOpenContractPdf}
        />
      )}

      {/* TAB 5: STOCK IN VOUCHERS */}
      {activeSubTab === 'stock_in' && (
        <StockInWarehouseView initialSku={targetStockInSku} />
      )}

      {/* TAB 6: STOCK OUT VOUCHERS */}
      {activeSubTab === 'stock_out' && (
        <StockOutWarehouseView initialSku={targetStockOutSku} />
      )}

      {/* TAB 7: STOCK AUDIT */}
      {activeSubTab === 'stock_audit' && <StockAuditWarehouseView />}

      {/* TAB 8: STOCK TRANSACTION LEDGER */}
      {activeSubTab === 'stock_ledger' && <StockLedgerWarehouseView />}

      {/* TAB 9: CRITICAL REORDER ALERTS */}
      {activeSubTab === 'critical_alerts' && (
        <ReorderAlertsTable
          inventory={inventory}
          onOpenHoldDetail={(inv) => setDrawerSelectedItem(inv)}
        />
      )}

      {/* PRODUCT DETAIL MULTI-TAB DRAWER */}
      {drawerSelectedItem && (
        <ProductInventoryDrawer
          item={drawerSelectedItem}
          onClose={() => setDrawerSelectedItem(null)}
          onOpenAddStockIn={(sku) => {
            setTargetStockInSku(sku);
            setActiveSubTab('stock_in');
          }}
          onOpenAddStockOut={(sku) => {
            setTargetStockOutSku(sku);
            setActiveSubTab('stock_out');
          }}
        />
      )}

      {/* MODALS */}
      {isAddEditModalOpen && (
        <AddEditInventoryModal
          itemToEdit={editingItem}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setEditingItem(null);
          }}
        />
      )}

      {isImportModalOpen && (
        <InventoryImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {dispatchModalItem && (
        <DispatchConfirmModal
          item={dispatchModalItem}
          customer={customers.find((c) => c.id === dispatchModalItem.customerId)}
          contract={contracts.find((c) => c.id === dispatchModalItem.contractId)}
          onClose={() => setDispatchModalItem(null)}
          onConfirm={(reserveId, dispatchData) => handleConfirmDispatch(reserveId, dispatchData)}
        />
      )}

      {receiveModalOrder && (
        <ReceiveOrderModal
          order={receiveModalOrder}
          customer={customers.find((c) => c.id === receiveModalOrder.customerId)}
          contract={contracts.find((c) => c.id === receiveModalOrder.contractId)}
          onClose={() => setReceiveModalOrder(null)}
          onConfirm={(orderId, receiveQuantity, warehouseLocation, notes, receiptNumber) =>
            handleConfirmReceiveOrder(orderId, receiveQuantity, warehouseLocation, notes, receiptNumber)
          }
        />
      )}
    </div>
  );
};

export const InventoryMaster: React.FC = () => {
  return (
    <ErrorBoundary>
      <InventoryMasterContent />
    </ErrorBoundary>
  );
};
