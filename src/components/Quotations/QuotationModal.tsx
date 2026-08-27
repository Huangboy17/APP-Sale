import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Quotation,
  QuoteProductRow,
  PaymentMilestone,
  ProductPriceItem,
  Customer,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { formatVND, formatNumber, formatDate, numberToVietnameseWords } from '../../utils/formatters';
import { ProductPickerModal } from './ProductPickerModal';
import { CustomerPickerStep } from './CustomerPickerStep';
import confetti from 'canvas-confetti';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  FileText,
  FileSignature,
  Printer,
  Sparkles,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Phone,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info,
  Edit,
  Download,
  Eye,
  RotateCcw,
  Check,
  MapPin,
  Mail,
  Hash,
  Clock,
  HelpCircle,
  Percent,
} from 'lucide-react';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToEdit?: Quotation | null;
  defaultCustomerId?: string | null;
}

type WizardStep = 'customer' | 'builder' | 'preview';

export const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  quotationToEdit,
  defaultCustomerId,
}) => {
  const {
    currentUser,
    customers,
    products,
    inventory,
    quotations,
    createQuotation,
    updateQuotation,
    finalizeQuoteToContract,
    getCustomerQuotations,
    setPdfPreviewData,
    addCustomer,
    setActiveTab,
  } = useApp();

  // Wizard Step
  const [currentStep, setCurrentStep] = useState<WizardStep>('customer');

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Product Picker Modal state
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  // Quotation header info
  const [quoteNumber, setQuoteNumber] = useState('');
  const [version, setVersion] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [taxRate, setTaxRate] = useState<number>(8); // 8% or 10%
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [warrantyTerms, setWarrantyTerms] = useState('Bảo hành 24 tháng chính hãng. 1 đổi 1 trong vòng 30 ngày nếu phát sinh lỗi kỹ thuật.');
  const [termsAndConditions, setTermsAndConditions] = useState(
    '1. Báo giá có hiệu lực trong vòng 30 ngày kể từ ngày phát hành.\n2. Giá đã bao gồm chi phí vận chuyển đến địa điểm thỏa thuận.\n3. Hàng hóa 100% chính hãng mới, đầy đủ chứng chỉ chất lượng CO/CQ.'
  );

  // Quote product rows
  const [items, setItems] = useState<QuoteProductRow[]>([]);

  // Active info tab in Step 2
  const [activeInfoTab, setActiveInfoTab] = useState<'milestones' | 'delivery' | 'terms' | 'notes'>('milestones');

  // Payment milestones (Tạm ứng & thanh toán)
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([
    {
      id: 'ms-default-1',
      milestoneName: 'Đợt 1: Tạm ứng khi ký Hợp đồng',
      percentage: 30,
      amount: 0,
      conditionDescription: 'Tạm ứng 30% giá trị hợp đồng trong vòng 03 ngày sau khi ký HĐ',
      status: 'pending',
    },
    {
      id: 'ms-default-2',
      milestoneName: 'Đợt 2: Thanh toán khi giao hàng đến chân công trình',
      percentage: 50,
      amount: 0,
      conditionDescription: 'Thanh toán 50% ngay sau khi giao hàng và ký biên bản giao nhận',
      status: 'pending',
    },
    {
      id: 'ms-default-3',
      milestoneName: 'Đợt 3: Quyết toán & Thanh lý HĐ',
      percentage: 20,
      amount: 0,
      conditionDescription: 'Thanh toán 20% còn lại sau khi bàn giao nghiệm thu & xuất hóa đơn VAT',
      status: 'pending',
    },
  ]);

  // Contract closing confirm modal
  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState(false);

  // Track if modal was already opened to only initialize once per session
  const prevIsOpenRef = useRef(false);
  const prevEditIdRef = useRef<string | null>(null);

  // Initialize or reset form based on edit / new mode ONLY when modal opens or target quote changes
  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      prevEditIdRef.current = null;
      return;
    }

    const isFirstOpen = !prevIsOpenRef.current;
    const editQuoteId = quotationToEdit?.id || null;
    const isEditTargetChanged = editQuoteId !== prevEditIdRef.current;

    // Only run initialization on first modal open or when edit target actually changes
    if (isFirstOpen || isEditTargetChanged) {
      prevIsOpenRef.current = true;
      prevEditIdRef.current = editQuoteId;

      if (quotationToEdit) {
        // Editing existing quote -> directly open builder
        const cust = customers.find((c) => c.id === quotationToEdit.customerId) || null;
        setSelectedCustomer(cust);
        setQuoteNumber(quotationToEdit.quoteNumber);
        setVersion(quotationToEdit.version);
        setTitle(quotationToEdit.title);
        setDate(quotationToEdit.date);
        setValidUntil(quotationToEdit.validUntil);
        setTaxRate(quotationToEdit.taxRate || 8);
        setDiscountTotal(quotationToEdit.discountTotal || 0);
        setNotes(quotationToEdit.notes || '');
        setTermsAndConditions(quotationToEdit.termsAndConditions || '');
        setItems(quotationToEdit.items || []);
        setMilestones(quotationToEdit.milestones || []);
        setDeliveryAddress(quotationToEdit.customerAddress || cust?.address || '');
        setCurrentStep('builder');
      } else {
        // New quote
        if (defaultCustomerId) {
          const cust = customers.find((c) => c.id === defaultCustomerId);
          if (cust) {
            setupNewQuoteForCustomer(cust);
            setCurrentStep('builder');
            return;
          }
        }

        // Default: Step 1 (Customer Selection)
        setSelectedCustomer(null);
        setItems([]);
        setCurrentStep('customer');
      }
    }
  }, [quotationToEdit, defaultCustomerId, isOpen]);

  // Helper: Setup new quote headers & versioning for a customer
  const setupNewQuoteForCustomer = (cust: Customer, resetItems: boolean = true) => {
    setSelectedCustomer(cust);
    const existingQuotes = getCustomerQuotations(cust.id);
    const nextVersion = existingQuotes.length + 1;
    const newQuoteNum = `BG-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}-V${nextVersion}`;

    setQuoteNumber(newQuoteNum);
    setVersion(nextVersion);
    setTitle(`Báo giá thiết bị công trình - Lần ${nextVersion}`);
    setDate(new Date().toISOString().split('T')[0]);
    setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setTaxRate(8);
    setDiscountTotal(0);
    setNotes('');
    setDeliveryAddress(cust.address || '');

    if (resetItems) {
      setItems([]);
    }
  };

  // Recalculate Totals
  const subtotal = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const grandTotal = taxableAmount + taxAmount;

  // Auto update milestone amounts when grandTotal changes
  useEffect(() => {
    setMilestones((prev) =>
      prev.map((m) => ({
        ...m,
        amount: Math.round((grandTotal * m.percentage) / 100),
      }))
    );
  }, [grandTotal]);

  if (!isOpen) return null;

  // Add or merge product from ProductPickerModal
  const handleAddProductFromPicker = (newRow: QuoteProductRow, mode: 'append' | 'merge' = 'merge') => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.sku === newRow.sku);
      if (existingIdx >= 0 && mode === 'merge') {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const combinedQty = existing.quantity + newRow.quantity;
        const totalAmount = newRow.quotedPrice * combinedQty;
        updated[existingIdx] = {
          ...existing,
          quotedPrice: newRow.quotedPrice,
          quantity: combinedQty,
          discountPercent: newRow.discountPercent,
          totalAmount,
          isBelowDP: newRow.isBelowDP,
          notes: newRow.notes || existing.notes,
        };
        return updated;
      }
      return [...prev, newRow];
    });
  };

  // Inline product row update
  const handleUpdateRow = (
    id: string,
    field: 'quotedPrice' | 'quantity' | 'discountPercent' | 'notes',
    value: any
  ) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        let newQuotedPrice = row.quotedPrice;
        let newQty = row.quantity;
        let newDiscount = row.discountPercent;
        let newNotes = row.notes;

        if (field === 'quotedPrice') {
          newQuotedPrice = Math.max(0, Number(value) || 0);
          newDiscount = row.listPrice > 0 
            ? (newQuotedPrice >= row.listPrice ? 0 : Number((((row.listPrice - newQuotedPrice) / row.listPrice) * 100).toFixed(1)))
            : 0;
        } else if (field === 'discountPercent') {
          newDiscount = Math.max(0, Math.min(100, Number(value) || 0));
          newQuotedPrice = Math.round(row.listPrice * (1 - newDiscount / 100));
        } else if (field === 'quantity') {
          newQty = Math.max(1, Number(value) || 1);
        } else if (field === 'notes') {
          newNotes = value;
        }

        const isBelowDP = newQuotedPrice < row.dpPrice;
        const totalAmount = newQuotedPrice * newQty;

        return {
          ...row,
          quotedPrice: newQuotedPrice,
          discountPercent: newDiscount,
          quantity: newQty,
          totalAmount,
          isBelowDP,
          notes: newNotes,
        };
      })
    );
  };

  const handleRemoveRow = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Milestone change handler
  const handleUpdateMilestone = (
    id: string,
    field: 'milestoneName' | 'percentage' | 'conditionDescription' | 'expectedDate',
    val: any
  ) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, [field]: val };
        if (field === 'percentage') {
          updated.amount = Math.round((grandTotal * Number(val)) / 100);
        }
        return updated;
      })
    );
  };

  const handleAddMilestone = () => {
    setMilestones((prev) => {
      const newMs: PaymentMilestone = {
        id: `ms-${Date.now()}`,
        milestoneName: `Đợt ${prev.length + 1}: Thanh toán bổ sung`,
        percentage: 10,
        amount: Math.round((grandTotal * 10) / 100),
        conditionDescription: 'Theo tiến độ thực tế công trình',
        status: 'pending',
      };
      return [...prev, newMs];
    });
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  // Construct standard quotation payload
  const buildQuotationPayload = (status: 'draft' | 'sent' | 'negotiating' = 'sent'): Quotation => {
    return {
      id: quotationToEdit?.id || `quote-${Date.now()}`,
      quoteNumber,
      version,
      customerId: selectedCustomer?.id || '',
      customerName: selectedCustomer?.name || 'Khách Hàng',
      customerPhone: selectedCustomer?.phone || '',
      customerEmail: selectedCustomer?.email || '',
      customerCompany: selectedCustomer?.company || '',
      customerAddress: deliveryAddress || selectedCustomer?.address || '',
      salesRepId: currentUser.id,
      salesRepName: currentUser.name,
      salesRepPhone: currentUser.phone,
      title: title.trim() || `Báo giá thiết bị - Lần ${version}`,
      date,
      validUntil,
      items,
      subtotal,
      discountTotal,
      taxRate,
      taxAmount,
      grandTotal,
      milestones,
      status,
      isContractQuote: quotationToEdit?.isContractQuote || false,
      contractId: quotationToEdit?.contractId,
      notes,
      termsAndConditions,
      createdAt: quotationToEdit?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
  };

  // Save Quotation (Draft or Sent)
  const handleSaveQuotation = (status: 'draft' | 'sent') => {
    if (!selectedCustomer) {
      alert('Vui lòng chọn khách hàng trước khi lưu báo giá!');
      setCurrentStep('customer');
      return;
    }

    if (items.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm vào báo giá!');
      return;
    }

    const payload = buildQuotationPayload(status);

    if (quotationToEdit) {
      updateQuotation(payload);
    } else {
      createQuotation(payload);
    }

    onClose();
  };

  // CHỐT BÁO GIÁ ĐỂ KÝ HỢP ĐỒNG
  const handleFinalizeContract = () => {
    if (!selectedCustomer) {
      alert('Chưa chọn khách hàng');
      return;
    }

    if (items.length === 0) {
      alert('Báo giá chưa có sản phẩm nào!');
      return;
    }

    let targetQuote: Quotation;
    const payload = buildQuotationPayload('draft');

    if (!quotationToEdit) {
      targetQuote = createQuotation(payload);
    } else {
      updateQuotation(payload);
      targetQuote = payload;
    }

    // Call finalizeQuoteToContract with contract overrides
    finalizeQuoteToContract(
      targetQuote.id,
      {
        deliveryDate,
        deliveryAddress: deliveryAddress || selectedCustomer.address || 'Tại chân công trình',
        customerTaxCode: selectedCustomer.taxCode,
        customerCompany: selectedCustomer.company,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
      },
      targetQuote
    );

    // Launch confetti!
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });

    setIsConfirmCloseModalOpen(false);
    onClose();
    setActiveTab('contracts');
  };

  // Direct PDF Preview
  const handleOpenPDFPreview = () => {
    if (!selectedCustomer) {
      alert('Vui lòng chọn khách hàng!');
      return;
    }
    const mockQuote = buildQuotationPayload('sent');
    setPdfPreviewData({ type: 'quote', data: mockQuote });
  };

  const hasAnyBelowDP = items.some((i) => i.isBelowDP);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-50 rounded-xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95 duration-150">
        {/* TOP WIZARD BAR */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold tracking-tight">
                  {quotationToEdit ? `Chỉnh Sửa Báo Giá: ${quoteNumber}` : 'Quy Trình Tạo Báo Giá Thông Minh'}
                </h3>
                {selectedCustomer && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    BÁO GIÁ LẦN {version}
                  </span>
                )}
                {quotationToEdit?.isContractQuote && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                    ✓ Đã chốt HĐ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                {currentStep === 'customer' && 'Bước 1: Chọn khách hàng hoặc tạo mới'}
                {currentStep === 'builder' && 'Bước 2: Chọn sản phẩm thông minh, nhập giá bán & cấu hình điều khoản'}
                {currentStep === 'preview' && 'Bước 3: Xem trước bản in báo giá & xuất PDF'}
              </p>
            </div>
          </div>

          {/* Stepper Navigation Pills */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setCurrentStep('customer')}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center space-x-1 ${
                currentStep === 'customer'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>1. Khách Hàng</span>
              {selectedCustomer && <Check className="w-3 h-3 text-emerald-400" />}
            </button>

            <button
              onClick={() => {
                if (!selectedCustomer) {
                  alert('Vui lòng chọn khách hàng trước!');
                  return;
                }
                setCurrentStep('builder');
              }}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center space-x-1 ${
                currentStep === 'builder'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>2. Lập Báo Giá ({items.length} SP)</span>
            </button>

            <button
              onClick={() => {
                if (!selectedCustomer) {
                  alert('Vui lòng chọn khách hàng trước!');
                  return;
                }
                setCurrentStep('preview');
              }}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center space-x-1 ${
                currentStep === 'preview'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>3. Xem Trước & Lưu</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-slate-800 text-xs space-y-4">
          {/* ============================================================== */}
          {/* STEP 1: CUSTOMER SELECTION / CREATION                          */}
          {/* ============================================================== */}
          {currentStep === 'customer' && (
            <CustomerPickerStep
              customers={customers}
              quotations={quotations}
              selectedCustomer={selectedCustomer}
              onSelectExistingCustomer={(cust) => {
                setupNewQuoteForCustomer(cust);
              }}
              onCreateNewCustomer={(custData) => {
                const created = addCustomer({
                  ...custData,
                  stage: 'quoting',
                  assignedToId: currentUser.id,
                  assignedToName: currentUser.name,
                  createdBy: currentUser.id,
                  expectedValue: 0,
                });
                setupNewQuoteForCustomer(created);
                return created;
              }}
              onProceedToBuilder={() => {
                setCurrentStep('builder');
              }}
            />
          )}

          {/* ============================================================== */}
          {/* STEP 2: QUOTATION BUILDER & PRODUCT PICKER WORKSPACE           */}
          {/* ============================================================== */}
          {currentStep === 'builder' && selectedCustomer && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* HEADER INFO & CUSTOMER CARD ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* 1. CUSTOMER CARD */}
                <div className="lg:col-span-1 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>Khách Hàng</span>
                      </span>
                      <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                        {selectedCustomer.code}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{selectedCustomer.name}</h4>
                    {selectedCustomer.company && (
                      <div className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{selectedCustomer.company}</span>
                      </div>
                    )}

                    <div className="space-y-0.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-800">{selectedCustomer.phone}</span>
                      </div>
                      {selectedCustomer.email && (
                        <div className="flex items-center space-x-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{selectedCustomer.email}</span>
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-start space-x-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                          <span className="text-slate-700 truncate">{selectedCustomer.address}</span>
                        </div>
                      )}
                      {selectedCustomer.taxCode && (
                        <div className="flex items-center space-x-1.5">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span>MST: {selectedCustomer.taxCode}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Lịch sử: {getCustomerQuotations(selectedCustomer.id).length} lần báo giá
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep('customer')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Thay đổi khách hàng</span>
                    </button>
                  </div>
                </div>

                {/* 2. QUOTATION META INFO */}
                <div className="lg:col-span-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Thông Tin Hồ Sơ Báo Giá</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                        BÁO GIÁ LẦN {version}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Phụ trách: <strong className="text-slate-800">{currentUser.name}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Số Báo Giá</label>
                      <input
                        type="text"
                        value={quoteNumber}
                        onChange={(e) => setQuoteNumber(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-blue-700 text-xs bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Lần Báo Giá</label>
                      <div className="px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-md font-extrabold text-blue-800 text-xs">
                        Lần {version}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Ngày Báo Giá</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Hiệu Lực Đến</label>
                      <input
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Tiêu Đề / Tên Dự Án Báo Giá</label>
                      <input
                        type="text"
                        placeholder="VD: Báo giá thiết bị vệ sinh & phụ kiện cao cấp biệt thự..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-900 text-xs bg-slate-50/30 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PRODUCTS SECTION */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Danh Sách Sản Phẩm Báo Giá</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Bảng tổng hợp các mã hàng chào bán, giá niêm yết, giá DP và tồn kho khả dụng.
                    </p>
                  </div>

                  {/* BIG PROMINENT BUTTON: + THÊM SẢN PHẨM */}
                  <button
                    type="button"
                    onClick={() => setIsProductPickerOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition active:scale-95 flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ THÊM SẢN PHẨM THÔNG MINH</span>
                  </button>
                </div>

                {/* Warning: Below DP Floor */}
                {hasAnyBelowDP && (
                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-300 flex items-start space-x-2 text-rose-900">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">CẢNH BÁO: CÓ SẢN PHẨM BÁN DƯỚI GIÁ DP (GIÁ SÀN QUY ĐỊNH)!</div>
                      <div className="text-[11px] text-rose-700">
                        Một hoặc nhiều sản phẩm có đơn giá chào bán thấp hơn Giá DP. Báo giá này sẽ cần sự duyệt giá từ Cấp 1 (Quản lý/Giám đốc).
                      </div>
                    </div>
                  </div>
                )}

                {/* Products Table */}
                <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs min-w-[950px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="px-2.5 py-2 w-10 text-center">STT</th>
                        <th className="px-2.5 py-2 w-36">Mã SP & Hãng</th>
                        <th className="px-2.5 py-2 min-w-[200px]">Tên Sản Phẩm & Quy Cách</th>
                        <th className="px-2.5 py-2 w-28 text-center">Tồn Khả Dụng</th>
                        <th className="px-2.5 py-2 w-20 text-center">Số Lượng</th>
                        <th className="px-2.5 py-2 w-24 text-right">Giá Niêm Yết</th>
                        <th className="px-2.5 py-2 w-24 text-right bg-amber-50 text-amber-900">Giá DP (Sàn)</th>
                        <th className="px-2.5 py-2 w-28 text-right font-bold text-blue-900">Giá Bán</th>
                        <th className="px-2.5 py-2 w-16 text-center">% CK</th>
                        <th className="px-2.5 py-2 w-28 text-right">Thành Tiền</th>
                        <th className="px-2.5 py-2 w-10 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-4 py-8 text-center bg-slate-50/50">
                            <div className="max-w-md mx-auto space-y-2 text-slate-400">
                              <Layers className="w-8 h-8 mx-auto text-slate-300" />
                              <div className="text-xs font-bold text-slate-700">Chưa có sản phẩm nào trong báo giá</div>
                              <p className="text-[11px] text-slate-400">
                                Hãy bấm nút <strong className="text-blue-600 font-bold">+ Thêm sản phẩm</strong> ở trên để tìm kiếm và thêm sản phẩm từ danh mục giá & kho.
                              </p>
                              <button
                                type="button"
                                onClick={() => setIsProductPickerOpen(true)}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                              >
                                + Mở Bộ Chọn Sản Phẩm
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        items.map((row, idx) => {
                          const willBeReserved = Math.min(row.quantity, row.inventoryAvailable);
                          const willBeOrdered = Math.max(0, row.quantity - row.inventoryAvailable);

                          return (
                            <tr
                              key={row.id}
                              className={`hover:bg-slate-50 transition ${row.isBelowDP ? 'bg-rose-50/60' : ''}`}
                            >
                              <td className="px-2.5 py-2 text-center font-medium text-slate-500">{idx + 1}</td>
                              <td className="px-2.5 py-2">
                                <div className="font-mono font-bold text-blue-700">{row.sku}</div>
                                <div className="text-[10px] text-slate-500 font-semibold">{row.brand}</div>
                              </td>
                              <td className="px-2.5 py-2">
                                <div className="font-bold text-slate-900">{row.name}</div>
                                <div className="text-[10px] text-slate-500">
                                  {row.category} {row.color ? `• ${row.color}` : ''} {row.size ? `• ${row.size}` : ''}
                                </div>
                                <div className="mt-0.5 text-[10px]">
                                  {willBeOrdered > 0 ? (
                                    <span className="text-amber-700 bg-amber-100 px-1 py-0.2 rounded font-semibold">
                                      ⚡ Giữ {willBeReserved} {row.unit} | Đặt thêm {willBeOrdered} {row.unit}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded font-semibold">
                                      ✓ Đủ kho (Giữ {willBeReserved} {row.unit})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2.5 py-2 text-center">
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                    row.inventoryAvailable === 0
                                      ? 'bg-rose-100 text-rose-800'
                                      : row.inventoryAvailable < row.quantity
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {row.inventoryAvailable} {row.unit}
                                </span>
                              </td>
                              <td className="px-2.5 py-2 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  value={row.quantity}
                                  onChange={(e) => handleUpdateRow(row.id, 'quantity', e.target.value)}
                                  className="w-14 px-1.5 py-1 text-center font-bold border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 text-xs"
                                />
                              </td>
                              <td className="px-2.5 py-2 text-right font-medium text-slate-600">
                                {formatNumber(row.listPrice)}
                              </td>
                              <td className="px-2.5 py-2 text-right font-bold text-amber-900 bg-amber-50/50">
                                {formatNumber(row.dpPrice)}
                              </td>
                              <td className="px-2.5 py-2 text-right">
                                <input
                                  type="number"
                                  value={row.quotedPrice}
                                  onChange={(e) => handleUpdateRow(row.id, 'quotedPrice', e.target.value)}
                                  className={`w-24 px-2 py-1 text-right font-bold font-mono border rounded-md focus:ring-2 text-xs ${
                                    row.isBelowDP
                                      ? 'border-rose-400 bg-rose-100 text-rose-900 focus:ring-rose-500'
                                      : 'border-slate-300 bg-white text-slate-900 focus:ring-blue-500'
                                  }`}
                                />
                                {row.isBelowDP && (
                                  <div className="text-[9px] text-rose-600 font-bold mt-0.5">DƯỚI GIÁ DP!</div>
                                )}
                              </td>
                              <td className="px-2.5 py-2 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.1}
                                  value={row.discountPercent}
                                  onChange={(e) => handleUpdateRow(row.id, 'discountPercent', e.target.value)}
                                  className="w-12 px-1 py-1 text-center text-xs border border-slate-300 rounded-md"
                                />
                              </td>
                              <td className="px-2.5 py-2 text-right font-bold text-slate-900 font-mono text-xs">
                                {formatVND(row.totalAmount)}
                              </td>
                              <td className="px-2.5 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(row.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* TOTALS & SUMMARY CARD */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 text-white p-4 rounded-xl shadow-md gap-4">
                  <div className="space-y-1 max-w-lg">
                    <div className="text-xs text-slate-300">
                      Tổng số lượng: <strong className="text-white">{items.reduce((s, i) => s + i.quantity, 0)}</strong> sản phẩm / quy cách
                    </div>
                    <div className="text-[11px] text-slate-300 italic">
                      Số tiền bằng chữ:{' '}
                      <span className="font-semibold text-amber-300">{numberToVietnameseWords(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="w-full lg:w-80 space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Tạm tính tiền hàng:</span>
                      <span className="font-bold font-mono text-white">{formatVND(subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Chiết khấu tổng thêm:</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min={0}
                          value={discountTotal}
                          onChange={(e) => setDiscountTotal(Math.max(0, Number(e.target.value) || 0))}
                          className="w-24 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-right text-xs font-mono text-amber-300"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Thuế VAT:</span>
                      <div className="flex items-center space-x-1">
                        <select
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                          className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        >
                          <option value={0}>0%</option>
                          <option value={8}>8% VAT</option>
                          <option value={10}>10% VAT</option>
                        </select>
                        <span className="font-bold font-mono text-white">{formatVND(taxAmount)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-700 text-sm font-black text-white">
                      <span className="text-xs uppercase tracking-wider text-blue-300">TỔNG THANH TOÁN:</span>
                      <span className="text-base text-amber-400 font-mono">{formatVND(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2 BOTTOM: CONDITIONS, PAYMENT MILESTONES & TERMS TABS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setActiveInfoTab('milestones')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
                        activeInfoTab === 'milestones' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Kế Hoạch Thanh Toán ({milestones.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveInfoTab('delivery')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
                        activeInfoTab === 'delivery' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Giao Hàng & Bảo Hành</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveInfoTab('terms')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
                        activeInfoTab === 'terms' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>Điều Khoản Chuẩn</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveInfoTab('notes')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 ${
                        activeInfoTab === 'notes' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Ghi Chú Đàm Phán</span>
                    </button>
                  </div>
                </div>

                {/* TAB CONTENT: MILESTONES */}
                {activeInfoTab === 'milestones' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Cấu hình các đợt tạm ứng, thanh toán khi giao hàng và thanh lý nghiệm thu:
                      </span>
                      <button
                        type="button"
                        onClick={handleAddMilestone}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Thêm Đợt</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {milestones.map((ms) => (
                        <div
                          key={ms.id}
                          className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                        >
                          <div className="flex-1 space-y-1 w-full sm:w-auto">
                            <input
                              type="text"
                              value={ms.milestoneName}
                              onChange={(e) => handleUpdateMilestone(ms.id, 'milestoneName', e.target.value)}
                              className="font-bold text-xs text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-hidden w-full bg-transparent"
                            />
                            <input
                              type="text"
                              placeholder="Điều kiện thanh toán..."
                              value={ms.conditionDescription}
                              onChange={(e) => handleUpdateMilestone(ms.id, 'conditionDescription', e.target.value)}
                              className="text-[11px] text-slate-500 border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-hidden w-full bg-transparent"
                            />
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={ms.percentage}
                                onChange={(e) => handleUpdateMilestone(ms.id, 'percentage', e.target.value)}
                                className="w-12 px-1.5 py-0.5 text-center font-bold text-xs bg-white border border-slate-300 rounded"
                              />
                              <span className="font-bold text-slate-600">%</span>
                            </div>

                            <div className="w-28 text-right font-bold text-xs text-blue-700 font-mono">
                              {formatVND(ms.amount)}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(ms.id)}
                              className="text-slate-300 hover:text-rose-500 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: DELIVERY & WARRANTY */}
                {activeInfoTab === 'delivery' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Địa Điểm Giao Hàng Dự Kiến
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="VD: Giao tại chân công trình, Villa 12 Sala..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Thời Gian Giao Hàng Dự Kiến
                      </label>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Chế Độ Bảo Hành & Chứng Nhận (CO/CQ)
                      </label>
                      <textarea
                        rows={2}
                        value={warrantyTerms}
                        onChange={(e) => setWarrantyTerms(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: TERMS */}
                {activeInfoTab === 'terms' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Điều Khoản Thương Mại Tiêu Chuẩn Của Báo Giá
                    </label>
                    <textarea
                      rows={4}
                      value={termsAndConditions}
                      onChange={(e) => setTermsAndConditions(e.target.value)}
                      className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                )}

                {/* TAB CONTENT: NOTES */}
                {activeInfoTab === 'notes' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ghi Chú Đàm Phán / Lưu Ý Nội Bộ
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Ghi chú về yêu cầu riêng của khách hàng, lịch sử thỏa thuận giảm giá..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: PREVIEW & FINAL SUMMARY                                */}
          {/* ============================================================== */}
          {currentStep === 'preview' && selectedCustomer && (
            <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg space-y-6 text-xs text-slate-800">
                {/* Header Preview */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-700 text-white font-black text-lg flex items-center justify-center">
                      SF
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm uppercase text-slate-900">
                        CÔNG TY CỔ PHẦN CÔNG NGHỆ & THIẾT BỊ SALESFLOW
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        Nhà phân phối thiết bị vệ sinh, điện, chiếu sáng và vật tư công trình chính hãng
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 rounded-md text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                      BÁO GIÁ LẦN {version}
                    </span>
                    <div className="font-mono font-bold text-xs text-blue-700 mt-1">{quoteNumber}</div>
                    <div className="text-[10px] text-slate-400">Ngày: {formatDate(date)}</div>
                  </div>
                </div>

                {/* Customer and Sales Rep Preview Box */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <div className="font-bold text-xs text-slate-900 uppercase">Kính gửi khách hàng:</div>
                    <div className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</div>
                    {selectedCustomer.company && (
                      <div className="font-semibold text-slate-600">{selectedCustomer.company}</div>
                    )}
                    <div className="text-slate-500">SĐT: {selectedCustomer.phone} | Email: {selectedCustomer.email || 'N/A'}</div>
                    <div className="text-slate-500">Địa chỉ: {deliveryAddress || selectedCustomer.address || 'N/A'}</div>
                  </div>

                  <div className="space-y-1 text-right">
                    <div className="font-bold text-xs text-slate-900 uppercase">Đơn vị chào giá:</div>
                    <div className="font-bold text-slate-800 text-sm">SalesFlow Project Solutions</div>
                    <div className="text-slate-600">Đại diện: {currentUser.name}</div>
                    <div className="text-slate-500">Hotline: {currentUser.phone || '1900 6868'}</div>
                    <div className="text-slate-500">Hiệu lực đến: {formatDate(validUntil)}</div>
                  </div>
                </div>

                {/* Items Summary Table */}
                <div>
                  <div className="font-bold text-xs text-slate-900 mb-2">BẢNG KÊ SẢN PHẨM & ĐƠN GIÁ</div>
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-100 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2 w-8 text-center">STT</th>
                        <th className="p-2 w-28">Mã SKU</th>
                        <th className="p-2">Tên Hàng & Quy Cách</th>
                        <th className="p-2 w-12 text-center">ĐVT</th>
                        <th className="p-2 w-14 text-center">SL</th>
                        <th className="p-2 w-24 text-right">Đơn Giá Bán</th>
                        <th className="p-2 w-28 text-right">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((row, idx) => (
                        <tr key={row.id}>
                          <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-blue-700">{row.sku}</td>
                          <td className="p-2 font-medium text-slate-900">
                            {row.name}
                            <div className="text-[10px] text-slate-400">
                              Hãng: {row.brand} {row.color ? `• ${row.color}` : ''}
                            </div>
                          </td>
                          <td className="p-2 text-center text-slate-600">{row.unit}</td>
                          <td className="p-2 text-center font-bold text-slate-800">{row.quantity}</td>
                          <td className="p-2 text-right font-mono">{formatVND(row.quotedPrice)}</td>
                          <td className="p-2 text-right font-bold font-mono text-slate-900">{formatVND(row.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown */}
                <div className="flex justify-between items-start bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-700">Thanh toán bằng chuyển khoản hoặc tiền mặt</div>
                    <div className="italic text-slate-500 text-[11px]">
                      Số tiền bằng chữ: <strong className="text-slate-900">{numberToVietnameseWords(grandTotal)}</strong>
                    </div>
                  </div>

                  <div className="space-y-1 text-right w-64">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tiền hàng:</span>
                      <span className="font-bold font-mono">{formatVND(subtotal)}</span>
                    </div>
                    {discountTotal > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Chiết khấu:</span>
                        <span className="font-bold font-mono">-{formatVND(discountTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>Thuế VAT ({taxRate}%):</span>
                      <span className="font-bold font-mono">{formatVND(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-blue-900 pt-1 border-t border-slate-300">
                      <span>TỔNG CỘNG:</span>
                      <span className="text-base text-blue-700 font-mono">{formatVND(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Terms Preview */}
                <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-200 pt-3">
                  <div className="font-bold text-slate-900">ĐIỀU KHOẢN VÀ ĐIỀU KIỆN:</div>
                  <pre className="font-sans whitespace-pre-line text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                    {termsAndConditions}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS (STICKY) */}
        <div className="px-4 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-lg">
          <div className="flex items-center space-x-2">
            {currentStep === 'builder' && (
              <button
                type="button"
                onClick={() => setCurrentStep('customer')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                ← Quay lại khách hàng
              </button>
            )}

            {currentStep === 'preview' && (
              <button
                type="button"
                onClick={() => setCurrentStep('builder')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                ← Quay lại sửa sản phẩm
              </button>
            )}

            {currentStep !== 'customer' && (
              <button
                type="button"
                onClick={handleOpenPDFPreview}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Xem & Xuất PDF A4</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition"
            >
              Đóng
            </button>

            {currentStep === 'builder' && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep('preview')}
                  className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem Trước Báo Giá</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveQuotation('draft')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                >
                  Lưu Bản Nháp
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveQuotation('sent')}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                >
                  Lưu Báo Giá (Lần {version})
                </button>

                <button
                  type="button"
                  onClick={() => setIsConfirmCloseModalOpen(true)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition active:scale-95 flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Chốt Báo Giá & Ký HĐ</span>
                </button>
              </>
            )}

            {currentStep === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveQuotation('draft')}
                  className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
                >
                  Lưu Bản Nháp
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveQuotation('sent')}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Lưu Chính Thức (Lần {version})
                </button>

                <button
                  type="button"
                  onClick={() => setIsConfirmCloseModalOpen(true)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95 flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Chốt Báo Giá & Ký HĐ</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SMART PRODUCT PICKER MODAL */}
      <ProductPickerModal
        isOpen={isProductPickerOpen}
        onClose={() => setIsProductPickerOpen(false)}
        products={products}
        inventory={inventory}
        existingItems={items}
        onAddProduct={handleAddProductFromPicker}
      />

      {/* CONFIRMATION MODAL TO FINALIZE & CREATE CONTRACT */}
      {isConfirmCloseModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs text-slate-800">
            <div className="px-4 py-3 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSignature className="w-4 h-4" />
                <h3 className="font-bold text-sm">Xác Nhận Chốt Báo Giá & Tạo Hợp Đồng</h3>
              </div>
              <button
                onClick={() => setIsConfirmCloseModalOpen(false)}
                className="text-emerald-100 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 font-medium space-y-1">
                <div>
                  Khách hàng: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.code})
                </div>
                <div>
                  Số báo giá: <strong>{quoteNumber}</strong> (Đợt lần {version})
                </div>
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px]">
                  <li>Chuyển trạng thái khách hàng sang <strong>"Đã Chốt - Đã Ký HĐ"</strong>.</li>
                  <li className="font-bold text-emerald-950">
                    TỰ ĐỘNG TÁCH 2 BẢNG KHO:
                    <div className="text-emerald-700 font-normal">↳ 1 Bảng Giữ Hàng (Mã còn tồn kho, khóa số lượng).</div>
                    <div className="text-amber-700 font-normal">↳ 1 Bảng Đặt Hàng (Mã thiếu/hết tồn kho).</div>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Ngày Giao Hàng Dự Kiến Theo Hợp Đồng
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Địa Điểm Giao Hàng & Nghiệm Thu
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="VD: Giao tại chân công trình biệt thự, Số 12 Sala..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Tổng giá trị hợp đồng:</div>
                  <div className="text-sm font-extrabold text-emerald-700 font-mono">{formatVND(grandTotal)}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmCloseModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalizeContract}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                  >
                    Xác Nhận & Sinh HĐ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
