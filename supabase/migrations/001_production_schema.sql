-- TTM CRM Production Database Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/oawwdymlmzyngpxwkztl

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. PROFILES & USER ROLES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'branch_manager', 'sales', 'technician')),
  branch_name TEXT DEFAULT 'Bole Branch',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS CATALOG
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Machines', 'Mugs', 'Sublimation Blanks', 'Stamps', 'Papers', 'Accessories')),
  base_price_etb NUMERIC NOT NULL DEFAULT 0,
  total_stock INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMER MASTER DIRECTORY
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_name TEXT,
  phone_number TEXT UNIQUE NOT NULL,
  main_branch TEXT NOT NULL DEFAULT 'Bole Branch',
  streak_branch TEXT,
  consecutive_streak INT DEFAULT 0,
  tin_number TEXT,
  sub_city TEXT DEFAULT 'Addis Ababa',
  business_type TEXT DEFAULT 'Commercial Print Shop',
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Warm', 'Hot')),
  lifetime_spent_etb NUMERIC DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMMUNICATIONS FEED
CREATE SEQUENCE IF NOT EXISTS communication_code_seq START WITH 1;

CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_code TEXT UNIQUE NOT NULL DEFAULT ('TTM-' || LPAD(nextval('communication_code_seq')::TEXT, 5, '0')),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sales_rep_name TEXT NOT NULL,
  branch_name TEXT NOT NULL CHECK (branch_name IN ('Bole Branch', 'Piassa Branch', 'Mexico Branch')),
  call_status TEXT NOT NULL CHECK (call_status IN ('Sales', 'Evaluation', 'Service', 'Out of List', 'Out of Stock', 'Pre-order', 'Complaint')),
  purpose TEXT,
  duration_seconds INT NOT NULL DEFAULT 0,
  customer_type TEXT DEFAULT 'Old' CHECK (customer_type IN ('New', 'Old')),
  lead_source TEXT DEFAULT 'Telegram',
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  unlisted_product_name TEXT,
  is_unlisted_product BOOLEAN DEFAULT FALSE,
  price_feedback TEXT CHECK (price_feedback IN ('accepted', 'too_high', 'competitor_cheaper', 'not_discussed')),
  remarks TEXT,
  is_resolved BOOLEAN DEFAULT TRUE,
  resolution_remarks TEXT,
  call_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CONFIRMED PURCHASES / SALES LEDGER
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  branch_name TEXT NOT NULL CHECK (branch_name IN ('Bole Branch', 'Piassa Branch', 'Mexico Branch')),
  sales_rep_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  sale_amount_etb NUMERIC NOT NULL,
  fulfillment_type TEXT DEFAULT 'pickup' CHECK (fulfillment_type IN ('pickup', 'delivery')),
  delivery_scope TEXT CHECK (delivery_scope IN ('addis_ababa', 'province')),
  addis_delivery_type TEXT CHECK (addis_delivery_type IN ('own_delivery', 'outsourced')),
  regional_carrier TEXT,
  waybill_tracking_number TEXT,
  dispatch_hub TEXT,
  vehicle_type TEXT,
  vehicle_plate_number TEXT,
  driver_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FOLLOW-UP REMINDERS
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_rep_name TEXT NOT NULL,
  title TEXT NOT NULL,
  purpose TEXT,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  reminder_type TEXT DEFAULT 'manual' CHECK (reminder_type IN ('manual', 'after_sales', 'complaint', 'evaluation')),
  completion_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NOTIFICATIONS CENTER
CREATE TABLE IF NOT EXISTS app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_role TEXT DEFAULT 'all',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'system' CHECK (notification_type IN ('system', 'complaint', 'streak_transfer', 'mention', 'after_sales')),
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BRANCH REASSIGNMENT AUDIT TRAIL
CREATE TABLE IF NOT EXISTS branch_reassignment_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  previous_branch TEXT NOT NULL,
  new_branch TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUTOMATED BUSINESS TRIGGERS
-- ============================================================================

-- Trigger A: Update Customer Last Contacted & Lifetime Spent
CREATE OR REPLACE FUNCTION trg_update_customer_stats()
RETURNS TRIGGER AS $$ BEGIN
  IF TG_TABLE_NAME = 'communications' THEN
    UPDATE customers SET last_contacted_at = NEW.call_date WHERE id = NEW.customer_id;
  END IF;
  IF TG_TABLE_NAME = 'purchases' THEN
    UPDATE customers SET lifetime_spent_etb = lifetime_spent_etb + NEW.sale_amount_etb WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_comm_insert ON communications;
CREATE TRIGGER after_comm_insert AFTER INSERT ON communications FOR EACH ROW EXECUTE FUNCTION trg_update_customer_stats();

DROP TRIGGER IF EXISTS after_purchase_insert ON purchases;
CREATE TRIGGER after_purchase_insert AFTER INSERT ON purchases FOR EACH ROW EXECUTE FUNCTION trg_update_customer_stats();

-- Trigger B: Instant Complaint Escalation to Admin
CREATE OR REPLACE FUNCTION trg_escalate_complaint()
RETURNS TRIGGER AS $$ BEGIN
  IF NEW.call_status = 'Complaint' THEN
    INSERT INTO app_notifications (target_role, title, message, notification_type, link)
    VALUES ('admin', 'Urgent Customer Complaint Logged',
      'Complaint from customer logged by ' || NEW.sales_rep_name || ': "' || COALESCE(NEW.purpose, 'No details') || '"',
      'complaint', '/communications');
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_complaint_insert ON communications;
CREATE TRIGGER after_complaint_insert AFTER INSERT ON communications FOR EACH ROW EXECUTE FUNCTION trg_escalate_complaint();

-- Trigger C: Automated 5-Purchase Streak & Branch Reassignment
CREATE OR REPLACE FUNCTION trg_evaluate_branch_streak()
RETURNS TRIGGER AS $$ DECLARE cust RECORD; BEGIN
  SELECT * INTO cust FROM customers WHERE id = NEW.customer_id;
  IF NEW.branch_name = cust.main_branch THEN
    UPDATE customers SET streak_branch = NULL, consecutive_streak = 0 WHERE id = NEW.customer_id;
  ELSE
    IF cust.streak_branch = NEW.branch_name THEN
      IF cust.consecutive_streak + 1 >= 5 THEN
        UPDATE customers SET main_branch = NEW.branch_name, streak_branch = NULL, consecutive_streak = 0 WHERE id = NEW.customer_id;
        INSERT INTO branch_reassignment_audit_logs (customer_id, previous_branch, new_branch, reason)
        VALUES (NEW.customer_id, cust.main_branch, NEW.branch_name, 'Auto-reassigned: 5 consecutive purchases at ' || NEW.branch_name);
        INSERT INTO app_notifications (target_role, title, message, notification_type, link)
        VALUES ('branch_manager', 'Congratulations ' || NEW.branch_name || '!',
          cust.name || ' has officially transferred to ' || NEW.branch_name || ' after 5 consecutive purchases!',
          'streak_transfer', '/customers');
      ELSE
        UPDATE customers SET consecutive_streak = consecutive_streak + 1 WHERE id = NEW.customer_id;
      END IF;
    ELSE
      UPDATE customers SET streak_branch = NEW.branch_name, consecutive_streak = 1 WHERE id = NEW.customer_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_purchase_streak ON purchases;
CREATE TRIGGER after_purchase_streak AFTER INSERT ON purchases FOR EACH ROW EXECUTE FUNCTION trg_evaluate_branch_streak();

-- Trigger D: 30-Day Automated Machine After-Sales Task
CREATE OR REPLACE FUNCTION trg_schedule_after_sales()
RETURNS TRIGGER AS $$ DECLARE prod_cat TEXT; BEGIN
  SELECT category INTO prod_cat FROM products WHERE id = NEW.product_id;
  IF prod_cat = 'Machines' THEN
    INSERT INTO follow_up_reminders (customer_id, assigned_rep_name, title, purpose, due_date, reminder_type)
    VALUES (NEW.customer_id, NEW.sales_rep_name, '30-Day Machine Check-in: ' || NEW.product_name,
      'Check operational temperature, consumable reorders, and customer satisfaction.',
      CURRENT_DATE + INTERVAL '30 days', 'after_sales');
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_machine_purchase ON purchases;
CREATE TRIGGER after_machine_purchase AFTER INSERT ON purchases FOR EACH ROW EXECUTE FUNCTION trg_schedule_after_sales();

-- ============================================================================
-- SEED INITIAL PRODUCT CATALOG
-- ============================================================================
INSERT INTO products (code, name, category, base_price_etb, total_stock) VALUES
('MCH-001', 'Double Mug Press Machine (2-in-1 Dual Station)', 'Machines', 25000, 4),
('MCH-002', 'Epson L805 Sublimation Photo Printer (6-Color WiFi)', 'Machines', 42000, 2),
('MCH-003', 'Flash Stamp Exposure Machine (High Speed)', 'Machines', 19500, 5),
('MCH-004', 'T-Shirt Industrial Flat Heat Press (80x60 cm)', 'Machines', 75000, 2),
('MCH-005', 'T-Shirt Flat Heat Press (40x60 cm)', 'Machines', 38000, 4),
('MCH-006', 'T-Shirt Flat Heat Press (38x30 cm)', 'Machines', 22000, 6),
('MCH-007', 'Vinyl Cutting Plotter 72 cm (Stickers & HTV)', 'Machines', 45000, 3),
('MCH-008', 'Vinyl Cutting Plotter 135 cm (Heavy Duty)', 'Machines', 68000, 1),
('MCH-009', '8-in-1 Multi-Function Combo Heat Press (A4)', 'Machines', 28000, 5),
('MCH-010', 'Sublimation Pen Press Machine (6 Pens Batch)', 'Machines', 16500, 3),
('MCH-011', 'Dedicated Cap Heat Press Machine', 'Machines', 18000, 4),
('MCH-012', '2-in-1 Cap & Label Heat Press Machine', 'Machines', 21000, 3),
('MCH-013', 'Portable Heat Press P1210 (20.3x25.4 cm)', 'Machines', 14500, 5),
('MCH-014', 'Heavy Duty PVC ID & Business Card Die Cutter (55x89mm)', 'Machines', 8500, 6),
('MUG-001', 'Grade AAA White Ceramic Sublimation Mugs (Box of 36)', 'Mugs', 4200, 80),
('MUG-002', 'Magic Color-Changing Ceramic Mug (Heat Sensitive)', 'Mugs', 180, 200),
('MUG-003', 'Inner & Handle Colored Ceramic Mug (Assorted Colors)', 'Mugs', 160, 250),
('MUG-004', 'Aluminum Sports Water Bottle 600ml (White/Silver)', 'Mugs', 240, 150),
('MUG-005', 'Aluminum Sports Water Bottle 350ml', 'Mugs', 210, 120),
('MUG-006', 'Termuz Aluminum Car Travel Tumbler 500ml', 'Mugs', 350, 90),
('MUG-007', 'Vintage Metal Camping Enamel Mug', 'Mugs', 280, 110),
('MUG-008', 'Sublimation Mason Jar with Straw (Frosted Glass)', 'Mugs', 220, 140),
('MUG-009', 'Sublimation Mason Jar with Straw (Clear Glass)', 'Mugs', 200, 130),
('MUG-010', 'Metallic Mirror Sublimation Mug (Silver & Gold)', 'Mugs', 250, 100),
('BLK-001', 'Sublimation Polyester Trucker Caps (Assorted Colors)', 'Sublimation Blanks', 150, 300),
('BLK-002', 'Sublimation Rectangular Metal Keychain in Gift Box', 'Sublimation Blanks', 65, 400),
('BLK-003', 'MDF Wooden Sublimation Keychains (Assorted Shapes)', 'Sublimation Blanks', 45, 500),
('BLK-004', 'MDF Desktop Photo Frame Plaque (17x20 cm)', 'Sublimation Blanks', 220, 120),
('BLK-005', 'Sublimation Jigsaw Puzzle (A4 120 Pieces)', 'Sublimation Blanks', 140, 180),
('BLK-006', 'Non-Slip Fabric Top Rubber Mouse Pad (23x19 cm)', 'Sublimation Blanks', 90, 250),
('BLK-007', 'Magnetic Employee MDF Name Badges (3.8x7.6 cm)', 'Sublimation Blanks', 55, 350),
('STP-001', 'Circular Flash Stamp Mount HB45 (45mm)', 'Stamps', 320, 150),
('STP-002', 'Circular Flash Stamp Mount HB42 (42mm)', 'Stamps', 290, 180),
('STP-003', 'Rectangular Flash Stamp Mount HB 30x60 mm', 'Stamps', 340, 130),
('STP-004', 'Rectangular Flash Stamp Mount HB 30x50 mm', 'Stamps', 310, 160),
('STP-005', 'Rectangular Flash Stamp Mount HB 20x50 mm', 'Stamps', 260, 170),
('STP-006', 'Compact Flash Stamp Mount HY 20x40 mm', 'Stamps', 230, 190),
('STP-007', 'Oval Flash Stamp Mount HB 30x40 mm', 'Stamps', 300, 140),
('STP-008', 'Deskmate Heavy-Duty Self-Inking Round Mount 42mm', 'Stamps', 650, 75),
('PAP-001', 'Dark Transfer Paper TTC (A4 Pack of 50 Sheets)', 'Papers', 2400, 40),
('PAP-002', 'Light Transfer Paper for White Cotton (A4 50 Sheets)', 'Papers', 1850, 45),
('PAP-003', 'High-Release Sublimation Transfer Paper (A4 100 Sheets)', 'Papers', 950, 90),
('ACC-001', 'Replacement Silicone Heat Press Mat (40x60 cm)', 'Accessories', 3500, 15),
('ACC-002', 'Replacement 11oz Mug Heating Element Clamp', 'Accessories', 2800, 25),
('ACC-003', 'Sublimation 6-Color Ink Set (100ml CMYK+LC+LM)', 'Accessories', 3200, 50),
('ACC-004', 'Heat Transfer Vinyl (HTV) Roll 60cm x 10m (PU)', 'Accessories', 3800, 30),
('ACC-005', 'High-Temperature Heat Resistant Tape (10mm Brown)', 'Accessories', 120, 200),
('ACC-006', 'Micro-Porous Flash Stamp Foam Pad (7mm Sheet)', 'Accessories', 450, 80)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  base_price_etb = EXCLUDED.base_price_etb,
  total_stock = EXCLUDED.total_stock,
  is_active = true;

-- Enable RLS with public access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_reassignment_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access products" ON products FOR ALL USING (true);
CREATE POLICY "Public full access customers" ON customers FOR ALL USING (true);
CREATE POLICY "Public full access communications" ON communications FOR ALL USING (true);
CREATE POLICY "Public full access purchases" ON purchases FOR ALL USING (true);
CREATE POLICY "Public full access reminders" ON follow_up_reminders FOR ALL USING (true);
CREATE POLICY "Public full access notifications" ON app_notifications FOR ALL USING (true);
CREATE POLICY "Public full access audit" ON branch_reassignment_audit_logs FOR ALL USING (true);
