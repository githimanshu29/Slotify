// ─────────────────────────────────────────────────────────────
//  Chat Routes
//  Single endpoint: POST /api/chat
//  This is the only public-facing route — no auth required
//  because users interact via sessionId (UUID), not accounts
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import { handleMessage } from '../controllers/chatController.js';

const router = Router();

// POST /api/chat
// Body: { sessionId: "uuid", message: "Book dentist tomorrow at 6pm" }
// Response: { success: true, data: { reply: "...", refCode?: "APT-7K3X" } }
router.post('/', handleMessage);

export default router;
