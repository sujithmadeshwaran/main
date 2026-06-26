'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import { 
  Search, 
  BookOpen, 
  ArrowRight, 
  Star, 
  User, 
  CheckCircle, 
  Globe, 
  Award,
  Sparkles,
  Sun,
  Moon,
  Clock,
  Code
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  price: number;
  discount: number;
  difficulty: string;
  duration: number;
  instructorName: string;
  categoryName: string;
  avgRating: number;
  reviewCount: number;
  totalLessons: number;
  thumbnail: string | null;
}

interface Category {
  id: string;
  name: string;
}

export default function StorefrontLanding() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  useEffect(() => {
    const loadStorefrontData = async () => {
      try {
        const [coursesRes, catsRes] = await Promise.all([
          api.get('/courses'),
          api.get('/courses/categories')
        ]);
        setCourses(coursesRes.data);
        setCategories(catsRes.data);
      } catch (err) {
        console.error('Failed to load storefront data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStorefrontData();
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      
      const response = await api.get('/courses', { params });
      setCourses(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (catId: string) => {
    setLoading(true);
    const nextCat = selectedCategory === catId ? '' : catId;
    setSelectedCategory(nextCat);
    
    try {
      const params: any = {};
      if (search) params.search = search;
      if (nextCat) params.category = nextCat;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;

      const response = await api.get('/courses', { params });
      setCourses(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Banner Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
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

          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search courses, instructors, technologies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-full bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
          </form>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-md shadow-indigo-600/15"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900/40 dark:to-slate-950">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/10 dark:bg-pink-500/20 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} />
            Unlock Unlimited Tech Growth
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Learn From Industry Experts on{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              SkillForge
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Acquire developer skills, certification and real project capabilities in programming, infrastructure, and databases.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <a
              href="#catalog"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 group transition-all"
            >
              Browse Catalog
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <Link
              href="/register"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold px-6 py-3 rounded-xl transition-all"
            >
              Join Free
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="border-y border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <span className="block text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">10,000+</span>
            <span className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-1 block">Active Learners</span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">250+</span>
            <span className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-1 block">HD Curriculums</span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">99.8%</span>
            <span className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-1 block">Satisfaction Score</span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">100%</span>
            <span className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-1 block">Verified Certifications</span>
          </div>
        </div>
      </section>

      {/* Catalog & Filter Section */}
      <section id="catalog" className="flex-1 py-16 px-6 max-w-7xl w-full mx-auto space-y-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Explore Curriculums
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Choose structured learning paths and earn verifiable certifications.
          </p>
        </div>

        {/* Filters Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Categories Horizontal scrolling list */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => handleCategorySelect('')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border ${
                selectedCategory === ''
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Difficulty Dropdown */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 shrink-0">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none dark:text-slate-100"
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10"
            >
              Apply Filter
            </button>
          </form>
        </div>

        {/* Dynamic Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"></div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <BookOpen className="mx-auto text-slate-400 dark:text-slate-600 mb-3" size={44} />
            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-350">No courses match criteria</h3>
            <p className="text-slate-400 text-sm mt-1">Try updating your filters or search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Course Image */}
                <div className="relative h-44 bg-slate-100 dark:bg-slate-950">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail.startsWith('/uploads/') ? `http://localhost:5000${course.thumbnail}` : course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                      <Code size={40} />
                    </div>
                  )}

                  {/* Level Badge */}
                  <span className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-md text-white text-3xs font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
                    {course.difficulty}
                  </span>
                </div>

                {/* Course Metadata */}
                <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      {course.categoryName}
                    </span>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1 mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                      By {course.instructorName}
                    </p>

                    <div className="flex items-center gap-3 text-2xs font-semibold text-slate-400 mt-4">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {course.duration} Hours
                      </span>
                      <span>•</span>
                      <span>{course.totalLessons} Lessons</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    {course.avgRating > 0 ? (
                      <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                        <Star size={14} fill="currentColor" />
                        <span>{course.avgRating}</span>
                        <span className="text-2xs text-slate-400 font-medium">({course.reviewCount})</span>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-2xs font-bold">New Course</div>
                    )}

                    <div className="flex flex-col text-right">
                      {course.discount > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 text-2xs line-through">
                          ₹{Math.round(course.price * (1 + course.discount / 100)).toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="font-extrabold text-base text-indigo-600 dark:text-indigo-400">
                        {course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'Free'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer Section */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-855 bg-white dark:bg-slate-900/60 py-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-600 dark:text-slate-400 text-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs">
                SF
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">SkillForge LMS</span>
            </div>
            <p className="text-xs">
              SkillForge LMS delivers premium online tech education, quizzes, and instant downloadable Indian GST-ready compliant certifications.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-850 dark:text-slate-200">Student Features</h4>
            <ul className="space-y-1 text-xs">
              <li>Course Dashboard</li>
              <li>PDF Invoice Download</li>
              <li>Syllabus Playback Tracker</li>
              <li>Mock Gateway Payments</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-850 dark:text-slate-200">Legal & Support</h4>
            <ul className="space-y-1 text-xs">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Contact Support</li>
              <li>Verify Certificate</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 text-center text-2xs text-slate-400">
          © {new Date().getFullYear()} SkillForge LMS. All rights reserved. Time Zone: Asia/Kolkata.
        </div>
      </footer>
    </div>
  );
}
