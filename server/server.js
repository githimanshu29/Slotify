// ─────────────────────────────────────────────────────────────
//  Server Entry Point
//  Connects to MongoDB → starts the HTTP server
//
//  Separation of concerns:
//    src/app.js   → Express configuration (middleware, routes)
//    server.js    → Runtime (DB connection, port binding, shutdown)
//
//  This file does 3 things:
//    1. Load environment variables
//    2. Connect to MongoDB
//    3. Start listening on PORT
// ─────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
dotenv.config();

import connectDB from './src/config/db.js';
import app from './src/app.js';
import logger from './src/utils/Logger.js';

const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB, then start server ──
async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      logger.info(`🚀 Slotify server running on port ${PORT}`);
      logger.info(`📡 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
      logger.info(`🔑 Admin panel:   http://localhost:${PORT}/api/admin/*`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// ── Graceful shutdown ──
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down gracefully');
  process.exit(0);
});

start();
