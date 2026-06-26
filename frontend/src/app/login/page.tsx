'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Mail, 
  Lock, 
  Phone, 
  KeyRound, 
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

export default function LoginPage() {
  const { user, loginWithPassword, requestOTPCode, verifyOTPCode, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const expired = searchParams.get('expired') === 'true';

  // Form Mode: 'password' or 'otp'
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  
  // Fields
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push(user.role === 'ADMIN' ? '/admin' : redirect);
    }
  }, [user, router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!emailOrPhone.trim()) {
      setError('Please enter your email address or phone number.');
      return;
    }

    try {
      if (mode === 'password') {
        if (!password) {
          setError('Please enter your password.');
          return;
        }
        await loginWithPassword(emailOrPhone, password);
      } else {
        // OTP Mode
        if (!otpRequested) {
          await requestOTPCode(emailOrPhone);
          setOtpRequested(true);
          setSuccess('A verification code has been dispatched. Check console/terminal logs!');
        } else {
          if (!otpCode) {
            setError('Please enter the 6-digit OTP code.');
            return;
          }
          await verifyOTPCode(emailOrPhone, otpCode);
        }
      }
    } catch (err: any) {
      setError(err || 'An unexpected authentication error occurred.');
    }
  };

  const handleResetOTP = () => {
    setOtpRequested(false);
    setOtpCode('');
    setError(null);
    setSuccess(null);
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

      {/* Main card panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-500/5 dark:bg-pink-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/20 dark:shadow-none space-y-6 relative">
          
          {/* Form Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} fill="currentColor" />
              Secure Gateway
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Sign In to SkillForge</h2>
            <p className="text-slate-550 dark:text-slate-400 text-sm">
              Enter your credentials or use dynamic OTP validation.
            </p>
          </div>

          {/* Feedback banners */}
          {expired && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-255 dark:border-amber-900 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>Your session has expired. Please log in again to continue.</span>
            </div>
          )}

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

          {/* Mode Selector */}
          {!otpRequested && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => { setMode('password'); setError(null); }}
                className={`py-2 rounded-lg text-center transition-all ${
                  mode === 'password'
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => { setMode('otp'); setError(null); }}
                className={`py-2 rounded-lg text-center transition-all ${
                  mode === 'otp'
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                OTP Verification
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input: Email/Phone */}
            {!otpRequested && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={loading}
                    placeholder={mode === 'password' ? 'student@skillforge.com or 9999999999' : 'student@skillforge.com or 9999999999'}
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm transition-all"
                  />
                  {emailOrPhone.includes('@') || !emailOrPhone ? (
                    <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  ) : (
                    <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  )}
                </div>
              </div>
            )}

            {/* Input: Password (for password mode) */}
            {mode === 'password' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Security Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm transition-all"
                  />
                  <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Input: OTP Code (for OTP mode, after request) */}
            {mode === 'otp' && otpRequested && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl space-y-1">
                  <p className="text-xs text-slate-450 dark:text-slate-500">Target Address:</p>
                  <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{emailOrPhone}</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      disabled={loading}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm tracking-[0.25em] font-extrabold text-center"
                    />
                    <KeyRound className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetOTP}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  Change email/number
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-indigo-650/15 flex items-center justify-center gap-2 group transition-all text-sm mt-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Authenticating...
                </>
              ) : (
                <>
                  {mode === 'otp' && !otpRequested ? 'Request Validation Code' : 'Secure Login'}
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Navigation to Register */}
          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-850">
            <span className="text-xs font-medium text-slate-450 dark:text-slate-500">Don't have an account? </span>
            <Link
              href="/register"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Create Account
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
