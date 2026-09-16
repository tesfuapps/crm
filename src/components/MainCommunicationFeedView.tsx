import React, { useState, useEffect } from 'react';
import { Customer, CallLog, Branch, User } from '../types/crm';
import { PhoneCall, Filter, Search, Calendar, Clock, UserCheck, CheckCircle2, AlertTriangle, ArrowRight, X, Bookmark, Download, Save, Trash2, TrendingUp } from 'lucide-react';

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
}

const CALL_STATUSES = [
  'Sales',
  'Evaluation',
  'Service',
  'Out of List',
  'Out of Stock',
  'Pre-order',
  'Complaint',
] as const;

interface CommPreset {
  id: string;
  name: string;
  statuses: string[];
  branchId: string;
  userId: string;
  customerType: string;
  leadSource: string;
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
}) => {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [filterBranchId, setFilterBranchId] = useState<string>(selectedBranchId);
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [filterCustomerType, setFilterCustomerType] = useState<string>('all');
  const [filterLeadSource, setFilterLeadSource] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('week');
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
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const filteredLogs = callLogs.filter(log => {
    const cust = customers.find(c => c.id === log.customerId);
    if (!cust) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = cust.customerName.toLowerCase().includes(q);
      const matchComp = cust.companyName && cust.companyName.toLowerCase().includes(q);
      const matchPhone = cust.phoneNumber.includes(q);
      const matchPurpose = log.purpose.toLowerCase().includes(q);
      if (!matchName && !matchComp && !matchPhone && !matchPurpose) return false;
    }

    if (filterBranchId !== 'all' && cust.branchId !== filterBranchId) return false;
    if (filterUserId !== 'all' && log.userId !== filterUserId) return false;
    if (filterCustomerType !== 'all' && cust.customerType !== filterCustomerType) return false;
    if (filterLeadSource !== 'all' && cust.source !== filterLeadSource) return false;

    const status = (log as any).callStatus || 'Sales';
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(status)) return false;

    const logDate = new Date(log.dateTime);
    const logDateStr = log.dateTime.split('T')[0];
    if (dateRange === 'day' && logDateStr !== todayStr) return false;
    if (dateRange === 'week' && logDate < oneWeekAgo) return false;
    if (dateRange === 'month' && logDate < oneMonthAgo) return false;
    if (dateRange === 'year' && logDate < oneYearAgo) return false;

    if (activeTab === 'my-calls' && log.userId !== currentUser.id) return false;
    if (activeTab === 'unresolved' && cust.nextFollowUpDate && cust.nextFollowUpDate < todayStr) {
      return false;
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

  // Rollups
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
    if (dateRange === 'day') return 'TODAY AT A GLANCE ROLLUP (ALL 7 STATUSES)';
    if (dateRange === 'week') return 'THIS WEEK AT A GLANCE ROLLUP (ALL 7 STATUSES)';
    return 'FILTERED COMMUNICATIONS ROLLUP (ALL 7 STATUSES)';
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    const newPreset: CommPreset = {
      id: 'cp_' + Date.now(),
      name: newPresetName,
      statuses: selectedStatuses,
      branchId: filterBranchId,
      userId: filterUserId,
      customerType: filterCustomerType,
      leadSource: filterLeadSource,
      dateRange,
    };
    setSavedPresets(prev => [...prev, newPreset]);
    setNewPresetName('');
    setShowSaveModal(false);
  };

  const applyPreset = (preset: CommPreset) => {
    setSelectedStatuses(preset.statuses);
    setFilterBranchId(preset.branchId);
    setFilterUserId(preset.userId);
    setFilterCustomerType(preset.customerType);
    setFilterLeadSource(preset.leadSource);
    setDateRange(preset.dateRange);
  };

  const deletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedPresets(prev => prev.filter(p => p.id !== id));
  };

  const handleExportCSV = () => {
    const header = "Communication ID,Date & Time,Sales Rep,Customer Name,Company Name,Phone,Branch,Call Status,Purpose,Duration (Mins),Customer Type,Remark\n";
    const rows = filteredLogs.map(log => {
      const cust = customers.find(c => c.id === log.customerId);
      const rep = users.find(u => u.id === log.userId);
      const branch = branches.find(b => b.id === cust?.branchId);
      const status = (log as any).callStatus || 'Sales';
      return `"${log.id}","${log.dateTime}","${rep?.name || 'Staff'}","${cust?.customerName || ''}","${cust?.companyName || ''}","${cust?.phoneNumber || ''}","${branch?.name || ''}","${status}","${log.purpose}",${log.durationMinutes},"${cust?.customerType || 'New'}","${log.remark.replace(/"/g, '""')}"`;
    }).join("\n");

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TTM_Communications_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    handleExportCSV(); // XLSX compatible CSV export
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Sales: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
      Evaluation: 'bg-sky-950/60 text-sky-300 border-sky-800',
      Service: 'bg-purple-950/60 text-purple-300 border-purple-800',
      'Out of List': 'bg-zinc-800 text-zinc-300 border-zinc-700',
      'Out of Stock': 'bg-red-950/60 text-red-400 border-red-800',
      'Pre-order': 'bg-amber-950/60 text-amber-300 border-amber-800',
      Complaint: 'bg-rose-950/60 text-rose-300 border-rose-800',
    };
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${colors[status] || colors.Sales}`}>{status}</span>;
  };

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const rowBg = isDark ? 'bg-zinc-950/40 border-zinc-800/60' : 'bg-slate-50 border-slate-200';
  const inputBg = isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800';

  const selectedCustomer = selectedCallLog ? customers.find(c => c.id === selectedCallLog.customerId) : null;

  return (
    <div className="space-y-6 relative">
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white">Main Communications Feed</h2>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Command Center
            </span>
          </div>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Company-wide real-time communications stream with interactive 7-status rollup engine.
          </p>
        </div>
        <button onClick={onOpenLogCall} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors">
          + Log New Communication
        </button>
      </div>

      {/* 1. Interactive 7-Status Rollup Engine (Top Green Box equivalent) */}
      <div className={`p-5 rounded-xl border ${cardBg} space-y-3`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>{getRollupTitle()}</span>
          </h3>
          <span className="text-xs font-mono text-zinc-400">{filteredLogs.length} calls • {totalMinutes} total mins</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CALL_STATUSES.map(status => {
            const isActive = selectedStatuses.includes(status);
            return (
              <div
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                  isActive
                    ? 'bg-amber-600/20 border-amber-500 text-white ring-1 ring-amber-500'
                    : `${rowBg} hover:border-zinc-700 text-zinc-300`
                }`}
              >
                <div className="text-[11px] font-medium truncate">{status}</div>
                <div className={`text-lg font-bold font-mono mt-0.5 ${isActive ? 'text-amber-300' : 'text-white'}`}>{statusCounts[status]}</div>
              </div>
            );
          })}
          <div className={`p-3 rounded-lg border text-center ${rowBg}`}>
            <div className="text-[11px] text-zinc-400 truncate">New / Old</div>
            <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">{newCustCount} / {oldCustCount}</div>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Red Box (Faceted Feed Filters) + Center Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Red Box equivalent: Faceted Feed Filters */}
        <div className={`p-5 rounded-xl border ${cardBg} space-y-4 lg:col-span-1`}>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Feed Filters</h3>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              {filteredLogs.length} calls • {totalMinutes}m
            </div>
          </div>

          {/* Saved Views Dropdown & Save Button */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSaveModal(true)} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm">
                <Save className="w-3.5 h-3.5" />
                <span>Save Current Filter</span>
              </button>
            </div>
            {savedPresets.length > 0 && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-zinc-500">Saved Views / Presets</label>
                <select onChange={(e) => { const p = savedPresets.find(x => x.id === e.target.value); if (p) applyPreset(p); }} className={`w-full ${inputBg} border rounded-lg px-2.5 py-1.5 text-xs font-medium`}>
                  <option value="">Select saved view...</option>
                  {savedPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Quick Search */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-zinc-400">Quick Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, company, phone..."
                className={`w-full ${inputBg} border rounded-lg pl-8 pr-3 py-2 text-xs`}
              />
            </div>
          </div>

          {/* Call Status Checkboxes (All 7) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-zinc-400">Call Statuses</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {CALL_STATUSES.map(status => (
                <label key={status} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleStatusFilter(status)}
                    className="rounded bg-zinc-900 border-zinc-700 text-amber-600 focus:ring-amber-600"
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-zinc-400">Branch Office</label>
            <select value={filterBranchId} onChange={(e) => setFilterBranchId(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-xs font-semibold`}>
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-zinc-400">Sales Representative</label>
            <select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-xs font-semibold`}>
              <option value="all">All Reps</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-zinc-400">Customer Type</label>
            <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-lg text-xs font-semibold">
              {(['all', 'New', 'Old'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setFilterCustomerType(t)}
                  className={`py-1 rounded capitalize transition-colors ${filterCustomerType === t ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-zinc-400">Lead Source</label>
            <select value={filterLeadSource} onChange={(e) => setFilterLeadSource(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-xs font-semibold`}>
              <option value="all">All Lead Sources</option>
              <option value="Telegram">Telegram</option>
              <option value="Facebook">Facebook</option>
              <option value="Referral">Referral</option>
              <option value="Previous Buyer">Previous Buyer</option>
              <option value="Google Sheets Migration">Google Sheets Migration</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-zinc-400">Date Range</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-xs font-semibold`}>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Export Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <button onClick={handleExportCSV} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export to CSV</span>
            </button>
            <button onClick={handleExportExcel} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export to Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Center Feed Table with Date Grouping */}
        <div className={`p-5 rounded-xl border ${cardBg} space-y-4 lg:col-span-3`}>
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
            <span className="text-xs text-zinc-400 font-mono">{filteredLogs.length} records</span>
          </div>

          <div className="space-y-6 max-h-[650px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-500">No communication logs match the current filters.</div>
            ) : (
              sortedDates.map(dateStr => {
                const dayLogs = groupedByDate[dateStr];
                const dayTotalMins = dayLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0);
                const isToday = dateStr === todayStr;
                const formattedDate = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

                return (
                  <div key={dateStr} className="space-y-2">
                    {/* Date Section Header */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#1c1c1c] rounded-lg border border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-xs text-zinc-200 uppercase tracking-wider">{formattedDate}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-medium">
                            TODAY
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">
                        {dayLogs.length} calls • {dayTotalMins} mins
                      </span>
                    </div>

                    <div className="rounded-xl border overflow-hidden bg-zinc-950/40 border-zinc-800/60">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[11px] font-bold uppercase text-zinc-400 border-b border-zinc-800/60 bg-zinc-950/80">
                          <tr>
                            <th className="py-3 px-3">Salesperson</th>
                            <th className="py-3 px-3">Customer / Company</th>
                            <th className="py-3 px-3">Purpose</th>
                            <th className="py-3 px-3">Duration</th>
                            <th className="py-3 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                          {dayLogs.map(log => {
                            const cust = customers.find(c => c.id === log.customerId);
                            const rep = users.find(u => u.id === log.userId);
                            const status = (log as any).callStatus || 'Sales';
                            const isSelected = selectedCallLog?.id === log.id;

                            return (
                              <tr
                                key={log.id}
                                onClick={() => setSelectedCallLog(log)}
                                className={`cursor-pointer transition-colors hover:bg-zinc-800/40 ${isSelected ? 'bg-amber-950/25 border-l-2 border-amber-500' : ''}`}
                              >
                                <td className="py-3 px-3 font-semibold text-zinc-300">{rep?.name || 'Staff'}</td>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-white">{cust?.customerName || 'Unknown'}</div>
                                  <div className="text-[11px] text-zinc-400">{cust?.companyName || 'Independent'}</div>
                                </td>
                                <td className="py-3 px-3 text-zinc-300 max-w-[200px] truncate">{log.purpose}</td>
                                <td className="py-3 px-3 font-mono text-zinc-400">{log.durationMinutes}m</td>
                                <td className="py-3 px-3">{getStatusBadge(status)}</td>
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
        </div>
      </div>

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border ${cardBg}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h3 className="font-bold text-white text-sm">Save Current Filter View</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-zinc-400 hover:text-zinc-200">×</button>
            </div>
            <form onSubmit={handleSavePreset} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Preset Name</label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. Bole Out-of-Stock This Week"
                  className={`w-full ${inputBg} border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-600`}
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
      {selectedCallLog && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-[#161616] border-l border-zinc-800 shadow-2xl p-6 space-y-5 overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="font-bold text-white text-base">Customer Quick-Panel</h3>
              <button onClick={() => setSelectedCallLog(null)} className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-lg text-white">{selectedCustomer.customerName}</h4>
                <p className="text-xs text-zinc-400">{selectedCustomer.companyName || 'Print Shop'} • <span className="font-mono text-teal-400 font-semibold">{selectedCustomer.phoneNumber}</span></p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-2.5 text-xs">
                <div className="font-bold text-amber-300 text-sm">Current Call Summary</div>
                <div className="flex justify-between"><span className="text-zinc-400">Status:</span><span>{getStatusBadge((selectedCallLog as any).callStatus || 'Sales')}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Purpose:</span><span className="text-zinc-200">{selectedCallLog.purpose}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Duration:</span><span className="font-mono text-zinc-200">{selectedCallLog.durationMinutes} minutes</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Lead Source:</span><span className="text-zinc-200">{selectedCustomer.source}</span></div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-zinc-400">Recent Remark / Note</label>
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-zinc-300 leading-relaxed">
                  {selectedCallLog.remark}
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => { setSelectedCallLog(null); onSelectCustomer(selectedCustomer); }}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <span>Open Full Customer Detail Slide-Over</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
