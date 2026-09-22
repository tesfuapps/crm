import React, { useState, useMemo } from 'react';
import { ProductItem, ProductSale, Customer, Branch, User } from '../types/crm';
import { Package, Plus, DollarSign, Layers, Trash2, Download, Filter, Calendar, X, Printer, Edit2, Copy, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateSaleInvoice } from '../utils/saleInvoice';

interface ProductStoreViewProps {
  products: ProductItem[];
  sales: ProductSale[];
  customers: Customer[];
  branches: Branch[];
  users: User[];
  theme: 'light' | 'dark';
  onAddProduct: (item: ProductItem) => void;
  onUpdateProduct: (item: ProductItem) => void;
  onDeleteProduct: (itemId: string) => void;
}

export const ProductStoreView: React.FC<ProductStoreViewProps> = ({
  products, sales, customers, branches, users, theme,
  onAddProduct, onUpdateProduct, onDeleteProduct,
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('Software');
  const [itemPrice, setItemPrice] = useState(25000);
  const [stockQuantity, setStockQuantity] = useState(50);
  const [salesFilterPeriod, setSalesFilterPeriod] = useState<string>('All-Time');
  const [customRangeFrom, setCustomRangeFrom] = useState('');
  const [customRangeTo, setCustomRangeTo] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [copiedSaleId, setCopiedSaleId] = useState<string | null>(null);
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productSearch, setProductSearch] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      if (salesFilterPeriod === 'Today') return sale.saleDate === todayStr;
      if (salesFilterPeriod === 'This Week') return saleDate >= weekAgo;
      if (salesFilterPeriod === 'This Month') return saleDate >= monthAgo;
      if (salesFilterPeriod === 'Custom Range' && customRangeFrom && customRangeTo) {
        const from = new Date(customRangeFrom);
        const to = new Date(customRangeTo);
        to.setHours(23, 59, 59, 999);
        return saleDate >= from && saleDate <= to;
      }
      return true;
    });
  }, [sales, salesFilterPeriod, customRangeFrom, customRangeTo]);

  const productCategories = useMemo(() => {
    const cats: Record<string, number> = { All: products.length };
    products.forEach(p => { cats[p.itemCategory] = (cats[p.itemCategory] || 0) + 1; });
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = productCategoryFilter === 'All' || p.itemCategory === productCategoryFilter;
      const matchesSearch = !productSearch || p.itemName.toLowerCase().includes(productSearch.toLowerCase()) || p.itemDescription.toLowerCase().includes(productSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, productCategoryFilter, productSearch]);

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const cardText = isDark ? 'text-zinc-100' : 'text-slate-900';
  const subText = isDark ? 'text-zinc-400' : 'text-slate-500';
  const borderSub = isDark ? 'border-zinc-800/60' : 'border-slate-200';
  const primaryBtn = isDark ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-teal-700 hover:bg-teal-800 text-white';
  const secBtn = isDark ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
  const inputBg = isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800';
  const modalBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const modalHeader = isDark ? 'bg-zinc-950/80 border-zinc-800/60' : 'bg-slate-50 border-slate-200';

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    const newItem: ProductItem = { id: 'p_' + Date.now(), itemName, itemDescription, itemCategory, itemPrice: Number(itemPrice), stockQuantity: Number(stockQuantity) };
    onAddProduct(newItem);
    setIsAddModalOpen(false);
    setItemName('');
    setItemDescription('');
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split('\n');
      let added = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(/[,;\t]/).map(p => p.replace(/^["']|["']$/g, '').trim());
        if (parts.length >= 2) {
          const [name, cat, price, stock] = parts;
          const newItem: ProductItem = {
            id: 'p_' + Date.now() + '_' + i,
            itemName: name || 'Imported Equipment',
            itemDescription: 'Imported via CSV spreadsheet',
            itemCategory: cat || 'Machinery',
            itemPrice: Number(price) || 15000,
            stockQuantity: Number(stock) || 10,
          };
          onAddProduct(newItem);
          added++;
        }
      }
      alert(`Successfully imported ${added} products from spreadsheet!`);
    };
    reader.readAsText(file);
  };

  const exportSalesToCSV = () => {
    const header = 'Transaction ID,Date,Customer Name,Company,Product Item,Category,Quantity,Sale Amount (ETB),Branch,Sales Rep,Fulfillment,Delivery Details\n';
    const rows = filteredSales.map(sale => {
      const cust = customers.find(c => c.id === sale.customerId);
      const prod = products.find(p => p.id === sale.itemId);
      const branch = branches.find(b => b.id === cust?.branchId);
      const rep = users.find(u => u.id === sale.salesRepId);
      const fulfillment = sale.fulfillment_type === 'pickup' ? 'Pickup' : sale.addis_delivery_type === 'own_delivery' ? 'Own Delivery' : sale.addis_delivery_type === 'outsourced' ? sale.outsourced_provider || 'Outsourced' : sale.delivery_scope === 'province' ? sale.carrier || 'Bus Cargo' : 'N/A';
      const deliveryDetails = sale.vehicle_plate_number || sale.ticketNumber || sale.driver_phone || '';
      return `"${sale.id}","${sale.saleDate}","${cust?.customerName || 'Unknown'}","${cust?.companyName || ''}","${prod?.itemName || 'Product'}","${prod?.itemCategory || ''}",${sale.quantity},${sale.saleAmount},"${branch?.name || ''}","${rep?.name || ''}","${fulfillment}","${deliveryDetails}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TTM_Sales_${salesFilterPeriod.replace(/\s/g, '_')}_${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSalesToExcel = () => {
    const rows = filteredSales.map(sale => {
      const cust = customers.find(c => c.id === sale.customerId);
      const prod = products.find(p => p.id === sale.itemId);
      const branch = branches.find(b => b.id === cust?.branchId);
      const rep = users.find(u => u.id === sale.salesRepId);
      const fulfillment = sale.fulfillment_type === 'pickup' ? 'Pickup' : sale.addis_delivery_type === 'own_delivery' ? 'Own Delivery' : sale.addis_delivery_type === 'outsourced' ? sale.outsourced_provider || 'Outsourced' : sale.delivery_scope === 'province' ? sale.carrier || 'Bus Cargo' : 'N/A';
      const deliveryDetails = sale.vehicle_plate_number || sale.ticketNumber || sale.driver_phone || '';
      return {
        'Transaction ID': sale.id,
        'Date': sale.saleDate,
        'Customer Name': cust?.customerName || 'Unknown',
        'Company': cust?.companyName || '',
        'Product Item': prod?.itemName || 'Product',
        'Category': prod?.itemCategory || '',
        'Quantity': sale.quantity,
        'Sale Amount (ETB)': sale.saleAmount,
        'Branch': branch?.name || '',
        'Sales Rep': rep?.name || '',
        'Fulfillment': fulfillment,
        'Delivery Details': deliveryDetails,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `TTM_Sales_${salesFilterPeriod.replace(/\s/g, '_')}_${todayStr}.xlsx`);
  };

  const openEditProduct = (product: ProductItem) => {
    setEditingProduct(product);
    setEditName(product.itemName);
    setEditDescription(product.itemDescription);
    setEditCategory(product.itemCategory);
    setEditPrice(product.itemPrice);
    setEditStock(product.stockQuantity);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editName.trim()) return;
    onUpdateProduct({
      ...editingProduct,
      itemName: editName,
      itemDescription: editDescription,
      itemCategory: editCategory,
      itemPrice: Number(editPrice),
      stockQuantity: Number(editStock),
    });
    setEditingProduct(null);
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
    const custLine = `${cust.customerName}${cust.companyName ? ' (' + cust.companyName + ')' : ''}`;
    let msg = '';
    if (sale.fulfillment_type === 'pickup') {
      msg = `📦 TTM Equipment — Showroom Pickup Confirmed\n\nCustomer: ${custLine}\nItem: ${itemName} × ${sale.quantity}\nTicket: ${sale.deliveryTicketId || 'N/A'}\nPickup Location: TTM Showroom\n\nPlease bring your ID when collecting.`;
    } else if (sale.delivery_scope === 'province' && sale.delivery_channel === 'regional_express') {
      const carrierContacts: Record<string, string> = { 'Wanza Express': 'Short Code: 9575', 'Mela Express Delivery': 'Short Code: 9903 / Tel: +251 95 151 8651', 'Go Delivery Ethiopia': 'Tel: +251 11 619 8020', 'Eshi Express': 'Tel: +251 92 254 3669' };
      const contact = carrierContacts[sale.regional_carrier || ''] || '';
      msg = `📦 TTM Equipment — Regional Express Cargo Dispatched\n\nCustomer: ${custLine}\nItem: ${itemName} × ${sale.quantity}\nTicket: ${sale.deliveryTicketId || 'N/A'}\nDestination: ${sale.destinationCity || 'N/A'}\nCarrier: ${sale.regional_carrier || sale.carrier || 'N/A'}${contact ? ' (' + contact + ')' : ''}\nWaybill / Tracking #: ${sale.waybill_tracking_number || sale.ticketNumber || 'N/A'}\n\nYour shipment is in transit. Please present your tracking code upon arrival.`;
    } else if (sale.delivery_scope === 'province' && sale.delivery_channel === 'market_hub') {
      msg = `🚚 TTM Equipment — Market Hub Dispatch\n\nCustomer: ${custLine}\nItem: ${itemName} × ${sale.quantity}\nTicket: ${sale.deliveryTicketId || 'N/A'}\nDispatch Hub: ${sale.dispatch_hub || 'Mercato Hub'}\nVehicle: ${sale.vehicle_type || 'Mini-Truck'}\nPlate #: ${sale.vehicle_plate_number || 'N/A'}\nDriver Phone: ${sale.driver_phone || 'N/A'}\n\nYour cargo has been dispatched. Please keep your phone available for arrival!`;
    } else {
      msg = `🚚 TTM Equipment — Addis Ababa Delivery\n\nCustomer: ${custLine}\nItem: ${itemName} × ${sale.quantity}\nTicket: ${sale.deliveryTicketId || 'N/A'}\nProvider: ${sale.outsourced_provider || 'Own Driver'}\nDriver: ${sale.driver_name || 'N/A'}\nPhone: ${sale.driver_phone || 'N/A'}\nPlate: ${sale.vehicle_plate_number || 'N/A'}`;
    }
    if (msg) {
      navigator.clipboard.writeText(msg).then(() => {
        setCopiedSaleId(sale.id);
        setTimeout(() => setCopiedSaleId(null), 2000);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h2 className="text-xl font-bold text-white">Product Store & Sales Inventory</h2>
          <p className={`text-sm mt-0.5 ${subText}`}>Manage printing machinery, blanks, and sublimation consumables with live stock levels.</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleBulkImport} accept=".csv,.txt,.tsv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className={`px-4 py-2.5 ${secBtn} rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer`}>
            <span>📥 Import Products</span>
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className={`px-4 py-2.5 ${primaryBtn} rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer`}>
            <Plus className="w-4 h-4" /> <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs + Search */}
      <div className={`p-4 rounded-xl border ${cardBg}`}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {Object.entries(productCategories).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setProductCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                productCategoryFilter === cat
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 hover:text-zinc-200'
              }`}
            >
              {cat} <span className="ml-1 opacity-60">({count})</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search products by name or code..."
            className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm border ${inputBg} focus:outline-none focus:ring-2 focus:ring-amber-600`}
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <div className={`col-span-full p-8 rounded-xl border text-center ${cardBg}`}>
            <p className="text-zinc-500 text-sm">No products found in this category.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const productSales = sales.filter(s => s.itemId === product.id);
            const totalUnitsSold = productSales.reduce((sum, s) => sum + s.quantity, 0);
            return (
              <div key={product.id} className={`rounded-xl border p-4 flex flex-col justify-between ${cardBg} hover:border-amber-800/40 transition-colors`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded-full border border-amber-800/60">{product.itemCategory}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-zinc-400">Stock: <strong className="text-zinc-200">{product.stockQuantity}</strong></span>
                      <button onClick={() => openEditProduct(product)} className="p-1 hover:bg-zinc-700 rounded transition-colors" title="Edit">
                        <Edit2 className="w-3 h-3 text-zinc-500 hover:text-amber-400" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-white leading-tight">{product.itemName}</h3>
                  <p className={`text-[11px] mt-1 line-clamp-1 ${subText}`}>{product.itemDescription}</p>
                </div>
                <div className={`mt-3 pt-3 border-t ${borderSub} flex items-center justify-between`}>
                  <div><span className="text-[10px] text-zinc-500">Price</span><p className="text-base font-bold text-emerald-400">{product.itemPrice.toLocaleString()} ETB</p></div>
                  <div className="text-right"><span className="text-[10px] text-zinc-500">Sold</span><p className="text-xs font-bold text-zinc-200">{totalUnitsSold} units</p></div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h3 className={`font-bold mb-4 flex items-center gap-2 ${cardText}`}><Package className="w-4 h-4 text-amber-400" /> <span>Recent Product Sales Transactions</span></h3>

        {/* Filter & Export Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#161616] border border-neutral-800 rounded-xl mb-4">
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            {['Today', 'This Week', 'This Month', 'Custom Range', 'All-Time'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setSalesFilterPeriod(p);
                  if (p === 'Custom Range') setShowCustomRange(true);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  salesFilterPeriod === p
                    ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {p === 'Custom Range' && <Calendar className="w-3 h-3 inline mr-1" />}
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500 font-mono">{filteredSales.length} txns</span>
            <button onClick={exportSalesToCSV} className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-medium text-neutral-300 rounded-lg flex items-center gap-1.5">
              <Download className="w-3 h-3" /> CSV
            </button>
            <button onClick={exportSalesToExcel} className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/50 text-xs font-medium text-emerald-300 rounded-lg flex items-center gap-1.5">
              <Download className="w-3 h-3" /> Excel
            </button>
          </div>
        </div>

        {/* Custom Range Date Picker */}
        {salesFilterPeriod === 'Custom Range' && (
          <div className="flex items-center gap-3 p-3 bg-[#161616] border border-amber-800/40 rounded-xl mb-4">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-zinc-400">From:</span>
            <input type="date" value={customRangeFrom} onChange={(e) => setCustomRangeFrom(e.target.value)} className={`px-2.5 py-1.5 rounded-lg text-xs border ${inputBg} focus:outline-none focus:ring-1 focus:ring-amber-600`} />
            <span className="text-xs text-zinc-400">To:</span>
            <input type="date" value={customRangeTo} onChange={(e) => setCustomRangeTo(e.target.value)} className={`px-2.5 py-1.5 rounded-lg text-xs border ${inputBg} focus:outline-none focus:ring-1 focus:ring-amber-600`} />
            {customRangeFrom && customRangeTo && (
              <button onClick={() => { setCustomRangeFrom(''); setCustomRangeTo(''); }} className="text-zinc-500 hover:text-zinc-300 p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase tracking-wider font-semibold border-b ${borderSub}`}>
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product Item</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Sale Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4 no-export">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
              {filteredSales.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-zinc-500">No sales recorded for this period.</td></tr>
              ) : (
                filteredSales.map((sale) => {
                  const cust = customers.find(c => c.id === sale.customerId);
                  const prod = products.find(p => p.id === sale.itemId);
                  const fulfillment = sale.fulfillment_type === 'pickup' ? 'Pickup' : sale.addis_delivery_type === 'own_delivery' ? '🏢 Own Delivery' : sale.addis_delivery_type === 'outsourced' ? `🚗 ${sale.outsourced_provider || 'Outsourced'}` : sale.delivery_scope === 'province' ? `🚌 ${sale.carrier || 'Bus Cargo'}` : '—';
                  return (
                    <tr key={sale.id} className={`hover:${isDark ? 'bg-zinc-800/40' : 'bg-slate-50/80'} transition-colors`}>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-500">{sale.id}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-white">{cust?.customerName || 'Unknown'}</span>
                        {cust?.companyName && <span className="text-[11px] text-zinc-500 block">{cust.companyName}</span>}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{prod?.itemName || 'Product'}</td>
                      <td className="py-3 px-4 text-zinc-300">{sale.quantity}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{sale.saleAmount.toLocaleString()} ETB</td>
                      <td className="py-3 px-4 text-xs text-zinc-500">{sale.saleDate}</td>
                      <td className="py-3 px-4 text-xs">{fulfillment}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handlePrintInvoice(sale)} className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-700/40 text-amber-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer">
                            <Printer className="w-3 h-3" /> Invoice
                          </button>
                          <button onClick={() => handleCopyDelivery(sale)} className="px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600/40 border border-sky-700/40 text-sky-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer">
                            {copiedSaleId === sale.id ? '✓ Copied' : <><Copy className="w-3 h-3" /> Delivery</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-xl max-w-md w-full overflow-hidden border ${modalBg}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${modalHeader}`}>
              <h3 className="font-bold text-white">Add New Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-200">×</button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Item Name *</label>
                <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Abyssinia Cloud ERP" className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Category</label>
                <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`}>
                  <option value="Machines">Machines</option>
                  <option value="Mugs">Mugs & Drinkware</option>
                  <option value="Sublimation Blanks">Sublimation Blanks</option>
                  <option value="Stamps">Stamps & Mounts</option>
                  <option value="Papers">Papers & Films</option>
                  <option value="Accessories">Accessories & Consumables</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Price (ETB)</label>
                  <input type="number" value={itemPrice} onChange={(e) => setItemPrice(Number(e.target.value))} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Stock Qty</label>
                  <input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(Number(e.target.value))} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Description</label>
                <textarea rows={3} value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} className={`w-full ${inputBg} border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/60">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className={`px-4 py-2 border rounded-lg text-sm font-medium ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}>Cancel</button>
                <button type="submit" className={`px-5 py-2 ${primaryBtn} rounded-lg text-sm font-medium`}>Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-xl max-w-md w-full overflow-hidden border ${modalBg}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${modalHeader}`}>
              <h3 className="font-bold text-white flex items-center gap-2"><Edit2 className="w-4 h-4 text-amber-400" /> Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} className="text-zinc-400 hover:text-zinc-200">×</button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Product Name *</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Description / Code</label>
                <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`}>
                  <option value="Machines">Machines</option>
                  <option value="Mugs">Mugs & Drinkware</option>
                  <option value="Sublimation Blanks">Sublimation Blanks</option>
                  <option value="Stamps">Stamps & Mounts</option>
                  <option value="Papers">Papers & Films</option>
                  <option value="Accessories">Accessories & Consumables</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Price (ETB)</label>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Stock Qty</label>
                  <input type="number" value={editStock} onChange={(e) => setEditStock(Number(e.target.value))} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/60">
                <button type="button" onClick={() => setEditingProduct(null)} className={`px-4 py-2 border rounded-lg text-sm font-medium ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}>Cancel</button>
                <button type="submit" className={`px-5 py-2 ${primaryBtn} rounded-lg text-sm font-medium`}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
