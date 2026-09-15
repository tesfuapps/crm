import React, { useState } from 'react';
import { Customer, CallLog, Branch, User } from '../types/crm';
import { PhoneCall, Filter, Search, Calendar, Clock, UserCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

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
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [filterBranchId, setFilterBranchId] = useState<string>(selectedBranchId);
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [filterCustomerType, setFilterCustomerType] = useState<'all' | 'New' | 'Old'>('all');
  const [filterLeadSource, setFilterLeadSource] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('week');
  const [activeTab, setActiveTab] = useState<'feed' | 'unresolved' | 'my-calls'>('feed');
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null);

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const rowBg = isDark ? 'bg-zinc-950/40 border-zinc-800/60' : 'bg-slate-50 border-slate-200';
  const inputBg = isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800';

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  // Filter call logs
  const filteredLogs = callLogs.filter(log => {
    const cust = customers.find(c => c.id === log.customerId);
    if (!cust) return false;

    // Branch filter
    if (filterBranchId !== 'all' && cust.branchId !== filterBranchId) return false;

    // Sales Rep filter
    if (filterUserId !== 'all' && log.userId !== filterUserId) return false;

    // Customer Type filter
    if (filterCustomerType !== 'all' && cust.customerType !== filterCustomerType) return false;

    // Lead Source filter
    if (filterLeadSource !== 'all' && cust.source !== filterLeadSource) return false;

    // Call Status filter (default to 'Sales' if not explicitly tagged on legacy mock logs)
    const status = (log as any).callStatus || 'Sales';
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(status)) return false;

    // Tabs filter
    if (activeTab === 'my-calls' && log.userId !== currentUser.id) return false;
    if (activeTab === 'unresolved' && cust.nextFollowUpDate && cust.nextFollowUpDate < new Date().toISOString().split('T')[0]) {
      // Unresolved: no valid upcoming follow-up
      return false;
    }

    return true;
  });

  // Today at a Glance rollups across all 7 categories
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

  const selectedCustomer = selectedCallLog ? customers.find(c => c.id === selectedCallLog.customerId) : null;
  const selectedUser = selectedCallLog ? users.find(u => u.id === selectedCallLog.userId) : null;

  return (
    <div className="space-y-6">
      {/* Header & Rollup */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white">Main Communication Feed</h2>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed
            </span>
          </div>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Company-wide real-time communications stream with auto-calculated daily status rollups.
          </p>
        </div>
        <button onClick={onOpenLogCall} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors">
          + Log New Communication
        </button>
      </div>

      {/* Today at a Glance Rollup Panel */}
      <div className={`p-5 rounded-xl border ${cardBg} space-y-3`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Today at a Glance Rollup (All 7 Call Statuses)</h3>
          <span className="text-xs font-mono text-zinc-400">{filteredLogs.length} communications • {totalMinutes} total minutes</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CALL_STATUSES.map(status => (
            <div key={status} className={`p-3 rounded-lg border text-center ${rowBg}`}>
              <div className="text-[11px] text-zinc-400 truncate">{status}</div>
              <div className="text-lg font-bold text-white font-mono mt-0.5">{statusCounts[status]}</div>
            </div>
          ))}
          <div className={`p-3 rounded-lg border text-center ${rowBg}`}>
            <div className="text-[11px] text-zinc-400 truncate">New / Old</div>
            <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">{newCustCount} / {oldCustCount}</div>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Sidebar Filters + Center Feed + Right Quick Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Filter Sidebar */}
        <div className={`p-5 rounded-xl border ${cardBg} space-y-4 lg:col-span-1`}>
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/60">
            <Filter className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Feed Filters</h3>
          </div>

          {/* Call Status Checkboxes (All 7) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-zinc-400">Call Status (All 7)</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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

          {/* Branch Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-zinc-400">Branch Office</label>
            <select value={filterBranchId} onChange={(e) => setFilterBranchId(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-xs font-semibold`}>
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Sales Rep Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-zinc-400">Sales Representative</label>
            <select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-xs font-semibold`}>
              <option value="all">All Sales Reps</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>

          {/* Customer Type Toggle */}
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

          {/* Lead Source */}
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

          {/* Date Range (Day/Week/Month/Year/Custom) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-zinc-400">Date Range</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value as any)} className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-xs font-semibold`}>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year (Annual)</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Center Feed Table */}
        <div className={`p-5 rounded-xl border ${cardBg} space-y-4 ${selectedCallLog ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
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

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-500">No communication logs match the current filters.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-bold uppercase text-zinc-400 border-b border-zinc-800/60 sticky top-0 bg-[#18181b]">
                  <tr>
                    <th className="pb-3 px-3">Salesperson</th>
                    <th className="pb-3 px-3">Customer / Company</th>
                    <th className="pb-3 px-3">Purpose</th>
                    <th className="pb-3 px-3">Duration</th>
                    <th className="pb-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {filteredLogs.map(log => {
                    const cust = customers.find(c => c.id === log.customerId);
                    const rep = users.find(u => u.id === log.userId);
                    const status = (log as any).callStatus || 'Sales';
                    const isSelected = selectedCallLog?.id === log.id;

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedCallLog(log)}
                        className={`cursor-pointer transition-colors hover:bg-zinc-900/60 ${isSelected ? 'bg-amber-950/20' : ''}`}
                      >
                        <td className="py-3 px-3 font-semibold text-zinc-300">{rep?.name || 'Staff'}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{cust?.customerName || 'Unknown'}</div>
                          <div className="text-[11px] text-zinc-400">{cust?.companyName || 'Independent'}</div>
                        </td>
                        <td className="py-3 px-3 text-zinc-300 max-w-[180px] truncate">{log.purpose}</td>
                        <td className="py-3 px-3 font-mono text-zinc-400">{log.durationMinutes}m</td>
                        <td className="py-3 px-3">{getStatusBadge(status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Customer Quick-Panel (on row click) */}
        {selectedCallLog && selectedCustomer && (
          <div className={`p-5 rounded-xl border ${cardBg} space-y-4 lg:col-span-1 animate-fade-in`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <h3 className="font-bold text-white text-sm">Customer Quick-Panel</h3>
              <button onClick={() => setSelectedCallLog(null)} className="text-zinc-400 hover:text-white">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-base text-white">{selectedCustomer.customerName}</h4>
                <p className="text-xs text-zinc-400">{selectedCustomer.companyName || 'Print Shop'} • <span className="font-mono text-teal-400">{selectedCustomer.phoneNumber}</span></p>
              </div>

              <div className={`p-3 rounded-lg border ${rowBg} space-y-2 text-xs`}>
                <div className="font-bold text-amber-300">Current Call Summary</div>
                <div className="flex justify-between"><span className="text-zinc-450 text-zinc-400">Status:</span><span>{getStatusBadge((selectedCallLog as any).callStatus || 'Sales')}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Purpose:</span><span className="text-zinc-200">{selectedCallLog.purpose}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Duration:</span><span className="font-mono text-zinc-200">{selectedCallLog.durationMinutes} minutes</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Lead Source:</span><span className="text-zinc-200">{selectedCustomer.source}</span></div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-zinc-400">Recent Remark / Note</label>
                <div className={`p-3 rounded-lg border text-xs text-zinc-300 ${inputBg}`}>
                  {selectedCallLog.remark}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <button onClick={() => onSelectCustomer(selectedCustomer)} className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm">
                  <span>Open Full Customer Detail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
