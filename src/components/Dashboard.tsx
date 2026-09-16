import React from 'react';
import { Customer, CallLog, User, Branch, Notification } from '../types/crm';
import { ExternalLink, ArrowUpRight, Bell, Trophy } from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
  callLogs: CallLog[];
  users: User[];
  branches: Branch[];
  selectedBranchId: string;
  onOpenIncomingCall: () => void;
  onSelectCustomer: (customer: Customer) => void;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  notifications: Notification[];
  unreadCount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  customers, callLogs, users, branches,
  selectedBranchId, onOpenIncomingCall,
  onSelectCustomer, setActiveTab, theme,
  notifications, unreadCount,
}) => {
  const isDark = theme === 'dark';

  const filteredCustomers = selectedBranchId === 'all'
    ? customers
    : customers.filter(c => c.branchId === selectedBranchId);
  const filteredCustomerIds = new Set(filteredCustomers.map(c => c.id));
  const filteredCallLogs = selectedBranchId === 'all'
    ? callLogs
    : callLogs.filter(cl => filteredCustomerIds.has(cl.customerId));

  const totalCallsToday = filteredCallLogs.length;
  const newLeadsCount = filteredCustomers.filter(c => c.customerStage === 'Lead' || c.customerStage === 'Contact').length;
  const clientsCount = filteredCustomers.filter(c => c.customerStage === 'Client').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueFollowUps = filteredCustomers.filter(c => c.nextFollowUpDate && c.nextFollowUpDate < todayStr).length;

  const totalRevenue = filteredCallLogs.reduce((sum, cl) => {
    const cust = customers.find(c => c.id === cl.customerId);
    return sum + (cust?.dealValue || 0);
  }, 0);

  const leadConversionRate = filteredCustomers.length > 0
    ? ((clientsCount / filteredCustomers.length) * 100).toFixed(0)
    : '0';

  const branchLeaderboard = branches.map(b => {
    const bCustomers = customers.filter(c => c.branchId === b.id);
    const bClients = bCustomers.filter(c => c.customerStage === 'Client').length;
    const bRevenue = bCustomers.reduce((sum, c) => sum + c.dealValue, 0);
    return { name: b.name, customers: bCustomers.length, clients: bClients, revenue: bRevenue };
  }).sort((a, b) => b.clients - a.clients);

  return (
    <div className="space-y-8 text-zinc-100 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome to TTM CRM</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Printing Showroom Operations • {selectedBranchId === 'all' ? 'All Showrooms' : branches.find(b => b.id === selectedBranchId)?.name}
        </p>
      </div>

      {/* Top 3 Metric Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#18181b] rounded-xl p-5 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">ACTIVE CLIENTS</p>
            <div className="text-3xl font-bold text-white mt-2">{clientsCount}</div>
          </div>
          <div className="text-xs text-zinc-500 mt-4 flex items-center gap-1.5 font-medium">
            <span>Total confirmed sales</span>
          </div>
        </div>
        <div className="bg-[#18181b] rounded-xl p-5 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">TOTAL REVENUE</p>
            <div className="text-3xl font-bold text-white mt-2">{totalRevenue.toLocaleString()} ETB</div>
          </div>
          <div className="text-xs text-emerald-400 mt-4 flex items-center gap-1 font-semibold">
            <span>↗ Total confirmed sales</span>
          </div>
        </div>
        <div className="bg-[#18181b] rounded-xl p-5 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">CONVERSION RATE</p>
            <div className="text-3xl font-bold text-white mt-2">{leadConversionRate}%</div>
          </div>
          <div className="text-xs text-zinc-500 mt-4 flex items-center gap-1.5 font-medium">
            <span>{clientsCount} of {filteredCustomers.length} leads converted</span>
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Branch Leaderboard
        </h3>
        <div className="bg-[#18181b] rounded-xl border border-zinc-800/80 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/80 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Customers</th>
                <th className="py-3 px-4">Clients</th>
                <th className="py-3 px-4">Revenue (ETB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {branchLeaderboard.map((b, i) => (
                <tr key={b.name} className={`hover:bg-zinc-800/40 transition-colors ${i === 0 ? 'bg-amber-500/10 border-y border-amber-500/35' : ''}`}>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-zinc-500'}`}>
                      #{i + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-white text-sm">{b.name}</td>
                  <td className="py-3 px-4 text-zinc-300">{b.customers}</td>
                  <td className="py-3 px-4 text-emerald-400">{b.clients}</td>
                  <td className="py-3 px-4 font-bold text-zinc-200">{b.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Follow-ups & Calls</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div onClick={() => setActiveTab('customers')} className="bg-[#18181b] hover:bg-zinc-800/80 transition-colors border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200"><span>Overdue Follow-ups</span><ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" /></div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${overdueFollowUps > 0 ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-zinc-800 text-zinc-300'}`}>{overdueFollowUps} Overdue</span>
            </div>
            <div onClick={() => setActiveTab('customers')} className="bg-[#18181b] hover:bg-zinc-800/80 transition-colors border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200"><span>Calls Today</span><ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" /></div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-900">{totalCallsToday} Today</span>
            </div>
            <div onClick={() => setActiveTab('customers')} className="bg-[#18181b] hover:bg-zinc-800/80 transition-colors border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200"><span>Pending Follow-ups</span><ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" /></div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">{newLeadsCount}</span>
            </div>
            <div onClick={() => setActiveTab('customer-leadboard')} className="bg-[#18181b] hover:bg-zinc-800/80 transition-colors border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200"><span>Customer Leaderboard</span><ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" /></div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">Ranked</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Tools & Store</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[['products', 'Product Store', 'Catalog'], ['reports', 'Sales Reports', 'Analytics'], ['import-export', 'Import / Export', 'Sync'], ['settings', 'Settings & Users', 'Admin']].map(([tab, label, badge]) => (
              <div key={tab} onClick={() => setActiveTab(tab as any)} className="bg-[#18181b] hover:bg-zinc-800/80 transition-colors border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-200"><span>{label}</span><ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" /></div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">{badge}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Sales & Clients</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div onClick={() => setActiveTab('customers')} className="bg-[#18181b] hover:bg-zinc-800/80 transition-colors border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200"><span>Total Clients</span><ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" /></div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-900">{filteredCustomers.length} Active</span>
            </div>
            <div onClick={() => setActiveTab('customers')} className="bg-[#18181b] hover:bg-zinc-800/80 transition-colors border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200"><span>Converted Clients</span><ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" /></div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">{clientsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
