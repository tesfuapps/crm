import React, { useState } from 'react';
import { ProductItem, ProductSale, Customer } from '../types/crm';
import { Package, Plus, DollarSign, Layers, ShoppingBag, Trash2 } from 'lucide-react';

interface ProductStoreViewProps {
  products: ProductItem[];
  sales: ProductSale[];
  customers: Customer[];
  onAddProduct: (item: ProductItem) => void;
  onDeleteProduct: (itemId: string) => void;
  onRecordSale: (sale: ProductSale) => void;
}

export const ProductStoreView: React.FC<ProductStoreViewProps> = ({
  products,
  sales,
  customers,
  onAddProduct,
  onDeleteProduct,
  onRecordSale,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // New product form
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('Software');
  const [itemPrice, setItemPrice] = useState(25000);
  const [stockQuantity, setStockQuantity] = useState(50);

  // New sale form
  const [saleCustomerId, setSaleCustomerId] = useState(customers[0]?.id || '');
  const [saleItemId, setSaleItemId] = useState(products[0]?.id || '');
  const [saleQuantity, setSaleQuantity] = useState(1);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const newItem: ProductItem = {
      id: 'p_' + Date.now(),
      itemName,
      itemDescription,
      itemCategory,
      itemPrice: Number(itemPrice),
      stockQuantity: Number(stockQuantity),
    };

    onAddProduct(newItem);
    setIsAddModalOpen(false);
    setItemName('');
    setItemDescription('');
  };

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === saleItemId);
    if (!product) return;

    const newSale: ProductSale = {
      id: 's_' + Date.now(),
      customerId: saleCustomerId,
      itemId: saleItemId,
      quantity: Number(saleQuantity),
      saleDate: new Date().toISOString().split('T')[0],
      saleAmount: product.itemPrice * Number(saleQuantity),
    };

    onRecordSale(newSale);
    setIsSaleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Product Store & Sales Inventory</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage software licenses, POS hardware, and services catalog with live stock levels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Record Sale</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => {
          const productSales = sales.filter(s => s.itemId === product.id);
          const totalUnitsSold = productSales.reduce((sum, s) => sum + s.quantity, 0);

          return (
            <div key={product.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full">
                    {product.itemCategory}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    Stock: <strong className="text-slate-800">{product.stockQuantity}</strong>
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">{product.itemName}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.itemDescription}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Price</span>
                  <p className="text-lg font-bold text-emerald-700">{product.itemPrice.toLocaleString()} ETB</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Total Sold</span>
                  <p className="text-sm font-bold text-slate-800">{totalUnitsSold} units</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-teal-700" />
          <span>Recent Product Sales Transactions</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product Item</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Sale Amount</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No sales recorded yet.</td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const cust = customers.find(c => c.id === sale.customerId);
                  const prod = products.find(p => p.id === sale.itemId);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{sale.id}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{cust?.customerName || 'Unknown'}</td>
                      <td className="py-3 px-4 text-slate-700">{prod?.itemName || 'Product'}</td>
                      <td className="py-3 px-4 text-slate-600">{sale.quantity}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{sale.saleAmount.toLocaleString()} ETB</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{sale.saleDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900">Add New Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Item Name *</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Abyssinia Cloud ERP"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Sale Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900">Record Product Sale</h3>
              <button onClick={() => setIsSaleModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleCreateSale} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Customer</label>
                <select
                  value={saleCustomerId}
                  onChange={(e) => setSaleCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  required
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customerName} ({c.companyName || c.phoneNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Product Item</label>
                <select
                  value={saleItemId}
                  onChange={(e) => setSaleItemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.itemName} — {p.itemPrice.toLocaleString()} ETB</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={saleQuantity}
                  onChange={(e) => setSaleQuantity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
