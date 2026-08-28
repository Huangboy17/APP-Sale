import React, { useState, useMemo, useEffect } from 'react';
import {
  Contract,
  Customer,
  StockOutVoucher,
  StockOutVoucherItem,
  ReserveItem,
  OrderItem,
  ProductPriceItem,
  InventoryItem,
} from '../../types';
import {
  generateStockOutVoucherNumber,
  getContractDeliverableItems,
  validateStockOutVoucher,
} from '../../services/stockOutService';
import { SelectCustomerModal } from './SelectCustomerModal';
import { SelectContractModal } from './SelectContractModal';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import {
  X,
  PackageCheck,
  Building,
  FileText,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Boxes,
  RotateCcw,
  Check,
  ShoppingCart,
} from 'lucide-react';

interface CreateStockOutVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdVoucher: StockOutVoucher) => void;
}

export const CreateStockOutVoucherModal: React.FC<CreateStockOutVoucherModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    customers,
    contracts,
    filteredReserveItems,
    filteredOrderItems,
    products,
    inventory,
    stockOutVouchers,
    createStockOutVoucher,
    confirmStockOutVoucher,
    currentUser,
  } = useApp();

  const productMap = useMemo(() => new Map(products.map((p) => [p.sku.trim().toUpperCase(), p])), [products]);
  const inventoryMap = useMemo(() => new Map(inventory.map((i) => [i.sku.trim().toUpperCase(), i])), [inventory]);

  // Modals for selection
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  // Selected Origin Source
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Form Fields
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().slice(0, 10));
  const [warehouseLocation, setWarehouseLocation] = useState('Kho Tổng TP.HCM');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voucher Items State (extracted automatically from Contract)
  const [items, setItems] = useState<StockOutVoucherItem[]>([]);

  // When selectedContract changes, automatically extract and load deliverable items
  useEffect(() => {
    if (selectedContract) {
      const deliverableItems = getContractDeliverableItems(
        selectedContract.id,
        filteredReserveItems,
        filteredOrderItems,
        productMap,
        inventoryMap
      );
      setItems(deliverableItems);
      setNotes(`Xuất kho giao hàng theo HĐ ${selectedContract.contractNumber} (Khách: ${selectedCustomer?.name || selectedContract.customerName || ''})`);
      setErrorMessage(null);
    } else {
      setItems([]);
    }
  }, [selectedContract, filteredReserveItems, filteredOrderItems, productMap, inventoryMap, selectedCustomer]);

  // Reset all state when opening modal
  useEffect(() => {
    if (isOpen) {
      setSelectedCustomer(null);
      setSelectedContract(null);
      setItems([]);
      setNotes('');
      setErrorMessage(null);
      setVoucherDate(new Date().toISOString().slice(0, 10));
      setWarehouseLocation('Kho Tổng TP.HCM');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(false);

    // If currently selected contract does not belong to this customer, reset contract
    if (selectedContract && selectedContract.customerId !== customer.id) {
      setSelectedContract(null);
      setItems([]);
    }

    // Auto open Contract modal next for smooth workflow
    setTimeout(() => {
      setIsContractModalOpen(true);
    }, 100);
  };

  const handleSelectContract = (contract: Contract, associatedCustomer?: Customer) => {
    setSelectedContract(contract);
    if (associatedCustomer) {
      setSelectedCustomer(associatedCustomer);
    } else if (!selectedCustomer || selectedCustomer.id !== contract.customerId) {
      const foundCust = customers.find((c) => c.id === contract.customerId);
      if (foundCust) setSelectedCustomer(foundCust);
    }
    setIsContractModalOpen(false);
  };

  const handleItemQtyChange = (itemId: string, maxAvailable: number, val: string) => {
    const parsed = parseInt(val, 10);
    const qty = isNaN(parsed) ? 0 : Math.max(0, Math.min(maxAvailable, parsed));
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  };

  const handleSetAllToMax = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        quantity: Math.max(0, item.availableToDeliverQuantity || 0),
      }))
    );
  };

  const handleResetAllToZero = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        quantity: 0,
      }))
    );
  };

  const totalDeliverablePossible = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.availableToDeliverQuantity || 0), 0);
  }, [items]);

  const totalExportingNow = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [items]);

  const activeItemsCount = useMemo(() => {
    return items.filter((it) => (Number(it.quantity) || 0) > 0).length;
  }, [items]);

  const handleSubmit = async (autoConfirm: boolean) => {
    if (!selectedContract) {
      setErrorMessage('Vui lòng chọn Hợp đồng nguồn để xuất kho!');
      return;
    }

    const validation = validateStockOutVoucher(selectedContract.id, items);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Dữ liệu phiếu xuất không hợp lệ!');
      return;
    }

    const validExportItems = items.filter((it) => (Number(it.quantity) || 0) > 0);
    if (validExportItems.length === 0) {
      setErrorMessage('Vui lòng nhập số lượng xuất lớn hơn 0 cho ít nhất một mặt hàng!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = createStockOutVoucher({
        date: voucherDate,
        contractId: selectedContract.id,
        contractNumber: selectedContract.contractNumber,
        customerId: selectedCustomer?.id || selectedContract.customerId,
        customerName: selectedCustomer?.name || selectedContract.customerName,
        warehouseLocation,
        status: 'DRAFT',
        items: validExportItems,
        totalQuantity: totalExportingNow,
        createdById: currentUser.id,
        createdByName: currentUser.name,
        notes: notes.trim(),
        organizationId: selectedContract.organizationId || '',
      });

      if (autoConfirm) {
        await confirmStockOutVoucher(created.id);
      }

      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error('Error creating stock out voucher:', err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi tạo phiếu xuất kho.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-700 via-red-700 to-rose-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">TẠO PHIẾU XUẤT KHO (STOCK OUT)</h3>
              <p className="text-xs text-rose-100/90">
                Xuất kho giao hàng theo Hợp đồng • Tự động trích xuất hàng giữ & hàng đặt đã về
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ERROR BANNER */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border-b border-rose-200 flex items-center space-x-2 text-rose-800 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          {/* ========================================================================= */}
          {/* KHU VỰC 1: THÔNG TIN NGUỒN XUẤT (Khách hàng & Hợp đồng) */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-rose-600" />
                <span>1. Thông Tin Nguồn Xuất Kho</span>
              </span>
              <span className="text-[11px] text-slate-500 italic">
                Chọn Khách hàng → Hợp đồng để hệ thống tự nạp danh mục hàng
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* SELECT CUSTOMER BUTTON / CARD */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Khách Hàng Nhận Hàng <span className="text-rose-500">*</span>
                </label>
                {selectedCustomer ? (
                  <div className="p-3 bg-rose-50/40 border border-rose-200 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                          {selectedCustomer.code || 'KH'}
                        </span>
                        <span className="font-bold text-xs text-slate-900">
                          {selectedCustomer.name}
                        </span>
                      </div>
                      {selectedCustomer.company && (
                        <div className="text-[11px] text-slate-500">{selectedCustomer.company}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCustomerModalOpen(true)}
                      className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Đổi KH
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="w-full p-3 bg-white border-2 border-dashed border-slate-300 hover:border-rose-400 hover:bg-rose-50/20 rounded-xl text-left transition cursor-pointer flex items-center justify-between group"
                  >
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-rose-700">
                      [ Chọn khách hàng ▼ ]
                    </span>
                    <Building className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                  </button>
                )}
              </div>

              {/* SELECT CONTRACT BUTTON / CARD */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hợp Đồng Nguồn <span className="text-rose-500">*</span>
                </label>
                {selectedContract ? (
                  <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2 py-0.2 rounded">
                          {selectedContract.contractNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Ký: {formatDate(selectedContract.contractDate || selectedContract.createdAt)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 font-medium truncate max-w-[280px]">
                        {selectedContract.title || selectedContract.customerName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsContractModalOpen(true)}
                      className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Đổi HĐ
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsContractModalOpen(true)}
                    className="w-full p-3 bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/20 rounded-xl text-left transition cursor-pointer flex items-center justify-between group"
                  >
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-700">
                      [ Chọn hợp đồng ▼ ]
                    </span>
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Sub-info: Date, Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ngày Xuất Kho</label>
                <input
                  type="date"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-rose-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kho Xuất Hàng</label>
                <input
                  type="text"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KHU VỰC 2: HÀNG HÓA CÓ THỂ XUẤT */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-rose-600" />
                <span className="font-bold text-slate-900 uppercase">
                  2. Danh Mục Hàng Hóa Có Thể Xuất Của Hợp Đồng ({items.length} mặt hàng)
                </span>
              </div>

              {items.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSetAllToMax}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs"
                  >
                    ⚡ Xuất tất cả có sẵn ({totalDeliverablePossible})
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAllToZero}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                  >
                    Đặt lại = 0
                  </button>
                </div>
              )}
            </div>

            {!selectedContract ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <ShoppingCart className="w-10 h-10 mx-auto text-slate-300" />
                <div>
                  <p className="text-xs font-semibold text-slate-600">
                    Chưa chọn Hợp đồng nguồn.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Vui lòng chọn Hợp đồng để hệ thống tự động tải danh sách hàng giữ và hàng đặt đã về.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(true)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs inline-flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Chọn Hợp Đồng Ngay</span>
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-amber-500" />
                <p className="text-xs font-bold text-slate-700">
                  Hợp đồng này không có mặt hàng nào trong danh mục Giữ hàng hoặc Đặt hàng đã về kho!
                </p>
                <p className="text-[11px] text-slate-500">
                  Hàng hóa cần được giữ kho hoặc hoàn tất nhập kho theo PO trước khi có thể xuất.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-3.5 py-3">Mã Hàng</th>
                      <th className="px-3.5 py-3">Tên Hàng</th>
                      <th className="px-3 py-3">Hãng</th>
                      <th className="px-3 py-3">ĐVT</th>
                      <th className="px-3 py-3 text-center bg-amber-50/50 border-x border-amber-100">Giữ Hàng</th>
                      <th className="px-3 py-3 text-center bg-blue-50/50 border-r border-blue-100">Đặt Đã Về</th>
                      <th className="px-3 py-3 text-center bg-slate-100 border-r border-slate-200">Đã Xuất</th>
                      <th className="px-3.5 py-3 text-center bg-emerald-50 text-emerald-950 border-r border-emerald-200">
                        Còn Có Thể Xuất
                      </th>
                      <th className="px-3.5 py-3 text-center bg-rose-50 text-rose-950 w-36">
                        Xuất Đợt Này
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {items.map((item) => {
                      const maxAvail = Number(item.availableToDeliverQuantity) || 0;
                      const currentExport = Number(item.quantity) || 0;
                      const isOverLimit = currentExport > maxAvail;
                      const isZero = currentExport === 0;

                      return (
                        <tr key={item.id || item.sku} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">
                            {item.sku}
                            <div className="mt-0.5">
                              {item.sourceType === 'RESERVE' && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded border border-amber-200">
                                  GIỮ HÀNG
                                </span>
                              )}
                              {item.sourceType === 'ORDER' && (
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1 py-0.2 rounded border border-blue-200">
                                  ĐẶT HÀNG
                                </span>
                              )}
                              {item.sourceType === 'HYBRID' && (
                                <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1 py-0.2 rounded border border-purple-200">
                                  KẾT HỢP
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-slate-900">
                            {item.productName}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 font-semibold">
                            {item.brand || 'Khác'}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 font-medium">
                            {item.unit || 'Bộ'}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-amber-800 bg-amber-50/20 border-x border-amber-100">
                            {item.reservedQuantity || 0}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-800 bg-blue-50/20 border-r border-blue-100">
                            {item.orderReceivedQuantity || 0}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-medium text-slate-500 bg-slate-50/50 border-r border-slate-200">
                            {item.previouslyDispatchedQuantity || 0}
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-mono font-black text-sm text-emerald-800 bg-emerald-50/40 border-r border-emerald-200">
                            {maxAvail}
                          </td>
                          <td className="px-3.5 py-2.5 text-center bg-rose-50/30">
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                max={maxAvail}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemQtyChange(item.id || item.sku, maxAvail, e.target.value)
                                }
                                disabled={maxAvail === 0}
                                className={`w-full px-2.5 py-1.5 text-center font-mono font-black text-xs rounded-lg border focus:ring-2 outline-hidden transition ${
                                  maxAvail === 0
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : isOverLimit
                                    ? 'border-rose-500 bg-rose-100 text-rose-900 ring-2 ring-rose-400'
                                    : isZero
                                    ? 'border-slate-300 bg-white text-slate-400'
                                    : 'border-rose-400 bg-white text-rose-900 font-bold'
                                }`}
                              />
                            </div>
                            {isOverLimit && (
                              <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                                Vượt quá ({maxAvail})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* KHU VỰC 3: GHI CHÚ & TỔNG KẾT */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              3. Ghi Chú & Xác Nhận Phiếu Xuất Kho
            </span>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Ghi chú phiếu xuất kho:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú về người nhận hàng, biển số xe, tình trạng bàn giao, đợt giao..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50/50 focus:ring-2 focus:ring-rose-500 focus:bg-white outline-hidden"
              />
            </div>

            {/* KPI Summary Bar */}
            <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Mặt hàng xuất đợt này</span>
                  <span className="text-lg font-black font-mono text-rose-300">
                    {activeItemsCount} / {items.length} <span className="text-xs font-normal text-slate-400">mã</span>
                  </span>
                </div>
                <div className="h-7 w-px bg-slate-700" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Tổng số lượng xuất</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {totalExportingNow.toLocaleString()} <span className="text-xs font-normal text-slate-400">sản phẩm</span>
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300">
                Tồn On Hand sẽ tự động giảm đúng <strong>{totalExportingNow}</strong> sản phẩm khi xác nhận xuất kho.
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition text-xs cursor-pointer shadow-2xs"
          >
            Hủy Bỏ
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || totalExportingNow <= 0 || !selectedContract}
              className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl transition text-xs cursor-pointer shadow-2xs flex items-center justify-center space-x-1"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Lưu Phiếu Nháp</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || totalExportingNow <= 0 || !selectedContract}
              className="flex-1 sm:flex-none px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl transition text-xs cursor-pointer shadow-2xs flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang Xử Lý...' : 'Tạo & Duyệt Xuất Kho Ngay'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SELECT CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <SelectCustomerModal
          isOpen={isCustomerModalOpen}
          customers={customers}
          contracts={contracts}
          reserveItems={filteredReserveItems}
          orderItems={filteredOrderItems}
          selectedCustomerId={selectedCustomer?.id}
          onSelect={handleSelectCustomer}
          onClose={() => setIsCustomerModalOpen(false)}
        />
      )}

      {/* SELECT CONTRACT MODAL */}
      {isContractModalOpen && (
        <SelectContractModal
          isOpen={isContractModalOpen}
          contracts={contracts}
          customers={customers}
          reserveItems={filteredReserveItems}
          orderItems={filteredOrderItems}
          selectedCustomerId={selectedCustomer?.id}
          selectedCustomerName={selectedCustomer?.name}
          selectedContractId={selectedContract?.id}
          onSelect={handleSelectContract}
          onClearCustomerFilter={() => setSelectedCustomer(null)}
          onClose={() => setIsContractModalOpen(false)}
        />
      )}
    </div>
  );
};
