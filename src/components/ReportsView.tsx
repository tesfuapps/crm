import React, { useState, useRef } from 'react';
import { Customer, CallLog, ProductSale, Branch } from '../types/crm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Building2, Download, Award, DollarSign, Brain, Sparkles, AlertTriangle, ChevronRight, FileImage, FileText } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';

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

  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);

  const filteredCustomers = selectedBranchId === 'all' ? customers : customers.filter(c => c.branchId === selectedBranchId);
  const filteredSales = selectedBranchId === 'all'
    ? sales
    : sales.filter(s => { const cust = customers.find(c => c.id === s.customerId); return cust && cust.branchId === selectedBranchId; });

  const sourceCounts: Record<string, number> = {};
  filteredCustomers.forEach(c => { sourceCounts[c.source] = (sourceCounts[c.source] || 0) + 1; });
  const sourceData = Object.keys(sourceCounts).map(source => ({ name: source, value: sourceCounts[source] }));
  const COLORS = ['#F59E0B', '#0284C7', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];

  const contactCount = filteredCustomers.filter(c => c.customerStage === 'Contact').length;
  const leadCount = filteredCustomers.filter(c => c.customerStage === 'Lead').length;
  const customerCount = filteredCustomers.filter(c => c.customerStage === 'Customer').length;
  const clientCount = filteredCustomers.filter(c => c.customerStage === 'Client').length;

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

  const downloadChart = async (elementId: string, format: 'png' | 'jpeg', filename: string) => {
    const container = document.getElementById(elementId);
    if (!container) return;

    try {
      const filter = (node: HTMLElement) => !node.classList?.contains('no-export');
      const dataUrl = format === 'jpeg'
        ? await toJpeg(container, { backgroundColor: '#141414', quality: 0.95, pixelRatio: 2, filter })
        : await toPng(container, { backgroundColor: '#141414', quality: 0.95, pixelRatio: 2, filter });

      const link = document.createElement('a');
      link.download = `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };

  const handleExportPDF = (title: string, dataSummary: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - TTM CRM Report</title>
          <style>
            body { font-family: Inter, sans-serif; padding: 40px; color: #111; background: #fff; }
            h1 { color: #0F766E; font-size: 24px; margin-bottom: 4px; }
            p { color: #555; font-size: 14px; margin-bottom: 20px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #fdfdfd; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 10px; font-size: 13px; text-align: left; }
            th { background: #0F766E; color: #fff; }
          </style>
        </head>
        <body>
          <h1>TTM CRM Executive Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()} • Period: ${reportPeriod.toUpperCase()}</p>
          <div class="card">
            <h3>${title}</h3>
            <p>${dataSummary}</p>
          </div>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Revenue</td><td>${totalRevenue.toLocaleString()} ETB</td></tr>
            <tr><td>Active Customers</td><td>${filteredCustomers.length}</td></tr>
            <tr><td>Total Call Logs</td><td>${callLogs.length}</td></tr>
            <tr><td>Client Conversion Rate</td><td>${filteredCustomers.length > 0 ? ((clientCount / filteredCustomers.length) * 100).toFixed(0) : '0'}%</td></tr>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60 shadow-lg' : 'bg-white border-slate-200 shadow-sm';
  const cardText = isDark ? 'text-zinc-100' : 'text-slate-900';
  const subText = isDark ? 'text-zinc-400' : 'text-slate-500';
  const primaryBtn = isDark ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-teal-700 hover:bg-teal-800 text-white';

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
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h2 className="text-xl font-bold text-white">Sales & Operations Analytics</h2>
          <p className={`text-sm mt-0.5 ${subText}`}>Modern interactive reports with high-resolution export for PNG, JPG, and PDF.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 p-1 rounded-xl text-xs font-medium">
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button key={p} onClick={() => setReportPeriod(p)} className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${reportPeriod === p ? 'bg-zinc-800 text-amber-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}>{p}</button>
            ))}
          </div>
          <button onClick={() => handleExportPDF('Executive Revenue & Lead Summary', 'Comprehensive branch and lead source distribution analysis.')} className={`px-4 py-2 ${primaryBtn} rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm`}>
            <Download className="w-3.5 h-3.5" /> <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${subText}`}>Total Revenue ({reportPeriod})</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalRevenue.toLocaleString()} ETB</h3>
            <p className="text-xs text-emerald-400 mt-1 font-semibold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> +18.4% vs previous period</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/40 text-emerald-400 flex items-center justify-center border border-emerald-800/60"><DollarSign className="w-6 h-6" /></div>
        </div>
        <div className={`p-6 rounded-2xl border flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${subText}`}>Active Customers</p>
            <h3 className="text-2xl font-bold text-white mt-1">{filteredCustomers.length}</h3>
            <p className="text-xs text-amber-400 mt-1 font-semibold">Across selected branches</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/40 text-amber-400 flex items-center justify-center border border-amber-800/60"><Award className="w-6 h-6" /></div>
        </div>
        <div className={`p-6 rounded-2xl border flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${subText}`}>Total Call Logs</p>
            <h3 className="text-2xl font-bold text-white mt-1">{callLogs.length}</h3>
            <p className="text-xs text-purple-400 mt-1 font-semibold">Recorded agent calls</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-950/40 text-purple-400 flex items-center justify-center border border-purple-800/60"><BarChart3 className="w-6 h-6" /></div>
        </div>
      </div>

      {/* AI Insights Toggle */}
      <div>
        <button onClick={() => setShowAIInsights(!showAIInsights)} className={`w-full ${cardBg} rounded-2xl border p-4 flex items-center justify-between cursor-pointer hover:border-amber-700 transition-colors`}>
          <div className="flex items-center gap-3">
            <Brain className={`w-5 h-5 ${showAIInsights ? 'text-amber-400' : 'text-zinc-500'}`} />
            <span className="font-bold text-white text-sm">AI Insights & Forecasting</span>
            <span className="text-[10px] bg-amber-950/40 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-800/60 font-semibold">BETA</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${showAIInsights ? 'rotate-90' : ''}`} />
        </button>

        {showAIInsights && (
          <div className={`mt-4 rounded-2xl border ${cardBg} overflow-hidden`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className={`p-6 border-b md:border-b-0 md:border-r ${isDark ? 'border-zinc-800/60' : 'border-slate-200'}`}>
                <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Sales Forecast
                </h4>
                <div className="space-y-2">
                  <div className={`text-sm ${subText}`}>Forecasted deal value: <span className="text-emerald-400 font-bold">{filteredCustomers.filter(c => c.customerStage === 'Lead' || c.customerStage === 'Customer').reduce((s, c) => s + c.dealValue, 0).toLocaleString()} ETB</span></div>
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Charts Grid with PNG, JPG, PDF Export Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Revenue Comparison */}
        <div id="chart-branch-revenue" className={`p-6 rounded-2xl border ${cardBg} space-y-4`} ref={barChartRef}>
          <div className="flex items-center justify-between">
            <h3 className={`font-bold flex items-center gap-2 ${cardText}`}><Building2 className="w-4 h-4 text-amber-400" /> <span>Branch Revenue Comparison (ETB)</span></h3>
            <div className="flex items-center gap-1.5 no-export">
              <button onClick={() => downloadChart('chart-branch-revenue', 'png', 'TTM_Branch_Revenue')} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer" title="Download PNG">
                <FileImage className="w-3 h-3 text-sky-400" /> PNG
              </button>
              <button onClick={() => downloadChart('chart-branch-revenue', 'jpeg', 'TTM_Branch_Revenue')} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer" title="Download JPG">
                <FileImage className="w-3 h-3 text-amber-400" /> JPG
              </button>
              <button onClick={() => handleExportPDF('Branch Revenue Comparison', 'Branch revenue breakdown across Bole, Mexico, and Piassa show-rooms.')} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer" title="Download PDF">
                <FileText className="w-3 h-3 text-emerald-400" /> PDF
              </button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchRevenueData}>
                <XAxis dataKey="name" stroke="#A1A1AA" fontSize={12} tickLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '10px', color: '#fff', fontSize: '12px' }} formatter={(val: any) => [`${Number(val).toLocaleString()} ETB`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Distribution */}
        <div id="chart-lead-source" className={`p-6 rounded-2xl border ${cardBg} space-y-4`} ref={pieChartRef}>
          <div className="flex items-center justify-between">
            <h3 className={`font-bold flex items-center gap-2 ${cardText}`}><TrendingUp className="w-4 h-4 text-amber-400" /> <span>Lead Source Distribution</span></h3>
            <div className="flex items-center gap-1.5 no-export">
              <button onClick={() => downloadChart('chart-lead-source', 'png', 'TTM_Lead_Sources')} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer" title="Download PNG">
                <FileImage className="w-3 h-3 text-sky-400" /> PNG
              </button>
              <button onClick={() => downloadChart('chart-lead-source', 'jpeg', 'TTM_Lead_Sources')} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer" title="Download JPG">
                <FileImage className="w-3 h-3 text-amber-400" /> JPG
              </button>
              <button onClick={() => handleExportPDF('Lead Source Distribution', 'Breakdown of customer acquisition sources (Telegram, Facebook, Referral, etc.).')} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer" title="Download PDF">
                <FileText className="w-3 h-3 text-emerald-400" /> PDF
              </button>
            </div>
          </div>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={{ stroke: '#71717A' }}>
                  {sourceData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#18181b" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '10px', color: '#fff', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Color Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-300">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Telegram</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Referral</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Walk-in</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Facebook</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Exhibition</span>
          </div>
        </div>
      </div>
    </div>
  );
};
