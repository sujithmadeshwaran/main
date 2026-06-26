'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Plus, Edit2, Trash2, X, Check, BookOpen } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: {
    courses: number;
  };
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/courses/categories');
      setCategories(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/courses/categories/${editingId}`, { name, description });
        setSuccess('Category updated successfully.');
      } else {
        await api.post('/courses/categories', { name, description });
        setSuccess('Category created successfully.');
      }
      
      setName('');
      setDescription('');
      setEditingId(null);
      setIsFormOpen(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description || '');
    setIsFormOpen(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/courses/categories/${id}`);
      setSuccess('Category deleted successfully.');
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-100 dark:to-indigo-50 bg-clip-text text-transparent">
            Course Categories
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Configure domains and topics to classify courses on the storefront.
          </p>
        </div>
        <button
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setEditingId(null);
            setName('');
            setDescription('');
            setError(null);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-sm self-start sm:self-auto"
        >
          {isFormOpen ? <X size={18} /> : <Plus size={18} />}
          {isFormOpen ? 'Close Editor' : 'New Category'}
        </button>
      </div>

      {/* Alert Banners */}
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

      {/* Slide-in Drawer Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-4 max-w-xl">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {editingId ? 'Edit Category' : 'Create New Category'}
          </h2>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Programming, Finance, Marketing"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of topics under this category..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow-md"
            >
              <Check size={16} />
              {editingId ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      )}

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
          <BookOpen className="mx-auto text-slate-400 dark:text-slate-600 mb-3" size={44} />
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">No categories found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Get started by creating your first course category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {category.name}
                  </h3>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  /{category.slug}
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 line-clamp-3">
                  {category.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Domain Category</span>
                <span className="bg-slate-100 dark:bg-slate-850 px-2.5 py-1 rounded-full text-indigo-600 dark:text-indigo-400 font-bold">
                  {category._count?.courses || 0} Courses
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
