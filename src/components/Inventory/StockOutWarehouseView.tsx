import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Plus,
  Trash2,
  PackageCheck,
  Check,
  X,
} from 'lucide-react';
import { StockOutVoucher, StockOutVoucherItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface StockOutWarehouseViewProps {
  initialSku?: string;
}

export const StockOutWarehouseView: React.FC<StockOutWarehouseViewProps> = ({ initialSku }) => {
  const {
    stockOutVouchers,
    createStockOutVoucher,
    confirmStockOutVoucher,
    cancelStockOutVoucher,
    filteredReserveItems,
    inventory,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'CONFIRMED' | 'CANCELLED'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = useState<StockOutVoucher | null>(null);

  // Form State
  const [selectedReserveId, setSelectedReserveId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('Kho Tổng TP.HCM');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [voucherItems, setVoucherItems] = useState<StockOutVoucherItem[]>([
    {
      sku: initialSku || '',
      productName: initialSku
        ? inventory.find((i) => i.sku.toLowerCase() === initialSku.toLowerCase())?.name || ''
        : '',
      unit: initialSku
        ? inventory.find((i) => i.sku.toLowerCase() === initialSku.toLowerCase())?.unit || 'Bộ'
        : 'Bộ',
      quantity: 1,
      notes: '',
    },
  ]);

  // Active holding reserves available for quick selection
  const activeHolds = filteredReserveItems.filter((r) => r.status === 'holding');

  const handleSelectReserve = (resId: string) => {
    setSelectedReserveId(resId);
    if (!resId) return;

    const targetRes = activeHolds.find((r) => r.id === resId);
    if (targetRes) {
      setCustomerName(targetRes.customerName || '');
      setContractNumber(targetRes.contractNumber || '');
      setWarehouseLocation(targetRes.warehouseLocation || 'Kho Tổng TP.HCM');
      setVoucherItems([
        {
          sku: targetRes.sku,
          productName: targetRes.productName,
          unit: targetRes.unit || 'Bộ',
          quantity: targetRes.reservedQuantity,
          notes: `Xuất kho theo phiếu giữ ${targetRes.id}`,
        },
      ]);
    }
  };

  const handleAddItemRow = () => {
    setVoucherItems((prev) => [
      ...prev,
      {
        sku: '',
        productName: '',
        unit: 'Bộ',
        quantity: 1,
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
    field: keyof StockOutVoucherItem,
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
    const validItems = voucherItems.filter((it) => it.sku.trim().length > 0 && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Vui lòng nhập ít nhất 1 mặt hàng với số lượng xuất > 0!');
      return;
    }

    const totalQty = validItems.reduce((s, it) => s + it.quantity, 0);

    const created = createStockOutVoucher({
      date: voucherDate,
      customerName: customerName.trim(),
      contractNumber: contractNumber.trim(),
      reserveId: selectedReserveId || undefined,
      warehouseLocation: warehouseLocation.trim(),
      status: 'DRAFT',
      items: validItems,
      totalQuantity: totalQty,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      notes: notes.trim(),
      organizationId: '',
    });

    if (shouldConfirm) {
      await confirmStockOutVoucher(created.id);
    }

    setIsCreateModalOpen(false);
    // Reset Form
    setSelectedReserveId('');
    setCustomerName('');
    setContractNumber('');
    setNotes('');
    setVoucherItems([
      {
        sku: '',
        productName: '',
        unit: 'Bộ',
        quantity: 1,
        notes: '',
      },
    ]);
  };

  // Filter Vouchers
  const filteredVouchers = stockOutVouchers.filter((v) => {
    const sTerm = searchTerm.toLowerCase();
    const matchSearch =
      v.voucherNumber.toLowerCase().includes(sTerm) ||
      (v.customerName || '').toLowerCase().includes(sTerm) ||
      (v.contractNumber || '').toLowerCase().includes(sTerm) ||
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
            <PackageCheck className="w-5 h-5 text-rose-600" />
            <span>Quản Lý Phiếu Xuất Kho (Stock Out Vouchers)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu xuất giao hàng cho Khách theo Hợp đồng hoặc xuất kho thông thường, tự động trừ tồn On Hand.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Phiếu Xuất Mới</span>
          </button>
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
            <option value="all">Tất cả trạng thái ({stockOutVouchers.length})</option>
            <option value="DRAFT">Phiếu nháp (DRAFT)</option>
            <option value="CONFIRMED">Đã xuất kho (CONFIRMED)</option>
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
                <th className="p-3">Ngày Xuất</th>
                <th className="p-3">Khách Hàng / Hợp Đồng</th>
                <th className="p-3">Kho Xuất</th>
                <th className="p-3 text-center">Số Mặt Hàng</th>
                <th className="p-3 text-right">Tổng SL Xuất</th>
                <th className="p-3 text-center">Trạng Thái</th>
                <th className="p-3">Người Tạo</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
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
                      <td className="p-3 text-slate-700">{voucher.date}</td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900">{voucher.customerName || '---'}</div>
                        {voucher.contractNumber && (
                          <div className="text-[10px] text-slate-500 font-mono">HĐ: {voucher.contractNumber}</div>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">{voucher.warehouseLocation || 'Kho Tổng'}</td>
                      <td className="p-3 text-center font-mono">{voucher.items.length}</td>
                      <td className="p-3 text-right font-black font-mono text-rose-700 text-sm">
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
                        {isDraft && (
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
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-[11px] transition cursor-pointer"
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
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-700 to-red-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-lg">
                  <PackageCheck className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Tạo Phiếu Xuất Kho Mới (Stock Out Voucher)</h3>
                  <p className="text-xs text-rose-100/80">
                    Xuất kho giao hàng theo đơn giữ của hợp đồng hoặc xuất hàng thực tế
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

            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Optional Quick Link to Active Holds */}
              {activeHolds.length > 0 && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                  <label className="block font-bold text-amber-900">
                    ⚡ Chọn nhanh từ danh sách Hàng Đang Giữ (Optional):
                  </label>
                  <select
                    value={selectedReserveId}
                    onChange={(e) => handleSelectReserve(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Tự nhập thông tin xuất kho thông thường --</option>
                    {activeHolds.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.customerName} | HĐ: {r.contractNumber} | SKU: {r.sku} ({r.reservedQuantity} {r.unit}) | Hạn: {r.expectedDeliveryDate || r.reservedDate}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* General Form Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên Khách Hàng / Đối Tác</label>
                  <input
                    type="text"
                    placeholder="Tên khách nhận hàng..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-rose-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Hợp Đồng Liên Quan</label>
                  <input
                    type="text"
                    placeholder="VD: HD-2026-001..."
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-rose-600 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày Xuất Kho</label>
                  <input
                    type="date"
                    value={voucherDate}
                    onChange={(e) => setVoucherDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-rose-600 font-medium font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Ghi Chú Xuất Kho</label>
                  <input
                    type="text"
                    placeholder="VD: Xuất hàng bàn giao tại công trình..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Danh Sách Sản Phẩm Xuất ({voucherItems.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition"
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
                        <th className="p-2.5 w-28 text-right">
                          SL Xuất <span className="text-rose-500">*</span>
                        </th>
                        <th className="p-2.5 w-48">Ghi Chú Dòng</th>
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
                              placeholder="Nhập SKU..."
                              value={item.sku}
                              onChange={(e) => handleSkuChange(index, e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-rose-500"
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
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-rose-500"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleItemFieldChange(index, 'unit', e.target.value)}
                              className="w-full px-1 py-1 text-center bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:border-rose-500"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  index,
                                  'quantity',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 text-right bg-rose-50 border border-rose-400 rounded font-mono font-bold text-rose-900 focus:outline-none focus:border-rose-600"
                              required
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Ghi chú..."
                              value={item.notes || ''}
                              onChange={(e) =>
                                handleItemFieldChange(index, 'notes', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:border-rose-500"
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

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="text-xs text-slate-600">
                Tổng số lượng xuất:{' '}
                <strong className="text-rose-700 font-mono text-sm">
                  {voucherItems.reduce((s, it) => s + (it.quantity || 0), 0).toLocaleString()}
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Duyệt Xuất Kho Ngay</span>
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
                <span className="text-xs font-mono text-rose-400">PHIẾU XUẤT KHO</span>
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
                  <span className="text-slate-400 block">Ngày Xuất:</span>
                  <strong className="text-slate-800 font-mono">{selectedVoucherForDetail.date}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Khách Hàng:</span>
                  <strong className="text-slate-800">{selectedVoucherForDetail.customerName || '---'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Hợp Đồng:</span>
                  <strong className="text-slate-800 font-mono">{selectedVoucherForDetail.contractNumber || '---'}</strong>
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
                    {selectedVoucherForDetail.status === 'CONFIRMED' ? 'Đã Xuất Kho' : 'Bản Nháp'}
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
                      <th className="p-2.5 text-right font-bold text-rose-800">Số Lượng Xuất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedVoucherForDetail.items.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2.5 text-center text-slate-400 font-mono">{i + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-800">{it.sku}</td>
                        <td className="p-2.5 text-slate-700">{it.productName}</td>
                        <td className="p-2.5 text-center text-slate-500">{it.unit}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-800">
                          {it.quantity}
                        </td>
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
