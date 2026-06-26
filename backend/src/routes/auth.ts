import { Router } from 'express';
import {
  register,
  login,
  requestOTP,
  verifyOTP,
  refresh,
  logout
} from '../controllers/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp/request', requestOTP);
router.post('/otp/verify', verifyOTP);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
