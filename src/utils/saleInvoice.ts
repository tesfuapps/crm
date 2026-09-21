import type { Customer, ProductSale, ProductItem, Branch, User } from '../types/crm';

interface SaleInvoiceParams {
  sale: ProductSale;
  customer: Customer;
  product: ProductItem | undefined;
  branch: Branch | undefined;
  salesRep: User | undefined;
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return 'TTM-SAL-' + y + m + d + '-' + rand;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function generateSaleInvoice(params: SaleInvoiceParams): void {
  const { sale, customer, product, branch, salesRep } = params;
  const invNumber = generateInvoiceNumber();
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const productName = escapeHtml(product ? product.itemName : 'Unknown Product');
  const productCode = escapeHtml(product ? product.itemDescription : '');
  const qty = sale.quantity;
  const unitPrice = qty > 0 ? sale.saleAmount / qty : sale.saleAmount;
  const subtotal = sale.saleAmount;
  const vat = subtotal * 0.15;
  const grandTotal = subtotal + vat;

  const fulfillment = sale.fulfillment_type === 'pickup' ? 'Showroom Pickup'
    : sale.addis_delivery_type === 'own_delivery' ? 'TTM In-House Delivery'
    : sale.addis_delivery_type === 'outsourced' ? `Outsourced (${escapeHtml(sale.outsourced_provider || 'N/A')})`
    : sale.delivery_scope === 'province' ? `Bus Cargo (${escapeHtml(sale.carrier || 'N/A')})`
    : 'N/A';

  let deliveryBlock = '';
  if (sale.fulfillment_type === 'delivery') {
    if (sale.delivery_scope === 'province') {
      deliveryBlock =
        '<div style="background:#fffbeb;padding:12px 16px;border-radius:6px;border:1px solid #fde68a;margin-top:12px;">' +
          '<p style="font-size:11px;font-weight:600;color:#92400e;margin-bottom:6px;">CARGO DISPATCH DETAILS</p>' +
          '<p style="font-size:12px;color:#78350f;">Carrier: ' + escapeHtml(sale.carrier || 'N/A') + ' | Ticket: ' + escapeHtml(sale.ticketNumber || 'N/A') + '</p>' +
          '<p style="font-size:12px;color:#78350f;">Destination: ' + escapeHtml(sale.destinationCity || 'N/A') + '</p>' +
        '</div>';
    } else if (sale.addis_delivery_type === 'own_delivery') {
      deliveryBlock =
        '<div style="background:#eff6ff;padding:12px 16px;border-radius:6px;border:1px solid #bfdbfe;margin-top:12px;">' +
          '<p style="font-size:11px;font-weight:600;color:#1e40af;margin-bottom:6px;">IN-HOUSE DELIVERY</p>' +
          '<p style="font-size:12px;color:#1e3a5f;">Driver: ' + escapeHtml(sale.driver_name || 'N/A') + ' | Phone: ' + escapeHtml(sale.driver_phone || 'N/A') + '</p>' +
          '<p style="font-size:12px;color:#1e3a5f;">Vehicle: ' + escapeHtml(sale.vehicle_plate_number || 'N/A') + '</p>' +
        '</div>';
    } else if (sale.addis_delivery_type === 'outsourced') {
      deliveryBlock =
        '<div style="background:#fef3c7;padding:12px 16px;border-radius:6px;border:1px solid #fcd34d;margin-top:12px;">' +
          '<p style="font-size:11px;font-weight:600;color:#92400e;margin-bottom:6px;">OUTSOURCED DELIVERY</p>' +
          '<p style="font-size:12px;color:#78350f;">Provider: ' + escapeHtml(sale.outsourced_provider || 'N/A') + '</p>' +
          (sale.driver_name ? '<p style="font-size:12px;color:#78350f;">Driver: ' + escapeHtml(sale.driver_name) + ' | Phone: ' + escapeHtml(sale.driver_phone || '') + '</p>' : '') +
          '<p style="font-size:12px;color:#78350f;">Fee: ' + (sale.delivery_fee_paid_by === 'customer' ? 'Paid by Customer' : 'Free (TTM)') + '</p>' +
        '</div>';
    }
  }

  const html =
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" />' +
    '<title>Sale Invoice - ' + invNumber + '</title>' +
    '<style>@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");*{margin:0;padding:0;box-sizing:border-box;}body{font-family:"Inter",sans-serif;background:#fff;color:#1f2937;}@media print{body{margin:0;}}</style>' +
    '</head><body style="padding:40px;max-width:700px;margin:0 auto;">' +

    // Header
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:16px;border-bottom:3px solid #f59e0b;">' +
      '<div><h1 style="font-size:22px;font-weight:700;color:#1f2937;">TTM Printing Solutions</h1>' +
      '<p style="font-size:11px;color:#6b7280;">Addis Ababa, Ethiopia</p></div>' +
      '<div style="text-align:right;"><div style="background:#f59e0b;color:#fff;padding:5px 14px;border-radius:6px;font-size:12px;font-weight:600;display:inline-block;">SALE INVOICE</div>' +
      '<p style="font-size:11px;color:#6b7280;margin-top:6px;"><b>' + invNumber + '</b></p>' +
      '<p style="font-size:11px;color:#6b7280;">' + today + '</p></div>' +
    '</div>' +

    // Customer & Sale Info
    '<div style="display:flex;justify-content:space-between;margin-bottom:24px;gap:16px;">' +
      '<div style="flex:1;background:#f9fafb;padding:14px;border-radius:8px;border:1px solid #e5e7eb;">' +
        '<p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#f59e0b;font-weight:600;margin-bottom:8px;">Customer</p>' +
        '<p style="font-size:14px;font-weight:600;color:#1f2937;">' + escapeHtml(customer.customerName) + '</p>' +
        (customer.companyName ? '<p style="font-size:12px;color:#4b5563;">' + escapeHtml(customer.companyName) + '</p>' : '') +
        '<p style="font-size:12px;color:#4b5563;">' + escapeHtml(customer.phoneNumber) + '</p>' +
      '</div>' +
      '<div style="flex:1;background:#f9fafb;padding:14px;border-radius:8px;border:1px solid #e5e7eb;">' +
        '<p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#f59e0b;font-weight:600;margin-bottom:8px;">Sale Info</p>' +
        '<p style="font-size:12px;color:#4b5563;"><b>Rep:</b> ' + escapeHtml(salesRep ? salesRep.name : 'N/A') + '</p>' +
        '<p style="font-size:12px;color:#4b5563;"><b>Branch:</b> ' + escapeHtml(branch ? branch.name : 'N/A') + '</p>' +
        '<p style="font-size:12px;color:#4b5563;"><b>Fulfillment:</b> ' + fulfillment + '</p>' +
      '</div>' +
    '</div>' +

    // Items Table
    '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">' +
      '<thead><tr style="background:#1f2937;">' +
        '<th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff;text-transform:uppercase;">Product</th>' +
        (productCode ? '<th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff;text-transform:uppercase;">Code</th>' : '') +
        '<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;text-transform:uppercase;">Qty</th>' +
        '<th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#fff;text-transform:uppercase;">Unit Price</th>' +
        '<th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#fff;text-transform:uppercase;">Total</th>' +
      '</tr></thead>' +
      '<tbody><tr>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">' + productName + '</td>' +
        (productCode ? '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;font-family:monospace;">' + productCode + '</td>' : '') +
        '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">' + qty + '</td>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px;">' + formatCurrency(unitPrice) + '</td>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px;font-weight:600;">' + formatCurrency(sale.saleAmount) + '</td>' +
      '</tr></tbody>' +
    '</table>' +

    // Totals
    '<div style="display:flex;justify-content:flex-end;margin-bottom:20px;"><div style="width:260px;">' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb;"><span style="font-size:12px;color:#6b7280;">Subtotal</span><span style="font-size:12px;">ETB ' + formatCurrency(subtotal) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb;"><span style="font-size:12px;color:#6b7280;">VAT (15%)</span><span style="font-size:12px;">ETB ' + formatCurrency(vat) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #f59e0b;margin-top:4px;"><span style="font-size:14px;font-weight:700;">Grand Total</span><span style="font-size:14px;font-weight:700;color:#f59e0b;">ETB ' + formatCurrency(grandTotal) + '</span></div>' +
    '</div></div>' +

    // Delivery Block
    deliveryBlock +

    // Payment Details
    '<div style="background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e5e7eb;margin-top:20px;">' +
      '<p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#f59e0b;font-weight:600;margin-bottom:10px;">Payment Details</p>' +
      '<div style="display:flex;gap:20px;">' +
        '<div><p style="font-size:12px;font-weight:600;">CBE</p><p style="font-size:11px;color:#4b5563;">Acct: 1000123456789</p></div>' +
        '<div><p style="font-size:12px;font-weight:600;">Telebirr</p><p style="font-size:11px;color:#4b5563;">+251 911 000 000</p></div>' +
      '</div>' +
    '</div>' +

    // Footer
    '<div style="text-align:center;padding-top:16px;margin-top:20px;border-top:1px solid #e5e7eb;">' +
      '<p style="font-size:12px;color:#6b7280;">Thank you for your business!</p>' +
      '<p style="font-size:10px;color:#9ca3af;">TTM Printing Solutions</p>' +
    '</div>' +

    '</body></html>';

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  }
}
