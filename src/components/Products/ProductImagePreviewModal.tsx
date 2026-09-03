import React from 'react';
import { ProductPriceItem } from '../../types';
import { formatVND } from '../../utils/formatters';
import { X, Trash2, Upload, ExternalLink, Image as ImageIcon, Tag, Building2 } from 'lucide-react';

interface ProductImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductPriceItem | null;
  onReplaceImage?: (product: ProductPriceItem, file: File) => void;
  onDeleteImage?: (product: ProductPriceItem) => void;
  canManage?: boolean;
}

export const ProductImagePreviewModal: React.FC<ProductImagePreviewModalProps> = ({
  isOpen,
  onClose,
  product,
  onReplaceImage,
  onDeleteImage,
  canManage = true,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!isOpen || !product) return null;

  const imageUrl = product.imageUrl || product.image_url;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onReplaceImage) {
      onReplaceImage(product, e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>{product.name}</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Mã SKU: <strong className="text-blue-400">{product.sku}</strong> • {product.brand || 'Khác'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display Body */}
        <div className="p-6 bg-slate-950/5 flex items-center justify-center min-h-[320px] max-h-[500px] overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="max-h-[460px] max-w-full object-contain rounded-lg shadow-md border border-slate-200/80 bg-white"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
              <ImageIcon className="w-16 h-16 stroke-1 text-slate-300" />
              <p className="text-xs font-semibold">Chưa có ảnh sản phẩm</p>
            </div>
          )}
        </div>

        {/* Product Details Bar */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-slate-500 text-[11px] block">Giá Niêm Yết</span>
              <strong className="font-mono text-slate-900">{formatVND(product.listPrice)}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Giá Sàn (DP)</span>
              <strong className="font-mono text-amber-700">{formatVND(product.dpPrice)}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Đơn Vị</span>
              <span className="font-semibold text-slate-700">{product.unit || 'Bộ'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          {canManage && (
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{imageUrl ? 'Thay Ảnh Mới' : 'Tải Ảnh Lên'}</span>
              </button>

              {imageUrl && onDeleteImage && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa ảnh sản phẩm "${product.sku}" không?`)) {
                      onDeleteImage(product);
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Ảnh</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
