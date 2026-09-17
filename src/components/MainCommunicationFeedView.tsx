import React, { useState, useEffect } from 'react';
import { Customer, CallLog, Branch, User, ProductItem } from '../types/crm';
import { PhoneCall, Filter, Search, Calendar, Clock, UserCheck, CheckCircle2, AlertTriangle, ArrowRight, X, Bookmark, Download, Save, Trash2, TrendingUp, Package } from 'lucide-react';

interface MainCommunicationFeedViewProps {
  customers: Customer[];
  callLogs: CallLog[];
  users: User[];
  branches: Branch[];
  currentUser: User;
  selectedBranchId: string;
  theme: 'light' | 'dark';
  onSelectCustomer: (customer: Customer) => void;
  onOpenLogCall: () => void;
  products: ProductItem[];
}

const CALL_STATUSES = [
  { label: 'Sales', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
  { label: 'Evaluation', color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10' },
  { label: 'Service', color: 'border-violet-500/30 text-violet-400 bg-violet-500/10' },
  { label: 'Out of Stock', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10' },
  { label: 'Pre-order', color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' },
  { label: 'Complaint', color: 'border-rose-500/30 text-rose-400 bg-rose-500/10' },
  { label: 'Out of List', color: 'border-neutral-700 text-neutral-400 bg-neutral-800/60' },
] as const;

interface CommPreset {
  id: string;
  name: string;
  statuses: string[];
  branchId: string;
  userId: string;
  customerType: string;
  dateRange: string;
}

export const MainCommunicationFeedView: React.FC<MainCommunicationFeedViewProps> = ({
  customers,
  callLogs,
  users,
  branches,
  currentUser,
  selectedBranchId,
  theme,
  onSelectCustomer,
  onOpenLogCall,
  products,
}) => {
  const isDark = theme === 'dark';
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(selectedBranchId);
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [customerType, setCustomerType] = useState<string>('All');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('this_week');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'feed' | 'unresolved' | 'my-calls'>('feed');
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null);

  // Saved Presets state
  const [savedPresets, setSavedPresets] = useState<CommPreset[]>(() => {
    const saved = localStorage.getItem('ttm_crm_comm_presets');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  useEffect(() => {
    localStorage.setItem('ttm_crm_comm_presets', JSON.stringify(savedPresets));
  }, [savedPresets]);

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filteredLogs = callLogs.filter(log => {
    const cust = customers.find(c => c.id === log.customerId);
    if (!cust) return false;

    if (selectedBranch !== 'all') {
      const branchObj = branches.find(b => b.id === selectedBranch);
      const custBranch = branches.find(b => b.id === cust.branchId)?.name.toLowerCase() || '';
      if (selectedBranch === 'bole' && !custBranch.includes('bole')) return false;
      if (selectedBranch === 'piassa' && !custBranch.includes('piassa')) return false;
      if (selectedBranch === 'mexico' && !custBranch.includes('mexico')) return false;
      if (branchObj && cust.branchId !== selectedBranch) return false;
    }

    if (selectedRep !== 'all') {
      const repObj = users.find(u => u.id === log.userId);
      const repName = repObj ? repObj.name.toLowerCase() : '';
      if (selectedRep === 'ephrem' && !repName.includes('ephrem')) return false;
      if (selectedRep === 'kidus' && !repName.includes('kidus')) return false;
      if (selectedRep === 'mekdes' && !repName.includes('mekdes')) return false;
      if (repObj && log.userId !== selectedRep) return false;
    }

    if (customerType !== 'All' && cust.customerType !== customerType) return false;

    const status = (log as any).callStatus || 'Sales';
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(status)) return false;

    const logDate = new Date(log.dateTime);
    const logDateStr = log.dateTime.split('T')[0];
    if (selectedDateRange === 'today' && logDateStr !== todayStr) return false;
    if (selectedDateRange === 'yesterday' && logDateStr !== yesterdayStr) return false;
    if (selectedDateRange === 'this_week' && logDate < oneWeekAgo) return false;
    if (selectedDateRange === 'last_week' && (logDate < twoWeeksAgo || logDate >= oneWeekAgo)) return false;
    if (selectedDateRange === 'this_month' && logDate < oneMonthAgo) return false;

    if (activeTab === 'my-calls' && log.userId !== currentUser.id) return false;
    if (activeTab === 'unresolved' && cust.nextFollowUpDate && cust.nextFollowUpDate < todayStr) {
      return false;
    }

    if (selectedProduct !== 'all') {
      if (log.productId !== selectedProduct && log.unlistedProductName !== selectedProduct) {
        return false;
      }
    }

    return true;
  });

  // Group logs by date
  const groupedByDate: Record<string, CallLog[]> = {};
  filteredLogs.forEach(log => {
    const dateKey = log.dateTime.split('T')[0];
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(log);
  });
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const statusCounts: Record<string, number> = {
    Sales: 0,
    Evaluation: 0,
    Service: 0,
    'Out of List': 0,
    'Out of Stock': 0,
    'Pre-order': 0,
    Complaint: 0,
  };
  let totalMinutes = 0;
  let newCustCount = 0;
  let oldCustCount = 0;

  filteredLogs.forEach(log => {
    const status = (log as any).callStatus || 'Sales';
    if (statusCounts[status] !== undefined) statusCounts[status]++;
    else statusCounts['Sales']++;

    totalMinutes += log.durationMinutes || 0;
    const cust = customers.find(c => c.id === log.customerId);
    if (cust) {
      if (cust.customerType === 'New') newCustCount++;
      else oldCustCount++;
    }
  });

  const getRollupTitle = () => {
    if (selectedDateRange === 'today') return 'TODAY AT A GLANCE ROLLUP (ALL 7 STATUSES)';
    if (selectedDateRange === 'this_week') return 'THIS WEEK AT A GLANCE ROLLUP (ALL 7 STATUSES)';
    return 'FILTERED COMMUNICATIONS ROLLUP (ALL 7 STATUSES)';
  };

  const handleSaveFilter = () => {
    setShowSaveModal(true);
  };

  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    const newPreset: CommPreset = {
      id: 'cp_' + Date.now(),
      name: newPresetName,
      statuses: selectedStatuses,
      branchId: selectedBranch,
      userId: selectedRep,
      customerType,
      dateRange: selectedDateRange,
    };
    setSavedPresets(prev => [...prev, newPreset]);
    setNewPresetName('');
    setShowSaveModal(false);
  };

  const applyPreset = (preset: CommPreset) => {
    setSelectedStatuses(preset.statuses);
    setSelectedBranch(preset.branchId);
    setSelectedRep(preset.userId);
    setCustomerType(preset.customerType);
    setSelectedDateRange(preset.dateRange);
  };

  const deletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedPresets(prev => prev.filter(p => p.id !== id));
  };

  const exportToCSV = () => {
    const header = "Communication ID,Date & Time,Sales Rep,Customer Name,Company Name,Phone,Branch,Call Status,Purpose,Duration,Customer Type,Remark\n";
    const rows = filteredLogs.map((log, index) => {
      const cust = customers.find(c => c.id === log.customerId);
      const rep = users.find(u => u.id === log.userId);
      const branch = branches.find(b => b.id === cust?.branchId);
      const status = (log as any).callStatus || 'Sales';
      const callCode = `TTM-${String(index + 1).padStart(5, '0')}`;
      return `"${callCode}","${log.dateTime}","${rep?.name || 'Staff'}","${cust?.customerName || ''}","${cust?.companyName || ''}","${cust?.phoneNumber || ''}","${branch?.name || ''}","${status}","${log.purpose}","${log.durationMinutes}m 00s","${cust?.customerType || 'New'}","${log.remark.replace(/"/g, '""')}"`;
    }).join("\n");

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TTM_Communications_${selectedDateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    exportToCSV();
  };

  const formatDuration = (seconds?: number, minutes?: number) => {
    const totalSecs = seconds ?? (minutes ? minutes * 60 : 0);
    if (!totalSecs) return '0s';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m 00s`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  const getStatusBadge = (status: string) => {
    const styleMap: Record<string, string> = {
      Sales: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      Evaluation: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      Service: 'border-violet-500/30 text-violet-400 bg-violet-500/10',
      'Out of Stock': 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      'Pre-order': 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
      Complaint: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
      'Out of List': 'border-neutral-700 text-neutral-400 bg-neutral-800/60',
    };
    return <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${styleMap[status] || styleMap.Sales}`}>{status}</span>;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const cardBg = 'bg-[#18181b] border-zinc-800/60';
  const inputBg = 'bg-[#121212] border-neutral-700 text-neutral-200';

  const selectedCustomer = selectedCallLog ? customers.find(c => c.id === selectedCallLog.customerId) : null;

  return (
    <div className="flex flex-col gap-5 w-full relative max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-[#18181b] border border-neutral-800/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">Main Communications Feed</h2>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-0.5">
            Real-time showroom communication stream and daily status rollups.
          </p>
        </div>
        <button onClick={onOpenLogCall} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors">
          + Log Communication
        </button>
      </div>

      {/* TOP HORIZONTAL FILTER BAR (Single Line) */}
      <div className="w-full bg-[#181818] border border-neutral-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Branch Dropdown */}
            <select 
              value={selectedBranch} 
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="h-9 bg-[#121212] border border-neutral-700 rounded-lg px-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all">All Branches</option>
              <option value="bole">Bole Printing Showroom</option>
              <option value="piassa">Piassa Retail Branch</option>
              <option value="mexico">Mexico Machinery Hub</option>
            </select>

            {/* Sales Rep Dropdown */}
            <select 
              value={selectedRep} 
              onChange={(e) => setSelectedRep(e.target.value)}
              className="h-9 bg-[#121212] border border-neutral-700 rounded-lg px-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all">All Reps</option>
              <option value="ephrem">Ephrem Mamo</option>
              <option value="kidus">Kidus Alemayehu</option>
              <option value="mekdes">Mekdes Zewdu</option>
            </select>

            {/* Customer Type Toggle */}
            <div className="h-9 bg-[#121212] border border-neutral-700 rounded-lg p-0.5 flex items-center text-xs">
              {['All', 'New', 'Old'].map((type) => (
                <button
                  key={type}
                  onClick={() => setCustomerType(type)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    customerType === type 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Date Range Selector */}
            <select 
              value={selectedDateRange} 
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="h-9 bg-[#121212] border border-neutral-700 rounded-lg px-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
            </select>

            {/* Product Filter Dropdown */}
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="h-9 bg-[#121212] border border-neutral-700 rounded-lg px-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all">All Products ▾</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.itemName}</option>
              ))}
            </select>
          </div>

          {/* Export Actions & Save View Aligned Far Right */}
          <div className="flex items-center gap-2">
            {savedPresets.length > 0 && (
              <select onChange={(e) => { const p = savedPresets.find(x => x.id === e.target.value); if (p) applyPreset(p); }} className="h-9 bg-[#121212] border border-neutral-700 rounded-lg px-2 text-xs font-medium text-neutral-300">
                <option value="">Saved Views ({savedPresets.length})...</option>
                {savedPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <button 
              onClick={handleSaveFilter}
              className="h-9 px-3 bg-[#222] hover:bg-[#2a2a2a] border border-neutral-700 rounded-lg text-xs font-medium text-neutral-300 transition-colors flex items-center gap-1.5"
            >
              💾 Save View
            </button>
            <button 
              onClick={exportToCSV}
              className="h-9 px-3 bg-[#222] hover:bg-[#2a2a2a] border border-neutral-700 rounded-lg text-xs font-medium text-neutral-300 transition-colors"
            >
              CSV
            </button>
            <button 
              onClick={exportToExcel}
              className="h-9 px-3 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/50 rounded-lg text-xs font-medium text-emerald-300 transition-colors"
            >
              Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* COMPACT 7-STATUS ROLLUP CARDS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>{getRollupTitle()}</span>
          </h3>
          <span className="text-xs font-mono text-neutral-400">{filteredLogs.length} calls • {formatDuration(totalMinutes * 60)} total</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {CALL_STATUSES.map(statusObj => {
            const status = statusObj.label;
            const isActive = selectedStatuses.includes(status);
            return (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-[#181818] border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 truncate w-full text-center">
                  {status}
                </span>
                <span className="text-base font-bold text-neutral-100 mt-0.5 font-mono">
                  {statusCounts[status]}
                </span>
              </button>
            );
          })}
          <div className="flex flex-col items-center justify-center p-2 rounded-lg border bg-[#18181b] border-neutral-800 text-neutral-300">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 truncate w-full text-center">New / Old</span>
            <span className="text-sm font-bold text-amber-300 mt-0.5 font-mono">{newCustCount} / {oldCustCount}</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg text-xs font-semibold">
          {(['feed', 'unresolved', 'my-calls'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md capitalize transition-colors ${activeTab === tab ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {tab === 'my-calls' ? 'My Calls' : tab}
            </button>
          ))}
        </div>
        <span className="text-xs text-zinc-400 font-mono">Showing {filteredLogs.length} communications • {formatDuration(totalMinutes * 60)} total</span>
      </div>

      {/* Date-Grouped Feeds (Full Width) with Call ID & Min+Sec Duration */}
      <div className="space-y-6">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center rounded-xl border bg-[#18181b] border-neutral-800">
            <p className="text-xs text-neutral-500">No communication logs match the current filters.</p>
          </div>
        ) : (
          sortedDates.map(dateStr => {
            const dayLogs = groupedByDate[dateStr];
            const dayTotalSecs = dayLogs.reduce((s, l) => s + ((l.durationMinutes || 0) * 60), 0);
            const isToday = dateStr === todayStr;
            const formattedDate = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date Section Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#1c1c1c] rounded-lg border border-neutral-800 text-xs font-semibold text-amber-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-neutral-200">{formattedDate}</span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-medium">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">
                    {dayLogs.length} calls • {formatDuration(dayTotalSecs)}
                  </span>
                </div>

                <div className="rounded-xl border overflow-hidden bg-[#141414] border-neutral-800/80 shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[11px] font-bold uppercase text-neutral-400 border-b border-neutral-800/80 bg-zinc-950/80">
                      <tr>
                        <th className="py-3 px-4">Call ID</th>
                        <th className="py-3 px-4 text-center">REP</th>
                        <th className="py-3 px-4">Customer & Print Shop</th>
                        <th className="py-3 px-4">Purpose</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                      {dayLogs.map((log, index) => {
                        const cust = customers.find(c => c.id === log.customerId);
                        const rep = users.find(u => u.id === log.userId);
                        const status = (log as any).callStatus || 'Sales';
                        const isSelected = selectedCallLog?.id === log.id;
                        const callCode = `TTM-${String(index + 1).padStart(5, '0')}`;
                        const cleanPhone = cust?.phoneNumber ? cust.phoneNumber.replace(/^0/, '') : '';

                        return (
                          <tr
                            key={log.id}
                            onClick={() => setSelectedCallLog(log)}
                            className={`border-b border-neutral-800/50 hover:bg-[#1a1a1a] transition-colors cursor-pointer group ${isSelected ? 'bg-amber-950/25 border-l-2 border-amber-500' : ''}`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-mono text-[11px] font-semibold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                {callCode}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center">
                              <div 
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-xs tracking-wider cursor-default"
                                title={`${rep?.name || 'Staff'} (Sales Rep)`}
                              >
                                {getInitials(rep?.name || 'Staff')}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm font-medium text-neutral-100 group-hover:text-amber-400 transition-colors">
                                {cust?.customerName || 'Unknown'}
                              </span>
                              <p className="text-xs text-neutral-400 mt-0.5">
                                {cust?.companyName || 'Independent'} • <span className="font-mono text-[11px] text-neutral-500">{cust?.phoneNumber}</span>
                              </p>
                            </td>
                            <td className="py-3 px-4 text-neutral-300 max-w-[220px] truncate">{log.purpose}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-neutral-200">
                              {formatDuration(undefined, log.durationMinutes)}
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(status)}</td>
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                                <a href={`tel:${cust?.phoneNumber}`} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300" title="Call">
                                  📞
                                </a>
                                {cleanPhone && (
                                  <a href={`https://t.me/+251${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-sky-400" title="Telegram">
                                    ✈️
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border ${cardBg}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h3 className="font-bold text-white text-sm">Save Current Filter View</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-zinc-400 hover:text-zinc-200">×</button>
            </div>
            <form onSubmit={handleSavePresetSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Preset Name</label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. Bole Out-of-Stock This Week"
                  className="w-full bg-[#121212] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-600"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSaveModal(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold">Save View</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Quick-Panel Slide-Over Drawer */}
      {selectedCallLog && selectedCustomer && (() => {
        const rep = users.find(u => u.id === selectedCallLog.userId);
        const branch = branches.find(b => b.id === selectedCustomer.branchId);
        const status = (selectedCallLog as any).callStatus || 'Sales';
        const product = selectedCallLog.productId ? products.find(p => p.id === selectedCallLog.productId) : null;
        const callCode = `TTM-${filteredLogs.indexOf(selectedCallLog) + 1}`;
        const cleanPhone = selectedCustomer.phoneNumber ? selectedCustomer.phoneNumber.replace(/^0/, '') : '';

        let productDisplay = selectedCallLog.purpose;
        if (selectedCallLog.isUnlistedProduct && selectedCallLog.unlistedProductName) {
          productDisplay = `[Unlisted] ${selectedCallLog.unlistedProductName}`;
        } else if (product) {
          productDisplay = product.itemName;
        }

        return (
          <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/60 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-md bg-[#161616] border-l border-zinc-800 shadow-2xl p-6 space-y-5 overflow-y-auto animate-slide-in-right">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="font-bold text-white text-base">{selectedCustomer.customerName}</h3>
                  <p className="text-xs text-zinc-400">{selectedCustomer.companyName || 'Print Shop'} • <span className="font-mono text-teal-400 font-semibold">{selectedCustomer.phoneNumber}</span></p>
                </div>
                <button onClick={() => setSelectedCallLog(null)} className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Call ID & Timestamp + Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                    {callCode}
                  </span>
                  <span className="text-[11px] text-zinc-500">{new Date(selectedCallLog.dateTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <a href={`tel:${selectedCustomer.phoneNumber}`} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 text-sm" title="Phone Call">📞</a>
                  <a href={`https://wa.me/251${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-green-400 text-sm" title="WhatsApp">💬</a>
                  {cleanPhone && (
                    <a href={`https://t.me/+251${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-sky-400 text-sm" title="Telegram">✈️</a>
                  )}
                </div>
              </div>

              {/* Call Metadata Grid */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
                <div className="font-bold text-amber-300 text-sm pb-2 border-b border-zinc-800">Call Metadata</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col"><span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Logged By</span><span className="text-xs font-semibold text-zinc-200 mt-0.5">{rep?.name || 'Staff'}</span></div>
                  <div className="flex flex-col"><span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Showroom / Branch</span><span className="text-xs font-semibold text-zinc-200 mt-0.5">{branch?.name || 'Showroom'}</span></div>
                  <div className="flex flex-col"><span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Call Status</span><span className="mt-0.5">{getStatusBadge(status)}</span></div>
                  <div className="flex flex-col"><span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Duration</span><span className="text-xs font-mono font-semibold text-zinc-200 mt-0.5">{formatDuration(undefined, selectedCallLog.durationMinutes)} ({selectedCallLog.durationMinutes * 60}s)</span></div>
                  <div className="flex flex-col"><span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Customer Type</span><span className="text-xs font-semibold text-zinc-200 mt-0.5">{selectedCustomer.customerType === 'New' ? 'New Customer' : 'Existing / Repeat Client'}</span></div>
                  <div className="flex flex-col"><span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Lead Source</span><span className="text-xs font-semibold text-zinc-200 mt-0.5">{selectedCustomer.source}</span></div>
                </div>
                <div className="flex flex-col pt-2 border-t border-zinc-800"><span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Product Discussed / Inquired</span><span className="text-xs font-semibold text-zinc-200 mt-0.5">{productDisplay}</span></div>
                <div className="flex flex-col pt-2 border-t border-zinc-800"><span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Call Purpose</span><span className="text-xs font-semibold text-zinc-200 mt-0.5">{selectedCallLog.purpose}</span></div>
              </div>

              {/* Full Remarks Block */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-zinc-400">Full Remarks / Notes</label>
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {selectedCallLog.remark}
                </div>
              </div>

              {/* Footer Action */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => { setSelectedCallLog(null); onSelectCustomer(selectedCustomer); }}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <span>Open Full Customer Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
