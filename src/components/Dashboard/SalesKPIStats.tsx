import React from 'react';
import { formatVND, formatNumber } from '../../utils/formatters';
import {
  TrendingUp,
  FileSignature,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  Target,
} from 'lucide-react';

interface SalesKPIStatsProps {
  totalRevenue: number;
  totalContractsCount: number;
  pipelineValue: number;
  pipelineQuotesCount: number;
  totalQuotesCount: number;
  newCustomersCount: number;
  signedCustomersCount: number;
  totalCustomersCount: number;
  salesRepLabel: string;
  timeLabel: string;
}

export const SalesKPIStats: React.FC<SalesKPIStatsProps> = ({
  totalRevenue,
  totalContractsCount,
  pipelineValue,
  pipelineQuotesCount,
  totalQuotesCount,
  newCustomersCount,
  signedCustomersCount,
  totalCustomersCount,
  salesRepLabel,
  timeLabel,
}) => {
  const avgContractValue = totalContractsCount > 0 ? Math.round(totalRevenue / totalContractsCount) : 0;
  
  // Win rate calculation
  const totalOpportunities = totalContractsCount + pipelineQuotesCount;
  const winRatePercent = totalOpportunities > 0 ? Math.round((totalContractsCount / totalOpportunities) * 100) : (totalContractsCount > 0 ? 100 : 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* KPI Card 1: Tổng Doanh Số Ký HĐ */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Tổng Doanh Số Ký HĐ
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
            {formatVND(totalRevenue)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span className="font-semibold text-slate-700">
              {totalContractsCount} Hợp đồng ký kết
            </span>
            <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.2 rounded">
              TB: {formatVND(avgContractValue)}/HĐ
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">{salesRepLabel}</span>
          <span className="font-medium text-slate-500 truncate ml-1">{timeLabel}</span>
        </div>
      </div>

      {/* KPI Card 2: Hợp Đồng Đã Ký & Tỷ Lệ Chốt */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Hợp Đồng Đã Ký & Tỷ Lệ
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
            <FileSignature className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {totalContractsCount} <span className="text-sm font-bold text-slate-500">HĐ</span>
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              Tỷ lệ chốt: {winRatePercent}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>{signedCustomersCount} khách hàng đã chốt</span>
            <span className="text-[11px] text-slate-400">Từ {totalQuotesCount} báo giá</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1 text-emerald-600 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã khóa giữ tồn kho</span>
          </span>
          <span className="font-medium text-slate-500 truncate ml-1">Kỳ này</span>
        </div>
      </div>

      {/* KPI Card 3: Giá Trị Báo Giá Đang Đàm Phán (Pipeline) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Báo Giá Đang Đàm Phán
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono tracking-tight">
            {formatVND(pipelineValue)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span className="font-semibold text-slate-700">
              {pipelineQuotesCount} Báo giá đang mở
            </span>
            <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.2 rounded">
              Pipeline tiềm năng
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">Cơ hội chốt sắp tới</span>
          <span className="font-medium text-slate-500 truncate ml-1">{timeLabel}</span>
        </div>
      </div>

      {/* KPI Card 4: Khách Hàng & Nhu Cầu Mới */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Khách Hàng Phụ Trách
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {totalCustomersCount} <span className="text-sm font-bold text-slate-500">Khách</span>
            </span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              +{newCustomersCount} mới trong kỳ
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Tiến độ chăm sóc phễu</span>
            <span className="text-[11px] text-emerald-600 font-semibold">{signedCustomersCount} đã ký HĐ</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">Chăm sóc & Báo giá</span>
          <span className="font-medium text-slate-500 truncate ml-1">{timeLabel}</span>
        </div>
      </div>
    </div>
  );
};
