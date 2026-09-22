import { supabase } from '../lib/supabase';

// Helper to normalize phone numbers (e.g. +251... to 09...)
function cleanPhone(raw: string): string {
  if (!raw) return '0900000000';
  let p = raw.replace(/[\s\-\(\)]/g, '').trim();
  if (p.startsWith('+251')) p = '0' + p.slice(4);
  if (p.startsWith('251')) p = '0' + p.slice(3);
  return p;
}

// Helper to translate branch shorthand/variants to DB valid CHECK values
function normalizeBranch(branch: string): string {
  if (!branch) return 'Bole Branch';
  const b = branch.toLowerCase();
  if (branch === 'b1' || b.includes('bole')) return 'Bole Branch';
  if (branch === 'b2' || b.includes('mexico')) return 'Mexico Branch';
  if (branch === 'b3' || b.includes('piassa')) return 'Piassa Branch';
  return branch;
}

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

export async function createCustomer(input: any) {
  const payload = {
    name: input.name || input.customerName || 'Unnamed Client',
    company_name: input.company_name || input.companyName || input.company || '',
    phone_number: cleanPhone(input.phone_number || input.phoneNumber || input.phone),
    main_branch: normalizeBranch(input.main_branch || input.mainBranchId || input.branch || 'Bole Branch'),
    tin_number: input.tin_number || input.tinNumber || null,
    sub_city: input.sub_city || input.subCity || 'Addis Ababa',
    business_type: input.business_type || input.businessType || 'Commercial Print Shop',
    preferred_channel: input.preferred_channel || input.preferredChannel || 'Telegram',
    priority: input.priority || input.leadPriority || 'Normal',
  };

  // Safe upsert to avoid duplicate phone 409 errors
  const { data, error } = await supabase
    .from('customers')
    .upsert([payload], { onConflict: 'phone_number' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCustomer(id: string, input: any) {
  const payload: any = {};
  if (input.name || input.customerName) payload.name = input.name || input.customerName;
  if (input.company_name || input.companyName || input.company !== undefined) {
    payload.company_name = input.company_name || input.companyName || input.company || '';
  }
  if (input.phone_number || input.phoneNumber || input.phone) {
    payload.phone_number = cleanPhone(input.phone_number || input.phoneNumber || input.phone);
  }
  if (input.main_branch || input.mainBranchId || input.branch) {
    payload.main_branch = normalizeBranch(input.main_branch || input.mainBranchId || input.branch);
  }
  if (input.tin_number !== undefined || input.tinNumber !== undefined) {
    payload.tin_number = input.tin_number || input.tinNumber || null;
  }
  if (input.sub_city !== undefined || input.subCity !== undefined) {
    payload.sub_city = input.sub_city || input.subCity || 'Addis Ababa';
  }
  if (input.business_type || input.businessType) {
    payload.business_type = input.business_type || input.businessType;
  }
  if (input.preferred_channel || input.preferredChannel) {
    payload.preferred_channel = input.preferred_channel || input.preferredChannel;
  }
  if (input.priority || input.leadPriority) {
    payload.priority = input.priority || input.leadPriority;
  }

  const { data, error } = await supabase
    .from('customers')
    .update(payload)
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

export async function logCommunication(input: any) {
  const payload = {
    customer_id: input.customer_id || input.customerId,
    customer_name: input.customer_name || input.customerName || null,
    company_name: input.company_name || input.companyName || null,
    phone_number: input.phone_number ? cleanPhone(input.phone_number) : null,
    sales_rep_id: input.sales_rep_id || input.repId || null,
    sales_rep_name: input.sales_rep_name || input.rep || 'Dawit Bekele',
    branch_name: normalizeBranch(input.branch_name || input.branch || 'Bole Branch'),
    call_status: input.call_status || input.status || 'Sales',
    purpose: input.purpose || 'Inquiry',
    duration_seconds: input.duration_seconds || (input.duration ? Number(input.duration) * 60 : 300),
    customer_type: input.customer_type || 'Old',
    lead_source: input.lead_source || 'Telegram',
    product_id: input.product_id || null,
    product_name: input.product_name || null,
    unlisted_product_name: input.unlisted_product_name || null,
    is_unlisted_product: Boolean(input.is_unlisted_product),
    price_feedback: input.price_feedback || 'accepted',
    remarks: input.remarks || input.notes || input.remark || '',
    is_resolved: input.is_resolved !== false,
    resolution_remarks: input.resolution_remarks || null,
    call_date: input.call_date || new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('communications')
    .insert([payload])
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

export async function recordSale(input: any) {
  const payload = {
    customer_id: input.customer_id || input.customerId,
    customer_name: input.customer_name || input.customerName || null,
    product_id: input.product_id || input.itemId || null,
    product_name: input.product_name || input.itemName || 'Printing Equipment',
    product_code: input.product_code || null,
    branch_name: normalizeBranch(input.branch_name || input.branch || 'Bole Branch'),
    sales_rep_id: input.sales_rep_id || null,
    sales_rep_name: input.sales_rep_name || input.rep || 'Dawit Bekele',
    quantity: Number(input.quantity) || 1,
    unit_price_etb: Number(input.unit_price_etb || input.price || input.itemPrice) || 0,
    sale_amount_etb: Number(input.sale_amount_etb || input.saleAmount || input.amount) || 0,
    fulfillment_type: input.fulfillment_type || input.fulfillmentType || 'pickup',
    delivery_scope: input.delivery_scope || input.deliveryScope || null,
    delivery_channel: input.delivery_channel || input.deliveryChannel || null,
    addis_delivery_type: input.addis_delivery_type || input.addisDeliveryType || null,
    destination_city: input.destination_city || input.destinationCity || 'Addis Ababa',
    sub_city: input.sub_city || input.subCity || null,
    dispatch_hub: input.dispatch_hub || input.dispatchHub || 'Bole Branch',
    vehicle_type: input.vehicle_type || input.vehicleType || null,
    vehicle_plate_number: input.vehicle_plate_number || input.vehiclePlateNumber || input.plate || null,
    driver_name: input.driver_name || input.driverName || null,
    driver_phone: input.driver_phone || input.driverPhone ? cleanPhone(input.driver_phone || input.driverPhone) : null,
    outsourced_provider: input.outsourced_provider || input.outsourcedProvider || null,
    delivery_fee_paid_by: input.delivery_fee_paid_by || input.deliveryFeePaidBy || 'customer',
    regional_carrier: input.regional_carrier || input.regionalCarrier || null,
    waybill_tracking_number: input.waybill_tracking_number || input.waybillTrackingNumber || null,
    cargo_ticket_number: input.cargo_ticket_number || input.ticketNumber || null,
    sale_code: input.sale_code || input.id || null,
    delivery_ticket_code: input.delivery_ticket_code || input.deliveryTicketId || null,
    delivery_ticket_id: input.delivery_ticket_id || input.deliveryTicketId || null,
  };

  const { data, error } = await supabase
    .from('purchases')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ================= FOLLOW-UP REMINDERS =================
export async function getFollowUpReminders() {
  const { data, error } = await supabase
    .from('follow_up_reminders')
    .select('*')
    .order('due_date', { ascending: true });
  if (error) {
    console.error('getFollowUpReminders error:', error);
    throw error;
  }
  return data || [];
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
