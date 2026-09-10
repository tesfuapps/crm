import React from 'react';
import { Customer, CallLog, User, Branch } from '../types/crm';
import { PhoneCall, Users, TrendingUp, Award, Calendar, ArrowUpRight, Clock, PhoneIncoming } from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
  callLogs: CallLog[];
  users: User[];
  branches: Branch[];
  selectedBranchId: string;
  onOpenIncomingCall: () => void;
  onSelectCustomer: (customer: Customer) => void;
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  customers,
  callLogs,
  users,
  branches,
  selectedBranchId,
  onOpenIncomingCall,
  onSelectCustomer,
  setActiveTab,
}) => {
  const filteredCustomers = selectedBranchId === 'all' 
    ? customers 
    : customers.filter(c => c.branchId === selectedBranchId);

  const filteredCustomerIds = new Set(filteredCustomers.map(c => c.id));
  const filteredCallLogs = selectedBranchId === 'all'
    ? callLogs
    : callLogs.filter(cl => filteredCustomerIds.has(cl.customerId));

  const totalCalls = filteredCallLogs.length;
  const totalMinutes = filteredCallLogs.reduce((sum, cl) => sum + cl.durationMinutes, 0);
  const newLeadsCount = filteredCustomers.filter(c => c.customerStage === 'Lead' || c.customerStage === 'Contact').length;
  const clientsCount = filteredCustomers.filter(c => c.customerStage === 'Client').length;
  const conversionRate = filteredCustomers.length > 0 
    ? ((clientsCount / filteredCustomers.length) * 100).toFixed(1) 
    : '0';

  const todayStr = new Date().toISOString().split('T')[0];
  const followUps = filteredCustomers.filter(c => c.nextFollowUpDate);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Bar */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Printing Showroom & Machinery Operations</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Active Showroom: {selectedBranchId === 'all' ? 'All Branches (Bole, Mexico, Piassa)' : branches.find(b => b.id === selectedBranchId)?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('customers')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Directory
          </button>
          <button
            onClick={onOpenIncomingCall}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center gap-2 animate-pulse"
          >
            <PhoneIncoming className="w-4 h-4" />
            <span>📞 Incoming Call Lookup</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-teal-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Calls Logged</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalCalls}</h3>
            <p className="text-xs text-teal-700 mt-1.5 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> {totalMinutes} mins on phone
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-inner">
            <PhoneCall className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-amber-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Leads & Inquiries</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{newLeadsCount}</h3>
            <p className="text-xs text-amber-600 mt-1.5 font-medium">Requires follow-up</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-emerald-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{conversionRate}%</h3>
            <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Contact to Client ratio
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-purple-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Inquiry Source</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">Telegram</h3>
            <p className="text-xs text-purple-600 mt-1.5 font-medium">35% of all leads</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Follow-ups due */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Scheduled Follow-ups</span>
            </h3>
            <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
              {followUps.length} upcoming
            </span>
          </div>

          <div className="space-y-3">
            {followUps.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No follow-ups scheduled.</p>
            ) : (
              followUps.slice(0, 5).map((customer) => {
                const isOverdue = customer.nextFollowUpDate! < todayStr;
                return (
                  <div
                    key={customer.id}
                    onClick={() => onSelectCustomer(customer)}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-slate-50/80 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{customer.customerName}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${
                        isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {customer.nextFollowUpDate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{customer.companyName || customer.phoneNumber}</p>
                    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 text-xs">
                      <span className="text-teal-700 font-semibold">{customer.purposeOfCall}</span>
                      <span className="text-slate-400 font-medium">Priority: {customer.leadPriority}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Recent Call Logs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
              <PhoneCall className="w-4 h-4 text-teal-700" />
              <span>Recent Call Activity</span>
            </h3>
            <button
              onClick={() => setActiveTab('customers')}
              className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>View all logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Inquiry / Purpose</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCallLogs.slice(0, 6).map((log) => {
                  const customer = customers.find(c => c.id === log.customerId);
                  const user = users.find(u => u.id === log.userId);
                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => customer && onSelectCustomer(customer)}
                      className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {customer?.customerName || 'Unknown'}
                        <div className="text-xs text-slate-500 font-normal">{customer?.companyName || customer?.phoneNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{user?.name || 'Agent'}</td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">{log.purpose}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{log.durationMinutes} mins</td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs font-medium">
                        {new Date(log.dateTime).toLocaleDateString()} {new Date(log.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
