import React, { useState, useEffect } from 'react';
import { Customer, Branch, User, CallLog, CustomerStage, ProductItem, BranchReassignmentEntry, FilterPreset } from '../types/crm';
import { Search, Filter, PhoneCall, ChevronRight, Send, Calculator, Trash2, Edit3, Check, Mail, Users, UserCircle, Phone, Clock, ArrowUpRight, Bookmark, X } from 'lucide-react';

interface CustomerListViewProps {
  customers: Customer[];
  branches: Branch[];
  users: User[];
  callLogs: CallLog[];
  selectedBranchId: string;
  products: ProductItem[];
  theme: 'light' | 'dark';
  onAddCustomer: (newCust: Customer) => void;
  onUpdateCustomer: (updatedCust: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onOpenLogCallForCustomer: (customer: Customer) => void;
  initialSelectedCustomer?: Customer | null;
  filterPresets?: FilterPreset[];
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  customers,
  branches,
  users,
  callLogs,
  selectedBranchId,
  products,
  theme,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onOpenLogCallForCustomer,
  initialSelectedCustomer,
  filterPresets = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialSelectedCustomer || null);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'calls' | 'notes' | 'productRequests' | 'purchaseHistory'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDealValue, setEditDealValue] = useState(0);
  const [editPriority, setEditPriority] = useState<Customer['leadPriority']>('Warm');
  const [editFollowUp, setEditFollowUp] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [calcProductId, setCalcProductId] = useState(products[0]?.id || '');
  const [calcQuantity, setCalcQuantity] = useState(1);
  const [showPresets, setShowPresets] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  useEffect(() => {
    if (selectedCustomer) {
      setEditName(selectedCustomer.customerName);
      setEditCompany(selectedCustomer.companyName || '');
      setEditPhone(selectedCustomer.phoneNumber);
      setEditEmail(selectedCustomer.email || '');
      setEditDealValue(selectedCustomer.dealValue || 0);
      setEditPriority(selectedCustomer.leadPriority || 'Warm');
      setEditFollowUp(selectedCustomer.nextFollowUpDate || '');
      setEditNotes(selectedCustomer.internalNotes || '');
      setIsEditing(false);
      setActiveDetailTab('overview');
    }
  }, [selectedCustomer?.id]);

  const handleSaveInlineEdit = () => {
    if (!selectedCustomer) return;
    const updated: Customer = {
      ...selectedCustomer,
      customerName: editName,
      companyName: editCompany || undefined,
      phoneNumber: editPhone,
      email: editEmail || undefined,
      dealValue: Number(editDealValue),
      leadPriority: editPriority,
      nextFollowUpDate: editFollowUp || undefined,
      updatedAt: new Date().toISOString(),
      internalNotes: editNotes,
    };
    onUpdateCustomer(updated);
    setSelectedCustomer(updated);
    setIsEditing(false);
  };

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

  // Duplicate detection
  const potentialDuplicates = searchTerm.length >= 3
    ? customers.filter(c =>
        c.phoneNumber.includes(searchTerm) ||
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 3)
    : [];
  const hasDuplicates = potentialDuplicates.length > 0;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const assignedUser = selectedCustomer ? users.find(u => u.id === selectedCustomer.assignedUserId) : null;
  const isDark = theme === 'dark';

  const stageBadge = (stage: CustomerStage) => {
    const colors: Record<CustomerStage, string> = {
      Contact: 'bg-sky-950/60 text-sky-300 border-sky-800',
      Lead: 'bg-amber-950/60 text-amber-300 border-amber-800',
      Customer: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
      Client: 'bg-purple-950/60 text-purple-300 border-purple-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[stage]}`}>
        {stage}
      </span>
    );
  };

  const priorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      Hot: 'bg-red-950/60 text-red-400 border-red-800',
      Warm: 'bg-amber-950/60 text-amber-300 border-amber-800',
      Cold: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[priority] || colors.Cold}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border transition-colors ${isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200'}`}>
        <h2 className="text-xl font-bold text-white">Printing Client Directory</h2>
        <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          Showing {filteredCustomers.length} of {customers.length} total printing clients & machinery buyers
        </p>
      </div>

      {/* Duplicate Warning */}
      {hasDuplicates && searchTerm.length >= 3 && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3">
          <p className="text-xs font-bold text-amber-300">⚠ Possible duplicate(s) detected:</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {potentialDuplicates.map(d => (
              <span key={d.id} className="text-[10px] bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded border border-amber-700">
                {d.customerName} ({d.phoneNumber})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Presets Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setShowPresets(!showPresets)} className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 border border-zinc-800 px-2 py-1 rounded">
          <Bookmark className="w-3 h-3" /> Saved Filters ({filterPresets.length})
        </button>
        {showPresets && filterPresets.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {filterPresets.map(fp => (
              <button key={fp.id} onClick={() => { setStageFilter(fp.filters.stage || 'all'); setSourceFilter(fp.filters.source || 'all'); setPriorityFilter(fp.filters.priority || 'all'); setShowPresets(false); }} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded hover:bg-zinc-700 border border-zinc-700">
                {fp.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`p-4 rounded-xl border transition-colors flex flex-wrap items-center gap-3 ${isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200'}`}>
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name, print shop, or phone (09...)"
            className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm border focus:outline-none transition-colors ${
              isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200 placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={`rounded-lg px-3 py-2 text-sm border focus:outline-none transition-colors ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <option value="all">All Stages</option>
            <option value="Contact">Contact</option>
            <option value="Lead">Lead</option>
            <option value="Customer">Customer</option>
            <option value="Client">Client</option>
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={`rounded-lg px-3 py-2 text-sm border focus:outline-none transition-colors ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <option value="all">All Sources</option>
            <option value="Telegram">Telegram</option>
            <option value="Facebook">Facebook</option>
            <option value="Referral">Referral</option>
            <option value="Previous Buyer">Previous Buyer</option>
            <option value="Exhibition">Exhibition</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={`rounded-lg px-3 py-2 text-sm border focus:outline-none transition-colors ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <option value="all">All Priorities</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`rounded-xl border overflow-hidden transition-colors ${selectedCustomer ? 'lg:col-span-2' : 'lg:col-span-3'} ${isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={`text-xs uppercase tracking-wider font-bold border-b ${isDark ? 'bg-zinc-950/80 text-zinc-400 border-zinc-800' : 'bg-slate-50/80 text-slate-600 border-slate-200'}`}>
                <tr>
                  <th className="py-3.5 px-4">Client / Print Shop</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Phone & Quick Actions</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Deal Value</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">No printing clients found matching your filters.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    return (
                      <tr key={cust.id} onClick={() => setSelectedCustomer(cust)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-zinc-800/60 border-l-4 border-amber-500' : isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50/90'}`}>
                        <td className="py-3.5 px-4">
                          <div className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{cust.customerName}</div>
                          <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{cust.companyName || 'Independent Print Shop'}</div>
                        </td>
                        <td className="py-3.5 px-4">{stageBadge(cust.customerStage)}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <a href={`tel:${cust.phoneNumber}`} onClick={(e) => e.stopPropagation()} className={`font-mono text-xs font-bold px-2 py-1 rounded border flex items-center gap-1 transition-colors ${isDark ? 'bg-teal-950/60 text-teal-300 border-zinc-700 hover:bg-zinc-900' : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'}`} title="Click to Call">
                              <PhoneCall className="w-3 h-3" />
                              <span>{cust.phoneNumber}</span>
                            </a>
                            <a href={`https://t.me/+251${cust.phoneNumber.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={`p-1.5 rounded border transition-colors ${isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`} title="Open in Telegram">
                              <Send className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'}`}>{cust.source}</span>
                        </td>
                        <td className={`py-3.5 px-4 font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{cust.dealValue ? `${cust.dealValue.toLocaleString()} ETB` : '—'}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={(e) => { e.stopPropagation(); onOpenLogCallForCustomer(cust); }} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-teal-400 hover:bg-zinc-900' : 'text-teal-700 hover:bg-teal-100'}`} title="Incoming Call Lookup">
                              <PhoneCall className="w-4 h-4" />
                            </button>
                            <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-amber-500' : 'text-zinc-500'}`} />
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

        {selectedCustomer && (
          <div className={`rounded-xl border shadow-sm max-w-[420px] w-full mx-auto flex flex-col sticky top-24 transition-colors ${isDark ? 'bg-[#18181b] border-zinc-800/60 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className={`p-4 border-b flex items-start justify-between ${isDark ? 'border-zinc-800/60' : 'border-slate-200'}`}>
              <div className="flex gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-medium text-sm flex-shrink-0 ${isDark ? 'bg-amber-950/40 text-amber-300 border border-amber-800/60' : 'bg-teal-100 text-teal-800'}`}>
                  {getInitials(selectedCustomer.customerName)}
                </div>
                <div>
                  <p className={`font-medium text-[15px] mb-0.5 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{selectedCustomer.customerName}</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{selectedCustomer.companyName || 'Independent Print Shop'}</p>
                </div>
              </div>
              <select value={selectedCustomer.customerStage} onChange={(e) => { const updated = { ...selectedCustomer, customerStage: e.target.value as CustomerStage, updatedAt: new Date().toISOString() }; setSelectedCustomer(updated); onUpdateCustomer(updated); }} aria-label="Change Customer Stage" className={`text-xs h-7 px-2 border rounded-md font-medium cursor-pointer focus:outline-none transition-colors ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                <option value="Contact">Contact</option>
                <option value="Lead">Lead</option>
                <option value="Customer">Customer</option>
                <option value="Client">Client</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 pt-4">
              <div className={`rounded-lg p-2.5 border ${isDark ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-[11px] mb-1 text-zinc-400">Deal value</p>
                <p className="text-sm font-semibold text-emerald-400">{selectedCustomer.dealValue?.toLocaleString()} ETB</p>
              </div>
              <div className={`rounded-lg p-2.5 border ${isDark ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-[11px] mb-1 text-zinc-400">Priority</p>
                <p className="text-sm font-semibold">{priorityBadge(selectedCustomer.leadPriority)}</p>
              </div>
              <div className={`rounded-lg p-2.5 border ${isDark ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-[11px] mb-1 text-zinc-400">Next follow-up</p>
                <p className="text-sm font-semibold text-zinc-200">{selectedCustomer.nextFollowUpDate || 'None'}</p>
              </div>
            </div>

            {/* Last Contacted & Next Follow-up Due */}
            <div className={`grid grid-cols-2 gap-2 px-4 pt-3 ${isDark ? 'bg-zinc-950/30' : 'bg-slate-50/50'}`}>
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Last contacted:</span>
                <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{selectedCustomer.lastContactedDate || '—'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Phone className="w-3 h-3 text-zinc-500" />
                <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Next due:</span>
                <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{selectedCustomer.nextFollowUpDate || '—'}</span>
              </div>
            </div>

            {/* Branch Reassignment Audit Log */}
            {selectedCustomer.branchReassignmentLog && selectedCustomer.branchReassignmentLog.length > 0 && (
              <div className={`px-4 pt-4 border-t ${isDark ? 'border-zinc-800/60' : 'border-slate-200'}`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Branch Reassignment History</p>
                <div className="space-y-1.5">
                  {selectedCustomer.branchReassignmentLog.map((entry, i) => (
                    <div key={i} className={`text-xs p-2 rounded border ${isDark ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight className="w-3 h-3 text-amber-400" />
                        <span className="font-medium">{entry.previousBranch} → {entry.newBranch}</span>
                      </div>
                      <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{entry.reason} • {new Date(entry.dateTime).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`flex gap-1 px-4 pt-4 border-b ${isDark ? 'border-zinc-800/60' : 'border-slate-200'}`}>
              {(['overview', 'calls', 'notes', 'productRequests', 'purchaseHistory'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveDetailTab(tab)} className={`text-xs pb-2 px-1 font-medium transition-colors ${activeDetailTab === tab ? 'border-b-2 border-amber-400 text-amber-300 font-semibold' : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800'}`}>
                  {tab === 'productRequests' ? 'Product Requests' : tab === 'purchaseHistory' ? 'Purchase History' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeDetailTab === 'overview' && (
              <div className="p-4 space-y-3">
                {!isEditing ? (
                  <>
                    <table className="w-full text-xs mb-3">
                      <tbody>
                        <tr><td className={`py-2 flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}><Phone className="w-3.5 h-3.5" /> Phone</td><td className="text-right py-2 font-mono font-medium text-teal-400">{selectedCustomer.phoneNumber}</td></tr>
                        <tr><td className={`py-2 flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}><Mail className="w-3.5 h-3.5" /> Email</td><td className={`text-right py-2 font-medium ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{selectedCustomer.email || '—'}</td></tr>
                        <tr><td className={`py-2 flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}><Users className="w-3.5 h-3.5" /> Source</td><td className={`text-right py-2 font-medium ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{selectedCustomer.source}</td></tr>
                        <tr><td className={`py-2 flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}><UserCircle className="w-3.5 h-3.5" /> Assigned agent</td><td className={`text-right py-2 font-medium ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{assignedUser?.name || 'Ephrem Mamo'}</td></tr>
                      </tbody>
                    </table>
                    <div className={`rounded-lg p-3.5 border ${isDark ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-slate-50 border-slate-100'} space-y-2.5`}>
                      <p className="text-xs font-medium text-zinc-400">Quick quote calculator</p>
                      <select value={calcProductId} onChange={(e) => setCalcProductId(e.target.value)} aria-label="Select Product" className={`w-full text-xs border rounded-lg p-2.5 font-medium focus:outline-none transition-colors ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                        {products.map(p => <option key={p.id} value={p.id}>{p.itemName} — {p.itemPrice.toLocaleString()} ETB</option>)}
                      </select>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-zinc-400 font-medium">Qty:</span>
                          <input type="number" min="1" value={calcQuantity} onChange={(e) => setCalcQuantity(Number(e.target.value))} aria-label="Quantity" className={`w-16 text-xs border rounded-lg py-1.5 px-2 text-center font-bold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'}`} />
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-2">
                          <span className="text-xs font-bold text-emerald-400">{((products.find(p => p.id === calcProductId)?.itemPrice || 0) * calcQuantity).toLocaleString()} ETB</span>
                          <button onClick={() => { const prod = products.find(p => p.id === calcProductId); if (prod) { const updated = { ...selectedCustomer, dealValue: prod.itemPrice * calcQuantity, updatedAt: new Date().toISOString() }; setSelectedCustomer(updated); onUpdateCustomer(updated); } }} className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-amber-700 transition-colors">Apply quote</button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={`space-y-2.5 text-xs p-3.5 rounded-lg border ${isDark ? 'bg-amber-950/20 border-zinc-700/60 text-zinc-200' : 'bg-teal-50/40 border-teal-200 text-slate-800'}`}>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={`w-full border rounded-lg px-2.5 py-1.5 font-semibold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-100' : 'bg-white border-teal-300 text-slate-800'}`} />
                    <input type="text" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} className={`w-full border rounded-lg px-2.5 py-1.5 font-semibold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-100' : 'bg-white border-teal-300 text-slate-800'}`} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={`w-full border rounded-lg px-2.5 py-1.5 font-mono font-semibold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-100' : 'bg-white border-teal-300 text-slate-800'}`} />
                      <input type="number" value={editDealValue} onChange={(e) => setEditDealValue(Number(e.target.value))} className={`w-full border rounded-lg px-2.5 py-1.5 font-bold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-emerald-400' : 'bg-white border-teal-300 text-emerald-700'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as any)} className={`w-full border rounded-lg px-2 py-1.5 font-semibold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-white border-teal-300 text-slate-800'}`}>
                        <option value="Hot">Hot</option>
                        <option value="Warm">Warm</option>
                        <option value="Cold">Cold</option>
                      </select>
                      <input type="date" value={editFollowUp} onChange={(e) => setEditFollowUp(e.target.value)} className={`w-full border rounded-lg px-2 py-1.5 font-semibold text-xs ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-white border-teal-300 text-slate-800'}`} />
                    </div>
                    <button onClick={handleSaveInlineEdit} className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors mt-2">Save Changes</button>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'calls' && (
              <div className="p-4">
                <div className="flex flex-col gap-3">
                  {callLogs.filter(cl => cl.customerId === selectedCustomer.id).length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-6 text-center">No past calls logged yet.</p>
                  ) : (
                    callLogs.filter(cl => cl.customerId === selectedCustomer.id).map((log) => (
                      <div key={log.id} className={`border-b pb-3 ${isDark ? 'border-zinc-800/60' : 'border-slate-200'}`}>
                        <div className="flex justify-between text-xs">
                          <span className={`font-medium ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{log.purpose}</span>
                          <span className="text-zinc-400">{log.durationMinutes} mins</span>
                        </div>
                        <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{users.find(u => u.id === log.userId)?.name || 'Ephrem Mamo'} &middot; {new Date(log.dateTime).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{log.remark}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeDetailTab === 'notes' && (
              <div className="p-4">
                <textarea placeholder="Add an internal note about this client" value={editNotes} onChange={(e) => { setEditNotes(e.target.value); const updated = { ...selectedCustomer, internalNotes: e.target.value, updatedAt: new Date().toISOString() }; setSelectedCustomer(updated); onUpdateCustomer(updated); }} className={`w-full min-h-[90px] text-xs p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`}></textarea>
                <p className="text-[10px] text-zinc-500 mt-1">Notes auto-save as you type.</p>
              </div>
            )}

            {activeDetailTab === 'productRequests' && (
              <div className="p-4">
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Product requests for this client will appear here.</p>
              </div>
            )}

            {activeDetailTab === 'purchaseHistory' && (
              <div className="p-4">
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Purchase history for this client will appear here.</p>
              </div>
            )}

            <div className={`flex gap-2 p-4 border-t mt-auto ${isDark ? 'border-zinc-800/60 bg-zinc-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
              <button onClick={() => setIsEditing(!isEditing)} className={`flex-1 text-xs py-2 px-3 border rounded-lg font-medium flex items-center justify-center gap-1 transition-colors ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>
              <button onClick={() => onOpenLogCallForCustomer(selectedCustomer)} className="flex-1 text-xs py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1 transition-colors">
                <PhoneCall className="w-3.5 h-3.5" /> Log new call
              </button>
              <button onClick={() => { if (confirm(`Delete ${selectedCustomer.customerName}?`)) { onDeleteCustomer(selectedCustomer.id); setSelectedCustomer(null); } }} className={`border p-2 rounded-lg transition-colors ${isDark ? 'border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-900/40' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'}`} title="Delete client">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
