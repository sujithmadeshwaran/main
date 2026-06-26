'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { CreditCard, FileText, Search, RefreshCcw, AlertCircle, CheckCircle } from 'lucide-react';

interface Invoice {
  invoiceNumber: string;
  pdfUrl: string | null;
}

interface Order {
  id: string;
  createdAt: string;
  amount: number;
  tax: number;
  status: string;
  currency: string;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  user: { name: string; email: string };
  course: { title: string };
  invoice: Invoice | null;
}

export default function PaymentsManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/payments/transactions');
      setOrders(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch transactions list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleRefund = async (orderId: string, amount: number, studentName: string) => {
    if (!confirm(`Are you sure you want to refund ₹${amount} to student "${studentName}"?`)) return;
    setError(null);
    setSuccess(null);

    try {
      await api.post(`/payments/refund/${orderId}`);
      setSuccess(`Refund for student "${studentName}" processed successfully.`);
      fetchTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Refund failed.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const term = search.toLowerCase();
    return (
      o.user.name.toLowerCase().includes(term) ||
      o.course.title.toLowerCase().includes(term) ||
      (o.invoice && o.invoice.invoiceNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-100 dark:to-indigo-50 bg-clip-text text-transparent">
          Payment Transactions
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Monitor payments, view GST invoices, and process manual refund requests.
        </p>
      </div>

      {/* Alerts */}
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

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search payments by student, course, or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
        </div>
        <span className="text-xs font-bold text-slate-400 shrink-0">
          Showing {filteredOrders.length} of {orders.length} Transactions
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
          <CreditCard className="mx-auto text-slate-400 dark:text-slate-600 mb-3" size={40} />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">No transactions recorded</h3>
          <p className="text-slate-555 dark:text-slate-400 text-sm mt-1">Wait for storefront enrollments.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600 dark:text-slate-400">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800/85 text-slate-400 uppercase tracking-wider text-2xs bg-slate-50/50 dark:bg-slate-900/80">
                  <th className="p-4">Student & Course</th>
                  <th className="p-4">Invoice Reference</th>
                  <th className="p-4">Paid Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Moderator Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40">
                    {/* Student/Course */}
                    <td className="p-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">{o.user.name}</span>
                      <span className="text-3xs text-slate-450 dark:text-slate-500">{o.course.title}</span>
                    </td>
                    
                    {/* Invoice */}
                    <td className="p-4">
                      {o.invoice ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-700 dark:text-slate-350">{o.invoice.invoiceNumber}</span>
                          {o.invoice.pdfUrl && (
                            <a
                              href={`http://localhost:5000${o.invoice.pdfUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-3xs text-indigo-500 font-bold hover:underline flex items-center gap-1"
                            >
                              <FileText size={10} />
                              Download PDF
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">None</span>
                      )}
                    </td>

                    {/* Cost */}
                    <td className="p-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
                        ₹{o.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-3xs text-slate-400">GST components: ₹{o.tax.toLocaleString('en-IN')}</span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase ${
                        o.status === 'COMPLETED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                          : o.status === 'PENDING'
                          ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-600'
                          : 'bg-rose-50 dark:bg-rose-955/20 text-rose-600'
                      }`}>
                        {o.status}
                      </span>
                    </td>

                    {/* Refund Actions */}
                    <td className="p-4 text-right">
                      {o.status === 'COMPLETED' ? (
                        <button
                          onClick={() => handleRefund(o.id, o.amount, o.user.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-600 rounded-lg text-3xs font-bold transition-colors"
                        >
                          <RefreshCcw size={12} />
                          Issue Refund
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">No actions</span>
                      )}
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
