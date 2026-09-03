import {
  extractSkuFromFileName,
  isImageFile,
  findMatchingProduct,
  matchImageFilesToProducts,
  uploadBatchProductImages,
} from './src/services/productImageService';
import { ProductPriceItem, MatchedImageItem } from './src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${message}`);
}

async function runTests() {
  console.log('🧪 Starting Bulk Image Import Concurrency & Execution Test Suite...\n');

  const mockProducts: ProductPriceItem[] = [
    { sku: 'AX-001', name: 'Đèn LED Downlight 9W', listPrice: 150000, dpPrice: 120000, unit: 'Cái', category: 'Đèn', brand: 'Rạng Đông', color: 'Trắng', size: 'D90', description: '', status: 'active' },
    { sku: 'AX-002', name: 'Đèn LED Tuýp 18W', listPrice: 85000, dpPrice: 65000, unit: 'Cái', category: 'Đèn', brand: 'Rạng Đông', color: 'Trắng', size: '1m2', description: '', status: 'active' },
    { sku: 'AX-003', name: 'Công Tắc Đơn', listPrice: 45000, dpPrice: 35000, unit: 'Bộ', category: 'Thiết bị', brand: 'Panasonic', color: 'Trắng', size: 'Tiêu chuẩn', description: '', status: 'active' },
    { sku: 'AX-004', name: 'Ổ Cắm Đôi 3 Chấu', listPrice: 65000, dpPrice: 50000, unit: 'Bộ', category: 'Thiết bị', brand: 'Panasonic', color: 'Trắng', size: 'Tiêu chuẩn', description: '', status: 'active' },
    { sku: 'AX-005', name: 'Aptomat 32A', listPrice: 120000, dpPrice: 95000, unit: 'Cái', category: 'Thiết bị', brand: 'Schneider', color: 'Trắng', size: 'Tiêu chuẩn', description: '', status: 'active' },
  ];

  // Helper to create mock File
  function createMockImageFile(name: string, sizeBytes = 1024): File {
    const blob = new Blob(['mock-binary-image-data-test'], { type: 'image/jpeg' });
    return new File([blob], name, { type: 'image/jpeg' });
  }

  // Helper to create mock Corrupt File
  function createMockCorruptFile(name: string): File {
    const blob = new Blob(['invalid-corrupt-data'], { type: 'application/octet-stream' });
    return new File([blob], name, { type: 'application/octet-stream' });
  }

  console.log('--- 1. Test A: Single Image Batch Import (1 SKU, 1 File) ---');
  const file1 = createMockImageFile('AX-001.jpg');
  const matchResult1 = matchImageFilesToProducts([file1], mockProducts);
  assert(matchResult1.matchedCount === 1, 'Matched exactly 1 file');
  assert(matchResult1.matched[0].sku === 'AX-001', 'Matched SKU AX-001');

  let progressReported1 = false;
  const result1 = await uploadBatchProductImages(
    matchResult1.matched,
    'org-test-1',
    (p) => {
      if (p.isProcessing) progressReported1 = true;
    },
    4
  );
  assert(progressReported1, 'Progress callback was triggered during execution');
  assert(result1.successfulUpdates.length === 1, '1 item uploaded successfully');
  assert(result1.failedItems.length === 0, '0 failures');
  assert(result1.successfulUpdates[0].sku === 'AX-001', 'Update contains SKU AX-001');

  console.log('\n--- 2. Test B: Multi-Image Batch Import (5 SKUs, 5 Files) ---');
  const files5 = [
    createMockImageFile('AX-001.jpg'),
    createMockImageFile('AX-002.png'),
    createMockImageFile('AX-003.webp'),
    createMockImageFile('AX-004.jpeg'),
    createMockImageFile('AX-005.jpg'),
  ];
  const matchResult5 = matchImageFilesToProducts(files5, mockProducts);
  assert(matchResult5.matchedCount === 5, 'Matched all 5 product files');
  assert(matchResult5.unmatchedCount === 0, '0 unmatched files');

  let completedSteps = 0;
  const result5 = await uploadBatchProductImages(
    matchResult5.matched,
    'org-test-1',
    (p) => {
      completedSteps = p.completed;
    },
    4
  );
  assert(result5.successfulUpdates.length === 5, 'All 5 items uploaded successfully');
  assert(result5.failedItems.length === 0, '0 failures in clean batch');
  assert(completedSteps === 5, 'Completed count reached 5/5');

  console.log('\n--- 3. Test C: Batch with Mixed Valid & Non-Image Files ---');
  const filesMixed = [
    createMockImageFile('AX-001.jpg'),
    createMockCorruptFile('AX-002.pdf'), // Invalid format
    createMockImageFile('UNKNOWN-SKU-999.jpg'), // Unknown SKU
    createMockImageFile('AX-003.png'),
    createMockImageFile('AX-001_duplicate.jpg'), // Duplicate SKU in same batch
  ];
  const matchResultMixed = matchImageFilesToProducts(filesMixed, mockProducts);
  assert(matchResultMixed.totalFiles === 5, 'Total files is 5');
  assert(matchResultMixed.matchedCount === 2, '2 valid matched files (AX-001 and AX-003)');
  assert(matchResultMixed.unmatchedCount === 3, '3 unmatched files (1 PDF, 1 unknown SKU, 1 duplicate)');
  assert(
    matchResultMixed.unmatched.some((u) => u.reason === 'INVALID_FORMAT'),
    'Identified PDF as INVALID_FORMAT'
  );
  assert(
    matchResultMixed.unmatched.some((u) => u.reason === 'NOT_FOUND'),
    'Identified UNKNOWN-SKU as NOT_FOUND'
  );
  assert(
    matchResultMixed.unmatched.some((u) => u.reason === 'DUPLICATE'),
    'Identified duplicate AX-001 as DUPLICATE'
  );

  const resultMixed = await uploadBatchProductImages(
    matchResultMixed.matched,
    'org-test-1',
    undefined,
    4
  );
  assert(resultMixed.successfulUpdates.length === 2, 'Queue processed the 2 valid items without hanging');

  console.log('\n--- 4. Test D: Large Batch Concurrency Queue (25 Items) ---');
  const mock25Products: ProductPriceItem[] = Array.from({ length: 25 }, (_, i) => ({
    sku: `PROD-${String(i + 1).padStart(3, '0')}`,
    name: `Sản Phẩm ${i + 1}`,
    listPrice: 100000,
    dpPrice: 80000,
    unit: 'Bộ',
    category: 'Test',
    brand: 'Test',
    color: 'Trắng',
    size: 'M',
    description: '',
    status: 'active',
  }));
  const files25 = mock25Products.map((p) => createMockImageFile(`${p.sku}.jpg`));
  const matchResult25 = matchImageFilesToProducts(files25, mock25Products);
  assert(matchResult25.matchedCount === 25, 'Matched all 25 files');

  let finalProgressTotal = 0;
  let finalProgressCompleted = 0;
  const result25 = await uploadBatchProductImages(
    matchResult25.matched,
    'org-test-large',
    (p) => {
      finalProgressTotal = p.total;
      finalProgressCompleted = p.completed;
    },
    4
  );
  assert(result25.successfulUpdates.length === 25, 'All 25 items uploaded successfully through concurrency queue');
  assert(finalProgressTotal === 25, 'Final progress total is 25');
  assert(finalProgressCompleted === 25, 'Final progress completed is 25');

  console.log('\n🎉 ALL TESTS PASSED: Bulk Image Import Concurrency & Promise Flow 100% Verified!\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
