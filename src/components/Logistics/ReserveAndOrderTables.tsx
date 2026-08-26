import React, { useState } from 'react';
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
  Filter,
  Download,
  AlertTriangle,
  Building,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ReserveAndOrderTables: React.FC = () => {
  const {
    filteredReserveItems,
    filteredOrderItems,
    updateReserveStatus,
    updateOrderStatus,
    currentUser,
    filteredContracts,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'reserve' | 'order'>('reserve');
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState<string>('all');

  // Filter reserve items
  const filteredReserves = filteredReserveItems.filter((r) => {
    const matchSearch =
      r.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchContract = contractFilter === 'all' || r.contractId === contractFilter;
    return matchSearch && matchContract;
  });

  // Filter order items
  const filteredOrders = filteredOrderItems.filter((o) => {
    const matchSearch =
      o.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchContract = contractFilter === 'all' || o.contractId === contractFilter;
    return matchSearch && matchContract;
  });

  // Export Excel Reserve
  const handleExportReserveExcel = () => {
    const data = filteredReserves.map((r, idx) => ({
      'STT': idx + 1,
      'Số HĐ': r.contractNumber,
      'Số Báo Giá': r.quoteNumber,
      'Khách Hàng': r.customerName,
      'Sales Phụ Trách': r.salesRepName,
      'Mã Hàng (SKU)': r.sku,
      'Tên Sản Phẩm': r.productName,
      'Số Lượng Giữ': r.reservedQuantity,
      'ĐVT': r.unit,
      'Vị Trí Kho': r.warehouseLocation,
      'Ngày Giữ': r.reservedDate,
      'Ngày Giao Dự Kiến': r.expectedDeliveryDate,
      'Trạng Thái': r.status === 'holding' ? 'Đang giữ hàng' : r.status === 'dispatched' ? 'Đã xuất kho' : 'Đã hủy',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bang_Giu_Hang');
    XLSX.writeFile(workbook, `Bang_Giu_Hang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export Excel Orders
  const handleExportOrderExcel = () => {
    const data = filteredOrders.map((o, idx) => ({
      'STT': idx + 1,
      'Số HĐ': o.contractNumber,
      'Số Báo Giá': o.quoteNumber,
      'Khách Hàng': o.customerName,
      'Sales Phụ Trách': o.salesRepName,
      'Mã Hàng (SKU)': o.sku,
      'Tên Sản Phẩm': o.productName,
      'Hãng': o.brand,
      'Quy Cách / Kích Thước': o.size,
      'Màu Sắc': o.color,
      'Số Lượng Cần Đặt': o.orderQuantity,
      'ĐVT': o.unit,
      'Ngày Tạo Đơn': o.orderDate,
      'Dự Kiến Hàng Về (ETA)': o.supplierETA || '',
      'Ghi Chú PO': o.notes || '',
      'Trạng Thái':
        o.status === 'pending_order'
          ? 'Chờ đặt hàng'
          : o.status === 'ordered'
          ? 'Đã đặt hàng'
          : o.status === 'arrived_in_stock'
          ? 'Đã về kho'
          : 'Đã hủy',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bang_Dat_Hang');
    XLSX.writeFile(workbook, `Bang_Dat_Hang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Phân Tách Kho Tự Động: Bảng Giữ Hàng & Bảng Đặt Hàng</span>
          </h1>
          <p className="text-xs text-slate-500">
            Khi 1 báo giá chốt ký HĐ: Sản phẩm có sẵn tồn kho được đưa vào <strong>Bảng Giữ Hàng</strong>; sản phẩm thiếu/hết tồn đưa vào <strong>Bảng Đặt Hàng</strong>.
          </p>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Tab switch */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-md w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('reserve')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'reserve'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>1. Bảng Giữ Hàng (Còn Tồn Kho)</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${activeSubTab === 'reserve' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {filteredReserveItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('order')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'order'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>2. Bảng Đặt Hàng (Thiếu/Hết Hàng)</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${activeSubTab === 'order' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {filteredOrderItems.length}
            </span>
          </button>
        </div>

        {/* Search & Export Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo SKU, tên, KH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-hidden bg-slate-50/50"
            />
          </div>

          <select
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-hidden"
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
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-bold flex items-center space-x-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel Giữ Kho</span>
            </button>
          ) : (
            <button
              onClick={handleExportOrderExcel}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-md text-xs font-bold flex items-center space-x-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel Đặt Hàng PO</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE 1: BẢNG GIỮ HÀNG */}
      {activeSubTab === 'reserve' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-900">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <h3 className="font-bold text-xs">BẢNG GIỮ HÀNG TẠI KHO (RESERVED INVENTORY)</h3>
                <p className="text-[10px] text-emerald-700">
                  Tồn kho thực tế đã bị khóa cho các hợp đồng đã ký. Thủ kho chỉ xuất đúng số lượng cho đơn này.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              {filteredReserves.length} mã đang giữ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3 py-2.5">Mã Hàng (SKU)</th>
                  <th className="px-3 py-2.5">Tên Sản Phẩm</th>
                  <th className="px-3 py-2.5 text-center">SL Giữ</th>
                  <th className="px-3 py-2.5">Hợp Đồng & Khách Hàng</th>
                  <th className="px-3 py-2.5">Vị Trí Kho</th>
                  <th className="px-3 py-2.5">Ngày Giữ & Giao Hàng</th>
                  <th className="px-3 py-2.5">Sales Phụ Trách</th>
                  <th className="px-3 py-2.5 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReserves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Chưa có mã hàng nào trong danh sách Giữ hàng
                    </td>
                  </tr>
                ) : (
                  filteredReserves.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-mono font-bold text-emerald-700">{r.sku}</td>
                      <td className="px-3 py-2 font-bold text-slate-900">{r.productName}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                          {r.reservedQuantity} {r.unit}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-blue-700">{r.contractNumber}</div>
                        <div className="text-[10px] text-slate-500">{r.customerName}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-600 font-medium">{r.warehouseLocation}</td>
                      <td className="px-3 py-2 text-slate-600">
                        <div>Ngày giữ: {formatDate(r.reservedDate)}</div>
                        <div className="text-[10px] text-slate-400">Giao: {formatDate(r.expectedDeliveryDate)}</div>
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800">{r.salesRepName}</td>
                      <td className="px-3 py-2 text-center">
                        <select
                          value={r.status}
                          onChange={(e) => updateReserveStatus(r.id, e.target.value as any)}
                          className="px-2 py-0.5 text-[10px] font-bold border border-slate-300 rounded bg-white"
                        >
                          <option value="holding">Đang Giữ Hàng</option>
                          <option value="dispatched">Đã Xuất Kho</option>
                          <option value="cancelled">Đã Hủy</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLE 2: BẢNG ĐẶT HÀNG */}
      {activeSubTab === 'order' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-900">
              <ShoppingCart className="w-4 h-4 text-amber-600" />
              <div>
                <h3 className="font-bold text-xs">BẢNG ĐẶT HÀNG NHÀ CUNG CẤP (PURCHASE BACKORDERS)</h3>
                <p className="text-[10px] text-amber-700">
                  Mã sản phẩm thiếu hoặc hết hàng khi chốt hợp đồng. Chuyển thông tin cho phòng Mua hàng / Cung ứng.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {filteredOrders.length} mã cần đặt mua
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3 py-2.5">Mã Hàng (SKU)</th>
                  <th className="px-3 py-2.5">Tên & Thông Số Hàng Hóa</th>
                  <th className="px-3 py-2.5">Hãng / NCC</th>
                  <th className="px-3 py-2.5 text-center">SL Cần Đặt</th>
                  <th className="px-3 py-2.5">Hợp Đồng & Khách Hàng</th>
                  <th className="px-3 py-2.5">Dự Kiến Hàng Về (ETA)</th>
                  <th className="px-3 py-2.5">Ghi Chú PO</th>
                  <th className="px-3 py-2.5 text-center">Trạng Thái Đặt Hàng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Không có mã hàng nào cần đặt thêm. Toàn bộ đơn hàng đã có đủ tồn kho!
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-mono font-bold text-amber-700">{o.sku}</td>
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900">{o.productName}</div>
                        <div className="text-[10px] text-slate-500">
                          {o.color} • {o.size}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-700">{o.brand}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="font-bold text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-mono">
                          {o.orderQuantity} {o.unit}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-blue-700">{o.contractNumber}</div>
                        <div className="text-[10px] text-slate-500">{o.customerName}</div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={o.supplierETA || ''}
                          onChange={(e) => updateOrderStatus(o.id, o.status, e.target.value)}
                          className="px-1.5 py-0.5 border border-slate-300 rounded text-[11px]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="Ghi chú đơn hàng..."
                          value={o.notes || ''}
                          onChange={(e) => updateOrderStatus(o.id, o.status, e.target.value)}
                          className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-[11px]"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <select
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                          className="px-2 py-0.5 text-[10px] font-bold border border-slate-300 rounded bg-white"
                        >
                          <option value="pending_order">Chờ Đặt Hàng</option>
                          <option value="ordered">Đã Gửi PO</option>
                          <option value="arrived_in_stock">Đã Về Kho</option>
                          <option value="cancelled">Đã Hủy</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
