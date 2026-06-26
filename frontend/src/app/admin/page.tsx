'use client';

import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  TrendingUp, 
  Users, 
  Award, 
  Activity, 
  ShoppingBag,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  totalRevenue: number;
  certificatesIssued: number;
  activeUsers: number;
}

interface CourseSale {
  id: string;
  title: string;
  salesCount: number;
  revenue: number;
}

interface Order {
  id: string;
  createdAt: string;
  amount: number;
  status: string;
  user: { name: string; email: string };
  course: { title: string };
}

export default function AdminDashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [courseSales, setCourseSales] = useState<CourseSale[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/admin/analytics');
        setStats(response.data.stats);
        setCourseSales(response.data.courseSales);
        setRecentOrders(response.data.recentOrders);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-semibold">Aggregating system analytics...</p>
      </div>
    );
  }

  // Define some mockup data for drawing our premium SVG Sales Chart
  const salesHistory = [4000, 8000, 15000, 22000, 31000, stats.totalRevenue];
  const maxSale = Math.max(...salesHistory) || 10000;
  const chartHeight = 160;
  const chartWidth = 500;
  
  // Convert sales numbers to points for SVG Polyline
  const points = salesHistory.map((val, idx) => {
    const x = (idx / (salesHistory.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxSale) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-100 dark:to-indigo-50 bg-clip-text text-transparent">
          System Analytics
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Real-time updates on active enrollments, course completions and gross revenue.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Rev */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-2xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-150 mt-0.5 block">
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Users */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <span className="text-2xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Registered Students</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-150 mt-0.5 block">
              {stats.totalUsers.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Certificates */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <span className="text-2xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Completed Courses</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-150 mt-0.5 block">
              {stats.certificatesIssued.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Active sessions */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-pink-50 dark:bg-pink-950/20 text-pink-500 rounded-xl">
            <Activity size={24} />
          </div>
          <div>
            <span className="text-2xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Active Sessions</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-150 mt-0.5 block">
              {stats.activeUsers.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Chart + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart Card */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Sales Growth (Last 6 Months)</h3>
            <p className="text-2xs text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">Gross revenue cumulative overview</p>
          </div>
          
          {/* Pure SVG Line Chart */}
          <div className="relative pt-4 w-full aspect-[5/2]">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              {/* Grids */}
              <line x1="0" y1="10" x2={chartWidth} y2="10" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
              <line x1="0" y1="50" x2={chartWidth} y2="50" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
              <line x1="0" y1="90" x2={chartWidth} y2="90" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
              <line x1="0" y1="130" x2={chartWidth} y2="130" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
              
              {/* Polyline line */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              
              {/* Circles on Nodes */}
              {salesHistory.map((val, idx) => {
                const x = (idx / (salesHistory.length - 1)) * chartWidth;
                const y = chartHeight - (val / maxSale) * (chartHeight - 20) - 10;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="5"
                    className="fill-indigo-600 stroke-white dark:stroke-slate-900"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Leaderboard Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Top Sales Leaderboard</h3>
            <p className="text-2xs text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider mb-4">Ranked by gross revenue</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto max-h-52 pr-1 space-y-2">
            {courseSales.slice(0, 3).map((item, idx) => (
              <div key={item.id} className="pt-2 pb-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 truncate">
                  <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-sm truncate text-slate-700 dark:text-slate-350">{item.title}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    ₹{item.revenue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-2xs text-slate-400">{item.salesCount} sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Recent Transactions Log</h3>
          <p className="text-2xs text-slate-455 dark:text-slate-500 font-semibold uppercase tracking-wider">Latest storefront payment requests</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600 dark:text-slate-400">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 uppercase tracking-wider text-2xs">
                <th className="pb-3">Buyer Student</th>
                <th className="pb-3">Course Item</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                  <td className="py-3.5 pr-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{ord.user.name}</span>
                    <span className="text-3xs text-slate-400">{ord.user.email}</span>
                  </td>
                  <td className="py-3.5 pr-2 truncate max-w-xs">{ord.course.title}</td>
                  <td className="py-3.5">{new Date(ord.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200">
                    ₹{ord.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase ${
                      ord.status === 'COMPLETED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                        : ord.status === 'PENDING'
                        ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-600'
                        : 'bg-rose-50 dark:bg-rose-955/20 text-rose-600'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
