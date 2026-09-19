import type { Customer, ProductSale, ProductItem, Branch, User } from '../types/crm';

interface ProformaInvoiceParams {
  customer: Customer;
  sales: ProductSale[];
  products: ProductItem[];
  branches: Branch[];
  users: User[];
  invoiceNumber?: string;
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return 'TTM-INV-' + y + m + d + '-' + rand;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateProformaInvoice(params: ProformaInvoiceParams): void {
  const { customer, sales, products, branches, users, invoiceNumber } = params;

  const invNumber = invoiceNumber || generateInvoiceNumber();
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const branch = branches.find(function (b) { return b.id === customer.branchId; });
  const salesRep = users.find(function (u) { return u.id === customer.assignedUserId; });

  const customerName = escapeHtml(customer.customerName);
  const companyName = escapeHtml(customer.companyName || '');
  const phoneNumber = escapeHtml(customer.phoneNumber);
  const tinNumber = escapeHtml(customer.tinNumber || 'N/A');
  const subCity = escapeHtml(customer.subCity || 'N/A');
  const branchName = escapeHtml(branch ? branch.name : 'N/A');
  const salesRepName = escapeHtml(salesRep ? salesRep.name : 'N/A');

  const confirmedSales = sales.filter(function (s) { return s.status !== 'cancelled'; });

  let subtotal = 0;
  const rows: string[] = [];

  confirmedSales.forEach(function (sale) {
    const product = products.find(function (p) { return p.id === sale.itemId; });
    const productName = escapeHtml(product ? product.itemName : 'Unknown Product');
    const qty = sale.quantity;
    const unitPrice = sale.saleAmount / qty;
    const lineTotal = sale.saleAmount;
    subtotal += lineTotal;

    rows.push(
      '<tr>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#1f2937;">' + productName + '</td>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#1f2937;">' + qty + '</td>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#1f2937;">' + formatCurrency(unitPrice) + '</td>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#1f2937;font-weight:600;">' + formatCurrency(lineTotal) + '</td>' +
      '</tr>'
    );
  });

  const vat = subtotal * 0.15;
  const grandTotal = subtotal + vat;

  const html = '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
      '<meta charset="UTF-8" />' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
      '<title>Proforma Invoice - ' + invNumber + '</title>' +
      '<style>' +
        '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");' +
        '* { margin: 0; padding: 0; box-sizing: border-box; }' +
        'body { font-family: "Inter", sans-serif; background: #fff; color: #1f2937; }' +
        '@media print { body { margin: 0; } }' +
      '</style>' +
    '</head>' +
    '<body style="padding:40px;max-width:800px;margin:0 auto;">' +

      '<!-- Header -->' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #f59e0b;">' +
        '<div>' +
          '<h1 style="font-size:26px;font-weight:700;color:#1f2937;margin-bottom:4px;">TTM Printing Solutions</h1>' +
          '<p style="font-size:12px;color:#6b7280;">Addis Ababa, Ethiopia</p>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="background:#f59e0b;color:#fff;padding:6px 16px;border-radius:6px;font-size:13px;font-weight:600;display:inline-block;margin-bottom:8px;">PROFORMA INVOICE</div>' +
          '<p style="font-size:12px;color:#6b7280;margin-top:6px;"><strong style="color:#1f2937;">Invoice:</strong> ' + invNumber + '</p>' +
          '<p style="font-size:12px;color:#6b7280;"><strong style="color:#1f2937;">Date:</strong> ' + today + '</p>' +
        '</div>' +
      '</div>' +

      '<!-- Bill To & Sales Info -->' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:32px;gap:24px;">' +
        '<div style="flex:1;background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">' +
          '<h3 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#f59e0b;font-weight:600;margin-bottom:10px;">Bill To</h3>' +
          '<p style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:4px;">' + customerName + '</p>' +
          (companyName ? '<p style="font-size:13px;color:#4b5563;margin-bottom:4px;">' + companyName + '</p>' : '') +
          '<p style="font-size:13px;color:#4b5563;margin-bottom:4px;">Phone: ' + phoneNumber + '</p>' +
          '<p style="font-size:13px;color:#4b5563;margin-bottom:4px;">TIN: ' + tinNumber + '</p>' +
          '<p style="font-size:13px;color:#4b5563;">Sub-City: ' + subCity + '</p>' +
        '</div>' +
        '<div style="flex:1;background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">' +
          '<h3 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#f59e0b;font-weight:600;margin-bottom:10px;">Sales Information</h3>' +
          '<p style="font-size:13px;color:#4b5563;margin-bottom:4px;"><strong style="color:#1f2937;">Sales Rep:</strong> ' + salesRepName + '</p>' +
          '<p style="font-size:13px;color:#4b5563;margin-bottom:4px;"><strong style="color:#1f2937;">Branch:</strong> ' + branchName + '</p>' +
          '<p style="font-size:13px;color:#4b5563;"><strong style="color:#1f2937;">Date:</strong> ' + today + '</p>' +
        '</div>' +
      '</div>' +

      '<!-- Items Table -->' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">' +
        '<thead>' +
          '<tr style="background:#1f2937;">' +
            '<th style="padding:12px 12px;text-align:left;font-size:12px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.5px;">Product Name</th>' +
            '<th style="padding:12px 12px;text-align:center;font-size:12px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>' +
            '<th style="padding:12px 12px;text-align:right;font-size:12px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.5px;">Unit Price (ETB)</th>' +
            '<th style="padding:12px 12px;text-align:right;font-size:12px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.5px;">Total (ETB)</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          rows.join('') +
        '</tbody>' +
      '</table>' +

      '<!-- Totals -->' +
      '<div style="display:flex;justify-content:flex-end;margin-bottom:32px;">' +
        '<div style="width:300px;">' +
          '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;">' +
            '<span style="font-size:13px;color:#6b7280;">Subtotal</span>' +
            '<span style="font-size:13px;color:#1f2937;">ETB ' + formatCurrency(subtotal) + '</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;">' +
            '<span style="font-size:13px;color:#6b7280;">VAT (15%)</span>' +
            '<span style="font-size:13px;color:#1f2937;">ETB ' + formatCurrency(vat) + '</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid #f59e0b;margin-top:4px;">' +
            '<span style="font-size:15px;font-weight:700;color:#1f2937;">Grand Total</span>' +
            '<span style="font-size:15px;font-weight:700;color:#f59e0b;">ETB ' + formatCurrency(grandTotal) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Payment Details -->' +
      '<div style="background:#f9fafb;padding:20px;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">' +
        '<h3 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#f59e0b;font-weight:600;margin-bottom:12px;">Payment Details</h3>' +
        '<div style="display:flex;gap:24px;">' +
          '<div style="flex:1;">' +
            '<p style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:4px;">Commercial Bank of Ethiopia (CBE)</p>' +
            '<p style="font-size:12px;color:#4b5563;margin-bottom:2px;">Account Name: TTM Printing Solutions</p>' +
            '<p style="font-size:12px;color:#4b5563;">Account No: 1000123456789</p>' +
          '</div>' +
          '<div style="flex:1;">' +
            '<p style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:4px;">Telebirr</p>' +
            '<p style="font-size:12px;color:#4b5563;margin-bottom:2px;">Account Name: TTM Printing Solutions</p>' +
            '<p style="font-size:12px;color:#4b5563;">Phone: +251 911 000 000</p>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Footer -->' +
      '<div style="text-align:center;padding-top:20px;border-top:1px solid #e5e7eb;">' +
        '<p style="font-size:13px;color:#6b7280;margin-bottom:4px;">Thank you for your business!</p>' +
        '<p style="font-size:11px;color:#9ca3af;">TTM Printing Solutions &mdash; Addis Ababa, Ethiopia</p>' +
      '</div>' +

    '</body>' +
    '</html>';

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(function () {
      printWindow.print();
    }, 500);
  }
}
