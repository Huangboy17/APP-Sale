import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductPriceItem, InventoryItem } from '../../types';
import { formatVND, exportProductsToExcel, downloadProductTemplateExcel } from '../../utils/formatters';
import { ProductImportModal } from './ProductImportModal';
import { ProductInventoryDrawer } from '../Inventory/ProductInventoryDrawer';
import { ErrorBoundary } from '../Common/ErrorBoundary';
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
  Boxes,
  Layers,
  ShoppingCart,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  ShieldCheck,
  Lock,
} from 'lucide-react';

const ProductPriceMasterContent: React.FC = () => {
  const {
    products,
    inventory,
    addProduct,
    updateProduct,
    deleteProduct,
    clearSpecificData,
    currentUser,
    companyScope,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'available' | 'low' | 'out_of_stock'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductPriceItem | null>(null);
  const [selectedItemForHoldModal, setSelectedItemForHoldModal] = useState<InventoryItem | null>(null);

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

  // Both C1 (Company Manager) and C2 (Sales in company) have full rights over their company price list
  const canManageProducts = currentUser.role === 'manager_c1' || currentUser.role === 'sales_c2';

  // Fast inventory lookup map by normalized SKU
  const inventoryMap = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    inventory.forEach((inv) => {
      if (inv.sku) {
        map.set(inv.sku.trim().toLowerCase(), inv);
      }
    });
    return map;
  }, [inventory]);

  // Categories and Brands list
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).filter(Boolean), [products]);
  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))).filter(Boolean), [products]);

  // Filter products
  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      const cleanSku = (p.sku || '').trim().toLowerCase();
      const inv = inventoryMap.get(cleanSku);
      const avail = inv ? inv.availableQuantity : 0;
      const total = inv ? inv.totalQuantity : 0;

      const sTerm = (searchTerm || '').toLowerCase();
      const pSku = (p.sku || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      const pBrand = (p.brand || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pColor = (p.color || '').toLowerCase();
      const pSize = (p.size || '').toLowerCase();

      const matchSearch =
        pSku.includes(sTerm) ||
        pName.includes(sTerm) ||
        pBrand.includes(sTerm) ||
        pCat.includes(sTerm) ||
        pColor.includes(sTerm) ||
        pSize.includes(sTerm);

      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      const matchBrand = brandFilter === 'all' || p.brand === brandFilter;

      let matchStock = true;
      if (stockStatusFilter === 'available') {
        matchStock = avail > 5;
      } else if (stockStatusFilter === 'low') {
        matchStock = avail > 0 && avail <= 5;
      } else if (stockStatusFilter === 'out_of_stock') {
        matchStock = total === 0 || avail <= 0;
      }

      return matchSearch && matchCat && matchBrand && matchStock;
    });
  }, [products, searchTerm, categoryFilter, brandFilter, stockStatusFilter, inventoryMap]);

  console.log('[PRICE_IMPORT] TABLE_RENDER displayed:', displayedProducts.length, 'total:', products.length);

  const totalPages = Math.ceil(displayedProducts.length / pageSize) || 1;
  const paginatedProducts = displayedProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  const handleOpenHoldDetails = (prod: ProductPriceItem) => {
    const cleanSku = (prod.sku || '').trim().toLowerCase();
    const inv = inventoryMap.get(cleanSku) || {
      sku: prod.sku,
      name: prod.name,
      unit: prod.unit,
      totalQuantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
      warehouseLocation: 'Kho Tổng',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setSelectedItemForHoldModal(inv);
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
      {/* Company Tenant Scope Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-600 text-white rounded-md shrink-0 shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center space-x-2">
              <span>{companyScope.companyName}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                {currentUser.role === 'manager_c1'
                  ? 'Quản lý Cấp 1 (Công ty)'
                  : currentUser.role === 'sales_c2'
                  ? 'Kinh doanh Cấp 2 (Thuộc công ty)'
                  : 'Super Admin Quản trị'}
              </span>
            </div>
            <p className="text-slate-600 text-[11px] mt-0.5">
              {currentUser.role === 'super_admin'
                ? 'Super Admin chỉ quản trị tài khoản hệ thống. Mỗi công ty Cấp 1 sở hữu và quản lý dữ liệu giá độc lập.'
                : 'Bảng giá và tồn kho được cách ly hoàn toàn theo từng công ty. Cấp 1 và Cấp 2 thuộc cùng công ty dùng chung data giá này.'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white/80 border border-blue-200 rounded-md font-medium text-slate-700 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã kết nối Cloud Firestore</span>
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <span>Quản Lý Data Giá, Giá DP & Tồn Kho (Master Data)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Tổng hợp dữ liệu sản phẩm: Mã hàng (SKU), Giá niêm yết, Giá DP sàn bán, <strong>Tồn thực tế</strong>, <strong>Đang giữ hàng</strong> và <strong>Tồn khả dụng bán</strong>.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto flex-wrap gap-y-1.5">
          <button
            onClick={downloadProductTemplateExcel}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
            title="Tải file Excel mẫu có định dạng chuẩn"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Tải File Mẫu</span>
          </button>

          <button
            onClick={() => exportProductsToExcel(products, inventory)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
            title="Xuất file Excel đầy đủ Data Giá kèm Số Lượng Tồn Kho & Giữ Hàng"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel ({products.length})</span>
          </button>

          {canManageProducts && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-xs font-bold flex items-center space-x-1 transition shadow-2xs cursor-pointer"
                title="Import bảng giá sản phẩm mới hoặc cập nhật giá niêm yết/giá DP cho công ty"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Data Giá</span>
              </button>

              <button
                onClick={() => {
                  if (products.length === 0) {
                    alert('Không có dữ liệu giá nào để xoá.');
                    return;
                  }
                  if (window.confirm(`Bạn có chắc chắn muốn xoá toàn bộ ${products.length} sản phẩm trong Data Giá của ${companyScope.companyName} không? Hành động này sẽ xoá trên cả máy và Cloud Firestore.`)) {
                    clearSpecificData({ clearProducts: true });
                  }
                }}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
                title="Xoá toàn bộ danh sách sản phẩm trong Data Giá của công ty"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Xoá Hết Data Giá</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center space-x-1 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Sản Phẩm</span>
              </button>
            </>
          )}
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Stock Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => {
              setStockStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-hidden font-medium text-slate-700"
          >
            <option value="all">📦 Tất cả trạng thái kho</option>
            <option value="available">🟢 Còn tồn khả dụng ({'>'}5)</option>
            <option value="low">🟡 Tồn ít (1 - 5)</option>
            <option value="out_of_stock">🔴 Hết tồn / Cần đặt hàng</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
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
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setCurrentPage(1);
            }}
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

      {/* Quick Brand Badges */}
      {brands.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() => { setBrandFilter('all'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              brandFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Tất cả ({products.length})
          </button>
          {brands.map((b) => {
            const count = products.filter((p) => p.brand === b).length;
            const isSelected = brandFilter === b;
            return (
              <button
                key={b}
                onClick={() => { setBrandFilter(b); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {b} <span className="opacity-75 font-normal">({count})</span>
              </button>
            );
          })}
        </div>
      )}

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
                <th className="px-3 py-2.5 text-center bg-slate-100/70 text-slate-800 border-l border-slate-200">
                  <div className="flex items-center justify-center space-x-1" title="Tổng số lượng tồn thực tế có trong kho">
                    <Boxes className="w-3 h-3 text-slate-600" />
                    <span>Tồn Thực Tế</span>
                  </div>
                </th>
                <th
                  className="px-3 py-2.5 text-center bg-amber-50/90 text-amber-900 cursor-help border-x border-amber-200"
                  title="Bấm vào số lượng để xem chi tiết Sale nào đang giữ và giữ cho khách hàng nào"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Đang Giữ (Chốt HĐ)</span>
                    <Layers className="w-3 h-3 text-amber-600" />
                  </div>
                </th>
                <th
                  className="px-3 py-2.5 text-center bg-emerald-50/90 text-emerald-900 font-bold border-r border-emerald-200"
                  title="Số lượng tồn kho còn lại thực tế để Sale có thể chào bán ngay"
                >
                  <span>Tồn Khả Dụng</span>
                </th>
                <th
                  className="px-3 py-2.5 text-center bg-indigo-50/70 text-indigo-900 font-bold border-r border-indigo-200"
                  title="Số lượng hàng đang được đặt từ Nhà cung cấp"
                >
                  <span>Đang Đặt NCC</span>
                </th>
                <th className="px-3 py-2.5 text-right">Giá Niêm Yết</th>
                <th className="px-3 py-2.5 text-right bg-amber-50/70 text-amber-900 font-bold">
                  Giá DP (Sàn Bán)
                </th>
                <th className="px-3 py-2.5 text-right text-emerald-700 font-bold">Biên Độ Giảm</th>
                {canManageProducts && <th className="px-3 py-2.5 text-center">Thao Tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={canManageProducts ? 13 : 12} className="px-4 py-8 text-center text-slate-400">
                    {currentUser.role === 'super_admin'
                      ? 'Tài khoản Super Admin không hiển thị data giá bán lẻ của các công ty. Vui lòng đăng nhập tài khoản Cấp 1 tương ứng để xem và quản lý.'
                      : 'Chưa có sản phẩm nào trong Data Giá của công ty. Vui lòng bấm "Import Data Giá" hoặc "+ Thêm Sản Phẩm" để bắt đầu.'}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const lPrice = typeof p.listPrice === 'number' && !isNaN(p.listPrice) ? p.listPrice : 0;
                  const dPrice = typeof p.dpPrice === 'number' && !isNaN(p.dpPrice) ? p.dpPrice : 0;
                  const maxDiscountPercent = lPrice > 0 ? (((lPrice - dPrice) / lPrice) * 100).toFixed(1) : '0';

                  const cleanSku = (p.sku || '').trim().toLowerCase();
                  const inv = inventoryMap.get(cleanSku);
                  const totalQty = inv ? inv.totalQuantity : 0;
                  const reservedQty = inv ? inv.reservedQuantity : 0;
                  const availableQty = inv ? inv.availableQuantity : 0;
                  const onOrderQty = inv ? inv.onOrderQuantity || 0 : 0;

                  return (
                    <tr key={p.sku || `row-${idx}`} className="hover:bg-slate-50 transition-colors">
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

                      {/* Tồn Thực Tế */}
                      <td className="px-3 py-2 text-center font-bold text-slate-900 font-mono bg-slate-50/50 border-l border-slate-100">
                        {totalQty}
                      </td>

                      {/* Đang Giữ Hàng */}
                      <td className="px-3 py-2 text-center bg-amber-50/40 border-x border-amber-100">
                        <button
                          type="button"
                          onClick={() => handleOpenHoldDetails(p)}
                          title={`Bấm để xem danh sách Sale đang giữ ${reservedQty} ${p.unit} cho khách hàng nào`}
                          className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs transition inline-flex items-center space-x-1 cursor-pointer group ${
                            reservedQty > 0
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {reservedQty > 0 && (
                            <Layers className="w-3 h-3 text-amber-600 group-hover:scale-110 transition-transform shrink-0" />
                          )}
                          <span>{reservedQty}</span>
                          {reservedQty > 0 && (
                            <Eye className="w-2.5 h-2.5 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                          )}
                        </button>
                      </td>

                      {/* Tồn Khả Dụng */}
                      <td className="px-3 py-2 text-center border-r border-emerald-100">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold inline-flex items-center space-x-1 ${
                            availableQty > 5
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : availableQty > 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {availableQty > 5 ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : availableQty > 0 ? (
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                          )}
                          <span>{availableQty}</span>
                        </span>
                      </td>

                      {/* Đang Đặt NCC */}
                      <td className="px-3 py-2 text-center border-r border-indigo-100 bg-indigo-50/20">
                        <span
                          className={`font-mono text-xs font-bold ${
                            onOrderQty > 0 ? 'text-indigo-800' : 'text-slate-300'
                          }`}
                        >
                          {onOrderQty}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono">
                        {formatVND(p.listPrice)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-amber-900 bg-amber-50/50 font-mono">
                        {formatVND(p.dpPrice)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700">
                        {maxDiscountPercent}%
                      </td>
                      {canManageProducts && (
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition cursor-pointer"
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
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition cursor-pointer"
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

        {/* Pagination Footer */}
        {displayedProducts.length > 0 && (
          <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span>
                Hiển thị{' '}
                <strong className="text-slate-900">
                  {Math.min((currentPage - 1) * pageSize + 1, displayedProducts.length)} -{' '}
                  {Math.min(currentPage * pageSize, displayedProducts.length)}
                </strong>{' '}
                trên tổng số <strong className="text-slate-900">{displayedProducts.length}</strong> sản phẩm
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium"
              >
                <option value={25}>25 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
                <option value={250}>250 / trang</option>
                <option value={1000}>Tất cả ({displayedProducts.length})</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 shadow-2xs cursor-pointer"
              >
                Trước
              </button>
              <div className="px-2 font-mono font-bold text-slate-800">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 shadow-2xs cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {productToEdit ? 'Chỉnh Sửa Data Giá Sản Phẩm' : 'Thêm Sản Phẩm Mới Vào Master Data'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs transition cursor-pointer"
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

      {/* Product Inventory Details Multi-Tab Drawer */}
      {selectedItemForHoldModal && (
        <ProductInventoryDrawer
          item={selectedItemForHoldModal}
          onClose={() => setSelectedItemForHoldModal(null)}
        />
      )}
    </div>
  );
};

export const ProductPriceMaster: React.FC = () => (
  <ErrorBoundary>
    <ProductPriceMasterContent />
  </ErrorBoundary>
);
