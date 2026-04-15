// ─────────────────────────────────────────────────────────────
//  Request Logger Middleware
//  Morgan HTTP logger piped through Winston for unified logging
// ─────────────────────────────────────────────────────────────

import morgan from 'morgan';
import logger from '../utils/Logger.js';

// Morgan writes to a Winston stream so all logs go through
// the same Logger (consistent format, same transports)
const stream = {
  write: (message) => logger.info(message.trim()),
};

// "dev" format: :method :url :status :response-time ms
const requestLogger = morgan('dev', { stream });

export default requestLogger;
