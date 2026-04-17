

import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { handleMessage, getAvailableServices } from '../controllers/chatController.js';

const router = Router();

// ── All chat routes require a valid JWT ──
router.use(authMiddleware);

// POST /api/chat
// Header: Authorization: Bearer <accessToken>
// Body: { message: "Book dentist tomorrow at 6pm" }
// Response: { success: true, data: { reply: "...", refCode?: "APT-7K3X" } }
router.post('/', handleMessage);

// GET /api/chat/services
// Helper route for the sidebar to list available services
router.get('/services', getAvailableServices);

export default router;
