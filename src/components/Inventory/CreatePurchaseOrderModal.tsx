import React, { useState, useMemo } from 'react';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  OrderItem,
  ProductPriceItem,
  POLineSourceType,
} from '../../types';
import {
  groupSalesRequestsBySku,
  createWarehousePlannedItem,
  calculateWarehouseExtraQuantity,
  calculateRemainingQuantity,
  validatePurchaseOrder,
} from '../../services/purchaseOrderService';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import {
  X,
  Plus,
  Trash2,
  Boxes,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Layers,
  Search,
  ShoppingCart,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  selectedSalesRequests?: OrderItem[];
  onClose: () => void;
  onSuccess?: (createdPO: PurchaseOrder) => void;
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  isOpen,
  selectedSalesRequests = [],
  onClose,
  onSuccess,
}) => {
  const { products, inventory, createPurchaseOrder, currentUser } = useApp();

  const productMap = useMemo(() => new Map(products.map((p) => [p.sku.trim().toUpperCase(), p])), [products]);
  const inventoryMap = useMemo(() => new Map(inventory.map((i) => [i.sku.trim().toUpperCase(), i])), [inventory]);

  // Form State
  const [supplierName, setSupplierName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('Kho Tổng TP.HCM');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Grouped items state
  const [items, setItems] = useState<PurchaseOrderItem[]>(() => {
    return groupSalesRequestsBySku(selectedSalesRequests, productMap, inventoryMap);
  });

  // Product picker modal state (Thêm mặt hàng chủ động)
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [expandedBreakdownSkus, setExpandedBreakdownSkus] = useState<Set<string>>(new Set());

  // Distinct suppliers from products or inventory for autocomplete
  const supplierSuggestions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand && p.brand !== 'Khác') set.add(p.brand);
    });
    return Array.from(set).slice(0, 8);
  }, [products]);

  // Filter products in picker
  const filteredPickerProducts = useMemo(() => {
    if (!pickerSearch.trim()) return products.slice(0, 30);
    const q = pickerSearch.toLowerCase().trim();
    return products
      .filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [products, pickerSearch]);

  const handleUpdateSupplierQty = (itemId: string, newQty: number) => {
    const qty = Math.max(0, newQty);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const extra = calculateWarehouseExtraQuantity(qty, item.salesRequiredQuantity);
          const remaining = calculateRemainingQuantity(qty, item.receivedQuantity);
          return {
            ...item,
            supplierOrderQuantity: qty,
            warehouseExtraQuantity: extra,
            remainingQuantity: remaining,
          };
        }
        return item;
      })
    );
  };

  const handleAddWarehousePlannedProduct = (prod: ProductPriceItem) => {
    const existingIndex = items.findIndex((i) => i.sku.toUpperCase() === prod.sku.toUpperCase());
    if (existingIndex >= 0) {
      alert(`Mã hàng ${prod.sku} đã có trong danh sách đơn đặt.`);
      return;
    }

    const newItem = createWarehousePlannedItem(prod, 1);
    setItems((prev) => [...prev, newItem]);
    setIsProductPickerOpen(false);
    setPickerSearch('');
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const toggleBreakdown = (sku: string) => {
    setExpandedBreakdownSkus((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  // Aggregated totals
  const totalSalesDemand = useMemo(() => items.reduce((sum, i) => sum + i.salesRequiredQuantity, 0), [items]);
  const totalSupplierOrder = useMemo(() => items.reduce((sum, i) => sum + i.supplierOrderQuantity, 0), [items]);
  const totalWarehouseExtra = useMemo(() => items.reduce((sum, i) => sum + i.warehouseExtraQuantity, 0), [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validatePurchaseOrder({
      supplierName,
      items,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.errors.join(' '));
      return;
    }

    try {
      setIsSubmitting(true);
      const createdPO = await createPurchaseOrder({
        supplierName: supplierName.trim(),
        orderDate,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        warehouseLocation,
        status: 'ordered',
        items,
        totalSalesDemand,
        totalOrderQuantity: totalSupplierOrder,
        totalReceivedQuantity: 0,
        notes: notes.trim() || undefined,
        createdById: currentUser.id,
        createdByName: currentUser.name,
        organizationId: currentUser.organizationId || 'system_admin',
      });

      if (onSuccess) onSuccess(createdPO);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra khi tạo Đơn đặt NCC.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <ShoppingCart className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Lập Đơn Đặt Nhà Cung Cấp (PO)</h2>
              <p className="text-xs text-indigo-200">
                Gộp nhu cầu Sales theo SKU • Kho chủ động điều chỉnh số lượng & mua thêm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* PO Info Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Supplier Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nhà Cung Cấp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Philips Việt Nam, Panasonic..."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
              {supplierSuggestions.length > 0 && !supplierName && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {supplierSuggestions.slice(0, 4).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSupplierName(s)}
                      className="px-1.5 py-0.5 bg-slate-200 hover:bg-indigo-100 hover:text-indigo-800 text-[10px] rounded font-medium transition cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ngày Lập Đơn
              </label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Dự Kiến Hàng Về (ETA)
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            {/* Destination Warehouse */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kho Đích Nhận Hàng
              </label>
              <select
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
              >
                <option value="Kho Tổng TP.HCM">Kho Tổng TP.HCM</option>
                <option value="Kho Hà Nội">Kho Hà Nội</option>
                <option value="Kho Đà Nẵng">Kho Đà Nẵng</option>
                <option value="Kho Phụ Phân Phối">Kho Phụ Phân Phối</option>
              </select>
            </div>
          </div>

          {/* Action Toolbar: Add Warehouse Planned Product */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Danh Sách Mặt Hàng Trong Đơn ({items.length} mã)
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsProductPickerOpen(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Mặt Hàng Chủ Động</span>
            </button>
          </div>

          {/* Table of Consolidated Items */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Mã SKU</th>
                    <th className="px-3.5 py-2.5">Tên Sản Phẩm</th>
                    <th className="px-3 py-2.5 text-center">Hãng / ĐVT</th>
                    <th className="px-3.5 py-2.5 text-center bg-indigo-50/50 text-indigo-950 border-x border-indigo-100">
                      Nhu Cầu Sales
                    </th>
                    <th className="px-3.5 py-2.5 text-center bg-amber-50/60 text-amber-950 border-r border-amber-200 min-w-32">
                      SL Đặt NCC <span className="text-rose-500">*</span>
                    </th>
                    <th className="px-3.5 py-2.5 text-center bg-emerald-50/40 text-emerald-950 border-r border-emerald-100">
                      Mua Thêm (Dự trữ)
                    </th>
                    <th className="px-3.5 py-2.5 text-center">Nguồn</th>
                    <th className="px-2.5 py-2.5 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        Chưa có mặt hàng nào trong đơn đặt. Hãy bấm <strong>+ Thêm Mặt Hàng Chủ Động</strong> hoặc chọn các đề nghị từ Sales.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const isExtra = item.warehouseExtraQuantity > 0;
                      const hasSalesDemands = item.salesDemands && item.salesDemands.length > 0;
                      const isExpanded = expandedBreakdownSkus.has(item.sku);

                      return (
                        <React.Fragment key={item.id}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">
                              <div className="flex items-center space-x-1">
                                <span>{item.sku}</span>
                                {hasSalesDemands && (
                                  <button
                                    type="button"
                                    onClick={() => toggleBreakdown(item.sku)}
                                    className="p-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                    title="Xem phân rã nhu cầu từng HĐ"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5 font-bold text-slate-900 max-w-[220px]">
                              <div className="line-clamp-1" title={item.productName}>
                                {item.productName}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center text-slate-600">
                              <span className="font-semibold">{item.brand}</span>
                              <span className="text-[10px] text-slate-400 block">{item.unit}</span>
                            </td>
                            {/* SALES REQUIRED QUANTITY - READ ONLY */}
                            <td className="px-3.5 py-2.5 text-center bg-indigo-50/20 border-x border-indigo-100 font-mono font-bold text-indigo-900">
                              {item.salesRequiredQuantity}{' '}
                              <span className="text-[10px] font-normal text-indigo-600">{item.unit}</span>
                            </td>
                            {/* SUPPLIER ORDER QUANTITY - EDITABLE */}
                            <td className="px-3.5 py-2 text-center bg-amber-50/20 border-r border-amber-100">
                              <input
                                type="number"
                                min={item.salesRequiredQuantity}
                                value={item.supplierOrderQuantity}
                                onChange={(e) => handleUpdateSupplierQty(item.id, parseInt(e.target.value, 10) || 0)}
                                className={`w-24 px-2 py-1 text-center font-mono font-black text-sm rounded-lg border focus:ring-2 focus:ring-amber-500 outline-hidden ${
                                  item.supplierOrderQuantity < item.salesRequiredQuantity
                                    ? 'border-rose-400 bg-rose-50 text-rose-900'
                                    : 'border-amber-300 bg-amber-50/80 text-amber-950'
                                }`}
                              />
                            </td>
                            {/* WAREHOUSE EXTRA */}
                            <td className="px-3.5 py-2.5 text-center bg-emerald-50/20 border-r border-emerald-100 font-mono font-bold">
                              {isExtra ? (
                                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs">
                                  +{item.warehouseExtraQuantity} {item.unit}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">0</span>
                              )}
                            </td>
                            {/* SOURCE TYPE */}
                            <td className="px-3.5 py-2.5 text-center">
                              {item.sourceType === 'WAREHOUSE_PLANNED' ? (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded-full text-[10px] font-bold">
                                  Kho chủ động
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-[10px] font-bold">
                                  {item.salesDemands.length} HĐ Sales
                                </span>
                              )}
                            </td>
                            {/* REMOVE ITEM */}
                            <td className="px-2.5 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Xóa dòng khỏi PO"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>

                          {/* INLINE SOURCE BREAKDOWN SECTION */}
                          {isExpanded && hasSalesDemands && (
                            <tr className="bg-indigo-50/30">
                              <td colSpan={8} className="px-6 py-2.5 border-b border-indigo-100">
                                <div className="space-y-1 text-[11px]">
                                  <div className="font-bold text-indigo-900 flex items-center space-x-1.5 mb-1.5">
                                    <Sparkles className="w-3 h-3 text-indigo-600" />
                                    <span>
                                      Phân rã nguồn hình thành {item.supplierOrderQuantity} {item.unit} của mã {item.sku}:
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {item.salesDemands.map((d, dIdx) => (
                                      <div
                                        key={`${d.orderItemId}-${dIdx}`}
                                        className="p-2 bg-white rounded-lg border border-indigo-100 shadow-2xs flex flex-col justify-between"
                                      >
                                        <div className="flex items-center justify-between font-bold text-slate-800">
                                          <span className="text-blue-600 font-mono">HĐ: {d.contractNumber}</span>
                                          <span className="text-indigo-900 font-mono">
                                            {d.requiredQuantity} {item.unit}
                                          </span>
                                        </div>
                                        <div className="text-slate-600 truncate mt-0.5">{d.customerName}</div>
                                        <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
                                          <span>Sales: {d.salesRepName}</span>
                                          <span>Hạn: {d.requiredDate ? formatDate(d.requiredDate) : 'Sớm nhất'}</span>
                                        </div>
                                      </div>
                                    ))}

                                    {item.warehouseExtraQuantity > 0 && (
                                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 shadow-2xs flex flex-col justify-between">
                                        <div className="flex items-center justify-between font-bold text-emerald-900">
                                          <span>Kho chủ động mua thêm</span>
                                          <span className="font-mono">
                                            +{item.warehouseExtraQuantity} {item.unit}
                                          </span>
                                        </div>
                                        <div className="text-emerald-700 text-[10px] mt-1">
                                          Sau khi nhập sẽ chuyển vào Tồn khả dụng công ty.
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ghi Chú Đơn Đặt NCC
            </label>
            <input
              type="text"
              placeholder="Ghi chú điều khoản giao hàng, thanh toán, liên hệ NCC..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Tổng Số Mặt Hàng</span>
              <span className="text-base font-black text-slate-900 font-mono">{items.length}</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-indigo-200">
              <span className="text-[10px] font-bold text-indigo-700 uppercase block">Tổng Nhu Cầu Sales</span>
              <span className="text-base font-black text-indigo-900 font-mono">{totalSalesDemand.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Tổng Đặt NCC</span>
              <span className="text-base font-black text-amber-950 font-mono">{totalSupplierOrder.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Kho Mua Thêm</span>
              <span className="text-base font-black text-emerald-700 font-mono">+{totalWarehouseExtra.toLocaleString()}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang tạo đơn...' : 'Tạo Đơn Đặt NCC'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* PRODUCT PICKER MODAL (Thêm mặt hàng chủ động từ Master Data Giá) */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[80vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-indigo-300" />
                <h3 className="font-bold text-sm">Chọn Mặt Hàng Dự Trữ Từ Master Data Giá</h3>
              </div>
              <button
                onClick={() => setIsProductPickerOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm theo SKU, tên sản phẩm, hãng..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-2 overflow-y-auto max-h-[50vh] divide-y divide-slate-100 text-xs">
              {filteredPickerProducts.length === 0 ? (
                <div className="p-6 text-center text-slate-400">Không tìm thấy sản phẩm nào phù hợp.</div>
              ) : (
                filteredPickerProducts.map((prod) => (
                  <div
                    key={prod.sku}
                    onClick={() => handleAddWarehousePlannedProduct(prod)}
                    className="p-2.5 hover:bg-indigo-50/50 rounded-lg flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <div className="font-mono font-bold text-blue-700">{prod.sku}</div>
                      <div className="font-semibold text-slate-900">{prod.name}</div>
                      <div className="text-[10px] text-slate-500">
                        Hãng: {prod.brand || 'Khác'} • ĐVT: {prod.unit || 'Bộ'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-md text-xs font-bold transition flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Chọn</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
