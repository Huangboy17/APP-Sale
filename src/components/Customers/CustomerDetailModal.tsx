import React, { useState, useMemo, useEffect } from 'react';
import {
  Customer,
  CustomerStage,
  Quotation,
  QuotationStatus,
  Contract,
} from '../../types';
import { useApp } from '../../context/AppContext';
import {
  formatVND,
  formatDate,
  getCustomerStageConfig,
  getQuotationStatusConfig,
} from '../../utils/formatters';
import {
  getCustomer360Items,
  getCustomer360Summary,
  Customer360ItemRow,
} from '../../services/customer360Service';
import { ItemLogisticsTimelineModal } from './ItemLogisticsTimelineModal';
import { CreateContractFromQuoteModal } from '../Contracts/CreateContractFromQuoteModal';
import confetti from 'canvas-confetti';
import {
  X,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  Printer,
  Copy,
  Check,
  Edit2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  PackageCheck,
  Boxes,
  Truck,
  RotateCcw,
  Sparkles,
  Save,
  CheckSquare,
  Search,
  FileSignature,
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onEditCustomer?: (customer: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  isOpen,
  onClose,
  onEditCustomer,
}) => {
  const {
    customers = [],
    users = [],
    contracts = [],
    filteredQuotations = [],
    filteredReserveItems = [],
    filteredOrderItems = [],
    purchaseOrders = [],
    stockInVouchers = [],
    stockOutVouchers = [],
    updateCustomer,
    updateCustomerStage,
    updateQuotationStatus,
    cloneQuotationToNextRound,
    finalizeQuoteToContract,
    setIsCreateQuoteModalOpen,
    setSelectedQuoteForModal,
    setSelectedCustomerIdForQuote,
    setPdfPreviewData,
    currentUser,
  } = useApp();

  // All State Hooks (Unconditionally at the top)
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'quotations' | 'logistics'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItemForTimeline, setSelectedItemForTimeline] = useState<Customer360ItemRow | null>(null);
  const [createContractQuote, setCreateContractQuote] = useState<Quotation | null>(null);
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);

  // Retrieve latest live customer from state
  const liveCustomer = useMemo(() => {
    if (!customer) return null;
    return (customers || []).find((c) => c && c.id === customer.id) || customer;
  }, [customers, customer]);

  // Editable Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    taxCode: '',
    address: '',
    shippingAddress: '',
    city: '',
    contactPerson: '',
    position: '',
    assignedToId: '',
    stage: 'new' as CustomerStage,
    notes: '',
    expectedValue: 0,
  });

  // Sync formData when customer changes or modal opens
  useEffect(() => {
    if (liveCustomer) {
      setFormData({
        name: liveCustomer.name || '',
        company: liveCustomer.company || '',
        phone: liveCustomer.phone || '',
        email: liveCustomer.email || '',
        taxCode: liveCustomer.taxCode || '',
        address: liveCustomer.address || '',
        shippingAddress: liveCustomer.shippingAddress || '',
        city: liveCustomer.city || '',
        contactPerson: liveCustomer.contactPerson || '',
        position: liveCustomer.position || '',
        assignedToId: liveCustomer.assignedToId || '',
        stage: liveCustomer.stage || 'new',
        notes: liveCustomer.notes || '',
        expectedValue: Number(liveCustomer.expectedValue) || 0,
      });
      setIsEditing(false);
    }
  }, [liveCustomer, isOpen]);

  // Customer Quotations (sorted by version desc)
  const customerQuotes = useMemo(() => {
    if (!liveCustomer) return [];
    return (filteredQuotations || [])
      .filter((q) => q && q.customerId === liveCustomer.id)
      .sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0));
  }, [filteredQuotations, liveCustomer]);

  // Customer Contracts
  const customerContracts = useMemo(() => {
    if (!liveCustomer) return [];
    return (contracts || []).filter((c) => c && c.customerId === liveCustomer.id);
  }, [contracts, liveCustomer]);

  // Customer 360 Items with Live Logistics Pipeline
  const customer360Items = useMemo(() => {
    if (!liveCustomer) return [];
    try {
      return getCustomer360Items(
        liveCustomer.id,
        contracts || [],
        filteredQuotations || [],
        filteredReserveItems || [],
        filteredOrderItems || [],
        purchaseOrders || [],
        stockInVouchers || [],
        stockOutVouchers || []
      );
    } catch (e) {
      console.error('Error computing customer360Items:', e);
      return [];
    }
  }, [
    liveCustomer,
    contracts,
    filteredQuotations,
    filteredReserveItems,
    filteredOrderItems,
    purchaseOrders,
    stockInVouchers,
    stockOutVouchers,
  ]);

  // Customer 360 Summary KPIs
  const summary = useMemo(() => {
    if (!liveCustomer) return null;
    try {
      return getCustomer360Summary(liveCustomer, contracts || [], filteredQuotations || [], customer360Items || []);
    } catch (e) {
      console.error('Error computing summary:', e);
      return {
        totalContractValue: 0,
        totalContractsCount: 0,
        signedContractsCount: 0,
        quotationRoundsCount: 0,
        totalItemsCount: 0,
        totalContractQuantity: 0,
        totalReceivedQuantity: 0,
        totalDeliveredQuantity: 0,
        overallFulfillmentPercent: 0,
      };
    }
  }, [liveCustomer, contracts, filteredQuotations, customer360Items]);

  const handleSaveCustomer = () => {
    if (!liveCustomer) return;
    if (!formData.name.trim()) {
      alert('Tên khách hàng không được để trống!');
      return;
    }

    const assignedUser = (users || []).find((u) => u && u.id === formData.assignedToId);

    const updatedCust: Customer = {
      ...liveCustomer,
      name: formData.name.trim(),
      company: formData.company.trim() || undefined,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      taxCode: formData.taxCode.trim() || undefined,
      address: formData.address.trim() || undefined,
      shippingAddress: formData.shippingAddress.trim() || undefined,
      city: formData.city.trim() || undefined,
      contactPerson: formData.contactPerson.trim() || undefined,
      position: formData.position.trim() || undefined,
      assignedToId: formData.assignedToId || liveCustomer.assignedToId,
      assignedToName: assignedUser ? assignedUser.name : liveCustomer.assignedToName,
      stage: formData.stage,
      notes: formData.notes.trim() || undefined,
      expectedValue: Number(formData.expectedValue) || 0,
      updatedAt: new Date().toISOString(),
    };

    updateCustomer(updatedCust);
    setIsEditing(false);
  };

  const handleOpenQuote = (quote: Quotation) => {
    setSelectedQuoteForModal(quote);
    setIsCreateQuoteModalOpen(true);
  };

  const handleCreateNewQuoteRound = () => {
    if (!liveCustomer) return;
    setSelectedQuoteForModal(null);
    setSelectedCustomerIdForQuote(liveCustomer.id);
    setIsCreateQuoteModalOpen(true);
  };

  const handleCloneQuote = (quote: Quotation) => {
    const newQuote = cloneQuotationToNextRound(quote.id);
    if (newQuote) {
      setSelectedQuoteForModal(newQuote);
      setIsCreateQuoteModalOpen(true);
    }
  };

  const handleOpenCreateContract = (quote: Quotation) => {
    setCreateContractQuote(quote);
    setIsCreateContractOpen(true);
  };

  const handleStatusChange = (quote: Quotation, newStatus: QuotationStatus) => {
    if (newStatus === 'approved_contract') {
      setCreateContractQuote(quote);
      setIsCreateContractOpen(true);
    } else {
      updateQuotationStatus(quote.id, newStatus);
    }
  };

  // Safe early return only AFTER all hooks have been invoked
  if (!isOpen || !liveCustomer) return null;

  const safeSummary = summary || {
    totalContractValue: 0,
    totalContractsCount: 0,
    signedContractsCount: 0,
    quotationRoundsCount: 0,
    totalItemsCount: 0,
    totalContractQuantity: 0,
    totalReceivedQuantity: 0,
    totalDeliveredQuantity: 0,
    overallFulfillmentPercent: 0,
  };

  const stageCfg = getCustomerStageConfig(liveCustomer.stage || 'new');
  const contractQuote = customerQuotes.find((q) => q && q.isContractQuote);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* ========================================================================= */}
        {/* HEADER CUSTOMER 360 */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm shadow-md border border-rose-400/30">
              {(liveCustomer.code || 'KH').slice(-3)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-400/30">
                  {liveCustomer.code || 'KH-NEW'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {liveCustomer.name || 'Khách Hàng'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stageCfg.bg}`}>
                  {stageCfg.label}
                </span>
                {customerContracts.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center space-x-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{customerContracts.length} Hợp Đồng</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                {liveCustomer.company && (
                  <span className="flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{liveCustomer.company}</span>
                  </span>
                )}
                <span className="flex items-center space-x-1 text-slate-400">
                  <User className="w-3.5 h-3.5" />
                  <span>Sale: <strong className="text-white font-medium">{liveCustomer.assignedToName || 'Chưa phân công'}</strong></span>
                </span>
                <span className="text-slate-400">
                  Tạo ngày: {formatDate(liveCustomer.createdAt || '')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomer}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border border-white/20 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>✏️ Chỉnh Sửa</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB NAVIGATION BAR */}
        {/* ========================================================================= */}
        <div className="px-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between overflow-x-auto shrink-0">
          <div className="flex space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'overview'
                  ? 'border-rose-600 text-rose-600 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>1. Tổng Quan & Hồ Sơ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contracts')}
              className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'contracts'
                  ? 'border-rose-600 text-rose-600 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>2. Hợp Đồng ({customerContracts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quotations')}
              className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'quotations'
                  ? 'border-rose-600 text-rose-600 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3. Lịch Sử Báo Giá ({customerQuotes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logistics')}
              className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'logistics'
                  ? 'border-rose-600 text-rose-600 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>4. Hàng Hóa & Tiến Độ Logistics ({customer360Items.length})</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          {/* ===================================================================== */}
          {/* TAB 1: TỔNG QUAN & HỒ SƠ */}
          {/* ===================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* TOP KPI SUMMARY DASHBOARD */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Tổng Giá Trị HĐ</span>
                  <span className="text-sm sm:text-base font-black font-mono text-slate-900 truncate block mt-0.5">
                    {formatVND(safeSummary.totalContractValue)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Số HĐ Ký</span>
                  <span className="text-sm sm:text-base font-black font-mono text-blue-700 block mt-0.5">
                    {safeSummary.signedContractsCount} / {safeSummary.totalContractsCount} <span className="text-xs font-normal text-slate-400">HĐ</span>
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Số Đợt Báo Giá</span>
                  <span className="text-sm sm:text-base font-black font-mono text-purple-700 block mt-0.5">
                    {safeSummary.quotationRoundsCount} <span className="text-xs font-normal text-slate-400">đợt</span>
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Tổng Mặt Hàng</span>
                  <span className="text-sm sm:text-base font-black font-mono text-slate-700 block mt-0.5">
                    {safeSummary.totalItemsCount} <span className="text-xs font-normal text-slate-400">mã</span>
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-orange-200 bg-orange-50/20 shadow-2xs">
                  <span className="text-[10px] text-orange-700 font-bold uppercase block">SL Đã Về Kho</span>
                  <span className="text-sm sm:text-base font-black font-mono text-orange-900 block mt-0.5">
                    {safeSummary.totalReceivedQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">sp</span>
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">SL Đã Giao</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-900 block mt-0.5">
                    {safeSummary.totalDeliveredQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">sp</span>
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block">Tiến Độ Giao</span>
                  <span className="text-sm sm:text-base font-black font-mono text-rose-900 block mt-0.5">
                    {safeSummary.overallFulfillmentPercent}%
                  </span>
                </div>
              </div>

              {/* PROFILE & CONTACT CARDS (EDIT / VIEW) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Contact Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thông Tin Liên Hệ</span>
                  </h3>

                  {isEditing ? (
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tên Khách Hàng *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tên Công Ty</label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Mã Số Thuế (MST)</label>
                        <input
                          type="text"
                          value={formData.taxCode}
                          onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Người Liên Hệ</label>
                          <input
                            type="text"
                            value={formData.contactPerson}
                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Chức Vụ</label>
                          <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Điện Thoại *</label>
                          <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Email</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Tên khách hàng</span>
                        <div className="font-bold text-slate-900 text-sm">{liveCustomer.name}</div>
                      </div>
                      {liveCustomer.company && (
                        <div>
                          <span className="text-slate-400 text-[10px]">Công ty</span>
                          <div className="font-semibold text-slate-800">{liveCustomer.company}</div>
                        </div>
                      )}
                      {liveCustomer.taxCode && (
                        <div>
                          <span className="text-slate-400 text-[10px]">Mã số thuế</span>
                          <div className="font-mono font-bold text-slate-800">{liveCustomer.taxCode}</div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 text-[10px]">Người liên hệ</span>
                          <div className="font-semibold text-slate-800">{liveCustomer.contactPerson || '—'}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Chức vụ</span>
                          <div className="text-slate-700">{liveCustomer.position || '—'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 text-[10px]">Điện thoại</span>
                          <a href={`tel:${liveCustomer.phone}`} className="font-mono font-bold text-blue-700 hover:underline block">
                            {liveCustomer.phone}
                          </a>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Email</span>
                          <div className="font-medium text-slate-700 truncate">{liveCustomer.email || '—'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location & Delivery Address */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>Địa Chỉ & Giao Hàng</span>
                  </h3>

                  {isEditing ? (
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Địa Chỉ Giao Dịch</label>
                        <textarea
                          rows={2}
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Địa Chỉ Giao Hàng / Công Trình</label>
                        <textarea
                          rows={2}
                          value={formData.shippingAddress}
                          onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tỉnh / Thành Phố</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Địa chỉ giao dịch</span>
                        <div className="font-medium text-slate-800">{liveCustomer.address || 'Chưa cập nhật'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Địa chỉ giao hàng / Công trình</span>
                        <div className="font-medium text-slate-800">{liveCustomer.shippingAddress || liveCustomer.address || 'Theo địa chỉ giao dịch'}</div>
                      </div>
                      {liveCustomer.city && (
                        <div>
                          <span className="text-slate-400 text-[10px]">Khu vực / Tỉnh thành</span>
                          <div className="font-semibold text-slate-700">{liveCustomer.city}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sales Assignment & Pipeline Stage */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Phụ Trách & Trạng Thái</span>
                  </h3>

                  {isEditing ? (
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Sale Phụ Trách</label>
                        <select
                          value={formData.assignedToId}
                          onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                        >
                          <option value="">-- Chọn nhân viên kinh doanh --</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role === 'manager_c1' ? 'Quản lý C1' : 'Sales C2'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Giai Đoạn Khách Hàng</label>
                        <select
                          value={formData.stage}
                          onChange={(e) => setFormData({ ...formData, stage: e.target.value as CustomerStage })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                        >
                          <option value="new">1. Tạo Mới</option>
                          <option value="contacted">2. Đang Tiếp Cận</option>
                          <option value="quoting">3. Đang Báo Giá</option>
                          <option value="contract_signed">4. Chốt - Ký Hợp Đồng</option>
                          <option value="rejected">5. Từ Chối / Mất Khách</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Giá Trị Dự Kiến (VNĐ)</label>
                        <input
                          type="number"
                          value={formData.expectedValue}
                          onChange={(e) => setFormData({ ...formData, expectedValue: Number(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Sales phụ trách</span>
                        <div className="font-bold text-slate-800 text-sm mt-0.5">{liveCustomer.assignedToName}</div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] mb-1 block">Chuyển nhanh giai đoạn</span>
                        <select
                          value={liveCustomer.stage}
                          onChange={(e) => updateCustomerStage(liveCustomer.id, e.target.value as CustomerStage)}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-rose-500 outline-hidden cursor-pointer"
                        >
                          <option value="new">1. Tạo Mới</option>
                          <option value="contacted">2. Đang Tiếp Cận</option>
                          <option value="quoting">3. Đang Báo Giá</option>
                          <option value="contract_signed">4. Chốt - Ký Hợp Đồng</option>
                          <option value="rejected">5. Từ Chối / Mất Khách</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px]">Giá trị kỳ vọng</span>
                        <div className="font-bold font-mono text-slate-800 text-sm">{formatVND(liveCustomer.expectedValue || 0)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
                  📌 Ghi Chú & Yêu Cầu Đặc Biệt Của Khách Hàng
                </span>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ghi chú về thói quen thanh toán, người ký chính, yêu cầu đóng gói..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                ) : (
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">
                    {liveCustomer.notes || 'Chưa có ghi chú nào.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: HỢP ĐỒNG KÝ KẾT */}
          {/* ===================================================================== */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Danh Sách Hợp Đồng Ký Kết ({customerContracts.length} HĐ)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Các hợp đồng kinh tế đã ký và tiến độ cung ứng hàng hóa thực tế.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3 w-12 text-center">STT</th>
                        <th className="p-3">Số Hợp Đồng</th>
                        <th className="p-3">Ngày Ký</th>
                        <th className="p-3">Tiêu Đề / Dự Án</th>
                        <th className="p-3 text-center">Số Mặt Hàng</th>
                        <th className="p-3 text-right">Tổng Giá Trị</th>
                        <th className="p-3 text-center">Trạng Thái</th>
                        <th className="p-3 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerContracts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-10 text-center text-slate-400">
                            <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <span>Khách hàng chưa có hợp đồng nào được ký kết.</span>
                          </td>
                        </tr>
                      ) : (
                        customerContracts.map((c, idx) => {
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-3 font-bold font-mono text-blue-700">{c.contractNumber}</td>
                              <td className="p-3 text-slate-700 font-mono">{formatDate(c.contractDate || c.createdAt)}</td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-900">{c.title || c.customerName}</div>
                                {c.quoteNumber && (
                                  <div className="text-[10px] text-slate-500 font-mono">Từ BG: {c.quoteNumber}</div>
                                )}
                              </td>
                              <td className="p-3 text-center font-mono font-bold">{(c.items || []).length}</td>
                              <td className="p-3 text-right font-black font-mono text-slate-900 text-sm">
                                {formatVND(c.totalValue)}
                              </td>
                              <td className="p-3 text-center">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  {c.status === 'signed' ? 'Đã Ký HĐ' : c.status === 'completed' ? 'Hoàn Tất' : 'Đang Thực Hiện'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => setActiveTab('logistics')}
                                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition cursor-pointer"
                                >
                                  Xem Hàng Hóa →
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: LỊCH SỬ BÁO GIÁ */}
          {/* ===================================================================== */}
          {activeTab === 'quotations' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Lịch Sử Báo Giá Từng Đợt ({customerQuotes.length} đợt)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mỗi lần gửi báo giá là một snapshot độc lập, bảo toàn nguyên vẹn lịch sử thương thảo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateNewQuoteRound}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-2xs self-start sm:self-center cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tạo Báo Giá Đợt {customerQuotes.length + 1}</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5 text-center w-16">Đợt</th>
                        <th className="px-3.5 py-2.5">Số Báo Giá</th>
                        <th className="px-3.5 py-2.5">Tiêu Đề / Dự Án</th>
                        <th className="px-3.5 py-2.5">Ngày Lập</th>
                        <th className="px-3.5 py-2.5 text-center">Mặt Hàng</th>
                        <th className="px-3.5 py-2.5 text-right">Giá Trị (Có VAT)</th>
                        <th className="px-3.5 py-2.5 text-center">Trạng Thái</th>
                        <th className="px-3.5 py-2.5 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerQuotes.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                            Chưa có đợt báo giá nào cho khách hàng này.
                          </td>
                        </tr>
                      ) : (
                        customerQuotes.map((q) => {
                          const isContract = q.isContractQuote;
                          return (
                            <tr
                              key={q.id}
                              className={`hover:bg-blue-50/40 transition cursor-pointer ${
                                isContract ? 'bg-emerald-50/40 font-medium' : ''
                              }`}
                              onClick={() => handleOpenQuote(q)}
                            >
                              <td className="px-3.5 py-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                    isContract ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-800'
                                  }`}
                                >
                                  Đợt {q.version}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 font-mono font-bold text-blue-700">
                                {q.quoteNumber}
                              </td>
                              <td className="px-3.5 py-3">
                                <div className="font-semibold text-slate-900 line-clamp-1">{q.title}</div>
                                <div className="text-[10px] text-slate-400">Người tạo: {q.salesRepName}</div>
                              </td>
                              <td className="px-3.5 py-3 text-slate-600 font-mono">{formatDate(q.date)}</td>
                              <td className="px-3.5 py-3 text-center font-mono font-bold">{(q.items || []).length}</td>
                              <td className="px-3.5 py-3 text-right font-bold text-slate-900 font-mono text-sm">
                                {formatVND(q.grandTotal)}
                              </td>
                              <td
                                className="px-3.5 py-3 text-center whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <select
                                  value={q.status}
                                  onChange={(e) => handleStatusChange(q, e.target.value as QuotationStatus)}
                                  className={`px-2 py-1 rounded text-[11px] font-bold border outline-hidden cursor-pointer ${
                                    q.status === 'approved_contract'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : q.status === 'sent'
                                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                                      : q.status === 'negotiating'
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  <option value="draft">📝 Bản nháp</option>
                                  <option value="sent">📨 Đã gửi khách</option>
                                  <option value="negotiating">🤝 Đang đàm phán</option>
                                  <option value="approved_contract">🏆 Đã chốt (Làm HĐ)</option>
                                </select>
                              </td>
                              <td
                                className="px-3.5 py-3 text-center whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    onClick={() => setPdfPreviewData({ type: 'quote', data: q })}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition cursor-pointer"
                                    title="Xem & Xuất PDF"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleCloneQuote(q)}
                                    className="p-1.5 text-slate-500 hover:text-purple-600 rounded hover:bg-purple-50 transition cursor-pointer"
                                    title="Nhân bản tạo Đợt tiếp theo"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenCreateContract(q)}
                                    className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer border border-emerald-200"
                                    title="Tạo hợp đồng từ báo giá này"
                                  >
                                    <FileSignature className="w-3 h-3 text-emerald-600" />
                                    <span>Tạo HĐ</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenQuote(q)}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition shadow-2xs cursor-pointer"
                                  >
                                    {isContract ? 'Xem HĐ' : 'Mở Báo Giá'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: HÀNG HÓA & TIẾN ĐỘ LOGISTICS (CUSTOMER 360) */}
          {/* ===================================================================== */}
          {activeTab === 'logistics' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <PackageCheck className="w-5 h-5 text-rose-600" />
                    <span>Chi Tiết Hàng Hóa & Tiến Độ Logistics Toàn Diện (Customer 360)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trích xuất trực tiếp từ Hợp đồng ký kết & chuỗi cung ứng Kho thực tế (Giữ hàng → PO → Nhập kho → Xuất giao).
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[1250px] text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3 w-10 text-center whitespace-nowrap">STT</th>
                        <th className="p-3 min-w-[130px] whitespace-nowrap">Mã Hàng (SKU)</th>
                        <th className="p-3 min-w-[250px] whitespace-nowrap">Tên Sản Phẩm</th>
                        <th className="p-3 min-w-[90px] whitespace-nowrap">Hãng</th>
                        <th className="p-3 text-center w-14 whitespace-nowrap">ĐVT</th>
                        <th className="p-3 text-center bg-blue-50/40 border-x border-blue-100 min-w-[70px] whitespace-nowrap">SL HĐ</th>
                        <th className="p-3 text-right min-w-[100px] whitespace-nowrap">Đơn Giá</th>
                        <th className="p-3 text-right min-w-[110px] whitespace-nowrap">Thành Tiền</th>
                        <th className="p-3 text-center bg-slate-100 min-w-[160px] whitespace-nowrap">Tình Trạng Hàng</th>
                        <th className="p-3 text-center bg-orange-50/40 min-w-[90px] whitespace-nowrap">Đã Về Kho</th>
                        <th className="p-3 text-center bg-emerald-50/40 min-w-[90px] whitespace-nowrap">Đã Giao</th>
                        <th className="p-3 text-center min-w-[100px] whitespace-nowrap">ETA Dự Kiến</th>
                        <th className="p-3 text-center min-w-[115px] whitespace-nowrap">Ngày Về Thực Tế</th>
                        <th className="p-3 text-center min-w-[115px] whitespace-nowrap">Ngày Giao</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {customer360Items.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="p-12 text-center text-slate-400">
                            <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <span>Khách hàng chưa có mặt hàng nào trong Hợp đồng chốt.</span>
                          </td>
                        </tr>
                      ) : (
                        customer360Items.map((item, idx) => {
                          const log = item.logistics;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3 text-center text-slate-400 font-mono whitespace-nowrap">{idx + 1}</td>
                              <td className="p-3 font-mono font-bold text-blue-700 whitespace-nowrap">{item.sku}</td>
                              <td
                                className="p-3 font-bold text-slate-900 min-w-[250px] whitespace-normal break-words leading-relaxed"
                                title={item.productName}
                              >
                                {item.productName}
                              </td>
                              <td className="p-3 text-slate-600 font-semibold whitespace-nowrap">{item.brand}</td>
                              <td className="p-3 text-center text-slate-600 whitespace-nowrap">{item.unit}</td>
                              <td className="p-3 text-center font-mono font-black text-blue-900 bg-blue-50/20 border-x border-blue-100 text-sm whitespace-nowrap">
                                {item.contractQuantity.toLocaleString()}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-800 whitespace-nowrap">{formatVND(item.unitPrice)}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{formatVND(item.totalPrice)}</td>
                              
                              {/* Interactive Logistics Badge */}
                              <td className="p-3 text-center bg-slate-50/40 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedItemForTimeline(item)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer hover:shadow-xs inline-flex items-center space-x-1 ${log.statusBadgeClass}`}
                                  title="Click để xem chi tiết chuỗi cung ứng"
                                >
                                  <span>{log.statusLabel}</span>
                                  <ArrowRight className="w-3 h-3 ml-0.5 opacity-70" />
                                </button>
                              </td>

                              {/* Inbound Qty */}
                              <td className="p-3 text-center font-mono font-bold text-orange-900 bg-orange-50/20 whitespace-nowrap min-w-[90px]">
                                {log.receivedQuantity}/{item.contractQuantity}
                              </td>

                              {/* Delivered Qty */}
                              <td className="p-3 text-center font-mono font-black text-emerald-900 bg-emerald-50/20 whitespace-nowrap min-w-[90px]">
                                {log.deliveredQuantity}/{item.contractQuantity}
                              </td>

                              {/* ETA */}
                              <td className="p-3 text-center font-mono text-slate-600 whitespace-nowrap min-w-[100px]">
                                {log.expectedDeliveryDate ? formatDate(log.expectedDeliveryDate) : '—'}
                              </td>

                              {/* Actual Received Date */}
                              <td className="p-3 text-center font-mono text-orange-800 whitespace-nowrap min-w-[115px]">
                                {log.fullyReceivedDate
                                  ? formatDate(log.fullyReceivedDate)
                                  : log.firstReceivedDate
                                  ? `${formatDate(log.firstReceivedDate)} (đợt 1)`
                                  : '—'}
                              </td>

                              {/* Actual Delivered Date */}
                              <td className="p-3 text-center font-mono text-emerald-800 font-bold whitespace-nowrap min-w-[115px]">
                                {log.fullyDeliveredDate
                                  ? formatDate(log.fullyDeliveredDate)
                                  : log.firstDeliveredDate
                                  ? `${formatDate(log.firstDeliveredDate)} (đợt 1)`
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FOOTER */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="text-slate-600 font-medium">
            Customer 360 • Khách hàng <strong>{liveCustomer.name}</strong> ({liveCustomer.code})
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      </div>

      {/* ITEM SUPPLY CHAIN TIMELINE MODAL */}
      {selectedItemForTimeline && (
        <ItemLogisticsTimelineModal
          itemRow={selectedItemForTimeline}
          customerName={liveCustomer.name}
          onClose={() => setSelectedItemForTimeline(null)}
        />
      )}

      {/* CREATE CONTRACT MODAL */}
      <CreateContractFromQuoteModal
        isOpen={isCreateContractOpen}
        onClose={() => setIsCreateContractOpen(false)}
        quote={createContractQuote}
      />
    </div>
  );
};
