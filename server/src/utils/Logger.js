// ─────────────────────────────────────────────────────────────
//  Winston Logger — structured logging with env-aware transports
//  Dev  → colorized, human-readable console output
//  Prod → JSON format for log aggregation
// ─────────────────────────────────────────────────────────────

import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Human-readable format for development
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? combine(json())
          : combine(colorize(), devFormat),
    }),
  ],
});

export default logger;
