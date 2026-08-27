import React, { useState } from 'react';
import { ReserveItem, Customer, Contract } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { EditReserveItemModal } from './EditReserveItemModal';
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
  const { updateReserveItem, updateReserveStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'holding' | 'dispatched' | 'cancelled'>('holding');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('all');
  const [editingReserveItem, setEditingReserveItem] = useState<ReserveItem | null>(null);

  // Customer & contract lookup maps
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const contractMap = new Map<string, Contract>();
  contracts.forEach((c) => contractMap.set(c.id, c));

  // Extract distinct sales reps
  const salesRepList = Array.from(new Set(reserveItems.map((r) => r.salesRepName).filter(Boolean)));

  // Filtered items
  const filteredReserves = reserveItems.filter((r) => {
    const matchSearch =
      r.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.salesRepName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.warehouseLocation && r.warehouseLocation.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchSales = selectedSalesRep === 'all' || r.salesRepName === selectedSalesRep;

    return matchSearch && matchStatus && matchSales;
  });

  const holdingCount = reserveItems.filter((r) => r.status === 'holding').length;
  const totalHoldingUnits = reserveItems
    .filter((r) => r.status === 'holding')
    .reduce((sum, r) => sum + r.reservedQuantity, 0);

  // Export Excel for Held Items
  const handleExportExcel = () => {
    const exportData = filteredReserves.map((r, idx) => {
      const cust = customerMap.get(r.customerId);
      const ctr = contractMap.get(r.contractId);
      return {
        'STT': idx + 1,
        'Mã Hàng (SKU)': r.sku,
        'Tên Sản Phẩm': r.productName,
        'Số Lượng Giữ': r.reservedQuantity,
        'ĐVT': r.unit,
        'Sales Phụ Trách': r.salesRepName,
        'Khách Hàng': r.customerName,
        'Công Ty Khách': cust?.company || '',
        'SĐT Khách': cust?.phone || '',
        'Địa Chỉ Giao Hàng': ctr?.deliveryAddress || cust?.address || '',
        'Số Hợp Đồng': r.contractNumber,
        'Số Báo Giá': r.quoteNumber,
        'Vị Trí Kho / Kệ': r.warehouseLocation,
        'Ngày Bắt Đầu Giữ': r.reservedDate,
        'Hạn Giao Hàng Dự Kiến': r.expectedDeliveryDate,
        'Trạng Thái':
          r.status === 'holding'
            ? 'Đang giữ hàng'
            : r.status === 'dispatched'
            ? 'Đã xuất giao'
            : 'Đã hủy',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ChiTiet_GiuHang_KHO');
    XLSX.writeFile(workbook, `Bang_Chi_Tiet_Giu_Hang_KHO_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {/* Search & Filter Header */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo SKU, tên sản phẩm, Sale, khách hàng, số HĐ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden font-medium text-slate-700"
          >
            <option value="holding">Đang giữ kho ({holdingCount} mã)</option>
            <option value="dispatched">Đã xuất kho</option>
            <option value="cancelled">Đã hủy giữ</option>
            <option value="all">Tất cả trạng thái ({reserveItems.length})</option>
          </select>

          {/* Sales rep filter */}
          <select
            value={selectedSalesRep}
            onChange={(e) => setSelectedSalesRep(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden font-medium text-slate-700"
          >
            <option value="all">Tất cả Sales phụ trách ({salesRepList.length})</option>
            {salesRepList.map((sales) => (
              <option key={sales} value={sales}>
                Sale: {sales}
              </option>
            ))}
          </select>

          {/* Export button */}
          <button
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            <span>Xuất Excel Giữ Hàng ({filteredReserves.length})</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Banner Info */}
        <div className="p-3 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-amber-950">
            <Layers className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Danh sách hàng đang giữ:</strong> Tổng cộng <strong>{totalHoldingUnits.toLocaleString()}</strong> sản phẩm đang khóa cho các đơn hàng đã ký hợp đồng.
            </span>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            {filteredReserves.length} dòng dữ liệu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3.5 py-3">Mã SKU & Sản Phẩm</th>
                <th className="px-3 py-3 text-center bg-amber-50/80 text-amber-950 border-x border-amber-200">
                  SL Đang Giữ
                </th>
                <th className="px-3.5 py-3">Sales Phụ Trách</th>
                <th className="px-3.5 py-3">Khách Hàng & Công Trình</th>
                <th className="px-3.5 py-3">Số Hợp Đồng & Báo Giá</th>
                <th className="px-3.5 py-3">Hạn Giao Hàng</th>
                <th className="px-3.5 py-3">Vị Trí Kệ Kho</th>
                <th className="px-3.5 py-3 text-center">Trạng Thái & Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReserves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Layers className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">Không có dữ liệu giữ hàng nào phù hợp</p>
                      <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReserves.map((reserve) => {
                  const cust = customerMap.get(reserve.customerId);
                  const ctr = contractMap.get(reserve.contractId);
                  const isHolding = reserve.status === 'holding';

                  return (
                    <tr key={reserve.id} className="hover:bg-amber-50/20 transition-colors">
                      {/* SKU & Product */}
                      <td className="px-3.5 py-2.5">
                        <div className="font-mono font-bold text-blue-700">{reserve.sku}</div>
                        <div className="font-bold text-slate-900 line-clamp-1" title={reserve.productName}>
                          {reserve.productName}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-2.5 text-center bg-amber-50/40 border-x border-amber-100">
                        <span className="font-mono font-black text-sm text-amber-950 block">
                          {reserve.reservedQuantity}
                        </span>
                        <span className="text-[10px] text-amber-800 font-semibold">{reserve.unit}</span>
                      </td>

                      {/* Sales Rep */}
                      <td className="px-3.5 py-2.5">
                        <div className="font-bold text-slate-900 flex items-center space-x-1">
                          <User className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{reserve.salesRepName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Phụ trách giữ hàng</div>
                      </td>

                      {/* Customer & Company */}
                      <td className="px-3.5 py-2.5">
                        <div className="font-bold text-slate-900 flex items-center space-x-1">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{reserve.customerName}</span>
                        </div>
                        {cust?.company && (
                          <div className="text-[11px] text-slate-600 truncate max-w-xs" title={cust.company}>
                            {cust.company}
                          </div>
                        )}
                        {(ctr?.deliveryAddress || cust?.address) && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs flex items-center space-x-0.5 mt-0.5" title={ctr?.deliveryAddress || cust?.address}>
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{ctr?.deliveryAddress || cust?.address}</span>
                          </div>
                        )}
                      </td>

                      {/* Contract & Quote */}
                      <td className="px-3.5 py-2.5">
                        <button
                          type="button"
                          onClick={() => onOpenContractPdf(reserve.contractId)}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 cursor-pointer"
                          title="Bấm để xem hợp đồng PDF"
                        >
                          <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{reserve.contractNumber}</span>
                        </button>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Báo giá: {reserve.quoteNumber}
                        </div>
                      </td>

                      {/* Delivery Date */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{reserve.expectedDeliveryDate ? formatDate(reserve.expectedDeliveryDate) : 'Chưa định'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Giữ từ: {formatDate(reserve.reservedDate)}
                        </div>
                      </td>

                      {/* Rack location */}
                      <td className="px-3.5 py-2.5 font-medium text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-800 border border-slate-200 inline-block">
                          {reserve.warehouseLocation || 'Kho Tổng TP.HCM (Kệ A1)'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isHolding && (
                            <>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                                <span>Đang Giữ</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => onOpenDispatchModal(reserve)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                                title="Xuất kho giao cho khách hàng theo hợp đồng"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Xuất Kho</span>
                              </button>
                            </>
                          )}

                          {reserve.status === 'dispatched' && (
                            <>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Đã Xuất Kho</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Khôi phục trạng thái ĐANG GIỮ cho ${reserve.productName}? Hệ thống sẽ tự động hoàn trả lại +${reserve.reservedQuantity} ${reserve.unit} vào tồn kho thực tế.`
                                    )
                                  ) {
                                    updateReserveStatus(reserve.id, 'holding');
                                  }
                                }}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                                title="Khôi phục lại trạng thái Đang Giữ (nếu ấn nhầm Xuất Kho)"
                              >
                                <RotateCcw className="w-3 h-3 text-amber-700" />
                                <span>Hoàn Tác</span>
                              </button>
                            </>
                          )}

                          {reserve.status === 'cancelled' && (
                            <>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center space-x-1">
                                <XCircle className="w-2.5 h-2.5 text-rose-600" />
                                <span>Đã Hủy Giữ</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => updateReserveStatus(reserve.id, 'holding')}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                                title="Khôi phục lại trạng thái giữ kho"
                              >
                                <RotateCcw className="w-3 h-3 text-blue-600" />
                                <span>Khôi Phục</span>
                              </button>
                            </>
                          )}

                          {/* Quick Edit button to adjust info / status if wrong clicked */}
                          <button
                            type="button"
                            onClick={() => setEditingReserveItem(reserve)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Sửa trạng thái / số lượng / vị trí kho khi ấn nhầm"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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

      {/* Edit Reserve Item Modal */}
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
