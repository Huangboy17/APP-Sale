import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Plus,
  Trash2,
  ClipboardCheck,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { StockAuditVoucher, StockAuditVoucherItem } from '../../types';
import { useApp } from '../../context/AppContext';

export const StockAuditWarehouseView: React.FC = () => {
  const {
    stockAuditVouchers,
    createStockAuditVoucher,
    confirmStockAuditVoucher,
    cancelStockAuditVoucher,
    inventory,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'CONFIRMED' | 'CANCELLED'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = useState<StockAuditVoucher | null>(null);

  // Form State
  const [warehouseLocation, setWarehouseLocation] = useState('Kho Tổng TP.HCM');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [auditItems, setAuditItems] = useState<StockAuditVoucherItem[]>([
    {
      sku: '',
      productName: '',
      unit: 'Bộ',
      systemQuantity: 0,
      actualQuantity: 0,
      difference: 0,
      reason: 'Kiểm kê định kỳ',
    },
  ]);

  const handleLoadWarehouseStock = () => {
    const sampleItems = inventory.slice(0, 15).map((inv) => ({
      sku: inv.sku,
      productName: inv.name,
      unit: inv.unit || 'Bộ',
      systemQuantity: inv.totalQuantity || 0,
      actualQuantity: inv.totalQuantity || 0,
      difference: 0,
      reason: 'Kiểm kê định kỳ',
    }));
    setAuditItems(sampleItems);
  };

  const handleAddItemRow = () => {
    setAuditItems((prev) => [
      ...prev,
      {
        sku: '',
        productName: '',
        unit: 'Bộ',
        systemQuantity: 0,
        actualQuantity: 0,
        difference: 0,
        reason: '',
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setAuditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSkuChange = (index: number, newSku: string) => {
    const found = inventory.find(
      (inv) => inv.sku.trim().toLowerCase() === newSku.trim().toLowerCase()
    );
    setAuditItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const sysQty = found ? found.totalQuantity : 0;
          return {
            ...item,
            sku: newSku,
            productName: found ? found.name : item.productName || `Sản phẩm ${newSku}`,
            unit: found ? found.unit : item.unit || 'Bộ',
            systemQuantity: sysQty,
            actualQuantity: sysQty,
            difference: 0,
          };
        }
        return item;
      })
    );
  };

  const handleActualQtyChange = (index: number, actual: number) => {
    setAuditItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const diff = actual - item.systemQuantity;
          return {
            ...item,
            actualQuantity: actual,
            difference: diff,
          };
        }
        return item;
      })
    );
  };

  const handleReasonChange = (index: number, reason: string) => {
    setAuditItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, reason };
        }
        return item;
      })
    );
  };

  const handleSaveVoucher = async (shouldConfirm: boolean) => {
    const validItems = auditItems.filter((it) => it.sku.trim().length > 0);
    if (validItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để kiểm kê!');
      return;
    }

    const totalDiff = validItems.reduce((s, it) => s + it.difference, 0);

    const created = createStockAuditVoucher({
      date: auditDate,
      warehouseLocation: warehouseLocation.trim(),
      status: 'DRAFT',
      items: validItems,
      totalItemsAudited: validItems.length,
      totalDifference: totalDiff,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      notes: notes.trim(),
      organizationId: '',
    });

    if (shouldConfirm) {
      await confirmStockAuditVoucher(created.id);
    }

    setIsCreateModalOpen(false);
    // Reset Form
    setNotes('');
    setAuditItems([
      {
        sku: '',
        productName: '',
        unit: 'Bộ',
        systemQuantity: 0,
        actualQuantity: 0,
        difference: 0,
        reason: 'Kiểm kê định kỳ',
      },
    ]);
  };

  // Filter Vouchers
  const filteredVouchers = stockAuditVouchers.filter((v) => {
    const sTerm = searchTerm.toLowerCase();
    const matchSearch =
      v.voucherNumber.toLowerCase().includes(sTerm) ||
      (v.warehouseLocation || '').toLowerCase().includes(sTerm) ||
      v.items.some((it) => it.sku.toLowerCase().includes(sTerm) || it.productName.toLowerCase().includes(sTerm));

    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            <span>Quản Lý Kiểm Kê Kho & Cân Bằng Tồn (Stock Audit Sheets)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu kiểm kê đếm hàng thực tế, xác định chênh lệch thừa/thiếu và duyệt điều chỉnh cân bằng kho.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Phiếu Kiểm Kê Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo số phiếu kiểm kê, SKU, kho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white cursor-pointer font-medium text-slate-700"
          >
            <option value="all">Tất cả trạng thái ({stockAuditVouchers.length})</option>
            <option value="DRAFT">Phiếu nháp (DRAFT)</option>
            <option value="CONFIRMED">Đã cân bằng tồn (CONFIRMED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3">Số Phiếu</th>
                <th className="p-3">Ngày Kiểm Kê</th>
                <th className="p-3">Kho Kiểm Kê</th>
                <th className="p-3 text-center">Số Mặt Hàng Đã Đếm</th>
                <th className="p-3 text-right">Tổng Chênh Lệch</th>
                <th className="p-3 text-center">Trạng Thái</th>
                <th className="p-3">Người Kiểm Kê</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <ClipboardCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span>Không tìm thấy phiếu kiểm kê nào phù hợp.</span>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher, idx) => {
                  const isConfirmed = voucher.status === 'CONFIRMED';
                  const isDraft = voucher.status === 'DRAFT';
                  const isZeroDiff = voucher.totalDifference === 0;
                  return (
                    <tr key={voucher.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold font-mono text-indigo-700">
                        {voucher.voucherNumber}
                      </td>
                      <td className="p-3 text-slate-700">{voucher.date}</td>
                      <td className="p-3 text-slate-700">{voucher.warehouseLocation || 'Kho Tổng'}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {voucher.totalItemsAudited}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-sm">
                        <span
                          className={
                            isZeroDiff
                              ? 'text-slate-500'
                              : voucher.totalDifference > 0
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }
                        >
                          {voucher.totalDifference > 0
                            ? `+${voucher.totalDifference}`
                            : voucher.totalDifference}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center space-x-1 ${
                            isConfirmed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isDraft
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isConfirmed ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã Cân Bằng Tồn</span>
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
                        {isDraft && (
                          <>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Xác nhận duyệt phiếu kiểm kê ${voucher.voucherNumber}? Tồn kho On Hand sẽ được điều chỉnh chính xác theo số lượng thực tế đã đếm.`
                                  )
                                ) {
                                  confirmStockAuditVoucher(voucher.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-[11px] transition cursor-pointer"
                              title="Duyệt kiểm kê & cân bằng tồn"
                            >
                              <Check className="w-3 h-3 inline mr-0.5" />
                              <span>Duyệt Cân Bằng</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc chắn muốn hủy phiếu ${voucher.voucherNumber}?`)) {
                                  cancelStockAuditVoucher(voucher.id);
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

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ClipboardCheck className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Lập Phiếu Kiểm Kê Kho (Stock Audit Voucher)</h3>
                  <p className="text-xs text-indigo-100/80">
                    Đối chiếu tồn hệ thống với kiểm đếm thực tế và cập nhật tồn chuẩn xác
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kho Kiểm Kê</label>
                  <input
                    type="text"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày Kiểm Kê</label>
                  <input
                    type="date"
                    value={auditDate}
                    onChange={(e) => setAuditDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600 font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ghi Chú Đợt Kiểm</label>
                  <input
                    type="text"
                    placeholder="VD: Kiểm kê định kỳ cuối tháng..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Danh Sách Mặt Hàng Kiểm Kê ({auditItems.length})
                    </h4>
                    <button
                      type="button"
                      onClick={handleLoadWarehouseStock}
                      className="px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold border border-slate-300 transition cursor-pointer flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Nạp mẫu danh mục kho</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm Mã Hàng</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5 w-44">Mã SKU</th>
                        <th className="p-2.5">Tên Sản Phẩm</th>
                        <th className="p-2.5 w-20 text-center">ĐVT</th>
                        <th className="p-2.5 w-24 text-right">Tồn Hệ Thống</th>
                        <th className="p-2.5 w-28 text-right font-bold text-indigo-900">
                          Thực Tế Đếm
                        </th>
                        <th className="p-2.5 w-24 text-right">Chênh Lệch</th>
                        <th className="p-2.5 w-44">Lý Do Chênh Lệch</th>
                        <th className="p-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditItems.map((item, index) => {
                        const isDiff = item.difference !== 0;
                        return (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="p-2 text-center text-slate-400 font-mono">{index + 1}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Nhập SKU..."
                                value={item.sku}
                                onChange={(e) => handleSkuChange(index, e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-indigo-500"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Tên mặt hàng..."
                                value={item.productName}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800"
                                readOnly
                              />
                            </td>
                            <td className="p-2 text-center text-slate-600 font-medium">
                              {item.unit || 'Bộ'}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-600">
                              {item.systemQuantity}
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={item.actualQuantity}
                                onChange={(e) =>
                                  handleActualQtyChange(index, parseInt(e.target.value) || 0)
                                }
                                className="w-full px-2 py-1 text-right bg-indigo-50 border border-indigo-400 rounded font-mono font-bold text-indigo-900 focus:outline-none focus:border-indigo-600"
                                required
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-black">
                              <span
                                className={
                                  !isDiff
                                    ? 'text-slate-400'
                                    : item.difference > 0
                                    ? 'text-emerald-700'
                                    : 'text-rose-700'
                                }
                              >
                                {item.difference > 0 ? `+${item.difference}` : item.difference}
                              </span>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Lý do..."
                                value={item.reason || ''}
                                onChange={(e) => handleReasonChange(index, e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                            <td className="p-2 text-center">
                              {auditItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(index)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="text-xs text-slate-600">
                Tổng chênh lệch:{' '}
                <strong
                  className={`font-mono text-sm ${
                    auditItems.reduce((s, it) => s + (it.difference || 0), 0) === 0
                      ? 'text-slate-700'
                      : auditItems.reduce((s, it) => s + (it.difference || 0), 0) > 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {auditItems.reduce((s, it) => s + (it.difference || 0), 0) > 0
                    ? `+${auditItems.reduce((s, it) => s + (it.difference || 0), 0)}`
                    : auditItems.reduce((s, it) => s + (it.difference || 0), 0)}
                </strong>{' '}
                sản phẩm
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveVoucher(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Lưu Bản Nháp (Draft)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveVoucher(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Duyệt & Cân Bằng Kho Ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedVoucherForDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-indigo-400">PHIẾU KIỂM KÊ KHO</span>
                <h3 className="text-base font-bold">{selectedVoucherForDetail.voucherNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedVoucherForDetail(null)}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Ngày Kiểm:</span>
                  <strong className="text-slate-800 font-mono">{selectedVoucherForDetail.date}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Kho Kiểm:</span>
                  <strong className="text-slate-800">{selectedVoucherForDetail.warehouseLocation || 'Kho Tổng'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Mặt Hàng Đã Đếm:</span>
                  <strong className="text-slate-800 font-mono">{selectedVoucherForDetail.totalItemsAudited}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Trạng Thái:</span>
                  <strong
                    className={
                      selectedVoucherForDetail.status === 'CONFIRMED'
                        ? 'text-emerald-700 font-bold'
                        : 'text-amber-700 font-bold'
                    }
                  >
                    {selectedVoucherForDetail.status === 'CONFIRMED' ? 'Đã Cân Bằng Tồn' : 'Bản Nháp'}
                  </strong>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5">Mã SKU</th>
                      <th className="p-2.5">Tên Sản Phẩm</th>
                      <th className="p-2.5 text-right">Tồn Hệ Thống</th>
                      <th className="p-2.5 text-right font-bold text-indigo-900">Thực Tế</th>
                      <th className="p-2.5 text-right">Chênh Lệch</th>
                      <th className="p-2.5">Lý Do</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedVoucherForDetail.items.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2.5 text-center text-slate-400 font-mono">{i + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-800">{it.sku}</td>
                        <td className="p-2.5 text-slate-700">{it.productName}</td>
                        <td className="p-2.5 text-right font-mono text-slate-500">{it.systemQuantity}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-indigo-900">
                          {it.actualQuantity}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          <span
                            className={
                              it.difference === 0
                                ? 'text-slate-400'
                                : it.difference > 0
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }
                          >
                            {it.difference > 0 ? `+${it.difference}` : it.difference}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 italic">{it.reason || '---'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedVoucherForDetail(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold"
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
