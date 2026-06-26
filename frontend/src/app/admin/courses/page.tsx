'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import Link from 'next/link';
import { Plus, BookOpen, Settings, Trash2, Eye, EyeOff } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  slug: string;
  price: number;
  discount: number;
  difficulty: string;
  duration: number;
  instructorName: string;
  categoryName: string;
  isPublished: boolean;
  totalLessons: number;
  avgRating: number;
  thumbnail: string | null;
}

export default function CoursesManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Pass adminView=true to fetch all courses including unpublished drafts
      const response = await api.get('/courses?adminView=true');
      setCourses(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch courses list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This deletes all modules and lessons as well.`)) return;
    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/courses/${id}`);
      setSuccess('Course deleted successfully.');
      fetchCourses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleTogglePublish = async (course: Course) => {
    setError(null);
    setSuccess(null);
    try {
      const nextStatus = !course.isPublished;
      await api.put(`/courses/${course.id}`, { isPublished: nextStatus });
      setSuccess(`Course is now ${nextStatus ? 'published' : 'saved to drafts'}.`);
      fetchCourses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-100 dark:to-indigo-50 bg-clip-text text-transparent">
            Course Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Build, publish, and edit structured training curricula.
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-sm self-start sm:self-auto"
        >
          <Plus size={18} />
          Create Course
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium">
          {success}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
          <BookOpen className="mx-auto text-slate-400 dark:text-slate-600 mb-3" size={48} />
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">No courses listed</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Get started by creating your very first course curriculum.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-lg transition-all overflow-hidden"
            >
              {/* Image Preview Container */}
              <div className="relative h-44 bg-slate-100 dark:bg-slate-950">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail.startsWith('/uploads/') ? `http://localhost:5000${course.thumbnail}` : course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <BookOpen size={40} />
                  </div>
                )}

                {/* Published Badge Status */}
                <span className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold ${
                  course.isPublished
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Description Body */}
              <div className="flex-1 p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <span>{course.categoryName}</span>
                    <span className="text-slate-400 dark:text-slate-500">{course.difficulty}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1 mt-1">
                    {course.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    Instructor: {course.instructorName}
                  </p>
                  
                  <div className="flex gap-4 items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4">
                    <span>{course.totalLessons} Lessons</span>
                    <span>{course.duration} Hours</span>
                    {course.avgRating > 0 && (
                      <span className="text-amber-500 font-bold">★ {course.avgRating}</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 text-2xs uppercase tracking-wider">Price</span>
                    <span className="font-extrabold text-lg text-indigo-600 dark:text-indigo-400">
                      {course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'Free'}
                    </span>
                  </div>

                  {/* Actions Grid */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleTogglePublish(course)}
                      title={course.isPublished ? 'Change to Draft' : 'Publish Course'}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600"
                    >
                      {course.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <Link
                      href={`/admin/courses/${course.id}/builder`}
                      title="Syllabus Course Builder"
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600"
                    >
                      <Settings size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id, course.title)}
                      title="Delete Course"
                      className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
