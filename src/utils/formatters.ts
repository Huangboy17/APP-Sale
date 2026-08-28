import * as XLSX from 'xlsx';
import { CustomerStage, ProductPriceItem, InventoryItem, QuotationStatus } from '../types';

export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num || 0);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

// Convert number to Vietnamese text for contracts
export const numberToVietnameseWords = (n: number): string => {
  if (n === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  const readThreeDigits = (num: number, showZeroHundred: boolean): string => {
    let res = '';
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    const ten = Math.floor(remainder / 10);
    const unit = remainder % 10;

    if (hundred > 0 || showZeroHundred) {
      res += digits[hundred] + ' trăm ';
      if (ten === 0 && unit > 0) res += 'lẻ ';
    }

    if (ten > 1) {
      res += digits[ten] + ' mươi ';
      if (unit === 1) res += 'mốt ';
    } else if (ten === 1) {
      res += 'mười ';
      if (unit === 1) res += 'một ';
    }

    if (ten > 0 && unit === 5) {
      res += 'lăm ';
    } else if (ten === 0 && unit === 5 && (hundred > 0 || showZeroHundred)) {
      res += 'năm ';
    } else if (unit > 0 && !(ten >= 1 && unit === 1)) {
      res += digits[unit] + ' ';
    }

    return res.trim();
  };

  let num = Math.abs(Math.round(n));
  const parts: number[] = [];
  while (num > 0) {
    parts.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  let result = '';
  for (let i = parts.length - 1; i >= 0; i--) {
    const val = parts[i];
    if (val > 0) {
      const showZero = i < parts.length - 1;
      const str = readThreeDigits(val, showZero);
      result += str + ' ' + units[i] + ' ';
    }
  }

  result = result.trim();
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn';
  }
  return result;
};

// Stage visual helpers
export const getCustomerStageConfig = (stage: CustomerStage) => {
  switch (stage) {
    case 'new':
      return {
        label: 'Tạo mới',
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        badge: 'bg-sky-500',
        color: '#0284c7',
      };
    case 'contacted':
      return {
        label: 'Đang tiếp cận',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        badge: 'bg-blue-500',
        color: '#2563eb',
      };
    case 'quoting':
      return {
        label: 'Đang báo giá',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'bg-amber-500',
        color: '#d97706',
      };
    case 'contract_signed':
      return {
        label: 'Chốt - Đã ký HĐ',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badge: 'bg-emerald-500',
        color: '#059669',
      };
    case 'rejected':
      return {
        label: 'Từ chối / Mất khách',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        badge: 'bg-rose-500',
        color: '#e11d48',
      };
    default:
      return {
        label: stage,
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        badge: 'bg-slate-500',
        color: '#64748b',
      };
  }
};

export const getQuotationStatusConfig = (status: QuotationStatus) => {
  switch (status) {
    case 'draft':
      return { label: 'Bản nháp', bg: 'bg-slate-100 text-slate-700' };
    case 'sent':
      return { label: 'Đã gửi khách', bg: 'bg-blue-100 text-blue-700' };
    case 'negotiating':
      return { label: 'Đang đàm phán', bg: 'bg-amber-100 text-amber-700' };
    case 'approved_contract':
      return { label: 'Đã chốt ký HĐ', bg: 'bg-emerald-100 text-emerald-800' };
    case 'cancelled':
      return { label: 'Đã hủy', bg: 'bg-rose-100 text-rose-700' };
    default:
      return { label: status, bg: 'bg-gray-100 text-gray-700' };
  }
};

// Excel Helpers
export const exportProductsToExcel = (products: ProductPriceItem[], inventory?: InventoryItem[]) => {
  const invMap = new Map<string, InventoryItem>();
  if (inventory) {
    inventory.forEach((inv) => invMap.set(inv.sku.trim().toLowerCase(), inv));
  }

  const data = products.map((p, idx) => {
    const inv = invMap.get(p.sku.trim().toLowerCase());
    return {
      'STT': idx + 1,
      'Mã hàng (SKU)': p.sku,
      'Tên hàng hóa / Sản phẩm': p.name,
      'Phân loại': p.category,
      'Hãng sản xuất': p.brand,
      'Màu sắc': p.color,
      'Kích thước / Quy cách': p.size,
      'Đơn vị tính': p.unit,
      'Tồn Thực Tế': inv ? inv.totalQuantity : 0,
      'Đang Giữ Hàng (HĐ)': inv ? inv.reservedQuantity : 0,
      'Tồn Khả Dụng Để Bán': inv ? inv.availableQuantity : 0,
      'Giá niêm yết (VNĐ)': p.listPrice,
      'Giá DP (Giá sàn tối thiểu)': p.dpPrice,
      'Mô tả chi tiết': p.description || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bang_Gia_San_Pham');
  XLSX.writeFile(workbook, `Data_Gia_San_Pham_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const downloadProductTemplateExcel = () => {
  const sampleData = [
    {
      'STT': 1,
      'Mã hàng (SKU)': 'LED-DL-01-W',
      'Tên hàng hóa / Sản phẩm': 'Đèn Downlight Âm Trần COB 12W Viền Trắng',
      'Phân loại': 'Đèn chiếu sáng',
      'Hãng sản xuất': 'Philips',
      'Màu sắc': 'Trắng 3000K',
      'Kích thước / Quy cách': 'D110xH65mm (Lỗ khoét D90mm)',
      'Đơn vị tính': 'Bộ',
      'Giá niêm yết (VNĐ)': 450000,
      'Giá DP (Giá sàn tối thiểu)': 320000,
      'Mô tả chi tiết': 'Chíp Bridgelux USA, CRI>90, bảo hành 36 tháng',
    },
    {
      'STT': 2,
      'Mã hàng (SKU)': 'SW-SCH-01-BK',
      'Tên hàng hóa / Sản phẩm': 'Công Tắc 3 Phím AvatarOn Mặt Vuông',
      'Phân loại': 'Thiết bị điện',
      'Hãng sản xuất': 'Schneider',
      'Màu sắc': 'Đen Ánh Kim',
      'Kích thước / Quy cách': '86x86mm chuẩn Vuông',
      'Đơn vị tính': 'Cái',
      'Giá niêm yết (VNĐ)': 290000,
      'Giá DP (Giá sàn tối thiểu)': 215000,
      'Mô tả chi tiết': 'Dòng AvatarOn cao cấp, tiếp điểm bạc chống hồ quang',
    },
    {
      'STT': 3,
      'Mã hàng (SKU)': 'LED-PANEL-6060',
      'Tên hàng hóa / Sản phẩm': 'Đèn Panel Tấm Âm Trần 600x600 48W',
      'Phân loại': 'Đèn chiếu sáng',
      'Hãng sản xuất': 'Paragon',
      'Màu sắc': 'Trắng 4000K',
      'Kích thước / Quy cách': '600x600mm',
      'Đơn vị tính': 'Bộ',
      'Giá niêm yết (VNĐ)': 850000,
      'Giá DP (Giá sàn tối thiểu)': 620000,
      'Mô tả chi tiết': 'Khung nhôm sơn tĩnh điện siêu mỏng, nguồn Driver Meanwell',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Data_Gia');
  XLSX.writeFile(workbook, 'Mau_Import_Data_Gia_San_Pham.xlsx');
};

export const exportInventoryToExcel = (inventory: InventoryItem[]) => {
  const data = inventory.map((i, idx) => ({
    'STT': idx + 1,
    'Mã hàng (SKU)': i.sku,
    'Tên hàng hóa': i.name,
    'ĐVT': i.unit,
    'Tồn thực tế': i.totalQuantity,
    'Đang giữ hàng': i.reservedQuantity,
    'Tồn khả dụng': i.availableQuantity,
    'Vị trí kho': i.warehouseLocation || '',
    'Ngày cập nhật': i.updatedAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ton_Kho');
  XLSX.writeFile(workbook, `Bang_Ton_Kho_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const downloadInventoryTemplateExcel = () => {
  const sampleData = [
    {
      'STT': 1,
      'Mã hàng (SKU)': 'LED-DL-01-W',
      'Tên hàng hóa': 'Đèn Downlight Âm Trần COB 12W Viền Trắng',
      'ĐVT': 'Bộ',
      'Tồn thực tế': 150,
      'Vị trí kho': 'Kho Tổng HCM (Kệ A1-01)',
      'Ghi chú': 'Hàng có sẵn tại kho',
    },
    {
      'STT': 2,
      'Mã hàng (SKU)': 'SW-SCH-01-BK',
      'Tên hàng hóa': 'Công Tắc 3 Phím AvatarOn Mặt Vuông',
      'ĐVT': 'Cái',
      'Tồn thực tế': 80,
      'Vị trí kho': 'Kho Tổng HCM (Kệ B2-05)',
      'Ghi chú': 'Hàng nhập khẩu chính hãng',
    },
    {
      'STT': 3,
      'Mã hàng (SKU)': 'LED-PANEL-6060',
      'Tên hàng hóa': 'Đèn Panel Tấm Âm Trần 600x600 48W',
      'ĐVT': 'Bộ',
      'Tồn thực tế': 25,
      'Vị trí kho': 'Kho Hà Nội (Kệ C3-02)',
      'Ghi chú': 'Sẵn sàng giao dự án',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Ton_Kho');
  XLSX.writeFile(workbook, 'Mau_Import_Ton_Kho.xlsx');
};

export const downloadInventoryTemplateJson = () => {
  const sampleData = [
    {
      product_code: 'LED-DL-01-W',
      product_name: 'Đèn Downlight Âm Trần COB 12W Viền Trắng',
      unit: 'Bộ',
      total_quantity: 150,
      warehouse_location: 'Kho Tổng HCM (Kệ A1-01)',
      notes: 'Hàng có sẵn tại kho',
    },
    {
      product_code: 'SW-SCH-01-BK',
      product_name: 'Công Tắc 3 Phím AvatarOn Mặt Vuông',
      unit: 'Cái',
      total_quantity: 80,
      warehouse_location: 'Kho Tổng HCM (Kệ B2-05)',
      notes: 'Hàng nhập khẩu chính hãng',
    },
    {
      product_code: 'LED-PANEL-6060',
      product_name: 'Đèn Panel Tấm Âm Trần 600x600 48W',
      unit: 'Bộ',
      total_quantity: 25,
      warehouse_location: 'Kho Hà Nội (Kệ C3-02)',
      notes: 'Sẵn sàng giao dự án',
    },
  ];

  const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mau-import-ton-kho.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const parseExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Safely parse numeric values from Excel cells.
 * Handles: numbers, strings with commas/dots ("1,500,000" or "1.500.000" or "1500.5"),
 * empty strings, null, undefined, text.
 * NEVER returns NaN. Fallback to defaultVal (default 0).
 */
export const parseExcelNumber = (val: any, defaultVal = 0): number => {
  if (val === null || val === undefined || val === '') return defaultVal;
  if (typeof val === 'number') {
    return isNaN(val) ? defaultVal : val;
  }
  const str = String(val).trim();
  if (!str) return defaultVal;

  let cleaned = str;
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/,/g, '');
  } else if ((cleaned.match(/\./g) || []).length > 1) {
    cleaned = cleaned.replace(/\./g, '');
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(',', '.');
    }
  }

  cleaned = cleaned.replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? defaultVal : parsed;
};

/**
 * Safely clean string values from Excel cells.
 * Prevents literal "undefined" or "null" strings, null, undefined.
 */
export const cleanExcelString = (val: any, fallback = ''): string => {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  if (str === 'undefined' || str === 'null' || str === '') return fallback;
  return str;
};

