import React, { useState } from 'react';
import { FollowUpReminder, Customer } from '../types/crm';
import { X, CheckCircle } from 'lucide-react';

interface CompleteFollowUpModalProps {
  isOpen: boolean;
  task: { reminder: FollowUpReminder; customer: Customer } | null;
  onClose: () => void;
  onConfirm: (outcome: string, remarks: string) => void;
}

const OUTCOME_OPTIONS: Record<string, { key: string; label: string }[]> = {
  evaluation: [
    { key: 'closed_sale', label: 'Closed Sale' },
    { key: 'rescheduled', label: 'Client Deciding' },
    { key: 'lost_deal', label: 'Lost Deal' },
  ],
  after_sales: [
    { key: 'running_well', label: 'Machine Running Well' },
    { key: 'consumables_reordered', label: 'Consumables Reordered' },
    { key: 'needs_repair', label: 'Needs Tech Repair' },
  ],
  complaint: [
    { key: 'issue_resolved', label: 'Issue Resolved' },
    { key: 'part_replaced', label: 'Part Replaced' },
    { key: 'replacement_approved', label: 'Replacement Approved' },
  ],
  manual: [
    { key: 'completed', label: 'Completed' },
    { key: 'rescheduled', label: 'Rescheduled' },
    { key: 'no_action', label: 'No Action Needed' },
  ],
};

const outcomeIcon = (key: string) => {
  if (key === 'closed_sale' || key === 'running_well' || key === 'issue_resolved' || key === 'completed') return '🟢';
  if (key === 'rescheduled' || key === 'consumables_reordered' || key === 'part_replaced') return '🟡';
  return '🔴';
};

export const CompleteFollowUpModal: React.FC<CompleteFollowUpModalProps> = ({ isOpen, task, onClose, onConfirm }) => {
  const [outcome, setOutcome] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !task) return null;

  const typeKey = task.reminder.reminderType === 'after_sales' ? 'after_sales' :
    task.reminder.reminderType === 'complaint' ? 'complaint' :
    task.reminder.reminderType === 'manual' ? 'manual' : 'evaluation';
  const options = OUTCOME_OPTIONS[typeKey] || OUTCOME_OPTIONS.manual;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError('A completion remark is required before marking this task done.');
      return;
    }
    onConfirm(outcome || options[0].key, remarks);
    setOutcome('');
    setRemarks('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#141414] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#161616]">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Log Follow-Up Resolution</span>
            <h3 className="text-sm font-bold text-zinc-100 mt-0.5">{task.customer.customerName}</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">{task.reminder.title}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Outcome Selector */}
          <div>
            <label className="text-zinc-300 font-semibold block mb-1.5">Resolution Outcome *</label>
            <div className="grid grid-cols-3 gap-2">
              {options.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setOutcome(opt.key)}
                  className={`py-2 px-2 text-xs rounded-lg border font-medium transition-all ${
                    (outcome || options[0].key) === opt.key
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-[#0e0e0e] border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {outcomeIcon(opt.key)} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mandatory Remarks */}
          <div>
            <label className="text-zinc-300 font-semibold block mb-1.5">Completion Remarks *</label>
            <textarea
              rows={3}
              required
              value={remarks}
              onChange={(e) => { setRemarks(e.target.value); if (error) setError(''); }}
              placeholder="Explain the result of your conversation, technical resolution, or next steps..."
              className="w-full bg-[#0e0e0e] border border-zinc-700 focus:border-amber-500 rounded-xl p-3 text-zinc-200 text-xs leading-relaxed focus:outline-none resize-none"
            />
            {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
              <CheckCircle className="w-3.5 h-3.5" />
              Complete & Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
