-- TTM CRM: Safe migration (handles existing objects)
-- Run this in Supabase SQL Editor

-- Drop existing policies safely
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public full access products" ON products;
  DROP POLICY IF EXISTS "Public full access customers" ON customers;
  DROP POLICY IF EXISTS "Public full access communications" ON communications;
  DROP POLICY IF EXISTS "Public full access purchases" ON purchases;
  DROP POLICY IF EXISTS "Public full access reminders" ON follow_up_reminders;
  DROP POLICY IF EXISTS "Public full access notifications" ON app_notifications;
  DROP POLICY IF EXISTS "Public full access audit" ON branch_reassignment_audit_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create tables if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'branch_manager', 'sales', 'technician')),
  branch_name TEXT DEFAULT 'Bole Branch',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS branch_reassignment_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  previous_branch TEXT NOT NULL,
  new_branch TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate triggers
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

-- Seed products (short names)
INSERT INTO products (code, name, category, base_price_etb, total_stock) VALUES
('MCH-001', 'Double Mug Press', 'Machines', 25000, 4),
('MCH-002', 'Epson L805 Printer', 'Machines', 42000, 2),
('MCH-003', 'Flash Stamp Machine', 'Machines', 19500, 5),
('MCH-004', 'Heat Press A1 (80x60)', 'Machines', 75000, 2),
('MCH-005', 'Heat Press A2 (40x60)', 'Machines', 38000, 4),
('MCH-006', 'Heat Press A3 (38x30)', 'Machines', 22000, 6),
('MCH-007', 'Plotter 72cm', 'Machines', 45000, 3),
('MCH-008', 'Plotter 135cm', 'Machines', 68000, 1),
('MCH-009', '8-in-1 Machine', 'Machines', 28000, 5),
('MCH-010', 'Pen Press', 'Machines', 16500, 3),
('MCH-011', 'Cap Machine', 'Machines', 18000, 4),
('MCH-012', '2-in-1 Machine', 'Machines', 21000, 3),
('MCH-013', 'Portable Heat Press', 'Machines', 14500, 5),
('MCH-014', 'ID Card Cutter', 'Machines', 8500, 6),
('MUG-001', 'White Mug (Box of 36)', 'Mugs', 4200, 80),
('MUG-002', 'Magic Mug', 'Mugs', 180, 200),
('MUG-003', 'Color Mug', 'Mugs', 160, 250),
('MUG-004', 'Water Bottle 600ml', 'Mugs', 240, 150),
('MUG-005', 'Water Bottle 350ml', 'Mugs', 210, 120),
('MUG-006', 'Termuz Mug 500ml', 'Mugs', 350, 90),
('MUG-007', 'Enamel Mug', 'Mugs', 280, 110),
('MUG-008', 'Mason Jar (Frosted)', 'Mugs', 220, 140),
('MUG-009', 'Mason Jar (Clear)', 'Mugs', 200, 130),
('MUG-010', 'Mirror Mug', 'Mugs', 250, 100),
('BLK-001', 'Sublimation Cap', 'Sublimation Blanks', 150, 300),
('BLK-002', 'Metal Keychain', 'Sublimation Blanks', 65, 400),
('BLK-003', 'MDF Keychain', 'Sublimation Blanks', 45, 500),
('BLK-004', 'MDF Photo Frame', 'Sublimation Blanks', 220, 120),
('BLK-005', 'Puzzle A4', 'Sublimation Blanks', 140, 180),
('BLK-006', 'Mouse Pad', 'Sublimation Blanks', 90, 250),
('BLK-007', 'Name Tag / Badge', 'Sublimation Blanks', 55, 350),
('STP-001', 'Stamp HB45', 'Stamps', 320, 150),
('STP-002', 'Stamp HB42', 'Stamps', 290, 180),
('STP-003', 'Stamp HB 30x60', 'Stamps', 340, 130),
('STP-004', 'Stamp HB 30x50', 'Stamps', 310, 160),
('STP-005', 'Deskmate Stamp 42mm', 'Stamps', 650, 75),
('PAP-001', 'Dark Transfer Paper', 'Papers', 2400, 40),
('PAP-002', 'Light Transfer Paper', 'Papers', 1850, 45),
('PAP-003', 'Sublimation Paper', 'Papers', 950, 90),
('ACC-001', 'Silicone Pad 40x60', 'Accessories', 3500, 15),
('ACC-002', 'Mug Mold 11oz', 'Accessories', 2800, 25),
('ACC-003', 'Sublimation Ink 100ml', 'Accessories', 3200, 50),
('ACC-004', 'HTV Vinyl Roll', 'Accessories', 3800, 30),
('ACC-005', 'Thermal Tape', 'Accessories', 120, 200),
('ACC-006', 'Stamp Foam 7mm', 'Accessories', 450, 80)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  base_price_etb = EXCLUDED.base_price_etb,
  total_stock = EXCLUDED.total_stock,
  is_active = true;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_reassignment_audit_logs ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Public full access products" ON products FOR ALL USING (true);
CREATE POLICY "Public full access customers" ON customers FOR ALL USING (true);
CREATE POLICY "Public full access communications" ON communications FOR ALL USING (true);
CREATE POLICY "Public full access purchases" ON purchases FOR ALL USING (true);
CREATE POLICY "Public full access reminders" ON follow_up_reminders FOR ALL USING (true);
CREATE POLICY "Public full access notifications" ON app_notifications FOR ALL USING (true);
CREATE POLICY "Public full access audit" ON branch_reassignment_audit_logs FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE communications;
ALTER PUBLICATION supabase_realtime ADD TABLE purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE app_notifications;
