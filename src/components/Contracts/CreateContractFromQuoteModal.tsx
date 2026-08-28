import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Quotation, Customer, ContractTemplate, Contract, PaymentMilestone } from '../../types';
import {
  renderContractContent,
  validateContractRequirements,
  ContractMappingInput,
} from '../../services/contractTemplateService';
import { exportContractToDocx, exportContractToPdf } from '../../services/contractExportService';
import { formatVND, formatDate, numberToVietnameseWords } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  FileSignature,
  Building,
  Calendar,
  Truck,
  CreditCard,
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Printer,
  Sparkles,
  Eye,
  Check,
  ChevronRight,
} from 'lucide-react';

interface CreateContractFromQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quotation | null;
  onSuccess?: (contract: Contract) => void;
}

export const CreateContractFromQuoteModal: React.FC<CreateContractFromQuoteModalProps> = ({
  isOpen,
  onClose,
  quote,
  onSuccess,
}) => {
  const {
    customers,
    contractTemplates,
    companyInfo,
    currentUser,
    finalizeQuoteToContract,
    setActiveTab,
    setPdfPreviewData,
  } = useApp();

  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Active Template
  const activeTemplates = contractTemplates.filter((t) => t.status === 'active');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Form State
  const [contractNumber, setContractNumber] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [contractTitle, setContractTitle] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [warrantyTerms, setWarrantyTerms] = useState('');
  const [generalTerms, setGeneralTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Customer Override
  const [custName, setCustName] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custTaxCode, setCustTaxCode] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custRep, setCustRep] = useState('');
  const [custPos, setCustPos] = useState('');

  // View state
  const [activeStep, setActiveStep] = useState<'config' | 'preview' | 'success'>('config');
  const [generatedContract, setGeneratedContract] = useState<Contract | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Resolve Customer
  const customer = quote ? customers.find((c) => c.id === quote.customerId) : null;

  useEffect(() => {
    if (quote && isOpen) {
      const now = new Date().toISOString().split('T')[0];
      const safeQuoteNum = quote.quoteNumber.replace(/[^a-zA-Z0-9]/g, '');
      const defaultNumber = `HĐKT-${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}-${safeQuoteNum}`;

      // Pick default template (first active or 'tmpl-cung-cap-vat-tu')
      const defaultTmpl = activeTemplates[0] || contractTemplates[0];
      if (defaultTmpl) {
        setSelectedTemplateId(defaultTmpl.id);
      }

      setContractNumber(defaultNumber);
      setContractDate(now);
      setContractTitle(quote.title ? `HỢP ĐỒNG ${quote.title.toUpperCase()}` : 'HỢP ĐỒNG MUA BÁN THIẾT BỊ ĐIỆN VÀ CHIẾU SÁNG');
      setDeliveryDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
      setDeliveryAddress(quote.customerAddress || customer?.address || 'Giao tại chân công trình');
      setDeliveryTerms(quote.deliveryTerms || 'Hàng mới 100%, nguyên đai nguyên kiện từ nhà sản xuất.');
      setPaymentTerms(quote.priceTerms || 'Thanh toán bằng chuyển khoản ngân hàng: Tạm ứng 30% khi ký HĐ, 70% khi nhận hàng.');
      setWarrantyTerms(quote.warrantyTerms || 'Bảo hành chính hãng 24 tháng theo tiêu chuẩn của nhà sản xuất.');
      setGeneralTerms('Hai bên cam kết thực hiện đúng và đầy đủ các điều khoản trong hợp đồng.');
      setNotes(quote.notes || '');

      // Customer
      setCustName(quote.customerName || customer?.name || '');
      setCustCompany(quote.customerCompany || customer?.company || quote.customerName || '');
      setCustTaxCode(quote.customerTaxCode || customer?.taxCode || '');
      setCustAddress(quote.customerAddress || customer?.address || '');
      setCustPhone(quote.customerPhone || customer?.phone || '');
      setCustEmail(quote.customerEmail || customer?.email || '');
      setCustRep(customer?.representative || quote.customerName || '');
      setCustPos(customer?.position || 'Tổng Giám Đốc');

      setActiveStep('config');
      setGeneratedContract(null);
    }
  }, [quote, isOpen]);

  if (!isOpen || !quote) return null;

  const currentTemplate = contractTemplates.find((t) => t.id === selectedTemplateId) || contractTemplates[0];

  // Prepare mapping input for preview and contract generation
  const mappingInput: ContractMappingInput = {
    contractNumber: contractNumber.trim(),
    contractDate: contractDate || new Date().toISOString().split('T')[0],
    contractTitle: contractTitle.trim() || 'HỢP ĐỒNG KINH TẾ',
    deliveryDate,
    deliveryAddress,
    deliveryTerms,
    paymentTerms,
    warrantyTerms,
    generalTerms,
    notes,
    customer: {
      name: custName,
      company: custCompany || custName,
      address: custAddress,
      taxCode: custTaxCode,
      phone: custPhone,
      email: custEmail,
      representative: custRep || custName,
      position: custPos || 'Đại diện bên mua',
    },
    seller: {
      name: quote.companyName || companyInfo.name || 'CÔNG TY TNHH HHG HOLDINGS',
      address: quote.companyAddress || companyInfo.address || '',
      taxCode: quote.companyTaxCode || companyInfo.taxCode || '',
      phone: quote.companyHotline || companyInfo.phone || companyInfo.hotline || '',
      email: quote.companyEmail || companyInfo.email || '',
      website: quote.companyWebsite || companyInfo.website || '',
      representative: companyInfo.directorName || 'Bùi Viết Hoàng',
      position: companyInfo.directorTitle || 'Tổng Giám Đốc',
      bankAccount: companyInfo.bankAccount || '',
      bankName: companyInfo.bankName || '',
    },
    quotation: {
      quoteNumber: quote.quoteNumber,
      date: quote.date,
    },
    items: quote.items || [],
    totals: {
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      taxRate: quote.taxRate || 10,
      taxAmount: quote.taxAmount || 0,
      grandTotal: quote.grandTotal,
    },
  };

  const renderedContent = renderContractContent(currentTemplate?.content || '', mappingInput);
  const validation = validateContractRequirements(quote, customer, currentTemplate, contractNumber);

  // Generate & Finalize Contract
  const handleConfirmCreate = () => {
    if (!validation.isValid) {
      alert('Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc trước khi tạo hợp đồng.');
      return;
    }

    const contractDetails: Partial<Contract> = {
      contractNumber: contractNumber.trim(),
      contractDate,
      title: contractTitle.trim(),
      customerName: custName,
      customerCompany: custCompany,
      customerTaxCode: custTaxCode,
      customerAddress: custAddress,
      customerPhone: custPhone,
      customerRepresentative: custRep,
      customerPosition: custPos,
      deliveryDate,
      deliveryAddress,
      deliveryTerms,
      paymentTermsDescription: paymentTerms,
      warrantyTerms,
      generalTerms,
      notes,
      templateId: currentTemplate.id,
      templateName: currentTemplate.name,
      templateVersion: currentTemplate.version,
    };

    const res = finalizeQuoteToContract(quote.id, contractDetails, quote, currentTemplate.id);
    setGeneratedContract(res.contract);
    setActiveStep('success');

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (onSuccess) {
      onSuccess(res.contract);
    }
  };

  const handleDownloadDocx = () => {
    if (generatedContract) {
      exportContractToDocx(generatedContract);
    } else {
      const tempContract: Contract = {
        id: 'temp',
        contractNumber,
        quotationId: quote.id,
        quoteNumber: quote.quoteNumber,
        customerId: quote.customerId,
        customerName: custName,
        contractDate,
        deliveryDate,
        deliveryAddress,
        items: quote.items,
        totalValue: quote.grandTotal,
        milestones: quote.milestones,
        status: 'signed',
        createdAt: contractDate,
        salesRepId: currentUser.id,
        salesRepName: currentUser.name,
        renderedContent,
      };
      exportContractToDocx(tempContract);
    }
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsExporting(true);
    const target = generatedContract || {
      contractNumber,
      renderedContent,
    } as any;
    await exportContractToPdf(target, printAreaRef.current);
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
              <FileSignature className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <span>Tạo Hợp Đồng Từ Báo Giá:</span>
                <span className="font-mono text-blue-400">{quote.quoteNumber}</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-normal px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Đã Chốt
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Khách hàng: <strong className="text-white">{quote.customerName}</strong> ({quote.customerCompany || 'Khách cá nhân'}) • Giá trị: <strong className="text-amber-300">{formatVND(quote.grandTotal)}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        {activeStep !== 'success' && (
          <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setActiveStep('config')}
                className={`px-4 py-2 font-bold text-xs rounded-t-lg border-t-2 transition flex items-center space-x-2 cursor-pointer ${
                  activeStep === 'config'
                    ? 'bg-white border-blue-600 text-blue-700 shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>1. Chọn Mẫu & Hiệu Chỉnh Điều Khoản</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('preview')}
                className={`px-4 py-2 font-bold text-xs rounded-t-lg border-t-2 transition flex items-center space-x-2 cursor-pointer ${
                  activeStep === 'preview'
                    ? 'bg-white border-blue-600 text-blue-700 shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>2. Xem Trước Hợp Đồng (Live Preview)</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 hidden sm:block">
              {quote.items.length} mặt hàng • Tự động đóng băng Snapshot
            </div>
          </div>
        )}

        {/* Validation Issues Banner */}
        {validation.issues.length > 0 && activeStep !== 'success' && (
          <div className="px-5 pt-3">
            <div className="p-3 rounded-lg border text-xs space-y-1 bg-amber-50 border-amber-200 text-amber-900">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Lưu ý kiểm tra thông tin hợp đồng:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
                {validation.issues.map((issue, idx) => (
                  <li key={idx} className={issue.severity === 'error' ? 'text-rose-700 font-bold' : 'text-amber-800'}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* STEP 1: CONFIGURATION */}
          {activeStep === 'config' && (
            <div className="space-y-4">
              {/* 1. Template Selector */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Chọn Hợp Đồng Mẫu Áp Dụng <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Có {activeTemplates.length} mẫu đang hoạt động
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activeTemplates.map((tmpl) => {
                    const isSelected = tmpl.id === selectedTemplateId;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded">
                              {tmpl.code}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                              v{tmpl.version}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-slate-900 line-clamp-1">{tmpl.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{tmpl.description}</div>
                        </div>

                        {isSelected && (
                          <div className="mt-2 text-[10px] text-blue-700 font-bold flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Đang chọn</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Contract Credentials Grid */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Thông Tin Cơ Bản Hợp Đồng</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Số Hiệu Hợp Đồng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      placeholder="HĐKT-2026/08-001"
                      required
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ngày Ký Hợp Đồng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={contractDate}
                      onChange={(e) => setContractDate(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Hạn Giao Hàng Dự Kiến
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">Tiêu Đề Hợp Đồng</label>
                  <input
                    type="text"
                    value={contractTitle}
                    onChange={(e) => setContractTitle(e.target.value)}
                    placeholder="vd: HỢP ĐỒNG CUNG CẤP THIẾT BỊ ĐIỆN VÀ CHIẾU SÁNG"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs font-semibold text-slate-900 uppercase focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* 3. Customer (Buyer) Credentials */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>Thông Tin Bên Mua (Khách Hàng)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="lg:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tên Công Ty / Đơn Vị Mua Hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={custCompany}
                      onChange={(e) => setCustCompany(e.target.value)}
                      placeholder="CÔNG TY CP..."
                      required
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-medium text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã Số Thuế (MST)</label>
                    <input
                      type="text"
                      value={custTaxCode}
                      onChange={(e) => setCustTaxCode(e.target.value)}
                      placeholder="0108999888"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
                    <input
                      type="text"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="09xx xxx xxx"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Đăng Ký Kinh Doanh</label>
                    <input
                      type="text"
                      value={custAddress}
                      onChange={(e) => setCustAddress(e.target.value)}
                      placeholder="Địa chỉ công ty bên mua..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Người Đại Diện Ký Kết</label>
                    <input
                      type="text"
                      value={custRep}
                      onChange={(e) => setCustRep(e.target.value)}
                      placeholder="Họ tên người đại diện"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-medium text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Chức Danh Đại Diện</label>
                    <input
                      type="text"
                      value={custPos}
                      onChange={(e) => setCustPos(e.target.value)}
                      placeholder="Tổng Giám Đốc / Giám Đốc"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Terms & Delivery */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-purple-600" />
                  <span>Điều Khoản Giao Hàng & Thanh Toán</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Địa Điểm Giao Hàng</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Địa chỉ chân công trình bên mua..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Quy Cách & Điều Khoản Giao Hàng</label>
                    <input
                      type="text"
                      value={deliveryTerms}
                      onChange={(e) => setDeliveryTerms(e.target.value)}
                      placeholder="Giao hàng nguyên đai nguyên kiện..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Điều Khoản Thanh Toán</label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="Tạm ứng 30% khi ký HĐ, 70% khi nhận hàng..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Điều Khoản Bảo Hành</label>
                    <input
                      type="text"
                      value={warrantyTerms}
                      onChange={(e) => setWarrantyTerms(e.target.value)}
                      placeholder="Bảo hành chính hãng 24 tháng..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LIVE PREVIEW */}
          {activeStep === 'preview' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <span>
                  📄 <strong>Xem trước văn bản hợp đồng:</strong> Toàn bộ placeholders đã được thay thế bằng dữ liệu thực tế. Kiểm tra kỹ trước khi bấm Xác Nhận.
                </span>
                <span className="font-mono text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {contractNumber}
                </span>
              </div>

              <div className="bg-white p-8 rounded-lg border border-slate-300 shadow-sm max-w-4xl mx-auto overflow-x-auto min-h-[500px]">
                <div ref={printAreaRef} dangerouslySetInnerHTML={{ __html: renderedContent }} />
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CELEBRATION */}
          {activeStep === 'success' && generatedContract && (
            <div className="py-8 px-4 text-center max-w-xl mx-auto space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Sinh Hợp Đồng Thành Công!
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hợp đồng <strong className="text-slate-800">{generatedContract.contractNumber}</strong> đã được tạo và lưu Snapshot dữ liệu đóng băng bất biến trên Google Cloud Firestore.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mẫu sử dụng:</span>
                  <span className="font-bold text-slate-900">{generatedContract.templateName} (v{generatedContract.templateVersion})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khách hàng:</span>
                  <span className="font-bold text-slate-900">{generatedContract.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng giá trị hợp đồng:</span>
                  <span className="font-bold text-blue-700">{formatVND(generatedContract.totalValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bảng Giữ hàng & Đặt hàng:</span>
                  <span className="font-bold text-emerald-600">✓ Đã tự động phân bổ tồn kho</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất File DOCX (Word)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPdfPreviewData({ type: 'contract', data: generatedContract });
                    onClose();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In / Xuất PDF A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('contracts');
                    onClose();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  <span>Xem Danh Sách HĐ</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        {activeStep !== 'success' && (
          <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <div className="flex items-center space-x-2">
              {activeStep === 'config' ? (
                <button
                  type="button"
                  onClick={() => setActiveStep('preview')}
                  className="px-4 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Xem Trước Bản In</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveStep('config')}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                >
                  ← Quay Lại Chỉnh Sửa
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={!validation.isValid}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSignature className="w-4 h-4" />
                <span>Xác Nhận Tạo Hợp Đồng</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
