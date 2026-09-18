import React, { useState } from 'react';
import { Notification, User } from '../types/crm';
import { Bell, CheckCheck, AlertTriangle, ArrowRightLeft, MessageSquare, Package, Check } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface NotificationsViewProps {
  notifications: Notification[];
  currentUser: User;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  theme: 'light' | 'dark';
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  currentUser,
  onMarkRead,
  onMarkAllRead,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const myNotifs = notifications.filter(n => n.recipientUserId === currentUser.id);
  const unreadCount = myNotifs.filter(n => !n.read).length;

  const filteredNotifs = myNotifs.filter(n => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'complaints') return n.type === 'complaint' || n.title.toLowerCase().includes('complaint');
    if (typeFilter === 'transfers') return n.type === 'branch_reassignment' || n.title.toLowerCase().includes('reassigned') || n.title.toLowerCase().includes('branch');
    if (typeFilter === 'mentions') return n.type === 'mention' || n.title.toLowerCase().includes('mention');
    if (typeFilter === 'after_sales') return n.type === 'after_sales' || n.title.toLowerCase().includes('after-sales') || n.title.toLowerCase().includes('check-in');
    return true;
  });

  const getIconForType = (type?: string, title?: string) => {
    const t = (type || title || '').toLowerCase();
    if (t.includes('complaint')) return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    if (t.includes('reassign') || t.includes('branch') || t.includes('transfer')) return <ArrowRightLeft className="w-4 h-4 text-amber-400" />;
    if (t.includes('mention')) return <MessageSquare className="w-4 h-4 text-cyan-400" />;
    if (t.includes('after') || t.includes('stock')) return <Package className="w-4 h-4 text-emerald-400" />;
    return <Bell className="w-4 h-4 text-amber-500" />;
  };

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const subText = isDark ? 'text-zinc-400' : 'text-slate-500';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-amber-400" /> Notifications & Operational Inbox
          </h2>
          <p className={`text-xs mt-0.5 ${subText}`}>Review branch transfers, urgent complaints, colleague @mentions, and follow-up alerts.</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" /> <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Notifications', icon: Bell },
          { key: 'complaints', label: '🚨 Complaints', icon: AlertTriangle },
          { key: 'transfers', label: '⚡ Branch Transfers', icon: ArrowRightLeft },
          { key: 'mentions', label: '💬 @Mentions', icon: MessageSquare },
          { key: 'after_sales', label: '📦 After-Sales', icon: Package },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = typeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-black font-bold shadow-md'
                  : 'bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No Notifications Found"
            description="You are fully caught up! No notifications match the selected filter."
          />
        ) : (
          filteredNotifs.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && onMarkRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.read
                  ? 'bg-[#141414] border-neutral-800/60 opacity-70'
                  : 'bg-[#1c1c1e] border-amber-500/30 shadow-lg'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getIconForType(n.type, n.title)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{n.message}</p>
                  <time dateTime={n.createdAt} title={n.createdAt} className="block text-[11px] font-mono text-neutral-400 mt-1">{new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(n.id);
                  }}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                  title="Mark read"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark Read</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
