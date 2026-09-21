import { ProductItem } from '../types/crm';

export const OFFICIAL_TTM_CATALOG: ProductItem[] = [
  // ═══════════════════════════════════════════════════════════
  // 1. MACHINES (14 items)
  // ═══════════════════════════════════════════════════════════
  { id: 'mch-001', itemName: 'Double Mug Press', itemDescription: 'MCH-001 | Dual station mug heat press', itemCategory: 'Machines', itemPrice: 25000, stockQuantity: 4 },
  { id: 'mch-002', itemName: 'Epson L805 Printer', itemDescription: 'MCH-002 | 6-color sublimation printer WiFi', itemCategory: 'Machines', itemPrice: 42000, stockQuantity: 2 },
  { id: 'mch-003', itemName: 'Flash Stamp Machine', itemDescription: 'MCH-003 | High-speed flash stamp maker', itemCategory: 'Machines', itemPrice: 19500, stockQuantity: 5 },
  { id: 'mch-004', itemName: 'Heat Press A1 (80x60)', itemDescription: 'MCH-004 | Large format industrial heat press', itemCategory: 'Machines', itemPrice: 75000, stockQuantity: 2 },
  { id: 'mch-005', itemName: 'Heat Press A2 (40x60)', itemDescription: 'MCH-005 | Medium format flat heat press', itemCategory: 'Machines', itemPrice: 38000, stockQuantity: 4 },
  { id: 'mch-006', itemName: 'Heat Press A3 (38x30)', itemDescription: 'MCH-006 | Compact flat heat press', itemCategory: 'Machines', itemPrice: 22000, stockQuantity: 6 },
  { id: 'mch-007', itemName: 'Plotter 72cm', itemDescription: 'MCH-007 | Vinyl cutter for stickers & HTV', itemCategory: 'Machines', itemPrice: 45000, stockQuantity: 3 },
  { id: 'mch-008', itemName: 'Plotter 135cm', itemDescription: 'MCH-008 | Wide format heavy duty plotter', itemCategory: 'Machines', itemPrice: 68000, stockQuantity: 1 },
  { id: 'mch-009', itemName: '8-in-1 Machine', itemDescription: 'MCH-009 | Multi-function combo heat press', itemCategory: 'Machines', itemPrice: 28000, stockQuantity: 5 },
  { id: 'mch-010', itemName: 'Pen Press', itemDescription: 'MCH-010 | 6-pen batch sublimation press', itemCategory: 'Machines', itemPrice: 16500, stockQuantity: 3 },
  { id: 'mch-011', itemName: 'Cap Machine', itemDescription: 'MCH-011 | Curved platen cap heat press', itemCategory: 'Machines', itemPrice: 18000, stockQuantity: 4 },
  { id: 'mch-012', itemName: '2-in-1 Machine', itemDescription: 'MCH-012 | Cap & label dual press', itemCategory: 'Machines', itemPrice: 21000, stockQuantity: 3 },
  { id: 'mch-013', itemName: 'Portable Heat Press', itemDescription: 'MCH-013 | Lightweight portable press', itemCategory: 'Machines', itemPrice: 14500, stockQuantity: 5 },
  { id: 'mch-014', itemName: 'ID Card Cutter', itemDescription: 'MCH-014 | PVC ID & business card die cutter', itemCategory: 'Machines', itemPrice: 8500, stockQuantity: 6 },

  // ═══════════════════════════════════════════════════════════
  // 2. MUGS & DRINKWARE (14 items)
  // ═══════════════════════════════════════════════════════════
  { id: 'mug-001', itemName: 'White Mug (Box of 36)', itemDescription: 'MUG-001 | Grade AAA sublimation ceramic mugs', itemCategory: 'Mugs', itemPrice: 4200, stockQuantity: 80 },
  { id: 'mug-002', itemName: 'Magic Mug', itemDescription: 'MUG-002 | Color-changing heat sensitive mug', itemCategory: 'Mugs', itemPrice: 180, stockQuantity: 200 },
  { id: 'mug-003', itemName: 'Color Mug', itemDescription: 'MUG-003 | Colored interior & handle mug', itemCategory: 'Mugs', itemPrice: 160, stockQuantity: 250 },
  { id: 'mug-004', itemName: 'Water Bottle 600ml', itemDescription: 'MUG-004 | Aluminum sports bottle 600ml', itemCategory: 'Mugs', itemPrice: 240, stockQuantity: 150 },
  { id: 'mug-005', itemName: 'Water Bottle 350ml', itemDescription: 'MUG-005 | Compact aluminum sports bottle', itemCategory: 'Mugs', itemPrice: 210, stockQuantity: 120 },
  { id: 'mug-006', itemName: 'Termuz Mug 500ml', itemDescription: 'MUG-006 | Aluminum car travel tumbler', itemCategory: 'Mugs', itemPrice: 350, stockQuantity: 90 },
  { id: 'mug-007', itemName: 'Enamel Mug', itemDescription: 'MUG-007 | Vintage metal camping mug', itemCategory: 'Mugs', itemPrice: 280, stockQuantity: 110 },
  { id: 'mug-008', itemName: 'Mason Jar (Frosted)', itemDescription: 'MUG-008 | Frosted glass mason jar with straw', itemCategory: 'Mugs', itemPrice: 220, stockQuantity: 140 },
  { id: 'mug-009', itemName: 'Mason Jar (Clear)', itemDescription: 'MUG-009 | Clear glass mason jar with straw', itemCategory: 'Mugs', itemPrice: 200, stockQuantity: 130 },
  { id: 'mug-010', itemName: 'Mirror Mug', itemDescription: 'MUG-010 | Metallic silver & gold mirror mug', itemCategory: 'Mugs', itemPrice: 250, stockQuantity: 100 },
  { id: 'mug-011', itemName: 'Copper Mug', itemDescription: 'MUG-011 | Copper metallic ceramic mug', itemCategory: 'Mugs', itemPrice: 260, stockQuantity: 80 },
  { id: 'mug-012', itemName: 'Black Frame Mug', itemDescription: 'MUG-012 | Black exterior frame ceramic mug', itemCategory: 'Mugs', itemPrice: 190, stockQuantity: 140 },
  { id: 'mug-013', itemName: 'Latte Mug V-Shape', itemDescription: 'MUG-013 | Modern V-shape conical latte mug', itemCategory: 'Mugs', itemPrice: 210, stockQuantity: 110 },
  { id: 'mug-014', itemName: 'Kids Water Bottle', itemDescription: 'MUG-014 | Child-safe school water bottle', itemCategory: 'Mugs', itemPrice: 220, stockQuantity: 130 },

  // ═══════════════════════════════════════════════════════════
  // 3. SUBLIMATION BLANKS (12 items)
  // ═══════════════════════════════════════════════════════════
  { id: 'blk-001', itemName: 'Sublimation Cap', itemDescription: 'BLK-001 | Polyester trucker cap', itemCategory: 'Sublimation Blanks', itemPrice: 150, stockQuantity: 300 },
  { id: 'blk-002', itemName: 'Metal Keychain', itemDescription: 'BLK-002 | Rectangular aluminum keychain', itemCategory: 'Sublimation Blanks', itemPrice: 65, stockQuantity: 400 },
  { id: 'blk-003', itemName: 'MDF Keychain', itemDescription: 'BLK-003 | Wooden keychain assorted shapes', itemCategory: 'Sublimation Blanks', itemPrice: 45, stockQuantity: 500 },
  { id: 'blk-004', itemName: 'MDF Photo Frame', itemDescription: 'BLK-004 | Desktop photo frame plaque', itemCategory: 'Sublimation Blanks', itemPrice: 220, stockQuantity: 120 },
  { id: 'blk-005', itemName: 'Puzzle A4', itemDescription: 'BLK-005 | 120-piece jigsaw puzzle', itemCategory: 'Sublimation Blanks', itemPrice: 140, stockQuantity: 180 },
  { id: 'blk-006', itemName: 'Mouse Pad', itemDescription: 'BLK-006 | Non-slip fabric rubber mouse pad', itemCategory: 'Sublimation Blanks', itemPrice: 90, stockQuantity: 250 },
  { id: 'blk-007', itemName: 'Name Tag / Badge', itemDescription: 'BLK-007 | Magnetic MDF name badge', itemCategory: 'Sublimation Blanks', itemPrice: 55, stockQuantity: 350 },
  { id: 'blk-008', itemName: 'Door Hanger', itemDescription: 'BLK-008 | Double-sided hotel door hanger', itemCategory: 'Sublimation Blanks', itemPrice: 85, stockQuantity: 200 },
  { id: 'blk-009', itemName: 'Ballpoint Pens (50)', itemDescription: 'BLK-009 | Sublimation ballpoint pen pack', itemCategory: 'Sublimation Blanks', itemPrice: 450, stockQuantity: 100 },
  { id: 'blk-010', itemName: 'Drink Coaster', itemDescription: 'BLK-010 | Square absorbent coaster', itemCategory: 'Sublimation Blanks', itemPrice: 50, stockQuantity: 300 },
  { id: 'blk-011', itemName: 'Tote Bag', itemDescription: 'BLK-011 | Reusable shopping tote bag', itemCategory: 'Sublimation Blanks', itemPrice: 120, stockQuantity: 250 },
  { id: 'blk-012', itemName: 'Photo Album Book', itemDescription: 'BLK-012 | Hardcover photo album', itemCategory: 'Sublimation Blanks', itemPrice: 350, stockQuantity: 80 },

  // ═══════════════════════════════════════════════════════════
  // 4. STAMPS & MOUNTS (8 items)
  // ═══════════════════════════════════════════════════════════
  { id: 'stp-001', itemName: 'Stamp HB45', itemDescription: 'STP-001 | Circular flash stamp 45mm', itemCategory: 'Stamps', itemPrice: 320, stockQuantity: 150 },
  { id: 'stp-002', itemName: 'Stamp HB42', itemDescription: 'STP-002 | Circular flash stamp 42mm', itemCategory: 'Stamps', itemPrice: 290, stockQuantity: 180 },
  { id: 'stp-003', itemName: 'Stamp HB 30x60', itemDescription: 'STP-003 | Rectangular flash stamp 30x60mm', itemCategory: 'Stamps', itemPrice: 340, stockQuantity: 130 },
  { id: 'stp-004', itemName: 'Stamp HB 30x50', itemDescription: 'STP-004 | Rectangular flash stamp 30x50mm', itemCategory: 'Stamps', itemPrice: 310, stockQuantity: 160 },
  { id: 'stp-005', itemName: 'Stamp HB 20x50', itemDescription: 'STP-005 | Rectangular flash stamp 20x50mm', itemCategory: 'Stamps', itemPrice: 260, stockQuantity: 170 },
  { id: 'stp-006', itemName: 'Stamp HY 20x40', itemDescription: 'STP-006 | Compact flash stamp 20x40mm', itemCategory: 'Stamps', itemPrice: 230, stockQuantity: 190 },
  { id: 'stp-007', itemName: 'Stamp HB 30x40', itemDescription: 'STP-007 | Oval flash stamp 30x40mm', itemCategory: 'Stamps', itemPrice: 300, stockQuantity: 140 },
  { id: 'stp-008', itemName: 'Deskmate Stamp 42mm', itemDescription: 'STP-008 | Self-inking desk stamp', itemCategory: 'Stamps', itemPrice: 650, stockQuantity: 75 },

  // ═══════════════════════════════════════════════════════════
  // 5. PAPERS & FILMS (3 items)
  // ═══════════════════════════════════════════════════════════
  { id: 'pap-001', itemName: 'Dark Transfer Paper', itemDescription: 'PAP-001 | TTC dark fabric transfer A4/50', itemCategory: 'Papers', itemPrice: 2400, stockQuantity: 40 },
  { id: 'pap-002', itemName: 'Light Transfer Paper', itemDescription: 'PAP-002 | Light cotton transfer A4/50', itemCategory: 'Papers', itemPrice: 1850, stockQuantity: 45 },
  { id: 'pap-003', itemName: 'Sublimation Paper', itemDescription: 'PAP-003 | High-release sublimation A4/100', itemCategory: 'Papers', itemPrice: 950, stockQuantity: 90 },

  // ═══════════════════════════════════════════════════════════
  // 6. ACCESSORIES & CONSUMABLES (10 items)
  // ═══════════════════════════════════════════════════════════
  { id: 'acc-001', itemName: 'Silicone Pad 40x60', itemDescription: 'ACC-001 | Replacement silicone heat mat', itemCategory: 'Accessories', itemPrice: 3500, stockQuantity: 15 },
  { id: 'acc-002', itemName: 'Mug Mold 11oz', itemDescription: 'ACC-002 | Replacement mug heating element', itemCategory: 'Accessories', itemPrice: 2800, stockQuantity: 25 },
  { id: 'acc-003', itemName: 'Sublimation Ink 100ml', itemDescription: 'ACC-003 | 6-color ink set CMYK+LC+LM', itemCategory: 'Accessories', itemPrice: 3200, stockQuantity: 50 },
  { id: 'acc-004', itemName: 'HTV Vinyl Roll', itemDescription: 'ACC-004 | PU vinyl 60cm x 10m', itemCategory: 'Accessories', itemPrice: 3800, stockQuantity: 30 },
  { id: 'acc-005', itemName: 'Thermal Tape', itemDescription: 'ACC-005 | Heat-resistant tape 10mm', itemCategory: 'Accessories', itemPrice: 120, stockQuantity: 200 },
  { id: 'acc-006', itemName: 'Stamp Foam 7mm', itemDescription: 'ACC-006 | Flash stamp foam pad', itemCategory: 'Accessories', itemPrice: 450, stockQuantity: 80 },
  { id: 'acc-007', itemName: 'Thermal Gloves', itemDescription: 'ACC-007 | Heat-resistant gloves pair', itemCategory: 'Accessories', itemPrice: 650, stockQuantity: 60 },
  { id: 'acc-008', itemName: 'Mug Gift Boxes (36)', itemDescription: 'ACC-008 | Single mug retail gift boxes', itemCategory: 'Accessories', itemPrice: 750, stockQuantity: 120 },
  { id: 'acc-009', itemName: 'Rolling Caddie Stand', itemDescription: 'ACC-009 | Mobile stand for heat press', itemCategory: 'Accessories', itemPrice: 6500, stockQuantity: 8 },
  { id: 'acc-010', itemName: 'Scalpel Knife', itemDescription: 'ACC-010 | Precision knife with spare blades', itemCategory: 'Accessories', itemPrice: 350, stockQuantity: 100 },
];
