import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  matchImageFilesToProducts,
  uploadBatchProductImages,
} from '../../services/productImageService';
import {
  ImageImportMatchResult,
  ImageImportProgress,
  MatchedImageItem,
  UnmatchedImageItem,
} from '../../types';
import {
  Upload,
  FolderUp,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Sparkles,
  Search,
  RefreshCw,
} from 'lucide-react';

interface ProductImageImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductImageImportModal: React.FC<ProductImageImportModalProps> = ({ isOpen, onClose }) => {
  const { products, batchUpdateProductImages, currentUser, resolveOrganizationId, users } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Match and preview results
  const [matchResult, setMatchResult] = useState<ImageImportMatchResult | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Upload Progress
  const [progress, setProgress] = useState<ImageImportProgress | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ success: number; failed: number } | null>(null);

  // File Inputs
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const filesInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentOrgId =
    currentUser.role === 'super_admin'
      ? 'system_admin'
      : currentUser.organizationId || resolveOrganizationId(currentUser, users);

  const handleFilesSelected = (selectedFiles: FileList | File[]) => {
    const fileList = Array.from(selectedFiles);
    console.log('[IMAGE_IMPORT] User selected files count:', fileList.length);
    if (!fileList || fileList.length === 0) {
      alert('Không có file nào được chọn!');
      return;
    }

    setIsScanning(true);
    setProgress(null);
    setIsCompleted(false);
    setUploadStats(null);

    try {
      const result = matchImageFilesToProducts(fileList, products);
      console.log('[IMAGE_IMPORT] Scan match result:', result);
      setMatchResult(result);
    } catch (err: any) {
      console.error('[IMAGE_IMPORT] Scan error:', err);
      alert(`Đã xảy ra lỗi khi quét file: ${err?.message || 'Lỗi không xác định'}`);
    } finally {
      setIsScanning(false);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleStartImport = async () => {
    if (!matchResult || matchResult.matched.length === 0) {
      alert('Không có ảnh hợp lệ nào để import! Vui lòng kiểm tra lại tên file ảnh trùng với Mã SKU.');
      return;
    }

    const itemsToUpload = matchResult.matched;
    console.log('[IMAGE_IMPORT] Confirm clicked. Items to upload:', itemsToUpload.length);

    setIsImporting(true);
    setProgress({
      total: itemsToUpload.length,
      completed: 0,
      success: 0,
      failed: 0,
      currentSku: itemsToUpload[0]?.sku || '',
      isProcessing: true,
      errors: [],
    });

    try {
      const res = await uploadBatchProductImages(
        itemsToUpload,
        currentOrgId,
        (prog) => {
          setProgress(prog);
        },
        4 // 4 workers concurrency
      );

      console.log('[IMAGE_IMPORT] Upload batch finished:', res);

      if (res.successfulUpdates.length > 0) {
        await batchUpdateProductImages(res.successfulUpdates);
      }

      setUploadStats({
        success: res.successfulUpdates.length,
        failed: res.failedItems.length,
      });
      setIsCompleted(true);
    } catch (err: any) {
      console.error('[IMAGE_IMPORT] Upload error:', err);
      alert(`Đã xảy ra lỗi trong quá trình upload: ${err.message || 'Lỗi không xác định'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setMatchResult(null);
    setProgress(null);
    setIsCompleted(false);
    setUploadStats(null);
    setSearchTerm('');
    setIsImporting(false);
  };

  // Filter matched and unmatched items for preview list
  const filteredMatched = (matchResult?.matched || []).filter((item) => {
    if (previewFilter === 'invalid') return false;
    const sTerm = searchTerm.toLowerCase();
    return (
      item.sku.toLowerCase().includes(sTerm) ||
      item.productName.toLowerCase().includes(sTerm) ||
      item.fileName.toLowerCase().includes(sTerm)
    );
  });

  const filteredUnmatched = (matchResult?.unmatched || []).filter((item) => {
    if (previewFilter === 'valid') return false;
    const sTerm = searchTerm.toLowerCase();
    return (
      item.derivedSku.toLowerCase().includes(sTerm) ||
      item.fileName.toLowerCase().includes(sTerm) ||
      item.reasonMessage.toLowerCase().includes(sTerm)
    );
  });

  // Example SKUs for guide
  const sampleSkus = products.slice(0, 8).map((p) => p.sku).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <span>Import Ảnh Sản Phẩm Hàng Loạt</span>
                <span className="text-xs font-normal text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  Khóa liên kết: Mã SKU
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tự động đối chiếu tên file ảnh với Mã SKU trong Master Data và lưu trữ an toàn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* STEP 1: SELECT FILES OR FOLDER (When no match result yet) */}
          {!matchResult && !isScanning && !isImporting && !isCompleted && (
            <div className="space-y-4">
              {/* Instructions Banner */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-2 text-blue-950">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Quy ước đặt tên file ảnh:</span>
                </div>
                <div className="text-slate-700 leading-relaxed space-y-1">
                  <p>
                    • Đặt tên file ảnh trùng với <strong>Mã Hàng (SKU)</strong>. Ví dụ: <code className="font-mono font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200">AX-001.jpg</code> hoặc <code className="font-mono font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200">LED-DOWNLIGHT-01.png</code>.
                  </p>
                  <p>
                    • Hỗ trợ đầy đủ: <strong>.jpg, .jpeg, .png, .webp, .svg, .gif</strong>. Ảnh tự động nén tối ưu (WebP 1200px) trước khi lưu.
                  </p>
                  {sampleSkus.length > 0 && (
                    <div className="pt-1 text-[11px] text-slate-600 flex flex-wrap items-center gap-1">
                      <span>Mã SKU mẫu hiện có trong Data Giá của bạn:</span>
                      {sampleSkus.map((sku) => (
                        <span key={sku} className="font-mono font-bold bg-white text-blue-800 px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                          {sku}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-8 border-2 border-dashed rounded-2xl text-center transition flex flex-col items-center justify-center min-h-[240px] ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/70'
                    : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
                  <FolderUp className="w-7 h-7" />
                </div>

                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Kéo thả thư mục hoặc các file ảnh vào đây
                </h3>
                <p className="text-xs text-slate-500 max-w-md mb-4">
                  Hệ thống tự động quét và đối chiếu các file ảnh với danh mục <strong className="text-slate-800">{products.length} sản phẩm</strong> trong Data Giá của bạn.
                </p>

                {/* Hidden File Inputs */}
                <input
                  ref={folderInputRef}
                  type="file"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesSelected(e.target.files);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <input
                  ref={filesInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesSelected(e.target.files);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FolderUp className="w-4 h-4" />
                    <span>📁 Chọn Thư Mục Ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => filesInputRef.current?.click()}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>🖼️ Chọn Nhiều File Ảnh</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCANNING STATE */}
          {isScanning && (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-700">Đang quét và đối chiếu mã sản phẩm...</p>
            </div>
          )}

          {/* STEP 2: VALIDATION STATS & PREVIEW (Before starting upload) */}
          {matchResult && !isImporting && !isCompleted && (
            <div className="space-y-4">
              {/* Stats Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[11px] block">Tổng file quét</span>
                  <strong className="text-base font-extrabold text-slate-900">{matchResult.totalFiles}</strong>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                  <span className="text-emerald-700 text-[11px] block font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Hợp lệ (Khớp mã)</span>
                  </span>
                  <strong className="text-base font-extrabold text-emerald-800">{matchResult.matchedCount}</strong>
                  <span className="text-[10px] text-emerald-600 block">
                    ({matchResult.newImageCount} mới, {matchResult.overwriteCount} ghi đè)
                  </span>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
                  <span className="text-amber-700 text-[11px] block font-semibold flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Không tìm thấy mã</span>
                  </span>
                  <strong className="text-base font-extrabold text-amber-800">
                    {matchResult.unmatched.filter((u) => u.reason === 'NOT_FOUND').length}
                  </strong>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-950">
                  <span className="text-rose-700 text-[11px] block font-semibold flex items-center space-x-1">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    <span>Lỗi định dạng / Trùng</span>
                  </span>
                  <strong className="text-base font-extrabold text-rose-800">
                    {matchResult.unmatched.filter((u) => u.reason !== 'NOT_FOUND').length}
                  </strong>
                </div>
              </div>

              {/* Warning when 0 files matched */}
              {matchResult.matchedCount === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-2 text-amber-950">
                  <div className="flex items-center space-x-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Chưa tìm thấy ảnh nào khớp với Mã Hàng (SKU) trong Data Giá</span>
                  </div>
                  <p className="text-slate-700">
                    Hệ thống tìm kiếm ảnh theo <strong>Mã Hàng (SKU)</strong>. Vui lòng đổi tên file ảnh trùng với Mã SKU (ví dụ: <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-amber-200">{sampleSkus[0] || 'AX-001'}.jpg</code>) rồi chọn lại.
                  </p>
                </div>
              )}

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('all')}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      previewFilter === 'all' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({matchResult.totalFiles})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('valid')}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      previewFilter === 'valid' ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hợp lệ ({matchResult.matchedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('invalid')}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      previewFilter === 'invalid' ? 'bg-white shadow-xs text-rose-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Không khớp / Lỗi ({matchResult.unmatchedCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã SKU, tên hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              {/* Matched & Unmatched Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[320px] overflow-y-auto text-xs bg-white">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold sticky top-0 text-[11px]">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">Ảnh</th>
                      <th className="px-3 py-2">Mã SKU</th>
                      <th className="px-3 py-2">Tên Sản Phẩm / Tên File</th>
                      <th className="px-3 py-2 text-center">Dung lượng</th>
                      <th className="px-3 py-2 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Render Matched Items */}
                    {filteredMatched.map((item, idx) => (
                      <tr key={`matched-${idx}`} className="hover:bg-slate-50/80">
                        <td className="px-3 py-1.5 text-center">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt={item.sku}
                              className="w-8 h-8 rounded object-cover border border-slate-200 mx-auto"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-3 py-1.5 font-mono font-bold text-blue-700">{item.sku}</td>
                        <td className="px-3 py-1.5">
                          <div className="font-semibold text-slate-900 truncate max-w-xs">{item.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.fileName}</div>
                        </td>
                        <td className="px-3 py-1.5 text-center font-mono text-[11px] text-slate-500">
                          {(item.fileSize / 1024).toFixed(0)} KB
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          {item.willOverwrite ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              🔄 Ghi đè ảnh cũ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Thêm mới
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Render Unmatched Items */}
                    {filteredUnmatched.map((item, idx) => (
                      <tr key={`unmatched-${idx}`} className="hover:bg-rose-50/40 bg-rose-50/10">
                        <td className="px-3 py-1.5 text-center">
                          <XCircle className="w-5 h-5 text-rose-500 mx-auto" />
                        </td>
                        <td className="px-3 py-1.5 font-mono font-bold text-rose-700">
                          {item.derivedSku || '—'}
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="font-mono text-slate-800 text-[11px]">{item.fileName}</div>
                          <div className="text-[10px] text-rose-600 font-semibold">{item.reasonMessage}</div>
                        </td>
                        <td className="px-3 py-1.5 text-center font-mono text-[11px] text-slate-400">
                          {(item.file.size / 1024).toFixed(0)} KB
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Bỏ qua
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredMatched.length === 0 && filteredUnmatched.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          Không có file nào khớp với bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: UPLOAD IN PROGRESS */}
          {isImporting && (
            <div className="py-8 px-4 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
                <Upload className="w-6 h-6 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Đang Tối Ưu & Lưu Trữ Ảnh Sản Phẩm...
                </h3>
                <p className="text-xs text-slate-500">
                  Đang xử lý: <strong className="text-blue-700 font-mono">{progress?.currentSku || 'Đang chuẩn bị...'}</strong>
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${progress ? Math.round((progress.completed / (progress.total || 1)) * 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span>
                    {progress ? Math.round((progress.completed / (progress.total || 1)) * 100) : 0}% Hoàn thành
                  </span>
                  <span>
                    {progress?.completed || 0} / {progress?.total || matchResult?.matchedCount || 0} ảnh (Thành công: {progress?.success || 0})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETION REPORT */}
          {isCompleted && uploadStats && (
            <div className="py-8 px-4 text-center max-w-xl mx-auto space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Import Ảnh Sản Phẩm Hoàn Tất!
                </h3>
                <p className="text-xs text-slate-500">
                  Toàn bộ ảnh đã được tối ưu và cập nhật thành công vào Master Data Giá.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                <div>
                  <span className="text-slate-500 block text-[11px]">Thành công</span>
                  <strong className="text-base text-emerald-700 font-mono font-bold">{uploadStats.success}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Thất bại / Lỗi</span>
                  <strong className="text-base text-rose-700 font-mono font-bold">{uploadStats.failed}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Bỏ qua (Không khớp)</span>
                  <strong className="text-base text-amber-700 font-mono font-bold">{matchResult?.unmatchedCount || 0}</strong>
                </div>
              </div>

              {progress?.errors && progress.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-left text-xs space-y-1 max-h-32 overflow-y-auto">
                  <div className="font-bold text-rose-900">Danh sách file lỗi:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-800 text-[11px]">
                    {progress.errors.map((err, i) => (
                      <li key={i}>
                        SKU <strong>{err.sku}</strong> ({err.fileName}): {err.errorMessage}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={matchResult ? handleReset : onClose}
                disabled={isImporting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                {matchResult ? '← Chọn lại file' : 'Đóng'}
              </button>

              {matchResult && !isImporting && (
                <button
                  type="button"
                  onClick={handleStartImport}
                  disabled={matchResult.matchedCount === 0 || isImporting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  <span>Bắt Đầu Import ({matchResult.matchedCount} Ảnh)</span>
                </button>
              )}

              {isImporting && (
                <button
                  type="button"
                  disabled
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-400 rounded-lg shadow-xs transition flex items-center space-x-2 cursor-not-allowed opacity-80"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý import...</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto ml-auto px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              Hoàn Tất & Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
