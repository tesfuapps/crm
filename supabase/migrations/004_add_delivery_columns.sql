-- Add missing delivery detail columns to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS delivery_channel TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS outsourced_provider TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS destination_city TEXT;
