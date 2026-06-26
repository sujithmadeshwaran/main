'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';
import { ShieldCheck, ShieldAlert, Award, Calendar, BookmarkCheck } from 'lucide-react';
import Link from 'next/link';

interface VerificationResult {
  valid: boolean;
  certificateId?: string;
  studentName?: string;
  courseTitle?: string;
  issueDate?: string;
  message?: string;
}

export default function CertificateVerificationPage() {
  const { token } = useParams();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await api.get(`/certificates/verify/${token}`);
        setResult(response.data);
      } catch (err: any) {
        console.error(err);
        setResult({
          valid: false,
          message: err.response?.data?.message || 'Verification failed. Credential not found.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 font-semibold">Verifying training credential...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-6">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
        
        {/* Logo / Brand */}
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs">
            SF
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">SkillForge Academy</span>
        </Link>

        {result?.valid ? (
          // SUCCESS PANEL
          <div className="space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
              <ShieldCheck size={48} />
            </div>

            <div className="space-y-2">
              <span className="text-emerald-500 font-extrabold text-xs uppercase tracking-widest block">
                Verified SkillForge Credential
              </span>
              <h2 className="text-2xl font-extrabold text-slate-850 dark:text-slate-100">
                Credential Authentic
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                This certificate completed all verification audits successfully.
              </p>
            </div>

            {/* Credential Data Table */}
            <div className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 text-left space-y-3.5">
              <div className="flex flex-col">
                <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Recipient Student</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                  {result.studentName}
                </span>
              </div>
              
              <div className="flex flex-col border-t border-slate-100 dark:border-slate-850 pt-3">
                <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Course Syllabus Completed</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 flex items-center gap-1.5">
                  <Award size={15} className="text-indigo-500 shrink-0" />
                  {result.courseTitle}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850 pt-3">
                <div className="flex flex-col">
                  <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Completion Date</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs mt-0.5 flex items-center gap-1">
                    <Calendar size={13} />
                    {result.issueDate ? new Date(result.issueDate).toLocaleDateString('en-IN') : ''}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Certificate ID</span>
                  <span className="font-bold text-slate-750 dark:text-slate-350 text-xs mt-0.5 flex items-center gap-1">
                    <BookmarkCheck size={13} />
                    {result.certificateId}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-3xs text-slate-400 mt-4 leading-relaxed">
              SkillForge Academy verifies that the recipient completed all syllabus modules and parsed grading examinations under strict integrity terms.
            </p>
          </div>
        ) : (
          // FAILURE PANEL
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-500">
              <ShieldAlert size={36} />
            </div>

            <div className="space-y-2">
              <span className="text-rose-500 font-extrabold text-xs uppercase tracking-widest block">
                Unverified Credential
              </span>
              <h2 className="text-xl font-bold text-slate-850 dark:text-slate-150">
                Invalid Certificate Reference
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
                {result?.message || 'This certificate verification token is invalid, has expired, or the credential was revoked by the board authority.'}
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/"
            className="inline-flex justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/10"
          >
            Home Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
