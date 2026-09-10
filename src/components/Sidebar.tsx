import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Columns3, 
  BarChart3, 
  Package, 
  ArrowLeftRight, 
  Settings,
  PhoneIncoming
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenIncomingCall: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenIncomingCall }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Printing Clients', icon: Users },
    { id: 'pipeline', label: 'Pipeline Board', icon: Columns3 },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'products', label: 'Product Store', icon: Package },
    { id: 'import-export', label: 'Import / Export', icon: ArrowLeftRight },
    { id: 'settings', label: 'Settings & Users', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center font-bold text-white shadow-inner">
            TTM
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white">TTM CRM</h1>
            <p className="text-xs text-slate-400">Printing & Machinery</p>
          </div>
        </div>
      </div>

      {/* Quick Incoming Call Action */}
      <div className="p-4">
        <button
          onClick={onOpenIncomingCall}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors text-xs tracking-wide animate-pulse"
        >
          <PhoneIncoming className="w-4 h-4" />
          <span>📞 Incoming Call Lookup</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-teal-900/60 text-teal-300 border-l-4 border-teal-500'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info / Operator Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-300">Showroom Status</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
        <p className="text-[11px] text-slate-400">Addis Ababa, Ethiopia</p>
      </div>
    </aside>
  );
};
