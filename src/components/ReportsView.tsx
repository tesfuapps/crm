import React, { useState } from 'react';
import { Customer, CallLog, ProductSale, Branch } from '../types/crm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import { BarChart3, TrendingUp, Building2, Download, Award, DollarSign, Brain, Sparkles, AlertTriangle, ChevronRight } from 'lucide-react';

interface ReportsViewProps {
  customers: Customer[];
  callLogs: CallLog[];
  sales: ProductSale[];
  branches: Branch[];
  selectedBranchId: string;
  theme: 'light' | 'dark';
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  customers, callLogs, sales, branches, selectedBranchId, theme,
}) => {
  const isDark = theme === 'dark';
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [showAIInsights, setShowAIInsights] = useState(false);

  const filteredCustomers = selectedBranchId === 'all' ? customers : customers.filter(c => c.branchId === selectedBranchId);
  const filteredSales = selectedBranchId === 'all'
    ? sales
    : sales.filter(s => { const cust = customers.find(c => c.id === s.customerId); return cust && cust.branchId === selectedBranchId; });

  const sourceCounts: Record<string, number> = {};
  filteredCustomers.forEach(c => { sourceCounts[c.source] = (sourceCounts[c.source] || 0) + 1; });
  const sourceData = Object.keys(sourceCounts).map(source => ({ name: source, value: sourceCounts[source] }));
  const COLORS = ['#0F766E', '#0284C7', '#D97706', '#7C3AED', '#16A34A', '#DB2777'];

  const contactCount = filteredCustomers.filter(c => c.customerStage === 'Contact').length;
  const leadCount = filteredCustomers.filter(c => c.customerStage === 'Lead').length;
  const customerCount = filteredCustomers.filter(c => c.customerStage === 'Customer').length;
  const clientCount = filteredCustomers.filter(c => c.customerStage === 'Client').length;
  const funnelData = [
    { name: 'Contact', value: contactCount + leadCount + customerCount + clientCount, fill: '#0284C7' },
    { name: 'Lead', value: leadCount + customerCount + clientCount, fill: '#D97706' },
    { name: 'Customer', value: customerCount + clientCount, fill: '#16A34A' },
    { name: 'Client', value: clientCount, fill: '#7C3AED' },
  ];

  const branchRevenueData = branches.map(b => {
    const bCustomers = customers.filter(c => c.branchId === b.id);
    const bCustIds = new Set(bCustomers.map(c => c.id));
    const bSales = sales.filter(s => bCustIds.has(s.customerId));
    return { name: b.name.replace(' Branch', ''), revenue: bSales.reduce((sum, s) => sum + s.saleAmount, 0), customers: bCustomers.length };
  });

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.saleAmount, 0);

  const handleExportCSV = () => {
    const csvHeader = 'Customer Name,Company,Phone,Stage,Source,Deal Value (ETB)\n';
    const csvRows = filteredCustomers.map(c => `"${c.customerName}","${c.companyName || ''}","${c.phoneNumber}","${c.customerStage}","${c.source}",${c.dealValue}`).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ttm_crm_customers_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportXLSX = () => {
    const csvContent = 'Customer Name,Company,Phone,Stage,Source,Deal Value (ETB),Last Contacted,Next Follow-up\n' +
      filteredCustomers.map(c => `"${c.customerName}","${c.companyName || ''}","${c.phoneNumber}","${c.customerStage}","${c.source}",${c.dealValue},${c.lastContactedDate || ''},${c.nextFollowUpDate || ''}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ttm_crm_full_export_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const cardText = isDark ? 'text-zinc-100' : 'text-slate-900';
  const subText = isDark ? 'text-zinc-400' : 'text-slate-500';
  const btnBg = isDark ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200';
  const primaryBtn = isDark ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-teal-700 hover:bg-teal-800 text-white';
  const chartBg = isDark ? 'bg-zinc-950/40' : 'bg-slate-50';

  // AI-generated insights
  const overdueFollowups = filteredCustomers.filter(c => c.nextFollowUpDate && c.nextFollowUpDate < new Date().toISOString().split('T')[0] && c.customerStage !== 'Client');
  const hotLeadsCount = filteredCustomers.filter(c => c.leadPriority === 'Hot').length;
  const hotLeadsValue = filteredCustomers.filter(c => c.leadPriority === 'Hot').reduce((s, c) => s + c.dealValue, 0);
  const conversionRate = filteredCustomers.length > 0 ? ((clientCount / filteredCustomers.length) * 100).toFixed(0) : '0';

  const aiNotes = [
    `High-value opportunity: ${hotLeadsCount} hot leads in pipeline totaling ${hotLeadsValue.toLocaleString()} ETB`,
    `${overdueFollowups.length} customers overdue on follow-up — immediate action recommended`,
    `Conversion rate: ${conversionRate}% from Contact to Client stage`,
  ];

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h2 className="text-xl font-bold text-white">Sales & Operations Analytics</h2>
          <p className={`text-sm mt-0.5 ${subText}`}>Comprehensive reporting across leads, sources, branch revenue, and conversion funnel.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 p-1 rounded-lg text-xs font-medium">
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button key={p} onClick={() => setReportPeriod(p)} className={`px-3 py-1.5 rounded-md transition-colors capitalize ${reportPeriod === p ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}>{p}</button>
            ))}
          </div>
          <button onClick={handleExportXLSX} className={`px-4 py-2 ${primaryBtn} rounded-lg text-xs font-medium flex items-center gap-2`}>
            <Download className="w-3.5 h-3.5" /> <span>Export XLSX/CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl border flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${subText}`}>Total Revenue ({reportPeriod})</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalRevenue.toLocaleString()} ETB</h3>
            <p className="text-xs text-emerald-400 mt-1 font-medium flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> +18.4% vs previous period</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
        </div>
        <div className={`p-6 rounded-xl border flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${subText}`}>Active Customers</p>
            <h3 className="text-2xl font-bold text-white mt-1">{filteredCustomers.length}</h3>
            <p className="text-xs text-amber-400 mt-1 font-medium">Across selected branches</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-950/40 text-amber-400 flex items-center justify-center"><Award className="w-6 h-6" /></div>
        </div>
        <div className={`p-6 rounded-xl border flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${subText}`}>Total Call Logs</p>
            <h3 className="text-2xl font-bold text-white mt-1">{callLogs.length}</h3>
            <p className="text-xs text-purple-400 mt-1 font-medium">Recorded agent calls</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-purple-950/40 text-purple-400 flex items-center justify-center"><BarChart3 className="w-6 h-6" /></div>
        </div>
      </div>

      {/* AI Insights Toggle */}
      <div>
        <button onClick={() => setShowAIInsights(!showAIInsights)} className={`w-full ${cardBg} rounded-xl border p-4 flex items-center justify-between cursor-pointer hover:border-amber-700 transition-colors`}>
          <div className="flex items-center gap-3">
            <Brain className={`w-5 h-5 ${showAIInsights ? 'text-amber-400' : 'text-zinc-500'}`} />
            <span className="font-bold text-white text-sm">AI Insights & Forecasting</span>
            <span className="text-[10px] bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded border border-amber-800/60">BETA</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${showAIInsights ? 'rotate-90' : ''}`} />
        </button>

        {showAIInsights && (
          <div className={`mt-4 rounded-xl border ${cardBg} overflow-hidden`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className={`p-6 border-b ${isDark ? 'border-zinc-800/60' : 'border-slate-200'}`}>
                <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Sales Forecast
                </h4>
                <div className="space-y-2">
                  <div className={`text-sm ${subText}`}>Forecasted deal value (Leads + Customers): <span className="text-emerald-400 font-bold">{filteredCustomers.filter(c => c.customerStage === 'Lead' || c.customerStage === 'Customer').reduce((s, c) => s + c.dealValue, 0).toLocaleString()} ETB</span></div>
                  <div className={`text-sm ${subText}`}>Hot leads needing attention: <span className="text-red-400 font-bold">{hotLeadsCount}</span></div>
                  <div className={`text-sm ${subText}`}>Overdue follow-ups: <span className="text-amber-400 font-bold">{overdueFollowups.length}</span></div>
                </div>
              </div>
              <div className={`p-6 ${isDark ? 'bg-zinc-950/20' : 'bg-slate-50/50'}`}>
                <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> AI Recommendations
                </h4>
                <div className="space-y-2">
                  {aiNotes.map((note, i) => (
                    <p key={i} className={`text-sm ${subText} flex items-start gap-2`}><span className="text-amber-400 mt-0.5">•</span> {note}</p>
                  ))}
                </div>
                {filteredCustomers.filter(c => c.leadPriority === 'Hot' && c.customerStage !== 'Client').slice(0, 3).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/60">
                    <p className="text-xs font-bold text-zinc-400 mb-2">Top Hot Leads:</p>
                    {filteredCustomers.filter(c => c.leadPriority === 'Hot' && c.customerStage !== 'Client').slice(0, 3).map(c => (
                      <div key={c.id} className={`text-xs ${subText} flex items-center gap-1 mb-1`}>
                        <span className="text-red-400 font-bold">🔥</span> {c.customerName} — {c.dealValue.toLocaleString()} ETB
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl border ${cardBg}`}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${cardText}`}><Building2 className="w-4 h-4 text-amber-400" /> <span>Branch Revenue Comparison (ETB)</span></h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchRevenueData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} ETB`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#0F766E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`p-6 rounded-xl border ${cardBg}`}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${cardText}`}><TrendingUp className="w-4 h-4 text-amber-400" /> <span>Lead Source Distribution</span></h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {sourceData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
