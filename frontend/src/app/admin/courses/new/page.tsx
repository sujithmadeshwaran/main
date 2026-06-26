'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { ArrowLeft, Save, Upload, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

export default function NewCourseCreator() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [language, setLanguage] = useState('English');
  const [instructorName, setInstructorName] = useState('');
  const [instructorBio, setInstructorBio] = useState('');
  
  // File Strings (base64)
  const [thumbnailBase64, setThumbnailBase64] = useState<string | null>(null);
  const [thumbnailName, setThumbnailName] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/courses/categories');
        setCategories(response.data);
        if (response.data.length > 0) {
          setCategoryId(response.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      if (type === 'thumbnail') {
        setThumbnailBase64(base64String);
        setThumbnailName(file.name);
      } else {
        setVideoBase64(base64String);
        setVideoName(file.name);
      }
    };
    reader.onerror = (error) => {
      console.error('File conversion error:', error);
      setError(`Failed to process ${type} file.`);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || !description || !price || !instructorName || !categoryId) {
      setError('Please fill out all required fields (*).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        subtitle,
        description,
        categoryId,
        price: parseFloat(price),
        discount: parseFloat(discount),
        difficulty,
        language,
        instructorName,
        instructorBio,
        thumbnail: thumbnailBase64,
        previewVideo: videoBase64,
      };

      await api.post('/courses', payload);
      router.push('/admin/courses');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/courses"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Create Course
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Fill out the course settings to construct a new catalog item.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl text-sm font-medium">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Editor Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Python Programming"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subtitle (Tagline)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Learn syntax, OOP, libraries and web APIs"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Course Description *
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Comprehensive description of lessons, domains, prerequisites, and learning outputs..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Domain Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100 dark:bg-slate-900"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Difficulty *
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100 dark:bg-slate-900"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Language *
            </label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Price (INR ₹) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 1999 (0 for free)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
            />
          </div>

          {/* Discount */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="e.g. 10 for 10%"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
            />
          </div>
        </div>

        {/* Instructor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Instructor Name *
            </label>
            <input
              type="text"
              required
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              placeholder="e.g. Dr. John Doe"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Instructor Bio
            </label>
            <input
              type="text"
              value={instructorBio}
              onChange={(e) => setInstructorBio(e.target.value)}
              placeholder="e.g. Senior Software Architect with 10+ years experience"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
            />
          </div>
        </div>

        {/* File Upload Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {/* Thumbnail */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Course Thumbnail Image
            </label>
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'thumbnail')}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={28} />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2">
                {thumbnailName ? thumbnailName : 'Select image file'}
              </span>
              <span className="text-xs text-slate-400 mt-1">PNG, JPG, or GIF up to 2MB</span>
            </div>
            {thumbnailBase64 && (
              <div className="mt-2 h-20 w-32 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <img src={thumbnailBase64} alt="Thumbnail Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Video */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Course Preview Video
            </label>
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer group">
              <input
                type="file"
                accept="video/mp4"
                onChange={(e) => handleFileChange(e, 'video')}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={28} />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2">
                {videoName ? videoName : 'Select MP4 video'}
              </span>
              <span className="text-xs text-slate-400 mt-1">Short pitch or introduction video</span>
            </div>
          </div>
        </div>

        {/* Form Submit */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-3">
          <Link
            href="/admin/courses"
            className="px-6 py-2.5 rounded-xl font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-md"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save size={16} />
            )}
            {loading ? 'Creating...' : 'Save & Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
