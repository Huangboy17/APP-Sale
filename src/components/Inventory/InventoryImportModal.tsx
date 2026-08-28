import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem } from '../../types';
import { parseExcelFile, downloadInventoryTemplateExcel, formatNumber } from '../../utils/formatters';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Warehouse,
  Boxes,
  Layers,
  ArrowRight,
  Building2,
} from 'lucide-react';

interface ParsedInventoryRow {
  sku: string;
  name: string;
  unit: string;
  importedQuantity: number;
  warehouseLocation: string;
  currentTotalQuantity: number;
  currentReservedQuantity: number;
  newTotalQuantity: number;
  newAvailableQuantity: number;
  status: 'valid' | 'warning' | 'error';
  statusMessage: string;
  isExisting: boolean;
}

interface InventoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryImportModal: React.FC<InventoryImportModalProps> = ({ isOpen, onClose }) => {
  const { inventory, products, importInventory, companyScope, currentUser } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedInventoryRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'add'>('replace');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentInventoryMap = new Map<string, InventoryItem>();
  inventory.forEach((i) => {
    if (i && i.sku) currentInventoryMap.set(i.sku.toUpperCase(), i);
  });

  const productPriceMap = new Map<string, string>();
  products.forEach((p) => {
    if (p && p.sku) productPriceMap.set(p.sku.toUpperCase(), p.name);
  });

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

      const rows: ParsedInventoryRow[] = [];
      const seenSkus = new Set<string>();

      rawRows.forEach((r: any, index: number) => {
        const rawSku = r['Mã hàng (SKU)'] || r['Mã hàng'] || r['SKU'] || r['Ma_Hang'] || r['Mã SP'] || r['Mã'];
        const rawName = r['Tên hàng hóa'] || r['Tên sản phẩm'] || r['Tên hàng'] || r['Ten_Hang'] || r['Name'] || '';
        const rawUnit = r['ĐVT'] || r['Đơn vị tính'] || r['Unit'] || 'Bộ';
        const rawQty = r['Tồn thực tế'] || r['Tồn kho'] || r['Số lượng'] || r['TotalQuantity'] || r['SL'] || 0;
        const rawLocation = r['Vị trí kho'] || r['Vị trí'] || r['Warehouse'] || r['Kệ kho'] || 'Kho Tổng';

        if (!rawSku && !rawName && rawQty === '') {
          return;
        }

        const sku = cleanExcelString(rawSku).toUpperCase();
        let name = cleanExcelString(rawName);
        const unit = cleanExcelString(rawUnit, 'Bộ');
        const importedQty = parseExcelNumber(rawQty, 0);
        const warehouseLocation = cleanExcelString(rawLocation, 'Kho Tổng');

        if (!name && productPriceMap.has(sku)) {
          name = productPriceMap.get(sku)!;
        }

        let status: 'valid' | 'warning' | 'error' = 'valid';
        let statusMessage = 'Hợp lệ';

        if (!sku) {
          status = 'error';
          statusMessage = `Dòng ${index + 2}: Thiếu Mã hàng (SKU)`;
        } else if (importedQty < 0) {
          status = 'error';
          statusMessage = `Dòng ${index + 2}: Số lượng tồn không thể âm`;
        } else if (seenSkus.has(sku)) {
          status = 'warning';
          statusMessage = 'Mã SKU xuất hiện nhiều lần trong file';
        }

        if (sku) seenSkus.add(sku);

        const existingItem = currentInventoryMap.get(sku);
        const currentTotal = existingItem ? existingItem.totalQuantity : 0;
        const currentReserved = existingItem ? existingItem.reservedQuantity : 0;

        let newTotal = importedQty;
        if (importMode === 'add') {
          newTotal = currentTotal + importedQty;
        }

        const newAvailable = Math.max(0, newTotal - currentReserved);

        if (newTotal < currentReserved) {
          status = 'warning';
          statusMessage = `Tồn thực tế mới (${newTotal}) nhỏ hơn số lượng đang giữ theo hợp đồng (${currentReserved})`;
        }

        rows.push({
          sku,
          name: name || `Sản phẩm ${sku}`,
          unit,
          importedQuantity: importedQty,
          warehouseLocation,
          currentTotalQuantity: currentTotal,
          currentReservedQuantity: currentReserved,
          newTotalQuantity: newTotal,
          newAvailableQuantity: newAvailable,
          status,
          statusMessage,
          isExisting: !!existingItem,
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

  const handleModeChange = (newMode: 'replace' | 'add') => {
    setImportMode(newMode);
    if (parsedRows.length > 0) {
      setParsedRows((prev) =>
        prev.map((row) => {
          let newTotal = row.importedQuantity;
          if (newMode === 'add') {
            newTotal = row.currentTotalQuantity + row.importedQuantity;
          }
          const newAvailable = Math.max(0, newTotal - row.currentReservedQuantity);
          let status = row.status;
          let statusMessage = row.statusMessage;

          if (newTotal < row.currentReservedQuantity) {
            status = 'warning';
            statusMessage = `Tồn thực tế mới (${newTotal}) nhỏ hơn số lượng đang giữ theo HĐ (${row.currentReservedQuantity})`;
          } else if (status === 'warning' && statusMessage.includes('Tồn thực tế mới')) {
            status = 'valid';
            statusMessage = 'Hợp lệ';
          }

          return {
            ...row,
            newTotalQuantity: newTotal,
            newAvailableQuantity: newAvailable,
            status,
            statusMessage,
          };
        })
      );
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

    const itemsToSave: InventoryItem[] = validRows.map((r) => ({
      sku: r.sku,
      name: r.name,
      unit: r.unit,
      totalQuantity: r.newTotalQuantity,
      reservedQuantity: r.currentReservedQuantity,
      availableQuantity: r.newAvailableQuantity,
      warehouseLocation: r.warehouseLocation || 'Kho Tổng',
      updatedAt: new Date().toISOString().split('T')[0],
    }));

    importInventory(itemsToSave);

    alert(`Đã cập nhật tồn kho thành công cho ${itemsToSave.length} sản phẩm!`);
    onClose();
  };

  const totalCount = parsedRows.length;
  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const warningCount = parsedRows.filter((r) => r.status === 'warning').length;
  const errorCount = parsedRows.filter((r) => r.status === 'error').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Import Dữ Liệu Tồn Kho (Inventory Master) Từ Excel</h3>
              <p className="text-[11px] text-slate-400">
                Cập nhật số lượng tồn thực tế hoặc nhập thêm hàng, tự động bảo toàn số lượng đang giữ của các Hợp đồng đã chốt
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={downloadInventoryTemplateExcel}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded text-xs font-semibold flex items-center space-x-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải File Mẫu Tồn Kho (.xlsx)</span>
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
                <span className="font-bold text-blue-900">Kho hàng doanh nghiệp: </span>
                <span className="font-semibold text-blue-800">{companyScope.companyName}</span>
                <span className="text-slate-500 ml-1.5">({currentUser.name} - {currentUser.role === 'manager_c1' ? 'Cấp 1' : 'Cấp 2'})</span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
              Độc quyền công ty
            </span>
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
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Warehouse className="w-6 h-6" />
              </div>
              <div className="font-bold text-sm text-slate-800">
                Kéo thả file Excel Tồn kho vào đây hoặc <span className="text-blue-600 underline">bấm để chọn file</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Hỗ trợ file .xlsx, .xls, .csv có các cột: Mã hàng (SKU), Tên hàng, ĐVT, Tồn thực tế, Vị trí kho
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
              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-100 p-2.5 rounded border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Tổng dòng đọc được</div>
                  <div className="text-sm font-extrabold text-slate-900 font-mono">{totalCount}</div>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200 text-center">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Hợp lệ</div>
                  <div className="text-sm font-extrabold text-emerald-700 font-mono">{validCount}</div>
                </div>
                <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-center">
                  <div className="text-[10px] font-bold text-amber-700 uppercase">Cảnh báo giữ hàng</div>
                  <div className="text-sm font-extrabold text-amber-700 font-mono">{warningCount}</div>
                </div>
                <div className="bg-rose-50 p-2.5 rounded border border-rose-200 text-center">
                  <div className="text-[10px] font-bold text-rose-700 uppercase">Dòng lỗi</div>
                  <div className="text-sm font-extrabold text-rose-700 font-mono">{errorCount}</div>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Phương Thức Cập Nhật Tồn Kho</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-start space-x-2 p-2.5 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="inventoryImportMode"
                      checked={importMode === 'replace'}
                      onChange={() => handleModeChange('replace')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Ghi đè số lượng tồn thực tế (Kiểm kê kho)</div>
                      <div className="text-slate-500 text-[10px]">
                        Tồn thực tế sẽ bằng đúng số lượng ghi trong file Excel. Tồn khả dụng = Tồn thực tế mới - Đang giữ.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2 p-2.5 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="inventoryImportMode"
                      checked={importMode === 'add'}
                      onChange={() => handleModeChange('add')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Cộng dồn thêm số lượng (Nhập hàng về kho)</div>
                      <div className="text-slate-500 text-[10px]">
                        Tồn thực tế mới = Tồn hiện tại + Số lượng trong file Excel.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">
                    Xem trước kết quả tính toán tồn kho ({parsedRows.length} dòng):
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
                        <th className="px-2.5 py-1.5 text-center">Tồn Cũ</th>
                        <th className="px-2.5 py-1.5 text-center text-blue-700">SL File</th>
                        <th className="px-2.5 py-1.5 text-center bg-slate-200 font-bold">Tồn Mới</th>
                        <th className="px-2.5 py-1.5 text-center bg-amber-50 text-amber-900">Đang Giữ</th>
                        <th className="px-2.5 py-1.5 text-center bg-emerald-50 text-emerald-900 font-bold">Khả Dụng Mới</th>
                        <th className="px-2.5 py-1.5">Vị Trí Kho</th>
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
                            <div className="font-bold text-slate-900">{row.name}</div>
                            <div className="text-[10px] text-slate-500">ĐVT: {row.unit}</div>
                          </td>
                          <td className="px-2.5 py-1.5 text-center text-slate-500 font-mono">
                            {row.currentTotalQuantity}
                          </td>
                          <td className="px-2.5 py-1.5 text-center font-bold text-blue-700 font-mono">
                            {importMode === 'add' ? `+${row.importedQuantity}` : row.importedQuantity}
                          </td>
                          <td className="px-2.5 py-1.5 text-center font-extrabold text-slate-900 bg-slate-100 font-mono">
                            {row.newTotalQuantity}
                          </td>
                          <td className="px-2.5 py-1.5 text-center font-bold text-amber-800 bg-amber-50/40 font-mono">
                            {row.currentReservedQuantity}
                          </td>
                          <td className="px-2.5 py-1.5 text-center font-bold text-emerald-800 bg-emerald-50/50 font-mono">
                            {row.newAvailableQuantity}
                          </td>
                          <td className="px-2.5 py-1.5 text-slate-600 text-[11px]">
                            {row.warehouseLocation}
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            {row.status === 'error' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800" title={row.statusMessage}>
                                ✕ Lỗi
                              </span>
                            ) : row.status === 'warning' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800" title={row.statusMessage}>
                                ⚠ Cảnh báo
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ Hợp lệ
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
                Sẵn sàng cập nhật <strong>{parsedRows.filter((r) => r.status !== 'error').length}</strong> sản phẩm vào tồn kho
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
              <span>Xác Nhận Import Tồn Kho</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
