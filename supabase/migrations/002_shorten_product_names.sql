-- Product Name Shortening Update
-- Run in Supabase SQL Editor after initial migration
-- This updates all product names to clean, short trade names

-- Machines
UPDATE products SET name = 'Double Mug Press' WHERE code = 'MCH-001';
UPDATE products SET name = 'Epson L805 Printer' WHERE code = 'MCH-002';
UPDATE products SET name = 'Flash Stamp Machine' WHERE code = 'MCH-003';
UPDATE products SET name = 'Heat Press A1 (80x60)' WHERE code = 'MCH-004';
UPDATE products SET name = 'Heat Press A2 (40x60)' WHERE code = 'MCH-005';
UPDATE products SET name = 'Heat Press A3 (38x30)' WHERE code = 'MCH-006';
UPDATE products SET name = 'Plotter 72cm' WHERE code = 'MCH-007';
UPDATE products SET name = 'Plotter 135cm' WHERE code = 'MCH-008';
UPDATE products SET name = '8-in-1 Machine' WHERE code = 'MCH-009';
UPDATE products SET name = 'Pen Press' WHERE code = 'MCH-010';
UPDATE products SET name = 'Cap Machine' WHERE code = 'MCH-011';
UPDATE products SET name = '2-in-1 Machine' WHERE code = 'MCH-012';
UPDATE products SET name = 'Portable Heat Press' WHERE code = 'MCH-013';
UPDATE products SET name = 'ID Card Cutter' WHERE code = 'MCH-014';

-- Mugs
UPDATE products SET name = 'White Mug (Box of 36)' WHERE code = 'MUG-001';
UPDATE products SET name = 'Magic Mug' WHERE code = 'MUG-002';
UPDATE products SET name = 'Color Mug' WHERE code = 'MUG-003';
UPDATE products SET name = 'Water Bottle 600ml' WHERE code = 'MUG-004';
UPDATE products SET name = 'Water Bottle 350ml' WHERE code = 'MUG-005';
UPDATE products SET name = 'Termuz Mug 500ml' WHERE code = 'MUG-006';
UPDATE products SET name = 'Enamel Mug' WHERE code = 'MUG-007';
UPDATE products SET name = 'Mason Jar (Frosted)' WHERE code = 'MUG-008';
UPDATE products SET name = 'Mason Jar (Clear)' WHERE code = 'MUG-009';
UPDATE products SET name = 'Mirror Mug' WHERE code = 'MUG-010';

-- Sublimation Blanks
UPDATE products SET name = 'Sublimation Cap' WHERE code = 'BLK-001';
UPDATE products SET name = 'Metal Keychain' WHERE code = 'BLK-002';
UPDATE products SET name = 'MDF Keychain' WHERE code = 'BLK-003';
UPDATE products SET name = 'MDF Photo Frame' WHERE code = 'BLK-004';
UPDATE products SET name = 'Puzzle A4' WHERE code = 'BLK-005';
UPDATE products SET name = 'Mouse Pad' WHERE code = 'BLK-006';
UPDATE products SET name = 'Name Tag / Badge' WHERE code = 'BLK-007';

-- Stamps
UPDATE products SET name = 'Stamp HB45' WHERE code = 'STP-001';
UPDATE products SET name = 'Stamp HB42' WHERE code = 'STP-002';
UPDATE products SET name = 'Stamp HB 30x60' WHERE code = 'STP-003';
UPDATE products SET name = 'Stamp HB 30x50' WHERE code = 'STP-004';
UPDATE products SET name = 'Deskmate Stamp 42mm' WHERE code = 'STP-005';

-- Papers
UPDATE products SET name = 'Dark Transfer Paper' WHERE code = 'PAP-001';
UPDATE products SET name = 'Light Transfer Paper' WHERE code = 'PAP-002';
UPDATE products SET name = 'Sublimation Paper' WHERE code = 'PAP-003';

-- Accessories
UPDATE products SET name = 'Silicone Pad 40x60' WHERE code = 'ACC-001';
UPDATE products SET name = 'Mug Mold 11oz' WHERE code = 'ACC-002';
UPDATE products SET name = 'Sublimation Ink 100ml' WHERE code = 'ACC-003';
UPDATE products SET name = 'HTV Vinyl Roll' WHERE code = 'ACC-004';
UPDATE products SET name = 'Thermal Tape' WHERE code = 'ACC-005';
UPDATE products SET name = 'Stamp Foam 7mm' WHERE code = 'ACC-006';
