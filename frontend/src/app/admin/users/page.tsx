'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Users, Search, Ban, CheckCircle, AlertCircle } from 'lucide-react';

interface StudentUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    orders: number;
  };
}

export default function UsersManager() {
  const [users, setUsers] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve students list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: boolean, name: string) => {
    const actionStr = currentStatus ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${actionStr} student account "${name}"?`)) return;

    setError(null);
    setSuccess(null);
    try {
      const nextStatus = !currentStatus;
      await api.put(`/admin/users/${userId}/status`, { isActive: nextStatus });
      setSuccess(`Account "${name}" has been ${nextStatus ? 'activated' : 'suspended'}.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-100 dark:to-indigo-50 bg-clip-text text-transparent">
          Student Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Review student registrations, check completed payments, and moderate accounts.
        </p>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-450 rounded-xl text-sm font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-semibold">
          {success}
        </div>
      )}

      {/* Search Filter Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search students by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
        </div>
        <span className="text-xs font-bold text-slate-400 shrink-0">
          Showing {filteredUsers.length} of {users.length} Students
        </span>
      </div>

      {/* Users Grid/List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
          <Users className="mx-auto text-slate-400 dark:text-slate-600 mb-3" size={40} />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">No student users found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Wait for student registrations or inspect search terms.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600 dark:text-slate-400">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800/85 text-slate-400 uppercase tracking-wider text-2xs bg-slate-50/50 dark:bg-slate-900/80">
                  <th className="p-4">Student Details</th>
                  <th className="p-4">Registrations Date</th>
                  <th className="p-4">Enrollments Count</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Moderator Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40">
                    {/* User Contacts */}
                    <td className="p-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">{u.name}</span>
                      <div className="flex gap-2.5 items-center text-3xs text-slate-400 mt-0.5">
                        {u.email && <span>{u.email}</span>}
                        {u.email && u.phone && <span>•</span>}
                        {u.phone && <span>{u.phone}</span>}
                      </div>
                    </td>
                    <td className="p-4">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full text-indigo-600 dark:text-indigo-400 font-extrabold">
                        {u._count.orders} Purchased
                      </span>
                    </td>
                    {/* Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase ${
                        u.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                          : 'bg-rose-50 dark:bg-rose-955/20 text-rose-600'
                      }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    {/* Ban toggle buttons */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.isActive, u.name)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-3xs font-bold transition-colors ${
                          u.isActive
                            ? 'bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 text-rose-600'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {u.isActive ? <Ban size={12} /> : <CheckCircle size={12} />}
                        {u.isActive ? 'Suspend User' : 'Activate User'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
