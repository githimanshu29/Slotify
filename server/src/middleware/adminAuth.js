// ─────────────────────────────────────────────────────────────
//  Admin Auth Middleware
//  Protects all /api/admin/* routes with a simple API key
//
//  How it works:
//    Client sends: x-admin-key: <secret> in request headers
//    We compare against: process.env.ADMIN_KEY
//    If missing or wrong → 401 Unauthorized
//
//  Why a simple key (not JWT)?
//    - Assignment scope: recruiter wants to see admin functionality
//    - No user auth system needed for the demo
//    - Easy to test with curl/Postman
// ─────────────────────────────────────────────────────────────

import { sendError } from '../utils/responseUtils.js';

export function adminAuth(req, res, next) {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return sendError(res, 'Unauthorized — invalid or missing admin key', 401);
  }

  next();
}
