import React, { useState, useEffect } from 'react';
import { Customer, CallLog, User, ProductItem, Branch, ProductSale } from '../types/crm';
import { PhoneCall, Search, UserPlus, CheckCircle, X, Package } from 'lucide-react';
import { generateSaleId, generateDeliveryTicketId } from '../utils/ids';

const REQUIRED_FOLLOWUP_OUTCOMES = ['Pre-order', 'Evaluation', 'Complaint'];

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isValidFollowUpDate = (v: string) => {
  const t = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return false;
  const date = new Date(t + 'T00:00:00Z');
  if (isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== t) return false;
  return t >= getTodayStr();
};

interface IncomingCallWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  branches: Branch[];
  currentUser: User;
  theme: 'light' | 'dark';
  onSaveCallLog: (newLog: CallLog, updatedCustomer?: Partial<Customer>, newCustomer?: Customer) => void;
  onSelectCustomer: (customer: Customer) => void;
  products: ProductItem[];
  onRecordSale?: (sale: ProductSale) => void;
}

export const IncomingCallWidget: React.FC<IncomingCallWidgetProps> = ({
  isOpen,
  onClose,
  customers,
  branches,
  currentUser,
  theme,
  onSaveCallLog,
  products,
  onRecordSale,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [remark, setRemark] = useState('');
  const [outcome, setOutcome] = useState('Sales');
  const [duration, setDuration] = useState(5);
  const [selectedProductId, setSelectedProductId] = useState('none');
  const [unlistedProductName, setUnlistedProductName] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [priceFeedback, setPriceFeedback] = useState<string>('accepted');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [saleAmount, setSaleAmount] = useState('');
  const [cargoCarrier, setCargoCarrier] = useState('');
  const [cargoTicket, setCargoTicket] = useState('');
  const [cargoCity, setCargoCity] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('delivery');
  const [deliveryScope, setDeliveryScope] = useState<'addis_ababa' | 'province'>('addis_ababa');
  const [addisDeliveryType, setAddisDeliveryType] = useState<'own_delivery' | 'outsourced'>('own_delivery');
  const [outsourcedProvider, setOutsourcedProvider] = useState('Feres');
  const [deliveryFeePaidBy, setDeliveryFeePaidBy] = useState<'customer' | 'ttm_free'>('customer');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  // Auto-calculate sale amount from product price × quantity
  useEffect(() => {
    if (selectedProductId !== 'none' && selectedProductId !== 'unlisted') {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        setSaleAmount(String(product.itemPrice * saleQuantity));
      }
    }
  }, [selectedProductId, saleQuantity, products]);

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

  const matchedBranchName = matchedCustomer
    ? branches.find(b => b.id === (matchedCustomer.mainBranchId || matchedCustomer.branchId))?.name || 'Unassigned branch'
    : undefined;
  const matchedMaxStreak = matchedCustomer
    ? Math.max(0, ...Object.values(matchedCustomer.consecutivePurchaseStreak || {}))
    : 0;

  const inputClasses = `min-w-0 max-w-full w-full border rounded-lg px-2.5 py-2 text-xs transition-colors focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 ${
    isDark ? 'bg-[#101010] border-neutral-700 text-neutral-100 placeholder-neutral-400' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
  }`;

  const needsFollowUp = REQUIRED_FOLLOWUP_OUTCOMES.includes(outcome);
  const todayStr = getTodayStr();

  const handleLogExistingCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedCustomer || !remark.trim()) return;

    if (needsFollowUp && !isValidFollowUpDate(nextFollowUpDate)) {
      setDateError(nextFollowUpDate.trim() ? 'Date must be valid and not in the past.' : 'Next follow-up date is required.');
      return;
    }

    const newLog: CallLog = {
      id: 'cl_' + Date.now(),
      customerId: matchedCustomer.id,
      userId: currentUser.id,
      dateTime: new Date().toISOString(),
      durationMinutes: Number(duration),
      purpose: outcome,
      remark,
      callStatus: outcome as any,
      ...(needsFollowUp ? { nextFollowUpDate: nextFollowUpDate.trim() } : {}),
      productId: selectedProductId !== 'none' && selectedProductId !== 'unlisted' ? selectedProductId : undefined,
      isUnlistedProduct: selectedProductId === 'unlisted',
      unlistedProductName: selectedProductId === 'unlisted' ? unlistedProductName : undefined,
      priceFeedback: outcome === 'Evaluation' ? (priceFeedback as any) : undefined,
    };

    const customerUpdate: Partial<Customer> = needsFollowUp ? { nextFollowUpDate: nextFollowUpDate.trim() } : {};
    onSaveCallLog(newLog, needsFollowUp ? customerUpdate : undefined);

    if (outcome === 'Sales' && onRecordSale && matchedCustomer) {
      const product = selectedProductId !== 'none' && selectedProductId !== 'unlisted'
        ? products.find(p => p.id === selectedProductId) : null;
      onRecordSale({
        id: generateSaleId(),
        deliveryTicketId: generateDeliveryTicketId(),
        customerId: matchedCustomer.id,
        itemId: selectedProductId !== 'none' && selectedProductId !== 'unlisted' ? selectedProductId : 'unlisted_' + Date.now(),
        quantity: saleQuantity,
        saleDate: new Date().toISOString(),
        saleAmount: Number(saleAmount) || 0,
        salesRepId: currentUser.id,
        status: 'confirmed',
        carrier: cargoCarrier || undefined,
        ticketNumber: cargoTicket || undefined,
        destinationCity: cargoCity || undefined,
        fulfillment_type: fulfillmentType,
        delivery_scope: fulfillmentType === 'delivery' ? deliveryScope : undefined,
        addis_delivery_type: deliveryScope === 'addis_ababa' ? addisDeliveryType : undefined,
        outsourced_provider: addisDeliveryType === 'outsourced' ? outsourcedProvider : undefined,
        delivery_fee_paid_by: addisDeliveryType === 'outsourced' ? deliveryFeePaidBy : undefined,
        driver_name: driverName || undefined,
        driver_phone: driverPhone || undefined,
        vehicle_plate_number: vehiclePlate || undefined,
      });
    }
    setPhoneInput('');
    setRemark('');
    setSelectedProductId('none');
    setUnlistedProductName('');
    setNextFollowUpDate('');
    setDateError('');
    setSaleQuantity(1);
    setSaleAmount('');
    setCargoCarrier('');
    setCargoTicket('');
    setCargoCity('');
    setFulfillmentType('delivery');
    setDeliveryScope('addis_ababa');
    setAddisDeliveryType('own_delivery');
    setOutsourcedProvider('Feres');
    setDeliveryFeePaidBy('customer');
    setDriverName('');
    setDriverPhone('');
    setVehiclePlate('');
    onClose();
  };

  const handleRegisterAndLogNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !phoneInput.trim() || !remark.trim()) return;

    if (needsFollowUp && !isValidFollowUpDate(nextFollowUpDate)) {
      setDateError(nextFollowUpDate.trim() ? 'Date must be valid and not in the past.' : 'Next follow-up date is required.');
      return;
    }

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
      leadPriority: 'Normal',
      dealValue: 0,
      ...(needsFollowUp ? { nextFollowUpDate: nextFollowUpDate.trim() } : {}),
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
      callStatus: outcome as any,
      ...(needsFollowUp ? { nextFollowUpDate: nextFollowUpDate.trim() } : {}),
      productId: selectedProductId !== 'none' && selectedProductId !== 'unlisted' ? selectedProductId : undefined,
      isUnlistedProduct: selectedProductId === 'unlisted',
      unlistedProductName: selectedProductId === 'unlisted' ? unlistedProductName : undefined,
      priceFeedback: outcome === 'Evaluation' ? (priceFeedback as any) : undefined,
    };

    onSaveCallLog(newLog, needsFollowUp ? { nextFollowUpDate: nextFollowUpDate.trim() } : undefined, newCust);

    if (outcome === 'Sales' && onRecordSale) {
      onRecordSale({
        id: generateSaleId(),
        deliveryTicketId: generateDeliveryTicketId(),
        customerId: newCustId,
        itemId: selectedProductId !== 'none' && selectedProductId !== 'unlisted' ? selectedProductId : 'unlisted_' + Date.now(),
        quantity: saleQuantity,
        saleDate: new Date().toISOString(),
        saleAmount: Number(saleAmount) || 0,
        salesRepId: currentUser.id,
        status: 'confirmed',
        carrier: cargoCarrier || undefined,
        ticketNumber: cargoTicket || undefined,
        destinationCity: cargoCity || undefined,
        fulfillment_type: fulfillmentType,
        delivery_scope: fulfillmentType === 'delivery' ? deliveryScope : undefined,
        addis_delivery_type: deliveryScope === 'addis_ababa' ? addisDeliveryType : undefined,
        outsourced_provider: addisDeliveryType === 'outsourced' ? outsourcedProvider : undefined,
        delivery_fee_paid_by: addisDeliveryType === 'outsourced' ? deliveryFeePaidBy : undefined,
        driver_name: driverName || undefined,
        driver_phone: driverPhone || undefined,
        vehicle_plate_number: vehiclePlate || undefined,
      });
    }
    setPhoneInput('');
    setRemark('');
    setNewName('');
    setNewCompany('');
    setSelectedProductId('none');
    setUnlistedProductName('');
    setNextFollowUpDate('');
    setDateError('');
    setSaleQuantity(1);
    setSaleAmount('');
    setCargoCarrier('');
    setCargoTicket('');
    setCargoCity('');
    setFulfillmentType('delivery');
    setDeliveryScope('addis_ababa');
    setAddisDeliveryType('own_delivery');
    setOutsourcedProvider('Feres');
    setDeliveryFeePaidBy('customer');
    setDriverName('');
    setDriverPhone('');
    setVehiclePlate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`min-w-0 rounded-2xl shadow-2xl max-w-xl w-full max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden border transition-colors ${
        isDark ? 'bg-[#141414] border-neutral-700 text-neutral-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex shrink-0 items-center justify-between gap-2 px-3 py-4 sm:px-6 sm:py-5 border-b ${
          isDark ? 'bg-[#181818] border-neutral-700' : 'bg-slate-50/80 border-slate-100'
        }`}>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-amber-500 text-black flex items-center justify-center shadow-md">
              <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 break-words">
              <h3 className="font-bold text-sm sm:text-lg">Live Incoming Call & Communication Outcome</h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Lookup caller & categorize by 7 Core Outcomes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close incoming call"
            className={`shrink-0 p-1.5 sm:p-2 rounded-xl transition-colors font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isDark ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-6 space-y-5 min-w-0 min-h-0 overflow-y-auto overscroll-contain break-words">
          {/* Incoming Phone Number Input */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
              Incoming Caller Phone Number or Name *
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Type phone (e.g. 0911223344) or name..."
                className={`min-w-0 w-full pl-10 pr-4 py-3 border rounded-xl text-base font-mono font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs transition-colors ${
                  isDark ? 'bg-[#101010] border-neutral-700 text-neutral-100 placeholder-neutral-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
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
                <div className={`min-w-0 border rounded-2xl p-3 sm:p-4 space-y-3 transition-colors ${
                  isDark ? 'bg-[#181818] border-neutral-700 text-neutral-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={`min-w-0 max-w-full text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                    }`}>
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Registered Client Found in CRM
                    </span>
                    <span className={`min-w-0 max-w-full px-2.5 py-1 rounded-md border text-xs font-semibold ${isDark ? 'border-neutral-700 text-neutral-200' : 'border-slate-300 text-slate-700'}`}>{matchedBranchName}</span>
                    <span className={`px-2.5 py-1 rounded-md border text-xs font-mono ${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>Streak: {matchedMaxStreak}/5</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-base">{matchedCustomer.customerName}</h4>
                    <p className={`text-xs ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>{matchedCustomer.companyName || 'Print Shop'} • <span className={`font-mono font-bold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{matchedCustomer.phoneNumber}</span></p>
                  </div>

                  <form onSubmit={handleLogExistingCall} className={`space-y-3 pt-2 border-t ${isDark ? 'border-neutral-700' : 'border-slate-200'}`}>
                    <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-3 [&>div]:min-w-0">
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Outcome</label>
                        <select
                          value={outcome}
                          onChange={(e) => {
                            setOutcome(e.target.value);
                            setDateError('');
                          }}
                          className={`${inputClasses} font-semibold`}
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
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Duration (Mins)</label>
                        <input
                          type="number"
                          min="1"
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className={`${inputClasses} font-mono font-bold`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Product Discussed / Requested</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className={`${inputClasses} font-semibold`}
                      >
                        <option value="none">-- Select Catalog Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.itemName} ({p.itemCategory})</option>
                        ))}
                        <option value="unlisted">➕ Tag as Unlisted Product...</option>
                      </select>
                      {selectedProductId === 'unlisted' && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={unlistedProductName}
                            onChange={(e) => setUnlistedProductName(e.target.value)}
                            placeholder="Enter unlisted item name (e.g. Epson L8180, A3 UV DTF Film)..."
                            className={`${inputClasses} font-medium`}
                            required
                          />
                          <p className="text-[10px] text-amber-500 mt-1 font-medium">💡 Will notify Procurement & Marketing Managers of new market demand.</p>
                        </div>
                      )}
                    </div>

                    {outcome === 'Sales' && (
                      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-emerald-400">
                          <Package className="w-3.5 h-3.5" />
                          <span>Quick Sale Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={saleQuantity}
                              onChange={(e) => setSaleQuantity(Number(e.target.value))}
                              className={`${inputClasses} font-mono font-bold`}
                            />
                          </div>
                          <div>
                            <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Sale Amount (ETB)</label>
                            {selectedProductId !== 'none' && selectedProductId !== 'unlisted' ? (
                              <div className={`${inputClasses} font-mono font-bold flex items-center gap-2`}>
                                <span>{Number(saleAmount || 0).toLocaleString()}</span>
                                <span className="text-[10px] text-emerald-400 font-normal">auto</span>
                              </div>
                            ) : (
                              <input type="number" min="0" value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)} placeholder="e.g. 45000" className={`${inputClasses} font-mono font-bold`} />
                            )}
                          </div>
                        </div>

                        {/* Fulfillment Type */}
                        <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                          <p className="text-[10px] font-bold uppercase text-emerald-500/70 tracking-wider">Fulfillment</p>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setFulfillmentType('pickup')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${fulfillmentType === 'pickup' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                              📋 Pickup at Showroom
                            </button>
                            <button type="button" onClick={() => setFulfillmentType('delivery')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${fulfillmentType === 'delivery' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                              🚚 Delivery
                            </button>
                          </div>
                        </div>

                        {fulfillmentType === 'delivery' && (
                          <div className="space-y-2.5 pt-1">
                            <p className="text-[10px] font-bold uppercase text-emerald-500/70 tracking-wider">Delivery Scope</p>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setDeliveryScope('addis_ababa')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${deliveryScope === 'addis_ababa' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                                🏙️ Addis Ababa
                              </button>
                              <button type="button" onClick={() => setDeliveryScope('province')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${deliveryScope === 'province' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                                🚌 Regional / Province
                              </button>
                            </div>

                            {deliveryScope === 'addis_ababa' && (
                              <div className="space-y-2.5 pt-1">
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => setAddisDeliveryType('own_delivery')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${addisDeliveryType === 'own_delivery' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                                    🏢 Own Delivery (In-House)
                                  </button>
                                  <button type="button" onClick={() => setAddisDeliveryType('outsourced')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${addisDeliveryType === 'outsourced' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                                    🚗 Outsourced (Feres / RIDE)
                                  </button>
                                </div>

                                {addisDeliveryType === 'outsourced' && (
                                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div>
                                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Service Provider</label>
                                      <select value={outsourcedProvider} onChange={(e) => setOutsourcedProvider(e.target.value)} className={`${inputClasses} text-[11px]`}>
                                        <option value="Feres">Feres Delivery</option>
                                        <option value="RIDE">RIDE Delivery</option>
                                        <option value="Yango">Yango Delivery</option>
                                        <option value="Motorcycle Courier">Local Motor Courier</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Delivery Fee</label>
                                      <select value={deliveryFeePaidBy} onChange={(e) => setDeliveryFeePaidBy(e.target.value as any)} className={`${inputClasses} text-[11px]`}>
                                        <option value="customer">Paid by Customer</option>
                                        <option value="ttm_free">Free (Covered by TTM)</option>
                                      </select>
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-3 gap-2 text-[11px]">
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Driver Name</label>
                                    <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Driver name" className={`${inputClasses} text-[11px]`} />
                                  </div>
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Driver Phone</label>
                                    <input type="text" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="09..." className={`${inputClasses} text-[11px] font-mono`} />
                                  </div>
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Plate Number</label>
                                    <input type="text" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="e.g. 3-48291 AA" className={`${inputClasses} text-[11px] font-mono`} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {deliveryScope === 'province' && (
                              <div className="space-y-2 pt-1">
                                <p className="text-[10px] font-bold uppercase text-emerald-500/70 tracking-wider">Bus Cargo Tracker</p>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Carrier</label>
                                    <select value={cargoCarrier} onChange={(e) => setCargoCarrier(e.target.value)} className={`${inputClasses} text-[11px]`}>
                                      <option value="">None</option>
                                      <option value="Selam Bus">Selam Bus</option>
                                      <option value="Sky Bus">Sky Bus</option>
                                      <option value="Libus">Libus</option>
                                      <option value="Golden Bus">Golden Bus</option>
                                      <option value="Habesha Bus">Habesha Bus</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Ticket #</label>
                                    <input type="text" value={cargoTicket} onChange={(e) => setCargoTicket(e.target.value)} placeholder="e.g. 48192" className={`${inputClasses} text-[11px] font-mono`} />
                                  </div>
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>City</label>
                                    <input type="text" value={cargoCity} onChange={(e) => setCargoCity(e.target.value)} placeholder="e.g. Hawassa" className={`${inputClasses} text-[11px]`} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-[10px] text-emerald-400 font-medium pt-1">✅ Sale + delivery details recorded in one step.</p>
                      </div>
                    )}

                    {needsFollowUp && (
                      <div>
                        <label htmlFor="call-follow-up-date" className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Next Follow-up Date *</label>
                        <input
                          id="call-follow-up-date"
                          type="date"
                          value={nextFollowUpDate}
                          min={todayStr}
                          required
                          onChange={(e) => {
                            setNextFollowUpDate(e.target.value);
                            setDateError('');
                          }}
                          aria-invalid={!!dateError}
                          aria-describedby={dateError ? 'call-follow-up-error' : undefined}
                          className={`${inputClasses} font-medium`}
                        />
                        {dateError && <p id="call-follow-up-error" role="alert" className="mt-1 text-xs text-red-500">{dateError}</p>}
                      </div>
                    )}

                    {outcome === 'Evaluation' && (
                      <div className="space-y-1.5 pt-1">
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                          Customer Price Reaction (Evaluation)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'accepted', label: '🟢 Fair / Accepted' },
                            { key: 'too_high', label: '🔴 Claimed Too High' },
                            { key: 'competitor_cheaper', label: '🟡 Cheaper Elsewhere' }
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setPriceFeedback(item.key)}
                              className={`py-2 px-2 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                                priceFeedback === item.key
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                                  : 'bg-[#101010] border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Call Remarks / Notes *</label>
                      <p className={`mb-1 text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Mention a teammate with @username or a configured alias, e.g. @ops.</p>
                      <textarea
                        rows={2}
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="What did they discuss?"
                        className={`${inputClasses} font-medium`}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="min-w-0 w-full px-3 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                    >
                      <PhoneCall className="w-4 h-4 shrink-0" />
                      <span>Log Call ({outcome}) for {matchedCustomer.customerName}</span>
                    </button>
                  </form>
                </div>
              ) : (
                /* NEW CALLER NOT FOUND -> INSTANT REGISTER & LOG */
                <div className={`min-w-0 border rounded-2xl p-3 sm:p-4 space-y-3 transition-colors ${
                  isDark ? 'bg-[#181818] border-neutral-700 text-neutral-100' : 'bg-amber-50 border-amber-300 text-slate-900'
                }`}>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={`min-w-0 max-w-full text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-100 text-amber-900'
                    }`}>
                      <UserPlus className="w-3.5 h-3.5 shrink-0" /> New Caller Detected (Not in CRM)
                    </span>
                    <span className={`text-xs font-bold font-mono ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>{phoneInput}</span>
                  </div>

                  <form onSubmit={handleRegisterAndLogNew} className={`space-y-3 pt-2 border-t ${isDark ? 'border-neutral-700' : 'border-amber-200'}`}>
                    <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-3 [&>div]:min-w-0">
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Client Full Name *</label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="e.g. Ato Tamirat"
                          className={`${inputClasses} font-medium`}
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Print Shop / Company</label>
                        <input
                          type="text"
                          value={newCompany}
                          onChange={(e) => setNewCompany(e.target.value)}
                          placeholder="e.g. Tamirat Printing"
                          className={`${inputClasses} font-medium`}
                        />
                      </div>
                    </div>

                    <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-3 [&>div]:min-w-0">
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Outcome</label>
                        <select
                          value={outcome}
                          onChange={(e) => {
                            setOutcome(e.target.value);
                            setDateError('');
                          }}
                          className={`${inputClasses} font-semibold`}
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
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Source</label>
                        <select
                          value={newSource}
                          onChange={(e) => setNewSource(e.target.value)}
                          className={`${inputClasses} font-semibold`}
                        >
                          <option value="Telegram">Telegram</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Referral">Referral</option>
                          <option value="Previous Buyer">Previous Buyer</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Product Discussed / Requested</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className={`${inputClasses} font-semibold`}
                      >
                        <option value="none">-- Select Catalog Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.itemName} ({p.itemCategory})</option>
                        ))}
                        <option value="unlisted">➕ Tag as Unlisted Product...</option>
                      </select>
                      {selectedProductId === 'unlisted' && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={unlistedProductName}
                            onChange={(e) => setUnlistedProductName(e.target.value)}
                            placeholder="Enter unlisted item name (e.g. Epson L8180, A3 UV DTF Film)..."
                            className={`${inputClasses} font-medium`}
                            required
                          />
                          <p className="text-[10px] text-amber-500 mt-1 font-medium">💡 Will notify Procurement & Marketing Managers of new market demand.</p>
                        </div>
                      )}
                    </div>

                    {outcome === 'Sales' && (
                      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-emerald-400">
                          <Package className="w-3.5 h-3.5" />
                          <span>Quick Sale Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={saleQuantity}
                              onChange={(e) => setSaleQuantity(Number(e.target.value))}
                              className={`${inputClasses} font-mono font-bold`}
                            />
                          </div>
                          <div>
                            <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Sale Amount (ETB)</label>
                            {selectedProductId !== 'none' && selectedProductId !== 'unlisted' ? (
                              <div className={`${inputClasses} font-mono font-bold flex items-center gap-2`}>
                                <span>{Number(saleAmount || 0).toLocaleString()}</span>
                                <span className="text-[10px] text-emerald-400 font-normal">auto</span>
                              </div>
                            ) : (
                              <input type="number" min="0" value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)} placeholder="e.g. 45000" className={`${inputClasses} font-mono font-bold`} />
                            )}
                          </div>
                        </div>

                        {/* Fulfillment Type */}
                        <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                          <p className="text-[10px] font-bold uppercase text-emerald-500/70 tracking-wider">Fulfillment</p>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setFulfillmentType('pickup')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${fulfillmentType === 'pickup' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                              📋 Pickup at Showroom
                            </button>
                            <button type="button" onClick={() => setFulfillmentType('delivery')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${fulfillmentType === 'delivery' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                              🚚 Delivery
                            </button>
                          </div>
                        </div>

                        {fulfillmentType === 'delivery' && (
                          <div className="space-y-2.5 pt-1">
                            <p className="text-[10px] font-bold uppercase text-emerald-500/70 tracking-wider">Delivery Scope</p>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setDeliveryScope('addis_ababa')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${deliveryScope === 'addis_ababa' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                                🏙️ Addis Ababa
                              </button>
                              <button type="button" onClick={() => setDeliveryScope('province')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${deliveryScope === 'province' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                                🚌 Regional / Province
                              </button>
                            </div>

                            {deliveryScope === 'addis_ababa' && (
                              <div className="space-y-2.5 pt-1">
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => setAddisDeliveryType('own_delivery')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${addisDeliveryType === 'own_delivery' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                                    🏢 Own Delivery (In-House)
                                  </button>
                                  <button type="button" onClick={() => setAddisDeliveryType('outsourced')} className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${addisDeliveryType === 'outsourced' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#121212] border-neutral-700 text-neutral-400'}`}>
                                    🚗 Outsourced (Feres / RIDE)
                                  </button>
                                </div>

                                {addisDeliveryType === 'outsourced' && (
                                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div>
                                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Service Provider</label>
                                      <select value={outsourcedProvider} onChange={(e) => setOutsourcedProvider(e.target.value)} className={`${inputClasses} text-[11px]`}>
                                        <option value="Feres">Feres Delivery</option>
                                        <option value="RIDE">RIDE Delivery</option>
                                        <option value="Yango">Yango Delivery</option>
                                        <option value="Motorcycle Courier">Local Motor Courier</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Delivery Fee</label>
                                      <select value={deliveryFeePaidBy} onChange={(e) => setDeliveryFeePaidBy(e.target.value as any)} className={`${inputClasses} text-[11px]`}>
                                        <option value="customer">Paid by Customer</option>
                                        <option value="ttm_free">Free (Covered by TTM)</option>
                                      </select>
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-3 gap-2 text-[11px]">
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Driver Name</label>
                                    <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Driver name" className={`${inputClasses} text-[11px]`} />
                                  </div>
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Driver Phone</label>
                                    <input type="text" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="09..." className={`${inputClasses} text-[11px] font-mono`} />
                                  </div>
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Plate Number</label>
                                    <input type="text" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="e.g. 3-48291 AA" className={`${inputClasses} text-[11px] font-mono`} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {deliveryScope === 'province' && (
                              <div className="space-y-2 pt-1">
                                <p className="text-[10px] font-bold uppercase text-emerald-500/70 tracking-wider">Bus Cargo Tracker</p>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Carrier</label>
                                    <select value={cargoCarrier} onChange={(e) => setCargoCarrier(e.target.value)} className={`${inputClasses} text-[11px]`}>
                                      <option value="">None</option>
                                      <option value="Selam Bus">Selam Bus</option>
                                      <option value="Sky Bus">Sky Bus</option>
                                      <option value="Libus">Libus</option>
                                      <option value="Golden Bus">Golden Bus</option>
                                      <option value="Habesha Bus">Habesha Bus</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Ticket #</label>
                                    <input type="text" value={cargoTicket} onChange={(e) => setCargoTicket(e.target.value)} placeholder="e.g. 48192" className={`${inputClasses} text-[11px] font-mono`} />
                                  </div>
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>City</label>
                                    <input type="text" value={cargoCity} onChange={(e) => setCargoCity(e.target.value)} placeholder="e.g. Hawassa" className={`${inputClasses} text-[11px]`} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-[10px] text-emerald-400 font-medium pt-1">✅ Sale + delivery details recorded in one step.</p>
                      </div>
                    )}

                    {needsFollowUp && (
                      <div>
                        <label htmlFor="call-follow-up-date" className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Next Follow-up Date *</label>
                        <input
                          id="call-follow-up-date"
                          type="date"
                          value={nextFollowUpDate}
                          min={todayStr}
                          required
                          onChange={(e) => {
                            setNextFollowUpDate(e.target.value);
                            setDateError('');
                          }}
                          aria-invalid={!!dateError}
                          aria-describedby={dateError ? 'call-follow-up-error' : undefined}
                          className={`${inputClasses} font-medium`}
                        />
                        {dateError && <p id="call-follow-up-error" role="alert" className="mt-1 text-xs text-red-500">{dateError}</p>}
                      </div>
                    )}

                    {outcome === 'Evaluation' && (
                      <div className="space-y-1.5 pt-1">
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                          Customer Price Reaction (Evaluation)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'accepted', label: '🟢 Fair / Accepted' },
                            { key: 'too_high', label: '🔴 Claimed Too High' },
                            { key: 'competitor_cheaper', label: '🟡 Cheaper Elsewhere' }
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setPriceFeedback(item.key)}
                              className={`py-2 px-2 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                                priceFeedback === item.key
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                                  : 'bg-[#101010] border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className={`block text-[11px] font-bold uppercase mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Call Remarks / Notes *</label>
                      <p className={`mb-1 text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Mention a teammate with @username or a configured alias, e.g. @ops.</p>
                      <textarea
                        rows={2}
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Inquired about Mug Press / T-Shirt machinery..."
                        className={`${inputClasses} font-medium`}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="min-w-0 w-full px-3 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                    >
                      <UserPlus className="w-4 h-4 shrink-0" />
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
