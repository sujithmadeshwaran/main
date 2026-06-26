import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import {
  getAnalytics,
  getUsers,
  toggleUserStatus
} from '../controllers/admin';

const router = Router();

// Apply admin protection to all routes
router.use(authenticateJWT);
router.use(requireRole(['ADMIN']));

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);

export default router;
