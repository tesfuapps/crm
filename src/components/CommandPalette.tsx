import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, Package, PhoneCall, Settings, BarChart2, ShieldCheck, ArrowRight, Plus, Terminal } from 'lucide-react';
import { Customer, CallLog, ProductItem, User, Branch } from '../types/crm';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  callLogs: CallLog[];
  products: ProductItem[];
  users: User[];
  branches: Branch[];
  setActiveTab: (tab: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onOpenIncomingCall: () => void;
  theme: 'light' | 'dark';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  customers,
  callLogs,
  products,
  setActiveTab,
  onSelectCustomer,
  onOpenIncomingCall,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Filter categories
  const matchedCustomers = customers.filter(c => 
    c.customerName.toLowerCase().includes(q) || 
    (c.companyName && c.companyName.toLowerCase().includes(q)) || 
    c.phoneNumber.includes(q)
  ).slice(0, 4);

  const matchedProducts = products.filter(p => 
    p.itemName.toLowerCase().includes(q) || 
    p.itemCategory.toLowerCase().includes(q)
  ).slice(0, 4);

  const matchedCalls = callLogs.filter(l => 
    l.purpose.toLowerCase().includes(q) || 
    l.remark.toLowerCase().includes(q) ||
    l.id.toLowerCase().includes(q)
  ).slice(0, 3);

  const navPages = [
    { name: 'Dashboard', tab: 'dashboard', icon: BarChart2 },
    { name: 'Printing Clients', tab: 'customers', icon: Users },
    { name: 'Communications Feed', tab: 'communications', icon: PhoneCall },
    { name: 'Customer Leaderboard', tab: 'customer-leadboard', icon: ShieldCheck },
    { name: 'Reports', tab: 'reports', icon: BarChart2 },
    { name: 'Product Store', tab: 'products', icon: Package },
    { name: 'Settings & Branches', tab: 'settings', icon: Settings },
  ].filter(p => p.name.toLowerCase().includes(q)).slice(0, 4);

  const quickActions = [
    { name: '+ Log New Communication', action: () => { onClose(); onOpenIncomingCall(); }, icon: Plus },
    { name: '+ Add New Customer / Print Shop', action: () => { onClose(); setActiveTab('customers'); }, icon: Plus },
    { name: 'View Product Store Catalog', action: () => { onClose(); setActiveTab('products'); }, icon: Package },
    { name: 'Open Reports & Analytics', action: () => { onClose(); setActiveTab('reports'); }, icon: BarChart2 },
  ].filter(a => a.name.toLowerCase().includes(q));

  // Flatten results for keyboard navigation
  const flatResults: { type: string; title: string; subtitle: string; icon: any; select: () => void }[] = [
    ...matchedCustomers.map(c => ({
      type: 'Customer',
      title: c.customerName,
      subtitle: `${c.companyName || 'Print Shop'} • ${c.phoneNumber} (${c.customerStage})`,
      icon: Users,
      select: () => { onClose(); onSelectCustomer(c); }
    })),
    ...matchedProducts.map(p => ({
      type: 'Product',
      title: p.itemName,
      subtitle: `${p.itemCategory} • ${p.itemPrice.toLocaleString()} ETB`,
      icon: Package,
      select: () => { onClose(); setActiveTab('products'); }
    })),
    ...navPages.map(p => ({
      type: 'Navigation',
      title: p.name,
      subtitle: `Jump to ${p.name} view`,
      icon: p.icon,
      select: () => { onClose(); setActiveTab(p.tab); }
    })),
    ...quickActions.map(a => ({
      type: 'Action',
      title: a.name,
      subtitle: 'Quick System Action',
      icon: a.icon,
      select: a.action
    })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(flatResults.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % Math.max(flatResults.length, 1));
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault();
      flatResults[selectedIndex].select();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-start justify-center z-50 pt-20 p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#161616] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-800 bg-zinc-950/80 gap-3">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type to search customers, products, pages, or actions (/products, /customers...)"
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-medium"
          />
          <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-1 rounded border border-neutral-700 shrink-0">ESC</span>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {flatResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No matching results found for "{query}". Try searching customers, products, or typing an action.
            </div>
          ) : (
            flatResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={idx}
                  onClick={item.select}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-950/30 border border-amber-600/50 text-white' : 'hover:bg-neutral-900 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-100">{item.title}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      {item.type}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-neutral-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2.5 bg-zinc-950/90 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded font-mono">↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded font-mono">↵</kbd> Select</span>
          </div>
          <span className="font-semibold text-amber-500/80">TTM CRM Global Command Palette</span>
        </div>
      </div>
    </div>
  );
};
