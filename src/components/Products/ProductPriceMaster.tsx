import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductPriceItem } from '../../types';
import { formatVND, formatNumber, exportProductsToExcel, downloadProductTemplateExcel } from '../../utils/formatters';
import { ProductImportModal } from './ProductImportModal';
import {
  Tag,
  Plus,
  Search,
  Upload,
  Download,
  Edit2,
  Trash2,
  FileSpreadsheet,
  X,
} from 'lucide-react';

export const ProductPriceMaster: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductPriceItem | null>(null);

  // Form State for Single Product Add/Edit
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [unit, setUnit] = useState('Bộ');
  const [listPrice, setListPrice] = useState<number>(0);
  const [dpPrice, setDpPrice] = useState<number>(0);
  const [description, setDescription] = useState('');

  const isManagerOrAdmin = currentUser.role === 'super_admin' || currentUser.role === 'manager_c1';

  // Categories and Brands list
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  const brands = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);

  // Filter products
  const displayedProducts = products.filter((p) => {
    const matchSearch =
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchBrand = brandFilter === 'all' || p.brand === brandFilter;

    return matchSearch && matchCat && matchBrand;
  });

  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setSku(`PROD-${Date.now().toString().slice(-4)}`);
    setName('');
    setCategory('Đèn chiếu sáng');
    setBrand('Philips');
    setColor('Trắng');
    setSize('Tiêu chuẩn');
    setUnit('Bộ');
    setListPrice(500000);
    setDpPrice(380000);
    setDescription('');
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (prod: ProductPriceItem) => {
    setProductToEdit(prod);
    setSku(prod.sku);
    setName(prod.name);
    setCategory(prod.category);
    setBrand(prod.brand);
    setColor(prod.color);
    setSize(prod.size);
    setUnit(prod.unit);
    setListPrice(prod.listPrice);
    setDpPrice(prod.dpPrice);
    setDescription(prod.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      alert('Vui lòng nhập Mã Hàng (SKU) và Tên Sản Phẩm');
      return;
    }

    if (dpPrice > listPrice) {
      alert('Giá DP (Giá sàn) không được lớn hơn Giá Niêm Yết!');
      return;
    }

    const payload: ProductPriceItem = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      brand: brand.trim(),
      color: color.trim(),
      size: size.trim(),
      unit: unit.trim(),
      listPrice: Number(listPrice) || 0,
      dpPrice: Number(dpPrice) || 0,
      description: description.trim(),
      status: 'active',
    };

    if (productToEdit) {
      updateProduct(payload);
    } else {
      addProduct(payload);
    }

    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <span>Quản Lý Data Giá & Giá DP (Master Data)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Dữ liệu sản phẩm gốc: Mã hàng (SKU xuyên suốt), Tên hàng, Phân loại, Hãng, Màu sắc, Kích thước, Giá niêm yết, Giá DP (giá thấp nhất được phép bán).
          </p>
        </div>

        {/* Action buttons (Cấp 1 & Cấp 2 đều được quyền import & khai thác bảng giá) */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto">
          <button
            onClick={downloadProductTemplateExcel}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition"
            title="Tải file Excel mẫu có định dạng chuẩn"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Tải File Mẫu</span>
          </button>

          <button
            onClick={() => exportProductsToExcel(products)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel ({products.length})</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-xs font-bold flex items-center space-x-1 transition shadow-2xs"
            title="Cấp 1 & Cấp 2 đều được quyền import bảng giá"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Data Giá</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm Sản Phẩm</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo mã hàng (SKU), tên hàng, hãng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-hidden font-medium text-slate-700"
          >
            <option value="all">Tất cả phân loại ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-hidden font-medium text-slate-700"
          >
            <option value="all">Tất cả hãng ({brands.length})</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Master Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 py-2.5">Mã Hàng (SKU)</th>
                <th className="px-3 py-2.5">Tên Hàng Hóa</th>
                <th className="px-3 py-2.5">Phân Loại & Hãng</th>
                <th className="px-3 py-2.5">Màu Sắc & Quy Cách</th>
                <th className="px-3 py-2.5 text-center">ĐVT</th>
                <th className="px-3 py-2.5 text-right">Giá Niêm Yết</th>
                <th className="px-3 py-2.5 text-right bg-amber-50/70 text-amber-900 font-bold">
                  Giá DP (Sàn Bán)
                </th>
                <th className="px-3 py-2.5 text-right text-emerald-700 font-bold">Biên Độ Giảm</th>
                {isManagerOrAdmin && <th className="px-3 py-2.5 text-center">Thao Tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Không tìm thấy sản phẩm nào phù hợp
                  </td>
                </tr>
              ) : (
                displayedProducts.map((p) => {
                  const maxDiscountPercent =
                    p.listPrice > 0 ? (((p.listPrice - p.dpPrice) / p.listPrice) * 100).toFixed(1) : 0;

                  return (
                    <tr key={p.sku} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-mono font-bold text-blue-700">{p.sku}</td>
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.description && <div className="text-[10px] text-slate-400">{p.description}</div>}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-slate-800">{p.brand}</span>
                        <div className="text-[10px] text-slate-500">{p.category}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-slate-700 font-medium">{p.color}</div>
                        <div className="text-[10px] text-slate-500">{p.size}</div>
                      </td>
                      <td className="px-3 py-2 text-center font-medium">{p.unit}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono">
                        {formatVND(p.listPrice)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-amber-900 bg-amber-50/50 font-mono">
                        {formatVND(p.dpPrice)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700">
                        {maxDiscountPercent}%
                      </td>
                      {isManagerOrAdmin && (
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa sản phẩm ${p.sku}?`)) {
                                  deleteProduct(p.sku);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {productToEdit ? 'Chỉnh Sửa Data Giá Sản Phẩm' : 'Thêm Sản Phẩm Mới Vào Master Data'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã Hàng (SKU Xuyên Suốt) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!productToEdit}
                    placeholder="VD: LED-DL-01-W"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-blue-700 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn Vị Tính <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bộ / Cái / Cuộn / Mét / Chiếc..."
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Hàng Hóa / Sản Phẩm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Đèn Downlight Âm Trần COB Cao Cấp 12W"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phân Loại
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Đèn chiếu sáng, Thiết bị điện..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hãng Sản Xuất / Thương Hiệu
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Philips, Panasonic, Schneider..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Màu Sắc / Ánh Sáng
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Trắng Viền Bạc / 3000K Vàng"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kích Thước / Quy Cách
                  </label>
                  <input
                    type="text"
                    placeholder="VD: D110xH65mm - Lỗ khoét D90mm"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>

                {/* PRICING CRITICAL FIELDS */}
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Giá Niêm Yết (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={listPrice}
                    onChange={(e) => setListPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold text-xs"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">{formatVND(listPrice)}</div>
                </div>

                <div className="p-2.5 bg-amber-50 rounded border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Giá DP (Giá Sàn Tối Thiểu) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={dpPrice}
                    onChange={(e) => setDpPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded font-bold text-xs text-amber-900 bg-white"
                  />
                  <div className="text-[10px] text-amber-700 mt-0.5 font-semibold">
                    {formatVND(dpPrice)} (Sales bán dưới mức này sẽ bị cảnh báo)
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mô Tả Kỹ Thuật / Bảo Hành
                  </label>
                  <textarea
                    rows={2}
                    placeholder="VD: Chíp LED Bridgelux USA, CRI>90, bảo hành 36 tháng..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs transition"
                >
                  Lưu Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
