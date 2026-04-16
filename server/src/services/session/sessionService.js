// ─────────────────────────────────────────────────────────────
//  Session Service
//  Load, save, merge state, and manage conversation history
//
//  With JWT auth, sessions are tied to authenticated users:
//    - sessionId defaults to `user_${userId}` if not provided
//    - userId is stored on the session for ownership validation
//    - Users can only access their own sessions
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
 * @param {string} sessionId - Session identifier
 * @param {string} userId - Authenticated user's ID
 * @returns {{ state: object, history: Array }}
 */
export async function loadSession(sessionId, userId) {
  const session = await ChatSession.findOne({ sessionId, userId });

  if (session) {
    logger.debug('Session loaded', { sessionId, userId });
    return {
      state: session.state || emptyState(),
      history: session.history || [],
    };
  }

  logger.debug('New session created', { sessionId, userId });
  return {
    state: emptyState(),
    history: [],
  };
}

/**
 * Save session state + history back to DB (upsert)
 *
 * @param {string} sessionId
 * @param {string} userId - Authenticated user's ID
 * @param {object} state - Current conversation state
 * @param {Array} history - Conversation history array
 */
export async function saveSession(sessionId, userId, state, history) {
  await ChatSession.findOneAndUpdate(
    { sessionId },
    {
      userId,
      state,
      history: history.slice(-6), // Keep only last 6 entries (3 turns)
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  logger.debug('Session saved', { sessionId, userId });
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
