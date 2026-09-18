import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Package,
  ArrowLeftRight,
  Settings,
  Calendar,
  Trophy,
  PhoneCall,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const SIDEBAR_KEY = 'ttm_sidebar_collapsed';

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onCollapsedChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true';
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    onCollapsedChange?.(isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customer Directory', icon: Users },
    { id: 'communications', label: 'Communications Feed', icon: PhoneCall },
    { id: 'customer-leadboard', label: 'Customer Leaderboard', icon: Trophy },
    { id: 'calendar', label: 'Calendar & Reminders', icon: Calendar },
    { id: 'leaderboard', label: 'Team Scoreboard', icon: Trophy },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'products', label: 'Product Store', icon: Package },
    { id: 'import-export', label: 'Import / Export', icon: ArrowLeftRight },
    { id: 'settings', label: 'Settings & Users', icon: Settings },
  ];

  return (
    <aside
      className={`bg-[#09090b] text-zinc-300 flex flex-col h-screen fixed left-0 top-0 border-r border-zinc-800/60 z-30 select-none transition-all duration-300 ease-in-out shrink-0 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      <div className={`p-4 border-b border-zinc-800/60 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-black text-xs shrink-0">
              TTM
            </div>
            <span className="font-bold text-white tracking-wide text-sm whitespace-nowrap">TTM CRM</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
        >
          {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Navigation</div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              aria-label={item.label}
              className={`group relative w-full flex items-center gap-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isCollapsed ? 'justify-center px-0' : 'px-3'
              } ${
                isActive
                  ? 'bg-zinc-800/80 text-white font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="truncate whitespace-nowrap">{item.label}</span>}
              {isCollapsed && (
                <span className="pointer-events-none absolute left-full ml-2 px-2.5 py-1 rounded-md bg-[#1a1a1a] border border-zinc-700 text-zinc-200 text-xs whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800/60 bg-zinc-950/40 text-[11px] text-zinc-400">
        {isCollapsed ? (
          <div className="flex justify-center" title="Showroom: Addis Ababa • Online">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span>Showroom: Addis Ababa</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
