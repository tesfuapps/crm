import React, { useState } from 'react';
import { Branch, User, Label } from '../types/crm';
import { Settings, Building2, Shield, Plus, UserPlus, Tag, ArrowRightLeft, Brain, Key, Check } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey } from '../services/aiService';

interface SettingsViewProps {
  branches: Branch[];
  users: User[];
  theme: 'light' | 'dark';
  onAddBranch: (branch: Branch) => void;
  onAddUser: (user: User) => void;
  onAssignBranchManager: (branchId: string, managerUserId: string) => void;
  labels: Label[];
  onAddLabel: (newLabel: Label) => void;
  onDeleteLabel: (labelId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  branches, users, theme, onAddBranch, onAddUser, onAssignBranchManager, labels, onAddLabel, onDeleteLabel,
}) => {
  const isDark = theme === 'dark';
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchSubCity, setNewBranchSubCity] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<User['role']>('Sales Agent');
  const [newUserBranchId, setNewUserBranchId] = useState(branches[0]?.id || 'b1');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#F59E0B');

  // Gemini API Key state
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const cardText = isDark ? 'text-zinc-100' : 'text-slate-900';
  const subText = isDark ? 'text-zinc-400' : 'text-slate-500';
  const primaryBtn = isDark ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-teal-700 hover:bg-teal-800 text-white';
  const inputBg = isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800';
  const rowBg = isDark ? 'bg-zinc-950/40 border-zinc-800/60' : 'bg-slate-50 border-slate-200';

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchSubCity.trim()) return;
    onAddBranch({ id: 'b_' + Date.now(), name: newBranchName, subCity: newBranchSubCity });
    setNewBranchName('');
    setNewBranchSubCity('');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    onAddUser({ id: 'u_' + Date.now(), name: newUserName, email: newUserEmail, role: newUserRole, branchId: newUserBranchId });
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleAddLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    onAddLabel({ id: 'l_' + Date.now(), name: newLabelName, color: newLabelColor, createdBy: 'u1' });
    setNewLabelName('');
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(apiKeyInput.trim());
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${cardBg}`}>
        <h2 className={`text-xl font-bold ${cardText}`}>Settings, Branches & AI Integration</h2>
        <p className={`text-sm mt-0.5 ${subText}`}>Configure branch offices, manage roles, labels, and configure your Gemini AI Assistant API key.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branches */}
        <div className={`p-6 rounded-2xl border ${cardBg} space-y-4`}>
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white">Branch Offices</h3>
          </div>
          <div className="space-y-2">
            {branches.map(b => {
              const manager = users.find(u => u.id === b.managerId);
              return (
                <div key={b.id} className={`p-3 ${rowBg} border rounded-xl space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white text-sm">{b.name}</span>
                      <span className={`text-xs ${subText} ml-1`}>({b.subCity})</span>
                    </div>
                    <span className="text-xs bg-amber-950/40 text-amber-300 px-2.5 py-0.5 rounded-full font-medium border border-amber-800/60">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-3 h-3 text-zinc-500" />
                    <span className="text-[10px] text-zinc-400">Manager:</span>
                    <select
                      value={b.managerId || ''}
                      onChange={(e) => onAssignBranchManager(b.id, e.target.value)}
                      className={`text-xs ${inputBg} border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-600`}
                    >
                      <option value="">None</option>
                      {users.filter(u => u.role === 'Branch Manager' || u.role === 'Admin').map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  {manager && (
                    <span className="text-[10px] text-emerald-400">✓ {manager.name}</span>
                  )}
                </div>
              );
            })}
          </div>
          <form onSubmit={handleCreateBranch} className="pt-3 border-t border-zinc-800/60 space-y-3">
            <label className="block text-xs font-bold uppercase text-zinc-400">Add New Branch</label>
            <div className="flex gap-2">
              <input type="text" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} placeholder="Branch Name" className={`flex-1 ${inputBg} border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
              <input type="text" value={newBranchSubCity} onChange={(e) => setNewBranchSubCity(e.target.value)} placeholder="Sub-city" className={`w-28 ${inputBg} border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
              <button type="submit" className={`px-3.5 py-2 ${primaryBtn} rounded-xl text-sm font-medium flex items-center gap-1`}><Plus className="w-4 h-4" /></button>
            </div>
          </form>
        </div>

        {/* Users & Roles */}
        <div className={`p-6 rounded-2xl border ${cardBg} space-y-4`}>
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
            <Shield className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white">Users & Access Roles</h3>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {users.map(u => {
              const branch = branches.find(b => b.id === u.branchId);
              return (
                <div key={u.id} className={`p-3 ${rowBg} border rounded-xl flex items-center justify-between text-xs`}>
                  <div>
                    <span className="font-bold text-white">{u.name}</span>
                    <span className={`${subText} ml-2`}>({u.email})</span>
                    <p className={`mt-0.5 ${subText}`}>Branch: {branch?.name || 'All'} • Role: <strong className="text-amber-300">{u.role}</strong></p>
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={handleCreateUser} className="pt-3 border-t border-zinc-800/60 space-y-3">
            <label className="block text-xs font-bold uppercase text-zinc-400">Add New Staff User</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Full Name" className={`${inputBg} border rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
              <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="email@ttmcrm.et" className={`${inputBg} border rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as any)} className={`${inputBg} border rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-600`}>
                <option value="Admin">Admin</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Sales Agent">Sales Agent</option>
              </select>
              <select value={newUserBranchId} onChange={(e) => setNewUserBranchId(e.target.value)} className={`${inputBg} border rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-600`}>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button type="submit" className={`w-full py-2.5 ${primaryBtn} rounded-xl text-xs font-medium flex items-center justify-center gap-1.5`}><UserPlus className="w-3.5 h-3.5" /> <span>Create User Account</span></button>
          </form>
        </div>

        {/* Gemini AI Assistant Configuration */}
        <div className={`p-6 rounded-2xl border ${cardBg} space-y-4`}>
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
            <Brain className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white">Gemini AI Assistant Configuration</h3>
          </div>
          <p className={`text-xs ${subText} leading-relaxed`}>
            Enable AI call summaries, follow-up recommendations, and sales forecasting by providing your Gemini API key.
          </p>
          <form onSubmit={handleSaveApiKey} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Gemini API Key</label>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter Gemini API Key..."
                  className={`w-full ${inputBg} border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600 font-mono`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              {apiKeySaved ? (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> API Key Saved Securely</span>
              ) : (
                <span className="text-[11px] text-zinc-500">Stored securely in local browser storage.</span>
              )}
              <button type="submit" className={`px-4 py-2 ${primaryBtn} rounded-xl text-xs font-semibold shadow-sm`}>Save API Key</button>
            </div>
          </form>
        </div>

        {/* Labels & Tags */}
        <div className={`p-6 rounded-2xl border ${cardBg} space-y-4`}>
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
            <Tag className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white">Labels & Tags (Admin)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {labels.map(l => (
              <span key={l.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: `${l.color}20`, color: l.color, borderColor: `${l.color}60` }}>
                {l.name}
                <button onClick={() => onDeleteLabel(l.id)} className="ml-1 text-current opacity-60 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddLabel} className="flex gap-2 pt-2 border-t border-zinc-800/60">
            <input type="text" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} placeholder="New label name" className={`flex-1 ${inputBg} border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600`} required />
            <input type="color" value={newLabelColor} onChange={(e) => setNewLabelColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border border-zinc-700 bg-transparent p-1" />
            <button type="submit" className={`px-4 py-2 ${primaryBtn} rounded-xl text-sm font-medium flex items-center gap-1`}><Plus className="w-4 h-4" /> <span>Add</span></button>
          </form>
        </div>
      </div>
    </div>
  );
};
