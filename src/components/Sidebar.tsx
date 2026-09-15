import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Columns3, 
  BarChart3, 
  Package, 
  ArrowLeftRight, 
  Settings,
  Menu,
  Calendar,
  Trophy,
  PhoneCall
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Printing Clients', icon: Users },
    { id: 'communications', label: 'Communications Feed', icon: PhoneCall },
    { id: 'customer-leadboard', label: 'Customer Leadboard', icon: Trophy },
    { id: 'calendar', label: 'Calendar & Reminders', icon: Calendar },
    { id: 'leaderboard', label: 'Team Scoreboard', icon: Trophy },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'products', label: 'Product Store', icon: Package },
    { id: 'import-export', label: 'Import / Export', icon: ArrowLeftRight },
    { id: 'settings', label: 'Settings & Users', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#09090b] text-zinc-300 flex flex-col h-screen fixed left-0 top-0 border-r border-zinc-800/60 z-30 select-none">
      <div className="p-4 border-b border-zinc-800/60 flex items-center gap-3">
        <button className="text-zinc-400 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-black text-xs">
            TTM
          </div>
          <span className="font-bold text-white tracking-wide text-sm">TTM CRM</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800/80 text-white font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4 text-zinc-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800/60 bg-zinc-950/40 text-[11px] text-zinc-400 flex items-center justify-between">
        <span>Showroom: Addis Ababa</span>
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Online
        </span>
      </div>
    </aside>
  );
};
