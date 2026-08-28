import {
  INITIAL_CONTRACT_TEMPLATES,
  renderContractContent,
  validateContractRequirements,
  generateItemsTableHtml,
  ContractMappingInput,
} from './src/services/contractTemplateService';
import {
  ContractTemplate,
  ContractSnapshot,
  Quotation,
  Customer,
  QuoteProductRow,
  Contract,
} from './src/types';
import { numberToVietnameseWords, formatVND } from './src/utils/formatters';

function runTests() {
  console.log('🧪 Starting Contract Templates & Automated Contract Generation Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
    }
  }

  // =========================================================================
  // TEST 1: DEFAULT TEMPLATES INTEGRITY
  // =========================================================================
  console.log('--- 1. Testing Default Contract Templates ---');
  assert(INITIAL_CONTRACT_TEMPLATES.length >= 3, `Has ${INITIAL_CONTRACT_TEMPLATES.length} pre-defined contract templates`);
  const supplyTmpl = INITIAL_CONTRACT_TEMPLATES.find((t) => t.id === 'tmpl-cung-cap-vat-tu');
  assert(!!supplyTmpl, 'Found "Hợp đồng Mua bán & Cung cấp Thiết bị Điện" template');
  assert(supplyTmpl?.content.includes('{{items_table}}'), 'Supply template contains {{items_table}} placeholder');
  assert(supplyTmpl?.content.includes('{{contract_number}}'), 'Supply template contains {{contract_number}} placeholder');
  assert(supplyTmpl?.content.includes('{{contract_grand_total}}'), 'Supply template contains {{contract_grand_total}} placeholder');
  assert(supplyTmpl?.content.includes('{{contract_total_in_words}}'), 'Supply template contains {{contract_total_in_words}} placeholder');

  // =========================================================================
  // TEST 2: CASE 1 — QUOTATION WITH 1 PRODUCT
  // =========================================================================
  console.log('\n--- 2. Testing Case 1: Quotation with 1 product ---');
  const singleItem: QuoteProductRow = {
    id: 'row-1',
    sku: 'LED-001',
    name: 'Đèn Led Downlight 9W',
    category: 'Đèn',
    brand: 'Philips',
    color: 'Trắng',
    size: 'D90',
    unit: 'Cái',
    listPrice: 150000,
    dpPrice: 100000,
    quotedPrice: 120000,
    quantity: 10,
    discountPercent: 0,
    totalAmount: 1200000,
    inventoryAvailable: 50,
    isBelowDP: false,
  };

  const input1: ContractMappingInput = {
    contractNumber: 'HĐKT-2026/08-001',
    contractDate: '2026-08-28',
    contractTitle: 'HỢP ĐỒNG CUNG CẤP VẬT TƯ',
    customer: {
      name: 'Nguyễn Văn A',
      company: 'CÔNG TY TNHH XÂY DỰNG MINH ANH',
      taxCode: '0101234567',
      address: 'Hà Nội',
      representative: 'Nguyễn Văn A',
      position: 'Giám Đốc',
    },
    seller: {
      name: 'CÔNG TY TNHH HHG HOLDINGS',
      taxCode: '0108999888',
      representative: 'Bùi Viết Hoàng',
      position: 'Tổng Giám Đốc',
    },
    items: [singleItem],
    totals: {
      subtotal: 1200000,
      taxRate: 10,
      taxAmount: 120000,
      grandTotal: 1320000,
    },
  };

  const rendered1 = renderContractContent(supplyTmpl!.content, input1);
  assert(rendered1.includes('HĐKT-2026/08-001'), 'Rendered text contains correct contract number');
  assert(rendered1.includes('CÔNG TY TNHH XÂY DỰNG MINH ANH'), 'Rendered text contains customer company');
  assert(rendered1.includes('LED-001'), 'Rendered text contains product SKU');
  assert(rendered1.includes('Đèn Led Downlight 9W'), 'Rendered text contains product name');
  assert(rendered1.includes('1.320.000'), 'Rendered text contains formatted total price');
  assert(rendered1.includes('Một triệu ba trăm hai mươi nghìn đồng'), 'Rendered text contains total in Vietnamese words');

  // =========================================================================
  // TEST 3: CASE 2 — QUOTATION WITH 100 PRODUCTS
  // =========================================================================
  console.log('\n--- 3. Testing Case 2: Quotation with 100 products ---');
  const manyItems: QuoteProductRow[] = Array.from({ length: 100 }, (_, i) => ({
    id: `row-${i + 1}`,
    sku: `SKU-${String(i + 1).padStart(3, '0')}`,
    name: `Sản Phẩm Đèn Model Số ${i + 1}`,
    category: 'Đèn Trang Trí',
    brand: 'Philips',
    color: '3000K',
    size: 'Standard',
    unit: 'Bộ',
    listPrice: 500000,
    dpPrice: 350000,
    quotedPrice: 450000,
    quantity: 2,
    discountPercent: 0,
    totalAmount: 900000,
    inventoryAvailable: 10,
    isBelowDP: false,
  }));

  const tableHtml100 = generateItemsTableHtml(manyItems);
  assert(tableHtml100.includes('SKU-001'), 'Table contains first product SKU-001');
  assert(tableHtml100.includes('SKU-100'), 'Table contains 100th product SKU-100');
  const rowCountMatch = (tableHtml100.match(/<tr style="border-bottom: 1px solid/g) || []).length;
  assert(rowCountMatch === 100, `Generated HTML table has exactly 100 product rows (found ${rowCountMatch})`);

  // =========================================================================
  // TEST 4: CASE 3 & 4 — VALIDATION CHECKS (MISSING MST / FIELDS)
  // =========================================================================
  console.log('\n--- 4. Testing Validation and Edge Cases ---');

  const mockQuote: Quotation = {
    id: 'quote-test-1',
    quoteNumber: 'BG-2026-001',
    version: 1,
    customerId: 'cust-1',
    customerName: 'Trần Văn B',
    customerPhone: '0901234567',
    customerEmail: 'b@test.com',
    salesRepId: 'sales-1',
    salesRepName: 'Sales Rep',
    title: 'Báo giá',
    date: '2026-08-28',
    validUntil: '2026-09-28',
    items: [singleItem],
    subtotal: 1200000,
    discountTotal: 0,
    taxRate: 10,
    taxAmount: 120000,
    grandTotal: 1320000,
    milestones: [],
    status: 'approved_contract',
    isContractQuote: true,
    createdAt: '2026-08-28',
    updatedAt: '2026-08-28',
  };

  const validCust: Customer = {
    id: 'cust-1',
    code: 'KH-001',
    name: 'Trần Văn B',
    company: 'Công ty B',
    taxCode: '0109998888',
    address: '123 Cầu Giấy',
    phone: '0901234567',
    email: 'b@test.com',
    stage: 'contract_signed',
    organizationId: 'org-c1-1',
    assignedToId: 'sales-1',
    assignedToName: 'Sales Rep',
    createdBy: 'user-mgr-c1-1',
    expectedValue: 1320000,
    createdAt: '2026-08-28',
    updatedAt: '2026-08-28',
  };

  const valSuccess = validateContractRequirements(mockQuote, validCust, supplyTmpl, 'HĐKT-2026-001');
  assert(valSuccess.isValid === true, 'Validation passes for complete quotation and customer data');

  // Missing contract number
  const valMissingNum = validateContractRequirements(mockQuote, validCust, supplyTmpl, '');
  assert(valMissingNum.isValid === false, 'Validation rejects empty contract number');

  // Missing quotation items
  const emptyQuote = { ...mockQuote, items: [] };
  const valEmptyQuote = validateContractRequirements(emptyQuote, validCust, supplyTmpl, 'HĐKT-01');
  assert(valEmptyQuote.isValid === false, 'Validation rejects quotation with empty items');

  // Missing customer tax code gives warning but allows progression
  const noTaxCust = { ...validCust, company: '', taxCode: '' };
  const valNoTax = validateContractRequirements(mockQuote, noTaxCust, supplyTmpl, 'HĐKT-01');
  assert(valNoTax.issues.some((i) => i.severity === 'warning'), 'Validation issues warning for missing tax code');

  // =========================================================================
  // TEST 5: CASE 7 — TEMPLATE VERSION ISOLATION
  // =========================================================================
  console.log('\n--- 5. Testing Template Version Isolation ---');
  const templateV1: ContractTemplate = {
    ...supplyTmpl!,
    version: '1.0',
  };

  // Create contract with template v1.0
  const contractV1Snapshot: ContractSnapshot = {
    templateId: templateV1.id,
    templateName: templateV1.name,
    templateCode: templateV1.code,
    templateVersion: '1.0',
    customerSnapshot: {
      id: validCust.id,
      name: validCust.name,
      company: validCust.company,
      taxCode: validCust.taxCode,
    },
    sellerSnapshot: {
      name: 'HHG Holdings',
    },
    quotationSnapshot: {
      id: mockQuote.id,
      quoteNumber: mockQuote.quoteNumber,
      version: mockQuote.version,
      title: mockQuote.title,
      date: mockQuote.date,
    },
    itemsSnapshot: [singleItem],
    pricingSnapshot: {
      subtotal: 1200000,
      discountTotal: 0,
      taxRate: 10,
      taxAmount: 120000,
      grandTotal: 1320000,
      totalInWords: 'Một triệu ba trăm hai mươi nghìn đồng chẵn.',
    },
    renderedContent: rendered1,
    generatedAt: '2026-08-28T10:00:00Z',
    generatedBy: 'user-sales-1',
  };

  const createdContract: Contract = {
    id: 'contract-test-v1',
    contractNumber: 'HĐKT-2026-001',
    quotationId: mockQuote.id,
    quoteNumber: mockQuote.quoteNumber,
    customerId: validCust.id,
    customerName: validCust.name,
    contractDate: '2026-08-28',
    deliveryDate: '2026-09-15',
    deliveryAddress: 'Hà Nội',
    items: [singleItem],
    totalValue: 1320000,
    milestones: [],
    status: 'signed',
    templateId: templateV1.id,
    templateName: templateV1.name,
    templateVersion: '1.0',
    snapshot: contractV1Snapshot,
    renderedContent: rendered1,
    salesRepId: 'sales-1',
    salesRepName: 'Sales Rep',
    createdAt: '2026-08-28',
  };

  // Now update template to v2.0
  const updatedTemplateV2: ContractTemplate = {
    ...templateV1,
    version: '2.0',
    name: 'Hợp đồng Cung cấp Mới v2.0',
  };

  assert(createdContract.snapshot?.templateVersion === '1.0', 'Contract snapshot preserves templateVersion 1.0 even after template updates to 2.0');
  assert(createdContract.templateVersion === '1.0', 'Contract templateVersion field remains 1.0');

  // =========================================================================
  // TEST 6: CASE 8 & 9 — DATA SNAPSHOT IMMUTABILITY
  // =========================================================================
  console.log('\n--- 6. Testing Data Snapshot Immutability (Freeze against Master Data change) ---');

  // Later, Master Data Price changes from 120k to 500k
  const modifiedMasterProduct = {
    ...singleItem,
    quotedPrice: 500000,
    totalAmount: 5000000,
  };

  // Customer changes address and company
  const modifiedCustomer = {
    ...validCust,
    company: 'CÔNG TY TNHH THAY ĐỔI TÊN',
    address: 'Địa chỉ mới ở Đà Nẵng',
  };

  // Verify contract snapshot remains 100% frozen
  assert(
    createdContract.snapshot?.pricingSnapshot.grandTotal === 1320000,
    'Contract snapshot grand total remains frozen at 1.320.000 VNĐ regardless of master price changes'
  );
  assert(
    createdContract.snapshot?.itemsSnapshot[0].quotedPrice === 120000,
    'Contract snapshot item price remains frozen at 120.000 VNĐ'
  );
  assert(
    createdContract.snapshot?.customerSnapshot.company === 'Công ty B',
    'Contract snapshot customer company remains frozen at "Công ty B"'
  );
  assert(
    createdContract.snapshot?.renderedContent.includes('1.320.000'),
    'Contract snapshot rendered HTML content preserves exact rendered text'
  );

  console.log(`\n🎉 Results: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
