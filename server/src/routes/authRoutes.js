
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  register,
  login,
  refreshTokenHandler,
  logout,
  getMe,
} from '../controllers/authController.js';

const router = Router();

// ── Public (no token needed) ──
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshTokenHandler);

// ── Protected (access token required) ──
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);

export default router;
