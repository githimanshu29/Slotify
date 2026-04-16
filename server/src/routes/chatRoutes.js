// ─────────────────────────────────────────────────────────────
//  Chat Routes
//  Protected by authMiddleware — user must be logged in
//
//  The sessionId is now derived from the authenticated user's ID,
//  so each user gets their own isolated conversation session.
//  Client can optionally send a sessionId for multiple conversations.
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { handleMessage } from '../controllers/chatController.js';

const router = Router();

// ── All chat routes require a valid JWT ──
router.use(authMiddleware);

// POST /api/chat
// Header: Authorization: Bearer <accessToken>
// Body: { message: "Book dentist tomorrow at 6pm" }
// Response: { success: true, data: { reply: "...", refCode?: "APT-7K3X" } }
router.post('/', handleMessage);

export default router;
