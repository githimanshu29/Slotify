

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

/**
 * Get start of day (00:00:00.000Z) for a given ISO date string
 * Used in: Appointment.find({ bookedFor: { $gte: dayStart(date) } })
 */
export function dayStart(dateStr) {
  return dayjs.utc(dateStr).startOf('day').toDate();
}

/**
 * Get end of day (23:59:59.999Z) for a given ISO date string
 * Used in: Appointment.find({ bookedFor: { $lt: dayEnd(date) } })
 */
export function dayEnd(dateStr) {
  return dayjs.utc(dateStr).endOf('day').toDate();
}

/**
 * Format ISO date to human-readable: "2026-04-16" → "Apr 16, 2026"
 */
export function formatDate(dateStr) {
  return dayjs.utc(dateStr).format('MMM D, YYYY');
}

/**
 * Format 24h time to 12h: "18:00" → "6:00 PM"
 */
export function formatTime(timeStr) {
  return dayjs.utc(`2000-01-01 ${timeStr}`, 'YYYY-MM-DD HH:mm').format('h:mm A');
}
