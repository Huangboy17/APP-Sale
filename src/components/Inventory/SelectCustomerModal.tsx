import React, { useState, useMemo } from 'react';
import { Customer, Contract, ReserveItem, OrderItem } from '../../types';
import {
  getCustomersWithDeliverableSummary,
  CustomerDeliverableSummary,
} from '../../services/stockOutService';
import {
  Search,
  Users,
  Building,
  Phone,
  PackageCheck,
  CheckCircle2,
  X,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface SelectCustomerModalProps {
  isOpen: boolean;
  customers: Customer[];
  contracts: Contract[];
  reserveItems: ReserveItem[];
  orderItems: OrderItem[];
  selectedCustomerId?: string;
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}

export const SelectCustomerModal: React.FC<SelectCustomerModalProps> = ({
  isOpen,
  customers,
  contracts,
  reserveItems,
  orderItems,
  selectedCustomerId,
  onSelect,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyDeliverable, setOnlyDeliverable] = useState(true);

  const summaries = useMemo(() => {
    return getCustomersWithDeliverableSummary(customers, contracts, reserveItems, orderItems);
  }, [customers, contracts, reserveItems, orderItems]);

  const filteredSummaries = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return summaries.filter((s) => {
      const c = s.customer;
      const matchSearch =
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q);

      const matchDeliverable = !onlyDeliverable || s.totalDeliverableQty > 0;
      return matchSearch && matchDeliverable;
    });
  }, [summaries, searchTerm, onlyDeliverable]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Chọn Khách Hàng Xuất Kho</h3>
              <p className="text-[11px] text-slate-400">
                Tìm khách hàng có hợp đồng và hàng giữ/đặt sẵn sàng giao
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

        {/* Search & Quick Filter */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo mã KH, tên khách hàng, SĐT, công ty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden font-medium"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={onlyDeliverable}
                onChange={(e) => setOnlyDeliverable(e.target.checked)}
                className="w-3.5 h-3.5 text-rose-600 rounded focus:ring-rose-500 border-slate-300 cursor-pointer"
              />
              <span>Chỉ hiển thị khách hàng có hàng sẵn sàng xuất ({summaries.filter((s) => s.totalDeliverableQty > 0).length})</span>
            </label>

            <span className="text-[11px] text-slate-500 font-bold">
              Tìm thấy {filteredSummaries.length} khách hàng
            </span>
          </div>
        </div>

        {/* Customer List */}
        <div className="p-3.5 overflow-y-auto space-y-2 flex-1">
          {filteredSummaries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Không tìm thấy khách hàng nào phù hợp với bộ lọc.</p>
            </div>
          ) : (
            filteredSummaries.map((s) => {
              const c = s.customer;
              const isSelected = selectedCustomerId === c.id;
              const hasDeliverable = s.totalDeliverableQty > 0;

              return (
                <div
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-300'
                      : hasDeliverable
                      ? 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/80 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {c.code || 'KH'}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        {c.name}
                      </h4>
                      {isSelected && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full border border-rose-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đang chọn</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      {c.company && (
                        <span className="flex items-center space-x-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{c.company}</span>
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">{c.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Deliverable KPI Summary */}
                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="flex items-baseline space-x-1 justify-end">
                        <span className={`text-base font-black font-mono ${hasDeliverable ? 'text-rose-700' : 'text-slate-400'}`}>
                          {s.totalDeliverableQty.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">sp sẵn xuất</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {s.deliverableContractCount} HĐ sẵn sàng
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(c);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700'
                      }`}
                    >
                      <span>Chọn</span>
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
            Chọn một khách hàng để tiếp tục chọn Hợp đồng tương ứng
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
