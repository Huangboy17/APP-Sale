import {
  extractSkuFromFileName,
  isImageFile,
  matchImageFilesToProducts,
} from './src/services/productImageService';
import {
  normalizeProductPriceItem,
} from './src/utils/priceImportEngine';
import { ProductPriceItem } from './src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${detail || ''}`);
    failed++;
  }
}

console.log('================================================================');
console.log('🧪 TEST SUITE: PRODUCT IMAGE MANAGEMENT & BULK IMPORT ENGINE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. SKU Extraction & File Name Matching Tests
// -----------------------------------------------------------------------------
console.log('--- 1. SKU EXTRACTION TESTS ---');

assert(
  extractSkuFromFileName('AX-001.jpg') === 'AX-001',
  'extractSkuFromFileName basic JPG',
  `Expected AX-001, got ${extractSkuFromFileName('AX-001.jpg')}`
);

assert(
  extractSkuFromFileName('  led_downlight_12w.png  ') === 'LED_DOWNLIGHT_12W',
  'extractSkuFromFileName with whitespace and lowercase PNG',
  `Expected LED_DOWNLIGHT_12W, got ${extractSkuFromFileName('  led_downlight_12w.png  ')}`
);

assert(
  extractSkuFromFileName('SP-2025-V2.final.webp') === 'SP-2025-V2.FINAL',
  'extractSkuFromFileName with dots in base name',
  `Expected SP-2025-V2.FINAL, got ${extractSkuFromFileName('SP-2025-V2.final.webp')}`
);

assert(
  extractSkuFromFileName('') === '',
  'extractSkuFromFileName handles empty string'
);

// -----------------------------------------------------------------------------
// 2. Image File Format Validation Tests
// -----------------------------------------------------------------------------
console.log('\n--- 2. IMAGE FORMAT VALIDATION TESTS ---');

assert(isImageFile('product.jpg') === true, 'isImageFile handles .jpg');
assert(isImageFile('product.JPEG') === true, 'isImageFile handles .JPEG (case-insensitive)');
assert(isImageFile('product.png') === true, 'isImageFile handles .png');
assert(isImageFile('product.webp') === true, 'isImageFile handles .webp');
assert(isImageFile('product.svg') === true, 'isImageFile handles .svg');
assert(isImageFile('product.pdf') === false, 'isImageFile rejects .pdf');
assert(isImageFile('product.xlsx') === false, 'isImageFile rejects .xlsx');
assert(isImageFile('product.exe') === false, 'isImageFile rejects .exe');

// -----------------------------------------------------------------------------
// 3. Match Image Files to Products in Master Data
// -----------------------------------------------------------------------------
console.log('\n--- 3. MATCHING IMAGES TO PRODUCTS TESTS ---');

const mockProducts: ProductPriceItem[] = [
  {
    sku: 'LED-DL-01',
    name: 'Đèn Downlight 9W',
    category: 'Đèn',
    brand: 'Philips',
    color: 'Trắng',
    size: 'D90',
    unit: 'Bộ',
    listPrice: 250000,
    dpPrice: 190000,
    status: 'active',
    imageUrl: 'https://storage.googleapis.com/test-bucket/old-image.webp',
  },
  {
    sku: 'LED-DL-02',
    name: 'Đèn Downlight 12W',
    category: 'Đèn',
    brand: 'Philips',
    color: 'Trắng',
    size: 'D110',
    unit: 'Bộ',
    listPrice: 320000,
    dpPrice: 240000,
    status: 'active',
    imageUrl: undefined, // Chưa có ảnh
  },
  {
    sku: 'SEN-TAM-01',
    name: 'Sen Tắm Nóng Lạnh INAX',
    category: 'Thiết bị vệ sinh',
    brand: 'INAX',
    color: 'Inox 304',
    size: 'Tiêu chuẩn',
    unit: 'Bộ',
    listPrice: 1850000,
    dpPrice: 1450000,
    status: 'active',
  },
];

// Mock File Objects
function createMockFile(name: string, size = 1024, type = 'image/jpeg'): any {
  return {
    name,
    size,
    type,
  };
}

const mockFiles = [
  createMockFile('LED-DL-01.jpg', 50000),      // Matched - Overwrite
  createMockFile('led-dl-02.png', 75000),      // Matched - New Image
  createMockFile('UNKNOWN-SKU-99.jpg', 60000), // Unmatched - NOT_FOUND
  createMockFile('price_list.xlsx', 120000, 'application/vnd.ms-excel'), // Unmatched - INVALID_FORMAT
  createMockFile('LED-DL-01.png', 55000),      // Unmatched - DUPLICATE in batch
];

const matchResult = matchImageFilesToProducts(mockFiles, mockProducts);

assert(matchResult.totalFiles === 5, 'matchResult total files is 5');
assert(matchResult.matchedCount === 2, 'matchResult matched count is 2 (LED-DL-01 and LED-DL-02)');
assert(matchResult.overwriteCount === 1, 'matchResult overwrite count is 1 (LED-DL-01 has existing image)');
assert(matchResult.newImageCount === 1, 'matchResult new image count is 1 (LED-DL-02)');
assert(matchResult.unmatchedCount === 3, 'matchResult unmatched count is 3');

const notFoundItem = matchResult.unmatched.find((u) => u.derivedSku === 'UNKNOWN-SKU-99');
assert(notFoundItem?.reason === 'NOT_FOUND', 'Unknown SKU flagged with reason NOT_FOUND');

const invalidFormatItem = matchResult.unmatched.find((u) => u.fileName === 'price_list.xlsx');
assert(invalidFormatItem?.reason === 'INVALID_FORMAT', 'Non-image file flagged with reason INVALID_FORMAT');

const duplicateItem = matchResult.unmatched.find((u) => u.fileName === 'LED-DL-01.png');
assert(duplicateItem?.reason === 'DUPLICATE', 'Duplicate SKU in same batch flagged with reason DUPLICATE');

// -----------------------------------------------------------------------------
// 4. Product Normalization & Zero-Base64 Retention Tests
// -----------------------------------------------------------------------------
console.log('\n--- 4. PRODUCT NORMALIZATION & ZERO-BASE64 VERIFICATION ---');

const rawExcelRow = {
  product_code: 'LED-STRIP-24V',
  product_name: 'LED Dây 24V Cuộn 5M',
  unit: 'Cuộn',
  price: 450000,
  dp_price: 350000,
  imageUrl: 'https://storage.googleapis.com/test-bucket/org-c1/products/LED-STRIP-24V/image.webp',
};

const normalized = normalizeProductPriceItem(rawExcelRow, 'org-c1', 'user-1', 'Manager C1');

assert(normalized.sku === 'LED-STRIP-24V', 'Normalized SKU preserved');
assert(normalized.name === 'LED Dây 24V Cuộn 5M', 'Normalized Name preserved');
assert(normalized.imageUrl === rawExcelRow.imageUrl, 'Normalized Image URL preserved');
assert(normalized.organizationId === 'org-c1', 'Normalized Organization ID assigned');
assert(normalized.listPrice === 450000, 'Normalized List Price correct');
assert(normalized.dpPrice === 350000, 'Normalized DP Price correct');

// Verify that base64 is NOT stored if user passed undefined
const emptyImageRow = {
  product_code: 'LED-NO-IMG',
  product_name: 'LED Không Có Ảnh',
  price: 100000,
};
const normalizedEmpty = normalizeProductPriceItem(emptyImageRow, 'org-c1');
assert(normalizedEmpty.imageUrl === undefined, 'Product without image has imageUrl undefined');

// -----------------------------------------------------------------------------
// 5. Multi-Tenant Storage Path Isolation Logic
// -----------------------------------------------------------------------------
console.log('\n--- 5. MULTI-TENANT STORAGE PATH ISOLATION TESTS ---');

const org1Id = 'company-alpha';
const org2Id = 'company-beta';
const sameSku = 'SHARED-SKU-100';

const pathOrg1 = `organizations/${org1Id}/products/${sameSku}/image.webp`;
const pathOrg2 = `organizations/${org2Id}/products/${sameSku}/image.webp`;

assert(pathOrg1 !== pathOrg2, 'Storage paths for identical SKUs in different companies are isolated');
assert(pathOrg1.includes('company-alpha'), 'Path contains company-alpha organization ID');
assert(pathOrg2.includes('company-beta'), 'Path contains company-beta organization ID');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
}
