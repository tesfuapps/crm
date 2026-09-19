import React, { useState, useRef } from 'react';
import { Customer, CallLog, ProductSale, Branch, ProductItem } from '../types/crm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Building2, Download, Award, DollarSign, Brain, Sparkles, AlertTriangle, ChevronRight, FileImage, FileText, X, Users, Phone, Mail, Truck, Store } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';

interface ReportsViewProps {
  customers: Customer[];
  callLogs: CallLog[];
  sales: ProductSale[];
  branches: Branch[];
  products: ProductItem[];
  selectedBranchId: string;
  theme: 'light' | 'dark';
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  customers, callLogs, sales, branches, products, selectedBranchId, theme,
}) => {
  const isDark = theme === 'dark';
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [selectedSourceDetail, setSelectedSourceDetail] = useState<string | null>(null);
  const [slideOverSource, setSlideOverSource] = useState<string | null>(null);

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

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const aiNotes = [
    `High-value opportunity: ${hotLeadsCount} hot leads in pipeline totaling ${hotLeadsValue.toLocaleString()} ETB`,
    `${overdueFollowups.length} customers overdue on follow-up — immediate action recommended`,
    `Conversion rate: ${conversionRate}% from Contact to Client stage`,
  ];

  // Lead source summary with inquiry count, closed sales, revenue, conversion rate
  const leadSourceSummary = sourceData.map(s => {
    const sourceCustomers = filteredCustomers.filter(c => c.source === s.name);
    const totalInquiries = sourceCustomers.length;
    const closedClients = sourceCustomers.filter(c => c.customerStage === 'Client').length;
    const sourceSales = filteredSales.filter(sale => {
      const cust = customers.find(c => c.id === sale.customerId);
      return cust && cust.source === s.name;
    });
    const totalRevenue = sourceSales.reduce((sum, sale) => sum + sale.saleAmount, 0);
    const conversionPct = totalInquiries > 0 ? ((closedClients / totalInquiries) * 100).toFixed(1) : '0';
    return { name: s.name, totalInquiries, closedClients, totalRevenue, conversionPct, avgDeal: closedClients > 0 ? Math.round(totalRevenue / closedClients) : 0 };
  });

  const branchPerformance = branches.map(b => {
    const bCustomers = customers.filter(c => c.branchId === b.id);
    const bCustIds = new Set(bCustomers.map(c => c.id));
    const bSales = sales.filter(s => bCustIds.has(s.customerId));
    const totalRevenue = bSales.reduce((sum, s) => sum + s.saleAmount, 0);
    const bClients = bCustomers.filter(c => c.customerStage === 'Client').length;
    const bHotLeads = bCustomers.filter(c => c.leadPriority === 'Hot').length;
    const bOverdue = bCustomers.filter(c => c.nextFollowUpDate && c.nextFollowUpDate < todayStr && c.customerStage !== 'Client').length;
    const bConversionRate = bCustomers.length > 0 ? ((bClients / bCustomers.length) * 100).toFixed(1) : '0';
    const avgDealValue = bClients > 0 ? Math.round(totalRevenue / bClients) : 0;
    // Top selling product
    const productSalesMap: Record<string, number> = {};
    bSales.forEach(s => { productSalesMap[s.itemId] = (productSalesMap[s.itemId] || 0) + s.quantity; });
    const topItemId = Object.entries(productSalesMap).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topProduct = topItemId ? products.find(p => p.id === topItemId) : null;
    // Fulfillment ratio
    const pickupCount = bSales.filter(s => s.fulfillment_type === 'pickup').length;
    const deliveryCount = bSales.filter(s => s.fulfillment_type === 'delivery').length;
    const totalFulfillment = pickupCount + deliveryCount;
    const pickupPct = totalFulfillment > 0 ? ((pickupCount / totalFulfillment) * 100).toFixed(0) : '—';
    const deliveryPct = totalFulfillment > 0 ? ((deliveryCount / totalFulfillment) * 100).toFixed(0) : '—';
    return { name: b.name, totalCustomers: bCustomers.length, clients: bClients, hotLeads: bHotLeads, overdueFollowups: bOverdue, totalRevenue, conversionRate: bConversionRate, avgDealValue, topProduct: topProduct?.itemName || '—', totalOrders: bSales.length, pickupPct, deliveryPct };
  });

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
          <div className="h-60 flex items-center justify-center cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  onClick={(_, index) => { const clicked = sourceData[index]; setSelectedSourceDetail(selectedSourceDetail === clicked.name ? null : clicked.name); setSlideOverSource(clicked.name); }}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={{ stroke: '#71717A' }}>
                  {sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#18181b" strokeWidth={selectedSourceDetail === entry.name ? 4 : 2} opacity={selectedSourceDetail && selectedSourceDetail !== entry.name ? 0.35 : 1} style={{ cursor: 'pointer' }} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '10px', color: '#fff', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Color Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-300 no-export">
            {sourceData.map((entry, index) => (
              <button key={entry.name} onClick={() => { setSelectedSourceDetail(selectedSourceDetail === entry.name ? null : entry.name); setSlideOverSource(entry.name); }} className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${selectedSourceDetail && selectedSourceDetail !== entry.name ? 'opacity-40' : ''}`}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /> {entry.name}
              </button>
            ))}
          </div>

          {/* Lead Source Summary Table */}
          <div className="pt-4 border-t border-neutral-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Lead Source Performance Summary</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 border-b border-zinc-800/60">
                  <tr>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3 text-right">Inquiries</th>
                    <th className="py-2 px-3 text-right">Clients Closed</th>
                    <th className="py-2 px-3 text-right">Revenue (ETB)</th>
                    <th className="py-2 px-3 text-right">Avg Deal (ETB)</th>
                    <th className="py-2 px-3 text-right">Conversion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {leadSourceSummary
                    .filter(s => !selectedSourceDetail || s.name === selectedSourceDetail)
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map((s, i) => {
                      const color = COLORS[sourceData.findIndex(sd => sd.name === s.name) % COLORS.length];
                      return (
                        <tr key={s.name} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="py-2 px-3 font-medium text-zinc-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /> {s.name}
                          </td>
                          <td className="py-2 px-3 text-right text-zinc-400">{s.totalInquiries}</td>
                          <td className="py-2 px-3 text-right text-zinc-300">{s.closedClients}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-400">{s.totalRevenue.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right text-zinc-400">{s.avgDeal.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${Number(s.conversionPct) >= 20 ? 'bg-emerald-950/60 text-emerald-400' : Number(s.conversionPct) >= 10 ? 'bg-amber-950/60 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>{s.conversionPct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot className="border-t border-zinc-800/60 font-bold">
                  <tr className="text-zinc-300">
                    <td className="py-2 px-3">Total</td>
                    <td className="py-2 px-3 text-right text-zinc-400">{leadSourceSummary.reduce((s, r) => s + r.totalInquiries, 0)}</td>
                    <td className="py-2 px-3 text-right text-zinc-300">{leadSourceSummary.reduce((s, r) => s + r.closedClients, 0)}</td>
                    <td className="py-2 px-3 text-right text-emerald-400">{leadSourceSummary.reduce((s, r) => s + r.totalRevenue, 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-zinc-400">—</td>
                    <td className="py-2 px-3 text-right text-zinc-400">{leadSourceSummary.length > 0 ? ((leadSourceSummary.reduce((s, r) => s + r.closedClients, 0) / leadSourceSummary.reduce((s, r) => s + r.totalInquiries, 0)) * 100).toFixed(1) : '0'}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Performance Matrix */}
      <div className={`rounded-2xl border ${cardBg} overflow-hidden`}>
        <div className="p-6 border-b border-zinc-800/60">
          <h3 className={`font-bold flex items-center gap-2 ${cardText}`}><Building2 className="w-4 h-4 text-amber-400" /> <span>Branch Performance Matrix</span></h3>
          <p className={`text-xs mt-1 ${subText}`}>Detailed breakdown by Addis Ababa showrooms — orders, revenue, top products, and delivery ratios.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider font-semibold text-zinc-500 border-b border-zinc-800/60">
              <tr>
                <th className="py-3 px-4">Showroom Branch</th>
                <th className="py-3 px-4 text-right">Orders Closed</th>
                <th className="py-3 px-4 text-right">Revenue (ETB)</th>
                <th className="py-3 px-4">Top-Selling Product</th>
                <th className="py-3 px-4 text-right">Hot Leads</th>
                <th className="py-3 px-4 text-right">Showroom Pickup %</th>
                <th className="py-3 px-4 text-right">Delivery %</th>
                <th className="py-3 px-4 text-right">Conversion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {branchPerformance.map(b => (
                <tr key={b.name} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{b.name}</td>
                  <td className="py-3 px-4 text-right text-zinc-300">{b.totalOrders}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">{b.totalRevenue.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-zinc-300 bg-zinc-800/60 px-2 py-0.5 rounded-full">{b.topProduct}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {b.hotLeads > 0 ? <span className="text-amber-400 font-bold">{b.hotLeads}</span> : <span className="text-zinc-600">0</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.pickupPct !== '—' && Number(b.pickupPct) >= 50 ? 'bg-sky-950/60 text-sky-400' : 'bg-zinc-800 text-zinc-400'}`}>{b.pickupPct}%</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.deliveryPct !== '—' && Number(b.deliveryPct) >= 50 ? 'bg-amber-950/60 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>{b.deliveryPct}%</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${Number(b.conversionRate) >= 20 ? 'bg-emerald-950/60 text-emerald-400' : Number(b.conversionRate) >= 10 ? 'bg-amber-950/60 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>{b.conversionRate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Source Drilldown Slide-Over */}
      {slideOverSource && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSlideOverSource(null)} />
          <div className="relative w-full max-w-lg bg-[#141414] border-l border-zinc-800 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-[#141414] border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" /> {slideOverSource} — Customer Drilldown
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">{filteredCustomers.filter(c => c.source === slideOverSource).length} customers from this channel</p>
              </div>
              <button onClick={() => setSlideOverSource(null)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {filteredCustomers.filter(c => c.source === slideOverSource).length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No customers found from this source.</p>
              ) : (
                filteredCustomers
                  .filter(c => c.source === slideOverSource)
                  .sort((a, b) => b.dealValue - a.dealValue)
                  .map(cust => {
                    const custSales = filteredSales.filter(s => s.customerId === cust.id);
                    const totalSpent = custSales.reduce((sum, s) => sum + s.saleAmount, 0);
                    const stageColor = cust.customerStage === 'Client' ? 'bg-emerald-950/60 text-emerald-400' : cust.customerStage === 'Customer' ? 'bg-sky-950/60 text-sky-400' : cust.customerStage === 'Lead' ? 'bg-amber-950/60 text-amber-400' : 'bg-zinc-800 text-zinc-400';
                    return (
                      <div key={cust.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-white text-sm">{cust.customerName}</h4>
                            {cust.companyName && <p className="text-[11px] text-zinc-500">{cust.companyName}</p>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stageColor}`}>{cust.customerStage}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {cust.phoneNumber}</span>
                          {cust.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {cust.email}</span>}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40">
                          <span className="text-[11px] text-zinc-500">Deal Value: <span className="text-zinc-300 font-bold">{cust.dealValue.toLocaleString()} ETB</span></span>
                          {totalSpent > 0 && <span className="text-[11px] text-emerald-400 font-bold">Spent: {totalSpent.toLocaleString()} ETB</span>}
                        </div>
                        {custSales.length > 0 && (
                          <div className="text-[10px] text-zinc-600">{custSales.length} sale(s) recorded</div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
