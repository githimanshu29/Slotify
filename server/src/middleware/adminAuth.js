

import { sendError } from '../utils/responseUtils.js';

export function adminAuth(req, res, next) {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return sendError(res, 'Unauthorized — invalid or missing admin key', 401);
  }

  next();
}
