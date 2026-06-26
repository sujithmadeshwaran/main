import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import {
  createOrder,
  verifyPayment,
  getTransactions,
  initiateRefund
} from '../controllers/payments';

const router = Router();

// Student routes
router.post('/create-order', authenticateJWT, createOrder);
router.post('/verify', authenticateJWT, verifyPayment);

// Admin routes
router.get('/transactions', authenticateJWT, requireRole(['ADMIN']), getTransactions);
router.post('/refund/:id', authenticateJWT, requireRole(['ADMIN']), initiateRefund);

export default router;
