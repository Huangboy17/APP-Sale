import React, { useState } from 'react';
import { ReserveItem, ReserveItemStatus, Customer, Contract } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { EditReserveItemModal } from './EditReserveItemModal';
import {
  isReserveInWorkQueue,
  isReserveCompleted,
  isReservePartiallyDelivered,
  getReserveDeliveredQuantity,
} from '../../utils/orderLifecycle';
import {
  Layers,
  Search,
  Filter,
  Download,
  Truck,
  FileText,
  User,
  Building,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  Edit2,
  RotateCcw,
  XCircle,
  Eye,
  Boxes,
  ArrowRight,
  PackageCheck,
  ShieldCheck,
  Warehouse,
  History,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReservedItemsWarehouseTableProps {
  reserveItems: ReserveItem[];
  customers: Customer[];
  contracts: Contract[];
  onOpenDispatchModal: (item: ReserveItem) => void;
  onOpenContractPdf: (contractId: string) => void;
}

export const ReservedItemsWarehouseTable: React.FC<ReservedItemsWarehouseTableProps> = ({
  reserveItems,
  customers,
  contracts,
  onOpenDispatchModal,
  onOpenContractPdf,
}) => {
  const {
    inventory,
    products,
    updateReserveItem,
    updateReserveStatus,
    updateReserveWarehouseStatus,
    releaseReservation,
    confirmDeliveryToCustomer,
    currentUser,
  } = useApp();

  const [viewMode, setViewMode] = useState<'work_queue' | 'history'>('work_queue');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all_active');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('all');
  const [editingReserveItem, setEditingReserveItem] = useState<ReserveItem | null>(null);
  const [detailItem, setDetailItem] = useState<ReserveItem | null>(null);

  // Customer, contract & inventory lookup maps
  const customerMap = React.useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const contractMap = React.useMemo(() => new Map(contracts.map((c) => [c.id, c])), [contracts]);
  const inventoryMap = React.useMemo(() => new Map(inventory.map((i) => [i.sku.toUpperCase(), i])), [inventory]);
  const productMap = React.useMemo(() => new Map(products.map((p) => [p.sku.toUpperCase(), p])), [products]);

  const getAssignedSalesRepName = (r: ReserveItem): string => {
    const cust = customerMap.get(r.customerId);
    if (cust) {
      return cust.assignedToName || 'Chưa phân công';
    }
    return r.salesRepName ? `${r.salesRepName} (Orphan)` : 'ORPHAN CUSTOMER';
  };

  const getCustomerDisplayName = (r: ReserveItem): string => {
    const cust = customerMap.get(r.customerId);
    return cust?.name || r.customerName || 'ORPHAN CUSTOMER';
  };

  const isHoldingStatus = (status: string) => {
    return (
      status === 'holding' ||
      status === 'active' ||
      status === 'allocated' ||
      status === 'picking' ||
      status === 'ready_to_ship' ||
      status === 'partially_delivered'
    );
  };

  const getStatusMeta = (status: ReserveItemStatus | string) => {
    switch (status) {
      case 'active':
      case 'holding':
        return {
          label: 'Đã Giữ Hàng',
          bgColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dotColor: 'bg-emerald-600',
          progress: 20,
          stepText: '1/5 Đã giữ',
        };
      case 'allocated':
        return {
          label: 'Đã Phân Bổ',
          bgColor: 'bg-blue-100 text-blue-800 border-blue-300',
          dotColor: 'bg-blue-600',
          progress: 40,
          stepText: '2/5 Phân bổ',
        };
      case 'picking':
        return {
          label: 'Đang Chuẩn Bị',
          bgColor: 'bg-amber-100 text-amber-800 border-amber-300',
          dotColor: 'bg-amber-600',
          progress: 60,
          stepText: '3/5 Đang gom hàng',
        };
      case 'ready_to_ship':
        return {
          label: 'Sẵn Sàng Xuất',
          bgColor: 'bg-purple-100 text-purple-800 border-purple-300',
          dotColor: 'bg-purple-600',
          progress: 80,
          stepText: '4/5 Sẵn sàng',
        };
      case 'partially_delivered':
        return {
          label: 'Giao Một Phần',
          bgColor: 'bg-orange-100 text-orange-900 border-orange-300',
          dotColor: 'bg-orange-600',
          progress: 85,
          stepText: 'Giao 1 phần',
        };
      case 'shipped':
      case 'dispatched':
        return {
          label: 'Đã Xuất Kho',
          bgColor: 'bg-orange-100 text-orange-800 border-orange-300',
          dotColor: 'bg-orange-600',
          progress: 90,
          stepText: '5/5 Đã xuất',
        };
      case 'delivered':
        return {
          label: 'Đã Giao Đủ',
          bgColor: 'bg-teal-100 text-teal-800 border-teal-300',
          dotColor: 'bg-teal-600',
          progress: 100,
          stepText: 'Hoàn tất giao',
        };
      case 'released':
      case 'cancelled':
        return {
          label: 'Đã Giải Phóng',
          bgColor: 'bg-rose-100 text-rose-800 border-rose-300',
          dotColor: 'bg-rose-600',
          progress: 0,
          stepText: 'Đã hủy giữ',
        };
      default:
        return {
          label: status,
          bgColor: 'bg-slate-100 text-slate-800 border-slate-300',
          dotColor: 'bg-slate-500',
          progress: 20,
          stepText: status,
        };
    }
  };

  const salesRepList = Array.from(
    new Set(reserveItems.map((r) => getAssignedSalesRepName(r)).filter(Boolean))
  );

  // Work Queue count vs History count
  const workQueueItems = reserveItems.filter(isReserveInWorkQueue);
  const historyItems = reserveItems.filter(isReserveCompleted);

  const baseItems = viewMode === 'work_queue' ? workQueueItems : historyItems;

  const filteredReserves = baseItems.filter((r) => {
    const resolvedSales = getAssignedSalesRepName(r);
    const resolvedCustomer = getCustomerDisplayName(r);
    const cust = customerMap.get(r.customerId);

    const matchSearch =
      r.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolvedCustomer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolvedSales.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust?.company && cust.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.warehouseLocation && r.warehouseLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.completedByName && r.completedByName.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchStatus = true;
    if (viewMode === 'work_queue') {
      if (statusFilter === 'all_active') {
        matchStatus = isReserveInWorkQueue(r);
      } else if (statusFilter !== 'all') {
        matchStatus = r.status === statusFilter;
      }
    } else {
      if (statusFilter === 'delivered') {
        matchStatus = r.status === 'delivered' || isReserveCompleted(r);
      } else if (statusFilter === 'released') {
        matchStatus = r.status === 'released' || r.status === 'cancelled';
      }
    }

    const matchSales = selectedSalesRep === 'all' || resolvedSales === selectedSalesRep;

    return matchSearch && matchStatus && matchSales;
  });

  const activeHoldingCount = workQueueItems.length;
  const totalHoldingUnits = workQueueItems.reduce((sum, r) => sum + r.reservedQuantity, 0);

  const handleExportExcel = () => {
    const data = filteredReserves.map((r, idx) => {
      const cust = customerMap.get(r.customerId);
      const ctr = contractMap.get(r.contractId);
      const resolvedSales = getAssignedSalesRepName(r);
      const resolvedCustomer = getCustomerDisplayName(r);
      const meta = getStatusMeta(r.status);

      return {
        'STT': idx + 1,
        'Mã SKU': r.sku,
        'Tên Sản Phẩm': r.productName,
        'Số Lượng Giữ': r.reservedQuantity,
        'ĐVT': r.unit,
        'Trạng Thái Kho': meta.label,
        'Tiến Trình (%)': `${meta.progress}%`,
        'Sales Phụ Trách': resolvedSales,
        'Khách Hàng': resolvedCustomer,
        'Công Ty / Dự Án': cust?.company || '',
        'Số Điện Thoại': cust?.phone || '',
        'Địa Chỉ Giao': ctr?.deliveryAddress || cust?.address || '',
        'Số Hợp Đồng': r.contractNumber,
        'Số Báo Giá': r.quoteNumber,
        'Vị Trí Kho': r.warehouseLocation || '',
        'Ngày Giữ': r.reservedDate,
        'Hạn Giao Dự Kiến': r.expectedDeliveryDate,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GiuHang_SalesFlow');
    XLSX.writeFile(workbook, `Bang_Giu_Hang_Kho_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleReleasePrompt = (reserve: ReserveItem) => {
    const reason = window.prompt(`Nhập lý do hủy giữ hàng / giải phóng tồn kho cho mã ${reserve.sku}:`, 'Khách hàng thay đổi kế hoạch / Hủy hợp đồng');
    if (reason !== null && reason.trim()) {
      releaseReservation(reserve.id, reason.trim());
    }
  };

  return (
    <div className="space-y-3">
      {/* Work Queue vs History Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setViewMode('work_queue');
              setStatusFilter('all_active');
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              viewMode === 'work_queue'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Can Xu Ly Xuat Kho (Work Queue)</span>
            <span className={`px-2 py-0.2 text-[10px] rounded-full font-bold ${
              viewMode === 'work_queue' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900'
            }`}>
              {workQueueItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('history');
              setStatusFilter('delivered');
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              viewMode === 'history'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lich Su Da Giao Du (History)</span>
            <span className={`px-2 py-0.2 text-[10px] rounded-full font-bold ${
              viewMode === 'history' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {historyItems.length}
            </span>
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline">
          {viewMode === 'work_queue'
            ? 'Danh sach cac ma giu dang can xuat kho hoac giao mot phan'
            : 'Luu tru toan bo cac ma giu da giao khach du 100%'}
        </span>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo SKU, sản phẩm, khách, HĐ, Sales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden bg-slate-50/50 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden font-medium text-slate-700 cursor-pointer"
          >
            {viewMode === 'work_queue' ? (
              <>
                <option value="all_active">Tat ca dang xu ly ({activeHoldingCount} ma)</option>
                <option value="active">1. Da Giu Hang</option>
                <option value="allocated">2. Da Phan Bo</option>
                <option value="picking">3. Dang Chuan Bi</option>
                <option value="ready_to_ship">4. San Sang Xuat</option>
                <option value="partially_delivered">5. Giao Mot Phan</option>
                <option value="all">Tat ca trang thai</option>
              </>
            ) : (
              <>
                <option value="delivered">Da Giao Du 100% ({historyItems.filter((r) => r.status === 'delivered').length})</option>
                <option value="released">Da Giai Phong / Huy</option>
                <option value="all">Tat ca lich su ({historyItems.length})</option>
              </>
            )}
          </select>

          <select
            value={selectedSalesRep}
            onChange={(e) => setSelectedSalesRep(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden font-medium text-slate-700"
          >
            <option value="all">Tất cả Sales ({salesRepList.length})</option>
            {salesRepList.map((sales) => (
              <option key={sales} value={sales}>
                Sale: {sales}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            <span>Xuất Excel ({filteredReserves.length})</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-3 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-amber-950">
            <Layers className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Quản lý tiến trình giữ hàng:</strong> Đang khóa <strong>{totalHoldingUnits.toLocaleString()}</strong> sản phẩm cho các hợp đồng của Sales. Kho cập nhật tiến trình phân bổ & xuất giao.
            </span>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            {filteredReserves.length} mục hiển thị
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3.5 py-3">Mã Hàng</th>
                <th className="px-3.5 py-3">Tên Hàng</th>
                <th className="px-3.5 py-3">Hãng</th>
                <th className="px-3.5 py-3 text-right bg-slate-50 border-x">Số Lượng Tồn Kho</th>
                <th className="px-3.5 py-3 text-center bg-amber-50/80 text-amber-950 border-x border-amber-200">
                  Số Lượng Giữ
                </th>
                <th className="px-3.5 py-3 text-right bg-emerald-50/40 text-emerald-950 border-x border-emerald-100">
                  Số Lượng Khả Dụng
                </th>
                <th className="px-3.5 py-3">Hạn Giao Hàng</th>
                <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                <th className="px-3.5 py-3 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReserves.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Không có dữ liệu giữ hàng nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredReserves.map((reserve) => {
                  const cust = customerMap.get(reserve.customerId);
                  const inv = inventoryMap.get(reserve.sku.toUpperCase());
                  const prod = productMap.get(reserve.sku.toUpperCase());
                  const brand = prod?.brand || 'Khác';
                  const totalOnHand = inv?.totalQuantity || 0;
                  const availableStock = inv?.availableQuantity !== undefined ? inv.availableQuantity : Math.max(0, totalOnHand - reserve.reservedQuantity);
                  const meta = getStatusMeta(reserve.status);
                  const isHolding = isHoldingStatus(reserve.status);

                  return (
                    <tr
                      key={reserve.id}
                      className="hover:bg-amber-50/20 transition-colors cursor-pointer"
                      onClick={() => setDetailItem(reserve)}
                    >
                      <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">
                        {reserve.sku}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900 line-clamp-1" title={reserve.productName}>
                        {reserve.productName}
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-700">
                        {brand}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-800 bg-slate-50/50 border-x">
                        {totalOnHand.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{reserve.unit}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center bg-amber-50/40 border-x border-amber-100">
                        <span className="font-mono font-black text-sm text-amber-950 block">
                          {reserve.reservedQuantity}
                        </span>
                        <span className="text-[10px] text-amber-800 font-semibold">{reserve.unit}</span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-800 bg-emerald-50/20 border-x border-emerald-100">
                        {availableStock.toLocaleString()} <span className="text-[10px] font-normal text-emerald-600">{reserve.unit}</span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-slate-800 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{reserve.expectedDeliveryDate ? formatDate(reserve.expectedDeliveryDate) : 'Chưa định'}</span>
                        </div>
                        <div className="text-[10px] text-blue-600 font-semibold mt-0.5 flex items-center space-x-1">
                          <span>HĐ: {reserve.contractNumber}</span>
                          <span>•</span>
                          <span className="text-slate-500 truncate max-w-[120px]">{getCustomerDisplayName(reserve)}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 ${meta.bgColor}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
                          <span>{meta.label}</span>
                        </span>
                      </td>
                      <td
                        className="px-3.5 py-2.5 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          {(reserve.status === 'active' || reserve.status === 'holding') && (
                            <button
                              type="button"
                              onClick={() => updateReserveWarehouseStatus(reserve.id, 'allocated')}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-md text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                              title="Kho xác nhận phân bổ hàng"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Phân Bổ</span>
                            </button>
                          )}
                          {reserve.status === 'allocated' && (
                            <button
                              type="button"
                              onClick={() => updateReserveWarehouseStatus(reserve.id, 'picking')}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-md text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                              title="Kho tiến hành lấy hàng và đóng gói"
                            >
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Gom Hàng</span>
                            </button>
                          )}
                          {reserve.status === 'picking' && (
                            <button
                              type="button"
                              onClick={() => updateReserveWarehouseStatus(reserve.id, 'ready_to_ship')}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-md text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                              title="Hàng đã sẵn sàng tại cửa xuất"
                            >
                              <PackageCheck className="w-3 h-3 text-purple-600" />
                              <span>Sẵn Sàng</span>
                            </button>
                          )}
                          {isHolding && (
                            <button
                              type="button"
                              onClick={() => onOpenDispatchModal(reserve)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                              title="Xuất kho giao cho khách hàng"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Xuất Kho</span>
                            </button>
                          )}
                          {(reserve.status === 'shipped' || reserve.status === 'dispatched') && (
                            <button
                              type="button"
                              onClick={() => {
                                const receiver = window.prompt(
                                  `Xác nhận khách hàng đã nhận đủ ${reserve.reservedQuantity} ${reserve.unit} cho HĐ ${reserve.contractNumber}. Tên người nhận:`,
                                  cust?.name || reserve.customerName
                                );
                                if (receiver !== null && receiver.trim()) {
                                  confirmDeliveryToCustomer(reserve.id, {
                                    receiverName: receiver.trim(),
                                    receiverPhone: cust?.phone || '',
                                    deliveryDate: new Date().toISOString().split('T')[0],
                                    notes: 'Đã bàn giao nghiệm thu thành công',
                                  });
                                }
                              }}
                              className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                              title="Xác nhận khách đã nhận hàng thành công"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Đã Giao</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDetailItem(reserve)}
                            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                            title="Xem chi tiết tiến trình và thông số kho"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isHolding && (
                            <button
                              type="button"
                              onClick={() => handleReleasePrompt(reserve)}
                              className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                              title="Hủy giữ hàng / Giải phóng tồn kho"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {detailItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Chi Tiết Tiến Trình Giữ Hàng</h3>
                  <div className="text-[11px] text-slate-300 font-mono">Mã SKU: {detailItem.sku}</div>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{detailItem.productName}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Giữ: {detailItem.reservedQuantity} {detailItem.unit}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div>Khách hàng: <strong>{getCustomerDisplayName(detailItem)}</strong></div>
                  <div>Hợp đồng: <strong>{detailItem.contractNumber}</strong></div>
                  <div>Sales phụ trách: <strong>{getAssignedSalesRepName(detailItem)}</strong></div>
                  <div>Hạn giao: <strong>{formatDate(detailItem.expectedDeliveryDate)}</strong></div>
                </div>
              </div>
              {(() => {
                const inv = inventoryMap.get(detailItem.sku.toUpperCase());
                return (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-blue-950 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Warehouse className="w-3.5 h-3.5 text-blue-700" />
                        <span>Thông Số Tồn Kho Thực Tế (Read-Only)</span>
                      </span>
                      <span className="text-[10px] text-blue-700 font-normal">Nguồn: Inventory Engine</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <div className="text-[10px] text-slate-500 font-semibold">Tồn Thực Tế</div>
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {inv?.totalQuantity ?? '—'} {detailItem.unit}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <div className="text-[10px] text-slate-500 font-semibold">Tổng Đang Giữ</div>
                        <div className="font-mono font-bold text-amber-700 text-sm">
                          {inv?.reservedQuantity ?? '—'} {detailItem.unit}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <div className="text-[10px] text-slate-500 font-semibold">Tồn Khả Dụng</div>
                        <div className="font-mono font-bold text-emerald-700 text-sm">
                          {inv?.availableQuantity ?? '—'} {detailItem.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-800">Tiến Trình Thực Thi Vật Lý:</div>
                <div className="space-y-2">
                  {[
                    { key: 'active', label: '1. Sales Tạo Giữ Hàng', desc: 'Đã khóa tồn khả dụng cho hợp đồng' },
                    { key: 'allocated', label: '2. Kho Đã Phân Bổ', desc: 'Xác nhận sẵn hàng và gán vị trí xuất' },
                    { key: 'picking', label: '3. Kho Đang Gom Hàng', desc: 'Đóng gói bao bì và dán nhãn' },
                    { key: 'ready_to_ship', label: '4. Sẵn Sàng Xuất Kho', desc: 'Đặt tại cửa xuất chờ phương tiện' },
                    { key: 'shipped', label: '5. Đã Xuất Kho', desc: 'Rời kho, trừ tồn kho thực tế' },
                    { key: 'delivered', label: '6. Đã Giao Khách', desc: 'Nghiệm thu hoàn tất' },
                  ].map((step, idx) => {
                    const currentMeta = getStatusMeta(detailItem.status);
                    const stepProgress = (idx + 1) * 16.6;
                    const isPassed = currentMeta.progress >= stepProgress || detailItem.status === step.key;
                    return (
                      <div key={step.key} className="flex items-start space-x-2.5 text-xs">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            isPassed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <div>
                          <div className={`font-bold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.label}
                          </div>
                          <div className="text-[11px] text-slate-500">{step.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <EditReserveItemModal
        isOpen={!!editingReserveItem}
        item={editingReserveItem}
        customer={customers.find((c) => c.id === editingReserveItem?.customerId)}
        contract={contracts.find((c) => c.id === editingReserveItem?.contractId)}
        onClose={() => setEditingReserveItem(null)}
        onSave={(updated) => updateReserveItem(updated)}
      />
    </div>
  );
};
