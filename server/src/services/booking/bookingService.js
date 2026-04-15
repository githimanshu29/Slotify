// ─────────────────────────────────────────────────────────────
//  Booking Service — Step 7 of system design
//  Creates, cancels, and lists appointments
//  ALL database writes for appointments live here
//
//  This is the final step in the booking flow:
//    User confirmed → decisionEngine calls createBooking(state)
//    → duplicate check → Appointment.create() → refCode returned
//    → state reset for next booking
// ─────────────────────────────────────────────────────────────

import Appointment from '../../models/Appointment.js';
import { generateRefCode } from '../../utils/refCodeGenerator.js';
import { formatDate, formatTime } from '../../utils/dateUtils.js';
import { emptyState } from '../session/sessionService.js';
import logger from '../../utils/Logger.js';

/**
 * Create a new appointment after user confirms
 * Step 7 of system design
 *
 * @param {object} state - Conversation state with ALL fields + selectedSlot
 * @returns {{ reply: string, refCode: string, state: object }}
 *
 * Flow:
 *   1. Check for duplicate (same email + same datetime)
 *   2. Generate refCode (APT-XXXX)
 *   3. Create Appointment document
 *   4. Reset state for next booking
 *   5. Return confirmation with refCode
 */
export async function createBooking(state) {
  const { serviceId, name, email, date } = state.collectedInfo;
  const time = state.selectedSlot;

  // Build the precise datetime for this booking
  const bookedFor = new Date(`${date}T${time}:00Z`);

  // ── Duplicate check: same person, same time ──
  const duplicate = await Appointment.findOne({
    email,
    bookedFor,
    status: 'CONFIRMED',
  });

  if (duplicate) {
    return {
      reply: `You already have a booking at this time. Your reference code is: ${duplicate.refCode}`,
      refCode: duplicate.refCode,
      state,
    };
  }

  // ── Generate unique reference code ──
  const refCode = generateRefCode();

  // ── Create the appointment ──
  await Appointment.create({
    serviceId,
    name,
    email,
    bookedFor,
    status: 'CONFIRMED',
    refCode,
  });

  logger.info('Booking created', { refCode, name, email, bookedFor });

  // ── Reset state for next booking ──
  // The conversation is done — user can start a fresh booking
  const freshState = emptyState();

  return {
    reply: `Done! Your appointment is confirmed.\n📋 Reference: **${refCode}**\n📅 ${formatDate(date)} at ${formatTime(time)}\n\nSave your reference code to manage your booking later.`,
    refCode,
    state: freshState,
  };
}

/**
 * Cancel an existing appointment by email + refCode
 *
 * @param {string} email - Customer email
 * @param {string} refCode - Appointment reference code
 * @returns {{ reply: string }}
 */
export async function cancelBooking(email, refCode) {
  if (!email || !refCode) {
    return {
      reply: 'To cancel a booking, I need your email address and reference code (e.g., APT-7K3X). Could you provide those?',
    };
  }

  const appointment = await Appointment.findOne({
    email: email.toLowerCase(),
    refCode: refCode.toUpperCase(),
    status: 'CONFIRMED',
  });

  if (!appointment) {
    return {
      reply: `I couldn't find an active booking with reference ${refCode} for ${email}. Please check your details and try again.`,
    };
  }

  appointment.status = 'CANCELLED';
  await appointment.save();

  logger.info('Booking cancelled', { refCode, email });

  return {
    reply: `Your booking ${refCode} has been cancelled successfully. Feel free to book a new appointment anytime!`,
  };
}

/**
 * List all bookings for an email address
 *
 * @param {string} email - Customer email
 * @returns {{ reply: string }}
 */
export async function listBookings(email) {
  if (!email) {
    return {
      reply: "I'd be happy to show your bookings! What's your email address?",
    };
  }

  const appointments = await Appointment.find({
    email: email.toLowerCase(),
    status: 'CONFIRMED',
  })
    .populate('serviceId', 'name')
    .sort({ bookedFor: 1 });

  if (appointments.length === 0) {
    return {
      reply: `No active bookings found for ${email}. Would you like to book an appointment?`,
    };
  }

  // Build a formatted list
  const list = appointments
    .map((apt) => {
      const svcName = apt.serviceId?.name || 'Unknown Service';
      const date = formatDate(apt.bookedFor.toISOString().split('T')[0]);
      const time = formatTime(
        apt.bookedFor.toISOString().split('T')[1].substring(0, 5)
      );
      return `• ${svcName} — ${date} at ${time} (Ref: ${apt.refCode})`;
    })
    .join('\n');

  return {
    reply: `Here are your upcoming bookings:\n\n${list}`,
  };
}
