

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

/**
 * Generate all possible time slots for a given template
 *
 * @param {object} template - { startTime: "HH:MM", endTime: "HH:MM", slotDuration: number }
 * @returns {string[]} Array of "HH:MM" strings
 *
 * Example:
 *   generateSlots({ startTime:"10:00", endTime:"13:00", slotDuration:30 })
 *   → ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"]
 */
export function generateSlots(template) {
  if (!template) return [];

  const { startTime, endTime, slotDuration } = template;
  const slots = [];

  let current = dayjs(`2000-01-01 ${startTime}`, 'YYYY-MM-DD HH:mm');
  const end = dayjs(`2000-01-01 ${endTime}`, 'YYYY-MM-DD HH:mm');

  // Keep adding slots until the next appointment would exceed end time
  while (current.isBefore(end)) {
    slots.push(current.format('HH:mm'));
    current = current.add(slotDuration, 'minute');
  }

  return slots;
}

/**
 * Check if a specific time slot is already booked
 *
 * @param {string} slotTime - "HH:MM" to check
 * @param {Date[]} bookedTimes - Array of booked Date objects from DB
 * @returns {boolean} true if the slot is taken
 *
 * How it works:
 *   Each booked appointment has a `bookedFor` Date like 2026-04-16T18:00:00Z
 *   We extract the HH:MM part and compare with the slot time
 */
export function isBooked(slotTime, bookedTimes) {
  return bookedTimes.some((bookedDate) => {
    const bookedHHMM = dayjs(bookedDate).format('HH:mm');
    return bookedHHMM === slotTime;
  });
}

/**
 * Find the N nearest available slots to a requested time
 * Used when the requested slot is taken: "18:00 is taken. How about 17:30 or 18:30?"
 *
 * @param {string[]} availableSlots - Array of available "HH:MM" strings
 * @param {string} requestedTime - The time user wanted "HH:MM"
 * @param {number} count - How many alternatives to suggest (default 3)
 * @returns {string[]} Nearest available slots, sorted by proximity
 */
export function findNearestSlots(availableSlots, requestedTime, count = 3) {
  const reqMinutes = timeToMinutes(requestedTime);

  return availableSlots
    .sort((a, b) => {
      const diffA = Math.abs(timeToMinutes(a) - reqMinutes);
      const diffB = Math.abs(timeToMinutes(b) - reqMinutes);
      return diffA - diffB;
    })
    .slice(0, count);
}

/**
 * Convert "HH:MM" to total minutes for comparison
 */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
