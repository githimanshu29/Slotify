// ─────────────────────────────────────────────────────────────
//  Session Service
//  Load, save, merge state, and manage conversation history
//
//  This is the glue between the DB (ChatSession model) and
//  the decision engine. Every chat request:
//    1. loadSession(sessionId)  → get current state
//    2. mergeState(state, extracted)  → update with LLM output
//    3. ... decision engine runs ...
//    4. saveSession(sessionId, state, history)  → persist
//
//  mergeState (Step 4 of system design) is a PURE FUNCTION:
//    - No AI involved
//    - Only non-null fields from LLM overwrite existing values
//    - This is how multi-turn works:
//        Turn 1: "book dentist tomorrow" → service + date filled
//        Turn 2: "6pm" → time filled (service + date preserved!)
// ─────────────────────────────────────────────────────────────

import ChatSession from '../../models/ChatSession.js';
import logger from '../../utils/Logger.js';

/**
 * Factory for a blank conversation state
 * Called when a new session starts or after booking completes
 */
export function emptyState() {
  return {
    intent: null,
    collectedInfo: {
      service: null,
      serviceId: null,
      date: null,
      time: null,
      name: null,
      email: null,
      refCode: null,
    },
    selectedSlot: null,
  };
}

/**
 * Load session from DB, or create a fresh one
 *
 * @param {string} sessionId - Client-generated UUID
 * @returns {{ state: object, history: Array }}
 */
export async function loadSession(sessionId) {
  const session = await ChatSession.findOne({ sessionId });

  if (session) {
    logger.debug('Session loaded', { sessionId });
    return {
      state: session.state || emptyState(),
      history: session.history || [],
    };
  }

  logger.debug('New session created', { sessionId });
  return {
    state: emptyState(),
    history: [],
  };
}

/**
 * Save session state + history back to DB (upsert)
 * Step 8 of system design:
 *   await ChatSession.findOneAndUpdate(
 *     { sessionId },
 *     { state, updatedAt: new Date() },
 *     { upsert: true, new: true }
 *   );
 *
 * @param {string} sessionId
 * @param {object} state - Current conversation state
 * @param {Array} history - Conversation history array
 */
export async function saveSession(sessionId, state, history) {
  await ChatSession.findOneAndUpdate(
    { sessionId },
    {
      state,
      history: history.slice(-6), // Keep only last 6 entries (3 turns)
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  logger.debug('Session saved', { sessionId });
}

/**
 * Merge extracted LLM output into persistent state
 * Step 4 of system design — PURE FUNCTION, NO AI
 *
 * Rules:
 *   - Intent is ALWAYS updated (if present)
 *   - Only overwrite fields that LLM actually found (non-null)
 *   - Preserve previous values for null fields
 *
 * @param {object} state - Current conversation state
 * @param {object} extracted - LLM output from intentExtractor
 * @returns {object} Updated state (mutates in place for simplicity)
 *
 * Example:
 *   state.collectedInfo = { service:"dentist", date:"2026-04-16", time:null, ... }
 *   extracted = { intent:"BOOK", service:null, date:null, time:"18:00", ... }
 *   After merge:
 *   state = { intent:"BOOK", collectedInfo: { service:"dentist", date:"2026-04-16", time:"18:00", ... } }
 *   ↑ service and date PRESERVED, time ADDED
 */
export function mergeState(state, extracted) {
  // Intent always updated
  if (extracted.intent) state.intent = extracted.intent;

  // Only overwrite fields that LLM actually found
  const info = state.collectedInfo;
  if (extracted.service !== null) info.service = extracted.service;
  if (extracted.date !== null)    info.date = extracted.date;
  if (extracted.time !== null)    info.time = extracted.time;
  if (extracted.name !== null)    info.name = extracted.name;
  if (extracted.email !== null)   info.email = extracted.email;
  if (extracted.refCode !== null) info.refCode = extracted.refCode;

  return state;
}
