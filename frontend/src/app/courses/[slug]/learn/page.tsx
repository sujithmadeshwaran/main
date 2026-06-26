'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Download, 
  BookOpen, 
  Award, 
  Clock, 
  Volume2, 
  ChevronRight, 
  HelpCircle,
  FileText,
  X
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

interface Lesson {
  id: string;
  title: string;
  videoDuration: number;
  videoUrl?: string | null;
  notesUrl?: string | null;
  notesFilename?: string | null;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface CourseContent {
  id: string;
  title: string;
  slug: string;
  modules: Module[];
}

interface Quiz {
  id: string;
  title: string;
  passingScore: number;
  _count?: {
    questions: number;
  };
}

export default function CourseLearningConsole() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [course, setCourse] = useState<CourseContent | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // Selected state
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  
  // Quiz attempting state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: number[] }>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync details
  const fetchSyllabus = async () => {
    try {
      // First fetch course details to get the course ID
      const courseDetailsRes = await api.get(`/courses/${slug}`);
      const courseId = courseDetailsRes.data.id;
      setCourse(courseDetailsRes.data);

      // Fetch student content (with access checking)
      const contentRes = await api.get(`/student/courses/${courseId}/content`);
      setHasAccess(contentRes.data.hasAccess);
      setModules(contentRes.data.modules);

      if (contentRes.data.hasAccess) {
        // Load completed progress
        const progressRes = await api.get(`/student/progress/${courseId}`);
        setProgressPercent(progressRes.data.percentage);
        setCompletedLessons(progressRes.data.completedLessons);

        // Fetch Quizzes
        const quizzesRes = await api.get(`/student/courses/${courseId}/quizzes`);
        setQuizzes(quizzesRes.data);

        // Select first lesson automatically
        if (contentRes.data.modules.length > 0 && contentRes.data.modules[0].lessons.length > 0) {
          setActiveLesson(contentRes.data.modules[0].lessons[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load syllabus content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchSyllabus();
    }
  }, [slug]);

  const handleToggleComplete = async (lessonId: string) => {
    if (!course) return;
    const isCompleted = completedLessons.includes(lessonId);
    const nextStatus = !isCompleted;

    try {
      await api.post('/student/progress', {
        lessonId,
        isCompleted: nextStatus,
      });

      // Reload progress percentage
      const progressRes = await api.get(`/student/progress/${course.id}`);
      const prevPercentage = progressPercent;
      setProgressPercent(progressRes.data.percentage);
      setCompletedLessons(progressRes.data.completedLessons);

      // Trigger canvas-confetti if student reaches 100% completion!
      if (progressRes.data.percentage === 100 && prevPercentage < 100) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Failed to update progress', err);
    }
  };

  // ==========================================
  // QUIZ ENGINE FLOW
  // ==========================================

  const startQuiz = async (quizId: string) => {
    setError(null);
    setQuizResult(null);
    setSelectedAnswers({});
    try {
      const response = await api.get(`/student/quizzes/${quizId}`);
      setQuizQuestions(response.data.questions);
      setActiveQuizId(quizId);
    } catch (err) {
      setError('Failed to fetch quiz questions.');
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number, multiple: boolean) => {
    const current = selectedAnswers[questionId] || [];
    if (multiple) {
      const exists = current.includes(optionIndex);
      const next = exists ? current.filter((x) => x !== optionIndex) : [...current, optionIndex];
      setSelectedAnswers({ ...selectedAnswers, [questionId]: next });
    } else {
      setSelectedAnswers({ ...selectedAnswers, [questionId]: [optionIndex] });
    }
  };

  const submitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuizId) return;

    try {
      // Map answers to backend format
      const formattedAnswers = Object.entries(selectedAnswers).map(([qId, options]) => ({
        questionId: qId,
        selectedAnswers: options,
      }));

      const response = await api.post(`/student/quizzes/${activeQuizId}/attempt`, {
        answers: formattedAnswers,
      });

      setQuizResult(response.data);
      
      // If student passed, play mini confetti
      if (response.data.passed) {
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.7 }
        });
      }
    } catch (err) {
      setError('Quiz grading failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-gray-400 font-semibold">Opening LMS play console...</p>
      </div>
    );
  }

  // Not enrolled flow
  if (hasAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md p-6 text-center space-y-4 shadow-xl">
          <BookOpen className="mx-auto text-indigo-600 dark:text-indigo-400" size={48} />
          <h2 className="text-xl font-bold text-slate-850 dark:text-slate-100">Enrollment Required</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            You must purchase this course to access premium videos, study resources, quizzes, and downloadable certifications.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Link
              href={`/courses/${slug}`}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-xs"
            >
              Course Details
            </Link>
            <Link
              href={`/checkout/${course?.id}`}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10"
            >
              Enroll Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Console Bar */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/courses/${slug}`}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="font-bold text-sm truncate max-w-sm hidden sm:inline">
            {course?.title}
          </span>
        </div>

        {/* Progress percent meter */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-2xs font-semibold text-slate-400">Course Progress</span>
            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
              {progressPercent}% Complete
            </span>
          </div>
          <div className="w-24 h-2 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Column: Player Pane */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeLesson ? (
            <div className="space-y-4">
              {/* Playback Container */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden aspect-video relative flex flex-col justify-center text-center text-slate-400 p-6 group">
                <Play size={44} className="mx-auto text-indigo-500 animate-pulse mb-3" />
                <p className="font-bold text-white text-lg">{activeLesson.title}</p>
                <p className="text-2xs text-slate-500 mt-1">Playing mockup stream at {playbackSpeed}x speed...</p>

                {/* Simulated Player Bar Controls */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-4 text-xs font-semibold text-white">
                  <div className="flex items-center gap-3">
                    <button className="p-1 hover:text-indigo-400">
                      <Play size={14} fill="currentColor" />
                    </button>
                    <Volume2 size={14} />
                    <span>0:00 / {Math.floor(activeLesson.videoDuration / 60)}:00</span>
                  </div>
                  {/* Playback Speed selector */}
                  <div className="flex gap-2">
                    {[0.5, 1, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2 py-0.5 rounded text-3xs font-bold ${
                          playbackSpeed === speed ? 'bg-indigo-600 text-white' : 'hover:bg-white/20'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lesson Action Menu */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                <div>
                  <h3 className="font-bold text-slate-850 dark:text-slate-100">{activeLesson.title}</h3>
                  <span className="text-2xs text-slate-400 font-semibold">Module Content Segment</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleComplete(activeLesson.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      completedLessons.includes(activeLesson.id)
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350'
                    }`}
                  >
                    <CheckCircle size={15} />
                    {completedLessons.includes(activeLesson.id) ? 'Completed' : 'Mark Complete'}
                  </button>

                  {activeLesson.notesUrl && (
                    <a
                      href={`http://localhost:5000${activeLesson.notesUrl}`}
                      download={activeLesson.notesFilename || 'Notes.pdf'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                      <Download size={15} />
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">Select a syllabus lesson in the sidebar to start learning.</div>
          )}

          {/* Quizzes list inside page */}
          {quizzes.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <HelpCircle className="text-indigo-500" size={18} />
                Section Examination Quizzes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 border border-slate-150 dark:border-slate-800/80 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl flex items-center justify-between gap-4 transition-all"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{q.title}</h4>
                      <span className="text-2xs text-slate-450 dark:text-slate-500 font-semibold">
                        Passing criteria: {q.passingScore}% • {q._count?.questions || 0} Questions
                      </span>
                    </div>
                    <button
                      onClick={() => startQuiz(q.id)}
                      className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-3.5 py-1.5 rounded-lg font-bold text-xs"
                    >
                      Attempt
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Syllabus Sidebar */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 overflow-y-auto shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Course Index</span>
            <span className="text-2xs font-semibold bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-md">Syllabus</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {modules.map((mod) => (
              <div key={mod.id} className="space-y-1 p-2">
                <div className="px-3 py-2 text-2xs font-extrabold uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                  {mod.title}
                </div>
                <div className="space-y-0.5">
                  {mod.lessons.map((les) => {
                    const isActive = activeLesson?.id === les.id;
                    const isCompleted = completedLessons.includes(les.id);
                    return (
                      <div
                        key={les.id}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
                            : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/50'
                        }`}
                        onClick={() => setActiveLesson(les)}
                      >
                        <div className="flex items-center gap-2.5 truncate mr-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid activating the lesson on check toggling
                              handleToggleComplete(les.id);
                            }}
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {isCompleted && <span className="text-3xs font-bold">✓</span>}
                          </button>
                          <span className="truncate">{les.title}</span>
                        </div>
                        <span className="text-3xs text-slate-400 shrink-0">
                          {Math.round(les.videoDuration / 60)}m
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Quiz Modal Overlay */}
      {activeQuizId && quizQuestions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-slate-850 dark:text-slate-100">Section Examination</h3>
              <button 
                onClick={() => {
                  setActiveQuizId(null);
                  setQuizQuestions([]);
                  setQuizResult(null);
                }} 
                className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </header>

            <div className="p-6 overflow-y-auto flex-1">
              {!quizResult ? (
                <form onSubmit={submitQuiz} className="space-y-6">
                  {quizQuestions.map((q, idx) => (
                    <div key={q.id} className="space-y-3">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Q{idx + 1}. {q.text}
                      </h4>
                      <div className="grid grid-cols-1 gap-2 pl-3">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isSelected = (selectedAnswers[q.id] || []).includes(optIdx);
                          const isMultiple = q.type === 'MULTIPLE';
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectOption(q.id, optIdx, isMultiple)}
                              className={`text-left px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-650 dark:text-slate-450'
                              }`}
                            >
                              <span className="inline-block w-5 font-extrabold text-2xs uppercase">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md"
                    >
                      Submit Exam
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 text-center py-6">
                  {/* Passed Banner */}
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500">
                      {quizResult.passed ? '✓' : '✗'}
                    </div>
                    <h3 className={`text-xl font-bold ${quizResult.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {quizResult.passed ? 'Exam Passed!' : 'Exam Failed'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      Your score: {quizResult.score}% • Passing score required: {quizResult.passingScore}%
                    </p>
                    <p className="text-2xs text-slate-400">
                      Correct answers: {quizResult.correctCount} / {quizResult.totalQuestions}
                    </p>
                  </div>

                  {/* Corrections list */}
                  <div className="text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850 max-h-60 overflow-y-auto space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Grading Breakdown</h4>
                    {quizQuestions.map((q, idx) => {
                      const feedback = quizResult.feedback[q.id];
                      return (
                        <div key={q.id} className="text-xs space-y-1">
                          <p className="font-semibold text-slate-700 dark:text-slate-350">
                            {idx + 1}. {q.text}
                          </p>
                          <p className="font-bold text-2xs">
                            Status:{' '}
                            <span className={feedback.correct ? 'text-emerald-500' : 'text-rose-500'}>
                              {feedback.correct ? 'Correct' : 'Incorrect'}
                            </span>
                          </p>
                          <p className="text-slate-450 dark:text-slate-500 text-2xs">
                            Correct index options: {feedback.correctAnswers.join(', ')} (e.g.{' '}
                            {feedback.correctAnswers
                              .map((idxVal: number) => q.options[idxVal])
                              .join(', ')}
                            )
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-2">
                    <button
                      onClick={() => startQuiz(activeQuizId)}
                      className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-650 dark:text-slate-400 font-bold rounded-xl text-xs"
                    >
                      Retry Exam
                    </button>
                    <button
                      onClick={() => {
                        setActiveQuizId(null);
                        setQuizQuestions([]);
                        setQuizResult(null);
                      }}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
