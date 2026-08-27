export type TimePeriodType = 'all' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface TimeFilterState {
  period: TimePeriodType;
  selectedMonth?: number; // 0 - 11 (Tháng 1 - 12)
  selectedQuarter?: number; // 1, 2, 3, 4
  selectedYear: number; // 2026, 2025...
  customStartDate?: string;
  customEndDate?: string;
}

export const getCurrentQuarter = (date: Date = new Date()): number => {
  return Math.floor(date.getMonth() / 3) + 1;
};

export const getStartAndEndOfWeek = (date: Date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  // In Vietnam, week starts on Monday (1) to Sunday (0)
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(d.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
};

export const isDateInFilter = (
  dateInput: string | Date | undefined | null,
  filter: TimeFilterState
): boolean => {
  if (!dateInput) return false;
  if (filter.period === 'all') return true;

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth(); // 0 - 11
  const targetQuarter = Math.floor(targetMonth / 3) + 1;

  switch (filter.period) {
    case 'week': {
      const { start, end } = getStartAndEndOfWeek(now);
      return date >= start && date <= end;
    }

    case 'month': {
      const monthToCheck = filter.selectedMonth !== undefined ? filter.selectedMonth : now.getMonth();
      const yearToCheck = filter.selectedYear || now.getFullYear();
      return targetMonth === monthToCheck && targetYear === yearToCheck;
    }

    case 'quarter': {
      const quarterToCheck = filter.selectedQuarter !== undefined ? filter.selectedQuarter : getCurrentQuarter(now);
      const yearToCheck = filter.selectedYear || now.getFullYear();
      return targetQuarter === quarterToCheck && targetYear === yearToCheck;
    }

    case 'year': {
      const yearToCheck = filter.selectedYear || now.getFullYear();
      return targetYear === yearToCheck;
    }

    case 'custom': {
      if (!filter.customStartDate && !filter.customEndDate) return true;
      const start = filter.customStartDate ? new Date(filter.customStartDate) : new Date('1970-01-01');
      start.setHours(0, 0, 0, 0);
      const end = filter.customEndDate ? new Date(filter.customEndDate) : new Date('2099-12-31');
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    }

    default:
      return true;
  }
};

export const getTimeFilterLabel = (filter: TimeFilterState): string => {
  const now = new Date();
  switch (filter.period) {
    case 'all':
      return 'Toàn bộ thời gian';
    case 'week': {
      const { start, end } = getStartAndEndOfWeek(now);
      const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      return `Tuần này (${fmt(start)} - ${fmt(end)})`;
    }
    case 'month': {
      const m = filter.selectedMonth !== undefined ? filter.selectedMonth + 1 : now.getMonth() + 1;
      const y = filter.selectedYear || now.getFullYear();
      return `Tháng ${m}/${y}`;
    }
    case 'quarter': {
      const q = filter.selectedQuarter !== undefined ? filter.selectedQuarter : getCurrentQuarter(now);
      const y = filter.selectedYear || now.getFullYear();
      return `Quý ${q}/${y}`;
    }
    case 'year': {
      const y = filter.selectedYear || now.getFullYear();
      return `Năm ${y}`;
    }
    case 'custom': {
      if (filter.customStartDate && filter.customEndDate) {
        return `Từ ${filter.customStartDate} đến ${filter.customEndDate}`;
      }
      return 'Khoảng ngày tùy chỉnh';
    }
    default:
      return 'Thời gian lọc';
  }
};
