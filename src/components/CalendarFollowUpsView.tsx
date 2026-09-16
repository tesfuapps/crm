import React, { useState } from 'react';
import { Customer, Branch, User } from '../types/crm';
import { Calendar as CalendarIcon, Clock, Phone, Send, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface CalendarFollowUpsViewProps {
  customers: Customer[];
  branches: Branch[];
  users: User[];
  selectedBranchId: string;
  theme: 'light' | 'dark';
  onSelectCustomer: (customer: Customer) => void;
  onOpenLogCall: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

export const CalendarFollowUpsView: React.FC<CalendarFollowUpsViewProps> = ({
  customers,
  branches,
  users,
  selectedBranchId,
  theme,
  onSelectCustomer,
  onOpenLogCall,
  onUpdateCustomer,
}) => {
  const isDark = theme === 'dark';
  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');

  const filteredCustomers = customers.filter(c => {
    if (selectedBranchId !== 'all' && c.branchId !== selectedBranchId) return false;
    return Boolean(c.nextFollowUpDate);
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const categorized = filteredCustomers.map(c => {
    const followUp = c.nextFollowUpDate || '';
    let category: 'overdue' | 'today' | 'upcoming' = 'upcoming';
    if (followUp < todayStr) category = 'overdue';
    else if (followUp === todayStr) category = 'today';
    return { customer: c, category, followUp };
  });

  const displayed = categorized.filter(item => {
    if (filterType === 'all') return true;
    return item.category === filterType;
  }).sort((a, b) => a.followUp.localeCompare(b.followUp));

  const counts = {
    all: categorized.length,
    overdue: categorized.filter(i => i.category === 'overdue').length,
    today: categorized.filter(i => i.category === 'today').length,
    upcoming: categorized.filter(i => i.category === 'upcoming').length,
  };

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const rowBg = isDark ? 'bg-zinc-950/40 border-zinc-800/60' : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-400" />
            <span>Calendar & Follow-Up Reminders</span>
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Track client follow-up dates, overdue reminders, and agenda schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${filterType === 'all' ? 'bg-amber-600 text-white border-amber-600' : isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${filterType === 'overdue' ? 'bg-red-600 text-white border-red-600' : isDark ? 'bg-red-950/40 text-red-300 border-red-900/60' : 'bg-red-50 text-red-700 border-red-200'}`}
          >
            Overdue ({counts.overdue})
          </button>
          <button
            onClick={() => setFilterType('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${filterType === 'today' ? 'bg-amber-600 text-white border-amber-600' : isDark ? 'bg-amber-950/40 text-amber-300 border-amber-900/60' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
          >
            Due Today ({counts.today})
          </button>
          <button
            onClick={() => setFilterType('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${filterType === 'upcoming' ? 'bg-emerald-600 text-white border-emerald-600' : isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
          >
            Upcoming ({counts.upcoming})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className={`p-12 text-center rounded-xl border ${cardBg}`}>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No follow-ups match this filter</h3>
            <p className="text-xs text-zinc-400 mt-1">All client communications are currently up to date.</p>
          </div>
        ) : (
          displayed.map(({ customer: c, category, followUp }) => {
            const branch = branches.find(b => b.id === c.branchId);
            const user = users.find(u => u.id === c.assignedUserId);
            const cleanPhone = c.phoneNumber.replace(/^0/, '');

            let badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-800';
            let badgeText = `Due: ${followUp}`;
            if (category === 'overdue') {
              badgeColor = 'bg-red-950/60 text-red-400 border-red-800';
              badgeText = `Overdue: ${followUp}`;
            } else if (category === 'today') {
              badgeColor = 'bg-amber-950/60 text-amber-300 border-amber-800';
              badgeText = `Due Today! (${followUp})`;
            }

            return (
              <div key={c.id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${rowBg}`}>
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${category === 'overdue' ? 'bg-red-600/20 text-red-400 border border-red-800/60' : category === 'today' ? 'bg-amber-600/20 text-amber-400 border border-amber-800/60' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
                    {c.customerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 onClick={() => onSelectCustomer(c)} className="font-bold text-sm text-zinc-150 text-white cursor-pointer hover:underline">{c.customerName}</h4>
                      {c.companyName && <span className="text-xs text-zinc-400">({c.companyName})</span>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${badgeColor}`}>{badgeText}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Purpose: <span className="text-zinc-200">{c.purposeOfCall}</span> • Rep: <span className="text-zinc-300 font-medium">{user?.name || 'Unassigned'}</span> • Branch: <span className="text-zinc-300">{branch?.name || 'Branch'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <a
                    href={`tel:${c.phoneNumber}`}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Call Client"
                  >
                    <Phone className="w-3.5 h-3.5 text-teal-400" />
                    <span>{c.phoneNumber}</span>
                  </a>
                  <a
                    href={`https://wa.me/251${cleanPhone}?text=Hello%20${encodeURIComponent(c.customerName)},%20following%20up%20from%20TTM%20CRM%20regarding%20your%20printing%20machinery%20inquiry.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Open WhatsApp Chat"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`https://t.me/+251${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Open Telegram Chat"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Telegram</span>
                  </a>
                  <button
                    onClick={() => onOpenLogCall(c)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Log Call</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
