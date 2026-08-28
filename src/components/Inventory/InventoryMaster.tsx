import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, ReserveItem, OrderItem, Contract, Customer } from '../../types';
import { exportInventoryToExcel, downloadInventoryTemplateExcel, formatDate } from '../../utils/formatters';
import { InventoryImportModal } from './InventoryImportModal';
import { ItemReservationsModal } from './ItemReservationsModal';
import { WarehouseOverviewStats } from './WarehouseOverviewStats';
import { ReservedItemsWarehouseTable } from './ReservedItemsWarehouseTable';
import { ContractOrdersWarehouseTable } from './ContractOrdersWarehouseTable';
import { ReorderAlertsTable } from './ReorderAlertsTable';
import { DispatchConfirmModal } from './DispatchConfirmModal';
import { ReceiveOrderModal } from './ReceiveOrderModal';
import { AddEditInventoryModal } from './AddEditInventoryModal';
import { ErrorBoundary } from '../Common/ErrorBoundary';
import {
  Boxes,
  Layers,
  ShoppingCart,
  AlertTriangle,
  Search,
  Upload,
  Download,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  Warehouse,
  ShieldCheck,
  PackageCheck,
  CheckCircle2,
  RefreshCw,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const InventoryMasterContent: React.FC = () => {
  const {
    inventory,
    reserveItems,
    orderItems,
    customers,
    contracts,
    quotations,
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
  const [activeSubTab, setActiveSubTab] = useState<
    'all_inventory' | 'holding_reserves' | 'contract_orders' | 'critical_alerts'
  >('all_inventory');

  // Search & Filter for All Inventory Tab
  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'available' | 'holding' | 'low' | 'out_of_stock'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItemForHoldModal, setSelectedItemForHoldModal] = useState<InventoryItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Dispatch & Receive Order modals
  const [dispatchModalItem, setDispatchModalItem] = useState<ReserveItem | null>(null);
  const [receiveModalOrder, setReceiveModalOrder] = useState<OrderItem | null>(null);

  const canManageInventory = currentUser.role === 'manager_c1' || currentUser.role === 'sales_c2';

  // Extract distinct warehouse locations
  const locationList = Array.from(
    new Set(inventory.map((i) => i.warehouseLocation || 'Kho Tổng TP.HCM').filter(Boolean))
  );

  // Filtered inventory list
  const displayedInventory = inventory.filter((item) => {
    const sTerm = (searchTerm || '').toLowerCase();
    const iSku = (item.sku || '').toLowerCase();
    const iName = (item.name || '').toLowerCase();
    const iLoc = (item.warehouseLocation || '').toLowerCase();

    const matchSearch =
      iSku.includes(sTerm) ||
      iName.includes(sTerm) ||
      iLoc.includes(sTerm);

    let matchStock = true;
    if (stockStatusFilter === 'available') {
      matchStock = item.availableQuantity > 5;
    } else if (stockStatusFilter === 'holding') {
      matchStock = item.reservedQuantity > 0;
    } else if (stockStatusFilter === 'low') {
      matchStock = item.availableQuantity > 0 && item.availableQuantity <= 5;
    } else if (stockStatusFilter === 'out_of_stock') {
      matchStock = item.availableQuantity === 0;
    }

    const matchLocation =
      locationFilter === 'all' || (item.warehouseLocation || 'Kho Tổng TP.HCM') === locationFilter;

    return matchSearch && matchStock && matchLocation;
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const totalPages = Math.ceil(displayedInventory.length / pageSize) || 1;
  const paginatedInventory = displayedInventory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Action handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteItem = (sku: string, name: string, reservedQty: number) => {
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
    dispatchData: { receiverName: string; receiverPhone: string; notes: string; dispatchDate: string }
  ) => {
    updateReserveStatus(reserveId, 'dispatched');
    setDispatchModalItem(null);
  };

  const handleConfirmReceiveOrder = (orderId: string, warehouseLocation: string) => {
    receiveOrderToWarehouseAndReserve(orderId, warehouseLocation);
    setReceiveModalOrder(null);
  };

  // Holding & Pending Order counts
  const activeReservesCount = reserveItems.filter((r) => r.status === 'holding').length;
  const activeOrdersCount = orderItems.filter((o) => o.status === 'pending_order' || o.status === 'ordered').length;
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
            <span>Đã kết nối Cloud Firestore</span>
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
        reserveItems={reserveItems}
        orderItems={orderItems}
        onSelectTab={(tabKey) => setActiveSubTab(tabKey)}
      />

      {/* TABS NAVIGATION */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex flex-wrap items-center gap-1 shadow-2xs">
        {/* Tab 1: All Inventory Master */}
        <button
          onClick={() => setActiveSubTab('all_inventory')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'all_inventory'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Danh Mục Tồn Kho ({inventory.length})</span>
        </button>

        {/* Tab 2: Holding Reserves (Who is holding what) */}
        <button
          onClick={() => setActiveSubTab('holding_reserves')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'holding_reserves'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Hàng Đang Giữ Cho Sale & Khách</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeSubTab === 'holding_reserves'
                ? 'bg-amber-800 text-amber-100'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {activeReservesCount}
          </span>
        </button>

        {/* Tab 3: Contract PO Orders */}
        <button
          onClick={() => setActiveSubTab('contract_orders')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'contract_orders'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-indigo-50'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Hàng Cần Đặt Theo HĐ Ký Khách</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeSubTab === 'contract_orders'
                ? 'bg-indigo-800 text-indigo-100'
                : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
            }`}
          >
            {activeOrdersCount}
          </span>
        </button>

        {/* Tab 4: Critical Reorder Alerts */}
        <button
          onClick={() => setActiveSubTab('critical_alerts')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'critical_alerts'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Cảnh Báo Hết Hàng & Nhu Cầu BG</span>
          {criticalCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSubTab === 'critical_alerts'
                  ? 'bg-rose-800 text-rose-100'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {criticalCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT AREAS */}
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
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-medium text-slate-700"
              >
                <option value="all">Tất cả tình trạng kho ({inventory.length})</option>
                <option value="available">Tồn khả dụng dồi dào (&gt;5)</option>
                <option value="holding">Đang có hợp đồng giữ</option>
                <option value="low">Sắp hết hàng (1-5)</option>
                <option value="out_of_stock">Hết hàng tồn (0)</option>
              </select>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-medium text-slate-700"
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
                    <th className="px-3.5 py-3">Mã Hàng (SKU)</th>
                    <th className="px-3.5 py-3">Tên Hàng Hóa</th>
                    <th className="px-3 py-3 text-center">ĐVT</th>
                    <th className="px-3.5 py-3 text-center">Tồn Thực Tế</th>
                    <th
                      className="px-3.5 py-3 text-center bg-amber-50/90 text-amber-950 border-x border-amber-200 cursor-pointer"
                      title="Bấm vào số lượng để xem chi tiết Sale nào đang giữ và giữ cho khách hàng nào"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Đang Giữ Cho HĐ</span>
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                    </th>
                    <th className="px-3.5 py-3 text-center bg-emerald-50/80 text-emerald-950 font-bold">
                      Tồn Khả Dụng Để Bán
                    </th>
                    <th className="px-3.5 py-3">Vị Trí Kệ Lưu Kho</th>
                    <th className="px-3.5 py-3 text-center">Cập Nhật</th>
                    {canManageInventory && <th className="px-3.5 py-3 text-center">Kiểm Kê Nhanh & Thao Tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {displayedInventory.length === 0 ? (
                    <tr>
                      <td colSpan={canManageInventory ? 9 : 8} className="px-4 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Boxes className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-sm">
                            {currentUser.role === 'super_admin'
                              ? 'Tài khoản Super Admin không hiển thị kho hàng bán lẻ của các công ty. Vui lòng đăng nhập tài khoản Cấp 1 tương ứng để xem và quản lý kho.'
                              : 'Không tìm thấy dữ liệu tồn kho nào phù hợp'}
                          </p>
                          <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc bấm "Import Excel" để nạp tồn kho ban đầu</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedInventory.map((item, idx) => (
                      <tr key={item.sku || `inv-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">{item.sku}</td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900 line-clamp-1" title={item.name}>
                          {item.name}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-medium text-slate-600">{item.unit}</td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-slate-900 font-mono">
                          {item.totalQuantity}
                        </td>

                        {/* RESERVED COLUMN: Clickable to view details */}
                        <td className="px-3.5 py-2.5 text-center bg-amber-50/40 border-x border-amber-100">
                          <button
                            type="button"
                            onClick={() => setSelectedItemForHoldModal(item)}
                            title={`Bấm để xem danh sách Sale đang giữ ${item.reservedQuantity} ${item.unit} cho khách hàng nào`}
                            className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs transition inline-flex items-center space-x-1 cursor-pointer group ${
                              item.reservedQuantity > 0
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 shadow-2xs'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {item.reservedQuantity > 0 && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            )}
                            <span>{item.reservedQuantity}</span>
                          </button>
                        </td>

                        {/* AVAILABLE QUANTITY */}
                        <td className="px-3.5 py-2.5 text-center bg-emerald-50/40 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-xs ${
                              item.availableQuantity > 5
                                ? 'text-emerald-700 bg-emerald-100'
                                : item.availableQuantity > 0
                                ? 'text-amber-700 bg-amber-100'
                                : 'text-rose-700 bg-rose-100'
                            }`}
                          >
                            {item.availableQuantity}
                          </span>
                        </td>

                        <td className="px-3.5 py-2.5 text-slate-600 font-medium">{item.warehouseLocation || 'Kho Tổng TP.HCM'}</td>
                        <td className="px-3.5 py-2.5 text-center text-[11px] text-slate-400 font-mono">{formatDate(item.updatedAt)}</td>

                        {/* QUICK STOCK ADJUSTMENT */}
                        {canManageInventory && (
                          <td className="px-3.5 py-2.5 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => quickAdjustStock(item.sku, -1)}
                                className="p-1 rounded bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                                title="Giảm 1 số lượng (Xuất kho nhanh)"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => quickAdjustStock(item.sku, 1)}
                                className="p-1 rounded bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                                title="Tăng 1 số lượng (Nhập kho nhanh)"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => quickAdjustStock(item.sku, 10)}
                                className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold cursor-pointer"
                                title="Cộng 10 hàng nhập kho mới"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                                title="Chỉnh sửa thông tin tồn kho"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.sku, item.name, item.reservedQuantity)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                                title="Xóa mã SKU khỏi kho"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {displayedInventory.length > 0 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <span>Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-700"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                  <span>dòng / trang</span>
                  <span className="text-slate-400">|</span>
                  <span>Tổng cộng <strong>{displayedInventory.length.toLocaleString('vi-VN')}</strong> mã tồn kho</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 font-semibold"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>

                  <span className="font-bold px-2">
                    Trang {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 font-semibold"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HOLDING RESERVES */}
      {activeSubTab === 'holding_reserves' && (
        <ReservedItemsWarehouseTable
          reserveItems={reserveItems}
          customers={customers}
          contracts={contracts}
          onOpenDispatchModal={(resItem) => setDispatchModalItem(resItem)}
          onOpenContractPdf={handleOpenContractPdf}
        />
      )}

      {/* TAB 3: CONTRACT ORDERS NEEDED */}
      {activeSubTab === 'contract_orders' && (
        <ContractOrdersWarehouseTable
          orderItems={orderItems}
          contracts={contracts}
          customers={customers}
          onOpenReceiveModal={(order) => setReceiveModalOrder(order)}
          onUpdateOrderStatus={updateOrderStatus}
          onOpenContractPdf={handleOpenContractPdf}
        />
      )}

      {/* TAB 4: CRITICAL REORDER ALERTS */}
      {activeSubTab === 'critical_alerts' && (
        <ReorderAlertsTable
          inventory={inventory}
          quotations={quotations}
          onOpenEditItem={handleOpenEditModal}
          onQuickAdjust={quickAdjustStock}
        />
      )}

      {/* MODALS */}
      <AddEditInventoryModal
        isOpen={isAddEditModalOpen}
        itemToEdit={editingItem}
        onClose={() => setIsAddEditModalOpen(false)}
      />

      <InventoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <ItemReservationsModal
        item={selectedItemForHoldModal}
        onClose={() => setSelectedItemForHoldModal(null)}
      />

      <DispatchConfirmModal
        item={dispatchModalItem}
        customer={customers.find((c) => c.id === dispatchModalItem?.customerId)}
        contract={contracts.find((c) => c.id === dispatchModalItem?.contractId)}
        onClose={() => setDispatchModalItem(null)}
        onConfirm={handleConfirmDispatch}
      />

      <ReceiveOrderModal
        order={receiveModalOrder}
        contract={contracts.find((c) => c.id === receiveModalOrder?.contractId)}
        onClose={() => setReceiveModalOrder(null)}
        onConfirm={handleConfirmReceiveOrder}
      />
    </div>
  );
};

export const InventoryMaster: React.FC = () => (
  <ErrorBoundary fallbackTitle="Đã xảy ra lỗi khi hiển thị Quản lý Kho Hàng">
    <InventoryMasterContent />
  </ErrorBoundary>
);
