import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Plus,
  PackageCheck,
  Check,
  X,
  FileText,
  Calendar,
  Building,
  Boxes,
  Download,
  Share2,
} from 'lucide-react';
import { StockOutVoucher } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import { CreateStockOutVoucherModal } from './CreateStockOutVoucherModal';
import * as XLSX from 'xlsx';

interface StockOutWarehouseViewProps {
  initialSku?: string;
}

export const StockOutWarehouseView: React.FC<StockOutWarehouseViewProps> = ({ initialSku }) => {
  const {
    stockOutVouchers,
    confirmStockOutVoucher,
    cancelStockOutVoucher,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'CONFIRMED' | 'CANCELLED'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = useState<StockOutVoucher | null>(null);

  const canManage = currentUser.role === 'manager_c1' || currentUser.role === 'super_admin' || currentUser.role === 'sales_c2';

  // Filter Vouchers
  const filteredVouchers = useMemo(() => {
    return stockOutVouchers.filter((v) => {
      const sTerm = searchTerm.toLowerCase().trim();
      const matchSearch =
        !sTerm ||
        v.voucherNumber.toLowerCase().includes(sTerm) ||
        (v.customerName || '').toLowerCase().includes(sTerm) ||
        (v.contractNumber || '').toLowerCase().includes(sTerm) ||
        (v.warehouseLocation || '').toLowerCase().includes(sTerm) ||
        (v.items || []).some(
          (it) =>
            it.sku.toLowerCase().includes(sTerm) ||
            it.productName.toLowerCase().includes(sTerm)
        );

      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [stockOutVouchers, searchTerm, statusFilter]);

  // KPI calculations
  const totalConfirmedCount = stockOutVouchers.filter((v) => v.status === 'CONFIRMED').length;
  const totalDraftCount = stockOutVouchers.filter((v) => v.status === 'DRAFT').length;
  const totalDispatchedQuantity = stockOutVouchers
    .filter((v) => v.status === 'CONFIRMED')
    .reduce((sum, v) => sum + (v.totalQuantity || 0), 0);

  const handleExportExcel = () => {
    const data = filteredVouchers.map((v, idx) => ({
      'STT': idx + 1,
      'Số Phiếu Xuất': v.voucherNumber,
      'Ngày Xuất': formatDate(v.date),
      'Khách Hàng': v.customerName || '---',
      'Số Hợp Đồng': v.contractNumber || '---',
      'Kho Xuất': v.warehouseLocation,
      'Số Mặt Hàng': (v.items || []).length,
      'Tổng SL Xuất': v.totalQuantity,
      'Trạng Thái': v.status === 'CONFIRMED' ? 'Đã Xuất Kho' : v.status === 'DRAFT' ? 'Phiếu Nháp' : 'Đã Hủy',
      'Người Tạo': v.createdByName,
      'Ghi Chú': v.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Phieu_Xuat_Kho');
    XLSX.writeFile(wb, `Danh_Sach_Phieu_Xuat_Kho_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportDetailExcel = (voucher: StockOutVoucher) => {
    const data = (voucher.items || []).map((it, idx) => ({
      'STT': idx + 1,
      'Số Phiếu': voucher.voucherNumber,
      'Khách Hàng': voucher.customerName || '---',
      'Hợp Đồng': voucher.contractNumber || '---',
      'Mã SKU': it.sku,
      'Tên Sản Phẩm': it.productName,
      'Hãng': it.brand || '---',
      'ĐVT': it.unit,
      'Số Lượng Xuất': it.quantity,
      'Nguồn': it.sourceType === 'RESERVE' ? 'Giữ Hàng' : it.sourceType === 'ORDER' ? 'Đặt Hàng' : 'Kết Hợp',
      'Ghi Chú': it.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chi_Tiet_Xuat');
    XLSX.writeFile(wb, `Chi_Tiet_Xuat_${voucher.voucherNumber}_${voucher.date}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <PackageCheck className="w-5 h-5 text-rose-600" />
            <span>Quản Lý Phiếu Xuất Kho (Stock Out Vouchers)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu xuất giao hàng theo Hợp đồng và đơn giữ/đặt, tự động trừ tồn kho On Hand chính xác.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>

          {canManage && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Phiếu Xuất Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tổng Phiếu Xuất Kho</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">{stockOutVouchers.length}</span>
              <span className="text-xs text-slate-500 font-semibold">phiếu</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Đã Hoàn Tất Xuất Kho</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-emerald-800 font-mono">{totalConfirmedCount}</span>
              <span className="text-xs text-emerald-600 font-semibold">phiếu thành công</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">Tổng Hàng Đã Giao</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-rose-800 font-mono">{totalDispatchedQuantity.toLocaleString()}</span>
              <span className="text-xs text-rose-600 font-semibold">sản phẩm xuất</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo số phiếu, khách hàng, số HĐ, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-rose-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white cursor-pointer font-medium text-slate-700"
          >
            <option value="all">Tất cả trạng thái ({stockOutVouchers.length})</option>
            <option value="DRAFT">Phiếu nháp ({totalDraftCount})</option>
            <option value="CONFIRMED">Đã xuất kho ({totalConfirmedCount})</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3">Số Phiếu Xuất</th>
                <th className="p-3">Ngày Xuất</th>
                <th className="p-3">Khách Hàng & Hợp Đồng</th>
                <th className="p-3">Kho Xuất</th>
                <th className="p-3 text-center">Số Mặt Hàng</th>
                <th className="p-3 text-right font-bold text-rose-900">Tổng SL Xuất</th>
                <th className="p-3 text-center">Trạng Thái</th>
                <th className="p-3">Người Tạo</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <PackageCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span>Không tìm thấy phiếu xuất kho nào phù hợp.</span>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher, idx) => {
                  const isConfirmed = voucher.status === 'CONFIRMED';
                  const isDraft = voucher.status === 'DRAFT';

                  return (
                    <tr key={voucher.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold font-mono text-rose-700">
                        {voucher.voucherNumber}
                      </td>
                      <td className="p-3 text-slate-700 font-mono">{formatDate(voucher.date)}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{voucher.customerName || '---'}</div>
                        {voucher.contractNumber && (
                          <div className="text-[11px] text-blue-600 font-mono font-semibold">
                            HĐ: {voucher.contractNumber}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{voucher.warehouseLocation || 'Kho Tổng'}</td>
                      <td className="p-3 text-center font-mono font-bold">{(voucher.items || []).length}</td>
                      <td className="p-3 text-right font-black font-mono text-rose-700 text-sm">
                        {voucher.totalQuantity.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 ${
                            isConfirmed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isDraft
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {isConfirmed ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã Xuất Kho</span>
                            </>
                          ) : isDraft ? (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Bản Nháp (Draft)</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Đã Hủy</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">{voucher.createdByName}</td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedVoucherForDetail(voucher)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[11px] transition cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3 h-3 inline mr-1" />
                          <span>Xem</span>
                        </button>
                        {isDraft && canManage && (
                          <>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Xác nhận duyệt xuất kho cho phiếu ${voucher.voucherNumber}? Tồn kho On Hand sẽ bị trừ ${voucher.totalQuantity} sản phẩm.`
                                  )
                                ) {
                                  confirmStockOutVoucher(voucher.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-[11px] transition cursor-pointer shadow-2xs"
                              title="Duyệt xuất kho & trừ tồn"
                            >
                              <Check className="w-3 h-3 inline mr-0.5" />
                              <span>Duyệt Xuất</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc chắn muốn hủy phiếu ${voucher.voucherNumber}?`)) {
                                  cancelStockOutVoucher(voucher.id);
                                }
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-md font-bold text-[11px] transition cursor-pointer"
                              title="Hủy phiếu"
                            >
                              <X className="w-3 h-3" />
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
      </div>

      {/* CREATE STOCK OUT MODAL */}
      <CreateStockOutVoucherModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* DETAIL MODAL */}
      {selectedVoucherForDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">CHI TIẾT PHIẾU XUẤT KHO</h3>
                    <span className="font-mono font-bold text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-400/30">
                      {selectedVoucherForDetail.voucherNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hợp đồng: {selectedVoucherForDetail.contractNumber || '---'} • Khách hàng: {selectedVoucherForDetail.customerName || '---'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVoucherForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Ngày Xuất Kho:</span>
                  <strong className="text-slate-800 font-mono text-xs">{formatDate(selectedVoucherForDetail.date)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Kho Xuất Hàng:</span>
                  <strong className="text-slate-800 text-xs">{selectedVoucherForDetail.warehouseLocation || 'Kho Tổng'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Người Lập Phiếu:</span>
                  <strong className="text-slate-800 text-xs">{selectedVoucherForDetail.createdByName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Trạng Thái:</span>
                  <strong
                    className={
                      selectedVoucherForDetail.status === 'CONFIRMED'
                        ? 'text-emerald-700 font-bold text-xs'
                        : 'text-amber-700 font-bold text-xs'
                    }
                  >
                    {selectedVoucherForDetail.status === 'CONFIRMED' ? '🟢 Đã Xuất Kho' : '🟡 Bản Nháp'}
                  </strong>
                </div>
              </div>

              {selectedVoucherForDetail.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                  <span className="font-bold text-slate-800 block text-[11px] mb-0.5">Ghi chú:</span>
                  {selectedVoucherForDetail.notes}
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Danh Sách Hàng Hóa Xuất Kho ({selectedVoucherForDetail.items.length} mặt hàng)
                  </h4>
                  <button
                    onClick={() => handleExportDetailExcel(selectedVoucherForDetail)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất Excel Phiếu Này</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">Mã SKU</th>
                        <th className="p-2.5">Tên Sản Phẩm</th>
                        <th className="p-2.5">Hãng</th>
                        <th className="p-2.5 text-center">ĐVT</th>
                        <th className="p-2.5 text-right font-bold text-rose-800">Số Lượng Xuất</th>
                        <th className="p-2.5">Ghi Chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedVoucherForDetail.items.map((it, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center text-slate-400 font-mono">{i + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-700">{it.sku}</td>
                          <td className="p-2.5 font-bold text-slate-900">{it.productName}</td>
                          <td className="p-2.5 text-slate-600 font-semibold">{it.brand || '---'}</td>
                          <td className="p-2.5 text-center text-slate-500 font-medium">{it.unit}</td>
                          <td className="p-2.5 text-right font-mono font-black text-rose-700 text-sm">
                            {it.quantity.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-slate-500 text-[11px]">{it.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-700">
                Tổng số lượng xuất:{' '}
                <strong className="text-rose-700 font-mono font-black text-sm">
                  {selectedVoucherForDetail.totalQuantity.toLocaleString()}
                </strong>{' '}
                sản phẩm
              </div>
              <button
                onClick={() => setSelectedVoucherForDetail(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
