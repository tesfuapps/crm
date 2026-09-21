import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Customer, Branch, User, CallLog, ProductItem, ProductSale, FilterPreset } from '../types/crm';
import { Search, Filter, PhoneCall, ChevronRight, Trash2, Edit3, Mail, Users, UserCircle, Phone, Clock, ArrowUpRight, Bookmark, X, FileText } from 'lucide-react';
import { generateProformaInvoice } from '../utils/proformaInvoice';

const normalizePriority = (priority: string) => priority === 'Hot' || priority === 'Warm' ? priority : 'Normal';

interface CustomerListViewProps {
  customers: Customer[];
  branches: Branch[];
  users: User[];
  callLogs: CallLog[];
  sales: ProductSale[];
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
  sales,
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
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialSelectedCustomer || null);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'calls' | 'notes' | 'purchaseHistory'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBusiness, setEditBusiness] = useState({ tinNumber: '', subCity: '', businessType: '', preferredChannel: '' });
  const [editPriority, setEditPriority] = useState<'Hot' | 'Warm' | 'Normal'>('Normal');
  const [editFollowUp, setEditFollowUp] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSelectedCustomer) {
      setSelectedCustomer(initialSelectedCustomer);
    } else {
      setSelectedCustomer(null);
    }
  }, [initialSelectedCustomer]);

  useEffect(() => {
    if (!selectedCustomer?.id) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.focus();
    const animation = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? undefined : drawerRef.current?.animate(
      [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }],
      { duration: 300, easing: 'ease-out' }
    );
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedCustomer(null);
      }
      if (event.key === 'Tab') {
        const elements = drawerRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
        if (!elements?.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === drawerRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === drawerRef.current)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      animation?.cancel();
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [selectedCustomer?.id]);

  useEffect(() => {
    if (selectedCustomer) {
      setEditName(selectedCustomer.customerName);
      setEditCompany(selectedCustomer.companyName || '');
      setEditPhone(selectedCustomer.phoneNumber);
      setEditEmail(selectedCustomer.email || '');
      setEditBusiness({
        tinNumber: selectedCustomer.tinNumber || '',
        subCity: selectedCustomer.subCity || '',
        businessType: selectedCustomer.businessType || '',
        preferredChannel: selectedCustomer.preferredChannel || '',
      });
      setEditPriority(normalizePriority(selectedCustomer.leadPriority));
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
      tinNumber: editBusiness.tinNumber.trim() || undefined,
      subCity: editBusiness.subCity.trim() || undefined,
      businessType: editBusiness.businessType.trim() || undefined,
      preferredChannel: editBusiness.preferredChannel.trim() || undefined,
      leadPriority: editPriority,
      nextFollowUpDate: editFollowUp || undefined,
      updatedAt: new Date().toISOString(),
      internalNotes: editNotes,
    };
    onUpdateCustomer(updated);
    setSelectedCustomer(updated);
    setIsEditing(false);
  };

  const lifetimeSpentByCustomer = useMemo(() => {
    const totals = new Map<string, number>();
    sales.forEach(sale => {
      if (sale.status !== 'cancelled') {
        totals.set(sale.customerId, (totals.get(sale.customerId) || 0) + sale.saleAmount);
      }
    });
    return totals;
  }, [sales]);

  const latestCallByCustomer = useMemo(() => {
    const latest = new Map<string, string>();
    callLogs.forEach(log => {
      const previous = latest.get(log.customerId);
      if (Number.isFinite(Date.parse(log.dateTime)) && (!previous || Date.parse(log.dateTime) > Date.parse(previous))) {
        latest.set(log.customerId, log.dateTime);
      }
    });
    return latest;
  }, [callLogs]);

  const customerSales = sales.filter(sale => sale.customerId === selectedCustomer?.id)
    .sort((a, b) => Date.parse(b.saleDate) - Date.parse(a.saleDate));
  const businessFields = [
    { key: 'tinNumber', label: 'TIN number' },
    { key: 'subCity', label: 'Sub-city' },
    { key: 'businessType', label: 'Business type' },
    { key: 'preferredChannel', label: 'Preferred channel' },
  ] as const;
  const query = searchTerm.trim().toLowerCase();
  const filteredCustomers = customers.filter(c => {
    const matchesBranch = selectedBranchId === 'all' || c.branchId === selectedBranchId;
    const matchesPriority = priorityFilter === 'all' || normalizePriority(c.leadPriority) === priorityFilter;
    const matchesSearch = [c.customerName, c.companyName, c.phoneNumber, c.email, c.tinNumber, c.subCity, c.businessType, c.preferredChannel]
      .some(value => value?.toLowerCase().includes(query));
    return matchesBranch && matchesPriority && matchesSearch;
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

  const formatCallDuration = (minutes: number) => {
    const seconds = Math.max(0, Math.round(minutes * 60));
    return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
  };

  const assignedUser = selectedCustomer ? users.find(u => u.id === selectedCustomer.assignedUserId) : null;
  const isDark = theme === 'dark';

  const formatDate = (date?: string) => {
    if (!date || !Number.isFinite(Date.parse(date))) return '—';
    return new Date(date.length === 10 ? `${date}T00:00:00` : date).toLocaleDateString();
  };

  const priorityBadge = (priority: string) => {
    const normalized = normalizePriority(priority);
    const colors = {
      Hot: 'bg-red-950/60 text-red-400 border-red-800',
      Warm: 'bg-amber-950/60 text-amber-300 border-amber-800',
      Normal: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[normalized]}`}>
        {normalized}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border transition-colors ${isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200'}`}>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Customer Directory</h2>
        <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          Showing {filteredCustomers.length} of {customers.length} customers
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
              <button key={fp.id} onClick={() => { setPriorityFilter(fp.filters.priority && fp.filters.priority !== 'all' ? normalizePriority(fp.filters.priority) : 'all'); setShowPresets(false); }} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded hover:bg-zinc-700 border border-zinc-700">
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
            aria-label="Search customers"
            placeholder="Search customers, businesses, phone, or TIN"
            className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm border focus:outline-none transition-colors ${
              isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200 placeholder-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select aria-label="Filter by priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={`rounded-lg px-3 py-2 text-sm border focus:outline-none transition-colors ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <option value="all">All Priorities</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden transition-colors w-full flex-1 ${isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className={`text-xs uppercase tracking-wider font-bold border-b ${isDark ? 'bg-zinc-950/80 text-zinc-400 border-zinc-800' : 'bg-slate-50/80 text-slate-600 border-slate-200'}`}>
                <tr>
                  <th className="py-3.5 px-4">Customer / Business</th>
                  <th className="py-3.5 px-4">Main Branch & Streak</th>
                  <th className="py-3.5 px-4">Representative</th>
                  <th className="py-3.5 px-4">Lifetime Spent</th>
                  <th className="py-3.5 px-4">Latest Call Date</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">No customers found matching your filters.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    const rep = users.find(user => user.id === cust.assignedUserId);
                    return (
                      <tr key={cust.id} onClick={() => setSelectedCustomer(cust)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-zinc-800/60 border-l-4 border-amber-500' : isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50/90'}`}>
                        <td className="py-3.5 px-4">
                          <div className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{cust.customerName}</div>
                          <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{cust.companyName || 'Individual customer'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {(() => {
                            const b = branches.find(br => br.id === (cust.mainBranchId || cust.branchId));
                            const maxStreak = Math.max(0, ...Object.values(cust.consecutivePurchaseStreak || {}));
                            return (
                              <div className="space-y-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                                  {b?.name || 'Showroom'}
                                </span>
                                <div className="text-[10px] text-zinc-400 font-mono">
                                  Streak: {maxStreak}/5
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'}`}>
                              {rep ? getInitials(rep.name) : '—'}
                            </span>
                            <span className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{rep?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className={`py-3.5 px-4 font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{(lifetimeSpentByCustomer.get(cust.id) || 0).toLocaleString()} ETB</td>
                        <td className={`py-3.5 px-4 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{formatDate(latestCallByCustomer.get(cust.id))}</td>
                        <td className="py-3.5 px-4">{priorityBadge(cust.leadPriority)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={(e) => { e.stopPropagation(); onOpenLogCallForCustomer(cust); }} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-teal-400 hover:bg-zinc-900' : 'text-teal-700 hover:bg-teal-100'}`} title="Incoming Call Lookup">
                              <PhoneCall className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedCustomer(cust); }} aria-label={`View ${cust.customerName}`} className="p-1.5 rounded-lg hover:bg-zinc-500/10">
                              <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-amber-500' : 'text-zinc-500'}`} />
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

        {selectedCustomer && (
          <div className="fixed inset-0 z-40 !m-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
          <div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Customer details" tabIndex={-1} onClick={event => event.stopPropagation()} className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] border-l shadow-2xl flex flex-col outline-none ${isDark ? 'bg-[#161616] border-neutral-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className={`p-4 border-b flex items-start justify-between ${isDark ? 'border-zinc-800/60' : 'border-slate-200'}`}>
              <div className="flex gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-medium text-sm flex-shrink-0 ${isDark ? 'bg-amber-950/40 text-amber-300 border border-amber-800/60' : 'bg-teal-100 text-teal-800'}`}>
                  {getInitials(selectedCustomer.customerName)}
                </div>
              <div>
                <p className={`font-medium text-[15px] mb-0.5 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{selectedCustomer.customerName}</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{selectedCustomer.companyName || 'Individual customer'} • <span className="font-mono text-teal-400">{selectedCustomer.phoneNumber}</span></p>
              </div>
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)} aria-label="Close customer details" className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pb-4">
            <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
              <span className="px-2.5 py-1 text-xs font-medium border border-neutral-700 rounded-md">
                {branches.find(branch => branch.id === (selectedCustomer.mainBranchId || selectedCustomer.branchId))?.name || 'Unassigned branch'}
              </span>
              <span className="px-2.5 py-1 text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-md">
                Streak: {Math.max(0, ...Object.values(selectedCustomer.consecutivePurchaseStreak || {}))}/5
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 pt-4">
              <div className={`rounded-lg p-2.5 border ${isDark ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-[11px] mb-1 text-zinc-400">Lifetime spent</p>
                <p className="text-sm font-semibold text-emerald-400">{(lifetimeSpentByCustomer.get(selectedCustomer.id) || 0).toLocaleString()} ETB</p>
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
              {(['overview', 'calls', 'notes', 'purchaseHistory'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveDetailTab(tab)} className={`text-xs pb-2 px-1 font-medium transition-colors ${activeDetailTab === tab ? 'border-b-2 border-amber-400 text-amber-300 font-semibold' : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800'}`}>
                  {tab === 'purchaseHistory' ? 'Purchase History' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                        <tr><td className={`py-2 flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}><UserCircle className="w-3.5 h-3.5" /> Assigned rep</td><td className={`text-right py-2 font-medium ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{assignedUser?.name || 'Unassigned'}</td></tr>
                        {businessFields.map(field => (
                          <tr key={field.key}>
                            <td className={`py-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{field.label}</td>
                            <td className={`text-right py-2 font-medium break-words ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{selectedCustomer[field.key] || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div className={`space-y-2.5 text-xs p-3.5 rounded-lg border ${isDark ? 'bg-amber-950/20 border-zinc-700/60 text-zinc-200' : 'bg-teal-50/40 border-teal-200 text-slate-800'}`}>
                    <label className="block space-y-1">
                      <span>Customer name</span>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={`w-full border rounded-lg px-2.5 py-1.5 font-semibold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-100' : 'bg-white border-teal-300 text-slate-800'}`} />
                    </label>
                    <label className="block space-y-1">
                      <span>Business name</span>
                      <input type="text" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} className={`w-full border rounded-lg px-2.5 py-1.5 font-semibold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-100' : 'bg-white border-teal-300 text-slate-800'}`} />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block space-y-1">
                        <span>Phone</span>
                        <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={`w-full border rounded-lg px-2.5 py-1.5 font-mono font-semibold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-100' : 'bg-white border-teal-300 text-slate-800'}`} />
                      </label>
                      <label className="block space-y-1">
                        <span>Email</span>
                        <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={`w-full border rounded-lg px-2.5 py-1.5 font-semibold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-100' : 'bg-white border-teal-300 text-slate-800'}`} />
                      </label>
                      {businessFields.map(field => (
                        <label key={field.key} className="block space-y-1">
                          <span>{field.label}</span>
                          <input type="text" value={editBusiness[field.key]} onChange={(e) => setEditBusiness(previous => ({ ...previous, [field.key]: e.target.value }))} className={`w-full border rounded-lg px-2.5 py-1.5 font-semibold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-100' : 'bg-white border-teal-300 text-slate-800'}`} />
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select aria-label="Priority" value={editPriority} onChange={(e) => setEditPriority(normalizePriority(e.target.value))} className={`w-full border rounded-lg px-2 py-1.5 font-semibold ${isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-white border-teal-300 text-slate-800'}`}>
                        <option value="Hot">Hot</option>
                        <option value="Warm">Warm</option>
                        <option value="Normal">Normal</option>
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
                    callLogs.filter(cl => cl.customerId === selectedCustomer.id).map((log, logIndex) => (
                      <div key={log.id} className={`border-b pb-3 ${isDark ? 'border-zinc-800/60' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              TTM-{String(logIndex + 1).padStart(5, '0')}
                            </span>
                            <span className={`font-medium ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{log.purpose}</span>
                          </div>
                          <span className="text-zinc-400 font-mono">{formatCallDuration(log.durationMinutes)}</span>
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

            {activeDetailTab === 'purchaseHistory' && (
              <div className="p-4 space-y-3">
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Lifetime spent includes confirmed purchases only. Cancelled purchases are excluded.</p>
                {customerSales.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-6 text-center">No purchases recorded yet.</p>
                ) : (
                  customerSales.map(sale => (
                    <div key={sale.id} className={`rounded-lg border p-3 space-y-2 ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <span className="font-semibold">{products.find(product => product.id === sale.itemId)?.itemName || `Unavailable product (${sale.itemId})`}</span>
                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${sale.status === 'cancelled' ? 'bg-red-950/60 text-red-400' : 'bg-emerald-950/60 text-emerald-300'}`}>
                          {sale.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}
                        </span>
                      </div>
                      <div className={`flex flex-wrap justify-between gap-2 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        <span>{formatDate(sale.saleDate)}</span>
                        <span>Qty: {sale.quantity.toLocaleString()}</span>
                        <span className="font-semibold">{sale.saleAmount.toLocaleString()} ETB</span>
                      </div>
                      {(sale.carrier || sale.ticketNumber || sale.destinationCity) && (
                        <div className={`flex flex-wrap gap-2 text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                          {sale.carrier && <span className="bg-blue-950/40 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800/40">🚌 {sale.carrier}</span>}
                          {sale.ticketNumber && <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">#{sale.ticketNumber}</span>}
                          {sale.destinationCity && <span className="bg-amber-950/40 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800/40">📍 {sale.destinationCity}</span>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            </div>
            <div className={`flex gap-2 p-4 border-t shrink-0 mt-auto ${isDark ? 'border-zinc-800/60 bg-zinc-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
              <button onClick={() => { setActiveDetailTab('overview'); setIsEditing(!isEditing); }} className={`flex-1 text-xs py-2 px-3 border rounded-lg font-medium flex items-center justify-center gap-1 transition-colors ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>
              <button onClick={() => { setSelectedCustomer(null); onOpenLogCallForCustomer(selectedCustomer); }} className="flex-1 text-xs py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1 transition-colors">
                <PhoneCall className="w-3.5 h-3.5" /> Log new call
              </button>
              <button
                onClick={() => {
                  const custSales = sales.filter(s => s.customerId === selectedCustomer.id);
                  if (custSales.length === 0) {
                    alert('No sales recorded for this customer yet. Record a sale first to generate a proforma invoice.');
                    return;
                  }
                  generateProformaInvoice({ customer: selectedCustomer, sales: custSales, products, branches, users });
                }}
                className={`text-xs py-2 px-3 border rounded-lg font-medium flex items-center justify-center gap-1 transition-colors ${isDark ? 'border-emerald-800 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                title="Generate Proforma Invoice"
              >
                <FileText className="w-3.5 h-3.5" /> Invoice
              </button>
              <button onClick={() => { if (confirm(`Delete ${selectedCustomer.customerName}?`)) { onDeleteCustomer(selectedCustomer.id); setSelectedCustomer(null); } }} className={`border p-2 rounded-lg transition-colors ${isDark ? 'border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-900/40' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'}`} title="Delete client">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          </div>
        )}
    </div>
  );
};
