import React, { useState, useEffect } from 'react';
import {
  Quotation,
  QuoteProductRow,
  PaymentMilestone,
  ProductPriceItem,
  Customer,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { formatVND, formatNumber, formatDate, numberToVietnameseWords } from '../../utils/formatters';
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
} from 'lucide-react';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToEdit?: Quotation | null;
  defaultCustomerId?: string | null;
}

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
    createQuotation,
    updateQuotation,
    finalizeQuoteToContract,
    getCustomerQuotations,
    setPdfPreviewData,
    addCustomer,
    setActiveTab,
  } = useApp();

  // Mode: attach to existing customer or new customer
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');

  // Customer selection / info
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustTaxCode, setNewCustTaxCode] = useState('');

  // Quotation header info
  const [quoteNumber, setQuoteNumber] = useState('');
  const [version, setVersion] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [taxRate, setTaxRate] = useState<number>(8); // 8% or 10%
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState(
    '1. Báo giá có hiệu lực trong vòng 30 ngày kể từ ngày phát hành.\n2. Giá đã bao gồm chi phí vận chuyển đến địa điểm thỏa thuận.\n3. Hàng hóa 100% chính hãng mới, đầy đủ chứng chỉ chất lượng CO/CQ.'
  );

  // Quote product rows
  const [items, setItems] = useState<QuoteProductRow[]>([]);

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

  // Product search picker
  const [selectedSkuToAdd, setSelectedSkuToAdd] = useState<string>('');

  // Contract closing confirm modal
  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Initialize or reset form
  useEffect(() => {
    if (quotationToEdit) {
      setCustomerMode('existing');
      setSelectedCustomerId(quotationToEdit.customerId);
      setQuoteNumber(quotationToEdit.quoteNumber);
      setVersion(quotationToEdit.version);
      setTitle(quotationToEdit.title);
      setDate(quotationToEdit.date);
      setValidUntil(quotationToEdit.validUntil);
      setTaxRate(quotationToEdit.taxRate || 8);
      setNotes(quotationToEdit.notes || '');
      setTermsAndConditions(quotationToEdit.termsAndConditions || '');
      setItems(quotationToEdit.items || []);
      setMilestones(quotationToEdit.milestones || []);
      setDeliveryAddress(quotationToEdit.customerAddress || '');
    } else {
      // New quote
      const targetCustId = defaultCustomerId || (customers[0]?.id || '');
      setSelectedCustomerId(targetCustId);
      setCustomerMode('existing');

      const targetCust = customers.find((c) => c.id === targetCustId);
      const existingQuotes = targetCust ? getCustomerQuotations(targetCust.id) : [];
      const nextVersion = existingQuotes.length + 1;

      const newQuoteNum = `BG-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}-V${nextVersion}`;
      setQuoteNumber(newQuoteNum);
      setVersion(nextVersion);
      setTitle(`Báo giá thiết bị công trình - Lần ${nextVersion}`);
      setDate(new Date().toISOString().split('T')[0]);
      setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setTaxRate(8);
      setNotes('');
      setDeliveryAddress(targetCust?.address || '');

      // Load 1 default item if products exist
      if (products.length > 0) {
        const firstProd = products[0];
        const inv = inventory.find((i) => i.sku === firstProd.sku);
        const avail = inv ? inv.availableQuantity : 0;
        setItems([
          {
            id: `row-${Date.now()}`,
            sku: firstProd.sku,
            name: firstProd.name,
            category: firstProd.category,
            brand: firstProd.brand,
            color: firstProd.color,
            size: firstProd.size,
            unit: firstProd.unit,
            listPrice: firstProd.listPrice,
            dpPrice: firstProd.dpPrice,
            quotedPrice: firstProd.listPrice,
            quantity: 10,
            discountPercent: 0,
            totalAmount: firstProd.listPrice * 10,
            inventoryAvailable: avail,
            isBelowDP: false,
          },
        ]);
      } else {
        setItems([]);
      }
    }
  }, [quotationToEdit, defaultCustomerId, isOpen]);

  // Recalculate Totals
  const subtotal = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const grandTotal = subtotal + taxAmount;

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

  // Add a product from Master Data
  const handleAddProductRow = () => {
    if (!selectedSkuToAdd) {
      if (products.length === 0) return;
      setSelectedSkuToAdd(products[0].sku);
    }
    const sku = selectedSkuToAdd || products[0]?.sku;
    const prod = products.find((p) => p.sku === sku);
    if (!prod) return;

    const inv = inventory.find((i) => i.sku === prod.sku);
    const avail = inv ? inv.availableQuantity : 0;

    const newRow: QuoteProductRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      sku: prod.sku,
      name: prod.name,
      category: prod.category,
      brand: prod.brand,
      color: prod.color,
      size: prod.size,
      unit: prod.unit,
      listPrice: prod.listPrice,
      dpPrice: prod.dpPrice,
      quotedPrice: prod.listPrice,
      quantity: 1,
      discountPercent: 0,
      totalAmount: prod.listPrice * 1,
      inventoryAvailable: avail,
      isBelowDP: false,
    };

    setItems([...items, newRow]);
  };

  // Update a product row
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
          newDiscount = row.listPrice > 0 ? Number((((row.listPrice - newQuotedPrice) / row.listPrice) * 100).toFixed(2)) : 0;
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
    setItems(items.filter((i) => i.id !== id));
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
    const newMs: PaymentMilestone = {
      id: `ms-${Date.now()}`,
      milestoneName: `Đợt ${milestones.length + 1}: Thanh toán bổ sung`,
      percentage: 10,
      amount: Math.round((grandTotal * 10) / 100),
      conditionDescription: 'Theo tiến độ công trình',
      status: 'pending',
    };
    setMilestones([...milestones, newMs]);
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  // Save Quote
  const handleSaveQuotation = (status: 'draft' | 'sent' | 'negotiating') => {
    if (items.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm vào báo giá!');
      return;
    }

    let customerId = selectedCustomerId;
    let customerObj = customers.find((c) => c.id === customerId);

    // If new customer mode, create customer first
    if (customerMode === 'new') {
      if (!newCustName.trim() || !newCustPhone.trim()) {
        alert('Vui lòng nhập tên khách hàng và số điện thoại');
        return;
      }
      const createdCust = addCustomer({
        name: newCustName,
        company: newCustCompany,
        phone: newCustPhone,
        email: newCustEmail,
        address: newCustAddress,
        taxCode: newCustTaxCode,
        stage: 'quoting',
        assignedToId: currentUser.id,
        assignedToName: currentUser.name,
        createdBy: currentUser.id,
        expectedValue: grandTotal,
      });
      customerId = createdCust.id;
      customerObj = createdCust;
    }

    if (!customerObj) {
      alert('Chưa chọn khách hàng');
      return;
    }

    const quotePayload = {
      quoteNumber,
      version,
      customerId,
      customerName: customerObj.name,
      customerPhone: customerObj.phone,
      customerEmail: customerObj.email,
      customerCompany: customerObj.company,
      customerAddress: customerObj.address,
      salesRepId: currentUser.id,
      salesRepName: currentUser.name,
      salesRepPhone: currentUser.phone,
      title,
      date,
      validUntil,
      items,
      subtotal,
      discountTotal: 0,
      taxRate,
      taxAmount,
      grandTotal,
      milestones,
      status,
      isContractQuote: false,
      notes,
      termsAndConditions,
    };

    if (quotationToEdit) {
      updateQuotation({
        ...quotePayload,
        id: quotationToEdit.id,
        createdAt: quotationToEdit.createdAt,
        updatedAt: new Date().toISOString().split('T')[0],
      });
    } else {
      createQuotation(quotePayload);
    }

    onClose();
  };

  // CHỐT BÁO GIÁ ĐỂ KÝ HỢP ĐỒNG (Triggers automatic split: Bảng Giữ Hàng & Bảng Đặt Hàng)
  const handleFinalizeContract = () => {
    // Save current quote first if new
    let customerId = selectedCustomerId;
    let customerObj = customers.find((c) => c.id === customerId);

    if (customerMode === 'new') {
      const createdCust = addCustomer({
        name: newCustName,
        company: newCustCompany,
        phone: newCustPhone,
        email: newCustEmail,
        address: newCustAddress,
        taxCode: newCustTaxCode,
        stage: 'quoting',
        assignedToId: currentUser.id,
        assignedToName: currentUser.name,
        createdBy: currentUser.id,
        expectedValue: grandTotal,
      });
      customerId = createdCust.id;
      customerObj = createdCust;
    }

    let targetQuote: Quotation;

    if (!quotationToEdit) {
      const savedQuote = createQuotation({
        quoteNumber,
        version,
        customerId,
        customerName: customerObj?.name || newCustName || 'Khách Hàng',
        customerPhone: customerObj?.phone || newCustPhone || '',
        customerEmail: customerObj?.email || newCustEmail || '',
        customerCompany: customerObj?.company || newCustCompany || '',
        customerAddress: customerObj?.address || newCustAddress || '',
        salesRepId: currentUser.id,
        salesRepName: currentUser.name,
        salesRepPhone: currentUser.phone,
        title,
        date,
        validUntil,
        items,
        subtotal,
        discountTotal: 0,
        taxRate,
        taxAmount,
        grandTotal,
        milestones,
        status: 'draft',
        isContractQuote: false,
        notes,
        termsAndConditions,
      });
      targetQuote = savedQuote;
    } else {
      const updatedQuote: Quotation = {
        ...quotationToEdit,
        customerId,
        customerName: customerObj?.name || quotationToEdit.customerName,
        customerPhone: customerObj?.phone || quotationToEdit.customerPhone,
        customerEmail: customerObj?.email || quotationToEdit.customerEmail,
        customerCompany: customerObj?.company || quotationToEdit.customerCompany,
        customerAddress: customerObj?.address || quotationToEdit.customerAddress,
        items,
        subtotal,
        taxRate,
        taxAmount,
        grandTotal,
        milestones,
        title,
        notes,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      updateQuotation(updatedQuote);
      targetQuote = updatedQuote;
    }

    // Call finalizeQuoteToContract with override targetQuote
    finalizeQuoteToContract(
      targetQuote.id,
      {
        deliveryDate,
        deliveryAddress: deliveryAddress || customerObj?.address || 'Tại chân công trình',
        customerTaxCode: customerObj?.taxCode,
        customerCompany: customerObj?.company,
        customerName: customerObj?.name || targetQuote.customerName,
        customerPhone: customerObj?.phone || targetQuote.customerPhone,
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

    // Open contracts tab
    setActiveTab('contracts');
  };

  // Preview PDF handler
  const handleOpenPDFPreview = () => {
    const customerObj = customers.find((c) => c.id === selectedCustomerId);
    const mockQuote: Quotation = {
      id: quotationToEdit?.id || 'quote-preview',
      quoteNumber,
      version,
      customerId: selectedCustomerId,
      customerName: customerObj?.name || newCustName || 'Khách Hàng',
      customerPhone: customerObj?.phone || newCustPhone || '',
      customerEmail: customerObj?.email || newCustEmail || '',
      customerCompany: customerObj?.company || newCustCompany || '',
      customerAddress: customerObj?.address || newCustAddress || '',
      salesRepId: currentUser.id,
      salesRepName: currentUser.name,
      salesRepPhone: currentUser.phone,
      title,
      date,
      validUntil,
      items,
      subtotal,
      discountTotal: 0,
      taxRate,
      taxAmount,
      grandTotal,
      milestones,
      status: quotationToEdit?.status || 'sent',
      isContractQuote: quotationToEdit?.isContractQuote || false,
      notes,
      termsAndConditions,
      createdAt: quotationToEdit?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setPdfPreviewData({ type: 'quote', data: mockQuote });
  };

  const hasAnyBelowDP = items.some((i) => i.isBelowDP);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {quotationToEdit ? `Chi Tiết Báo Giá: ${quoteNumber}` : 'Cửa Sổ Báo Giá Cho Nhân Viên'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                  Đợt Lần {version}
                </span>
                {quotationToEdit?.isContractQuote && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ Báo Giá Đã Chốt Ký HĐ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Gắn khách hàng cũ/mới, kiểm tra giá niêm yết vs giá DP, tự động tách giữ hàng & đặt hàng khi chốt.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs">
          {/* SECTION 1: Customer Selection */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Thông Tin Khách Hàng Báo Giá</span>
              </h4>

              {!quotationToEdit && (
                <div className="flex items-center space-x-1 bg-white p-0.5 rounded border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCustomerMode('existing')}
                    className={`px-2.5 py-0.5 rounded font-semibold text-[11px] transition ${
                      customerMode === 'existing'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Gắn khách đã có
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('new')}
                    className={`px-2.5 py-0.5 rounded font-semibold text-[11px] transition ${
                      customerMode === 'new'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + Tạo khách mới
                  </button>
                </div>
              )}
            </div>

            {customerMode === 'existing' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Chọn Khách Hàng Cụ Thể Trong Danh Sách <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      const found = customers.find((c) => c.id === e.target.value);
                      if (found) {
                        const existing = getCustomerQuotations(found.id);
                        setVersion(existing.length + 1);
                        setDeliveryAddress(found.address || '');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-hidden font-medium"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected customer quick details */}
                {(() => {
                  const cust = customers.find((c) => c.id === selectedCustomerId);
                  if (!cust) return null;
                  return (
                    <div className="sm:col-span-2 bg-white p-2.5 rounded-lg border border-slate-200 flex flex-wrap gap-x-6 gap-y-1 text-slate-600 text-[11px]">
                      <div>
                        <span className="text-slate-400">Điện thoại:</span>{' '}
                        <span className="font-semibold text-slate-800">{cust.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Email:</span>{' '}
                        <span className="font-medium text-slate-800">{cust.email || 'Chưa có'}</span>
                      </div>
                      <div className="w-full">
                        <span className="text-slate-400">Địa chỉ:</span>{' '}
                        <span className="text-slate-800">{cust.address || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* New customer form */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tên Khách Hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn A"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Số Điện Thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 0912 345 678"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Công Ty / Tổ Chức
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Công ty Decor Mới"
                    value={newCustCompany}
                    onChange={(e) => setNewCustCompany(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Địa Chỉ Giao Hàng / Dự Án
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Số 12 Đường A, Quận 2, TP.HCM"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="khachhang@gmail.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Quote Meta Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-white p-3.5 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Số Báo Giá / Mã
              </label>
              <input
                type="text"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-blue-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Đợt Báo Giá (Lần)
              </label>
              <input
                type="number"
                min={1}
                value={version}
                onChange={(e) => setVersion(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Ngày Báo Giá
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Hiệu Lực Đến Ngày
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tiêu Đề / Tên Dự Án Báo Giá
              </label>
              <input
                type="text"
                placeholder="VD: Báo giá trọn gói thiết bị chiếu sáng & công tắc biệt thự..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-medium text-slate-900 text-xs"
              />
            </div>
          </div>

          {/* SECTION 3: PRODUCTS TABLE (Data Giá & DP check) */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Danh Sách Sản Phẩm & Kiểm Tra Giá DP (Giá Sàn)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Mã SKU xuyên suốt data giá, tồn kho. Cảnh báo nếu giá bán thấp hơn Giá DP (Giá tối thiểu).
                </p>
              </div>

              {/* Add Product Selector */}
              <div className="flex items-center space-x-2">
                <select
                  value={selectedSkuToAdd}
                  onChange={(e) => setSelectedSkuToAdd(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white text-xs max-w-xs truncate font-medium"
                >
                  <option value="">-- Chọn sản phẩm từ Data Giá --</option>
                  {products.map((p) => {
                    const inv = inventory.find((i) => i.sku === p.sku);
                    const avail = inv ? inv.availableQuantity : 0;
                    return (
                      <option key={p.sku} value={p.sku}>
                        [{p.sku}] {p.name} - Tồn: {avail} {p.unit}
                      </option>
                    );
                  })}
                </select>

                <button
                  type="button"
                  onClick={handleAddProductRow}
                  className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-700 transition flex items-center space-x-1 shrink-0 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Sản Phẩm</span>
                </button>
              </div>
            </div>

            {/* Warning if any item below DP */}
            {hasAnyBelowDP && (
              <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-300 flex items-start space-x-2 text-rose-900">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">CẢNH BÁO: CÓ SẢN PHẨM BÁN DƯỚI GIÁ DP (GIÁ SÀN TỐI THIỂU)!</div>
                  <div className="text-[11px] text-rose-700">
                    Một hoặc nhiều dòng sản phẩm có đơn giá chào bán thấp hơn Giá DP quy định của công ty. Cần sự phê duyệt của Cấp 1 (Trưởng phòng/Giám đốc).
                  </div>
                </div>
              </div>
            )}

            {/* Product Table */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-2.5 py-2 w-10 text-center">STT</th>
                    <th className="px-2.5 py-2 w-36">Mã SKU & Hãng</th>
                    <th className="px-2.5 py-2 min-w-[180px]">Tên Hàng & Quy Cách</th>
                    <th className="px-2.5 py-2 w-20 text-center">Tồn Khả Dụng</th>
                    <th className="px-2.5 py-2 w-20 text-center">SL Bán</th>
                    <th className="px-2.5 py-2 w-24 text-right">Giá Niêm Yết</th>
                    <th className="px-2.5 py-2 w-24 text-right bg-amber-50 text-amber-900">Giá DP (Sàn)</th>
                    <th className="px-2.5 py-2 w-24 text-right">Đơn Giá Bán</th>
                    <th className="px-2.5 py-2 w-14 text-center">% CK</th>
                    <th className="px-2.5 py-2 w-28 text-right">Thành Tiền</th>
                    <th className="px-2.5 py-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-3 py-6 text-center text-slate-400">
                        Chưa có sản phẩm nào trong báo giá. Hãy chọn sản phẩm và bấm "Thêm Sản Phẩm".
                      </td>
                    </tr>
                  ) : (
                    items.map((row, idx) => {
                      const willBeReserved = Math.min(row.quantity, row.inventoryAvailable);
                      const willBeOrdered = Math.max(0, row.quantity - row.inventoryAvailable);

                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50 transition ${
                            row.isBelowDP ? 'bg-rose-50/60' : ''
                          }`}
                        >
                          <td className="px-2.5 py-1.5 text-center font-medium text-slate-500">{idx + 1}</td>
                          <td className="px-2.5 py-1.5">
                            <div className="font-mono font-bold text-blue-700">{row.sku}</div>
                            <div className="text-[10px] text-slate-500">Hãng: {row.brand}</div>
                          </td>
                          <td className="px-2.5 py-1.5">
                            <div className="font-bold text-slate-900">{row.name}</div>
                            <div className="text-[10px] text-slate-500">
                              {row.color} • {row.size}
                            </div>
                            <div className="mt-0.5 flex items-center space-x-1 text-[10px]">
                              {willBeOrdered > 0 ? (
                                <span className="text-amber-700 bg-amber-100 px-1 py-0.2 rounded font-medium">
                                  ⚡ Giữ {willBeReserved} {row.unit} | Đặt {willBeOrdered} {row.unit}
                                </span>
                              ) : (
                                <span className="text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded font-medium">
                                  ✓ Đủ kho (Giữ {willBeReserved} {row.unit})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
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
                          <td className="px-2.5 py-1.5 text-center">
                            <input
                              type="number"
                              min={1}
                              value={row.quantity}
                              onChange={(e) => handleUpdateRow(row.id, 'quantity', e.target.value)}
                              className="w-14 px-1.5 py-1 text-center font-bold border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-medium text-slate-600">
                            {formatNumber(row.listPrice)}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-bold text-amber-900 bg-amber-50/50">
                            {formatNumber(row.dpPrice)}
                          </td>
                          <td className="px-2.5 py-1.5 text-right">
                            <input
                              type="number"
                              value={row.quotedPrice}
                              onChange={(e) => handleUpdateRow(row.id, 'quotedPrice', e.target.value)}
                              className={`w-20 px-1.5 py-1 text-right font-bold border rounded focus:ring-1 ${
                                row.isBelowDP
                                  ? 'border-rose-400 bg-rose-100 text-rose-900 focus:ring-rose-500'
                                  : 'border-slate-300 focus:ring-blue-500'
                              }`}
                            />
                            {row.isBelowDP && (
                              <div className="text-[9px] text-rose-600 font-bold mt-0.5">DƯỚI GIÁ DP!</div>
                            )}
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={row.discountPercent}
                              onChange={(e) => handleUpdateRow(row.id, 'discountPercent', e.target.value)}
                              className="w-12 px-1 py-1 text-center text-xs border border-slate-300 rounded"
                            />
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-bold text-slate-900 font-mono">
                            {formatVND(row.totalAmount)}
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 transition"
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

            {/* Totals Summary Card */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-3.5 rounded-lg border border-slate-200 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-slate-500">
                  Tổng số lượng sản phẩm:{' '}
                  <span className="font-bold text-slate-800">
                    {items.reduce((sum, i) => sum + i.quantity, 0)} cái/bộ
                  </span>
                </div>
                <div className="text-[11px] text-slate-700 italic">
                  Bằng chữ: <span className="font-semibold text-slate-900">{numberToVietnameseWords(grandTotal)}</span>
                </div>
              </div>

              <div className="text-right space-y-1 w-full sm:w-72">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Tiền hàng trước thuế:</span>
                  <span className="font-bold font-mono">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Thuế VAT:</span>
                  <div className="flex items-center space-x-1">
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value={0}>0%</option>
                      <option value={8}>8% VAT</option>
                      <option value={10}>10% VAT</option>
                    </select>
                    <span className="font-bold font-mono">{formatVND(taxAmount)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs font-extrabold text-blue-900 pt-1 border-t border-slate-200">
                  <span>TỔNG CỘNG:</span>
                  <span className="text-sm text-blue-700 font-mono">{formatVND(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: PAYMENT MILESTONES (Các mốc tạm ứng / thanh toán) */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Kế Hoạch Tạm Ứng & Các Mốc Thanh Toán Hợp Đồng</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Quy định rõ các đợt tạm ứng, đặt cọc, thanh toán khi giao hàng và thanh lý nghiệm thu.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-700 flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm Mốc</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {milestones.map((ms) => (
                <div
                  key={ms.id}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                >
                  <div className="flex-1 space-y-1 w-full sm:w-auto">
                    <input
                      type="text"
                      value={ms.milestoneName}
                      onChange={(e) => handleUpdateMilestone(ms.id, 'milestoneName', e.target.value)}
                      className="font-bold text-xs text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-hidden w-full"
                    />
                    <input
                      type="text"
                      placeholder="Điều kiện thanh toán..."
                      value={ms.conditionDescription}
                      onChange={(e) => handleUpdateMilestone(ms.id, 'conditionDescription', e.target.value)}
                      className="text-[11px] text-slate-500 border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-hidden w-full"
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
                        className="w-12 px-1.5 py-0.5 text-center font-bold text-xs border border-slate-300 rounded"
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

          {/* SECTION 5: Terms & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Điều Khoản Thương Mại & Giao Hàng
              </label>
              <textarea
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Ghi Chú Đàm Phán / Yêu Cầu Đặc Biệt
              </label>
              <textarea
                rows={3}
                placeholder="Ghi chú nội bộ về lịch sử đàm phán, chiết khấu đặc biệt cho khách..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleOpenPDFPreview}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold flex items-center space-x-1 shadow-2xs transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Xem & Xuất PDF Báo Giá</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={() => handleSaveQuotation('sent')}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded transition shadow-2xs"
            >
              Lưu Bản Báo Giá (Lần {version})
            </button>

            {/* CRITICAL BUTTON: CHỐT BÁO GIÁ ĐỂ KÝ HỢP ĐỒNG */}
            <button
              type="button"
              onClick={() => setIsConfirmCloseModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-2xs transition active:scale-95 flex items-center space-x-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Chốt Báo Giá & Ký Hợp Đồng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Close & Sign Contract */}
      {isConfirmCloseModalOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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

            <div className="p-4 space-y-3 text-xs text-slate-700">
              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 font-medium">
                Khi xác nhận chốt, hệ thống sẽ tự động thực hiện:
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px]">
                  <li>
                    Chuyển báo giá <strong>{quoteNumber}</strong> thành <strong>Báo Giá Ký Hợp Đồng</strong>.
                  </li>
                  <li>Cập nhật khách hàng sang giai đoạn <strong>Chốt - Đã Ký HĐ</strong>.</li>
                  <li className="font-bold text-emerald-950">
                    TỰ ĐỘNG TẠO 2 BẢNG:
                    <div className="text-emerald-700 font-normal">↳ 1 Bảng Giữ Hàng (Mã còn tồn kho, khóa số lượng).</div>
                    <div className="text-amber-700 font-normal">↳ 1 Bảng Đặt Hàng (Mã thiếu/hết tồn kho).</div>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Ngày Giao Hàng Dự Kiến Theo Hợp Đồng
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Địa Điểm Giao Hàng & Nghiệm Thu
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="VD: Giao tại chân công trình biệt thự Chateau, Quận 7..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500">Tổng giá trị hợp đồng:</div>
                  <div className="text-sm font-extrabold text-emerald-700 font-mono">{formatVND(grandTotal)}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmCloseModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalizeContract}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-2xs transition"
                  >
                    Xác Nhận & Tạo HĐ
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
