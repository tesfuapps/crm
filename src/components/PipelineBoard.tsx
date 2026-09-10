import React from 'react';
import { Customer, CustomerStage, Branch, User } from '../types/crm';
import { PhoneCall, Building2, ChevronRight, ChevronLeft, User as UserIcon } from 'lucide-react';

interface PipelineBoardProps {
  customers: Customer[];
  branches: Branch[];
  users: User[];
  selectedBranchId: string;
  onUpdateCustomerStage: (customerId: string, newStage: CustomerStage) => void;
  onSelectCustomer: (customer: Customer) => void;
  onOpenLogCall: (customer: Customer) => void;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  customers,
  branches,
  users,
  selectedBranchId,
  onUpdateCustomerStage,
  onSelectCustomer,
  onOpenLogCall,
}) => {
  const stages: { id: CustomerStage; label: string; color: string; border: string }[] = [
    { id: 'Contact', label: 'Contact', color: 'bg-sky-50 text-sky-800', border: 'border-sky-200' },
    { id: 'Lead', label: 'Lead', color: 'bg-amber-50 text-amber-800', border: 'border-amber-200' },
    { id: 'Customer', label: 'Customer', color: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-200' },
    { id: 'Client', label: 'Client', color: 'bg-purple-50 text-purple-800', border: 'border-purple-200' },
  ];

  const filteredCustomers = selectedBranchId === 'all'
    ? customers
    : customers.filter(c => c.branchId === selectedBranchId);

  const getNextStage = (current: CustomerStage): CustomerStage | null => {
    switch (current) {
      case 'Contact': return 'Lead';
      case 'Lead': return 'Customer';
      case 'Customer': return 'Client';
      case 'Client': return null;
    }
  };

  const getPrevStage = (current: CustomerStage): CustomerStage | null => {
    switch (current) {
      case 'Contact': return null;
      case 'Lead': return 'Contact';
      case 'Customer': return 'Lead';
      case 'Client': return 'Customer';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pipeline Kanban Board</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Track and advance customers from initial contact to paying client.
          </p>
        </div>
        <div className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg">
          Total in pipeline: {filteredCustomers.length}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {stages.map((stage) => {
          const stageCustomers = filteredCustomers.filter(c => c.customerStage === stage.id);
          const totalValue = stageCustomers.reduce((sum, c) => sum + (c.dealValue || 0), 0);

          return (
            <div key={stage.id} className="bg-slate-100/80 rounded-xl border border-slate-200 p-4 flex flex-col min-h-[500px]">
              {/* Column Header */}
              <div className={`p-3 rounded-lg border ${stage.color} ${stage.border} font-bold flex items-center justify-between mb-4`}>
                <span className="text-sm">{stage.label}</span>
                <span className="text-xs px-2 py-0.5 bg-white/80 rounded-full shadow-xs">
                  {stageCustomers.length}
                </span>
              </div>

              {/* Stage Total Deal Value */}
              <div className="text-xs font-semibold text-slate-500 px-1 mb-3 flex items-center justify-between">
                <span>Value:</span>
                <span className="text-slate-900 font-bold">{totalValue.toLocaleString()} ETB</span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageCustomers.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                    No customers in {stage.label}
                  </div>
                ) : (
                  stageCustomers.map((cust) => {
                    const next = getNextStage(cust.customerStage);
                    const prev = getPrevStage(cust.customerStage);
                    const branch = branches.find(b => b.id === cust.branchId);

                    return (
                      <div
                        key={cust.id}
                        className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-teal-400 transition-all space-y-3 group"
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            onClick={() => onSelectCustomer(cust)}
                            className="cursor-pointer"
                          >
                            <h4 className="font-bold text-sm text-slate-900 hover:text-teal-700 transition-colors">
                              {cust.customerName}
                            </h4>
                            <p className="text-xs text-slate-500">{cust.companyName || 'Independent'}</p>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            cust.leadPriority === 'Hot' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {cust.leadPriority}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 text-slate-600">
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-slate-400">Phone:</span>
                            <span className="text-slate-800">{cust.phoneNumber}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Deal:</span>
                            <span className="font-semibold text-emerald-700">{cust.dealValue.toLocaleString()} ETB</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                            <span>{branch?.name || 'Branch'}</span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{cust.source}</span>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 opacity-90 group-hover:opacity-100">
                          <div className="flex items-center gap-1">
                            {prev && (
                              <button
                                onClick={() => onUpdateCustomerStage(cust.id, prev)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                                title={`Move to ${prev}`}
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => onOpenLogCall(cust)}
                            className="text-[11px] font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition-colors flex items-center gap-1"
                          >
                            <span>Log Call</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {next && (
                              <button
                                onClick={() => onUpdateCustomerStage(cust.id, next)}
                                className="p-1 text-teal-700 hover:bg-teal-100 rounded font-bold"
                                title={`Advance to ${next}`}
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
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
