// ─────────────────────────────────────────────────────────────
//  Express App Configuration
//  Mounts all middleware, routes, and error handlers
//
//  Separation from server.js:
//    app.js  → Express configuration (testable, importable)
//    server.js → DB connection + HTTP listener (runtime)
//
//  Middleware order matters:
//    1. helmet (security headers)
//    2. cors (cross-origin)
//    3. body parsers
//    4. request logger
//    5. routes
//    6. error handler (MUST be last)
// ─────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Middleware
import requestLogger from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// ── Security + parsing ──
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logging ──
app.use(requestLogger);

// ── Health check ──
app.get('/', (_req, res) => {
  res.json({
    message: 'Slotify API running 🚀',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /api/chat',
      admin: '/api/admin/* (requires x-admin-key header)',
    },
  });
});

// ── Mount routes ──
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 handler ──
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler (must be last) ──
app.use(errorHandler);

export default app;
