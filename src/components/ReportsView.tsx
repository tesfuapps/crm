import React, { useState } from 'react';
import { Customer, CallLog, ProductSale, Branch, User } from '../types/crm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import { BarChart3, TrendingUp, Building2, Download, Award, DollarSign } from 'lucide-react';

interface ReportsViewProps {
  customers: Customer[];
  callLogs: CallLog[];
  sales: ProductSale[];
  branches: Branch[];
  selectedBranchId: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  customers,
  callLogs,
  sales,
  branches,
  selectedBranchId,
}) => {
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const filteredCustomers = selectedBranchId === 'all' 
    ? customers 
    : customers.filter(c => c.branchId === selectedBranchId);

  const filteredSales = selectedBranchId === 'all'
    ? sales
    : sales.filter(s => {
        const cust = customers.find(c => c.id === s.customerId);
        return cust && cust.branchId === selectedBranchId;
      });

  // Source breakdown data for pie chart
  const sourceCounts: Record<string, number> = {};
  filteredCustomers.forEach(c => {
    sourceCounts[c.source] = (sourceCounts[c.source] || 0) + 1;
  });
  const sourceData = Object.keys(sourceCounts).map(source => ({
    name: source,
    value: sourceCounts[source],
  }));

  const COLORS = ['#0F766E', '#0284C7', '#D97706', '#7C3AED', '#16A34A', '#DB2777'];

  // Funnel data
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

  // Branch revenue comparison
  const branchRevenueData = branches.map(b => {
    const bCustomers = customers.filter(c => c.branchId === b.id);
    const bCustIds = new Set(bCustomers.map(c => c.id));
    const bSales = sales.filter(s => bCustIds.has(s.customerId));
    const revenue = bSales.reduce((sum, s) => sum + s.saleAmount, 0);
    return {
      name: b.name.replace(' Branch', ''),
      revenue,
      customers: bCustomers.length,
    };
  });

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.saleAmount, 0);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Report Type,Period,Total Revenue (ETB),Total Customers", `Sales Report,${reportPeriod},${totalRevenue},${filteredCustomers.length}`].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ttm_crm_report_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales & Operations Analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Comprehensive reporting across leads, sources, branch revenue, and conversion funnel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setReportPeriod('daily')}
              className={`px-3 py-1.5 rounded-md transition-colors ${reportPeriod === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Daily
            </button>
            <button
              onClick={() => setReportPeriod('weekly')}
              className={`px-3 py-1.5 rounded-md transition-colors ${reportPeriod === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setReportPeriod('monthly')}
              className={`px-3 py-1.5 rounded-md transition-colors ${reportPeriod === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Monthly
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue ({reportPeriod})</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalRevenue.toLocaleString()} ETB</h3>
            <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs previous period
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Customers</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{filteredCustomers.length}</h3>
            <p className="text-xs text-teal-700 mt-1 font-medium">Across selected branches</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Call Logs</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{callLogs.length}</h3>
            <p className="text-xs text-purple-600 mt-1 font-medium">Recorded agent calls</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Revenue Comparison */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-700" />
            <span>Branch Revenue Comparison (ETB)</span>
          </h3>
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

        {/* Lead Source Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-700" />
            <span>Lead Source Distribution</span>
          </h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
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
