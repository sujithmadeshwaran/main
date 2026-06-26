'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { 
  BookOpen, 
  Award, 
  FileText, 
  Play, 
  CheckCircle, 
  Calendar, 
  ArrowRight, 
  LogOut, 
  Sun, 
  Moon, 
  RefreshCw, 
  FileBadge, 
  Clock, 
  GraduationCap,
  Download,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface PurchasedCourse {
  orderId: string;
  amount: number;
  createdAt: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    pdfUrl: string;
  } | null;
  course: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    thumbnail: string | null;
    instructorName: string;
    duration: number;
  };
  progress: {
    totalLessons: number;
    completedCount: number;
    percentage: number;
  };
  certificate: {
    id: string;
    certificateId: string;
    verificationToken: string;
    qrCodeUrl: string | null;
    issueDate: string;
  } | null;
}

export default function StudentDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'certificates' | 'orders'>('courses');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // For generating certificate spinner

  const backendUrl = process.env.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
    : 'http://localhost:5000';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchPurchasedCourses = async () => {
    try {
      setError(null);
      const response = await api.get('/student/purchased-courses');
      setPurchasedCourses(response.data);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load purchased courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPurchasedCourses();
    }
  }, [user]);

  const handleGenerateCertificate = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      await api.post('/certificates/generate', { courseId });
      await fetchPurchasedCourses(); // Refresh dashboard list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate certificate. Please complete the course first.');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-55 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-semibold">Loading Student Hub...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Calculate statistics
  const enrolledCount = purchasedCourses.length;
  const completedCount = purchasedCourses.filter(c => c.progress.percentage === 100).length;
  const certificatesCount = purchasedCourses.filter(c => c.certificate !== null).length;
  
  // Total lessons progress count across all courses
  const totalCompletedLessons = purchasedCourses.reduce((sum, c) => sum + c.progress.completedCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Dashboard Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-base">
                SF
              </div>
              <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
                SkillForge
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={logout}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center gap-2 text-slate-700 dark:text-slate-300"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
        
        {/* Welcome and Greeting Banner */}
        <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-indigo-650 to-purple-800 dark:from-indigo-900 dark:to-slate-900 text-white shadow-xl shadow-indigo-500/10">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold uppercase tracking-wider">
                <GraduationCap size={14} />
                Student Hub
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Welcome back, {user.name}! 🚀
              </h1>
              <p className="text-indigo-100 max-w-lg font-medium">
                Keep up the momentum. You have completed <span className="font-extrabold text-white">{totalCompletedLessons}</span> lessons so far. Let's finish that next module!
              </p>
            </div>
            <div>
              <Link
                href="/#catalog"
                className="bg-white hover:bg-slate-50 text-indigo-700 font-extrabold px-6 py-3 rounded-2xl shadow-lg transition-all text-sm inline-flex items-center gap-2"
              >
                Browse Catalog
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <BookOpen size={24} />
            </div>
            <div>
              <span className="block text-2xl font-extrabold text-slate-800 dark:text-slate-100">{enrolledCount}</span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Enrolled Courses</span>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <span className="block text-2xl font-extrabold text-slate-800 dark:text-slate-100">{completedCount}</span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed (100%)</span>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Award size={24} />
            </div>
            <div>
              <span className="block text-2xl font-extrabold text-slate-800 dark:text-slate-100">{certificatesCount}</span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Certificates Earned</span>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <span className="block text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                {purchasedCourses.reduce((sum, item) => sum + item.course.duration, 0).toFixed(1)} hrs
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Video Hours</span>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('courses')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'courses'
                ? 'border-indigo-650 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            My Enrolled Courses
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'certificates'
                ? 'border-indigo-650 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Certificates of Completion
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-indigo-650 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Billing & Invoices
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-450 rounded-2xl text-sm font-semibold flex items-center gap-2">
            <span>⚠️ {error}</span>
            <button onClick={fetchPurchasedCourses} className="underline text-xs ml-auto">Retry</button>
          </div>
        )}

        {/* Tab Panels */}
        <div className="pt-2">
          
          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              {purchasedCourses.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-3xl space-y-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <BookOpen size={28} />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-bold text-lg">No Enrolled Courses</h3>
                    <p className="text-slate-500 dark:text-slate-450 text-sm">
                      Get started by purchasing one of our top-tier programming or database engineering curriculums.
                    </p>
                  </div>
                  <Link
                    href="/#catalog"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md text-sm inline-block"
                  >
                    Explore Course Catalog
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {purchasedCourses.map((enrollment) => {
                    const course = enrollment.course;
                    const progress = enrollment.progress;
                    const isCompleted = progress.percentage === 100;

                    return (
                      <div 
                        key={enrollment.orderId}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:shadow-lg transition-all"
                      >
                        {/* Course Thumbnail */}
                        <div className="h-44 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center text-slate-400">
                          {course.thumbnail ? (
                            <img 
                              src={course.thumbnail.startsWith('data:') ? course.thumbnail : `${backendUrl}${course.thumbnail}`}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen size={48} />
                          )}
                          
                          {/* Completion Badge */}
                          {isCompleted && (
                            <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                              <CheckCircle size={12} />
                              Completed
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-500 dark:text-indigo-400 block">
                              By {course.instructorName}
                            </span>
                            <h3 className="font-extrabold text-lg line-clamp-2 leading-tight">
                              {course.title}
                            </h3>
                            {course.subtitle && (
                              <p className="text-slate-400 dark:text-slate-500 text-xs line-clamp-1">
                                {course.subtitle}
                              </p>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-450">
                              <span>{progress.completedCount} / {progress.totalLessons} Lessons</span>
                              <span>{progress.percentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${progress.percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="pt-2 flex flex-col gap-2">
                            <Link
                              href={`/courses/${course.slug}/learn`}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-center text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10"
                            >
                              <Play size={14} fill="currentColor" />
                              {progress.percentage > 0 ? 'Continue learning' : 'Start Course'}
                            </Link>

                            {isCompleted && (
                              enrollment.certificate ? (
                                <a
                                  href={`${backendUrl}${enrollment.certificate.qrCodeUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold py-2.5 rounded-xl text-center text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-center gap-2"
                                >
                                  <Award size={14} />
                                  Download Certificate
                                </a>
                              ) : (
                                <button
                                  onClick={() => handleGenerateCertificate(course.id)}
                                  disabled={actionLoading === course.id}
                                  className="border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-450 font-bold py-2.5 rounded-xl text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/10 transition-all flex items-center justify-center gap-2"
                                >
                                  {actionLoading === course.id ? (
                                    <>
                                      <RefreshCw size={14} className="animate-spin" />
                                      Issuing...
                                    </>
                                  ) : (
                                    <>
                                      <Award size={14} />
                                      Generate Certificate
                                    </>
                                  )}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              {purchasedCourses.filter(c => c.progress.percentage === 100).length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-3xl space-y-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Award size={28} />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-bold text-lg">No Certificates Earned Yet</h3>
                    <p className="text-slate-500 dark:text-slate-450 text-sm">
                      Complete 100% of the lessons in any course to instantly generate and unlock your PDF Certificate of Completion.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {purchasedCourses.filter(c => c.progress.percentage === 100).map((enrollment) => {
                    const course = enrollment.course;
                    const certificate = enrollment.certificate;

                    return (
                      <div 
                        key={enrollment.orderId}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col justify-between gap-6 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl block">
                                <FileBadge size={20} />
                              </span>
                              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                Verification Available
                              </span>
                            </div>
                            <h3 className="font-extrabold text-xl leading-snug">{course.title}</h3>
                            <p className="text-xs text-slate-500">Instructor: {course.instructorName}</p>
                          </div>
                          
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl animate-pulse shrink-0">
                            <Award size={28} />
                          </div>
                        </div>

                        {certificate ? (
                          <div className="space-y-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Certificate ID:</span>
                                <span className="font-bold font-mono">{certificate.certificateId}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Issued On:</span>
                                <span className="font-semibold">{new Date(certificate.issueDate).toLocaleDateString('en-IN')}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2">
                              <a
                                href={`${backendUrl}${certificate.qrCodeUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-center text-sm transition-all flex items-center justify-center gap-2 shadow-md"
                              >
                                <Download size={14} />
                                Download PDF
                              </a>
                              <Link
                                href={`/verify-certificate/${certificate.verificationToken}`}
                                className="flex-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-center text-sm transition-all flex items-center justify-center gap-2"
                              >
                                <ShieldCheck size={14} />
                                Verify Online
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-450">
                              <CheckCircle size={14} />
                              100% Course Completed!
                            </div>
                            <button
                              onClick={() => handleGenerateCertificate(course.id)}
                              disabled={actionLoading === course.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 shadow-md shrink-0"
                            >
                              {actionLoading === course.id ? (
                                <>
                                  <RefreshCw size={14} className="animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  Generate Certificate
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Orders/Invoices Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {purchasedCourses.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-3xl space-y-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <FileText size={28} />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-bold text-lg">No Invoices</h3>
                    <p className="text-slate-500 dark:text-slate-450 text-sm">
                      Purchase receipts with GST breakdown will populate here once you buy a course.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                          <th className="py-4 px-6">Purchase Date</th>
                          <th className="py-4 px-6">Course Name</th>
                          <th className="py-4 px-6">GST Amount (18%)</th>
                          <th className="py-4 px-6">Total Paid</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-850 text-sm">
                        {purchasedCourses.map((enrollment) => {
                          const date = new Date(enrollment.createdAt);
                          const total = enrollment.amount;
                          // GST inclusive 18% calculation
                          const base = parseFloat((total / 1.18).toFixed(2));
                          const gst = parseFloat((total - base).toFixed(2));

                          return (
                            <tr key={enrollment.orderId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                              <td className="py-4 px-6 whitespace-nowrap font-medium text-slate-500 dark:text-slate-450">
                                {date.toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                              <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                                {enrollment.course.title}
                              </td>
                              <td className="py-4 px-6 text-slate-650 dark:text-slate-400">
                                ₹{gst.toLocaleString('en-IN')}
                              </td>
                              <td className="py-4 px-6 font-extrabold text-slate-850 dark:text-slate-200">
                                ₹{total.toLocaleString('en-IN')}
                              </td>
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-800">
                                  Paid
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                {enrollment.invoice ? (
                                  <a
                                    href={`${backendUrl}${enrollment.invoice.pdfUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                  >
                                    <FileText size={13} />
                                    Download GST PDF
                                    <ExternalLink size={10} />
                                  </a>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Not available</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-16 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
        © {new Date().getFullYear()} SkillForge Academy. All Rights Reserved. Compliant with Central & State GST guidelines.
      </footer>
    </div>
  );
}
