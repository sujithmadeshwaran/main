'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Video, 
  FileText, 
  Check, 
  X,
  Upload,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Lesson {
  id: string;
  title: string;
  sortOrder: number;
  videoDuration: number;
  isFreePreview: boolean;
  videoUrl?: string | null;
  notesUrl?: string | null;
  notesFilename?: string | null;
}

interface Module {
  id: string;
  title: string;
  sortOrder: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  modules: Module[];
}

export default function CourseBuilder() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Module Modals/Forms State
  const [activeModuleForm, setActiveModuleForm] = useState<boolean>(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  // Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  
  // Lesson Form Fields
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonVideoDuration, setLessonVideoDuration] = useState('0');
  const [lessonIsPreview, setLessonIsPreview] = useState(false);
  const [lessonNotesBase64, setLessonNotesBase64] = useState<string | null>(null);
  const [lessonNotesName, setLessonNotesName] = useState<string | null>(null);

  const fetchCourseData = async () => {
    try {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load course structure.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  // ==========================================
  // MODULE ACTIONS
  // ==========================================

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim() || !course) return;

    try {
      if (editingModuleId) {
        await api.put(`/courses/modules/${editingModuleId}`, { title: moduleTitle });
        setSuccess('Module updated successfully.');
      } else {
        await api.post('/courses/modules', { title: moduleTitle, courseId: course.id });
        setSuccess('Module created successfully.');
      }
      setModuleTitle('');
      setEditingModuleId(null);
      setActiveModuleForm(false);
      fetchCourseData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Module action failed.');
    }
  };

  const handleModuleDelete = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module? All lessons inside will be deleted.')) return;
    try {
      await api.delete(`/courses/modules/${moduleId}`);
      setSuccess('Module deleted successfully.');
      fetchCourseData();
    } catch (err: any) {
      setError('Failed to delete module.');
    }
  };

  const handleModuleOrder = async (index: number, direction: 'up' | 'down') => {
    if (!course) return;
    const modules = [...course.modules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= modules.length) return;

    // Swap
    const temp = modules[index];
    modules[index] = modules[targetIndex];
    modules[targetIndex] = temp;

    try {
      const moduleIds = modules.map((m) => m.id);
      await api.post('/courses/modules/reorder', { moduleIds });
      fetchCourseData();
    } catch (err) {
      setError('Failed to reorder modules.');
    }
  };

  // ==========================================
  // LESSON ACTIONS
  // ==========================================

  const openAddLessonModal = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonVideoUrl('');
    setLessonVideoDuration('0');
    setLessonIsPreview(false);
    setLessonNotesBase64(null);
    setLessonNotesName(null);
    setIsLessonModalOpen(true);
    setError(null);
  };

  const openEditLessonModal = (moduleId: string, lesson: Lesson) => {
    setSelectedModuleId(moduleId);
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonVideoUrl(lesson.videoUrl || '');
    setLessonVideoDuration(String(lesson.videoDuration || 0));
    setLessonIsPreview(lesson.isFreePreview);
    setLessonNotesBase64(null);
    setLessonNotesName(lesson.notesFilename || null);
    setIsLessonModalOpen(true);
    setError(null);
  };

  const handleNotesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setLessonNotesBase64(reader.result as string);
      setLessonNotesName(file.name);
    };
    reader.onerror = () => {
      setError('Failed to process notes PDF.');
    };
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !selectedModuleId) return;

    try {
      const payload: any = {
        title: lessonTitle,
        moduleId: selectedModuleId,
        videoUrl: lessonVideoUrl,
        videoDuration: parseFloat(lessonVideoDuration),
        isFreePreview: lessonIsPreview,
      };

      if (lessonNotesBase64) {
        payload.notesFile = lessonNotesBase64;
        payload.notesFilename = lessonNotesName;
      }

      if (editingLessonId) {
        await api.put(`/courses/lessons/${editingLessonId}`, payload);
        setSuccess('Lesson updated successfully.');
      } else {
        await api.post('/courses/lessons', payload);
        setSuccess('Lesson created successfully.');
      }

      setIsLessonModalOpen(false);
      fetchCourseData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lesson action failed.');
    }
  };

  const handleLessonDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await api.delete(`/courses/lessons/${lessonId}`);
      setSuccess('Lesson deleted.');
      fetchCourseData();
    } catch (err) {
      setError('Failed to delete lesson.');
    }
  };

  const handleLessonOrder = async (moduleIndex: number, lessonIndex: number, direction: 'up' | 'down') => {
    if (!course) return;
    const lessons = [...course.modules[moduleIndex].lessons];
    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;

    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    // Swap
    const temp = lessons[lessonIndex];
    lessons[lessonIndex] = lessons[targetIndex];
    lessons[targetIndex] = temp;

    try {
      const lessonIds = lessons.map((l) => l.id);
      await api.post('/courses/lessons/reorder', { lessonIds });
      fetchCourseData();
    } catch (err) {
      setError('Failed to reorder lessons.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-semibold">Loading syllabus...</p>
      </div>
    );
  }

  if (!course) return <div className="text-center py-20 text-red-500">Course not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/courses"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Syllabus Builder: {course.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Build and arrange modules, upload videos, and add notes.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium">
          {success}
        </div>
      )}

      {/* Module Add Control */}
      {!activeModuleForm ? (
        <button
          onClick={() => {
            setActiveModuleForm(true);
            setEditingModuleId(null);
            setModuleTitle('');
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md text-sm"
        >
          <Plus size={16} />
          Add Section Module
        </button>
      ) : (
        <form onSubmit={handleModuleSubmit} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 max-w-xl">
          <input
            type="text"
            required
            placeholder="e.g. Module 1: Introduction to Web Design"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm"
          >
            {editingModuleId ? 'Save' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => setActiveModuleForm(false)}
            className="p-2 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </form>
      )}

      {/* Modules List Tree */}
      <div className="space-y-6">
        {course.modules.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
            <h3 className="font-semibold text-slate-700 dark:text-slate-350">No curriculum modules added</h3>
            <p className="text-slate-400 text-sm mt-1">Create a module above to define the course sections.</p>
          </div>
        ) : (
          course.modules.map((mod, modIdx) => (
            <div key={mod.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              {/* Module Header Bar */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-slate-400">
                    <button
                      disabled={modIdx === 0}
                      onClick={() => handleModuleOrder(modIdx, 'up')}
                      className="hover:text-indigo-600 disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      disabled={modIdx === course.modules.length - 1}
                      onClick={() => handleModuleOrder(modIdx, 'down')}
                      className="hover:text-indigo-600 disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">
                    {mod.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingModuleId(mod.id);
                      setModuleTitle(mod.title);
                      setActiveModuleForm(true);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit Module Title"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleModuleDelete(mod.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    title="Delete Module"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={() => openAddLessonModal(mod.id)}
                    className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ml-2"
                  >
                    <Plus size={14} />
                    Add Lesson
                  </button>
                </div>
              </div>

              {/* Lessons Inner List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {mod.lessons.length === 0 ? (
                  <div className="px-6 py-8 text-center text-slate-400 text-sm">
                    No lessons in this section. Click &quot;Add Lesson&quot; to begin.
                  </div>
                ) : (
                  mod.lessons.map((les, lesIdx) => (
                    <div key={les.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 gap-4">
                      <div className="flex items-center gap-3">
                        {/* Lesson Reorder Control */}
                        <div className="flex flex-col text-slate-400">
                          <button
                            disabled={lesIdx === 0}
                            onClick={() => handleLessonOrder(modIdx, lesIdx, 'up')}
                            className="hover:text-indigo-600 disabled:opacity-30"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            disabled={lesIdx === mod.lessons.length - 1}
                            onClick={() => handleLessonOrder(modIdx, lesIdx, 'down')}
                            className="hover:text-indigo-600 disabled:opacity-30"
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            {les.title}
                            {les.isFreePreview && (
                              <span className="text-3xs uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                                Free Preview
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-3 text-2xs text-slate-400 dark:text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Video size={10} />
                              {les.videoUrl ? `${Math.floor(les.videoDuration / 60)}m` : 'No Video'}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText size={10} />
                              {les.notesFilename ? les.notesFilename : 'No notes'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditLessonModal(mod.id, les)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleLessonDelete(les.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lesson Details Dialog Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <form onSubmit={handleLessonSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {editingLessonId ? 'Edit Lesson Settings' : 'Create New Lesson'}
            </h3>

            <div className="space-y-2">
              <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Lesson Title *
              </label>
              <input
                type="text"
                required
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g. 1.2 Intro to Variable Scopes"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Video URL (YouTube/Vimeo/S3)
                </label>
                <input
                  type="text"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Video Duration (Seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  value={lessonVideoDuration}
                  onChange={(e) => setLessonVideoDuration(e.target.value)}
                  placeholder="e.g. 340"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100 text-sm"
                />
              </div>
            </div>

            {/* Notes upload */}
            <div className="space-y-2">
              <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Downloadable PDF Study Notes (Optional)
              </label>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleNotesUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload size={18} className="text-slate-400 group-hover:text-indigo-500" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-350 mt-1">
                  {lessonNotesName ? lessonNotesName : 'Select notes PDF file'}
                </span>
              </div>
            </div>

            {/* Preview checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isPreview"
                checked={lessonIsPreview}
                onChange={(e) => setLessonIsPreview(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-200 dark:border-slate-850"
              />
              <label htmlFor="isPreview" className="text-xs font-semibold text-slate-600 dark:text-slate-350 select-none">
                Enable Free Preview (Guests can watch/read this lesson before purchase)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsLessonModalOpen(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl"
              >
                Close
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow-md"
              >
                {editingLessonId ? 'Save Settings' : 'Create Lesson'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
