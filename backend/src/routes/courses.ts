import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCourses,
  getCourseDetails,
  createCourse,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons
} from '../controllers/courses';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get('/categories', getCategories);
router.get('/', getCourses);
router.get('/:slug', getCourseDetails);

// ==========================================
// ADMIN PROTECTED ROUTES
// ==========================================
const adminMiddlewares = [authenticateJWT, requireRole(['ADMIN'])];

// Categories CMS
router.post('/categories', adminMiddlewares, createCategory);
router.put('/categories/:id', adminMiddlewares, updateCategory);
router.delete('/categories/:id', adminMiddlewares, deleteCategory);

// Courses CMS
router.post('/', adminMiddlewares, createCourse);
router.put('/:id', adminMiddlewares, updateCourse);
router.delete('/:id', adminMiddlewares, deleteCourse);

// Modules CMS
router.post('/modules', adminMiddlewares, createModule);
router.put('/modules/:id', adminMiddlewares, updateModule);
router.delete('/modules/:id', adminMiddlewares, deleteModule);
router.post('/modules/reorder', adminMiddlewares, reorderModules);

// Lessons CMS
router.post('/lessons', adminMiddlewares, createLesson);
router.put('/lessons/:id', adminMiddlewares, updateLesson);
router.delete('/lessons/:id', adminMiddlewares, deleteLesson);
router.post('/lessons/reorder', adminMiddlewares, reorderLessons);

export default router;
