import React from 'react';
import { Customer, CustomerStage, Branch, User } from '../types/crm';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface PipelineBoardProps {
  customers: Customer[];
  branches: Branch[];
  users: User[];
  selectedBranchId: string;
  theme: 'light' | 'dark';
  onUpdateCustomerStage: (customerId: string, newStage: CustomerStage) => void;
  onSelectCustomer: (customer: Customer) => void;
  onOpenLogCall: (customer: Customer) => void;
}

const stageConfig: Record<CustomerStage, { label: string; badge: string }> = {
  Contact: { label: 'Contact', badge: 'bg-sky-950/60 text-sky-300 border-sky-800' },
  Lead: { label: 'Lead', badge: 'bg-amber-950/60 text-amber-300 border-amber-800' },
  Customer: { label: 'Customer', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' },
  Client: { label: 'Client', badge: 'bg-purple-950/60 text-purple-300 border-purple-800' },
};

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  customers,
  branches,
  users,
  selectedBranchId,
  theme,
  onUpdateCustomerStage,
  onSelectCustomer,
  onOpenLogCall,
}) => {
  const isDark = theme === 'dark';
  const filteredCustomers = selectedBranchId === 'all' ? customers : customers.filter(c => c.branchId === selectedBranchId);

  const getNextStage = (current: CustomerStage): CustomerStage | null => {
    const map: Record<CustomerStage, CustomerStage | null> = { Contact: 'Lead', Lead: 'Customer', Customer: 'Client', Client: null };
    return map[current];
  };

  const getPrevStage = (current: CustomerStage): CustomerStage | null => {
    const map: Record<CustomerStage, CustomerStage | null> = { Contact: null, Lead: 'Contact', Customer: 'Lead', Client: 'Customer' };
    return map[current];
  };

  const priorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      Hot: 'bg-red-950/60 text-red-400 border-red-800',
      Warm: 'bg-amber-950/60 text-amber-300 border-amber-800',
      Cold: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    };
    return <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${colors[priority] || colors.Cold}`}>{priority}</span>;
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200'}`}>
        <div>
          <h2 className="text-xl font-bold text-white">Pipeline Kanban Board</h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Track and advance customers from initial contact to paying client.</p>
        </div>
        <div className="text-xs font-medium bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg">Total in pipeline: {filteredCustomers.length}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {(Object.keys(stageConfig) as CustomerStage[]).map((stage) => {
          const stageCustomers = filteredCustomers.filter(c => c.customerStage === stage);
          const totalValue = stageCustomers.reduce((sum, c) => sum + (c.dealValue || 0), 0);
          const config = stageConfig[stage];

          return (
            <div key={stage} className={`rounded-xl border p-4 flex flex-col min-h-[500px] ${isDark ? 'bg-zinc-950/40 border-zinc-800/60' : 'bg-slate-100 border-slate-200'}`}>
              <div className={`p-3 rounded-lg border ${config.badge} font-bold flex items-center justify-between mb-4`}>
                <span className="text-sm">{config.label}</span>
                <span className="text-xs px-2 py-0.5 bg-zinc-900/80 rounded-full">{stageCustomers.length}</span>
              </div>
              <div className="text-xs font-semibold text-zinc-400 px-1 mb-3 flex items-center justify-between">
                <span>Value:</span>
                <span className="text-zinc-200 font-bold">{totalValue.toLocaleString()} ETB</span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageCustomers.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500">No customers in {config.label}</div>
                ) : (
                  stageCustomers.map((cust) => {
                    const next = getNextStage(cust.customerStage);
                    const prev = getPrevStage(cust.customerStage);
                    const branch = branches.find(b => b.id === cust.branchId);
                    return (
                      <div key={cust.id} className={`rounded-lg border p-4 space-y-3 group transition-colors ${isDark ? 'bg-zinc-950/60 border-zinc-800/60 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-amber-400'}`}>
                        <div className="flex items-start justify-between">
                          <div onClick={() => onSelectCustomer(cust)} className="cursor-pointer">
                            <h4 className="font-bold text-sm text-zinc-100">{cust.customerName}</h4>
                            <p className="text-xs text-zinc-400">{cust.companyName || 'Independent'}</p>
                          </div>
                          {priorityBadge(cust.leadPriority)}
                        </div>
                        <div className="text-xs space-y-1 text-zinc-400">
                          <div className="flex items-center justify-between"><span className="text-zinc-500">Phone:</span><span className="text-zinc-200 font-mono">{cust.phoneNumber}</span></div>
                          <div className="flex items-center justify-between"><span className="text-zinc-500">Deal:</span><span className="font-semibold text-emerald-400">{cust.dealValue.toLocaleString()} ETB</span></div>
                          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                            <span>{branch?.name || 'Branch'}</span>
                            <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">{cust.source}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 opacity-90 group-hover:opacity-100">
                          <div className="flex items-center gap-1">
                            {prev && <button onClick={() => onUpdateCustomerStage(cust.id, prev)} className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded"><ChevronLeft className="w-3.5 h-3.5" /></button>}
                          </div>
                          <button onClick={() => onOpenLogCall(cust)} className="text-[11px] font-medium text-amber-400 bg-amber-950/30 hover:bg-amber-950/50 px-2 py-1 rounded transition-colors flex items-center gap-1">Log Call</button>
                          <div className="flex items-center gap-1">
                            {next && <button onClick={() => onUpdateCustomerStage(cust.id, next)} className="p-1 text-amber-400 hover:bg-amber-950/30 rounded font-bold"><ChevronRight className="w-3.5 h-3.5" /></button>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
