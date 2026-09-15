import React, { useState } from 'react';
import { Customer, CallLog, User, Branch, ProductSale } from '../types/crm';
import { Trophy, Award, Flame, TrendingUp, Users, Building2, PhoneCall, Star, Crown } from 'lucide-react';

interface LeaderboardViewProps {
  customers: Customer[];
  callLogs: CallLog[];
  users: User[];
  branches: Branch[];
  sales: ProductSale[];
  theme: 'light' | 'dark';
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  customers,
  callLogs,
  users,
  branches,
  sales,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all'>('monthly');
  const [boardType, setBoardType] = useState<'staff' | 'clients'>('staff');

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const rowBg = isDark ? 'bg-zinc-950/40 border-zinc-800/60' : 'bg-slate-50 border-slate-200';

  // Filter sales & logs by timeframe if needed
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filteredSales = sales.filter(s => {
    const saleDate = new Date(s.saleDate);
    if (timeframe === 'weekly') return saleDate >= oneWeekAgo;
    if (timeframe === 'monthly') return saleDate >= oneMonthAgo;
    return true;
  });

  // Calculate scores for each user
  const userScores = users.map(user => {
    const userCustomers = customers.filter(c => c.assignedUserId === user.id);
    const userCalls = callLogs.filter(cl => {
      const clDate = new Date(cl.dateTime);
      if (timeframe === 'weekly' && clDate < oneWeekAgo) return false;
      if (timeframe === 'monthly' && clDate < oneMonthAgo) return false;
      return cl.userId === user.id;
    });

    const userSales = filteredSales.filter(s => {
      const cust = customers.find(c => c.id === s.customerId);
      return cust && cust.assignedUserId === user.id;
    });

    const totalRevenue = userSales.reduce((sum, s) => sum + s.saleAmount, 0);
    const dealsWon = userCustomers.filter(c => c.customerStage === 'Client' || c.customerStage === 'Customer').length;
    const callsCount = userCalls.length;
    const score = Math.round((totalRevenue / 1000) + (dealsWon * 50) + (callsCount * 10));

    return { user, totalRevenue, dealsWon, callsCount, score };
  }).sort((a, b) => b.score - a.score);

  // Calculate scores for each branch
  const branchScores = branches.map(branch => {
    const branchCustomers = customers.filter(c => c.branchId === branch.id);
    const branchSales = filteredSales.filter(s => {
      const cust = customers.find(c => c.id === s.customerId);
      return cust && cust.branchId === branch.id;
    });
    const branchCalls = callLogs.filter(cl => {
      const clDate = new Date(cl.dateTime);
      if (timeframe === 'weekly' && clDate < oneWeekAgo) return false;
      if (timeframe === 'monthly' && clDate < oneMonthAgo) return false;
      const cust = customers.find(c => c.id === cl.customerId);
      return cust && cust.branchId === branch.id;
    });

    const totalRevenue = branchSales.reduce((sum, s) => sum + s.saleAmount, 0);
    const clientsCount = branchCustomers.filter(c => c.customerStage === 'Client').length;
    const score = Math.round((totalRevenue / 1000) + (clientsCount * 60) + (branchCalls.length * 10));

    return { branch, totalRevenue, clientsCount, callsCount: branchCalls.length, score };
  }).sort((a, b) => b.score - a.score);

  // Calculate Top Clients Leaderboard
  const clientScores = customers.map(c => {
    const custSales = filteredSales.filter(s => s.customerId === c.id);
    const totalSpent = custSales.reduce((sum, s) => sum + s.saleAmount, 0) || c.dealValue || 0;
    const totalPurchases = custSales.reduce((sum, s) => sum + s.quantity, 0) || 1;
    const maxStreak = Math.max(0, ...Object.values(c.consecutivePurchaseStreak || {}));
    
    // Score = totalSpent / 1000 + purchases * 20 + streak * 30
    const score = Math.round((totalSpent / 1000) + (totalPurchases * 20) + (maxStreak * 30));

    return {
      customer: c,
      totalSpent,
      totalPurchases,
      maxStreak,
      score,
    };
  }).sort((a, b) => b.score - a.score);

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/50">🥇</span>;
    if (index === 1) return <span className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-300/20 text-zinc-300 font-bold border border-zinc-400/50">🥈</span>;
    if (index === 2) return <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 font-bold border border-amber-700/50">🥉</span>;
    return <span className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs">{index + 1}</span>;
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Scoreboard & Leaderboards</span>
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Track top-performing sales staff, branch offices, and VIP printing clients across weekly, monthly, and all-time periods.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setBoardType('staff')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${boardType === 'staff' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Staff & Branches
            </button>
            <button
              onClick={() => setBoardType('clients')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${boardType === 'clients' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Top Clients
            </button>
          </div>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {(['weekly', 'monthly', 'all'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${timeframe === t ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                {t === 'all' ? 'All-Time' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {boardType === 'staff' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Rep Leaderboard */}
          <div className={`p-6 rounded-xl border ${cardBg} space-y-4`}>
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Sales Representatives ({timeframe})</h3>
            </div>
            <div className="space-y-3">
              {userScores.map((item, index) => (
                <div key={item.user.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${rowBg}`}>
                  <div className="flex items-center gap-3">
                    {getRankBadge(index)}
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100">{item.user.name}</h4>
                      <p className="text-xs text-zinc-400">{item.user.role} • {item.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-amber-400">{item.score.toLocaleString()} pts</div>
                    <div className="text-[11px] text-zinc-400">{item.dealsWon} deals • {item.totalRevenue.toLocaleString()} ETB</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Branch Leaderboard */}
          <div className={`p-6 rounded-xl border ${cardBg} space-y-4`}>
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
              <Building2 className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Branch Hubs ({timeframe})</h3>
            </div>
            <div className="space-y-3">
              {branchScores.map((item, index) => (
                <div key={item.branch.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${rowBg}`}>
                  <div className="flex items-center gap-3">
                    {getRankBadge(index)}
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100">{item.branch.name}</h4>
                      <p className="text-xs text-zinc-400">Sub-city: {item.branch.subCity} • {item.clientsCount} clients</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-emerald-400">{item.score.toLocaleString()} pts</div>
                    <div className="text-[11px] text-zinc-400">{item.totalRevenue.toLocaleString()} ETB</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Top Clients Leaderboard */
        <div className={`p-6 rounded-xl border ${cardBg} space-y-4`}>
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
            <Crown className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Top Printing Clients & Machinery Buyers ({timeframe})</h3>
          </div>
          <div className="space-y-3">
            {clientScores.map((item, index) => {
              const branch = branches.find(b => b.id === item.customer.branchId);
              return (
                <div key={item.customer.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${rowBg}`}>
                  <div className="flex items-center gap-3">
                    {getRankBadge(index)}
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100">{item.customer.customerName}</h4>
                      <p className="text-xs text-zinc-400">
                        {item.customer.companyName || 'Independent'} • <span className="text-amber-300">{branch?.name || 'Branch'}</span> • Stage: <strong className="text-zinc-200">{item.customer.customerStage}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {item.maxStreak > 0 && (
                      <span className="hidden md:inline-flex items-center gap-1 text-xs bg-amber-950/60 text-amber-300 px-2 py-1 rounded-full border border-amber-800/60 font-semibold">
                        🔥 {item.maxStreak} Streak
                      </span>
                    )}
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-emerald-400">{item.totalSpent.toLocaleString()} ETB</div>
                      <div className="text-[11px] text-zinc-400">{item.score.toLocaleString()} score • {item.totalPurchases} units</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
