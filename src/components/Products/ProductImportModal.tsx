import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductPriceItem } from '../../types';
import { formatVND, formatNumber, parseExcelFile, downloadProductTemplateExcel } from '../../utils/formatters';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ParsedProductRow {
  sku: string;
  name: string;
  category: string;
  brand: string;
  color: string;
  size: string;
  unit: string;
  listPrice: number;
  dpPrice: number;
  description: string;
  status: 'valid' | 'warning' | 'error';
  statusMessage: string;
  isExisting: boolean;
}

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductImportModal: React.FC<ProductImportModalProps> = ({ isOpen, onClose }) => {
  const { products, importProducts } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importMode, setImportMode] = useState<'upsert' | 'new_only' | 'replace_all'>('upsert');
  const [autoCreateInventory, setAutoCreateInventory] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const existingSkuSet = new Set(products.map((p) => p.sku.toUpperCase()));

  const handleFileChange = async (selectedFile: File) => {
    setErrorMessage(null);
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const rawRows = await parseExcelFile(selectedFile);
      if (!rawRows || rawRows.length === 0) {
        setErrorMessage('File Excel không có dữ liệu hoặc định dạng không đúng.');
        setIsProcessing(false);
        return;
      }

      const rows: ParsedProductRow[] = [];
      const seenSkusInFile = new Set<string>();

      rawRows.forEach((r: any, index: number) => {
        // Find SKU with various header aliases
        const rawSku = r['Mã hàng (SKU)'] || r['Mã hàng'] || r['SKU'] || r['Ma_Hang'] || r['Mã SP'] || r['Mã'];
        const rawName = r['Tên hàng hóa / Sản phẩm'] || r['Tên hàng'] || r['Tên sản phẩm'] || r['Ten_Hang'] || r['Name'] || r['Tên'];
        const rawCategory = r['Phân loại'] || r['Category'] || r['Nhóm hàng'] || 'Chung';
        const rawBrand = r['Hãng sản xuất'] || r['Hãng'] || r['Brand'] || r['Thương hiệu'] || 'Khác';
        const rawColor = r['Màu sắc'] || r['Color'] || r['Màu'] || 'Tiêu chuẩn';
        const rawSize = r['Kích thước / Quy cách'] || r['Size'] || r['Quy cách'] || 'Tiêu chuẩn';
        const rawUnit = r['Đơn vị tính'] || r['ĐVT'] || r['Unit'] || 'Bộ';
        const rawListPrice = r['Giá niêm yết (VNĐ)'] || r['Giá niêm yết'] || r['ListPrice'] || r['Giá bán'] || 0;
        const rawDpPrice = r['Giá DP (Giá sàn tối thiểu)'] || r['Giá DP'] || r['DpPrice'] || r['Giá sàn'] || 0;
        const rawDesc = r['Mô tả chi tiết'] || r['Mô tả'] || r['Description'] || '';

        // Skip completely empty lines
        if (!rawSku && !rawName && !rawListPrice) {
          return;
        }

        const sku = String(rawSku || '').trim().toUpperCase();
        const name = String(rawName || '').trim();
        const listPrice = Number(String(rawListPrice).replace(/[^0-9.-]+/g, '')) || 0;
        const dpPrice = Number(String(rawDpPrice).replace(/[^0-9.-]+/g, '')) || 0;

        let status: 'valid' | 'warning' | 'error' = 'valid';
        let statusMessage = 'Hợp lệ';

        if (!sku) {
          status = 'error';
          statusMessage = `Dòng ${index + 2}: Thiếu Mã hàng (SKU)`;
        } else if (!name) {
          status = 'error';
          statusMessage = `Dòng ${index + 2}: Thiếu Tên sản phẩm`;
        } else if (seenSkusInFile.has(sku)) {
          status = 'warning';
          statusMessage = `SKU trùng lặp trong file (sẽ lấy bản ghi sau)`;
        } else if (listPrice <= 0) {
          status = 'warning';
          statusMessage = 'Giá niêm yết bằng 0đ';
        } else if (dpPrice > listPrice) {
          status = 'warning';
          statusMessage = 'Giá DP (sàn) lớn hơn Giá niêm yết';
        }

        if (sku) seenSkusInFile.add(sku);

        const isExisting = existingSkuSet.has(sku);

        rows.push({
          sku,
          name,
          category: String(rawCategory).trim(),
          brand: String(rawBrand).trim(),
          color: String(rawColor).trim(),
          size: String(rawSize).trim(),
          unit: String(rawUnit).trim(),
          listPrice,
          dpPrice,
          description: String(rawDesc).trim(),
          status,
          statusMessage,
          isExisting,
        });
      });

      if (rows.length === 0) {
        setErrorMessage('Không trích xuất được dòng dữ liệu nào. Vui lòng tải file mẫu để kiểm tra tiêu đề cột!');
      }

      setParsedRows(rows);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Lỗi đọc file: ${err.message || 'Định dạng file không được hỗ trợ'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.status !== 'error');
    if (validRows.length === 0) {
      alert('Không có dữ liệu hợp lệ để import!');
      return;
    }

    let itemsToSave: ProductPriceItem[] = [];

    if (importMode === 'new_only') {
      itemsToSave = validRows
        .filter((r) => !r.isExisting)
        .map((r) => ({
          sku: r.sku,
          name: r.name,
          category: r.category || 'Chung',
          brand: r.brand || 'Khác',
          color: r.color || 'Tiêu chuẩn',
          size: r.size || 'Tiêu chuẩn',
          unit: r.unit || 'Bộ',
          listPrice: r.listPrice,
          dpPrice: r.dpPrice,
          description: r.description,
          status: 'active',
        }));
    } else {
      itemsToSave = validRows.map((r) => ({
        sku: r.sku,
        name: r.name,
        category: r.category || 'Chung',
        brand: r.brand || 'Khác',
        color: r.color || 'Tiêu chuẩn',
        size: r.size || 'Tiêu chuẩn',
        unit: r.unit || 'Bộ',
        listPrice: r.listPrice,
        dpPrice: r.dpPrice,
        description: r.description,
        status: 'active',
      }));
    }

    importProducts(itemsToSave);

    alert(`Import thành công ${itemsToSave.length} sản phẩm vào Master Data Giá!`);
    onClose();
  };

  const totalCount = parsedRows.length;
  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const warningCount = parsedRows.filter((r) => r.status === 'warning').length;
  const errorCount = parsedRows.filter((r) => r.status === 'error').length;
  const newItemsCount = parsedRows.filter((r) => r.status !== 'error' && !r.isExisting).length;
  const updateItemsCount = parsedRows.filter((r) => r.status !== 'error' && r.isExisting).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Import Dữ Liệu Master Data Giá & Giá DP Từ Excel</h3>
              <p className="text-[11px] text-slate-400">
                Nạp hàng loạt mã hàng SKU, phân loại, hãng, quy cách, giá niêm yết và giá sàn tối thiểu
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={downloadProductTemplateExcel}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded text-xs font-semibold flex items-center space-x-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải File Mẫu Excel (.xlsx)</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs">
          {/* Upload / Drag-drop Zone */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="font-bold text-sm text-slate-800">
                Kéo thả file Excel vào đây hoặc <span className="text-blue-600 underline">bấm để chọn file</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Hỗ trợ định dạng .xlsx, .xls, .csv. File mẫu có cấu trúc chuẩn để tự động nhận diện cột.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold text-slate-900">{file.name}</div>
                  <div className="text-[10px] text-slate-500">
                    Kích thước: {(file.size / 1024).toFixed(1)} KB • {totalCount} dòng dữ liệu được phân tích
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedRows([]);
                    setErrorMessage(null);
                  }}
                  className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                >
                  Chọn file khác
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 flex items-start space-x-2 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Không thể phân tích dữ liệu</div>
                <div className="text-[11px] mt-0.5">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Parsed Summary & Options */}
          {parsedRows.length > 0 && (
            <>
              {/* Stat counters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="bg-slate-100 p-2.5 rounded border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Tổng dòng</div>
                  <div className="text-sm font-extrabold text-slate-900 font-mono">{totalCount}</div>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200 text-center">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Hợp lệ</div>
                  <div className="text-sm font-extrabold text-emerald-700 font-mono">{validCount}</div>
                </div>
                <div className="bg-blue-50 p-2.5 rounded border border-blue-200 text-center">
                  <div className="text-[10px] font-bold text-blue-700 uppercase">Sản phẩm mới</div>
                  <div className="text-sm font-extrabold text-blue-700 font-mono">{newItemsCount}</div>
                </div>
                <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-center">
                  <div className="text-[10px] font-bold text-amber-700 uppercase">Cập nhật giá</div>
                  <div className="text-sm font-extrabold text-amber-700 font-mono">{updateItemsCount}</div>
                </div>
                <div className="bg-rose-50 p-2.5 rounded border border-rose-200 text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-bold text-rose-700 uppercase">Lỗi / Cảnh báo</div>
                  <div className="text-sm font-extrabold text-rose-700 font-mono">{errorCount + warningCount}</div>
                </div>
              </div>

              {/* Import Settings */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cấu Hình Xử Lý Trùng Mã Hàng (SKU)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-start space-x-2 p-2 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800">Thêm mới & Cập nhật giá (Upsert)</div>
                      <div className="text-slate-500 text-[10px]">
                        Cập nhật lại giá niêm yết/giá DP nếu SKU đã có, thêm mới nếu chưa có.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2 p-2 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'new_only'}
                      onChange={() => setImportMode('new_only')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800">Chỉ nạp sản phẩm mới</div>
                      <div className="text-slate-500 text-[10px]">
                        Bỏ qua các mã SKU đã tồn tại trong Master Data, không thay đổi giá cũ.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">
                    Xem trước danh sách ({parsedRows.length} dòng):
                  </span>
                  <span className="text-slate-500">
                    (Hiển thị tối đa 15 dòng mẫu đầu tiên)
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="px-2.5 py-1.5 w-8 text-center">STT</th>
                        <th className="px-2.5 py-1.5 w-32">Mã SKU</th>
                        <th className="px-2.5 py-1.5">Tên Hàng Hóa</th>
                        <th className="px-2.5 py-1.5">Hãng & Loại</th>
                        <th className="px-2.5 py-1.5 text-right">Giá Niêm Yết</th>
                        <th className="px-2.5 py-1.5 text-right bg-amber-50 text-amber-900">Giá DP (Sàn)</th>
                        <th className="px-2.5 py-1.5 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 15).map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 transition ${
                            row.status === 'error'
                              ? 'bg-rose-50/70'
                              : row.status === 'warning'
                              ? 'bg-amber-50/50'
                              : ''
                          }`}
                        >
                          <td className="px-2.5 py-1.5 text-center text-slate-500 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="px-2.5 py-1.5 font-mono font-bold text-blue-700">
                            {row.sku || <span className="text-rose-500 italic">Thiếu SKU</span>}
                          </td>
                          <td className="px-2.5 py-1.5">
                            <div className="font-bold text-slate-900">{row.name || <span className="text-rose-500 italic">Thiếu tên</span>}</div>
                            <div className="text-[10px] text-slate-500">
                              {row.color} • {row.size} • {row.unit}
                            </div>
                          </td>
                          <td className="px-2.5 py-1.5">
                            <div className="font-semibold text-slate-800">{row.brand}</div>
                            <div className="text-[10px] text-slate-500">{row.category}</div>
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-bold text-slate-800 font-mono">
                            {formatVND(row.listPrice)}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-bold text-amber-900 bg-amber-50/40 font-mono">
                            {formatVND(row.dpPrice)}
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            {row.status === 'error' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800" title={row.statusMessage}>
                                ✕ Lỗi
                              </span>
                            ) : row.isExisting ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                ↺ Cập nhật
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                + Mới
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {parsedRows.length > 0 && (
              <span>
                Sẵn sàng import <strong>{parsedRows.filter((r) => r.status !== 'error').length}</strong> sản phẩm hợp lệ
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={parsedRows.length === 0 || parsedRows.filter((r) => r.status !== 'error').length === 0}
              onClick={handleConfirmImport}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded text-xs font-bold shadow-2xs transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Xác Nhận Import Vào Hệ Thống</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
