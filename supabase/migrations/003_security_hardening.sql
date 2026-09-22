-- TTM CRM Security Hardening & Performance Migration
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/oawwdymlmzyngpxwkztl

-- ============================================================================
-- 1. PERFORMANCE INDEXES
-- ============================================================================

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(main_branch);
CREATE INDEX IF NOT EXISTS idx_customers_priority ON customers(priority);
CREATE INDEX IF NOT EXISTS idx_customers_last_contacted ON customers(last_contacted_at DESC NULLS LAST);

-- Communications
CREATE INDEX IF NOT EXISTS idx_communications_customer ON communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_communications_rep ON communications(sales_rep_name);
CREATE INDEX IF NOT EXISTS idx_communications_date ON communications(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(call_status);
CREATE INDEX IF NOT EXISTS idx_communications_product ON communications(product_id);

-- Purchases
CREATE INDEX IF NOT EXISTS idx_purchases_customer ON purchases(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_rep ON purchases(sales_rep_name);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);

-- Follow-up reminders
CREATE INDEX IF NOT EXISTS idx_reminders_customer ON follow_up_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON follow_up_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON follow_up_reminders(status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_read ON app_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON app_notifications(created_at DESC);

-- ============================================================================
-- 2. FIX CASCADING DELETES → SET NULL (preserve financial/call history)
-- ============================================================================

-- Drop old constraints
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_customer_id_fkey;
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_customer_id_fkey;
ALTER TABLE follow_up_reminders DROP CONSTRAINT IF EXISTS follow_up_reminders_customer_id_fkey;
ALTER TABLE branch_reassignment_audit_logs DROP CONSTRAINT IF EXISTS branch_reassignment_audit_logs_customer_id_fkey;

-- Re-add with SET NULL instead of CASCADE
ALTER TABLE communications ADD CONSTRAINT communications_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE purchases ADD CONSTRAINT purchases_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE follow_up_reminders ADD CONSTRAINT follow_up_reminders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE branch_reassignment_audit_logs ADD CONSTRAINT branch_reassignment_audit_logs_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Make customer_id nullable in child tables (required for SET NULL to work)
ALTER TABLE communications ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE purchases ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE follow_up_reminders ALTER COLUMN customer_id DROP NOT NULL;

-- ============================================================================
-- 3. ADD DELIVERY TICKET ID TO PURCHASES
-- ============================================================================

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS delivery_ticket_id TEXT;

-- ============================================================================
-- 4. RESTRICTED RLS POLICIES (service-role only, deny anonymous)
-- ============================================================================

-- Drop permissive public policies
DROP POLICY IF EXISTS "Public full access products" ON products;
DROP POLICY IF EXISTS "Public full access customers" ON customers;
DROP POLICY IF EXISTS "Public full access communications" ON communications;
DROP POLICY IF EXISTS "Public full access purchases" ON purchases;
DROP POLICY IF EXISTS "Public full access reminders" ON follow_up_reminders;
DROP POLICY IF EXISTS "Public full access notifications" ON app_notifications;
DROP POLICY IF EXISTS "Public full access audit" ON branch_reassignment_audit_logs;

-- Allow authenticated users full access
CREATE POLICY "Authenticated full access products" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access customers" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access communications" ON communications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access purchases" ON purchases FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access reminders" ON follow_up_reminders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access notifications" ON app_notifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access audit" ON branch_reassignment_audit_logs FOR ALL USING (auth.role() = 'authenticated');

-- Allow service_role full access (bypasses RLS but explicit for clarity)
CREATE POLICY "Service role full access products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access customers" ON customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access communications" ON communications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access purchases" ON purchases FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access reminders" ON follow_up_reminders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access notifications" ON app_notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access audit" ON branch_reassignment_audit_logs FOR ALL USING (auth.role() = 'service_role');

-- Also allow anon for now (until auth is added) — REMOVE WHEN AUTH IS IMPLEMENTED
CREATE POLICY "Anon access products" ON products FOR ALL USING (true);
CREATE POLICY "Anon access customers" ON customers FOR ALL USING (true);
CREATE POLICY "Anon access communications" ON communications FOR ALL USING (true);
CREATE POLICY "Anon access purchases" ON purchases FOR ALL USING (true);
CREATE POLICY "Anon access reminders" ON follow_up_reminders FOR ALL USING (true);
CREATE POLICY "Anon access notifications" ON app_notifications FOR ALL USING (true);
CREATE POLICY "Anon access audit" ON branch_reassignment_audit_logs FOR ALL USING (true);

-- ============================================================================
-- 5. AUDIT TRAIL INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_customer ON branch_reassignment_audit_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON branch_reassignment_audit_logs(created_at DESC);
