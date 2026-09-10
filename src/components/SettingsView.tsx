import React, { useState } from 'react';
import { Branch, User } from '../types/crm';
import { Settings, Building2, Shield, Plus, UserPlus } from 'lucide-react';

interface SettingsViewProps {
  branches: Branch[];
  users: User[];
  onAddBranch: (branch: Branch) => void;
  onAddUser: (user: User) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  branches,
  users,
  onAddBranch,
  onAddUser,
}) => {
  const [newBranchName, setNewBranchName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<User['role']>('Sales Agent');
  const [newUserBranchId, setNewUserBranchId] = useState(branches[0]?.id || 'b1');

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    const newBranch: Branch = {
      id: 'b_' + Date.now(),
      name: newBranchName,
    };
    onAddBranch(newBranch);
    setNewBranchName('');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUser: User = {
      id: 'u_' + Date.now(),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      branchId: newUserBranchId,
    };
    onAddUser(newUser);
    setNewUserName('');
    setNewUserEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Settings, Branches & User Roles</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure operational branch offices and manage role-based access control (Admin, Branch Manager, Sales Agent).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branches Management */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-slate-900">Branch Offices</h3>
          </div>

          <div className="space-y-2">
            {branches.map(b => (
              <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">{b.name}</span>
                <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-medium">Active Branch</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateBranch} className="pt-3 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Add New Branch</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="e.g. Gerji Branch"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </form>
        </div>

        {/* Users & Roles Management */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-slate-900">Users & Access Roles</h3>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {users.map(u => {
              const branch = branches.find(b => b.id === u.branchId);
              return (
                <div key={u.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{u.name}</span>
                    <span className="text-slate-500 ml-2">({u.email})</span>
                    <p className="text-slate-500 mt-0.5">Branch: {branch?.name || 'All'} • Role: <strong className="text-teal-700">{u.role}</strong></p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleCreateUser} className="pt-3 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Add New Staff User</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Full Name"
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="email@ttmcrm.et"
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="Admin">Admin</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Sales Agent">Sales Agent</option>
              </select>
              <select
                value={newUserBranchId}
                onChange={(e) => setNewUserBranchId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create User Account</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
