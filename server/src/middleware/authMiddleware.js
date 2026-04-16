

import jwt from 'jsonwebtoken';
import { sendError } from '../utils/responseUtils.js';

export function authMiddleware(req, res, next) {
  try {
    // ── Extract token from Authorization header ──
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access denied — no token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // ── Verify the access token ──
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Attach user info to request object ──
    // Controllers can now access req.user.userId, req.user.email, etc.
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Access token expired — please refresh', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid access token', 401);
    }
    return sendError(res, 'Authentication failed', 401);
  }
}
