import React, { useState } from 'react';
import { Customer, CallLog, User, CustomerStage } from '../types/crm';
import { PhoneCall, Search, UserPlus, CheckCircle, X } from 'lucide-react';

interface IncomingCallWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  currentUser: User;
  theme: 'light' | 'dark';
  onSaveCallLog: (newLog: CallLog, updatedCustomer?: Partial<Customer>, newCustomer?: Customer) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const IncomingCallWidget: React.FC<IncomingCallWidgetProps> = ({
  isOpen,
  onClose,
  customers,
  currentUser,
  theme,
  onSaveCallLog,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [remark, setRemark] = useState('');
  const [outcome, setOutcome] = useState('Sales');
  const [duration, setDuration] = useState(5);

  // New customer fields if not found
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSource, setNewSource] = useState('Telegram');

  if (!isOpen) return null;

  // Search existing customers by phone number or name
  const matchedCustomer = customers.find(c => 
    c.phoneNumber.includes(phoneInput.trim()) || 
    c.customerName.toLowerCase().includes(phoneInput.toLowerCase().trim())
  );

  const isSearching = phoneInput.trim().length > 2;
  const isDark = theme === 'dark';

  const handleLogExistingCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedCustomer || !remark.trim()) return;

    const newLog: CallLog = {
      id: 'cl_' + Date.now(),
      customerId: matchedCustomer.id,
      userId: currentUser.id,
      dateTime: new Date().toISOString(),
      durationMinutes: Number(duration),
      purpose: outcome,
      remark,
    };

    onSaveCallLog(newLog);
    setPhoneInput('');
    setRemark('');
    onClose();
  };

  const handleRegisterAndLogNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !phoneInput.trim() || !remark.trim()) return;

    const newCustId = 'c_' + Date.now();
    const newCust: Customer = {
      id: newCustId,
      customerName: newName,
      companyName: newCompany || undefined,
      phoneNumber: phoneInput,
      customerType: 'New',
      source: newSource,
      purposeOfCall: outcome,
      customerStage: 'Lead',
      assignedUserId: currentUser.id,
      branchId: currentUser.branchId,
      mainBranchId: currentUser.branchId,
      leadPriority: 'Hot',
      dealValue: 25000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      consecutivePurchaseStreak: {},
      branchReassignmentLog: [],
    };

    const newLog: CallLog = {
      id: 'cl_' + Date.now(),
      customerId: newCustId,
      userId: currentUser.id,
      dateTime: new Date().toISOString(),
      durationMinutes: Number(duration),
      purpose: outcome,
      remark,
    };

    onSaveCallLog(newLog, undefined, newCust);
    setPhoneInput('');
    setRemark('');
    setNewName('');
    setNewCompany('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border transition-colors ${
        isDark ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between px-6 py-5 border-b ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <PhoneCall className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Live Incoming Call & Communication Outcome</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lookup caller & categorize by 7 Core Outcomes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors font-bold text-lg ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Incoming Phone Number Input */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Incoming Caller Phone Number or Name *
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Type phone (e.g. 0911223344) or name..."
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-base font-mono font-bold focus:outline-none shadow-xs transition-colors ${
                  isDark ? 'bg-[#1F2937] border-teal-600 text-slate-100 placeholder-slate-400' : 'bg-slate-50 border-teal-600 text-slate-900 placeholder-slate-400'
                }`}
                autoFocus
              />
            </div>
          </div>

          {/* Lookup Result Box */}
          {isSearching && (
            <div className="space-y-4 animate-fade-in">
              {matchedCustomer ? (
                /* EXISTING CUSTOMER MATCHED */
                <div className={`border-2 rounded-2xl p-4 space-y-3 transition-colors ${
                  isDark ? 'bg-emerald-950/40 border-emerald-800 text-slate-100' : 'bg-emerald-50 border-emerald-300 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      isDark ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-200 text-emerald-900'
                    }`}>
                      <CheckCircle className="w-3.5 h-3.5" /> Registered Client Found in CRM
                    </span>
                    <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>{matchedCustomer.customerStage}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-base">{matchedCustomer.customerName}</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{matchedCustomer.companyName || 'Print Shop'} • <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>{matchedCustomer.phoneNumber}</span></p>
                  </div>

                  <form onSubmit={handleLogExistingCall} className={`space-y-3 pt-2 border-t ${isDark ? 'border-emerald-900' : 'border-emerald-200'}`}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Outcome</label>
                        <select
                          value={outcome}
                          onChange={(e) => setOutcome(e.target.value)}
                          className={`w-full border rounded-lg px-2.5 py-2 text-xs font-semibold ${
                            isDark ? 'bg-[#1F2937] border-emerald-700 text-slate-100' : 'bg-white border-emerald-300 text-slate-800'
                          }`}
                        >
                          <option value="Sales">1. Sales (Made purchase)</option>
                          <option value="Evaluation">2. Evaluation (Asked price/details)</option>
                          <option value="Service">3. Service (Support request)</option>
                          <option value="Out of List">4. Out of List (Product not offered)</option>
                          <option value="Out of Stock">5. Out of Stock (Missing inventory)</option>
                          <option value="Pre-order">6. Pre-order (Custom/reserve)</option>
                          <option value="Complaint">7. Complaint (Resolution needed)</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Duration (Mins)</label>
                        <input
                          type="number"
                          min="1"
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className={`w-full border rounded-lg px-2.5 py-2 text-xs font-mono font-bold ${
                            isDark ? 'bg-[#1F2937] border-emerald-700 text-slate-100' : 'bg-white border-emerald-300 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Call Remarks / Notes *</label>
                      <textarea
                        rows={2}
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="What did they discuss?"
                        className={`w-full border rounded-lg p-2.5 text-xs font-medium ${
                          isDark ? 'bg-[#1F2937] border-emerald-700 text-slate-100 placeholder-slate-400' : 'bg-white border-emerald-300 text-slate-800'
                        }`}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Log Call ({outcome}) for {matchedCustomer.customerName}</span>
                    </button>
                  </form>
                </div>
              ) : (
                /* NEW CALLER NOT FOUND -> INSTANT REGISTER & LOG */
                <div className={`border-2 rounded-2xl p-4 space-y-3 transition-colors ${
                  isDark ? 'bg-amber-950/40 border-amber-800 text-slate-100' : 'bg-amber-50 border-amber-300 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      isDark ? 'bg-amber-900 text-amber-200' : 'bg-amber-200 text-amber-900'
                    }`}>
                      <UserPlus className="w-3.5 h-3.5" /> New Caller Detected (Not in CRM)
                    </span>
                    <span className={`text-xs font-bold font-mono ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>{phoneInput}</span>
                  </div>

                  <form onSubmit={handleRegisterAndLogNew} className={`space-y-3 pt-2 border-t ${isDark ? 'border-amber-900' : 'border-amber-200'}`}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Client Full Name *</label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="e.g. Ato Tamirat"
                          className={`w-full border rounded-lg px-2.5 py-2 text-xs font-medium ${
                            isDark ? 'bg-[#1F2937] border-amber-700 text-slate-100' : 'bg-white border-amber-300 text-slate-800'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Print Shop / Company</label>
                        <input
                          type="text"
                          value={newCompany}
                          onChange={(e) => setNewCompany(e.target.value)}
                          placeholder="e.g. Tamirat Printing"
                          className={`w-full border rounded-lg px-2.5 py-2 text-xs font-medium ${
                            isDark ? 'bg-[#1F2937] border-amber-700 text-slate-100' : 'bg-white border-amber-300 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Outcome</label>
                        <select
                          value={outcome}
                          onChange={(e) => setOutcome(e.target.value)}
                          className={`w-full border rounded-lg px-2.5 py-2 text-xs font-semibold ${
                            isDark ? 'bg-[#1F2937] border-amber-700 text-slate-100' : 'bg-white border-amber-300 text-slate-800'
                          }`}
                        >
                          <option value="Sales">1. Sales (Made purchase)</option>
                          <option value="Evaluation">2. Evaluation (Asked price/details)</option>
                          <option value="Service">3. Service (Support request)</option>
                          <option value="Out of List">4. Out of List (Product not offered)</option>
                          <option value="Out of Stock">5. Out of Stock (Missing inventory)</option>
                          <option value="Pre-order">6. Pre-order (Custom/reserve)</option>
                          <option value="Complaint">7. Complaint (Resolution needed)</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Source</label>
                        <select
                          value={newSource}
                          onChange={(e) => setNewSource(e.target.value)}
                          className={`w-full border rounded-lg px-2.5 py-2 text-xs font-semibold ${
                            isDark ? 'bg-[#1F2937] border-amber-700 text-slate-100' : 'bg-white border-amber-300 text-slate-800'
                          }`}
                        >
                          <option value="Telegram">Telegram</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Referral">Referral</option>
                          <option value="Previous Buyer">Previous Buyer</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Call Remarks / Notes *</label>
                      <textarea
                        rows={2}
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Inquired about Mug Press / T-Shirt machinery..."
                        className={`w-full border rounded-lg p-2.5 text-xs font-medium ${
                          isDark ? 'bg-[#1F2937] border-amber-700 text-slate-100 placeholder-slate-400' : 'bg-white border-amber-300 text-slate-800'
                        }`}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Register New Client & Log ({outcome})</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
