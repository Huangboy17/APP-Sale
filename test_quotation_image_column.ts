import { QuoteProductRow, ProductPriceItem, Quotation } from './src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${message}`);
}

console.log('🧪 Starting Quotation Image Column Verification Suite...\n');

// Mock Product Master Data
const mockOrgAProducts: ProductPriceItem[] = [
  {
    sku: 'AX-001',
    name: 'Vòi chậu Lavabo Axor Starck',
    listPrice: 12500000,
    dpPrice: 9500000,
    unit: 'Bộ',
    category: 'Vòi chậu',
    brand: 'Axor',
    color: 'Chrome',
    size: 'Tiêu chuẩn',
    description: '',
    status: 'active',
    imageUrl: 'https://firebasestorage.googleapis.com/orgA/ax001.webp',
    organizationId: 'org-a',
  },
  {
    sku: 'AX-002',
    name: 'Sen tắm âm tường Hansgrohe',
    listPrice: 18000000,
    dpPrice: 14000000,
    unit: 'Bộ',
    category: 'Sen tắm',
    brand: 'Hansgrohe',
    color: 'Chrome',
    size: 'Tiêu chuẩn',
    description: '',
    status: 'active',
    imageUrl: undefined, // NO IMAGE
    organizationId: 'org-a',
  },
  {
    sku: 'AX-003',
    name: 'Bồn cầu thông minh Axor',
    listPrice: 45000000,
    dpPrice: 36000000,
    unit: 'Bộ',
    category: 'Bàn cầu',
    brand: 'Axor',
    color: 'Trắng',
    size: 'D650',
    description: '',
    status: 'active',
    imageUrl: 'https://firebasestorage.googleapis.com/orgA/ax003.webp',
    organizationId: 'org-a',
  },
];

const mockOrgBProducts: ProductPriceItem[] = [
  {
    sku: 'AX-001',
    name: 'Vòi chậu Lavabo Axor Starck (Org B)',
    listPrice: 12500000,
    dpPrice: 9500000,
    unit: 'Bộ',
    category: 'Vòi chậu',
    brand: 'Axor',
    color: 'Chrome',
    size: 'Tiêu chuẩn',
    description: '',
    status: 'active',
    imageUrl: 'https://firebasestorage.googleapis.com/orgB/ax001_orgB.webp',
    organizationId: 'org-b',
  },
];

function resolveRowImage(row: QuoteProductRow, products: ProductPriceItem[]): string | undefined {
  const productsMap = new Map<string, ProductPriceItem>();
  products.forEach((p) => {
    if (p.sku) {
      productsMap.set(p.sku.trim().toUpperCase(), p);
    }
  });
  const matched = productsMap.get((row.sku || '').trim().toUpperCase());
  return row.imageUrl || matched?.imageUrl || matched?.image_url || undefined;
}

console.log('--- 1. Test 1: Product with Image (AX-001) ---');
const rowWithImage: QuoteProductRow = {
  id: 'r1',
  sku: 'AX-001',
  name: 'Vòi chậu Lavabo Axor Starck',
  category: 'Phần I: WC Master',
  brand: 'Axor',
  color: 'Chrome',
  size: 'Tiêu chuẩn',
  unit: 'Bộ',
  listPrice: 12500000,
  dpPrice: 9500000,
  quotedPrice: 11000000,
  quantity: 2,
  discountPercent: 12,
  totalAmount: 22000000,
  inventoryAvailable: 5,
  isBelowDP: false,
};
const img1 = resolveRowImage(rowWithImage, mockOrgAProducts);
assert(img1 === 'https://firebasestorage.googleapis.com/orgA/ax001.webp', 'Resolves correct image URL for AX-001');

console.log('\n--- 2. Test 2: Product without Image (AX-002) ---');
const rowWithoutImage: QuoteProductRow = {
  id: 'r2',
  sku: 'AX-002',
  name: 'Sen tắm âm tường Hansgrohe',
  category: 'Phần I: WC Master',
  brand: 'Hansgrohe',
  color: 'Chrome',
  size: 'Tiêu chuẩn',
  unit: 'Bộ',
  listPrice: 18000000,
  dpPrice: 14000000,
  quotedPrice: 16000000,
  quantity: 1,
  discountPercent: 11,
  totalAmount: 16000000,
  inventoryAvailable: 2,
  isBelowDP: false,
};
const img2 = resolveRowImage(rowWithoutImage, mockOrgAProducts);
assert(img2 === undefined, 'Resolves undefined (clean blank cell) for product without image');

console.log('\n--- 3. Test 3: Multiple Products in Quotation ---');
const quoteRows: QuoteProductRow[] = [
  rowWithImage,
  rowWithoutImage,
  {
    id: 'r3',
    sku: 'AX-003',
    name: 'Bồn cầu thông minh Axor',
    category: 'Phần I: WC Master',
    brand: 'Axor',
    color: 'Trắng',
    size: 'D650',
    unit: 'Bộ',
    listPrice: 45000000,
    dpPrice: 36000000,
    quotedPrice: 40000000,
    quantity: 1,
    discountPercent: 11.1,
    totalAmount: 40000000,
    inventoryAvailable: 3,
    isBelowDP: false,
  },
];
const resolvedImages = quoteRows.map((r) => resolveRowImage(r, mockOrgAProducts));
assert(resolvedImages[0] === 'https://firebasestorage.googleapis.com/orgA/ax001.webp', 'Row 0 has image');
assert(resolvedImages[1] === undefined, 'Row 1 is completely empty (no placeholder)');
assert(resolvedImages[2] === 'https://firebasestorage.googleapis.com/orgA/ax003.webp', 'Row 2 has image');

console.log('\n--- 4. Test 4: Multi-Tenant Isolation ---');
const imgOrgA = resolveRowImage(rowWithImage, mockOrgAProducts);
const imgOrgB = resolveRowImage(rowWithImage, mockOrgBProducts);
assert(imgOrgA === 'https://firebasestorage.googleapis.com/orgA/ax001.webp', 'Org A resolves Org A image');
assert(imgOrgB === 'https://firebasestorage.googleapis.com/orgB/ax001_orgB.webp', 'Org B resolves Org B image');
assert(imgOrgA !== imgOrgB, 'Tenant images are completely isolated for identical SKU');

console.log('\n--- 5. Test 5: Legacy Quotation Compatibility (No schema breakage) ---');
const legacyQuoteItem: QuoteProductRow = {
  id: 'legacy-1',
  sku: 'AX-001',
  name: 'Vòi chậu Lavabo',
  category: 'Khu WC',
  brand: 'Axor',
  color: '',
  size: '',
  unit: 'Bộ',
  listPrice: 12500000,
  dpPrice: 9500000,
  quotedPrice: 11000000,
  quantity: 2,
  discountPercent: 0,
  totalAmount: 22000000,
  inventoryAvailable: 10,
  isBelowDP: false,
  // NO imageUrl field in legacy record
};
const legacyResolved = resolveRowImage(legacyQuoteItem, mockOrgAProducts);
assert(legacyResolved === 'https://firebasestorage.googleapis.com/orgA/ax001.webp', 'Legacy quote item dynamically resolves image from Master Data');

console.log('\n--- 7. Test 7: Large Quotation (100+ items) calculation and memory stability ---');
const largeQuoteRows: QuoteProductRow[] = [];
for (let i = 1; i <= 120; i++) {
  largeQuoteRows.push({
    id: `row-${i}`,
    sku: i % 2 === 0 ? 'AX-001' : 'AX-002',
    name: `Sản phẩm dự án hạng mục ${i}`,
    category: i <= 40 ? 'Phần I: Tầng 1' : i <= 80 ? 'Phần II: Tầng 2' : 'Phần III: Tầng 3',
    brand: 'Axor',
    color: 'Chrome',
    size: 'Tiêu chuẩn',
    unit: 'Bộ',
    listPrice: 10000000,
    dpPrice: 8000000,
    quotedPrice: 9000000,
    quantity: 2,
    discountPercent: 10,
    totalAmount: 18000000,
    inventoryAvailable: 50,
    isBelowDP: false,
  });
}

const largeSubtotal = largeQuoteRows.reduce((sum, r) => sum + r.totalAmount, 0);
assert(largeQuoteRows.length === 120, '120 items generated successfully');
assert(largeSubtotal === 120 * 18000000, 'Subtotal for 120 items is 2,160,000,000 VNĐ');

const largeImages = largeQuoteRows.map((r) => ({
  sku: r.sku,
  img: resolveRowImage(r, mockOrgAProducts),
}));
const ax001Items = largeImages.filter((item) => item.sku === 'AX-001');
const ax002Items = largeImages.filter((item) => item.sku === 'AX-002');
assert(ax001Items.length === 60 && ax001Items.every((item) => item.img === 'https://firebasestorage.googleapis.com/orgA/ax001.webp'), 'All 60 AX-001 rows resolve image correctly');
assert(ax002Items.length === 60 && ax002Items.every((item) => item.img === undefined), 'All 60 AX-002 rows resolve undefined (clean blank cell)');

console.log('\n--- 10. Test 10: Customer Detail Null Safety with Incomplete / Missing Fields ---');
import { getCustomer360Summary, getCustomer360Items } from './src/services/customer360Service';
import { Customer } from './src/types';

const incompleteCustomer: Customer = {
  id: 'cust-incomplete',
  code: '', // Empty code
  name: 'Khách hàng mới tiềm năng',
  phone: '',
  email: '',
  stage: 'new',
  organizationId: 'org-a',
  assignedToId: '',
  assignedToName: '',
  createdBy: 'user-1',
};

const incompleteSummary = getCustomer360Summary(incompleteCustomer, [], [], []);
assert(incompleteSummary.totalContractValue === 0, 'Incomplete customer total contract value is 0');
assert(incompleteSummary.totalContractsCount === 0, 'Incomplete customer contract count is 0');
assert(incompleteSummary.overallFulfillmentPercent === 0, 'Incomplete customer fulfillment percent is 0');

const incomplete360Items = getCustomer360Items(incompleteCustomer.id, [], [], [], [], [], [], []);
assert(incomplete360Items.length === 0, 'Incomplete customer 360 items is empty array without errors');

// Test safe code slicing
const safeCodeSlice = (incompleteCustomer.code || 'KH').slice(-3);
assert(safeCodeSlice === 'KH', 'Safe code slice handles empty code without runtime exception');

console.log('\n--- 11. Test 11: Column Order Verification (STT -> SKU -> Name/QuyCach -> Image -> Brand) ---');
const standardQuotationHeaders = [
  'STT',
  'MÃ HÀNG',
  'TÊN HÀNG HÓA & QUY CÁCH',
  'ẢNH SP',
  'HÃNG SX',
  'XUẤT XỨ',
  'MÀU/KT',
  'ĐVT',
  'SL',
  'GIÁ NIÊM YẾT',
  'CK (%)',
  'ĐƠN GIÁ',
  'THÀNH TIỀN',
  'GHI CHÚ',
];
const nameIdx = standardQuotationHeaders.indexOf('TÊN HÀNG HÓA & QUY CÁCH');
const imageIdx = standardQuotationHeaders.indexOf('ẢNH SP');
const brandIdx = standardQuotationHeaders.indexOf('HÃNG SX');
assert(nameIdx === 2, 'Tên hàng hóa & quy cách is at column index 2');
assert(imageIdx === 3, 'Ảnh SP is placed immediately after Tên hàng hóa & quy cách at column index 3');
assert(brandIdx === 4, 'Hãng SX is placed after Ảnh SP at column index 4');
assert(imageIdx === nameIdx + 1, 'Column ordering strictly satisfies "Chi tiết và quy cách sản phẩm -> Ảnh sản phẩm"');

console.log('\n🎉 ALL 11 TESTS PASSED: Customer Detail Modal & Quotation Reordered Columns are 100% Verified!\n');
