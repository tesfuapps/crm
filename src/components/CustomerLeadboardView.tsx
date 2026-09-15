import React, { useState } from 'react';
import { Customer, CallLog, Branch, User, ProductSale } from '../types/crm';
import { Trophy, PhoneCall, DollarSign, Flame, Star, Calendar, ArrowUpRight, Crown, Filter } from 'lucide-react';

interface CustomerLeadboardViewProps {
  customers: Customer[];
  callLogs: CallLog[];
  sales: ProductSale[];
  branches: Branch[];
  users: User[];
  theme: 'light' | 'dark';
  onSelectCustomer: (customer: Customer) => void;
  onOpenLogCall: (customer: Customer) => void;
}

export const CustomerLeadboardView: React.FC<CustomerLeadboardViewProps> = ({
  customers,
  callLogs,
  sales,
  branches,
  users,
  theme,
  onSelectCustomer,
  onOpenLogCall,
}) => {
  const isDark = theme === 'dark';
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all'>('monthly');
  const [metricFilter, setMetricFilter] = useState<'all' | 'communication' | 'sales'>('all');

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const rowBg = isDark ? 'bg-zinc-950/40 border-zinc-800/60' : 'bg-slate-50 border-slate-200';

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate automated ranking score for each customer based on Communication + Sales
  const rankedCustomers = customers.map(cust => {
    const custCalls = callLogs.filter(cl => {
      const d = new Date(cl.dateTime);
      if (timeframe === 'weekly' && d < oneWeekAgo) return false;
      if (timeframe === 'monthly' && d < oneMonthAgo) return false;
      return cl.customerId === cust.id;
    });

    const custSales = sales.filter(s => {
      const d = new Date(s.saleDate);
      if (timeframe === 'weekly' && d < oneWeekAgo) return false;
      if (timeframe === 'monthly' && d < oneMonthAgo) return false;
      return s.customerId === cust.id;
    });

    const callsCount = custCalls.length;
    const totalDurationMins = custCalls.reduce((sum, cl) => sum + (cl.durationMinutes || 0), 0);
    const salesRevenue = custSales.reduce((sum, s) => sum + s.saleAmount, 0) || cust.dealValue || 0;
    const purchaseCount = custSales.reduce((sum, s) => sum + s.quantity, 0) || (cust.customerStage === 'Client' ? 1 : 0);
    const maxStreak = Math.max(0, ...Object.values(cust.consecutivePurchaseStreak || {}));

    const communicationScore = (callsCount * 20) + (totalDurationMins * 5);
    const salesScore = Math.round((salesRevenue / 500) + (purchaseCount * 30) + (maxStreak * 40));
    
    let totalScore = communicationScore + salesScore;
    if (metricFilter === 'communication') totalScore = communicationScore;
    if (metricFilter === 'sales') totalScore = salesScore;

    return {
      customer: cust,
      callsCount,
      totalDurationMins,
      salesRevenue,
      purchaseCount,
      maxStreak,
      communicationScore,
      salesScore,
      totalScore,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/50 text-base">🥇</span>;
    if (index === 1) return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-300/20 text-zinc-300 font-bold border border-zinc-400/50 text-base">🥈</span>;
    if (index === 2) return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 font-bold border border-amber-700/50 text-base">🥉</span>;
    return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs">{index + 1}</span>;
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span>Customer Leadboard</span>
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Ranked automatically by communication activity and sales performance across weekly, monthly, and all-time periods.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Filter */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setMetricFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${metricFilter === 'all' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              All Metrics
            </button>
            <button
              onClick={() => setMetricFilter('communication')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${metricFilter === 'communication' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Communication Focus
            </button>
            <button
              onClick={() => setMetricFilter('sales')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${metricFilter === 'sales' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Sales Focus
            </button>
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {(['weekly', 'monthly', 'all'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${timeframe === t ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                {t === 'all' ? 'All-Time' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rankedCustomers.map((item, index) => {
          const branch = branches.find(b => b.id === item.customer.branchId);
          const rep = users.find(u => u.id === item.customer.assignedUserId);

          return (
            <div key={item.customer.id} className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${rowBg} hover:border-zinc-700 transition-colors`}>
              <div className="flex items-center gap-4">
                {getRankBadge(index)}
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 onClick={() => onSelectCustomer(item.customer)} className="font-bold text-base text-white cursor-pointer hover:text-amber-400 transition-colors">
                      {item.customer.customerName}
                    </h4>
                    {item.customer.companyName && (
                      <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded font-medium">
                        {item.customer.companyName}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 bg-amber-950/40 text-amber-300 border border-amber-800/60 rounded font-medium">
                      {item.customer.customerStage}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Branch: <span className="text-zinc-200 font-medium">{branch?.name || 'Showroom'}</span> • Rep: <span className="text-zinc-200 font-medium">{rep?.name || 'Unassigned'}</span> • Phone: <span className="font-mono text-teal-400">{item.customer.phoneNumber}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 justify-between md:justify-end">
                <div className="text-center md:text-right">
                  <div className="text-xs text-zinc-400">Communication</div>
                  <div className="font-mono font-semibold text-xs text-sky-400">{item.callsCount} calls ({item.totalDurationMins}m)</div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-xs text-zinc-400">Sales Revenue</div>
                  <div className="font-mono font-semibold text-xs text-emerald-400">{item.salesRevenue.toLocaleString()} ETB</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-400">Leadboard Score</div>
                  <div className="font-mono font-bold text-base text-amber-400">{item.totalScore.toLocaleString()} pts</div>
                </div>
                <button
                  onClick={() => onOpenLogCall(item.customer)}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Log Call</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
