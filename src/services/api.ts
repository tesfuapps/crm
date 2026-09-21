import { supabase } from '../lib/supabase';

// ================= CUSTOMERS =================
export async function getCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('last_contacted_at', { ascending: false, nullsFirst: false });
  if (error) {
    console.error('getCustomers error:', error);
    throw error;
  }
  return data || [];
}

export async function createCustomer(payload: any) {
  const { data, error } = await supabase
    .from('customers')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(id: string, updates: any) {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ================= COMMUNICATIONS =================
export async function getCommunications(limit = 100) {
  const { data, error } = await supabase
    .from('communications')
    .select(`
      *,
      products (id, name, code, category, base_price_etb)
    `)
    .order('call_date', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('getCommunications error:', error);
    throw error;
  }
  return data || [];
}

export async function logCommunication(callPayload: any) {
  const { data, error } = await supabase
    .from('communications')
    .insert([callPayload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCustomerCommunications(customerId: string) {
  const { data, error } = await supabase
    .from('communications')
    .select(`*, products (id, name, code, category, base_price_etb)`)
    .eq('customer_id', customerId)
    .order('call_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getCustomerSales(customerId: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ================= PURCHASES (SALES) =================
export async function getSales(limit = 200) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('getSales error:', error);
    throw error;
  }
  return data || [];
}

export async function recordSale(purchasePayload: any) {
  const { data, error } = await supabase
    .from('purchases')
    .insert([purchasePayload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ================= PRODUCTS CATALOG =================
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true });
  if (error) {
    console.error('getProducts error:', error);
    throw error;
  }
  return data || [];
}

// ================= NOTIFICATIONS =================
export async function getNotifications(limit = 30) {
  const { data, error } = await supabase
    .from('app_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function markNotificationAsRead(id: string) {
  const { error } = await supabase
    .from('app_notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('app_notifications')
    .update({ is_read: true })
    .eq('is_read', false);
  if (error) throw error;
}
