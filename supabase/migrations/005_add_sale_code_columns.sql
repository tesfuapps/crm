-- Add friendly ID columns to purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS sale_code TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS delivery_ticket_code TEXT;

-- Backfill existing sales with friendly IDs (will be empty for old sales)
-- New sales from this point will have proper TTM-S/TTM-D codes
