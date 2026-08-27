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
import { QuotationHeaderFooterConfig, HeaderFooterConfigState } from './QuotationHeaderFooterConfig';
import { StandardQuotationDocument } from './StandardQuotationDocument';
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
  ChevronUp,
  ChevronDown,
  FolderPlus,
  ArrowUpDown,
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
    companyInfo,
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

  // Section / Room grouping state
  const [sections, setSections] = useState<string[]>([
    'Phần I: Khu Vực WC Master',
    'Phần II: Khu Vực WC Khách',
  ]);
  const [activeSectionForPicker, setActiveSectionForPicker] = useState<string>('Phần I: Khu Vực WC Master');
  const [isAddingSection, setIsAddingSection] = useState<boolean>(false);
  const [newSectionName, setNewSectionName] = useState<string>('');
  const [editingSection, setEditingSection] = useState<{ original: string; current: string } | null>(null);

  // Active info tab in Step 2
  const [activeInfoTab, setActiveInfoTab] = useState<'header_footer' | 'milestones' | 'delivery' | 'terms' | 'notes'>('header_footer');

  // Header & Footer customizable settings state (Inherited from Master Company Settings)
  const [headerFooterConfig, setHeaderFooterConfig] = useState<HeaderFooterConfigState>(() => ({
    quoteTitle: 'BÁO GIÁ THIẾT BỊ VỆ SINH',
    orderCode: '01/HHG',
    quoteDate: new Date().toISOString().split('T')[0],
    validUntilDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    customerName: 'CÔNG TRÌNH NHÀ CHỊ HẠNH',
    projectLocation: 'STARLAKE',
    customerPhone: '0978 322 208',
    contactPerson: 'CHỊ HUYỀN',
    companyName: companyInfo?.name || 'CÔNG TY TNHH HHG HOLDINGS',
    companyAddress: companyInfo?.address || 'Số 5-6-7 The Premier, Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
    companyHotline: companyInfo?.phone || companyInfo?.hotline || '+84 243 821 6666',
    companyWebsite: companyInfo?.website || 'www.hhg.vn',
    companyEmail: companyInfo?.email || 'info@hhg.vn',
    salesRepName: currentUser?.name || 'Nguyễn Thị Hương',
    salesRepPhone: currentUser?.phone || '0978322208',
    salesRepEmail: currentUser?.email || 'huongnt@hhg.vn',
    openingGreeting: `Thay mặt ${companyInfo?.name || 'Công ty TNHH HHG HOLDINGS'}, xin hân hạnh gửi đến quý khách xác nhận đơn hàng gồm các hạng mục như sau:`,
    priceTerms: '- VNĐ, đã bao gồm thuế VAT và chưa bao gồm chi phí lắp đặt.\n- Khối lượng là tạm tính, giá trị thanh toán là khối lượng giao nhận thực tế.',
    deliveryTerms: 'Starlake',
    shippingTerms: 'Miễn phí giao hàng đến chân công trình vào các ngày thứ 3 và thứ 5 hàng tuần trong nội thành Hà Nội',
    warrantyTerms: 'Bảo hành 24 tháng',
    leadTimeTerms: '180 ngày kể từ ngày nhận tạm ứng',
    closingNotes: `Mọi thông tin cần làm rõ, Quý khách vui lòng liên hệ với nhân viên phụ trách hoặc ${companyInfo?.name || 'Công ty TNHH HHG Holdings'};\nChân thành cám ơn Quý khách!`,
    signatoryTitle: companyInfo?.name || 'CÔNG TY TNHH HHG HOLDINGS',
  }));

  // Handler: Apply HHG Holdings Template
  const handleApplyHHGTemplate = () => {
    setHeaderFooterConfig((prev) => ({
      ...prev,
      quoteTitle: 'BÁO GIÁ THIẾT BỊ VỆ SINH',
      orderCode: '01/HHG',
      customerName: selectedCustomer ? `CÔNG TRÌNH NHÀ ${selectedCustomer.name.toUpperCase()}` : 'CÔNG TRÌNH NHÀ CHỊ HẠNH',
      projectLocation: selectedCustomer?.address || 'STARLAKE',
      customerPhone: selectedCustomer?.phone || '0978 322 208',
      contactPerson: selectedCustomer?.name || 'CHỊ HUYỀN',
      companyName: 'CÔNG TY TNHH HHG HOLDINGS',
      companyAddress: 'Số 5-6-7 The Premier, Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
      companyHotline: '+84 243 821 6666',
      companyWebsite: 'www.hhg.vn',
      companyEmail: 'info@hhg.vn',
      salesRepName: currentUser?.name || 'Nguyễn Thị Hương',
      salesRepPhone: currentUser?.phone || '0978322208',
      salesRepEmail: currentUser?.email || 'huongnt@hhg.vn',
      openingGreeting: 'Thay mặt Công ty TNHH HHG HOLDINGS, xin hân hạnh gửi đến quý khách xác nhận đơn hàng gồm các hạng mục như sau:',
      priceTerms: '- VNĐ, đã bao gồm thuế VAT và chưa bao gồm chi phí lắp đặt.\n- Khối lượng là tạm tính, giá trị thanh toán là khối lượng giao nhận thực tế.',
      deliveryTerms: selectedCustomer?.address || 'Starlake',
      shippingTerms: 'Miễn phí giao hàng đến chân công trình vào các ngày thứ 3 và thứ 5 hàng tuần trong nội thành Hà Nội',
      warrantyTerms: 'Bảo hành 24 tháng',
      leadTimeTerms: '180 ngày kể từ ngày nhận tạm ứng',
      closingNotes: 'Mọi thông tin cần làm rõ, Quý khách vui lòng liên hệ với nhân viên phụ trách hoặc Công ty TNHH HHG Holdings;\nChân thành cám ơn Quý khách!',
      signatoryTitle: 'CÔNG TY TNHH HHG HOLDINGS',
    }));
  };

  // Handler: Apply Standard SalesFlow Template
  const handleApplyDefaultTemplate = () => {
    setHeaderFooterConfig((prev) => ({
      ...prev,
      quoteTitle: 'BÁO GIÁ THIẾT BỊ HOÀN THIỆN & CHIẾU SÁNG',
      orderCode: quoteNumber || `BG-${new Date().getFullYear()}-001`,
      customerName: selectedCustomer?.company || selectedCustomer?.name || 'KHÁCH HÀNG DỰ ÁN',
      projectLocation: selectedCustomer?.address || 'Tại chân công trình',
      customerPhone: selectedCustomer?.phone || '',
      contactPerson: selectedCustomer?.name || '',
      companyName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ & THIẾT BỊ SALESFLOW',
      companyAddress: 'Tòa nhà Bitexco Financial Tower, Số 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM',
      companyHotline: '1900 6868 - (028) 3822 9999',
      companyWebsite: 'www.salesflow.vn',
      companyEmail: 'contact@salesflow.vn',
      salesRepName: currentUser?.name || 'Chuyên viên tư vấn dự án',
      salesRepPhone: currentUser?.phone || '1900 6868',
      salesRepEmail: currentUser?.email || 'sales@salesflow.vn',
      openingGreeting: 'Thay mặt Công ty Cổ phần Công nghệ & Thiết bị SalesFlow, trân trọng gửi đến Quý khách bảng báo giá chi tiết như sau:',
      priceTerms: '- Đơn giá VNĐ, đã bao gồm thuế GTGT (VAT).\n- Báo giá có hiệu lực trong vòng 30 ngày kể từ ngày phát hành.',
      deliveryTerms: deliveryAddress || selectedCustomer?.address || 'Giao hàng tận nơi chân công trình',
      shippingTerms: 'Miễn phí vận chuyển nội thành cho đơn hàng từ 20.000.000 VNĐ trở lên',
      warrantyTerms: 'Bảo hành 24-36 tháng chính hãng theo tiêu chuẩn của nhà sản xuất',
      leadTimeTerms: 'Giao hàng trong vòng 03 - 07 ngày làm việc sau khi nhận tạm ứng',
      closingNotes: 'Rất mong nhận được sự hợp tác và phản hồi từ Quý khách hàng;\nTrân trọng cảm ơn!',
      signatoryTitle: 'CÔNG TY CP CÔNG NGHỆ & THIẾT BỊ SALESFLOW',
    }));
  };

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
        
        // Extract existing sections from quote items
        if (quotationToEdit.items && quotationToEdit.items.length > 0) {
          const loadedSecs: string[] = [];
          quotationToEdit.items.forEach((it) => {
            const sec = it.category?.trim() || 'Phần I: Khu Vực WC Master';
            if (!loadedSecs.includes(sec)) {
              loadedSecs.push(sec);
            }
          });
          if (loadedSecs.length > 0) {
            setSections(loadedSecs);
            setActiveSectionForPicker(loadedSecs[0]);
          }
        }

        setMilestones(quotationToEdit.milestones || []);
        setDeliveryAddress(quotationToEdit.customerAddress || cust?.address || '');

        setHeaderFooterConfig({
          quoteTitle: quotationToEdit.title || 'BÁO GIÁ THIẾT BỊ VỆ SINH',
          orderCode: quotationToEdit.orderCode || quotationToEdit.quoteNumber || '01/HHG',
          quoteDate: quotationToEdit.date || new Date().toISOString().split('T')[0],
          validUntilDate: quotationToEdit.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          customerName: quotationToEdit.customerName || (cust?.name ? `CÔNG TRÌNH NHÀ ${cust.name.toUpperCase()}` : 'CÔNG TRÌNH NHÀ CHỊ HẠNH'),
          projectLocation: quotationToEdit.projectLocation || quotationToEdit.customerAddress || cust?.address || 'STARLAKE',
          customerPhone: quotationToEdit.customerPhone || cust?.phone || '0978 322 208',
          contactPerson: quotationToEdit.contactPerson || cust?.name || 'CHỊ HUYỀN',
          companyName: quotationToEdit.companyName || 'CÔNG TY TNHH HHG HOLDINGS',
          companyAddress: quotationToEdit.companyAddress || 'Số 5-6-7 The Premier, Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
          companyHotline: quotationToEdit.companyHotline || '+84 243 821 6666',
          companyWebsite: quotationToEdit.companyWebsite || 'www.hhg.vn',
          companyEmail: quotationToEdit.companyEmail || 'info@hhg.vn',
          salesRepName: quotationToEdit.salesRepName || currentUser.name,
          salesRepPhone: quotationToEdit.salesRepPhone || currentUser.phone || '0978322208',
          salesRepEmail: quotationToEdit.salesRepEmail || currentUser.email || 'huongnt@hhg.vn',
          openingGreeting: quotationToEdit.openingGreeting || 'Thay mặt Công ty TNHH HHG HOLDINGS, xin hân hạnh gửi đến quý khách xác nhận đơn hàng gồm các hạng mục như sau:',
          priceTerms: quotationToEdit.priceTerms || '- VNĐ, đã bao gồm thuế VAT và chưa bao gồm chi phí lắp đặt.\n- Khối lượng là tạm tính, giá trị thanh toán là khối lượng giao nhận thực tế.',
          deliveryTerms: quotationToEdit.deliveryTerms || quotationToEdit.customerAddress || cust?.address || 'Starlake',
          shippingTerms: quotationToEdit.shippingTerms || 'Miễn phí giao hàng đến chân công trình vào các ngày thứ 3 và thứ 5 hàng tuần trong nội thành Hà Nội',
          warrantyTerms: quotationToEdit.warrantyTerms || 'Bảo hành 24 tháng',
          leadTimeTerms: quotationToEdit.leadTimeTerms || '180 ngày kể từ ngày nhận tạm ứng',
          closingNotes: quotationToEdit.closingNotes || 'Mọi thông tin cần làm rõ, Quý khách vui lòng liên hệ với nhân viên phụ trách hoặc Công ty TNHH HHG Holdings;\nChân thành cám ơn Quý khách!',
          signatoryTitle: quotationToEdit.signatoryTitle || quotationToEdit.companyName || 'CÔNG TY TNHH HHG HOLDINGS',
        });

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
    setTitle(`BÁO GIÁ THIẾT BỊ VỆ SINH`);
    setDate(new Date().toISOString().split('T')[0]);
    setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setTaxRate(8);
    setDiscountTotal(0);
    setNotes('');
    setDeliveryAddress(cust.address || '');

    setHeaderFooterConfig((prev) => ({
      ...prev,
      quoteTitle: 'BÁO GIÁ THIẾT BỊ VỆ SINH',
      orderCode: '01/HHG',
      quoteDate: new Date().toISOString().split('T')[0],
      validUntilDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      customerName: cust.company || `CÔNG TRÌNH NHÀ ${cust.name.toUpperCase()}`,
      projectLocation: cust.address || 'STARLAKE',
      customerPhone: cust.phone || '0978 322 208',
      contactPerson: cust.name || 'CHỊ HUYỀN',
      deliveryTerms: cust.address || 'Starlake',
    }));

    if (resetItems) {
      setItems([]);
    }
  };

  // Recalculate Totals
  const subtotal = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const grandTotal = taxableAmount + taxAmount;

  // Effective list of sections (including any custom category on items)
  const allSections = useMemo(() => {
    const list = [...sections];
    items.forEach((it) => {
      const cat = it.category?.trim() || 'Phần I: Khu Vực WC Master';
      if (!list.includes(cat)) {
        list.push(cat);
      }
    });
    return list.length > 0 ? list : ['Phần I: Khu Vực WC Master'];
  }, [sections, items]);

  // Group items by Section for the builder view
  const itemsBySection = useMemo(() => {
    const map: Record<string, QuoteProductRow[]> = {};
    allSections.forEach((sec) => {
      map[sec] = [];
    });
    items.forEach((it) => {
      const sec = it.category?.trim() || allSections[0] || 'Phần I: Khu Vực WC Master';
      if (!map[sec]) {
        map[sec] = [];
      }
      map[sec].push(it);
    });
    return map;
  }, [allSections, items]);

  // Calculate subtotal per section
  const sectionSubtotals = useMemo(() => {
    const totals: Record<string, number> = {};
    allSections.forEach((sec) => {
      const groupItems = itemsBySection[sec] || [];
      totals[sec] = groupItems.reduce((sum, item) => sum + (item.totalAmount || (item.quotedPrice * item.quantity)), 0);
    });
    return totals;
  }, [allSections, itemsBySection]);

  // Section Management Handlers
  const handleAddSection = (name?: string) => {
    const rawName = (name || newSectionName).trim();
    if (!rawName) return;
    if (!sections.includes(rawName)) {
      setSections((prev) => [...prev, rawName]);
    }
    setActiveSectionForPicker(rawName);
    setNewSectionName('');
    setIsAddingSection(false);
  };

  const handleRenameSection = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingSection(null);
      return;
    }
    setSections((prev) => prev.map((s) => (s === oldName ? trimmed : s)));
    setItems((prev) =>
      prev.map((it) => ((it.category?.trim() || '') === oldName ? { ...it, category: trimmed } : it))
    );
    if (activeSectionForPicker === oldName) {
      setActiveSectionForPicker(trimmed);
    }
    setEditingSection(null);
  };

  const handleDeleteSection = (secName: string) => {
    if (allSections.length <= 1) {
      alert('Báo giá cần có ít nhất 1 phần / khu vực!');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa phần "${secName}"? Các sản phẩm trong phần này sẽ được chuyển sang phần đầu tiên.`)) {
      const remaining = allSections.filter((s) => s !== secName);
      const fallbackSec = remaining[0] || 'Phần I: Khu Vực Chung';
      setSections(remaining);
      setItems((prev) =>
        prev.map((it) => ((it.category?.trim() || '') === secName ? { ...it, category: fallbackSec } : it))
      );
      if (activeSectionForPicker === secName) {
        setActiveSectionForPicker(fallbackSec);
      }
    }
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= allSections.length) return;
    const updated = [...allSections];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setSections(updated);
  };

  const handleMoveItemToSection = (itemId: string, targetSection: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, category: targetSection } : it))
    );
  };

  const handleOpenPickerForSection = (secName: string) => {
    setActiveSectionForPicker(secName);
    setIsProductPickerOpen(true);
  };

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

  // Add or merge product from ProductPickerModal (Matching SKU AND Category/Section)
  const handleAddProductFromPicker = (newRow: QuoteProductRow, mode: 'append' | 'merge' = 'merge') => {
    setItems((prev) => {
      const targetSec = newRow.category || activeSectionForPicker || 'Phần I: Khu Vực WC Master';
      const rowWithSec: QuoteProductRow = {
        ...newRow,
        category: targetSec,
      };

      const existingIdx = prev.findIndex(
        (i) => i.sku === rowWithSec.sku && (i.category?.trim() || '') === (rowWithSec.category?.trim() || '')
      );

      if (existingIdx >= 0 && mode === 'merge') {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const combinedQty = existing.quantity + rowWithSec.quantity;
        const totalAmount = rowWithSec.quotedPrice * combinedQty;
        updated[existingIdx] = {
          ...existing,
          quotedPrice: rowWithSec.quotedPrice,
          quantity: combinedQty,
          discountPercent: rowWithSec.discountPercent,
          totalAmount,
          isBelowDP: rowWithSec.isBelowDP,
          notes: rowWithSec.notes || existing.notes,
        };
        return updated;
      }
      return [...prev, rowWithSec];
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
      quoteNumber: headerFooterConfig.orderCode || quoteNumber,
      version,
      customerId: selectedCustomer?.id || '',
      customerName: headerFooterConfig.customerName || selectedCustomer?.name || 'Khách Hàng',
      customerPhone: headerFooterConfig.customerPhone || selectedCustomer?.phone || '',
      customerEmail: selectedCustomer?.email || '',
      customerCompany: selectedCustomer?.company || '',
      customerAddress: headerFooterConfig.projectLocation || deliveryAddress || selectedCustomer?.address || '',
      salesRepId: currentUser.id,
      salesRepName: headerFooterConfig.salesRepName || currentUser.name,
      salesRepPhone: headerFooterConfig.salesRepPhone || currentUser.phone,
      salesRepEmail: headerFooterConfig.salesRepEmail || currentUser.email,
      title: headerFooterConfig.quoteTitle || title.trim() || `Báo giá thiết bị - Lần ${version}`,
      date: headerFooterConfig.quoteDate || date,
      validUntil: headerFooterConfig.validUntilDate || validUntil,
      
      // Customizable header/company fields
      companyName: headerFooterConfig.companyName || companyInfo?.name,
      companyAddress: headerFooterConfig.companyAddress || companyInfo?.address,
      companyHotline: headerFooterConfig.companyHotline || companyInfo?.phone || companyInfo?.hotline,
      companyWebsite: headerFooterConfig.companyWebsite || companyInfo?.website,
      companyEmail: headerFooterConfig.companyEmail || companyInfo?.email,
      companyTaxCode: companyInfo?.taxCode,
      companyLogo: headerFooterConfig.companyLogo || companyInfo?.logoUrl || companyInfo?.logo || '',
      orderCode: headerFooterConfig.orderCode || quoteNumber,
      projectLocation: headerFooterConfig.projectLocation || deliveryAddress || selectedCustomer?.address || '',
      contactPerson: headerFooterConfig.contactPerson || selectedCustomer?.name || '',
      openingGreeting: headerFooterConfig.openingGreeting,

      // Customizable footer/terms fields
      priceTerms: headerFooterConfig.priceTerms,
      deliveryTerms: headerFooterConfig.deliveryTerms,
      shippingTerms: headerFooterConfig.shippingTerms,
      warrantyTerms: headerFooterConfig.warrantyTerms,
      leadTimeTerms: headerFooterConfig.leadTimeTerms,
      closingNotes: headerFooterConfig.closingNotes,
      signatoryTitle: headerFooterConfig.signatoryTitle,

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

              {/* PRODUCTS & SECTIONS BUILDER */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Danh Sách Sản Phẩm Theo Từng Phần / Khu Vực</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Báo giá được phân chia theo từng khu vực công trình, có tính tổng phụ riêng từng phần và tổng tiền toàn bộ ở cuối.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Add Section Button / Input */}
                    {isAddingSection ? (
                      <div className="flex items-center space-x-1 bg-blue-50 p-1 rounded-lg border border-blue-200">
                        <input
                          type="text"
                          placeholder="Nhập tên phần (VD: Phần III: WC Tầng 2)..."
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSection();
                            if (e.key === 'Escape') setIsAddingSection(false);
                          }}
                          className="px-2 py-1 text-xs border border-blue-300 rounded bg-white font-medium text-slate-800 w-52"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSection()}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingSection(false)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingSection(true)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg font-bold text-xs shadow-2xs transition flex items-center space-x-1"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                        <span>+ Thêm Phần / Khu Vực Mới</span>
                      </button>
                    )}

                    {/* BIG PROMINENT BUTTON: + THÊM SẢN PHẨM */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSectionForPicker(allSections[0] || 'Phần I: Khu Vực WC Master');
                        setIsProductPickerOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition active:scale-95 flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ THÊM SẢN PHẨM THÔNG MINH</span>
                    </button>
                  </div>
                </div>

                {/* Quick Add Section Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center space-x-1">
                    <span>Gợi ý thêm nhanh khu vực:</span>
                  </span>
                  {[
                    'WC Master Tầng 2',
                    'WC Khách Tầng 1',
                    'WC Tầng 3',
                    'Khu Vực Bếp & Rửa',
                    'Phòng Giặt & Ban Công',
                    'Phụ Kiện & Vật Tư Lắp Đặt',
                  ].map((quickSec) => {
                    const exists = allSections.some((s) => s.toLowerCase().includes(quickSec.toLowerCase()));
                    if (exists) return null;
                    return (
                      <button
                        key={quickSec}
                        type="button"
                        onClick={() => handleAddSection(`Phần ${allSections.length + 1}: ${quickSec}`)}
                        className="px-2 py-0.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded text-[10px] font-medium transition flex items-center space-x-1"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{quickSec}</span>
                      </button>
                    );
                  })}
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

                {/* RENDER SECTIONS LIST */}
                <div className="space-y-4">
                  {allSections.map((secName, secIdx) => {
                    const secItems = itemsBySection[secName] || [];
                    const secSubtotal = sectionSubtotals[secName] || 0;
                    
                    // Calculate running global start STT for continuous numbering across sections
                    let globalStartSTT = 0;
                    for (let i = 0; i < secIdx; i++) {
                      globalStartSTT += (itemsBySection[allSections[i]] || []).length;
                    }

                    const isEditingThis = editingSection?.original === secName;

                    return (
                      <div
                        key={secName}
                        className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-slate-50/30"
                      >
                        {/* SECTION HEADER BAR */}
                        <div className="px-3.5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                              {secIdx + 1}
                            </span>

                            {isEditingThis ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="text"
                                  value={editingSection.current}
                                  onChange={(e) =>
                                    setEditingSection({ ...editingSection, current: e.target.value })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSection(secName, editingSection.current);
                                    if (e.key === 'Escape') setEditingSection(null);
                                  }}
                                  className="px-2 py-1 text-xs border border-blue-400 rounded font-bold text-slate-900 bg-white min-w-[240px]"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRenameSection(secName, editingSection.current)}
                                  className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSection(null)}
                                  className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">
                                  {secName}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => setEditingSection({ original: secName, current: secName })}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition"
                                  title="Đổi tên phần"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                              {secItems.length} sản phẩm
                            </span>
                          </div>

                          {/* Right Controls: Subtotal & Actions */}
                          <div className="flex items-center space-x-2">
                            <div className="text-right mr-1">
                              <span className="text-[10px] text-slate-500 uppercase font-semibold mr-1.5">Tổng phụ:</span>
                              <span className="font-extrabold font-mono text-xs sm:text-sm text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {formatVND(secSubtotal)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenPickerForSection(secName)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold shadow-2xs transition flex items-center space-x-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Thêm SP vào phần này</span>
                            </button>

                            {/* Section Reordering */}
                            <div className="flex items-center space-x-0.5 bg-white border border-slate-200 rounded p-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveSection(secIdx, 'up')}
                                disabled={secIdx === 0}
                                className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                title="Di chuyển lên"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSection(secIdx, 'down')}
                                disabled={secIdx === allSections.length - 1}
                                className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                title="Di chuyển xuống"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Delete Section */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(secName)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                              title="Xóa phần này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* SECTION ITEMS TABLE */}
                        <div className="overflow-x-auto bg-white">
                          <table className="w-full text-left text-xs min-w-[950px]">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                              <tr>
                                <th className="px-2.5 py-2 w-10 text-center">STT</th>
                                <th className="px-2.5 py-2 w-36">Mã SP & Hãng</th>
                                <th className="px-2.5 py-2 min-w-[200px]">Tên Sản Phẩm & Quy Cách</th>
                                <th className="px-2.5 py-2 w-24 text-center">Tồn Khả Dụng</th>
                                <th className="px-2.5 py-2 w-18 text-center">Số Lượng</th>
                                <th className="px-2.5 py-2 w-24 text-right">Giá Niêm Yết</th>
                                <th className="px-2.5 py-2 w-24 text-right bg-amber-50/70 text-amber-900">Giá DP (Sàn)</th>
                                <th className="px-2.5 py-2 w-28 text-right font-bold text-blue-900">Giá Chào Bán</th>
                                <th className="px-2.5 py-2 w-16 text-center">% CK</th>
                                <th className="px-2.5 py-2 w-28 text-right">Thành Tiền</th>
                                <th className="px-2.5 py-2 w-24 text-center">Chuyển Phần</th>
                                <th className="px-2.5 py-2 w-8 text-center">Xóa</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {secItems.length === 0 ? (
                                <tr>
                                  <td colSpan={12} className="px-4 py-6 text-center text-slate-400 bg-slate-50/30">
                                    <div className="space-y-1.5">
                                      <p className="text-xs font-medium text-slate-600">
                                        Chưa có sản phẩm nào trong {secName}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPickerForSection(secName)}
                                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-bold transition inline-flex items-center space-x-1"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>+ Chọn sản phẩm cho phần này</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                secItems.map((row, rowIdx) => {
                                  const itemSTT = globalStartSTT + rowIdx + 1;
                                  const willBeReserved = Math.min(row.quantity, row.inventoryAvailable);
                                  const willBeOrdered = Math.max(0, row.quantity - row.inventoryAvailable);

                                  return (
                                    <tr
                                      key={row.id}
                                      className={`hover:bg-slate-50 transition ${row.isBelowDP ? 'bg-rose-50/60' : ''}`}
                                    >
                                      <td className="px-2.5 py-2 text-center font-bold text-slate-600 bg-slate-50/30">
                                        {itemSTT}
                                      </td>
                                      <td className="px-2.5 py-2">
                                        <div className="font-mono font-bold text-blue-700">{row.sku}</div>
                                        <div className="text-[10px] text-slate-500 font-semibold">{row.brand}</div>
                                      </td>
                                      <td className="px-2.5 py-2">
                                        <div className="font-bold text-slate-900">{row.name}</div>
                                        <div className="text-[10px] text-slate-500">
                                          {row.color ? `Màu: ${row.color}` : ''} {row.size ? `• Kích thước: ${row.size}` : ''}
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
                                        <select
                                          value={row.category || secName}
                                          onChange={(e) => handleMoveItemToSection(row.id, e.target.value)}
                                          className="text-[10px] px-1 py-0.5 border border-slate-200 rounded bg-white text-slate-700 max-w-[100px]"
                                          title="Chuyển sang phần khác"
                                        >
                                          {allSections.map((s) => (
                                            <option key={s} value={s}>
                                              {s}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="px-2.5 py-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveRow(row.id)}
                                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                                          title="Xóa khỏi báo giá"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                            {/* SECTION SUBTOTAL FOOTER */}
                            {secItems.length > 0 && (
                              <tfoot>
                                <tr className="bg-slate-50/80 border-t border-slate-200 text-xs font-bold">
                                  <td colSpan={9} className="px-3 py-2 text-right text-slate-700 uppercase tracking-tight">
                                    CỘNG TIỀN {secName}:
                                  </td>
                                  <td className="px-2.5 py-2 text-right font-mono font-black text-blue-900 bg-blue-50/50">
                                    {formatVND(secSubtotal)}
                                  </td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* TOTALS & GRAND SUMMARY CARD */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 text-white p-4 rounded-xl shadow-md gap-4">
                  <div className="space-y-1 max-w-lg">
                    <div className="text-xs text-slate-300">
                      Tổng số lượng:{' '}
                      <strong className="text-white">{items.reduce((s, i) => s + i.quantity, 0)}</strong> sản phẩm / quy cách trong{' '}
                      <strong className="text-blue-300">{allSections.length}</strong> khu vực
                    </div>
                    <div className="text-[11px] text-slate-300 italic">
                      Số tiền bằng chữ:{' '}
                      <span className="font-semibold text-amber-300">{numberToVietnameseWords(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="w-full lg:w-80 space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Tạm tính tổng tiền hàng:</span>
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
                      <span className="text-xs uppercase tracking-wider text-blue-300">TỔNG CỘNG THANH TOÁN:</span>
                      <span className="text-base text-amber-400 font-mono">{formatVND(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2 BOTTOM: CONDITIONS, PAYMENT MILESTONES & TERMS TABS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setActiveInfoTab('header_footer')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                        activeInfoTab === 'header_footer' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Form Mở Đầu & Kết Thúc (Tùy Chọn)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveInfoTab('milestones')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 shrink-0 ${
                        activeInfoTab === 'milestones' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Kế Hoạch Thanh Toán ({milestones.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveInfoTab('delivery')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 shrink-0 ${
                        activeInfoTab === 'delivery' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Giao Hàng & Bảo Hành</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveInfoTab('terms')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 shrink-0 ${
                        activeInfoTab === 'terms' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>Điều Khoản Chuẩn</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveInfoTab('notes')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 shrink-0 ${
                        activeInfoTab === 'notes' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Ghi Chú Đàm Phán</span>
                    </button>
                  </div>
                </div>

                {/* TAB CONTENT: HEADER & FOOTER CONFIGURATION (HHG HOLDINGS / CUSTOM) */}
                {activeInfoTab === 'header_footer' && (
                  <QuotationHeaderFooterConfig
                    config={headerFooterConfig}
                    onChange={(newCfg) => setHeaderFooterConfig(newCfg)}
                    onApplyHHGTemplate={handleApplyHHGTemplate}
                    onApplyDefaultTemplate={handleApplyDefaultTemplate}
                  />
                )}

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
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          setHeaderFooterConfig((prev) => ({ ...prev, deliveryTerms: e.target.value, projectLocation: e.target.value }));
                        }}
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
                        onChange={(e) => {
                          setWarrantyTerms(e.target.value);
                          setHeaderFooterConfig((prev) => ({ ...prev, warrantyTerms: e.target.value }));
                        }}
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
          {/* STEP 3: PREVIEW & FINAL SUMMARY (CHUẨN FORM A4 NHƯ MẪU ẢNH)   */}
          {/* ============================================================== */}
          {currentStep === 'preview' && selectedCustomer && (
            <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-150">
              <div className="bg-slate-100 p-2 sm:p-4 rounded-xl border border-slate-300 shadow-lg">
                <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 space-y-4">
                  <StandardQuotationDocument
                    customConfig={headerFooterConfig}
                    quote={buildQuotationPayload('draft')}
                    itemsOverride={items}
                    grandTotalOverride={grandTotal}
                    subtotalOverride={subtotal}
                    taxAmountOverride={taxAmount}
                    taxRateOverride={taxRate}
                  />
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
        targetSection={activeSectionForPicker}
        sectionsList={allSections}
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
