import React, { useState } from 'react';
import { Customer, CallLog, User, CustomerStage } from '../types/crm';
import { X, PhoneCall, UserPlus } from 'lucide-react';

interface LogCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  currentUser: User;
  onSaveCallLog: (newLog: CallLog, updatedCustomer?: Partial<Customer>, newCustomer?: Customer) => void;
}

export const LogCallModal: React.FC<LogCallModalProps> = ({
  isOpen,
  onClose,
  customers,
  currentUser,
  onSaveCallLog,
}) => {
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  
  // New customer fields if caller is new
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('09');
  const [newCompany, setNewCompany] = useState('');
  const [newSource, setNewSource] = useState('Telegram');

  // Call log fields
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [purpose, setPurpose] = useState('Product Inquiry (Mug/Machinery)');
  const [remark, setRemark] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [newStage, setNewStage] = useState<CustomerStage | ''>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remark.trim()) return;

    let targetCustomerId = selectedCustomerId;
    let createdCust: Customer | undefined = undefined;

    if (isNewCustomerMode) {
      if (!newName.trim() || !newPhone.trim()) return;
      targetCustomerId = 'c_' + Date.now();
      createdCust = {
        id: targetCustomerId,
        customerName: newName,
        companyName: newCompany || undefined,
        phoneNumber: newPhone,
        customerType: 'New',
        source: newSource,
        purposeOfCall: purpose,
        customerStage: (newStage as CustomerStage) || 'Lead',
        assignedUserId: currentUser.id,
        branchId: currentUser.branchId,
        leadPriority: 'Hot',
        dealValue: 20000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const newLog: CallLog = {
      id: 'cl_' + Date.now(),
      customerId: targetCustomerId,
      userId: currentUser.id,
      dateTime: new Date().toISOString(),
      durationMinutes: Number(durationMinutes),
      purpose,
      remark,
    };

    const updateData: Partial<Customer> = {};
    if (nextFollowUpDate) updateData.nextFollowUpDate = nextFollowUpDate;
    if (newStage) updateData.customerStage = newStage as CustomerStage;

    onSaveCallLog(newLog, updateData, createdCust);
    setRemark('');
    setNewName('');
    setNewPhone('09');
    setIsNewCustomerMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-md">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Live Call Logger & Instant Lead Capture</h3>
              <p className="text-xs text-slate-500">For ongoing calls regarding printing products & machinery</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60 transition-colors font-bold text-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mode Switcher: Existing vs New Caller */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setIsNewCustomerMode(false)}
              className={`flex-1 py-2 rounded-lg transition-all ${!isNewCustomerMode ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Existing Customer Call
            </button>
            <button
              type="button"
              onClick={() => setIsNewCustomerMode(true)}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${isNewCustomerMode ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Caller (Instant Register)</span>
            </button>
          </div>

          {!isNewCustomerMode ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Existing Customer / Print Shop
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} {c.companyName ? `(${c.companyName})` : ''} — {c.phoneNumber}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200 space-y-3">
              <p className="text-xs font-bold text-teal-900">New Caller Details (Will be registered automatically):</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Caller Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Ato Dawit"
                    className="w-full bg-white border border-teal-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none"
                    required={isNewCustomerMode}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number (09...) *</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0911223344"
                    className="w-full bg-white border border-teal-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-medium focus:outline-none"
                    required={isNewCustomerMode}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Shop / Company Name</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Dawit Printing"
                    className="w-full bg-white border border-teal-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full bg-white border border-teal-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none"
                  >
                    <option value="Telegram">Telegram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Referral">Referral</option>
                    <option value="Previous Buyer">Previous Buyer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Call Purpose / Topic
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
              >
                <option value="Product Inquiry (Mug/Machinery)">Product Inquiry (Mug / Machinery)</option>
                <option value="Price Quotation (ETB)">Price Quotation (ETB)</option>
                <option value="Follow-up Call">Follow-up Call</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Order Confirmation & Payment">Order Confirmation & Payment</option>
                <option value="Renewal & Support">Renewal & Support</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Call Remarks / Live Discussion Notes *
            </label>
            <textarea
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="What did the client want? (e.g. Needs 1 Mug Press Machine and 2 boxes of blank mugs delivered to Bole...)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 placeholder-slate-400 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Next Follow-up Date
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Update Stage
              </label>
              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
              >
                <option value="">(Keep Current Stage)</option>
                <option value="Contact">Contact</option>
                <option value="Lead">Lead</option>
                <option value="Customer">Customer</option>
                <option value="Client">Client</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold shadow-md transition-colors flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Save Call Log {isNewCustomerMode ? '& Register Client' : ''}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
