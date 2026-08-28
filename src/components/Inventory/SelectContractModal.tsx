import React, { useState, useMemo } from 'react';
import { Contract, Customer, ReserveItem, OrderItem } from '../../types';
import {
  getContractsWithDeliverableSummary,
  ContractDeliverableSummary,
} from '../../services/stockOutService';
import { formatDate } from '../../utils/formatters';
import {
  Search,
  FileText,
  Building,
  Calendar,
  PackageCheck,
  CheckCircle2,
  X,
  ArrowRight,
  Filter,
  Layers,
} from 'lucide-react';

interface SelectContractModalProps {
  isOpen: boolean;
  contracts: Contract[];
  customers: Customer[];
  reserveItems: ReserveItem[];
  orderItems: OrderItem[];
  selectedCustomerId?: string;
  selectedCustomerName?: string;
  selectedContractId?: string;
  onSelect: (contract: Contract, customer?: Customer) => void;
  onClearCustomerFilter?: () => void;
  onClose: () => void;
}

export const SelectContractModal: React.FC<SelectContractModalProps> = ({
  isOpen,
  contracts,
  customers,
  reserveItems,
  orderItems,
  selectedCustomerId,
  selectedCustomerName,
  selectedContractId,
  onSelect,
  onClearCustomerFilter,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyDeliverable, setOnlyDeliverable] = useState(true);
  const [filterBySelectedCustomer, setFilterBySelectedCustomer] = useState(!!selectedCustomerId);

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

  const targetCustomerId = filterBySelectedCustomer ? selectedCustomerId : undefined;

  const summaries = useMemo(() => {
    return getContractsWithDeliverableSummary(
      contracts,
      customers,
      reserveItems,
      orderItems,
      targetCustomerId
    );
  }, [contracts, customers, reserveItems, orderItems, targetCustomerId]);

  const filteredSummaries = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return summaries.filter((s) => {
      const c = s.contract;
      const matchSearch =
        !q ||
        (c.contractNumber || '').toLowerCase().includes(q) ||
        (s.customerName || '').toLowerCase().includes(q) ||
        (s.customerCode || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q);

      const matchDeliverable = !onlyDeliverable || s.totalDeliverableQty > 0;
      return matchSearch && matchDeliverable;
    });
  }, [summaries, searchTerm, onlyDeliverable]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Chọn Hợp Đồng Nguồn Xuất Kho</h3>
              <p className="text-[11px] text-slate-400">
                {selectedCustomerName
                  ? `Đang lọc hợp đồng của khách hàng: ${selectedCustomerName}`
                  : 'Tìm kiếm hợp đồng có hàng giữ và hàng đặt đã về sẵn sàng giao'}
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

        {/* Search & Filters */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo số HĐ, tên khách hàng, mã khách, tiêu đề HĐ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={onlyDeliverable}
                  onChange={(e) => setOnlyDeliverable(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span>Chỉ hiển thị HĐ có hàng sẵn xuất ({summaries.filter((s) => s.totalDeliverableQty > 0).length})</span>
              </label>

              {selectedCustomerId && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterBySelectedCustomer(!filterBySelectedCustomer);
                    if (filterBySelectedCustomer && onClearCustomerFilter) {
                      onClearCustomerFilter();
                    }
                  }}
                  className="text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  {filterBySelectedCustomer ? 'Bỏ lọc theo khách hàng này' : `Chỉ xem HĐ của ${selectedCustomerName}`}
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-500 font-bold">
              Tìm thấy {filteredSummaries.length} hợp đồng
            </span>
          </div>
        </div>

        {/* Contract List */}
        <div className="p-3.5 overflow-y-auto space-y-2 flex-1">
          {filteredSummaries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Không tìm thấy hợp đồng nào phù hợp có hàng sẵn xuất.</p>
            </div>
          ) : (
            filteredSummaries.map((s) => {
              const c = s.contract;
              const isSelected = selectedContractId === c.id;
              const hasDeliverable = s.totalDeliverableQty > 0;
              const associatedCustomer = customerMap.get(c.customerId);

              return (
                <div
                  key={c.id}
                  onClick={() => onSelect(c, associatedCustomer)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-300'
                      : hasDeliverable
                      ? 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {c.contractNumber}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        {s.customerName}
                      </h4>
                      {isSelected && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full border border-blue-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đang chọn</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Ký: {formatDate(c.contractDate || c.createdAt)}</span>
                      </span>
                      {c.deliveryDate && (
                        <span className="text-slate-600 font-medium">
                          Hạn giao: {formatDate(c.deliveryDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Deliverable KPI Summary */}
                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="flex items-baseline space-x-1 justify-end">
                        <span className={`text-base font-black font-mono ${hasDeliverable ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {s.totalDeliverableQty.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">sp sẵn xuất</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {s.deliverableItemCount} mặt hàng sẵn sàng
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(c, associatedCustomer);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                      }`}
                    >
                      <span>Chọn HĐ</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            Hệ thống sẽ tự động trích xuất toàn bộ hàng giữ và hàng đặt đã về của hợp đồng được chọn
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
