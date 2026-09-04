import { User, CompanyInfo, Customer, ProductPriceItem, InventoryItem, Quotation, Contract, ReserveItem, OrderItem, Organization, StockTransaction, StockInVoucher, StockOutVoucher, StockAuditVoucher, PurchaseOrder, ContractTemplate, CustomerMember } from '../types';
import { supabase } from '../lib/supabase';

/**
 * Helper to convert camelCase string to snake_case.
 */
function toSnakeCaseStr(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Helper to convert snake_case string to camelCase.
 */
function toCamelCaseStr(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts object keys from camelCase to snake_case.
 * Shallow conversion: nested JSONB fields are kept as-is.
 */
export function toSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[toSnakeCaseStr(key)] = obj[key];
    }
  }
  return result;
}

/**
 * Converts object keys from snake_case to camelCase.
 * Shallow conversion: nested JSONB fields are kept as-is.
 */
export function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[toCamelCaseStr(key)] = obj[key];
    }
  }
  return result;
}

/**
 * Generic error handler for Supabase operations.
 */
export function handleSupabaseError(error: any, actionName: string): void {
  console.error(`[Supabase] Error during ${actionName}:`, error);
}

// ------------------------------------------------------------------
// Profiles (Users table -> profiles in Supabase)
// ------------------------------------------------------------------

export async function upsertProfile(user: User): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(toSnakeCase(user), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertProfile');
    return false;
  }
}

export async function deleteProfileById(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteProfileById');
    return false;
  }
}

export async function fetchProfileByFirebaseUid(uid: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('firebase_uid', uid)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : null;
  } catch (error) {
    handleSupabaseError(error, 'fetchProfileByFirebaseUid');
    return null;
  }
}

export async function fetchProfileByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : null;
  } catch (error) {
    handleSupabaseError(error, 'fetchProfileByEmail');
    return null;
  }
}

export async function fetchAllProfiles(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchAllProfiles');
    return [];
  }
}

// ------------------------------------------------------------------
// Organizations
// ------------------------------------------------------------------

export async function upsertOrganization(org: Organization): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('organizations')
      .upsert(toSnakeCase(org), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertOrganization');
    return false;
  }
}

export async function fetchOrganizations(): Promise<Organization[]> {
  try {
    const { data, error } = await supabase.from('organizations').select('*');
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchOrganizations');
    return [];
  }
}

// ------------------------------------------------------------------
// Company Info
// ------------------------------------------------------------------

export async function upsertCompanyInfo(info: CompanyInfo): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('company_info')
      .upsert(toSnakeCase(info), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertCompanyInfo');
    return false;
  }
}

export async function fetchCompanyInfoByOrg(orgId: string): Promise<CompanyInfo | null> {
  try {
    const { data, error } = await supabase
      .from('company_info')
      .select('*')
      .eq('organization_id', orgId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : null;
  } catch (error) {
    handleSupabaseError(error, 'fetchCompanyInfoByOrg');
    return null;
  }
}

// ------------------------------------------------------------------
// Customers
// ------------------------------------------------------------------

export async function upsertCustomer(customer: Customer): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customers')
      .upsert(toSnakeCase(customer), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertCustomer');
    return false;
  }
}

export async function deleteCustomerById(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteCustomerById');
    return false;
  }
}

export async function fetchCustomersByOrg(orgId: string): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchCustomersByOrg');
    return [];
  }
}

// ------------------------------------------------------------------
// Customer Members
// ------------------------------------------------------------------

export async function upsertCustomerMember(member: CustomerMember): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_members')
      .upsert(toSnakeCase(member), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertCustomerMember');
    return false;
  }
}

export async function deleteCustomerMemberById(memberId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('customer_members').delete().eq('id', memberId);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteCustomerMemberById');
    return false;
  }
}

export async function fetchCustomerMembersByCustomer(customerId: string): Promise<CustomerMember[]> {
  try {
    const { data, error } = await supabase
      .from('customer_members')
      .select('*')
      .eq('customer_id', customerId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchCustomerMembersByCustomer');
    return [];
  }
}

// ------------------------------------------------------------------
// Products
// ------------------------------------------------------------------

export async function upsertProduct(product: ProductPriceItem, orgId?: string): Promise<boolean> {
  try {
    const effectiveOrgId = orgId || product.organizationId || product.companyId || '';
    const payload = toSnakeCase({ ...product, id: `${effectiveOrgId}_${product.sku}`, organizationId: effectiveOrgId });
    const { error } = await supabase
      .from('products')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertProduct');
    return false;
  }
}

export async function batchUpsertProducts(products: ProductPriceItem[], orgId?: string): Promise<boolean> {
  if (!products.length) return true;
  try {
    const payload = products.map(p => {
      const oid = orgId || p.organizationId || p.companyId || '';
      return toSnakeCase({ ...p, id: `${oid}_${p.sku}`, organizationId: oid });
    });
    const { error } = await supabase
      .from('products')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'batchUpsertProducts');
    return false;
  }
}

export async function deleteProductBySku(sku: string, orgId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', `${orgId}_${sku}`);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteProductBySku');
    return false;
  }
}

export async function fetchProductsByOrg(orgId: string): Promise<ProductPriceItem[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchProductsByOrg');
    return [];
  }
}

export async function clearProductsByOrg(orgId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('organization_id', orgId)
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  } catch (error) {
    handleSupabaseError(error, 'clearProductsByOrg');
    return 0;
  }
}

// ------------------------------------------------------------------
// Inventory
// ------------------------------------------------------------------

export async function upsertInventoryItem(item: InventoryItem, orgId?: string): Promise<boolean> {
  try {
    const effectiveOrgId = orgId || item.organizationId || item.companyId || '';
    const payload = toSnakeCase({ ...item, id: `${effectiveOrgId}_${item.sku}`, organizationId: effectiveOrgId });
    const { error } = await supabase
      .from('inventory')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertInventoryItem');
    return false;
  }
}

export async function batchUpsertInventory(items: InventoryItem[], orgId?: string): Promise<boolean> {
  if (!items.length) return true;
  try {
    const payload = items.map(item => {
      const oid = orgId || item.organizationId || item.companyId || '';
      return toSnakeCase({ ...item, id: `${oid}_${item.sku}`, organizationId: oid });
    });
    const { error } = await supabase
      .from('inventory')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'batchUpsertInventory');
    return false;
  }
}

export async function deleteInventoryBySku(sku: string, orgId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', `${orgId}_${sku}`);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteInventoryBySku');
    return false;
  }
}

export async function fetchInventoryByOrg(orgId: string): Promise<InventoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchInventoryByOrg');
    return [];
  }
}

export async function clearInventoryByOrg(orgId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .delete()
      .eq('organization_id', orgId)
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  } catch (error) {
    handleSupabaseError(error, 'clearInventoryByOrg');
    return 0;
  }
}

// ------------------------------------------------------------------
// Quotations
// ------------------------------------------------------------------

export async function upsertQuotation(quote: Quotation): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quotations')
      .upsert(toSnakeCase(quote), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertQuotation');
    return false;
  }
}

export async function deleteQuotationById(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('quotations').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteQuotationById');
    return false;
  }
}

export async function batchDeleteQuotations(ids: string[]): Promise<boolean> {
  if (!ids.length) return true;
  try {
    const { error } = await supabase.from('quotations').delete().in('id', ids);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'batchDeleteQuotations');
    return false;
  }
}

export async function fetchQuotationsByOrg(orgId: string): Promise<Quotation[]> {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchQuotationsByOrg');
    return [];
  }
}

export async function clearQuotationsByOrg(orgId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .delete()
      .eq('organization_id', orgId)
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  } catch (error) {
    handleSupabaseError(error, 'clearQuotationsByOrg');
    return 0;
  }
}

// ------------------------------------------------------------------
// Contracts
// ------------------------------------------------------------------

export async function upsertContract(contract: Contract): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('contracts')
      .upsert(toSnakeCase(contract), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertContract');
    return false;
  }
}

export async function deleteContractById(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteContractById');
    return false;
  }
}

export async function batchDeleteContracts(ids: string[]): Promise<boolean> {
  if (!ids.length) return true;
  try {
    const { error } = await supabase.from('contracts').delete().in('id', ids);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'batchDeleteContracts');
    return false;
  }
}

export async function fetchContractsByOrg(orgId: string): Promise<Contract[]> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchContractsByOrg');
    return [];
  }
}

export async function clearContractsByOrg(orgId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .delete()
      .eq('organization_id', orgId)
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  } catch (error) {
    handleSupabaseError(error, 'clearContractsByOrg');
    return 0;
  }
}

// ------------------------------------------------------------------
// Contract Templates
// ------------------------------------------------------------------

export async function upsertContractTemplate(template: ContractTemplate): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('contract_templates')
      .upsert(toSnakeCase(template), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertContractTemplate');
    return false;
  }
}

export async function deleteContractTemplateById(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('contract_templates').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteContractTemplateById');
    return false;
  }
}

export async function fetchContractTemplatesByOrg(orgId: string): Promise<ContractTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchContractTemplatesByOrg');
    return [];
  }
}

// ------------------------------------------------------------------
// Reserve Items
// ------------------------------------------------------------------

export async function upsertReserveItem(reserve: ReserveItem): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reserve_items')
      .upsert(toSnakeCase(reserve), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertReserveItem');
    return false;
  }
}

export async function deleteReserveItemById(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('reserve_items').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteReserveItemById');
    return false;
  }
}

export async function batchUpsertReserves(reserves: ReserveItem[]): Promise<boolean> {
  if (!reserves.length) return true;
  try {
    const payload = reserves.map(toSnakeCase);
    const { error } = await supabase
      .from('reserve_items')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'batchUpsertReserves');
    return false;
  }
}

export async function batchDeleteReserves(ids: string[]): Promise<boolean> {
  if (!ids.length) return true;
  try {
    const { error } = await supabase.from('reserve_items').delete().in('id', ids);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'batchDeleteReserves');
    return false;
  }
}

export async function fetchReservesByOrg(orgId: string): Promise<ReserveItem[]> {
  try {
    const { data, error } = await supabase
      .from('reserve_items')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchReservesByOrg');
    return [];
  }
}

export async function clearReservesByOrg(orgId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('reserve_items')
      .delete()
      .eq('organization_id', orgId)
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  } catch (error) {
    handleSupabaseError(error, 'clearReservesByOrg');
    return 0;
  }
}

// ------------------------------------------------------------------
// Order Items
// ------------------------------------------------------------------

export async function upsertOrderItem(order: OrderItem): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('order_items')
      .upsert(toSnakeCase(order), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertOrderItem');
    return false;
  }
}

export async function deleteOrderItemById(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('order_items').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteOrderItemById');
    return false;
  }
}

export async function batchUpsertOrders(orders: OrderItem[]): Promise<boolean> {
  if (!orders.length) return true;
  try {
    const payload = orders.map(toSnakeCase);
    const { error } = await supabase
      .from('order_items')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'batchUpsertOrders');
    return false;
  }
}

export async function batchDeleteOrders(ids: string[]): Promise<boolean> {
  if (!ids.length) return true;
  try {
    const { error } = await supabase.from('order_items').delete().in('id', ids);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'batchDeleteOrders');
    return false;
  }
}

export async function fetchOrdersByOrg(orgId: string): Promise<OrderItem[]> {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchOrdersByOrg');
    return [];
  }
}

export async function clearOrdersByOrg(orgId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .delete()
      .eq('organization_id', orgId)
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  } catch (error) {
    handleSupabaseError(error, 'clearOrdersByOrg');
    return 0;
  }
}

// ------------------------------------------------------------------
// Purchase Orders
// ------------------------------------------------------------------

export async function upsertPurchaseOrder(po: PurchaseOrder): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('purchase_orders')
      .upsert(toSnakeCase(po), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertPurchaseOrder');
    return false;
  }
}

export async function deletePurchaseOrderById(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deletePurchaseOrderById');
    return false;
  }
}

export async function batchUpsertPurchaseOrders(pos: PurchaseOrder[]): Promise<boolean> {
  if (!pos.length) return true;
  try {
    const payload = pos.map(toSnakeCase);
    const { error } = await supabase
      .from('purchase_orders')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'batchUpsertPurchaseOrders');
    return false;
  }
}

export async function fetchPurchaseOrdersByOrg(orgId: string): Promise<PurchaseOrder[]> {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchPurchaseOrdersByOrg');
    return [];
  }
}

export async function clearPurchaseOrdersByOrg(orgId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('organization_id', orgId)
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  } catch (error) {
    handleSupabaseError(error, 'clearPurchaseOrdersByOrg');
    return 0;
  }
}

// ------------------------------------------------------------------
// Stock Transactions
// ------------------------------------------------------------------

export async function upsertStockTransaction(tx: StockTransaction): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stock_transactions')
      .upsert(toSnakeCase(tx), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertStockTransaction');
    return false;
  }
}

export async function batchUpsertStockTransactions(txs: StockTransaction[]): Promise<boolean> {
  if (!txs.length) return true;
  try {
    const payload = txs.map(toSnakeCase);
    const { error } = await supabase
      .from('stock_transactions')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'batchUpsertStockTransactions');
    return false;
  }
}

export async function fetchStockTransactionsByOrg(orgId: string): Promise<StockTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchStockTransactionsByOrg');
    return [];
  }
}

export async function clearStockTransactionsByOrg(orgId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('stock_transactions')
      .delete()
      .eq('organization_id', orgId)
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  } catch (error) {
    handleSupabaseError(error, 'clearStockTransactionsByOrg');
    return 0;
  }
}

// ------------------------------------------------------------------
// Stock In Vouchers
// ------------------------------------------------------------------

export async function upsertStockInVoucher(voucher: StockInVoucher): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stock_in_vouchers')
      .upsert(toSnakeCase(voucher), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertStockInVoucher');
    return false;
  }
}

export async function deleteStockInVoucherById(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('stock_in_vouchers').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteStockInVoucherById');
    return false;
  }
}

export async function fetchStockInVouchersByOrg(orgId: string): Promise<StockInVoucher[]> {
  try {
    const { data, error } = await supabase
      .from('stock_in_vouchers')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchStockInVouchersByOrg');
    return [];
  }
}

export async function clearStockInVouchersByOrg(orgId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('stock_in_vouchers')
      .delete()
      .eq('organization_id', orgId)
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  } catch (error) {
    handleSupabaseError(error, 'clearStockInVouchersByOrg');
    return 0;
  }
}

// ------------------------------------------------------------------
// Stock Out Vouchers
// ------------------------------------------------------------------

export async function upsertStockOutVoucher(voucher: StockOutVoucher): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stock_out_vouchers')
      .upsert(toSnakeCase(voucher), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertStockOutVoucher');
    return false;
  }
}

export async function deleteStockOutVoucherById(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('stock_out_vouchers').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteStockOutVoucherById');
    return false;
  }
}

export async function fetchStockOutVouchersByOrg(orgId: string): Promise<StockOutVoucher[]> {
  try {
    const { data, error } = await supabase
      .from('stock_out_vouchers')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchStockOutVouchersByOrg');
    return [];
  }
}

export async function clearStockOutVouchersByOrg(orgId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('stock_out_vouchers')
      .delete()
      .eq('organization_id', orgId)
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  } catch (error) {
    handleSupabaseError(error, 'clearStockOutVouchersByOrg');
    return 0;
  }
}

// ------------------------------------------------------------------
// Stock Audit Vouchers
// ------------------------------------------------------------------

export async function upsertStockAuditVoucher(voucher: StockAuditVoucher): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stock_audit_vouchers')
      .upsert(toSnakeCase(voucher), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'upsertStockAuditVoucher');
    return false;
  }
}

export async function deleteStockAuditVoucherById(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('stock_audit_vouchers').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteStockAuditVoucherById');
    return false;
  }
}

export async function fetchStockAuditVouchersByOrg(orgId: string): Promise<StockAuditVoucher[]> {
  try {
    const { data, error } = await supabase
      .from('stock_audit_vouchers')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data ? data.map(toCamelCase) : [];
  } catch (error) {
    handleSupabaseError(error, 'fetchStockAuditVouchersByOrg');
    return [];
  }
}

export async function clearStockAuditVouchersByOrg(orgId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('stock_audit_vouchers')
      .delete()
      .eq('organization_id', orgId)
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  } catch (error) {
    handleSupabaseError(error, 'clearStockAuditVouchersByOrg');
    return 0;
  }
}

// ------------------------------------------------------------------
// Aggregate Functions
// ------------------------------------------------------------------

export async function clearTenantBusinessData(
  orgId: string,
  options: {
    clearCustomers?: boolean;
    clearProducts?: boolean;
    clearInventory?: boolean;
    clearQuotesAndContracts?: boolean;
    clearReservesAndOrders?: boolean;
  }
): Promise<void> {
  try {
    if (options.clearQuotesAndContracts) {
      await clearQuotationsByOrg(orgId);
      await clearContractsByOrg(orgId);
    }
    
    if (options.clearReservesAndOrders) {
      await clearReservesByOrg(orgId);
      await clearOrdersByOrg(orgId);
      await clearPurchaseOrdersByOrg(orgId);
    }

    if (options.clearInventory) {
      await clearInventoryByOrg(orgId);
      await clearStockTransactionsByOrg(orgId);
      await clearStockInVouchersByOrg(orgId);
      await clearStockOutVouchersByOrg(orgId);
      await clearStockAuditVouchersByOrg(orgId);
    }

    if (options.clearProducts) {
      await clearProductsByOrg(orgId);
    }

    if (options.clearCustomers) {
      await supabase.from('customers').delete().eq('organization_id', orgId);
    }
    
  } catch (error) {
    handleSupabaseError(error, 'clearTenantBusinessData');
  }
}
