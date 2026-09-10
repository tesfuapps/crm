import React, { useState } from 'react';
import { Customer, CallLog, User, CustomerStage } from '../types/crm';
import { PhoneCall, Search, UserPlus, CheckCircle, ArrowRight, X } from 'lucide-react';

interface IncomingCallWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  currentUser: User;
  onSaveCallLog: (newLog: CallLog, updatedCustomer?: Partial<Customer>, newCustomer?: Customer) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const IncomingCallWidget: React.FC<IncomingCallWidgetProps> = ({
  isOpen,
  onClose,
  customers,
  currentUser,
  onSaveCallLog,
  onSelectCustomer,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [remark, setRemark] = useState('');
  const [purpose, setPurpose] = useState('Product & Machinery Inquiry');
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

  const handleLogExistingCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedCustomer || !remark.trim()) return;

    const newLog: CallLog = {
      id: 'cl_' + Date.now(),
      customerId: matchedCustomer.id,
      userId: currentUser.id,
      dateTime: new Date().toISOString(),
      durationMinutes: Number(duration),
      purpose,
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
      purposeOfCall: purpose,
      customerStage: 'Lead',
      assignedUserId: currentUser.id,
      branchId: currentUser.branchId,
      leadPriority: 'Hot',
      dealValue: 25000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newLog: CallLog = {
      id: 'cl_' + Date.now(),
      customerId: newCustId,
      userId: currentUser.id,
      dateTime: new Date().toISOString(),
      durationMinutes: Number(duration),
      purpose,
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-md">
              <PhoneCall className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Live Incoming Call Lookup</h3>
              <p className="text-xs text-slate-500">Type caller phone number (09...) to instantly check if registered or new</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60 transition-colors font-bold text-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Incoming Phone Number Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Incoming Caller Phone Number or Name *
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-700" />
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Type phone (e.g. 0911223344) or name..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-teal-600 rounded-xl text-base text-slate-900 font-mono font-bold focus:outline-none focus:bg-white shadow-xs"
                autoFocus
              />
            </div>
          </div>

          {/* Lookup Result Box */}
          {isSearching && (
            <div className="space-y-4 animate-fade-in">
              {matchedCustomer ? (
                /* EXISTING CUSTOMER MATCHED */
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Registered Client Found in CRM
                    </span>
                    <span className="text-xs font-bold text-emerald-800">{matchedCustomer.customerStage}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-slate-900">{matchedCustomer.customerName}</h4>
                    <p className="text-xs text-slate-600">{matchedCustomer.companyName || 'Print Shop'} • <span className="font-mono font-bold text-emerald-800">{matchedCustomer.phoneNumber}</span></p>
                  </div>

                  <form onSubmit={handleLogExistingCall} className="space-y-3 pt-2 border-t border-emerald-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Purpose</label>
                        <select
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800"
                        >
                          <option value="Product & Machinery Inquiry">Product & Machinery Inquiry</option>
                          <option value="Price Quotation (ETB)">Price Quotation (ETB)</option>
                          <option value="Order Confirmation">Order Confirmation</option>
                          <option value="Follow-up Call">Follow-up Call</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Duration (Mins)</label>
                        <input
                          type="number"
                          min="1"
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Call Remarks / Notes *</label>
                      <textarea
                        rows={2}
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="What did they discuss?"
                        className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-xs font-medium text-slate-800"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Log Call for {matchedCustomer.customerName}</span>
                    </button>
                  </form>
                </div>
              ) : (
                /* NEW CALLER NOT FOUND -> INSTANT REGISTER & LOG */
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" /> New Caller Detected (Not in CRM)
                    </span>
                    <span className="text-xs font-bold text-amber-800 font-mono">{phoneInput}</span>
                  </div>

                  <form onSubmit={handleRegisterAndLogNew} className="space-y-3 pt-2 border-t border-amber-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Client Full Name *</label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="e.g. Ato Tamirat"
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Print Shop / Company</label>
                        <input
                          type="text"
                          value={newCompany}
                          onChange={(e) => setNewCompany(e.target.value)}
                          placeholder="e.g. Tamirat Printing"
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Inquiry Source</label>
                        <select
                          value={newSource}
                          onChange={(e) => setNewSource(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800"
                        >
                          <option value="Telegram">Telegram</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Referral">Referral</option>
                          <option value="Previous Buyer">Previous Buyer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Duration (Mins)</label>
                        <input
                          type="number"
                          min="1"
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Call Remarks / Notes *</label>
                      <textarea
                        rows={2}
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Inquired about Mug Press / T-Shirt machinery..."
                        className="w-full bg-white border border-amber-300 rounded-lg p-2.5 text-xs font-medium text-slate-800"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Register New Client & Log Call</span>
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
