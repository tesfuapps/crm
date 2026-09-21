import React, { useState, useMemo } from 'react';
import { ProductSale, Customer, ProductItem, Branch, User } from '../types/crm';
import { Package, Filter, Calendar, Download, Printer, Copy, Search, ExternalLink, Truck, CheckCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateSaleInvoice } from '../utils/saleInvoice';

interface SalesViewProps {
  sales: ProductSale[];
  products: ProductItem[];
  customers: Customer[];
  branches: Branch[];
  users: User[];
  theme: string;
  setActiveTab: (tab: string) => void;
  onSelectCustomer: (customer: Customer) => void;
}

const statusBadge = (s?: string) => {
  if (s === 'cancelled') return 'bg-red-500/20 text-red-400 border-red-700/40';
  return 'bg-emerald-500/20 text-emerald-400 border-emerald-700/40';
};

const fulfillmentBadge = (f?: string) => {
  if (f === 'pickup') return 'bg-sky-500/20 text-sky-400 border-sky-700/40';
  return 'bg-amber-500/20 text-amber-400 border-amber-700/40';
};

export const SalesView: React.FC<SalesViewProps> = ({ sales, products, customers, branches, users, theme, setActiveTab, onSelectCustomer }) => {
  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#141414] border-zinc-800/60' : 'bg-white border-slate-200';
  const cardText = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-zinc-400' : 'text-slate-500';
  const borderSub = isDark ? 'border-zinc-800/60' : 'border-slate-200';
  const inputBg = isDark ? 'bg-[#121212] border-zinc-700 text-white focus:ring-amber-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-amber-500';
  const secBtn = isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200';

  const [filterPeriod, setFilterPeriod] = useState('All-Time');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSaleId, setCopiedSaleId] = useState<string | null>(null);

  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(s => {
      const d = new Date(s.saleDate);
      if (filterPeriod === 'Today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (d < today) return false;
      } else if (filterPeriod === 'This Week') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        if (d < weekStart) return false;
      } else if (filterPeriod === 'This Month') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (filterPeriod === 'Custom Range' && customFrom && customTo) {
        const from = new Date(customFrom);
        const to = new Date(customTo);
        if (d < from || d > to) return false;
      }
      if (searchTerm) {
        const cust = customers.find(c => c.id === s.customerId);
        const prod = products.find(p => p.id === s.itemId);
        const q = searchTerm.toLowerCase();
        const matchCust = cust?.customerName?.toLowerCase().includes(q);
        const matchProd = prod?.itemName?.toLowerCase().includes(q);
        const matchId = s.id.toLowerCase().includes(q);
        if (!matchCust && !matchProd && !matchId) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [sales, filterPeriod, customFrom, customTo, searchTerm, customers, products]);

  const totals = useMemo(() => {
    const revenue = filteredSales.reduce((s, x) => s + x.saleAmount, 0);
    const units = filteredSales.reduce((s, x) => s + x.quantity, 0);
    return { count: filteredSales.length, revenue, units };
  }, [filteredSales]);

  const handleExportExcel = () => {
    const rows = filteredSales.map(s => {
      const cust = customers.find(c => c.id === s.customerId);
      const prod = products.find(p => p.id === s.itemId);
      const rep = s.salesRepId ? users.find(u => u.id === s.salesRepId) : undefined;
      return {
        'Transaction ID': s.id,
        'Delivery Ticket': s.deliveryTicketId || '-',
        'Customer': cust?.customerName || '',
        'Company': cust?.companyName || '',
        'Product': prod?.itemName || '',
        'Qty': s.quantity,
        'Amount (ETB)': s.saleAmount,
        'Date': new Date(s.saleDate).toLocaleDateString(),
        'Status': s.status || 'confirmed',
        'Fulfillment': s.fulfillment_type === 'pickup' ? 'Pickup' : 'Delivery',
        'Sales Rep': rep?.name || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `TTM_Sales_${filterPeriod.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrintInvoice = (sale: ProductSale) => {
    const cust = customers.find(c => c.id === sale.customerId);
    const prod = products.find(p => p.id === sale.itemId);
    const branch = cust ? branches.find(b => b.id === cust.branchId) : undefined;
    const rep = sale.salesRepId ? users.find(u => u.id === sale.salesRepId) : undefined;
    if (!cust) return;
    generateSaleInvoice({ sale, customer: cust, product: prod, branch, salesRep: rep });
  };

  const handleCopyDelivery = (sale: ProductSale) => {
    const cust = customers.find(c => c.id === sale.customerId);
    const prod = products.find(p => p.id === sale.itemId);
    if (!cust) return;
    const itemName = prod ? prod.itemName : 'Item';
    let msg = '';
    if (sale.fulfillment_type === 'pickup') {
      msg = `📦 TTM Pickup\n\nCustomer: ${cust.customerName}${cust.companyName ? ' (' + cust.companyName + ')' : ''}\nItem: ${itemName} × ${sale.quantity}\n\nPickup at TTM Showroom. Please bring ID.`;
    } else if (sale.delivery_scope === 'province') {
      msg = `🚚 TTM Regional Delivery\n\nTicket: ${sale.deliveryTicketId || 'N/A'}\nCustomer: ${cust.customerName}\nPhone: ${cust.phoneNumber}\nItem: ${itemName} × ${sale.quantity}\nCity: ${sale.destinationCity || 'N/A'}\nCarrier: ${sale.carrier || 'N/A'}\nTicket #: ${sale.ticketNumber || 'N/A'}\n\nStatus: In Transit`;
    } else {
      msg = `🚗 TTM Addis Delivery\n\nCustomer: ${cust.customerName}\nPhone: ${cust.phoneNumber}\nItem: ${itemName} × ${sale.quantity}\n\nDelivery to Addis Ababa.`;
    }
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedSaleId(sale.id);
      setTimeout(() => setCopiedSaleId(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${cardText}`}><Package className="w-6 h-6 text-amber-500" /> Sales</h1>
          <p className={`text-sm mt-0.5 ${subText}`}>All product sales transactions across branches. Short IDs: TTM-SAL****</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportExcel} className={`px-4 py-2.5 ${secBtn} rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer`}>
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={() => setActiveTab('products')} className={`px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer`}>
            <ExternalLink className="w-4 h-4" /> Product Store
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-xl border p-4 ${cardBg}`}>
          <p className={`text-xs font-semibold uppercase ${subText}`}>Transactions</p>
          <p className="text-2xl font-bold text-white mt-1">{totals.count}</p>
        </div>
        <div className={`rounded-xl border p-4 ${cardBg}`}>
          <p className={`text-xs font-semibold uppercase ${subText}`}>Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{totals.revenue.toLocaleString()} ETB</p>
        </div>
        <div className={`rounded-xl border p-4 ${cardBg}`}>
          <p className={`text-xs font-semibold uppercase ${subText}`}>Units Sold</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{totals.units}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`rounded-xl border p-4 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            {['Today', 'This Week', 'This Month', 'Custom Range', 'All-Time'].map((p) => (
              <button
                key={p}
                onClick={() => { setFilterPeriod(p); if (p === 'Custom Range') setShowCustomRange(true); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filterPeriod === p ? 'bg-amber-600 text-white shadow-lg' : isDark ? 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200' : 'bg-slate-100 text-slate-600 hover:text-slate-800'
                }`}
              >{p}</button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search customer, product, ID..." className={`pl-9 pr-4 py-2 rounded-lg text-sm border ${inputBg} focus:outline-none focus:ring-2 w-64`} />
          </div>
        </div>
        {showCustomRange && filterPeriod === 'Custom Range' && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-800/60">
            <div className="flex items-center gap-2"><span className="text-xs text-zinc-400">From:</span><input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={`px-3 py-1.5 rounded-lg text-sm border ${inputBg}`} /></div>
            <div className="flex items-center gap-2"><span className="text-xs text-zinc-400">To:</span><input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={`px-3 py-1.5 rounded-lg text-sm border ${inputBg}`} /></div>
            <button onClick={() => { setShowCustomRange(false); setFilterPeriod('All-Time'); }} className="p-1.5 hover:bg-zinc-700 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></button>
          </div>
        )}
      </div>

      {/* Sales Table */}
      <div className={`rounded-xl border ${cardBg} overflow-hidden`}>
        {filteredSales.length === 0 ? (
          <div className="p-8 text-center"><Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" /><p className="text-zinc-400">No sales match your filters.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${borderSub} text-left`}>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase text-zinc-500">ID</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase text-zinc-500">Delivery Ticket</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase text-zinc-500">Customer</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase text-zinc-500">Product</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase text-zinc-500">Qty</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase text-zinc-500">Amount (ETB)</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase text-zinc-500">Status</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase text-zinc-500">Fulfillment</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => {
                  const cust = customers.find(c => c.id === sale.customerId);
                  const prod = products.find(p => p.id === sale.itemId);
                  return (
                    <tr key={sale.id} className={`border-b ${borderSub} hover:bg-zinc-800/30 transition-colors`}>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-amber-400">{sale.id}</td>
                      <td className="py-3 px-4">
                        {sale.deliveryTicketId ? (
                          <span className="font-mono text-xs font-bold text-sky-400 flex items-center gap-1"><Truck className="w-3 h-3" /> {sale.deliveryTicketId}</span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => { if (cust) onSelectCustomer(cust); }} className="text-white hover:text-amber-400 font-medium transition-colors cursor-pointer hover:underline text-left">{cust?.customerName || 'Unknown'}</button>
                        {cust?.companyName && <p className="text-[10px] text-zinc-500">{cust.companyName}</p>}
                      </td>
                      <td className="py-3 px-4 text-sm">{prod?.itemName || 'Unknown'}</td>
                      <td className="py-3 px-4 text-sm">{sale.quantity}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{sale.saleAmount.toLocaleString()}</td>
                      <td className="py-3 px-4"><span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${statusBadge(sale.status)}`}>{sale.status || 'confirmed'}</span></td>
                      <td className="py-3 px-4"><span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${fulfillmentBadge(sale.fulfillment_type)}`}>{sale.fulfillment_type === 'pickup' ? 'Pickup' : 'Delivery'}</span></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handlePrintInvoice(sale)} className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-700/40 text-amber-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"><Printer className="w-3 h-3" /> Invoice</button>
                          <button onClick={() => handleCopyDelivery(sale)} className="px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600/40 border border-sky-700/40 text-sky-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer">
                            {copiedSaleId === sale.id ? '✓ Copied' : <><Copy className="w-3 h-3" /> Delivery</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
