import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import {
  getStudentCourseContent,
  updateProgress,
  getCourseProgress,
  getPurchasedCourses
} from '../controllers/progress';
import {
  getCourseQuizzes,
  getQuizQuestions,
  submitQuizAttempt,
  createQuiz,
  deleteQuiz
} from '../controllers/quizzes';

const router = Router();

// ==========================================
// STUDENT PROTECTED ROUTES
// ==========================================
router.use(authenticateJWT);

// Syllabus & Progress
router.get('/courses/:courseId/content', getStudentCourseContent);
router.post('/progress', updateProgress);
router.get('/progress/:courseId', getCourseProgress);
router.get('/purchased-courses', getPurchasedCourses);

// Quizzes
router.get('/courses/:courseId/quizzes', getCourseQuizzes);
router.get('/quizzes/:id', getQuizQuestions);
router.post('/quizzes/:id/attempt', submitQuizAttempt);

// ==========================================
// ADMIN QUIZ CMS ROUTES
// ==========================================
router.post('/quizzes', requireRole(['ADMIN']), createQuiz);
router.delete('/quizzes/:id', requireRole(['ADMIN']), deleteQuiz);

export default router;
