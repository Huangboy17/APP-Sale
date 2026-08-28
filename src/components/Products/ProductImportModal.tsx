import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PriceImportRecord, PriceImportValidationResult } from '../../types';
import { formatVND, downloadProductTemplateExcel } from '../../utils/formatters';
import {
  parseExcelToPriceRecords,
  parseJsonToPriceRecords,
  validatePriceImportRecords,
  downloadPriceRecordsAsJson,
  downloadPriceTemplateJson,
} from '../../utils/priceImportEngine';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileJson,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Building2,
  FileText,
} from 'lucide-react';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductImportModal: React.FC<ProductImportModalProps> = ({ isOpen, onClose }) => {
  const { products, importPriceRecords, companyScope, currentUser } = useApp();

  const [fileType, setFileType] = useState<'excel' | 'json'>('excel');
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  
  const [rawRecords, setRawRecords] = useState<PriceImportRecord[]>([]);
  const [validationResult, setValidationResult] = useState<PriceImportValidationResult | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [importMode, setImportMode] = useState<'upsert' | 'new_only'>('upsert');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const existingSkuSet = new Set(products.map((p) => (p.sku || '').toUpperCase()).filter(Boolean));

  const processFile = async (selectedFile: File, targetSheet?: string) => {
    setErrorMessage(null);
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      let records: PriceImportRecord[] = [];

      const isJsonFile = selectedFile.name.toLowerCase().endsWith('.json') || fileType === 'json';

      if (isJsonFile) {
        setFileType('json');
        setSheetNames([]);
        setSelectedSheet('');
        const text = await selectedFile.text();
        records = parseJsonToPriceRecords(text);
      } else {
        setFileType('excel');
        const res = await parseExcelToPriceRecords(selectedFile, targetSheet);
        setSheetNames(res.sheetNames);
        setSelectedSheet(res.activeSheet);
        records = res.records;
      }

      if (!records || records.length === 0) {
        setErrorMessage('File không chứa dòng dữ liệu nào hoặc định dạng không đúng!');
        setRawRecords([]);
        setValidationResult(null);
        setIsProcessing(false);
        return;
      }

      setRawRecords(records);
      const valRes = validatePriceImportRecords(records, existingSkuSet);
      setValidationResult(valRes);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Lỗi đọc file: ${err.message || 'Định dạng file không được hỗ trợ'}`);
      setRawRecords([]);
      setValidationResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSheetChange = (newSheet: string) => {
    if (file && fileType === 'excel') {
      setSelectedSheet(newSheet);
      processFile(file, newSheet);
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadJson = () => {
    if (!validationResult || validationResult.rows.length === 0) return;
    const cleanRecords = validationResult.rows
      .filter((r) => r.status !== 'error')
      .map((r) => r.record);

    downloadPriceRecordsAsJson(cleanRecords, `bang-gia-normalized-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleConfirmImport = () => {
    if (!validationResult) return;

    const validRows = validationResult.rows.filter((r) => r.status !== 'error');
    if (validRows.length === 0) {
      alert('Không có dữ liệu hợp lệ để import!');
      return;
    }

    const recordsToImport = validRows.map((r) => r.record);

    importPriceRecords(recordsToImport, importMode);

    alert(`Import thành công ${recordsToImport.length} sản phẩm vào Master Data Giá (Firestore & Local persistence)!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
              {fileType === 'json' ? <FileJson className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm">Import Dữ Liệu Giá (Excel / JSON Engine)</h3>
              <p className="text-[11px] text-slate-400">
                Quy trình chuẩn hóa: File $\rightarrow$ Parse Record $\rightarrow$ Validate $\rightarrow$ Database (Auto-stamp Organization)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={downloadProductTemplateExcel}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded text-xs font-semibold flex items-center space-x-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>File Excel Mẫu</span>
            </button>

            <button
              type="button"
              onClick={downloadPriceTemplateJson}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded text-xs font-semibold flex items-center space-x-1 transition"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>File JSON Mẫu</span>
            </button>

            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs">
          {/* Target Company Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <span className="font-bold text-blue-900">Doanh nghiệp tiếp nhận: </span>
                <span className="font-semibold text-blue-800">{companyScope.companyName}</span>
                <span className="text-slate-500 ml-1.5">
                  ({currentUser.name} - {currentUser.role === 'manager_c1' ? 'Cấp 1' : 'Cấp 2'})
                </span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
              Độc quyền Organization
            </span>
          </div>

          {/* File Type selector tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => {
                setFileType('excel');
                setFile(null);
                setValidationResult(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${
                fileType === 'excel'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>File Excel (.xlsx, .xls, .csv)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFileType('json');
                setFile(null);
                setValidationResult(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${
                fileType === 'json'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>File JSON chuẩn (.json)</span>
            </button>
          </div>

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
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                accept={fileType === 'json' ? '.json' : '.xlsx,.xls,.csv'}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="font-bold text-sm text-slate-800">
                Kéo thả file {fileType === 'json' ? 'JSON (.json)' : 'Excel'} vào đây hoặc{' '}
                <span className="text-blue-600 underline">bấm để chọn file</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {fileType === 'json'
                  ? 'Hỗ trợ file .json với cấu trúc PriceImportRecord[] chuẩn hóa.'
                  : 'Hỗ trợ .xlsx, .xls, .csv. Tự động nhận diện tiêu đề cột (product_code, product_name, price...).'}
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  {fileType === 'json' ? (
                    <FileJson className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : (
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-slate-900">{file.name}</div>
                    <div className="text-[10px] text-slate-500">
                      Kích thước: {(file.size / 1024).toFixed(1)} KB • {rawRecords.length} dòng dữ liệu trích xuất
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setRawRecords([]);
                      setValidationResult(null);
                      setErrorMessage(null);
                    }}
                    className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                  >
                    Chọn file khác
                  </button>
                </div>
              </div>

              {/* Sheet selector if Excel with multiple sheets */}
              {fileType === 'excel' && sheetNames.length > 1 && (
                <div className="flex items-center space-x-2 bg-amber-50/80 p-2 rounded border border-amber-200">
                  <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-bold text-amber-900 text-[11px]">Chọn Sheet trong file Excel:</span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="px-2 py-1 rounded bg-white border border-amber-300 text-xs font-semibold text-amber-900 focus:ring-amber-500"
                  >
                    {sheetNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 flex items-start space-x-2 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Không thể đọc dữ liệu</div>
                <div className="text-[11px] mt-0.5">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Parsed Summary & Options */}
          {validationResult && (
            <>
              {/* Stat counters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="bg-slate-100 p-2.5 rounded border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Tổng dòng</div>
                  <div className="text-sm font-extrabold text-slate-900 font-mono">
                    {validationResult.totalCount}
                  </div>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200 text-center">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Hợp lệ</div>
                  <div className="text-sm font-extrabold text-emerald-700 font-mono">
                    {validationResult.validCount}
                  </div>
                </div>
                <div className="bg-blue-50 p-2.5 rounded border border-blue-200 text-center">
                  <div className="text-[10px] font-bold text-blue-700 uppercase">Sản phẩm mới</div>
                  <div className="text-sm font-extrabold text-blue-700 font-mono">
                    {validationResult.newItemsCount}
                  </div>
                </div>
                <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-center">
                  <div className="text-[10px] font-bold text-amber-700 uppercase">Cập nhật giá</div>
                  <div className="text-sm font-extrabold text-amber-700 font-mono">
                    {validationResult.updateItemsCount}
                  </div>
                </div>
                <div className="bg-rose-50 p-2.5 rounded border border-rose-200 text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-bold text-rose-700 uppercase">Lỗi / Cảnh báo</div>
                  <div className="text-sm font-extrabold text-rose-700 font-mono">
                    {validationResult.errorCount + validationResult.warningCount}
                  </div>
                </div>
              </div>

              {/* Import Settings & Actions */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cấu Hình Xử Lý Trùng Mã (product_code / SKU)</span>
                  </div>
                  <div className="flex items-center space-x-4 text-[11px]">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'upsert'}
                        onChange={() => setImportMode('upsert')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-800">Thêm mới & Cập nhật (Upsert)</span>
                    </label>

                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'new_only'}
                        onChange={() => setImportMode('new_only')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-800">Chỉ nạp sản phẩm mới</span>
                    </label>
                  </div>
                </div>

                {/* JSON Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-xs flex items-center justify-center space-x-1.5 transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tải File JSON Chuẩn (.json)</span>
                </button>
              </div>

              {/* Preview Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">
                    Xem trước danh sách JSON Records ({validationResult.rows.length} dòng):
                  </span>
                  <span className="text-slate-500">(Hiển thị tối đa 15 dòng mẫu đầu tiên)</span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="px-2.5 py-1.5 w-8 text-center">STT</th>
                        <th className="px-2.5 py-1.5 w-32 font-mono">product_code</th>
                        <th className="px-2.5 py-1.5">product_name</th>
                        <th className="px-2.5 py-1.5">brand & category</th>
                        <th className="px-2.5 py-1.5 text-right font-mono">price (VNĐ)</th>
                        <th className="px-2.5 py-1.5 text-right bg-amber-50 text-amber-900 font-mono">
                          dp_price (Sàn)
                        </th>
                        <th className="px-2.5 py-1.5 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validationResult.rows.slice(0, 15).map((row, idx) => (
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
                            {row.rowIndex}
                          </td>
                          <td className="px-2.5 py-1.5 font-mono font-bold text-blue-700">
                            {row.record.product_code || <span className="text-rose-500 italic">Thiếu Mã</span>}
                          </td>
                          <td className="px-2.5 py-1.5">
                            <div className="font-bold text-slate-900">
                              {row.record.product_name || <span className="text-rose-500 italic">Thiếu tên</span>}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {row.record.color} • {row.record.size} • {row.record.unit}
                            </div>
                          </td>
                          <td className="px-2.5 py-1.5">
                            <div className="font-semibold text-slate-800">{row.record.brand}</div>
                            <div className="text-[10px] text-slate-500">{row.record.category}</div>
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-bold text-slate-800 font-mono">
                            {formatVND(row.record.price)}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-bold text-amber-900 bg-amber-50/40 font-mono">
                            {formatVND(row.record.dp_price || 0)}
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            {row.status === 'error' ? (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800"
                                title={row.statusMessage}
                              >
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
            {validationResult && (
              <span>
                Sẵn sàng import{' '}
                <strong>{validationResult.rows.filter((r) => r.status !== 'error').length}</strong> sản phẩm hợp lệ vào
                Database
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
              disabled={
                !validationResult ||
                validationResult.rows.filter((r) => r.status !== 'error').length === 0
              }
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
