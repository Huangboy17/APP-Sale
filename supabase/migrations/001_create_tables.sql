-- Migration 001: Create Tables
-- Sử dụng Firebase Auth, không sử dụng Supabase Auth/RLS.
-- Mọi truy cập được kiểm soát ở mức độ ứng dụng thông qua organization_id.

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'manager_c1', 'sales_c2')),
  phone TEXT DEFAULT '',
  password TEXT,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'pending_approval', 'blocked', 'archived', 'inactive')),
  organization_id TEXT NOT NULL,
  parent_id TEXT,
  manager_id TEXT,
  department TEXT,
  position TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL
);

-- 2. organizations
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 3. company_info
CREATE TABLE IF NOT EXISTS company_info (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT,
  address TEXT DEFAULT '',
  tax_code TEXT DEFAULT '',
  logo_url TEXT,
  logo TEXT,
  industry TEXT,
  phone TEXT DEFAULT '',
  hotline TEXT,
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account TEXT,
  bank_account_holder TEXT,
  director_name TEXT,
  director_title TEXT,
  updated_by TEXT,
  updated_at TEXT
);

-- 4. customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT,
  shipping_address TEXT,
  city TEXT,
  tax_code TEXT,
  contact_person TEXT,
  representative TEXT,
  position TEXT,
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'quoting', 'contract_signed', 'rejected')),
  organization_id TEXT NOT NULL,
  assigned_to_id TEXT NOT NULL,
  assigned_to_name TEXT NOT NULL,
  member_ids JSONB DEFAULT '[]',
  created_by TEXT NOT NULL,
  reject_reason TEXT,
  notes TEXT,
  expected_value NUMERIC DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 5. customer_members
CREATE TABLE IF NOT EXISTS customer_members (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 6. products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  brand TEXT DEFAULT '',
  color TEXT DEFAULT '',
  size TEXT DEFAULT '',
  unit TEXT DEFAULT '',
  list_price NUMERIC DEFAULT 0,
  dp_price NUMERIC DEFAULT 0,
  description TEXT,
  image_url TEXT,
  image_url_alias TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
  organization_id TEXT NOT NULL,
  company_id TEXT,
  created_by TEXT,
  created_by_name TEXT,
  UNIQUE(sku, organization_id)
);

-- 7. inventory
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT DEFAULT '',
  total_quantity NUMERIC DEFAULT 0,
  reserved_quantity NUMERIC DEFAULT 0,
  available_quantity NUMERIC DEFAULT 0,
  on_order_quantity NUMERIC DEFAULT 0,
  incoming_quantity NUMERIC DEFAULT 0,
  reorder_needed NUMERIC DEFAULT 0,
  unfulfilled_demand NUMERIC DEFAULT 0,
  warehouse_location TEXT,
  updated_at TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  company_id TEXT,
  created_by TEXT,
  created_by_name TEXT,
  UNIQUE(sku, organization_id)
);

-- 8. quotations
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  quote_number TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  customer_email TEXT DEFAULT '',
  customer_company TEXT,
  customer_address TEXT,
  customer_tax_code TEXT,
  sales_rep_id TEXT NOT NULL,
  sales_rep_name TEXT NOT NULL,
  sales_rep_phone TEXT,
  sales_rep_email TEXT,
  title TEXT DEFAULT '',
  date TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  company_name TEXT,
  company_address TEXT,
  company_tax_code TEXT,
  company_logo TEXT,
  company_logo_url TEXT,
  company_hotline TEXT,
  company_website TEXT,
  company_email TEXT,
  order_code TEXT,
  project_location TEXT,
  contact_person TEXT,
  opening_greeting TEXT,
  price_terms TEXT,
  delivery_terms TEXT,
  shipping_terms TEXT,
  warranty_terms TEXT,
  lead_time_terms TEXT,
  custom_terms TEXT,
  closing_notes TEXT,
  signatory_title TEXT,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  milestones JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'negotiating', 'approved_contract', 'cancelled')),
  is_contract_quote BOOLEAN DEFAULT false,
  contract_id TEXT,
  created_by TEXT,
  notes TEXT,
  terms_and_conditions TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 9. contracts
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  contract_number TEXT NOT NULL,
  quote_id TEXT,
  quote_number TEXT,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  signed_date TEXT,
  effective_date TEXT,
  expiry_date TEXT,
  total_value NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  snapshot JSONB,
  items JSONB DEFAULT '[]',
  milestones JSONB DEFAULT '[]',
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 10. contract_templates
CREATE TABLE IF NOT EXISTS contract_templates (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'khac',
  category_label TEXT,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  content TEXT NOT NULL,
  file_url TEXT,
  template_variables JSONB,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT,
  created_by_name TEXT
);

-- 11. reserve_items
CREATE TABLE IF NOT EXISTS reserve_items (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  contract_id TEXT,
  contract_number TEXT,
  quote_number TEXT,
  customer_id TEXT,
  customer_name TEXT,
  sales_rep_id TEXT,
  sales_rep_name TEXT,
  created_by TEXT,
  sku TEXT,
  product_name TEXT,
  unit TEXT,
  reserved_quantity NUMERIC,
  dispatched_quantity NUMERIC,
  delivered_quantity NUMERIC,
  warehouse_location TEXT,
  reserved_date TEXT,
  status TEXT,
  expected_delivery_date TEXT,
  actual_delivery_date TEXT,
  completed_at TEXT,
  completed_by TEXT,
  completed_by_name TEXT,
  stock_transaction_ids JSONB,
  timeline JSONB,
  released_reason TEXT,
  purchase_order_id TEXT,
  stock_in_voucher_id TEXT,
  order_item_id TEXT
);

-- 12. order_items
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  contract_id TEXT,
  contract_number TEXT,
  quote_number TEXT,
  customer_id TEXT,
  customer_name TEXT,
  sales_rep_id TEXT,
  sales_rep_name TEXT,
  created_by TEXT,
  sku TEXT,
  product_name TEXT,
  unit TEXT,
  warehouse_location TEXT,
  order_quantity NUMERIC,
  received_quantity NUMERIC,
  remaining_quantity NUMERIC,
  dispatched_quantity NUMERIC,
  delivered_quantity NUMERIC,
  brand TEXT,
  size TEXT,
  color TEXT,
  order_date TEXT,
  status TEXT,
  supplier_eta TEXT,
  completed_at TEXT,
  completed_by TEXT,
  completed_by_name TEXT,
  notes TEXT,
  stock_transaction_ids JSONB,
  inbound_receipts JSONB,
  timeline JSONB
);

-- 13. purchase_orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  po_number TEXT,
  supplier_id TEXT,
  supplier_name TEXT,
  order_date TEXT,
  expected_delivery_date TEXT,
  warehouse_location TEXT,
  status TEXT,
  items JSONB DEFAULT '[]',
  total_sales_demand NUMERIC,
  total_order_quantity NUMERIC,
  total_quantity NUMERIC,
  total_received_quantity NUMERIC,
  total_amount NUMERIC,
  created_by_id TEXT,
  created_by_name TEXT,
  notes TEXT
);

-- 14. stock_transactions
CREATE TABLE IF NOT EXISTS stock_transactions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  timestamp TEXT,
  date TEXT,
  sku TEXT,
  product_name TEXT,
  unit TEXT,
  type TEXT,
  delta_quantity NUMERIC,
  before_on_hand NUMERIC,
  after_on_hand NUMERIC,
  before_reserved NUMERIC,
  after_reserved NUMERIC,
  before_available NUMERIC,
  after_available NUMERIC,
  reference_code TEXT,
  partner_name TEXT,
  performed_by_id TEXT,
  performed_by_name TEXT,
  notes TEXT
);

-- 15. stock_in_vouchers
CREATE TABLE IF NOT EXISTS stock_in_vouchers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  voucher_number TEXT,
  purchase_order_id TEXT,
  purchase_order_number TEXT,
  date TEXT,
  supplier_name TEXT,
  warehouse_location TEXT,
  status TEXT,
  items JSONB DEFAULT '[]',
  total_quantity NUMERIC,
  total_amount NUMERIC,
  created_by_id TEXT,
  created_by_name TEXT,
  confirmed_at TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 16. stock_out_vouchers
CREATE TABLE IF NOT EXISTS stock_out_vouchers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  voucher_number TEXT,
  date TEXT,
  contract_id TEXT,
  contract_number TEXT,
  customer_name TEXT,
  customer_id TEXT,
  reserve_id TEXT,
  warehouse_location TEXT,
  status TEXT,
  items JSONB DEFAULT '[]',
  total_quantity NUMERIC,
  created_by_id TEXT,
  created_by_name TEXT,
  confirmed_at TEXT,
  receiver_name TEXT,
  receiver_phone TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 17. stock_audit_vouchers
CREATE TABLE IF NOT EXISTS stock_audit_vouchers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  voucher_number TEXT,
  date TEXT,
  warehouse_location TEXT,
  status TEXT,
  items JSONB DEFAULT '[]',
  total_items_audited NUMERIC,
  total_difference NUMERIC,
  created_by_id TEXT,
  created_by_name TEXT,
  confirmed_at TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Tạo Index cho organization_id để tăng tốc độ truy vấn phân quyền
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_company_info_org_id ON company_info(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_members_org_id ON customer_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_org_id ON inventory(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotations_org_id ON quotations(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_org_id ON contract_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_reserve_items_org_id ON reserve_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_order_items_org_id ON order_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_id ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_org_id ON stock_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_vouchers_org_id ON stock_in_vouchers(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_vouchers_org_id ON stock_out_vouchers(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_audit_vouchers_org_id ON stock_audit_vouchers(organization_id);
