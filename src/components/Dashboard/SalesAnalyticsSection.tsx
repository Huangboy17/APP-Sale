import React from 'react';
import { User, Contract, Quotation, Customer } from '../../types';
import { formatVND, formatNumber } from '../../utils/formatters';
import {
  Trophy,
  Users,
  Target,
  ArrowRight,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  PieChart,
} from 'lucide-react';

interface SalesAnalyticsSectionProps {
  salesReps: User[];
  contracts: Contract[];
  quotations: Quotation[];
  customers: Customer[];
  selectedRepId: string;
  onSelectRepId: (repId: string) => void;
  totalRevenue: number;
}

export const SalesAnalyticsSection: React.FC<SalesAnalyticsSectionProps> = ({
  salesReps,
  contracts,
  quotations,
  customers,
  selectedRepId,
  onSelectRepId,
  totalRevenue,
}) => {
  // Compute leaderboard stats for each rep
  const repStats = salesReps.map((rep) => {
    const repContracts = contracts.filter((c) => c.salesRepId === rep.id);
    const repRevenue = repContracts.reduce((sum, c) => sum + c.totalValue, 0);
    const repQuotations = quotations.filter(
      (q) => q.salesRepId === rep.id && (q.status === 'sent' || q.status === 'negotiating')
    );
    const repPipeline = repQuotations.reduce((sum, q) => sum + q.grandTotal, 0);
    const repCustomers = customers.filter(
      (cust) => cust.assignedToId === rep.id || cust.createdBy === rep.id
    );

    const contributionPercent = totalRevenue > 0 ? Math.round((repRevenue / totalRevenue) * 100) : 0;

    return {
      rep,
      contractsCount: repContracts.length,
      revenue: repRevenue,
      pipelineValue: repPipeline,
      quotesCount: repQuotations.length,
      customersCount: repCustomers.length,
      contributionPercent,
    };
  });

  // Sort by revenue descending
  repStats.sort((a, b) => b.revenue - a.revenue);

  // Milestone payment calculations across current filtered contracts
  let totalPaidMilestones = 0;
  let totalPendingMilestones = 0;
  contracts.forEach((c) => {
    c.milestones?.forEach((m) => {
      if (m.status === 'completed') {
        totalPaidMilestones += m.amount;
      } else {
        totalPendingMilestones += m.amount;
      }
    });
  });

  // Customer stages breakdown
  const stageNew = customers.filter((c) => c.stage === 'new').length;
  const stageContacted = customers.filter((c) => c.stage === 'contacted').length;
  const stageQuoting = customers.filter((c) => c.stage === 'quoting').length;
  const stageSigned = customers.filter((c) => c.stage === 'contract_signed').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left 7 cols: Team Sales Leaderboard & Performance */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              Xếp Hạng & Đóng Góp Doanh Số Nhân Viên Sales
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            {salesReps.length} Nhân viên kinh doanh
          </span>
        </div>

        <div className="p-3 flex-1 overflow-x-auto">
          {repStats.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Chưa có dữ liệu nhân viên kinh doanh.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-bold uppercase">
                  <th className="pb-2 pl-2"># Nhân Viên</th>
                  <th className="pb-2 text-right">Doanh Số Ký</th>
                  <th className="pb-2 text-center">Số HĐ</th>
                  <th className="pb-2 text-right">Pipeline</th>
                  <th className="pb-2 text-right pr-2">Đóng Góp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {repStats.map((item, idx) => {
                  const isSelected = selectedRepId === item.rep.id;
                  return (
                    <tr
                      key={item.rep.id}
                      onClick={() => onSelectRepId(isSelected ? 'all' : item.rep.id)}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/70 text-blue-900 font-bold' : ''
                      }`}
                      title="Bấm để lọc toàn bộ bảng theo nhân viên này"
                    >
                      <td className="py-2.5 pl-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-700'
                                : idx === 2
                                ? 'bg-amber-800/10 text-amber-900'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-slate-900 font-bold flex items-center space-x-1">
                              <span>{item.rep.name}</span>
                              {isSelected && (
                                <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                                  Đang chọn
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {item.rep.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatVND(item.revenue)}
                      </td>

                      <td className="py-2.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                          {item.contractsCount} HĐ
                        </span>
                      </td>

                      <td className="py-2.5 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatVND(item.pipelineValue)}
                      </td>

                      <td className="py-2.5 text-right pr-2 whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, item.contributionPercent)}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-slate-700 w-8 text-right">
                            {item.contributionPercent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right 5 cols: Customer Funnel & Payment Milestones */}
      <div className="lg:col-span-5 space-y-4">
        {/* Customer Pipeline Mini Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Phân Bổ Phễu Khách Hàng</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500">{customers.length} Khách</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg">
              <div className="flex items-center justify-between text-xs font-bold text-sky-800">
                <span>1. Tiếp nhận mới</span>
                <span className="w-5 h-5 bg-sky-200 rounded-full flex items-center justify-center text-[11px]">
                  {stageNew}
                </span>
              </div>
              <p className="text-[10px] text-sky-600 mt-1">Phân bổ / Tìm kiếm</p>
            </div>

            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                <span>2. Đang tiếp cận</span>
                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-[11px]">
                  {stageContacted}
                </span>
              </div>
              <p className="text-[10px] text-blue-600 mt-1">Khảo sát & Trao đổi</p>
            </div>

            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                <span>3. Báo giá & Đàm phán</span>
                <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-[11px]">
                  {stageQuoting}
                </span>
              </div>
              <p className="text-[10px] text-amber-600 mt-1">Gửi v1, v2 & Chốt</p>
            </div>

            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>4. Đã Ký Hợp Đồng</span>
                <span className="w-5 h-5 bg-emerald-200 rounded-full flex items-center justify-center text-[11px]">
                  {stageSigned}
                </span>
              </div>
              <p className="text-[10px] text-emerald-600 mt-1">Khóa giữ tồn kho</p>
            </div>
          </div>
        </div>

        {/* Milestone Payment Progress */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Tiến Độ Tạm Ứng / Thu Tiền Hợp Đồng</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-700">
              {formatVND(totalRevenue)}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã thu tiền / Tạm ứng đợt:</span>
              </div>
              <span className="font-mono font-bold text-emerald-800">
                {formatVND(totalPaidMilestones)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Còn phải thu theo tiến độ:</span>
              </div>
              <span className="font-mono font-bold text-slate-800">
                {formatVND(totalPendingMilestones || totalRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
