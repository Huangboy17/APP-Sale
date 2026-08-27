import React, { useState, useMemo } from 'react';
import { ProductPriceItem, InventoryItem, QuoteProductRow } from '../../types';
import { formatVND, formatNumber } from '../../utils/formatters';
import {
  Search,
  X,
  Plus,
  Filter,
  Check,
  AlertTriangle,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  Box,
  Percent,
  RotateCcw,
  Zap,
  Clock,
} from 'lucide-react';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductPriceItem[];
  inventory: InventoryItem[];
  existingItems: QuoteProductRow[];
  onAddProduct: (row: QuoteProductRow, mode?: 'append' | 'merge') => void;
  targetSection?: string;
  sectionsList?: string[];
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  isOpen,
  onClose,
  products,
  inventory,
  existingItems,
  onAddProduct,
  targetSection,
  sectionsList,
}) => {
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Target Section selector state
  const [selectedTargetSection, setSelectedTargetSection] = useState<string>(
    targetSection || (sectionsList && sectionsList[0]) || ''
  );

  // Sync targetSection when prop changes
  React.useEffect(() => {
    if (targetSection) {
      setSelectedTargetSection(targetSection);
    } else if (sectionsList && sectionsList.length > 0 && !selectedTargetSection) {
      setSelectedTargetSection(sectionsList[0]);
    }
  }, [targetSection, sectionsList, isOpen]);

  // Quick Entry Drawer / Selected Product State
  const [selectedProduct, setSelectedProduct] = useState<ProductPriceItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [quotedPrice, setQuotedPrice] = useState<number>(0);
  const [priceInputText, setPriceInputText] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [itemNotes, setItemNotes] = useState<string>('');
  const [duplicateHandling, setDuplicateHandling] = useState<'merge' | 'append'>('merge');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Build inventory map for fast lookup
  const inventoryMap = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    inventory.forEach((i) => map.set(i.sku, i));
    return map;
  }, [inventory]);

  // Extract dynamic Brands and Categories
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Search text
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchSku = prod.sku.toLowerCase().includes(term);
        const matchName = prod.name.toLowerCase().includes(term);
        const matchBrand = prod.brand.toLowerCase().includes(term);
        const matchCat = prod.category.toLowerCase().includes(term);
        const matchColor = prod.color ? prod.color.toLowerCase().includes(term) : false;
        const matchSize = prod.size ? prod.size.toLowerCase().includes(term) : false;
        if (!matchSku && !matchName && !matchBrand && !matchCat && !matchColor && !matchSize) {
          return false;
        }
      }

      // Brand
      if (selectedBrand !== 'all' && prod.brand !== selectedBrand) {
        return false;
      }

      // Category
      if (selectedCategory !== 'all' && prod.category !== selectedCategory) {
        return false;
      }

      // Stock filter
      const inv = inventoryMap.get(prod.sku);
      const avail = inv ? inv.availableQuantity : 0;
      if (stockFilter === 'in_stock' && avail <= 0) return false;
      if (stockFilter === 'out_of_stock' && avail > 0) return false;
      if (stockFilter === 'low_stock' && (avail <= 0 || avail > 10)) return false;

      // Price filter
      if (minPrice && prod.dpPrice < Number(minPrice)) return false;
      if (maxPrice && prod.dpPrice > Number(maxPrice)) return false;

      return true;
    });
  }, [products, searchTerm, selectedBrand, selectedCategory, stockFilter, minPrice, maxPrice, inventoryMap]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // When a product is chosen from list to configure
  const handleSelectProduct = (prod: ProductPriceItem) => {
    setSelectedProduct(prod);
    setQuantity(1);
    const initialPrice = prod.listPrice || prod.dpPrice || 0;
    setQuotedPrice(initialPrice);
    setPriceInputText(String(initialPrice));
    setDiscountPercent(0);
    setItemNotes('');
    setDuplicateHandling('merge');
  };

  // Quick 1-Click Add directly from table
  const handleQuickAdd = (prod: ProductPriceItem) => {
    const inv = inventoryMap.get(prod.sku);
    const avail = inv ? inv.availableQuantity : 0;
    const finalPrice = prod.listPrice || prod.dpPrice || 0;
    const isBelowDP = finalPrice < prod.dpPrice;

    const finalCategory = selectedTargetSection || prod.category || 'Hạng mục chung';

    const newRow: QuoteProductRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sku: prod.sku,
      name: prod.name,
      category: finalCategory,
      brand: prod.brand,
      color: prod.color || '',
      size: prod.size || '',
      unit: prod.unit || 'Bộ',
      listPrice: prod.listPrice,
      dpPrice: prod.dpPrice,
      quotedPrice: finalPrice,
      quantity: 1,
      discountPercent: 0,
      totalAmount: finalPrice * 1,
      inventoryAvailable: avail,
      isBelowDP,
      notes: '',
    };

    onAddProduct(newRow, 'merge');
    showToast(`✓ Đã thêm vào "${finalCategory}": ${prod.name}`);
  };

  // Price change handler (Cách 1: Nhập số tiền trực tiếp)
  const handlePriceChange = (rawVal: string | number) => {
    let numeric = 0;
    if (typeof rawVal === 'string') {
      const cleaned = rawVal.replace(/[^0-9]/g, '');
      numeric = cleaned ? parseInt(cleaned, 10) : 0;
      setPriceInputText(cleaned);
    } else {
      numeric = Math.max(0, rawVal);
      setPriceInputText(String(numeric));
    }

    setQuotedPrice(numeric);
    if (selectedProduct && selectedProduct.listPrice > 0) {
      if (numeric >= selectedProduct.listPrice) {
        setDiscountPercent(0);
      } else {
        const disc = ((selectedProduct.listPrice - numeric) / selectedProduct.listPrice) * 100;
        setDiscountPercent(Number(disc.toFixed(1)));
      }
    }
  };

  // Discount percentage change handler (Cách 2: Nhập tỷ lệ chiết khấu %)
  const handleDiscountChange = (disc: number) => {
    const safeDisc = Math.max(0, Math.min(100, disc));
    setDiscountPercent(safeDisc);
    if (selectedProduct && selectedProduct.listPrice > 0) {
      const newPrice = Math.round(selectedProduct.listPrice * (1 - safeDisc / 100));
      setQuotedPrice(newPrice);
      setPriceInputText(String(newPrice));
    }
  };

  // Check if product is already in quote
  const existingRow = selectedProduct
    ? existingItems.find((item) => item.sku === selectedProduct.sku)
    : null;

  // Add to quote
  const handleConfirmAdd = (keepOpen: boolean = false) => {
    if (!selectedProduct) return;

    const inv = inventoryMap.get(selectedProduct.sku);
    const avail = inv ? inv.availableQuantity : 0;
    const isBelowDP = quotedPrice < selectedProduct.dpPrice;
    const safeQty = Math.max(1, quantity);
    const totalAmount = quotedPrice * safeQty;
    const finalCategory = selectedTargetSection || selectedProduct.category || 'Hạng mục chung';

    const newRow: QuoteProductRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sku: selectedProduct.sku,
      name: selectedProduct.name,
      category: finalCategory,
      brand: selectedProduct.brand,
      color: selectedProduct.color || '',
      size: selectedProduct.size || '',
      unit: selectedProduct.unit || 'Bộ',
      listPrice: selectedProduct.listPrice,
      dpPrice: selectedProduct.dpPrice,
      quotedPrice,
      quantity: safeQty,
      discountPercent,
      totalAmount,
      inventoryAvailable: avail,
      isBelowDP,
      notes: itemNotes,
    };

    onAddProduct(newRow, existingRow ? duplicateHandling : 'append');
    showToast(`✓ Đã thêm ${safeQty} ${selectedProduct.unit || 'SP'} vào "${finalCategory}"`);

    if (keepOpen) {
      // Clear current selection and keep modal open for picking more products
      setSelectedProduct(null);
      setQuantity(1);
      setItemNotes('');
      setPriceInputText('');
    } else {
      setSelectedProduct(null);
      onClose();
    }
  };

  // Handle footer close button: If a product is currently configured, add it before closing
  const handleFooterComplete = () => {
    if (selectedProduct) {
      handleConfirmAdd(false);
    } else {
      onClose();
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBrand('all');
    setSelectedCategory('all');
    setStockFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  if (!isOpen) return null;

  const currentInv = selectedProduct ? inventoryMap.get(selectedProduct.sku) : null;
  const currentAvail = currentInv ? currentInv.availableQuantity : 0;
  const isSelectedBelowDP = selectedProduct ? quotedPrice < selectedProduct.dpPrice : false;
  const isSelectedOverStock = selectedProduct ? quantity > currentAvail : false;
  const computedTotal = quotedPrice * Math.max(1, quantity);

  // Pricing benchmarks & calculations
  const maxSafeDiscount = selectedProduct && selectedProduct.listPrice > 0
    ? Number(Math.max(0, ((selectedProduct.listPrice - selectedProduct.dpPrice) / selectedProduct.listPrice) * 100).toFixed(1))
    : 0;
  
  const discountAmountPerUnit = selectedProduct ? Math.max(0, selectedProduct.listPrice - quotedPrice) : 0;
  const totalDiscountAmount = discountAmountPerUnit * Math.max(1, quantity);
  const priceDiffFromDP = selectedProduct ? quotedPrice - selectedProduct.dpPrice : 0;
  const priceDiffPercentDP = selectedProduct && selectedProduct.dpPrice > 0 
    ? Number(((priceDiffFromDP / selectedProduct.dpPrice) * 100).toFixed(1)) 
    : 0;

  const existingTotalAmount = existingItems.reduce((s, i) => s + (i.totalAmount || (i.quotedPrice * i.quantity)), 0);

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] relative">
        {/* TOAST ALERT NOTIFICATION */}
        {toastMessage && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-70 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-xl font-bold text-xs flex items-center space-x-2 animate-in fade-in zoom-in-95">
            <Check className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* MODAL HEADER */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold tracking-tight">CHỌN SẢN PHẨM VÀO BÁO GIÁ</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {products.length} mã trong kho dữ liệu
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Tìm kiếm theo SKU, tên, hãng. Bấm <strong>"⚡ Thêm nhanh"</strong> hoặc tùy chỉnh chiết khấu.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Section Target Selector */}
            <div className="flex items-center space-x-1.5 bg-blue-950/80 px-2.5 py-1.5 rounded-lg border border-blue-600/50">
              <Layers className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span className="text-[10px] text-blue-200 uppercase font-black tracking-wider whitespace-nowrap">Thêm vào:</span>
              <select
                value={selectedTargetSection}
                onChange={(e) => setSelectedTargetSection(e.target.value)}
                className="bg-slate-900 text-amber-300 font-extrabold text-xs px-2 py-0.5 rounded border border-blue-400/60 focus:outline-hidden focus:ring-1 focus:ring-amber-400 max-w-[180px] truncate"
              >
                {sectionsList && sectionsList.length > 0 ? (
                  sectionsList.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))
                ) : (
                  <option value={selectedTargetSection || 'Hạng mục chung'}>
                    {selectedTargetSection || 'Hạng mục chung'}
                  </option>
                )}
              </select>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              autoFocus
              placeholder="🔎 Tìm theo mã sản phẩm (SKU), tên sản phẩm, hãng, quy cách hoặc màu sắc..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {/* Brand Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Hãng sản xuất</label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 outline-hidden"
              >
                <option value="all">Tất cả Hãng ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Loại sản phẩm</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 outline-hidden"
              >
                <option value="all">Tất cả Phân loại ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Inventory Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Tồn kho khả dụng</label>
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 outline-hidden"
              >
                <option value="all">Tất cả trạng thái kho</option>
                <option value="in_stock">✓ Còn hàng trong kho (&gt;0)</option>
                <option value="low_stock">⚡ Tồn ít (&lt;10 cái)</option>
                <option value="out_of_stock">✕ Hết hàng (Cần đặt)</option>
              </select>
            </div>

            {/* Price Filter (From) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Giá DP từ (VNĐ)</label>
              <input
                type="number"
                placeholder="VD: 1000000"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-700 outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Price Filter (To) + Reset button */}
            <div className="flex items-end space-x-1">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Đến (VNĐ)</label>
                <input
                  type="number"
                  placeholder="VD: 50000000"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-700 outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                title="Đặt lại bộ lọc"
                className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-bold transition shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN BODY: SPLIT VIEW (LIST OF PRODUCTS + SELECTED PRODUCT CONFIGURATOR) */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* LEFT SIDE: PRODUCT RESULTS TABLE / CARDS */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 border-r border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
              <span>
                Tìm thấy <strong className="text-slate-800 font-bold">{filteredProducts.length}</strong> sản phẩm phù hợp
              </span>
              <div className="flex items-center space-x-2">
                <span>Hiển thị:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-xs font-semibold"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {paginatedProducts.length === 0 ? (
              <div className="bg-slate-50 p-8 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                <Box className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs font-bold text-slate-700">Không tìm thấy sản phẩm nào phù hợp</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Hãy thử xóa từ khóa tìm kiếm hoặc đặt lại các bộ lọc hãng, phân loại và khoảng giá.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow-2xs inline-flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa bộ lọc</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {paginatedProducts.map((prod) => {
                  const inv = inventoryMap.get(prod.sku);
                  const avail = inv ? inv.availableQuantity : 0;
                  const total = inv ? inv.totalQuantity : 0;
                  const isSelected = selectedProduct?.sku === prod.sku;
                  const alreadyInQuote = existingItems.some((i) => i.sku === prod.sku);

                  return (
                    <div
                      key={prod.sku}
                      onClick={() => handleSelectProduct(prod)}
                      onDoubleClick={() => handleQuickAdd(prod)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                          : alreadyInQuote
                          ? 'bg-amber-50/40 border-amber-200 hover:border-blue-300 hover:bg-slate-50'
                          : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Product identity */}
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-mono font-bold text-blue-700 text-[11px] bg-blue-100/70 px-1.5 py-0.2 rounded">
                            {prod.sku}
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate max-w-md">{prod.name}</span>
                          {alreadyInQuote && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Đã có ({existingItems.find((i) => i.sku === prod.sku)?.quantity} {prod.unit})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 flex-wrap">
                          <span className="font-semibold text-slate-700">Hãng: {prod.brand}</span>
                          <span>•</span>
                          <span>{prod.category}</span>
                          {prod.color && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600">{prod.color}</span>
                            </>
                          )}
                          {prod.size && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600">{prod.size}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Pricing and Stock info */}
                      <div className="flex items-center space-x-2.5 shrink-0 sm:text-right">
                        {/* Pricing */}
                        <div>
                          <div className="text-[10px] text-slate-400">Niêm yết: {formatVND(prod.listPrice)}</div>
                          <div className="font-bold text-slate-900 text-xs">
                            Giá DP: <span className="text-amber-700 font-mono">{formatVND(prod.dpPrice)}</span>
                          </div>
                        </div>

                        {/* Stock badge */}
                        <div className="text-center w-20">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                              avail === 0
                                ? 'bg-rose-100 text-rose-800'
                                : avail < 10
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {avail > 0 ? `Tồn: ${avail} ${prod.unit}` : `Hết (${prod.unit})`}
                          </span>
                          <div className="text-[9px] text-slate-400 mt-0.5">Tổng: {total}</div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1">
                          {/* Quick 1-click Add */}
                          <button
                            type="button"
                            title="Thêm nhanh 1 sản phẩm theo giá niêm yết"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAdd(prod);
                            }}
                            className="px-2 py-1 rounded text-[11px] font-bold bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-300 transition flex items-center space-x-1"
                          >
                            <Zap className="w-3 h-3" />
                            <span className="hidden sm:inline">Thêm nhanh</span>
                          </button>

                          {/* Choose and configure button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProduct(prod);
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-bold transition shadow-2xs shrink-0 flex items-center space-x-1 ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                            }`}
                          >
                            {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>{isSelected ? 'Đang chỉnh' : 'Chọn'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Trang <strong className="text-slate-800">{currentPage}</strong> / {totalPages}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded text-xs font-semibold transition"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded text-xs font-semibold transition"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: SELECTED PRODUCT CONFIGURATOR PANEL */}
          <div className="w-full lg:w-96 bg-slate-50 p-4 flex flex-col justify-between overflow-y-auto border-t lg:border-t-0 lg:border-l border-slate-200">
            {selectedProduct ? (
              <div className="space-y-3.5 text-xs">
                <div className="border-b border-slate-200 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Sản Phẩm Đang Cấu Hình
                    </span>
                    <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {selectedProduct.sku}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{selectedProduct.name}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Hãng: <strong className="text-slate-700">{selectedProduct.brand}</strong> • Loại: {selectedProduct.category}
                  </div>
                  {selectedProduct.size && (
                    <div className="text-[11px] text-slate-500">Quy cách: {selectedProduct.size} • {selectedProduct.color}</div>
                  )}
                </div>

                {/* Stock & Reference Benchmark */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium">Tồn kho khả dụng:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-xs ${
                        currentAvail > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {currentAvail} {selectedProduct.unit}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Giá Niêm Yết (NY)</div>
                      <div className="font-bold text-slate-900 font-mono text-sm">{formatVND(selectedProduct.listPrice)}</div>
                    </div>
                    <div className="bg-amber-50/80 p-2 rounded border border-amber-200">
                      <div className="text-[10px] text-amber-900 font-semibold uppercase">Giá Sàn DP Tối Thiểu</div>
                      <div className="font-bold text-amber-900 font-mono text-sm">{formatVND(selectedProduct.dpPrice)}</div>
                    </div>
                  </div>

                  {/* Max safe discount guide */}
                  {selectedProduct.listPrice > selectedProduct.dpPrice && (
                    <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded">
                      <span>Mức CK tối đa để không lỗ DP:</span>
                      <span className="font-bold text-slate-700">Tối đa -{maxSafeDiscount}% ({formatVND(selectedProduct.listPrice - selectedProduct.dpPrice)})</span>
                    </div>
                  )}
                </div>

                {/* Price Status Indicator Badge */}
                {isSelectedBelowDP ? (
                  <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-300 text-rose-900 space-y-1 animate-pulse">
                    <div className="font-bold text-xs flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>CẢNH BÁO: BÁN DƯỚI GIÁ DP ({priceDiffPercentDP}%)</span>
                    </div>
                    <div className="text-[11px] text-rose-700 leading-tight">
                      Giá chào bán thấp hơn giá DP <strong>{formatVND(Math.abs(priceDiffFromDP))}</strong>. Đơn vị cần sự phê duyệt giá của Cấp 1 (Quản lý).
                    </div>
                  </div>
                ) : quotedPrice === selectedProduct.dpPrice ? (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-300 text-amber-900 text-[11px] flex items-center space-x-1.5 font-semibold">
                    <span>⚡ Bán đúng Giá Sàn DP (Chiết khấu tối đa -{maxSafeDiscount}%)</span>
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between">
                    <span className="flex items-center space-x-1 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Giá chào bán an toàn:</span>
                    </span>
                    <span className="font-bold font-mono text-emerald-800">
                      +{formatVND(priceDiffFromDP)} (+{priceDiffPercentDP}% so với DP)
                    </span>
                  </div>
                )}

                {/* Warning: Out of stock / Need PO */}
                {isSelectedOverStock && (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-300 text-amber-900 text-[11px]">
                    ⚡ Số lượng bán ({quantity} {selectedProduct.unit}) vượt tồn kho ({currentAvail}). Khi ký HĐ, hệ thống sẽ tách đơn đặt hàng{' '}
                    <strong>{quantity - currentAvail} {selectedProduct.unit}</strong>.
                  </div>
                )}

                {/* Duplicate item prompt */}
                {existingRow && (
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200 text-blue-900 space-y-1.5">
                    <div className="font-bold text-xs flex items-center space-x-1">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>Sản phẩm đã có trong báo giá!</span>
                    </div>
                    <div className="text-[11px] text-blue-800">
                      Hiện tại đang có <strong className="font-bold">{existingRow.quantity} {existingRow.unit}</strong> trong báo giá. Bạn muốn:
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setDuplicateHandling('merge')}
                        className={`p-1.5 text-center text-[11px] font-bold rounded border transition ${
                          duplicateHandling === 'merge'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        + Cộng dồn (+{quantity})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplicateHandling('append')}
                        className={`p-1.5 text-center text-[11px] font-bold rounded border transition ${
                          duplicateHandling === 'append'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Tạo dòng mới
                      </button>
                    </div>
                  </div>
                )}

                {/* Quantity Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Số lượng chào bán ({selectedProduct.unit}) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center transition active:scale-95"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmAdd(false);
                      }}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="flex-1 px-3 py-1.5 text-center font-bold text-sm bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center transition active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* DUAL PRICING CONFIGURATION (2 CÁCH NHẬP: SỐ TIỀN HOẶC TỶ LỆ CHIẾT KHẤU %) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-900 text-xs flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cấu Hình Giá Bán & Chiết Khấu</span>
                    </span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-200">
                      2 Cách Nhập Tự Động
                    </span>
                  </div>

                  {/* 2 Inputs Side by Side */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {/* CÁCH 1: NHẬP ĐƠN GIÁ BÁN TRỰC TIẾP (VNĐ) */}
                    <div className="sm:col-span-7">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-700">
                          1. Giá bán cho khách <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[9px] text-slate-400">VNĐ</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={priceInputText}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmAdd(false);
                          }}
                          onChange={(e) => handlePriceChange(e.target.value)}
                          placeholder="0"
                          className={`w-full pl-2 pr-10 py-1.5 text-right font-mono font-bold text-xs sm:text-sm rounded-md border focus:ring-2 outline-hidden ${
                            isSelectedBelowDP
                              ? 'border-rose-400 bg-rose-50/70 text-rose-900 focus:ring-rose-500'
                              : 'border-slate-300 bg-white text-slate-900 focus:ring-blue-500'
                          }`}
                        />
                        <div className="absolute right-2 top-2 text-slate-400 text-[10px] font-bold">VNĐ</div>
                      </div>
                    </div>

                    {/* CÁCH 2: NHẬP TỶ LỆ CHIẾT KHẤU (%) */}
                    <div className="sm:col-span-5">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-700">
                          2. Tỷ lệ CK (%)
                        </label>
                        <span className="text-[9px] text-slate-400">Hệ số</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={discountPercent}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmAdd(false);
                          }}
                          onChange={(e) => handleDiscountChange(Number(e.target.value) || 0)}
                          className="w-full pl-2 pr-6 py-1.5 text-right font-mono font-bold text-xs sm:text-sm rounded-md border border-blue-300 bg-blue-50/30 text-blue-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                        />
                        <div className="absolute right-2 top-2 text-blue-600 text-xs font-black">%</div>
                      </div>
                    </div>
                  </div>

                  {/* Formula Breakdown / Calculation note */}
                  <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200/80 flex items-center justify-between">
                    <span>
                      {discountPercent > 0 ? (
                        <>
                          Giảm: <strong className="text-blue-700 font-bold">-{discountPercent}%</strong> (-{formatVND(discountAmountPerUnit)}/SP)
                        </>
                      ) : (
                        <span>Bán đúng Giá Niêm Yết (0% CK)</span>
                      )}
                    </span>
                    <span className="text-slate-400">
                      {selectedProduct.listPrice > 0 && (
                        <span>NY: {formatVND(selectedProduct.listPrice)}</span>
                      )}
                    </span>
                  </div>

                  {/* Quick Discount Presets Buttons */}
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 mb-1">Chọn nhanh mức chiết khấu:</div>
                    <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                      {[0, 5, 10, 15, 20, 25].map((disc) => (
                        <button
                          key={disc}
                          type="button"
                          onClick={() => handleDiscountChange(disc)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                            discountPercent === disc
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {disc === 0 ? '0% (NY)' : `-${disc}%`}
                        </button>
                      ))}

                      {/* Special Quick Button: Bằng Giá Sàn DP */}
                      <button
                        type="button"
                        onClick={() => handlePriceChange(selectedProduct.dpPrice)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center space-x-1 ${
                          quotedPrice === selectedProduct.dpPrice
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                        }`}
                        title="Tự động gán bằng giá sàn DP tối thiểu"
                      >
                        <span>⭐ Bằng Giá DP ({maxSafeDiscount}%)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtotal Calculation Box */}
                <div className="p-3 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl space-y-1 shadow-xs border border-blue-800">
                  <div className="flex justify-between text-xs text-blue-200">
                    <span>Thành tiền ({quantity} × {formatVND(quotedPrice)}):</span>
                    {totalDiscountAmount > 0 && (
                      <span className="text-[10px] text-emerald-300 font-medium">
                        (Tiết kiệm {formatVND(totalDiscountAmount)})
                      </span>
                    )}
                  </div>
                  <div className="text-base sm:text-lg font-black font-mono tracking-tight text-white flex justify-between items-baseline pt-0.5">
                    <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">TỔNG TIỀN DÒNG:</span>
                    <span className="text-emerald-400">{formatVND(computedTotal)}</span>
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ghi chú sản phẩm (tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="VD: Bao gồm phụ kiện gắn tường, giao đợt 1..."
                    value={itemNotes}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmAdd(false);
                    }}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>

                {/* Actions */}
                <div className="pt-2 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleConfirmAdd(false)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition active:scale-98 flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>THÊM VÀO BÁO GIÁ & ĐÓNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmAdd(true)}
                    className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thêm & Tiếp Tục Chọn Mã Khác</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                <Box className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                <div className="space-y-1">
                  <div className="font-bold text-slate-700 text-xs">Chưa chọn sản phẩm</div>
                  <p className="text-[11px] text-slate-400">
                    Click vào nút <strong className="text-blue-600">"Chọn"</strong> hoặc <strong className="text-emerald-600">"⚡ Thêm nhanh"</strong> ở danh sách bên trái.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 shrink-0">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="font-semibold">Đã thêm vào báo giá:</span>
            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              {existingItems.length} mã ({existingItems.reduce((s, i) => s + i.quantity, 0)} số lượng)
            </span>
            <span className="text-slate-400">|</span>
            <span>Tổng tiền: <strong className="text-slate-900 font-mono font-bold">{formatVND(existingTotalAmount)}</strong></span>
          </div>

          <button
            type="button"
            onClick={handleFooterComplete}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs transition shadow-2xs flex items-center justify-center space-x-1"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hoàn Tất & Xem Báo Giá ({existingItems.length} SP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
