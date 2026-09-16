import React, { useState, useEffect } from 'react';
import { Customer, CallLog, Branch, User } from '../types/crm';
import { PhoneCall, Filter, Search, Calendar, Clock, UserCheck, CheckCircle2, AlertTriangle, ArrowRight, X, Bookmark, Download, Save, Trash2 } from 'lucide-react';

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

    // Search term
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

    // Date range filter
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

  const totalMinutes = filteredLogs.reduce((sum, cl) => sum + (cl.durationMinutes || 0), 0);

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
              Live Feed
            </span>
          </div>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Showing <strong className="text-white">{filteredLogs.length}</strong> communications • <strong className="text-amber-400">{totalMinutes}</strong> total minutes.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button onClick={onOpenLogCall} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors">
            + Log New Communication
          </button>
        </div>
      </div>

      {/* Task 1: Top Compact Filter Toolbar */}
      <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer, company, phone..."
              className={`w-full ${inputBg} border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-600`}
            />
          </div>

          {/* Branch Dropdown */}
          <select value={filterBranchId} onChange={(e) => setFilterBranchId(e.target.value)} className={`${inputBg} border rounded-lg px-3 py-2 text-xs font-semibold`}>
            <option value="all">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Rep Dropdown */}
          <select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} className={`${inputBg} border rounded-lg px-3 py-2 text-xs font-semibold`}>
            <option value="all">All Reps</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          {/* Date Range */}
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={`${inputBg} border rounded-lg px-3 py-2 text-xs font-semibold`}>
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>

          {/* Save Filter Button */}
          <button onClick={() => setShowSaveModal(true)} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1">
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>Save Filter</span>
          </button>
        </div>

        {/* Saved Presets Bar */}
        {savedPresets.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Bookmark className="w-3 h-3 text-amber-400" /> Saved Presets:
            </span>
            {savedPresets.map(preset => (
              <div key={preset.id} className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs text-zinc-200">
                <button onClick={() => applyPreset(preset)} className="hover:text-amber-400 font-medium">{preset.name}</button>
                <button onClick={(e) => deletePreset(preset.id, e)} className="text-zinc-500 hover:text-red-400">×</button>
              </div>
            ))}
          </div>
        )}
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
        <span className="text-xs text-zinc-400 font-mono">Showing {filteredLogs.length} communications • {totalMinutes} total mins</span>
      </div>

      {/* Task 2: Date-Grouped Feeds */}
      <div className="space-y-6">
        {filteredLogs.length === 0 ? (
          <div className={`p-12 text-center rounded-xl border ${cardBg}`}>
            <p className="text-xs text-zinc-500">No communication logs match the current filters.</p>
          </div>
        ) : (
          sortedDates.map(dateStr => {
            const dayLogs = groupedByDate[dateStr];
            const dayTotalMins = dayLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0);
            const isToday = dateStr === todayStr;
            const formattedDate = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date Divider Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] rounded-xl border border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-zinc-200">{formattedDate}</span>
                    {isToday && (
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-semibold">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    {dayLogs.length} calls • {dayTotalMins} mins
                  </span>
                </div>

                {/* Table for this date */}
                <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
                  <table className="w-full text-left text-xs">
                    <thead className="text-[11px] font-bold uppercase text-zinc-400 border-b border-zinc-800/60 bg-zinc-950/60">
                      <tr>
                        <th className="py-3 px-4">Salesperson</th>
                        <th className="py-3 px-4">Customer / Company</th>
                        <th className="py-3 px-4">Purpose</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
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
                            <td className="py-3 px-4 font-semibold text-zinc-300">{rep?.name || 'Staff'}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{cust?.customerName || 'Unknown'}</div>
                              <div className="text-[11px] text-zinc-400">{cust?.companyName || 'Independent'}</div>
                            </td>
                            <td className="py-3 px-4 text-zinc-300 max-w-[220px] truncate">{log.purpose}</td>
                            <td className="py-3 px-4 font-mono text-zinc-400">{log.durationMinutes}m</td>
                            <td className="py-3 px-4">{getStatusBadge(status)}</td>
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
              <h3 className="font-bold text-white text-sm">Save Current Filter Preset</h3>
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
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold">Save Preset</button>
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
