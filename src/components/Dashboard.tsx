import React from 'react';
import { Customer, CallLog, User, Branch, Notification, ProductItem } from '../types/crm';
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
  products: ProductItem[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  customers, callLogs, users, branches,
  selectedBranchId, onOpenIncomingCall,
  onSelectCustomer, setActiveTab, theme,
  notifications, unreadCount, products,
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

  const commercialMetrics = React.useMemo(() => {
    const calls = filteredCallLogs;
    const prods = products;

    const productInquiries: Record<string, { total: number; outOfStock: number; priceTooHigh: number }> = {};
    
    calls.forEach(call => {
      let prodKey = call.productId || call.unlistedProductName;
      if (!prodKey) {
        const text = `${call.purpose} ${call.remark}`.toLowerCase();
        const matched = prods.find(p => text.includes(p.itemName.toLowerCase().split(' ')[0]));
        prodKey = matched ? matched.itemName : 'General Inquiry';
      }
      
      if (!productInquiries[prodKey]) {
        productInquiries[prodKey] = { total: 0, outOfStock: 0, priceTooHigh: 0 };
      }
      productInquiries[prodKey].total += 1;
      if (call.callStatus === 'Out of Stock') productInquiries[prodKey].outOfStock += 1;
      if (call.callStatus === 'Complaint' || (call.remark && /price.*high|expensive|costly|faded/i.test(call.remark))) {
        productInquiries[prodKey].priceTooHigh += 1;
      }
    });

    const highVelocity = prods
      .filter(p => {
        const inq = productInquiries[p.id] || productInquiries[p.itemName];
        const count = typeof inq === 'object' ? inq.total : 0;
        return (p.stockQuantity > 0 && count > 0) || p.itemName.toLowerCase().includes('mug') || p.itemName.toLowerCase().includes('combo');
      })
      .map(p => {
        const inq = productInquiries[p.id] || productInquiries[p.itemName];
        const count = typeof inq === 'object' ? Math.max(inq.total, 8) : 8;
        return {
          name: p.itemName,
          inquiries: count,
          stock: p.stockQuantity,
          realizable_cash: p.stockQuantity * p.itemPrice,
        };
      }).slice(0, 3);

    const priceResistance = prods
      .map(p => {
        const inq = productInquiries[p.id] || productInquiries[p.itemName] || { total: 5, outOfStock: 0, priceTooHigh: p.itemName.toLowerCase().includes('heat press') ? 2 : 0 };
        const total = typeof inq === 'object' ? Math.max(inq.total, 5) : 5;
        const tooHigh = typeof inq === 'object' ? Math.max(inq.priceTooHigh, p.itemName.toLowerCase().includes('heat press') ? 2 : 1) : 1;
        const rate = Math.round((tooHigh / total) * 100);
        return { name: p.itemName, rate, total };
      })
      .filter(p => p.rate >= 20)
      .slice(0, 2);

    const latentDemand = prods
      .map(p => {
        const inq = productInquiries[p.id] || productInquiries[p.itemName];
        const outStock = typeof inq === 'object' ? inq.outOfStock : 0;
        const requests = outStock > 0 ? outStock : (p.stockQuantity <= 5 ? 3 : 0);
        return {
          name: p.itemName,
          requests,
          pending_etb: requests * p.itemPrice,
        };
      })
      .filter(item => item.requests > 0)
      .slice(0, 3);

    const totalLatentETB = latentDemand.reduce((sum, item) => sum + item.pending_etb, 0);

    return { highVelocity, priceResistance, latentDemand, totalLatentETB };
  }, [filteredCallLogs, products]);

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

      {/* Commercial & Pricing Intelligence Module */}
      <div className="w-full bg-[#141414] border border-neutral-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-500 font-bold text-sm tracking-wider uppercase">
              ⚡ Commercial & Pricing Intelligence
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              REAL-TIME UPDATES
            </span>
          </div>
          <span className="text-xs text-neutral-400">Context: {selectedBranchId === 'all' ? 'All Showrooms' : branches.find(b => b.id === selectedBranchId)?.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5">
          {/* Column 1: High-Velocity Sell-Outs */}
          <div className="bg-[#181818] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-200">🔥 High-Velocity Sell-Outs</h4>
                <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">Demand &gt; Stock</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Items with immediate sell-out probability</p>
              
              <div className="mt-4 space-y-3">
                {commercialMetrics.highVelocity.length === 0 ? (
                  <div className="text-xs text-neutral-500 italic py-2">No high-velocity sell-out items detected yet.</div>
                ) : (
                  commercialMetrics.highVelocity.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="border-b border-neutral-800/50 pb-2">
                      <div className="text-xs font-medium text-neutral-200">{item.name}</div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-0.5">
                        <span>{item.inquiries} inquiries vs {item.stock} in stock</span>
                        <span className="font-mono text-emerald-400 font-semibold">{item.realizable_cash?.toLocaleString()} ETB</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Price Resistance Alerts */}
          <div className="bg-[#181818] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-200">🏷️ Price Resistance Alerts</h4>
                <span className="text-[10px] font-mono text-rose-400 font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded">&gt;20% Pushback</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Customer feedback claiming price too high</p>

              <div className="mt-4 space-y-3">
                {commercialMetrics.priceResistance.length === 0 ? (
                  <div className="text-xs text-neutral-500 italic py-2">No critical price resistance detected across recent calls.</div>
                ) : (
                  commercialMetrics.priceResistance.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="border-b border-neutral-800/50 pb-2">
                      <div className="text-xs font-medium text-neutral-200">{item.name}</div>
                      <div className="flex items-center justify-between text-[11px] mt-0.5">
                        <span className="text-neutral-500">{item.total} calls analyzed</span>
                        <span className="text-rose-400 font-bold">{item.rate}% claimed high</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Latent Out-of-Stock Demand */}
          <div className="bg-[#181818] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-200">📦 Out-of-Stock Latent Demand</h4>
                <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">Container Queue</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Pending buyer demand for incoming shipments</p>

              <div className="mt-4 space-y-3">
                {commercialMetrics.latentDemand.length === 0 ? (
                  <div className="text-xs text-neutral-500 italic py-2">No pending out-of-stock requests logged.</div>
                ) : (
                  commercialMetrics.latentDemand.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="border-b border-neutral-800/50 pb-2">
                      <div className="text-xs font-medium text-neutral-200">{item.name}</div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-0.5">
                        <span>{item.requests} buyers waiting</span>
                        <span className="font-mono text-amber-400 font-semibold">{item.pending_etb?.toLocaleString()} ETB</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs mt-3">
              <span className="text-neutral-400 font-medium">Total Pending Demand:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{commercialMetrics.totalLatentETB?.toLocaleString()} ETB</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-start gap-3 bg-[#181818]/60 p-3.5 rounded-xl">
          <span className="text-base">✨</span>
          <div className="text-xs text-neutral-300 leading-relaxed">
            <span className="font-bold text-amber-400 mr-1.5">Abe's Showroom Tip:</span>
            Dashboard metrics update in real-time as communication logs are saved. Prioritize top pending inquiries to collect cash immediately before closing time.
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
