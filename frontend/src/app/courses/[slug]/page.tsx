'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Globe, 
  Award, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  FileText,
  Bookmark,
  X
} from 'lucide-react';
import Link from 'next/link';

interface Lesson {
  id: string;
  title: string;
  sortOrder: number;
  videoDuration: number;
  isFreePreview: boolean;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string;
  };
}

interface CourseDetails {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  price: number;
  discount: number;
  duration: number;
  difficulty: string;
  language: string;
  thumbnail: string | null;
  previewVideo: string | null;
  instructorName: string;
  instructorBio: string | null;
  avgRating: number;
  reviewCount: number;
  modules: Module[];
  reviews: Review[];
}

export default function CourseStorefrontDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  
  // Preview modal video player
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await api.get(`/courses/${slug}`);
        setCourse(response.data);
        if (response.data.modules.length > 0) {
          setExpandedModule(response.data.modules[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCourseDetails();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 font-semibold">Loading course metadata...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-500 font-bold dark:bg-slate-950">
        Course curriculum details not found.
      </div>
    );
  }

  const handleEnrollClick = () => {
    if (!user) {
      router.push(`/login?redirect=/courses/${course.slug}`);
      return;
    }
    
    // Redirect to checkout page
    router.push(`/checkout/${course.id}`);
  };

  const toggleModule = (id: string) => {
    setExpandedModule(expandedModule === id ? null : id);
  };

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Banner */}
      <section className="bg-slate-900 text-white py-12 px-6 border-b border-slate-800 relative">
        <div className="max-w-6xl mx-auto flex flex-col md:w-2/3 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider mb-2"
          >
            <ArrowLeft size={14} />
            Back to Catalog
          </Link>
          
          <span className="inline-block bg-indigo-600/60 border border-indigo-500/50 text-white text-3xs font-extrabold uppercase px-2.5 py-1 rounded-full w-fit">
            {course.difficulty}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            {course.title}
          </h1>
          {course.subtitle && (
            <p className="text-slate-350 text-base md:text-lg max-w-3xl">
              {course.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-2">
            {course.avgRating > 0 ? (
              <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                <span>★ {course.avgRating}</span>
                <span className="text-slate-400 font-normal">({course.reviewCount} Ratings)</span>
              </div>
            ) : (
              <span className="text-slate-400">No ratings yet</span>
            )}
            <span>•</span>
            <span>Created by {course.instructorName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe size={13} />
              {course.language}
            </span>
          </div>
        </div>
      </section>

      {/* Main Details Body */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left column details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Course Syllabus Overview</h2>
            <div className="text-slate-650 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">
              {course.description}
            </div>
          </div>

          {/* Curriculum Index Accordions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Syllabus Index</h2>
              <span className="text-xs font-semibold text-slate-450 dark:text-slate-500">
                {course.modules.length} Sections • {totalLessons} Lessons
              </span>
            </div>

            <div className="space-y-3">
              {course.modules.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full px-6 py-4 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-sm md:text-base text-left"
                  >
                    <span>{mod.title}</span>
                    {expandedModule === mod.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {expandedModule === mod.id && (
                    <div className="border-t border-slate-100 dark:border-slate-850 divide-y divide-slate-100 dark:divide-slate-850 bg-slate-50/30 dark:bg-slate-900/30">
                      {mod.lessons.map((les) => (
                        <div
                          key={les.id}
                          className="px-6 py-3.5 flex items-center justify-between text-sm text-slate-600 dark:text-slate-350"
                        >
                          <div className="flex items-center gap-3">
                            {les.isFreePreview ? (
                              <button
                                onClick={() => setPreviewVideoUrl(les.id)}
                                className="p-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-transform"
                                title="Free video lesson preview"
                              >
                                <Play size={12} fill="currentColor" />
                              </button>
                            ) : (
                              <Lock size={12} className="text-slate-400" />
                            )}
                            <span className="font-medium">{les.title}</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            {les.isFreePreview && (
                              <span className="text-3xs uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                                Free Preview
                              </span>
                            )}
                            <span className="flex items-center gap-1 font-semibold">
                              <Clock size={11} />
                              {Math.round(les.videoDuration / 60)} min
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructor Bio */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">About the Instructor</h2>
            <div className="flex gap-4 items-start">
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold uppercase shrink-0">
                {course.instructorName[0]}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{course.instructorName}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{course.instructorBio || 'Authorized SkillForge LMS Instructor'}</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 leading-relaxed">
                  Dedicated specialist committed to delivering rigorous, structured education designed for the modern coding workforce.
                </p>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Student Reviews</h2>
            {course.reviews.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm">
                No reviews listed for this curriculum yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < rev.rating ? 'currentColor' : 'transparent'}
                            className={i < rev.rating ? 'text-amber-500' : 'text-slate-300'}
                          />
                        ))}
                        <span className="ml-1 text-xs text-slate-700 dark:text-slate-350">{rev.rating}</span>
                      </div>
                      <p className="text-slate-650 dark:text-slate-300 text-sm mt-2 leading-relaxed">
                        &quot;{rev.comment || 'No review message provided.'}&quot;
                      </p>
                    </div>
                    <div className="text-2xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                      <span>{rev.user.name}</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Checkout Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl sticky top-20">
            {/* Image/Preview */}
            <div className="relative h-44 bg-slate-950">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail.startsWith('/uploads/') ? `http://localhost:5000${course.thumbnail}` : course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <Play size={40} />
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Price Details */}
              <div className="space-y-1">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Total Enrollment Cost</span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'Free'}
                  </span>
                  {course.discount > 0 && (
                    <>
                      <span className="text-slate-450 dark:text-slate-500 line-through text-sm">
                        ₹{Math.round(course.price * (1 + course.discount / 100)).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-rose-500 font-bold">
                        ({course.discount}% OFF)
                      </span>
                    </>
                  )}
                </div>
                <p className="text-2xs text-slate-450 dark:text-slate-500">All prices include standard 18% CGST/SGST education tax.</p>
              </div>

              {/* Buy Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={handleEnrollClick}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm block text-center"
                >
                  Buy Course
                </button>
                <button className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 py-2.5 rounded-xl font-bold text-xs transition-all">
                  <Bookmark size={14} />
                  Add to Wishlist
                </button>
              </div>

              {/* Features Lists */}
              <div className="space-y-3.5 pt-6 border-t border-slate-100 dark:border-slate-850">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">This curriculum includes:</h4>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350">
                  <li className="flex items-center gap-2">
                    <Clock size={14} className="text-indigo-500 shrink-0" />
                    <span>{course.duration} Hours training videos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText size={14} className="text-indigo-500 shrink-0" />
                    <span>Downloadable notes and codes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Award size={14} className="text-indigo-500 shrink-0" />
                    <span>Verification PDF certificate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe size={14} className="text-indigo-500 shrink-0" />
                    <span>English captioning support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Free Preview Video Modal Player */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-black border border-slate-800 rounded-2xl overflow-hidden w-full max-w-3xl aspect-video relative flex flex-col justify-center">
            <button
              onClick={() => setPreviewVideoUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
            
            {/* Embedded mockup preview player */}
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950 text-slate-400">
              <Play size={48} className="text-indigo-500 mb-3 animate-pulse" />
              <p className="font-bold text-white text-lg">Free Preview Playing...</p>
              <p className="text-xs text-slate-500 mt-1">Mock Video ID: {previewVideoUrl}</p>
              <p className="text-xs max-w-sm mt-3">
                In this segment, students receive a full overview of the lesson modules and core definitions prior to acquiring full lifetime course enrollment permissions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
