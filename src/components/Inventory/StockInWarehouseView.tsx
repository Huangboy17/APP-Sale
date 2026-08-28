import React, { useState } from 'react';
import {
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Warehouse,
  Plus,
  Trash2,
  Truck,
  Check,
  X,
} from 'lucide-react';
import { StockInVoucher, StockInVoucherItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface StockInWarehouseViewProps {
  initialSku?: string;
}

export const StockInWarehouseView: React.FC<StockInWarehouseViewProps> = ({ initialSku }) => {
  const {
    stockInVouchers,
    createStockInVoucher,
    confirmStockInVoucher,
    cancelStockInVoucher,
    inventory,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'CONFIRMED' | 'CANCELLED'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = useState<StockInVoucher | null>(null);

  // Form State for creating Stock In Voucher
  const [supplierName, setSupplierName] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('Kho Tổng TP.HCM');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [voucherItems, setVoucherItems] = useState<StockInVoucherItem[]>([
    {
      sku: initialSku || '',
      productName: initialSku
        ? inventory.find((i) => i.sku.toLowerCase() === initialSku.toLowerCase())?.name || ''
        : '',
      unit: initialSku
        ? inventory.find((i) => i.sku.toLowerCase() === initialSku.toLowerCase())?.unit || 'Bộ'
        : 'Bộ',
      expectedQuantity: 10,
      actualQuantity: 10,
      unitCost: 0,
      notes: '',
    },
  ]);

  const handleAddItemRow = () => {
    setVoucherItems((prev) => [
      ...prev,
      {
        sku: '',
        productName: '',
        unit: 'Bộ',
        expectedQuantity: 1,
        actualQuantity: 1,
        unitCost: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setVoucherItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSkuChange = (index: number, newSku: string) => {
    const found = inventory.find(
      (inv) => inv.sku.trim().toLowerCase() === newSku.trim().toLowerCase()
    );
    setVoucherItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            sku: newSku,
            productName: found ? found.name : item.productName || `Sản phẩm ${newSku}`,
            unit: found ? found.unit : item.unit || 'Bộ',
          };
        }
        return item;
      })
    );
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof StockInVoucherItem,
    val: any
  ) => {
    setVoucherItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const handleSaveVoucher = async (shouldConfirm: boolean) => {
    if (!supplierName.trim()) {
      alert('Vui lòng nhập tên Nhà Cung Cấp!');
      return;
    }
    const validItems = voucherItems.filter((it) => it.sku.trim().length > 0 && it.actualQuantity > 0);
    if (validItems.length === 0) {
      alert('Vui lòng nhập ít nhất 1 mặt hàng với số lượng thực nhập > 0!');
      return;
    }

    const totalQty = validItems.reduce((s, it) => s + it.actualQuantity, 0);
    const totalAmt = validItems.reduce((s, it) => s + (it.actualQuantity * (it.unitCost || 0)), 0);

    const created = createStockInVoucher({
      date: voucherDate,
      supplierName: supplierName.trim(),
      warehouseLocation: warehouseLocation.trim(),
      status: 'DRAFT',
      items: validItems,
      totalQuantity: totalQty,
      totalAmount: totalAmt,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      notes: notes.trim(),
      organizationId: '',
    });

    if (shouldConfirm) {
      await confirmStockInVoucher(created.id);
    }

    setIsCreateModalOpen(false);
    // Reset Form
    setSupplierName('');
    setNotes('');
    setVoucherItems([
      {
        sku: '',
        productName: '',
        unit: 'Bộ',
        expectedQuantity: 10,
        actualQuantity: 10,
        unitCost: 0,
        notes: '',
      },
    ]);
  };

  // Filter Vouchers
  const filteredVouchers = stockInVouchers.filter((v) => {
    const sTerm = searchTerm.toLowerCase();
    const matchSearch =
      v.voucherNumber.toLowerCase().includes(sTerm) ||
      v.supplierName.toLowerCase().includes(sTerm) ||
      (v.warehouseLocation || '').toLowerCase().includes(sTerm) ||
      v.items.some((it) => it.sku.toLowerCase().includes(sTerm) || it.productName.toLowerCase().includes(sTerm));

    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>Quản Lý Phiếu Nhập Kho (Stock In Vouchers)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo phiếu nhập từ NCC, kiểm đếm thực nhận và tự động cập nhật số lượng tồn thực tế (On Hand).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Phiếu Nhập Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo số phiếu, NCC, SKU..."
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
            <option value="all">Tất cả trạng thái ({stockInVouchers.length})</option>
            <option value="DRAFT">Phiếu nháp (DRAFT)</option>
            <option value="CONFIRMED">Đã nhập kho (CONFIRMED)</option>
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
                <th className="p-3">Ngày Nhập</th>
                <th className="p-3">Nhà Cung Cấp</th>
                <th className="p-3">Kho Nhận</th>
                <th className="p-3 text-center">Số Mặt Hàng</th>
                <th className="p-3 text-right">Tổng SL Thực Nhập</th>
                <th className="p-3 text-center">Trạng Thái</th>
                <th className="p-3">Người Tạo</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span>Không tìm thấy phiếu nhập kho nào phù hợp.</span>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher, idx) => {
                  const isConfirmed = voucher.status === 'CONFIRMED';
                  const isDraft = voucher.status === 'DRAFT';
                  return (
                    <tr key={voucher.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold font-mono text-blue-700">
                        {voucher.voucherNumber}
                      </td>
                      <td className="p-3 text-slate-700">{voucher.date}</td>
                      <td className="p-3 font-medium text-slate-900">{voucher.supplierName}</td>
                      <td className="p-3 text-slate-600">{voucher.warehouseLocation || 'Kho Tổng'}</td>
                      <td className="p-3 text-center font-mono">{voucher.items.length}</td>
                      <td className="p-3 text-right font-black font-mono text-emerald-700 text-sm">
                        {voucher.totalQuantity.toLocaleString()}
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
                              <span>Đã Nhập Kho</span>
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
                                    `Xác nhận duyệt nhập kho cho phiếu ${voucher.voucherNumber}? Tồn kho sẽ được cộng thêm ${voucher.totalQuantity} sản phẩm.`
                                  )
                                ) {
                                  confirmStockInVoucher(voucher.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[11px] transition cursor-pointer"
                              title="Duyệt nhập kho & cộng tồn"
                            >
                              <Check className="w-3 h-3 inline mr-0.5" />
                              <span>Duyệt Nhập</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc chắn muốn hủy phiếu ${voucher.voucherNumber}?`)) {
                                  cancelStockInVoucher(voucher.id);
                                }
                              }}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md font-bold text-[11px] transition cursor-pointer"
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

      {/* CREATE STOCK IN MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Truck className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Tạo Phiếu Nhập Kho Mới (Stock In Voucher)</h3>
                  <p className="text-xs text-emerald-100/80">
                    Nhập hàng từ Nhà Cung Cấp hoặc mua bổ sung vào kho
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

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* General Voucher Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nhà Cung Cấp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Công ty TOTO Việt Nam, INAX..."
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kho Nhập Hàng</label>
                  <input
                    type="text"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày Nhập Kho</label>
                  <input
                    type="date"
                    value={voucherDate}
                    onChange={(e) => setVoucherDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600 font-medium font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Ghi Chú Nhập Kho</label>
                  <input
                    type="text"
                    placeholder="VD: Nhập bổ sung tồn kho theo đơn PO-2026-08..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Danh Sách Sản Phẩm Nhập ({voucherItems.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm Sản Phẩm</span>
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
                        <th className="p-2.5 w-24 text-right">Dự Kiến</th>
                        <th className="p-2.5 w-28 text-right">
                          Thực Nhập <span className="text-rose-500">*</span>
                        </th>
                        <th className="p-2.5 w-32 text-right">Đơn Giá Nhập</th>
                        <th className="p-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {voucherItems.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-400 font-mono">{index + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Nhập mã SKU..."
                              value={item.sku}
                              onChange={(e) => handleSkuChange(index, e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-500"
                              required
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Tên mặt hàng..."
                              value={item.productName}
                              onChange={(e) =>
                                handleItemFieldChange(index, 'productName', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleItemFieldChange(index, 'unit', e.target.value)}
                              className="w-full px-1 py-1 text-center bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.expectedQuantity}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  index,
                                  'expectedQuantity',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 text-right bg-white border border-slate-300 rounded font-mono text-slate-600 focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.actualQuantity}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  index,
                                  'actualQuantity',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 text-right bg-emerald-50 border border-emerald-400 rounded font-mono font-bold text-emerald-900 focus:outline-none focus:border-emerald-600"
                              required
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.unitCost || 0}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  index,
                                  'unitCost',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 text-right bg-white border border-slate-300 rounded font-mono text-slate-700 focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {voucherItems.length > 1 && (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="text-xs text-slate-600">
                Tổng thực nhập:{' '}
                <strong className="text-emerald-700 font-mono text-sm">
                  {voucherItems.reduce((s, it) => s + (it.actualQuantity || 0), 0).toLocaleString()}
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Duyệt Nhập Kho Ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VOUCHER MODAL */}
      {selectedVoucherForDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400">PHIẾU NHẬP KHO</span>
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
                  <span className="text-slate-400 block">Ngày Nhập:</span>
                  <strong className="text-slate-800 font-mono">{selectedVoucherForDetail.date}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Nhà Cung Cấp:</span>
                  <strong className="text-slate-800">{selectedVoucherForDetail.supplierName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Kho Nhận:</span>
                  <strong className="text-slate-800">{selectedVoucherForDetail.warehouseLocation || 'Kho Tổng'}</strong>
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
                    {selectedVoucherForDetail.status === 'CONFIRMED' ? 'Đã Nhập Kho' : 'Bản Nháp'}
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
                      <th className="p-2.5 text-center">ĐVT</th>
                      <th className="p-2.5 text-right">Dự Kiến</th>
                      <th className="p-2.5 text-right font-bold text-emerald-800">Thực Nhập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedVoucherForDetail.items.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2.5 text-center text-slate-400 font-mono">{i + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-800">{it.sku}</td>
                        <td className="p-2.5 text-slate-700">{it.productName}</td>
                        <td className="p-2.5 text-center text-slate-500">{it.unit}</td>
                        <td className="p-2.5 text-right font-mono text-slate-500">{it.expectedQuantity}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-800">
                          {it.actualQuantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedVoucherForDetail.notes && (
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 italic">
                  Ghi chú: {selectedVoucherForDetail.notes}
                </div>
              )}
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
