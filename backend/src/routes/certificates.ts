import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import {
  generateCertificate,
  getUserCertificates,
  verifyCertificateOnline
} from '../controllers/certificates';

const router = Router();

// Public online verification route
router.get('/verify/:token', verifyCertificateOnline);

// Student authenticated routes
router.post('/generate', authenticateJWT, generateCertificate);
router.get('/my', authenticateJWT, getUserCertificates);

export default router;
