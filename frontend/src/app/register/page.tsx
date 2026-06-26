'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function RegisterPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Form validations
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Please provide at least email or mobile number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name,
        password,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined
      };

      const res = await api.post('/auth/register', payload);
      setSuccess(`${res.data.message || 'Registration successful!'} Redirecting to login in 3 seconds...`);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md bg-white/40 dark:bg-slate-900/40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-extrabold text-base">
            SF
          </div>
          <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
            SkillForge
          </span>
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-500/5 dark:bg-pink-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/20 dark:shadow-none space-y-6 relative">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} fill="currentColor" />
              Join the Academy
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Create Your Account</h2>
            <p className="text-slate-550 dark:text-slate-400 text-sm">
              Register to access premium engineering curriculums.
            </p>
          </div>

          {/* Feedback */}
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-450 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input: Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={loading || success !== null}
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-650 text-sm transition-all"
                />
                <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
              </div>
            </div>

            {/* Input: Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Email Address <span className="text-[10px] text-slate-450 lowercase italic">(optional if phone provided)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled={loading || success !== null}
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-650 text-sm transition-all"
                />
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
              </div>
            </div>

            {/* Input: Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Mobile Number <span className="text-[10px] text-slate-450 lowercase italic">(optional if email provided)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  disabled={loading || success !== null}
                  placeholder="9999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-650 text-sm transition-all"
                />
                <Phone className="absolute left-3.5 top-3 text-slate-400" size={16} />
              </div>
            </div>

            {/* Input: Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading || success !== null}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-650 text-sm transition-all"
                  />
                  <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Confirm
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading || success !== null}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-650 text-sm transition-all"
                  />
                  <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success !== null}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-indigo-650/15 flex items-center justify-center gap-2 group transition-all text-sm mt-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Creating Account...
                </>
              ) : (
                <>
                  Register
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Navigation to Login */}
          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-850">
            <span className="text-xs font-medium text-slate-450 dark:text-slate-500">Already have an account? </span>
            <Link
              href="/login"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200/50 dark:border-slate-800/50 text-center text-[10px] text-slate-400 dark:text-slate-500">
        SkillForge Security Layer v1.0. All connections are SSL encrypted.
      </footer>
    </div>
  );
}
