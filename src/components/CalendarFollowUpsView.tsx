import React, { useState } from 'react';
import { Customer, Branch, User, FollowUpReminder } from '../types/crm';
import { Calendar as CalendarIcon, Phone, Send, Check, CalendarPlus, MessageCircle } from 'lucide-react';
import { CompleteFollowUpModal } from './CompleteFollowUpModal';

interface CalendarFollowUpsViewProps {
  customers: Customer[];
  branches: Branch[];
  users: User[];
  reminders: FollowUpReminder[];
  selectedBranchId: string;
  theme: 'light' | 'dark';
  onSelectCustomer: (customer: Customer) => void;
  onOpenLogCall: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onUpdateReminder: (reminder: FollowUpReminder) => void;
}

export const CalendarFollowUpsView: React.FC<CalendarFollowUpsViewProps> = ({
  customers, branches, users, reminders, selectedBranchId, theme,
  onSelectCustomer, onOpenLogCall, onUpdateCustomer, onUpdateReminder,
}) => {
  const isDark = theme === 'dark';
  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState('');
  const [completeTask, setCompleteTask] = useState<{ reminder: FollowUpReminder; customer: Customer } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const branchById = React.useMemo(() => new Map(branches.map(b => [b.id, b])), [branches]);
  const userById = React.useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const customerById = React.useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);

  const reminderTasks = reminders
    .filter(r => {
      const c = customerById.get(r.customerId);
      if (!c) return false;
      if (selectedBranchId !== 'all' && c.branchId !== selectedBranchId) return false;
      return r.status === 'pending';
    })
    .map(r => {
      const category: 'overdue' | 'today' | 'upcoming' = r.dueDate < todayStr ? 'overdue' : r.dueDate === todayStr ? 'today' : 'upcoming';
      return { reminder: r, customer: customerById.get(r.customerId)!, category };
    });

  const pendingCustomerIds = new Set(reminders.filter(r => r.status === 'pending').map(r => r.customerId));

  const legacyItems = customers
    .filter(c => {
      if (selectedBranchId !== 'all' && c.branchId !== selectedBranchId) return false;
      if (pendingCustomerIds.has(c.id)) return false;
      return Boolean(c.nextFollowUpDate);
    })
    .map(c => {
      const followUp = c.nextFollowUpDate || '';
      let category: 'overdue' | 'today' | 'upcoming' = 'upcoming';
      if (followUp < todayStr) category = 'overdue';
      else if (followUp === todayStr) category = 'today';
      return { customer: c, category, followUp };
    });

  const allItems = [
    ...reminderTasks.map(t => ({ key: `reminder-${t.reminder.id}`, kind: 'reminder' as const, reminder: t.reminder, customer: t.customer, category: t.category, followUp: t.reminder.dueDate })),
    ...legacyItems.map(i => ({ key: `legacy-${i.customer.id}`, kind: 'legacy' as const, reminder: null, customer: i.customer, category: i.category, followUp: i.followUp })),
  ];

  const displayed = allItems.filter(item => filterType === 'all' || item.category === filterType).sort((a, b) => a.followUp.localeCompare(b.followUp));

  const counts = { all: allItems.length, overdue: allItems.filter(i => i.category === 'overdue').length, today: allItems.filter(i => i.category === 'today').length, upcoming: allItems.filter(i => i.category === 'upcoming').length };

  const cardBg = isDark ? 'bg-[#141414] border-zinc-800/60' : 'bg-white border-slate-200';
  const rowBg = isDark ? 'bg-[#141414] border-zinc-800/60 hover:border-zinc-700/60' : 'bg-slate-50 border-slate-200';

  const handleCompleteConfirm = (outcome: string, remarks: string) => {
    if (!completeTask) return;
    const { reminder, customer } = completeTask;
    // Mark reminder completed
    onUpdateReminder({ ...reminder, status: 'completed' });
    // Append note to customer dossier
    const rep = userById.get(reminder.assignedRepId);
    const note = `[Completed ${reminder.title}] - ${remarks} (Outcome: ${outcome}, Logged by ${rep?.name || 'Rep'})`;
    onUpdateCustomer({ ...customer, internalNotes: (customer.internalNotes ? customer.internalNotes + '\n' : '') + note });
    setCompleteTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          {[['all', 'All', 'bg-amber-600 text-white border-amber-600', isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-200'],
            ['overdue', 'Overdue', 'bg-red-600 text-white border-red-600', isDark ? 'bg-red-950/40 text-red-300 border-red-900/60' : 'bg-red-50 text-red-700 border-red-200'],
            ['today', 'Due Today', 'bg-amber-600 text-white border-amber-600', isDark ? 'bg-amber-950/40 text-amber-300 border-amber-900/60' : 'bg-amber-50 text-amber-700 border-amber-200'],
            ['upcoming', 'Upcoming', 'bg-emerald-600 text-white border-emerald-600', isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'],
          ].map(([key, label, active, inactive]) => (
            <button key={key} onClick={() => setFilterType(key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${filterType === key ? active : inactive}`}>
              {label} ({counts[key as keyof typeof counts]})
            </button>
          ))}
        </div>
      </div>

      {/* Reminder Cards */}
      <div className="space-y-2">
        {displayed.length === 0 ? (
          <div className={`p-12 text-center rounded-xl border ${cardBg}`}>
            <Check className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No follow-ups match this filter</h3>
            <p className="text-xs text-zinc-400 mt-1">All client communications are currently up to date.</p>
          </div>
        ) : (
          displayed.map(item => {
            const c = item.customer;
            const branch = branchById.get(c.branchId);
            const user = item.kind === 'reminder' ? userById.get(item.reminder.assignedRepId) : userById.get(c.assignedUserId);
            const cleanPhone = c.phoneNumber.replace(/^0/, '');
            const isReminder = item.kind === 'reminder';
            const isPending = isReminder && item.reminder.status === 'pending';
            const purpose = isReminder ? item.reminder.purpose : c.purposeOfCall;

            let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            let badgeText = `Due: ${item.followUp}`;
            if (item.category === 'overdue') { badgeColor = 'bg-red-500/10 text-red-400 border-red-500/30'; badgeText = `Overdue: ${item.followUp}`; }
            else if (item.category === 'today') { badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30'; badgeText = `Due Today!`; }

            const typeLabel = isReminder ? item.reminder.reminderType.replace('_', ' ') : 'follow-up';

            return (
              <div key={item.key} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${rowBg} transition-colors`}>
                {/* Left: Avatar + Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    item.category === 'overdue' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                    item.category === 'today' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}>
                    {c.customerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 onClick={() => onSelectCustomer(c)} className="font-bold text-sm text-white cursor-pointer hover:underline truncate">{c.customerName}</h4>
                      {c.companyName && <span className="text-xs text-zinc-400 truncate">({c.companyName})</span>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${badgeColor}`}>{badgeText}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-zinc-800 text-zinc-400 border-zinc-700 shrink-0 capitalize">{typeLabel}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                      {isReminder && <>{item.reminder.title} &bull; </>}
                      Purpose: <span className="text-zinc-200">{purpose}</span> &bull; Rep: <span className="text-zinc-300 font-medium">{user?.name || 'Unassigned'}</span> &bull; <span className="text-zinc-300">{branch?.name || 'Branch'}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Contact Icons + Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {isPending && rescheduleId === item.reminder?.id ? (
                    <div className="flex items-center gap-1.5">
                      <input type="date" value={rescheduleValue} onChange={(e) => setRescheduleValue(e.target.value)}
                        className={`px-2 py-1.5 rounded-lg text-xs border ${isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-slate-300 text-slate-700'}`} />
                      <button onClick={() => { if (rescheduleValue) onUpdateReminder({ ...item.reminder, dueDate: rescheduleValue }); setRescheduleId(null); setRescheduleValue(''); }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors">Save</button>
                      <button onClick={() => { setRescheduleId(null); setRescheduleValue(''); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      {/* Contact cluster */}
                      <a href={`tel:${c.phoneNumber}`} title="Call"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-teal-400 transition-colors">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a href={`https://wa.me/251${cleanPhone}?text=Hello%20${encodeURIComponent(c.customerName)}`} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-400 transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                      <a href={`https://t.me/+251${cleanPhone}`} target="_blank" rel="noopener noreferrer" title="Telegram"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/60 text-sky-400 transition-colors">
                        <Send className="w-3.5 h-3.5" />
                      </a>

                      <div className="w-px h-6 bg-zinc-700/60 mx-1" />

                      {/* Task action cluster */}
                      {isPending && (
                        <>
                          <button onClick={() => { setRescheduleId(item.reminder.id); setRescheduleValue(item.reminder.dueDate); }}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
                            <CalendarPlus className="w-3 h-3" /> Reschedule
                          </button>
                          <button onClick={() => setCompleteTask({ reminder: item.reminder, customer: c })}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm">
                            <Check className="w-3 h-3" /> Complete
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <CompleteFollowUpModal isOpen={Boolean(completeTask)} task={completeTask} onClose={() => setCompleteTask(null)} onConfirm={handleCompleteConfirm} />
    </div>
  );
};
