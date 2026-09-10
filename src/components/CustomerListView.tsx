import React, { useState, useEffect } from 'react';
import { Customer, Branch, User, CallLog, CustomerStage, ProductItem } from '../types/crm';
import { Search, Filter, Plus, PhoneCall, ChevronRight, UserPlus, Send, Calculator, ShoppingBag } from 'lucide-react';

interface CustomerListViewProps {
  customers: Customer[];
  branches: Branch[];
  users: User[];
  callLogs: CallLog[];
  selectedBranchId: string;
  products: ProductItem[];
  onAddCustomer: (newCust: Customer) => void;
  onUpdateCustomer: (updatedCust: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onOpenLogCallForCustomer: (customer: Customer) => void;
  initialSelectedCustomer?: Customer | null;
  externalOpenAddModal?: boolean;
  setExternalOpenAddModal?: (open: boolean) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  customers,
  branches,
  users,
  callLogs,
  selectedBranchId,
  products,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onOpenLogCallForCustomer,
  initialSelectedCustomer,
  externalOpenAddModal,
  setExternalOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialSelectedCustomer || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(externalOpenAddModal || false);

  // Quick-Quote Calculator state inside detail view
  const [calcProductId, setCalcProductId] = useState(products[0]?.id || '');
  const [calcQuantity, setCalcQuantity] = useState(1);

  useEffect(() => {
    if (externalOpenAddModal !== undefined) {
      setIsAddModalOpen(externalOpenAddModal);
    }
  }, [externalOpenAddModal]);

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    if (setExternalOpenAddModal) setExternalOpenAddModal(false);
  };

  // New customer form state
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPhone, setNewPhone] = useState('09');
  const [newEmail, setNewEmail] = useState('');
  const [newType, setNewType] = useState<'New' | 'Old'>('New');
  const [newSource, setNewSource] = useState('Telegram');
  const [newPurpose, setNewPurpose] = useState('Inquiry: Mug Press & Printing Machinery');
  const [newStage, setNewStage] = useState<CustomerStage>('Contact');
  const [newPriority, setNewPriority] = useState<'Hot' | 'Warm' | 'Cold'>('Warm');
  const [newDealValue, setNewDealValue] = useState(25000);
  const [newBranchId, setNewBranchId] = useState(selectedBranchId === 'all' ? 'b1' : selectedBranchId);

  // Filtering
  const filteredCustomers = customers.filter(c => {
    const matchesBranch = selectedBranchId === 'all' || c.branchId === selectedBranchId;
    const matchesStage = stageFilter === 'all' || c.customerStage === stageFilter;
    const matchesSource = sourceFilter === 'all' || c.source === sourceFilter;
    const matchesPriority = priorityFilter === 'all' || c.leadPriority === priorityFilter;
    const matchesSearch = 
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.phoneNumber.includes(searchTerm);
    return matchesBranch && matchesStage && matchesSource && matchesPriority && matchesSearch;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const cust: Customer = {
      id: 'c_' + Date.now(),
      customerName: newName,
      companyName: newCompany || undefined,
      phoneNumber: newPhone,
      email: newEmail || undefined,
      customerType: newType,
      source: newSource,
      purposeOfCall: newPurpose,
      customerStage: newStage,
      assignedUserId: users[0]?.id || 'u1',
      branchId: newBranchId,
      leadPriority: newPriority,
      dealValue: Number(newDealValue),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddCustomer(cust);
    handleCloseAddModal();
    setNewName('');
    setNewCompany('');
    setNewPhone('09');
    setNewEmail('');
  };

  const getStageBadgeClass = (stage: CustomerStage) => {
    switch (stage) {
      case 'Contact': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Lead': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Customer': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Client': return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Shortcut: Alt + N (New) | Alt + L (Call)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Printing Client Directory</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Showing {filteredCustomers.length} of {customers.length} total printing clients & machinery buyers
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Customer</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name, print shop, or phone (09...)"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="all">All Stages</option>
            <option value="Contact">Contact</option>
            <option value="Lead">Lead</option>
            <option value="Customer">Customer</option>
            <option value="Client">Client</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="all">All Sources</option>
            <option value="Telegram">Telegram</option>
            <option value="Facebook">Facebook</option>
            <option value="Referral">Referral</option>
            <option value="Previous Buyer">Previous Buyer</option>
            <option value="Exhibition">Exhibition</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="all">All Priorities</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>
        </div>
      </div>

      {/* Main Content: Split view if customer selected, else full table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Table */}
        <div className={`bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden ${selectedCustomer ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Client / Print Shop</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Phone & Quick Actions</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Deal Value</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No printing clients found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    return (
                      <tr
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        className={`hover:bg-slate-50/90 cursor-pointer transition-colors ${
                          isSelected ? 'bg-teal-50/60 border-l-4 border-teal-600' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{cust.customerName}</div>
                          <div className="text-xs text-slate-500">{cust.companyName || 'Independent Print Shop'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStageBadgeClass(cust.customerStage)}`}>
                            {cust.customerStage}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${cust.phoneNumber}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono text-xs font-bold text-teal-700 hover:underline bg-teal-50 px-2 py-1 rounded border border-teal-200 flex items-center gap-1"
                              title="Click to Call"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>{cust.phoneNumber}</span>
                            </a>
                            <a
                              href={`https://t.me/+251${cust.phoneNumber.replace(/^0/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sky-600 hover:text-sky-700 bg-sky-50 p-1.5 rounded border border-sky-200 transition-colors"
                              title="Open in Telegram"
                            >
                              <Send className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-xs font-semibold">
                            {cust.source}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-900 font-bold">
                          {cust.dealValue ? `${cust.dealValue.toLocaleString()} ETB` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenLogCallForCustomer(cust);
                              }}
                              className="p-1.5 text-teal-700 hover:bg-teal-100 rounded-lg transition-colors"
                              title="Log Call"
                            >
                              <PhoneCall className="w-4 h-4" />
                            </button>
                            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-teal-700' : ''}`} />
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

        {/* Customer Detail & Quick-Quote Calculator Panel */}
        {selectedCustomer && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col h-[calc(100vh-14rem)] sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-1.5 ${getStageBadgeClass(selectedCustomer.customerStage)}`}>
                  {selectedCustomer.customerStage}
                </span>
                <h3 className="font-bold text-lg text-slate-900">{selectedCustomer.customerName}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Info Grid with Quick-Dial & Telegram */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Shop / Company:</span>
                  <span className="font-bold text-slate-800">{selectedCustomer.companyName || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${selectedCustomer.phoneNumber}`} className="font-bold text-teal-700 font-mono hover:underline">
                      {selectedCustomer.phoneNumber}
                    </a>
                    <a 
                      href={`https://t.me/+251${selectedCustomer.phoneNumber.replace(/^0/, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Send className="w-2.5 h-2.5" /> Telegram
                    </a>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="font-bold text-slate-800">{selectedCustomer.email || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Priority:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${selectedCustomer.leadPriority === 'Hot' ? 'bg-red-50 text-red-700' : 'bg-slate-200 text-slate-800'}`}>
                    {selectedCustomer.leadPriority}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Current Deal:</span>
                  <span className="font-bold text-emerald-700 text-sm">{selectedCustomer.dealValue.toLocaleString()} ETB</span>
                </div>
              </div>

              {/* Product Quick-Quote Calculator */}
              <div className="bg-teal-50/60 p-3.5 rounded-xl border border-teal-200 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-teal-700" />
                  <span>Quick-Quote Calculator</span>
                </h4>
                <div className="space-y-2">
                  <select
                    value={calcProductId}
                    onChange={(e) => setCalcProductId(e.target.value)}
                    aria-label="Select Machinery or Blank Product"
                    className="w-full bg-white border border-teal-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.itemName} — {p.itemPrice.toLocaleString()} ETB</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={calcQuantity}
                      onChange={(e) => setCalcQuantity(Number(e.target.value))}
                      placeholder="Qty"
                      aria-label="Product Quantity"
                      className="w-20 bg-white border border-teal-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
                    />
                    {(() => {
                      const prod = products.find(p => p.id === calcProductId);
                      const quoteTotal = prod ? prod.itemPrice * calcQuantity : 0;
                      return (
                        <div className="flex-1 flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-teal-200">
                          <span className="text-[11px] text-teal-900 font-bold">{quoteTotal.toLocaleString()} ETB</span>
                          <button
                            onClick={() => {
                              const updated = { ...selectedCustomer, dealValue: quoteTotal, updatedAt: new Date().toISOString() };
                              setSelectedCustomer(updated);
                              onUpdateCustomer(updated);
                            }}
                            className="text-[10px] bg-teal-700 text-white px-2 py-1 rounded font-semibold hover:bg-teal-800"
                          >
                            Apply Quote
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Stage Changer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Update Pipeline Stage
                </label>
                <select
                  value={selectedCustomer.customerStage}
                  onChange={(e) => {
                    const updated = { ...selectedCustomer, customerStage: e.target.value as CustomerStage, updatedAt: new Date().toISOString() };
                    setSelectedCustomer(updated);
                    onUpdateCustomer(updated);
                  }}
                  aria-label="Change Customer Stage"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
                >
                  <option value="Contact">Contact</option>
                  <option value="Lead">Lead</option>
                  <option value="Customer">Customer</option>
                  <option value="Client">Client</option>
                </select>
              </div>

              {/* Call History Timeline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-teal-700" />
                    <span>Call History Log</span>
                  </h4>
                  <button
                    onClick={() => onOpenLogCallForCustomer(selectedCustomer)}
                    className="text-xs text-teal-700 font-bold hover:underline"
                  >
                    + Log Call
                  </button>
                </div>

                <div className="space-y-3">
                  {callLogs.filter(cl => cl.customerId === selectedCustomer.id).length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">No calls logged yet for this client.</p>
                  ) : (
                    callLogs
                      .filter(cl => cl.customerId === selectedCustomer.id)
                      .map((log) => {
                        const user = users.find(u => u.id === log.userId);
                        return (
                          <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-teal-800">{log.purpose}</span>
                              <span className="text-slate-500 font-mono">{log.durationMinutes} mins</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{log.remark}</p>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                              <span>Agent: {user?.name || 'Agent'}</span>
                              <span>{new Date(log.dateTime).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedCustomer.customerName}?`)) {
                    onDeleteCustomer(selectedCustomer.id);
                    setSelectedCustomer(null);
                  }
                }}
                className="text-xs text-red-600 hover:text-red-800 font-semibold"
              >
                Delete Client
              </button>
              <button
                onClick={() => onOpenLogCallForCustomer(selectedCustomer)}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Log New Call</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Add Printing Client Modal Card */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Add New Printing Client / Customer</h3>
                  <p className="text-xs text-slate-500">Register a new lead for machinery, mugs, or custom apparel printing</p>
                </div>
              </div>
              <button 
                onClick={handleCloseAddModal} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60 transition-colors font-bold text-lg"
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCustomer} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Client Full Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Ato Girma Abebe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Print Shop / Company Name</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Girma Print & Gift PLC"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number (09...) *</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0911223344"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all font-mono font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="girma@printshop.et"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pipeline Stage</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as CustomerStage)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
                  >
                    <option value="Contact">Contact</option>
                    <option value="Lead">Lead</option>
                    <option value="Customer">Customer</option>
                    <option value="Client">Client</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Inquiry Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
                  >
                    <option value="Telegram">Telegram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Referral">Referral</option>
                    <option value="Previous Buyer">Previous Buyer</option>
                    <option value="Exhibition">Exhibition</option>
                    <option value="Digital Media">Digital Media</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Showroom</label>
                  <select
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Lead Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
                  >
                    <option value="Hot">🔥 Hot Lead</option>
                    <option value="Warm">⚡ Warm Lead</option>
                    <option value="Cold">❄️ Cold Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Estimated Deal Value (ETB)</label>
                  <input
                    type="number"
                    value={newDealValue}
                    onChange={(e) => setNewDealValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Machinery / Product Inquiry Purpose</label>
                <input
                  type="text"
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  placeholder="e.g. Mug Press Machine Pro & Blank Mugs inquiry"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold shadow-md transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Save Printing Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
