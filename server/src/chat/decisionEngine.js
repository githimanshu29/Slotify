

import { checkAvailability } from '../services/booking/availabilityService.js';
import { createBooking, cancelBooking, listBookings } from '../services/booking/bookingService.js';
import logger from '../utils/Logger.js';

/**
 * Process the current state and return the next response
 *
 * @param {object} state - Current conversation state (post-merge)
 * @returns {{ reply: string, refCode?: string, state: object }}
 */
export async function handleIntent(state) {
  const { intent, collectedInfo: f } = state;

  logger.debug('Decision engine processing', { intent, collectedInfo: f });

  // ──────────────────────────────────────────────────
  //  RESET — stop current conversation/booking
  // ──────────────────────────────────────────────────
  if (intent === 'RESET') {
    return {
      reply: "Alright, I've stopped the current booking process. We can start fresh! What would you like to do?",
      state: {
        intent: null,
        collectedInfo: { service: null, serviceId: null, date: null, time: null, name: null, email: null, refCode: null },
        selectedSlot: null,
      },
    };
  }

  // ──────────────────────────────────────────────────
  //  CHITCHAT — friendly response, no DB interaction
  // ──────────────────────────────────────────────────
  if (intent === 'CHITCHAT' || !intent) {
    return {
      reply: "Hey there! 👋 I'm your appointment booking assistant. I can help you:\n\n• **Book** an appointment\n• **List** your existing bookings\n• **Cancel** a booking\n\nJust tell me what you need!",
      state,
    };
  }

  // ──────────────────────────────────────────────────
  //  LIST — show user's bookings (requires email)
  // ──────────────────────────────────────────────────
  if (intent === 'LIST') {
    if (!f.email) {
      return {
        reply: "I'd love to look up your bookings! What's your email address?",
        state,
      };
    }

    const result = await listBookings(f.email);
    return { ...result, state };
  }

  // ──────────────────────────────────────────────────
  //  CANCEL — cancel a booking (requires email + refCode)
  // ──────────────────────────────────────────────────
  if (intent === 'CANCEL') {
    if (!f.email && !f.refCode) {
      return {
        reply: 'To cancel a booking, I need your email and reference code (e.g., APT-7K3X). Could you share those?',
        state,
      };
    }
    if (!f.email) {
      return {
        reply: "What's the email address associated with the booking?",
        state,
      };
    }
    if (!f.refCode) {
      return {
        reply: 'What\'s your booking reference code? It looks like APT-XXXX.',
        state,
      };
    }

    const result = await cancelBooking(f.email, f.refCode);
    return { ...result, state };
  }

  // ──────────────────────────────────────────────────
  //  BOOK / CONFIRM — the main booking flow
  //  Sequential field collection, then availability
  //  check or booking creation
  // ──────────────────────────────────────────────────
  if (intent === 'BOOK' || intent === 'CONFIRM') {
    // ── If CONFIRM and we have a selectedSlot → create booking ──
    // This handles: user was asked "Confirm? (yes/no)" and said "yes"
    if (intent === 'CONFIRM' && state.selectedSlot) {
      const result = await createBooking(state);
      return {
        reply: result.reply,
        refCode: result.refCode,
        state: result.state,
      };
    }

    // ── Sequential field collection ──
    // Ask for each missing field IN ORDER
    // The order matters: service → date → time → name → email
    // This creates a natural conversation flow

    if (!f.service) {
      return {
        reply: 'What service would you like to book? (e.g., Dentist, Massage, Physiotherapy)',
        state,
      };
    }

    if (!f.date) {
      return {
        reply: 'Which date works for you? (e.g., tomorrow, next Monday, 2026-04-20, please Provide Date and Day both if possible)',
        state,
      };
    }

    if (!f.time) {
      return {
        reply: 'What time would you prefer? (e.g., 10am, 2:30pm, evening, if possible provide time in 24 hour format)',
        state,
      };
    }

    if (!f.name) {
      return {
        reply: "What's your name?",
        state,
      };
    }

    if (!f.email) {
      return {
        reply: "And your email address?",
        state,
      };
    }

    // ── All fields present → check availability ──
    // This is Step 6: validate against DB templates + existing bookings
    const result = await checkAvailability(state);
    return {
      reply: result.reply,
      state: result.state,
    };
  }

  // ── Fallback: unknown intent ──
  return {
    reply: "I'm not sure what you mean. I can help you book, list, or cancel appointments. What would you like to do?",
    state,
  };
}
