import React from 'react';
import { User } from '../../types';
import { TimeFilterState, TimePeriodType, getTimeFilterLabel, getCurrentQuarter } from '../../utils/dateFilters';
import {
  Calendar,
  Filter,
  UserCheck,
  Users,
  RotateCcw,
  Sparkles,
  Building,
  Clock,
  ChevronDown,
} from 'lucide-react';

interface SalesFilterControlsProps {
  currentUser: User;
  salesReps: User[];
  selectedRepId: string;
  onSelectRepId: (repId: string) => void;
  timeFilter: TimeFilterState;
  onTimeFilterChange: (newFilter: TimeFilterState) => void;
  totalContractsCount: number;
  filteredContractsCount: number;
  filteredRevenue: number;
}

export const SalesFilterControls: React.FC<SalesFilterControlsProps> = ({
  currentUser,
  salesReps,
  selectedRepId,
  onSelectRepId,
  timeFilter,
  onTimeFilterChange,
  totalContractsCount,
  filteredContractsCount,
  filteredRevenue,
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManagerC1 = currentUser.role === 'manager_c1';
  const isSalesC2 = currentUser.role === 'sales_c2';

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentQuarter = getCurrentQuarter();

  const handlePeriodClick = (period: TimePeriodType) => {
    onTimeFilterChange({
      ...timeFilter,
      period,
      selectedYear: timeFilter.selectedYear || currentYear,
      selectedMonth: period === 'month' ? (timeFilter.selectedMonth ?? currentMonth) : timeFilter.selectedMonth,
      selectedQuarter: period === 'quarter' ? (timeFilter.selectedQuarter ?? currentQuarter) : timeFilter.selectedQuarter,
    });
  };

  const handleResetFilters = () => {
    onTimeFilterChange({
      period: 'all',
      selectedYear: currentYear,
      selectedMonth: currentMonth,
      selectedQuarter: currentQuarter,
    });
    onSelectRepId('all');
  };

  const selectedRepObj = salesReps.find((r) => r.id === selectedRepId);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 sm:p-4 space-y-3.5">
      {/* Top row: Title + Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Bộ Lọc Dữ Liệu Phòng Kinh Doanh
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {isSuperAdmin && 'Toàn Hệ Thống (L0)'}
                {isManagerC1 && 'Ban Quản Lý / Trưởng Phòng (L1)'}
                {isSalesC2 && 'Nhân Viên Kinh Doanh (L2)'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Lọc theo thời gian & nhân viên để toàn bộ chỉ số doanh số, hợp đồng và bảng bên dưới thay đổi tương ứng.
            </p>
          </div>
        </div>

        {/* Quick Reset Button */}
        {(timeFilter.period !== 'all' || selectedRepId !== 'all') && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="self-start sm:self-auto px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
            title="Đặt lại toàn bộ bộ lọc về mặc định"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Xóa Bộ Lọc</span>
          </button>
        )}
      </div>

      {/* Main Filter Grid: Time Filter + Sales Rep Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left: Time Period Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Thời Gian Báo Cáo & Thống Kê:</span>
          </label>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* All Time */}
            <button
              type="button"
              onClick={() => handlePeriodClick('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                timeFilter.period === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tất Cả
            </button>

            {/* This Week */}
            <button
              type="button"
              onClick={() => handlePeriodClick('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                timeFilter.period === 'week'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tuần Này
            </button>

            {/* Month Button */}
            <button
              type="button"
              onClick={() => handlePeriodClick('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                timeFilter.period === 'month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tháng
            </button>

            {/* Quarter Button */}
            <button
              type="button"
              onClick={() => handlePeriodClick('quarter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                timeFilter.period === 'quarter'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Quý
            </button>

            {/* Year Button */}
            <button
              type="button"
              onClick={() => handlePeriodClick('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                timeFilter.period === 'year'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Năm
            </button>
          </div>

          {/* Sub-dropdowns when Month, Quarter, or Year is selected */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* If Month is selected: Pick specific month */}
            {timeFilter.period === 'month' && (
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                <span className="text-[11px] text-slate-500 font-medium pl-1.5">Chọn Tháng:</span>
                <select
                  value={timeFilter.selectedMonth !== undefined ? timeFilter.selectedMonth : currentMonth}
                  onChange={(e) =>
                    onTimeFilterChange({
                      ...timeFilter,
                      selectedMonth: parseInt(e.target.value, 10),
                    })
                  }
                  className="text-xs bg-white font-bold text-slate-800 border border-slate-300 rounded px-2 py-1 outline-hidden"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      Tháng {i + 1} {i === currentMonth ? '(Hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* If Quarter is selected: Pick specific quarter */}
            {timeFilter.period === 'quarter' && (
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                <span className="text-[11px] text-slate-500 font-medium pl-1.5">Chọn Quý:</span>
                <select
                  value={timeFilter.selectedQuarter !== undefined ? timeFilter.selectedQuarter : currentQuarter}
                  onChange={(e) =>
                    onTimeFilterChange({
                      ...timeFilter,
                      selectedQuarter: parseInt(e.target.value, 10),
                    })
                  }
                  className="text-xs bg-white font-bold text-slate-800 border border-slate-300 rounded px-2 py-1 outline-hidden"
                >
                  <option value={1}>Quý 1 (Tháng 1 - 3)</option>
                  <option value={2}>Quý 2 (Tháng 4 - 6)</option>
                  <option value={3}>Quý 3 (Tháng 7 - 9)</option>
                  <option value={4}>Quý 4 (Tháng 10 - 12)</option>
                </select>
              </div>
            )}

            {/* Year Selector (Applicable for Month, Quarter, and Year) */}
            {timeFilter.period !== 'all' && timeFilter.period !== 'week' && (
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                <span className="text-[11px] text-slate-500 font-medium pl-1.5">Năm:</span>
                <select
                  value={timeFilter.selectedYear}
                  onChange={(e) =>
                    onTimeFilterChange({
                      ...timeFilter,
                      selectedYear: parseInt(e.target.value, 10),
                    })
                  }
                  className="text-xs bg-white font-bold text-slate-800 border border-slate-300 rounded px-2 py-1 outline-hidden"
                >
                  <option value={2026}>2026 (Năm hiện tại)</option>
                  <option value={2025}>2025</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sales Rep Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Nhân Viên Kinh Doanh (Sales Rep):</span>
          </label>

          <div className="relative">
            <select
              value={selectedRepId}
              onChange={(e) => onSelectRepId(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition cursor-pointer"
            >
              <option value="all">
                {isManagerC1 ? `🌟 Toàn bộ nhân viên phòng (${salesReps.length} Sales)` : '🌟 Tất cả nhân viên kinh doanh'}
              </option>
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  👤 {rep.name} {rep.id === currentUser.id ? '(Chính bạn)' : `(${rep.department || 'Sales L2'})`}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Đang xem:{' '}
              <strong className="text-slate-800">
                {selectedRepId === 'all' ? 'Tất cả nhân viên' : selectedRepObj?.name || selectedRepId}
              </strong>
            </span>
            <span className="text-blue-600 font-semibold">{getTimeFilterLabel(timeFilter)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
