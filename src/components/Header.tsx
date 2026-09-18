import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, MessageSquare, Sparkles, HelpCircle, PhoneIncoming, Menu, Sun, Moon, CheckCheck } from 'lucide-react';
import { Branch, User, Notification } from '../types/crm';

interface HeaderProps {
  branches: Branch[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenNotifications: () => void;
  onOpenIncomingCall: () => void;
  onOpenCommandPalette: () => void;
  onOpenAiCopilot: () => void;
  unreadNotifCount: number;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  branches, selectedBranchId, setSelectedBranchId,
  currentUser, setCurrentUser, users,
  searchTerm, setSearchTerm, theme, onToggleTheme,
  onOpenNotifications, onOpenIncomingCall, onOpenCommandPalette, onOpenAiCopilot,
  unreadNotifCount, notifications, onMarkRead,
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const isDark = theme === 'dark';
  const [now, setNow] = useState(Date.now());
  const notificationRef = useRef<HTMLDivElement>(null);
  const remainingTimeRef = useRef(5000);
  const [isNotificationHovered, setIsNotificationHovered] = useState(false);

  useEffect(() => {
    remainingTimeRef.current = 5000;
    if (!showNotifDropdown) setIsNotificationHovered(false);
  }, [showNotifDropdown]);

  useEffect(() => {
    if (!showNotifDropdown || isNotificationHovered) return;
    const startedAt = performance.now();
    const timer = window.setTimeout(() => setShowNotifDropdown(false), remainingTimeRef.current);
    return () => {
      window.clearTimeout(timer);
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - (performance.now() - startedAt));
    };
  }, [showNotifDropdown, isNotificationHovered]);

  useEffect(() => {
    if (!showNotifDropdown) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !notificationRef.current?.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowNotifDropdown(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNotifDropdown]);

  useEffect(() => {
    if (!showNotifDropdown) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [showNotifDropdown]);

  const getRelativeTime = (dateString: string) => {
    const timestamp = new Date(dateString).getTime();
    if (!Number.isFinite(timestamp)) return 'Unknown time';
    const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const myNotifs = notifications.filter(n => n.recipientUserId === currentUser.id);
  const unread = myNotifs.filter(n => !n.read);

  return (
    <header className="h-14 bg-[#09090b] border-b border-zinc-800/60 fixed top-0 right-0 left-64 z-20 px-6 flex items-center justify-between text-zinc-300">
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text" value="" readOnly
            onClick={onOpenCommandPalette}
            placeholder="Search or type a command (Ctrl + G)"
            className="w-full pl-9 pr-24 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 cursor-pointer"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 font-mono">Ctrl + G</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onOpenIncomingCall} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors" title="Incoming Call Lookup">
          <PhoneIncoming className="w-3.5 h-3.5" /> <span>Incoming Call</span>
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1"></div>

        <button className="p-2 text-zinc-400 hover:text-white transition-colors relative" title="Messages">
          <MessageSquare className="w-4 h-4" />
        </button>
        <button onClick={onOpenAiCopilot} className="p-2 text-zinc-400 hover:text-amber-400 transition-colors" title="AI Operational Copilot">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
        </button>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button aria-expanded={showNotifDropdown} aria-controls="notification-popover" onClick={() => setShowNotifDropdown(open => !open)} className="p-2 text-zinc-400 hover:text-white transition-colors relative" title="Notifications">
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadNotifCount}</span>}
          </button>
          {showNotifDropdown && (
            <div id="notification-popover" onMouseEnter={() => setIsNotificationHovered(true)} onMouseLeave={() => setIsNotificationHovered(false)} className={`absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-xl z-50 overflow-hidden ${isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200'}`}>
              <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'border-zinc-800/60' : 'border-slate-200'}`}>
                <span className="text-xs font-bold text-white">Notifications</span>
                {unread.length > 0 && (
                  <button onClick={() => { unread.forEach(n => onMarkRead(n.id)); setShowNotifDropdown(false); }} className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto">
                {myNotifs.length === 0 ? (
                  <div className={`p-4 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No notifications</div>
                ) : (
                  myNotifs.map(n => (
                    <div key={n.id} onClick={() => onMarkRead(n.id)} className={`px-3 py-3 border-b cursor-pointer hover:bg-zinc-800/40 transition-colors ${n.read ? 'opacity-60' : ''} ${isDark ? 'border-zinc-800/60' : 'border-slate-100'}`}>
                      <p className={`text-xs font-semibold ${n.read ? 'text-zinc-400' : 'text-zinc-100'}`}>{n.title}</p>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{n.message}</p>
                      <time dateTime={n.createdAt} title={n.createdAt} className="block text-[11px] font-mono text-neutral-400 mt-1">{getRelativeTime(n.createdAt)}</time>
                    </div>
                  ))
                )}
              </div>
              <div aria-hidden="true" className="h-0.5 bg-neutral-800 w-full overflow-hidden">
                <div className="h-full bg-amber-500/60 w-full toast-countdown" style={{ animationPlayState: isNotificationHovered ? 'paused' : 'running' }} />
              </div>
            </div>
          )}
        </div>

        <button className="p-2 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-xs" title="Help"><span>Help</span></button>

        <div className="h-4 w-px bg-zinc-800 mx-1"></div>

        <button onClick={onToggleTheme} className="p-2 text-zinc-400 hover:text-white transition-colors" title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} aria-label="Select Branch" className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none cursor-pointer">
          <option value="all">All Showrooms</option>
          {branches.map((b) => <option key={b.id} value={b.id} className="bg-zinc-900 text-zinc-200">{b.name}</option>)}
        </select>

        <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
          <div className="w-7 h-7 rounded-full bg-amber-900/40 text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-800/60">
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-zinc-200 leading-tight">{currentUser.name}</div>
            <div className="text-[10px] text-zinc-400">{currentUser.role}</div>
          </div>
          <select value={currentUser.id} onChange={(e) => { const u = users.find((item) => item.id === e.target.value); if (u) setCurrentUser(u); }} aria-label="Select User Profile" className="opacity-0 absolute w-8 h-8 cursor-pointer">
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>
      </div>
    </header>
  );
};
