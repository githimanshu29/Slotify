// ─────────────────────────────────────────────────────────────
//  Availability Service — Step 6 of system design
//  Resolves service names, validates requested slots,
//  and builds confirmation prompts
//
//  This is where the chatbot meets the database:
//    1. User said "dentist" → find the Service doc
//    2. User said "2026-04-16" → get that day's template
//    3. Generate all possible slots for that day
//    4. Remove already-booked slots
//    5. Check if user's requested time is available
//    6. If yes → "Confirm? (yes/no)"
//    7. If no → "Try 17:30 or 18:30 instead?"
//
//  WHY we need predefined services + templates:
//    When user says "book dentist", we do:
//      Service.findOne({ name: /dentist/i })
//    This returns the actual service document with _id.
//    Without it, we'd have no way to:
//      - Know what services exist
//      - Look up availability templates
//      - Create appointment records (they reference serviceId)
//    The admin creates services + templates FIRST,
//    THEN users can book them via chatbot.
// ─────────────────────────────────────────────────────────────

import Service from '../../models/Service.js';
import AvailabilityTemplate from '../../models/AvailabilityTemplate.js';
import Appointment from '../../models/Appointment.js';
import { generateSlots, isBooked, findNearestSlots } from './slotGenerator.js';
import { dayStart, dayEnd, formatDate, formatTime } from '../../utils/dateUtils.js';
import logger from '../../utils/Logger.js';

/**
 * Check if a requested slot is available and return appropriate response
 *
 * @param {object} state - Conversation state with collectedInfo filled
 * @returns {{ reply: string, state: object }} Response + updated state
 *
 * Flow:
 *   1. Resolve "dentist" → Service { _id, name, duration }
 *   2. Get AvailabilityTemplate for that service + day of week
 *   3. Get existing CONFIRMED appointments for that date
 *   4. Generate all slots, filter out booked ones
 *   5. If requested time available → set selectedSlot, ask for confirm
 *   6. If taken → suggest nearest alternatives
 */
export async function checkAvailability(state) {
  const { service, date, time } = state.collectedInfo;

  // ── Step 6.1: Resolve service name → Service document ──
  // Case-insensitive regex: "dentist" matches "Dentist"
  const svc = await Service.findOne({
    name: new RegExp(service, 'i'),
    isActive: true,
  });

  if (!svc) {
    // Service doesn't exist — tell user what's available
    const allServices = await Service.find({ isActive: true }).select('name');
    const serviceList = allServices.map((s) => s.name).join(', ');
    return {
      reply: `Sorry, we don't offer "${service}". Available services: ${serviceList || 'none configured yet'}.`,
      state,
    };
  }

  // ── Step 6.2: Get the day's availability template ──
  // dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
  const dayOfWeek = new Date(date).getDay();
  const template = await AvailabilityTemplate.findOne({
    serviceId: svc._id,
    dayOfWeek,
  });

  if (!template) {
    return {
      reply: `Sorry, ${svc.name} is not available on ${formatDate(date)}. We're closed that day.`,
      state,
    };
  }

  // ── Step 6.3: Get existing bookings for that date ──
  const bookedAppointments = await Appointment.find({
    serviceId: svc._id,
    status: 'CONFIRMED',
    bookedFor: {
      $gte: dayStart(date),
      $lt: dayEnd(date),
    },
  }).select('bookedFor');

  const bookedTimes = bookedAppointments.map((a) => a.bookedFor);

  // ── Step 6.4: Generate slots and filter out booked ones ──
  const allSlots = generateSlots(template);
  const available = allSlots.filter((s) => !isBooked(s, bookedTimes));

  logger.debug('Availability check', {
    service: svc.name,
    date,
    time,
    totalSlots: allSlots.length,
    available: available.length,
  });

  // ── Step 6.5: Check if requested time is available ──
  if (!available.includes(time)) {
    if (available.length === 0) {
      return {
        reply: `Sorry, ${svc.name} is fully booked on ${formatDate(date)}. Would you like to try a different date?`,
        state,
      };
    }

    // Suggest nearest alternatives
    const nearest = findNearestSlots(available, time, 3);
    const suggestions = nearest.map((t) => formatTime(t)).join(', ');

    return {
      reply: `${formatTime(time)} is not available for ${svc.name} on ${formatDate(date)}. How about: ${suggestions}?`,
      state,
    };
  }

  // ── Step 6.6: Slot is available → store and ask for confirmation ──
  state.selectedSlot = time;
  state.collectedInfo.serviceId = svc._id;

  return {
    reply: `Great! ${svc.name} at ${formatTime(time)} on ${formatDate(date)}. Shall I confirm this booking? (yes/no)`,
    state,
  };
}
