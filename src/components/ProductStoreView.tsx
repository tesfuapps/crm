import React, { useState } from 'react';
import { ProductItem, ProductSale, Customer } from '../types/crm';
import { Package, Plus, DollarSign, Layers, ShoppingBag, Trash2 } from 'lucide-react';

interface ProductStoreViewProps {
  products: ProductItem[];
  sales: ProductSale[];
  customers: Customer[];
  theme: 'light' | 'dark';
  onAddProduct: (item: ProductItem) => void;
  onDeleteProduct: (itemId: string) => void;
  onRecordSale: (sale: ProductSale) => void;
}

export const ProductStoreView: React.FC<ProductStoreViewProps> = ({
  products, sales, customers, theme,
  onAddProduct, onDeleteProduct, onRecordSale,
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('Software');
  const [itemPrice, setItemPrice] = useState(25000);
  const [stockQuantity, setStockQuantity] = useState(50);
  const [saleCustomerId, setSaleCustomerId] = useState(customers[0]?.id || '');
  const [saleItemId, setSaleItemId] = useState(products[0]?.id || '');
  const [saleQuantity, setSaleQuantity] = useState(1);

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

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === saleItemId);
    if (!product) return;
    const newSale: ProductSale = { id: 's_' + Date.now(), customerId: saleCustomerId, itemId: saleItemId, quantity: Number(saleQuantity), saleDate: new Date().toISOString().split('T')[0], saleAmount: product.itemPrice * Number(saleQuantity) };
    onRecordSale(newSale);
    setIsSaleModalOpen(false);
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
          <button onClick={() => setIsSaleModalOpen(true)} className={`px-4 py-2.5 ${secBtn} rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer`}>
            <ShoppingBag className="w-4 h-4" /> <span>Record Sale</span>
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className={`px-4 py-2.5 ${primaryBtn} rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer`}>
            <Plus className="w-4 h-4" /> <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => {
          const productSales = sales.filter(s => s.itemId === product.id);
          const totalUnitsSold = productSales.reduce((sum, s) => sum + s.quantity, 0);
          return (
            <div key={product.id} className={`rounded-xl border p-5 flex flex-col justify-between ${cardBg}`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold bg-amber-950/40 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-800/60">{product.itemCategory}</span>
                  <span className="text-xs font-medium text-zinc-400">Stock: <strong className="text-zinc-200">{product.stockQuantity}</strong></span>
                </div>
                <h3 className="font-bold text-base text-white">{product.itemName}</h3>
                <p className={`text-xs mt-1 line-clamp-2 ${subText}`}>{product.itemDescription}</p>
              </div>
              <div className={`mt-6 pt-4 border-t ${borderSub} flex items-center justify-between`}>
                <div><span className="text-xs text-zinc-500">Price</span><p className="text-lg font-bold text-emerald-400">{product.itemPrice.toLocaleString()} ETB</p></div>
                <div className="text-right"><span className="text-xs text-zinc-500">Total Sold</span><p className="text-sm font-bold text-zinc-200">{totalUnitsSold} units</p></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`rounded-xl border p-6 ${cardBg}`}>
        <h3 className={`font-bold mb-4 flex items-center gap-2 ${cardText}`}><ShoppingBag className="w-4 h-4 text-amber-400" /> <span>Recent Product Sales Transactions</span></h3>
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
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
              {sales.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-500">No sales recorded yet.</td></tr>
              ) : (
                sales.map((sale) => {
                  const cust = customers.find(c => c.id === sale.customerId);
                  const prod = products.find(p => p.id === sale.itemId);
                  return (
                    <tr key={sale.id} className={`hover:${isDark ? 'bg-zinc-800/40' : 'bg-slate-50/80'} transition-colors`}>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-500">{sale.id}</td>
                      <td className="py-3 px-4 font-medium text-white">{cust?.customerName || 'Unknown'}</td>
                      <td className="py-3 px-4 text-zinc-300">{prod?.itemName || 'Product'}</td>
                      <td className="py-3 px-4 text-zinc-300">{sale.quantity}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{sale.saleAmount.toLocaleString()} ETB</td>
                      <td className="py-3 px-4 text-xs text-zinc-500">{sale.saleDate}</td>
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
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Services">Services</option>
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

      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-xl max-w-md w-full overflow-hidden border ${modalBg}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${modalHeader}`}>
              <h3 className="font-bold text-white">Record Product Sale</h3>
              <button onClick={() => setIsSaleModalOpen(false)} className="text-zinc-400 hover:text-zinc-200">×</button>
            </div>
            <form onSubmit={handleCreateSale} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Customer</label>
                <select value={saleCustomerId} onChange={(e) => setSaleCustomerId(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.customerName} ({c.companyName || c.phoneNumber})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Product Item</label>
                <select value={saleItemId} onChange={(e) => setSaleItemId(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required>
                  {products.map(p => <option key={p.id} value={p.id}>{p.itemName} — {p.itemPrice.toLocaleString()} ETB</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-400">Quantity</label>
                <input type="number" min="1" value={saleQuantity} onChange={(e) => setSaleQuantity(Number(e.target.value))} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/60">
                <button type="button" onClick={() => setIsSaleModalOpen(false)} className={`px-4 py-2 border rounded-lg text-sm font-medium ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}>Cancel</button>
                <button type="submit" className={`px-5 py-2 ${primaryBtn} rounded-lg text-sm font-medium`}>Record Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
