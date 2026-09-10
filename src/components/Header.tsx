import React from 'react';
import { Search, Bell, Building2, Shield, PhoneIncoming } from 'lucide-react';
import { Branch, User } from '../types/crm';

interface HeaderProps {
  branches: Branch[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenNotifications: () => void;
  onOpenIncomingCall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  branches,
  selectedBranchId,
  setSelectedBranchId,
  currentUser,
  setCurrentUser,
  users,
  searchTerm,
  setSearchTerm,
  onOpenNotifications,
  onOpenIncomingCall,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-64 z-20 px-6 flex items-center justify-between shadow-xs">
      {/* Search Bar */}
      <div className="flex items-center gap-3 w-80">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search printing clients..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Right Controls: Incoming Call Popup, Branch Filter, User Switcher */}
      <div className="flex items-center gap-3">
        {/* Incoming Call Lookup Button (Unified Workflow) */}
        <button
          onClick={onOpenIncomingCall}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-colors animate-pulse"
          title="Incoming Call Lookup (Alt + I)"
        >
          <PhoneIncoming className="w-4 h-4" />
          <span>📞 Incoming Call Lookup</span>
        </button>

        {/* Branch Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Building2 className="w-4 h-4 text-slate-500" />
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            aria-label="Select Branch"
            className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Showrooms</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* User Simulator */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Shield className="w-4 h-4 text-teal-600" />
          <select
            value={currentUser.id}
            onChange={(e) => {
              const u = users.find((item) => item.id === e.target.value);
              if (u) setCurrentUser(u);
            }}
            aria-label="Select User Profile"
            className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Follow-up Reminders"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
};
