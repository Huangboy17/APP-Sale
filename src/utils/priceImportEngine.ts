import * as XLSX from 'xlsx';
import { PriceImportRecord, ValidatedPriceRow, PriceImportValidationResult } from '../types';
import { parseExcelNumber, cleanExcelString } from './formatters';

/**
 * Gets sheet names from an Excel file
 */
export async function getExcelSheetNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.SheetNames || ['Sheet1']);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses an Excel file into standard PriceImportRecord[]
 */
export async function parseExcelToPriceRecords(
  file: File,
  targetSheetName?: string
): Promise<{ sheetNames: string[]; activeSheet: string; records: PriceImportRecord[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames || ['Sheet1'];
        const activeSheet = targetSheetName && sheetNames.includes(targetSheetName)
          ? targetSheetName
          : sheetNames[0];

        const worksheet = workbook.Sheets[activeSheet];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const records: PriceImportRecord[] = [];

        rawRows.forEach((r: any) => {
          // Normalize column headers using aliases
          const rawSku =
            r['product_code'] ||
            r['productCode'] ||
            r['Mã hàng (SKU)'] ||
            r['Mã hàng'] ||
            r['SKU'] ||
            r['Ma_Hang'] ||
            r['Mã SP'] ||
            r['Mã sản phẩm'] ||
            r['Mã'];

          const rawName =
            r['product_name'] ||
            r['productName'] ||
            r['Tên hàng hóa / Sản phẩm'] ||
            r['Tên hàng'] ||
            r['Tên sản phẩm'] ||
            r['Tên SP'] ||
            r['Ten_Hang'] ||
            r['Name'] ||
            r['Tên'];

          const rawUnit =
            r['unit'] ||
            r['Đơn vị tính'] ||
            r['ĐVT'] ||
            r['Đơn vị'] ||
            r['Unit'] ||
            'Bộ';

          const rawPrice =
            r['price'] ||
            r['listPrice'] ||
            r['list_price'] ||
            r['Giá niêm yết (VNĐ)'] ||
            r['Giá niêm yết'] ||
            r['Giá bán'] ||
            r['Đơn giá'] ||
            r['Giá'] ||
            0;

          const rawDpPrice =
            r['dp_price'] ||
            r['dpPrice'] ||
            r['Giá DP (Giá sàn tối thiểu)'] ||
            r['Giá DP'] ||
            r['DpPrice'] ||
            r['Giá sàn'] ||
            0;

          const rawCategory = r['category'] || r['Phân loại'] || r['Category'] || r['Nhóm hàng'] || 'Chung';
          const rawBrand = r['brand'] || r['Hãng sản xuất'] || r['Hãng'] || r['Brand'] || r['Thương hiệu'] || 'Khác';
          const rawColor = r['color'] || r['Màu sắc'] || r['Color'] || r['Màu'] || 'Tiêu chuẩn';
          const rawSize = r['size'] || r['Kích thước / Quy cách'] || r['Size'] || r['Quy cách'] || 'Tiêu chuẩn';
          const rawDesc = r['description'] || r['Mô tả chi tiết'] || r['Mô tả'] || r['Description'] || '';

          // Skip completely blank rows
          if (!rawSku && !rawName && !rawPrice) {
            return;
          }

          const productCode = cleanExcelString(rawSku).toUpperCase();
          const productName = cleanExcelString(rawName);

          records.push({
            product_code: productCode,
            product_name: productName,
            unit: cleanExcelString(rawUnit, 'Bộ'),
            price: parseExcelNumber(rawPrice, 0),
            dp_price: parseExcelNumber(rawDpPrice, 0),
            category: cleanExcelString(rawCategory, 'Chung'),
            brand: cleanExcelString(rawBrand, 'Khác'),
            color: cleanExcelString(rawColor, 'Tiêu chuẩn'),
            size: cleanExcelString(rawSize, 'Tiêu chuẩn'),
            description: cleanExcelString(rawDesc, ''),
          });
        });

        resolve({ sheetNames, activeSheet, records });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses JSON content into standard PriceImportRecord[]
 */
export function parseJsonToPriceRecords(jsonContent: string): PriceImportRecord[] {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    throw new Error('Cấu trúc file JSON bị lỗi (SyntaxError), vui lòng kiểm tra lại file .json!');
  }

  if (!Array.isArray(parsed)) {
    // If it's a wrapper object like { data: [...] } or { products: [...] }
    if (parsed && typeof parsed === 'object') {
      const possibleArray = parsed.data || parsed.products || parsed.items || parsed.records;
      if (Array.isArray(possibleArray)) {
        parsed = possibleArray;
      } else {
        throw new Error('Dữ liệu JSON phải là mảng các đối tượng sản phẩm [...]!');
      }
    } else {
      throw new Error('Dữ liệu JSON không hợp lệ!');
    }
  }

  return parsed.map((item: any) => {
    const rawSku = item.product_code || item.sku || item.productCode || item.code || '';
    const rawName = item.product_name || item.name || item.productName || '';
    const rawUnit = item.unit || item.unit_name || item.dvt || 'Bộ';
    const rawPrice = item.price ?? item.listPrice ?? item.list_price ?? 0;
    const rawDpPrice = item.dp_price ?? item.dpPrice ?? 0;
    const rawCategory = item.category || 'Chung';
    const rawBrand = item.brand || 'Khác';
    const rawColor = item.color || 'Tiêu chuẩn';
    const rawSize = item.size || 'Tiêu chuẩn';
    const rawDesc = item.description || '';

    return {
      product_code: cleanExcelString(rawSku).toUpperCase(),
      product_name: cleanExcelString(rawName),
      unit: cleanExcelString(rawUnit, 'Bộ'),
      price: parseExcelNumber(rawPrice, 0),
      dp_price: parseExcelNumber(rawDpPrice, 0),
      category: cleanExcelString(rawCategory, 'Chung'),
      brand: cleanExcelString(rawBrand, 'Khác'),
      color: cleanExcelString(rawColor, 'Tiêu chuẩn'),
      size: cleanExcelString(rawSize, 'Tiêu chuẩn'),
      description: cleanExcelString(rawDesc, ''),
    };
  });
}

/**
 * Validates standard PriceImportRecord[] and computes detailed validation result
 */
export function validatePriceImportRecords(
  records: PriceImportRecord[],
  existingSkus: Set<string>
): PriceImportValidationResult {
  const rows: ValidatedPriceRow[] = [];
  const seenSkusInBatch = new Set<string>();

  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let newItemsCount = 0;
  let updateItemsCount = 0;

  records.forEach((rec, idx) => {
    const rowIndex = idx + 1;
    let status: 'valid' | 'warning' | 'error' = 'valid';
    let statusMessage = 'Hợp lệ';

    if (!rec.product_code) {
      status = 'error';
      statusMessage = `Dòng ${rowIndex}: Thiếu Mã sản phẩm (product_code / SKU)`;
    } else if (!rec.product_name) {
      status = 'error';
      statusMessage = `Dòng ${rowIndex}: Thiếu Tên sản phẩm (product_name)`;
    } else if (seenSkusInBatch.has(rec.product_code)) {
      status = 'warning';
      statusMessage = `Mã SP "${rec.product_code}" trùng lặp trong file (sẽ lấy bản ghi sau)`;
    } else if (typeof rec.price !== 'number' || isNaN(rec.price) || rec.price <= 0) {
      status = 'warning';
      statusMessage = 'Giá niêm yết (price) bằng 0đ hoặc không hợp lệ';
    } else if (rec.dp_price && rec.dp_price > rec.price) {
      status = 'warning';
      statusMessage = 'Giá DP (sàn) lớn hơn Giá niêm yết';
    }

    if (rec.product_code) {
      seenSkusInBatch.add(rec.product_code);
    }

    const isExisting = rec.product_code ? existingSkus.has(rec.product_code) : false;

    if (status === 'error') {
      errorCount++;
    } else if (status === 'warning') {
      warningCount++;
      if (isExisting) updateItemsCount++;
      else newItemsCount++;
    } else {
      validCount++;
      if (isExisting) updateItemsCount++;
      else newItemsCount++;
    }

    rows.push({
      rowIndex,
      record: rec,
      status,
      statusMessage,
      isExisting,
    });
  });

  return {
    rows,
    totalCount: records.length,
    validCount,
    warningCount,
    errorCount,
    newItemsCount,
    updateItemsCount,
  };
}

/**
 * Generates and downloads a clean JSON file containing normalized PriceImportRecord[]
 */
export function downloadPriceRecordsAsJson(records: PriceImportRecord[], filename?: string): void {
  const cleanRecords: PriceImportRecord[] = records.map((r) => ({
    product_code: r.product_code,
    product_name: r.product_name,
    unit: r.unit || 'Bộ',
    price: r.price || 0,
    dp_price: r.dp_price || 0,
    category: r.category || 'Chung',
    brand: r.brand || 'Khác',
    color: r.color || 'Tiêu chuẩn',
    size: r.size || 'Tiêu chuẩn',
    description: r.description || '',
  }));

  const jsonStr = JSON.stringify(cleanRecords, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const defaultName = `bang-gia-normalized-${new Date().toISOString().split('T')[0]}.json`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || defaultName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a standard sample JSON template file for price import
 */
export function downloadPriceTemplateJson(): void {
  const sampleRecords: PriceImportRecord[] = [
    {
      product_code: 'SP001',
      product_name: 'Đèn LED Âm Trần Philips 12W',
      unit: 'Bộ',
      price: 250000,
      dp_price: 190000,
      category: 'Đèn chiếu sáng',
      brand: 'Philips',
      color: 'Trắng 6500K',
      size: 'D125mm',
      description: 'Đèn âm trần cao cấp Philips tiết kiệm điện 80%',
    },
    {
      product_code: 'SP002',
      product_name: 'Aptomat Tép Schneider 2P 32A',
      unit: 'Cái',
      price: 180000,
      dp_price: 140000,
      category: 'Thiết bị điện',
      brand: 'Schneider',
      color: 'Ghi xám',
      size: 'MCB 2P 32A 6kA',
      description: 'Aptomat bảo vệ quá tải và ngắn mạch tiêu chuẩn Châu Âu',
    },
    {
      product_code: 'SP003',
      product_name: 'Dây Cáp Điện Cadivi 2x2.5mm2',
      unit: 'Mét',
      price: 28000,
      dp_price: 22000,
      category: 'Cáp điện',
      brand: 'Cadivi',
      color: 'Vàng - Đỏ',
      size: 'Cu/PVC 2x2.5',
      description: 'Dây cáp ruột đồng bọc nhựa PVC chất lượng cao',
    },
  ];

  downloadPriceRecordsAsJson(sampleRecords, 'mau-nhat-bang-gia.json');
}
