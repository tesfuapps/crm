import React, { useState } from 'react';
import { CallLog, Customer, User } from '../types/crm';
import { CheckCircle, X, AtSign } from 'lucide-react';

interface ResolveComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  callLog: CallLog | null;
  customer?: Customer;
  users: User[];
  currentUser: User;
  onResolveComplaint: (callLogId: string, resolutionRemark: string, taggedUserIds: string[]) => void;
}

export const ResolveComplaintModal: React.FC<ResolveComplaintModalProps> = ({
  isOpen,
  onClose,
  callLog,
  customer,
  users,
  currentUser,
  onResolveComplaint,
}) => {
  const [resolutionRemark, setResolutionRemark] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  if (!isOpen || !callLog) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionRemark.trim()) return;
    onResolveComplaint(callLog.id, resolutionRemark.trim(), selectedUserIds);
    setResolutionRemark('');
    setSelectedUserIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#141414] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Resolve Customer Complaint</h3>
              <p className="text-[11px] text-neutral-400">Close loop for {customer?.customerName || 'Client'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
            <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <span>🚨 Original Complaint:</span>
            </div>
            <p className="text-xs text-neutral-300 italic">"{callLog.remark}"</p>
            <div className="text-[10px] text-neutral-500 pt-1">Logged on {new Date(callLog.dateTime).toLocaleString()}</div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
              Resolution Remarks & Action Taken *
            </label>
            <textarea
              rows={3}
              value={resolutionRemark}
              onChange={(e) => setResolutionRemark(e.target.value)}
              placeholder="Explain action taken (e.g. replaced parts, calibrated temperature, refunded)..."
              className="w-full bg-[#101010] border border-neutral-700 focus:border-amber-500 text-neutral-100 placeholder-neutral-500 rounded-xl p-3 text-xs leading-relaxed focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
              Tag Teammates (@Mention Supervisor / Technician)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {users.filter(u => u.id !== currentUser.id).map(user => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserIds(prev =>
                        isSelected ? prev.filter(id => id !== user.id) : [...prev, user.id]
                      );
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-[#101010] border-neutral-700 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <AtSign className="w-3 h-3" />
                    <span>{user.name} ({user.role})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Resolution</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
