

import logger from '../utils/Logger.js';
import { sendError } from '../utils/responseUtils.js';

/**
 * Express error-handling middleware (4 args required)
 */
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error(`[${req.method}] ${req.path} → ${statusCode}: ${message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  return sendError(res, message, statusCode);
}
