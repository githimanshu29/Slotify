// ─────────────────────────────────────────────────────────────
//  Chat Controller
//  The main pipeline: message in → LLM extract → merge → decide → respond
//
//  This is the HTTP handler for POST /api/chat
//  It orchestrates Steps 3-8 of the system design:
//
//  Step 3: extractIntent(message, history) → structured JSON
//  Step 4: mergeState(state, extracted) → updated state
//  Step 5: handleIntent(state) → decision engine
//  Step 6-7: (called internally by decision engine)
//  Step 8: saveSession + return response
//
//  The controller does NOT contain business logic.
//  It's just plumbing — connecting services together.
// ─────────────────────────────────────────────────────────────

import { extractIntent } from '../services/llm/intentExtractor.js';
import { loadSession, saveSession, mergeState } from '../services/session/sessionService.js';
import { handleIntent } from '../chat/decisionEngine.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';
import logger from '../utils/Logger.js';

/**
 * Handle incoming chat message
 * POST /api/chat
 * Body: { sessionId: string, message: string }
 */
export async function handleMessage(req, res) {
  try {
    const { sessionId, message } = req.body;

    // ── Validate input ──
    if (!sessionId || !message) {
      return sendError(res, 'sessionId and message are required', 400);
    }

    logger.info('Chat message received', { sessionId, message });

    // ── Step 1: Load session state from DB ──
    const { state, history } = await loadSession(sessionId);

    // ── Step 3: Extract intent + entities via LLM ──
    const extracted = await extractIntent(message, history);
    logger.debug('Extracted', extracted);

    // ── Step 4: Merge extracted data into persistent state ──
    const mergedState = mergeState(state, extracted);

    // ── Step 5-7: Decision engine processes the state ──
    const result = await handleIntent(mergedState);

    // ── Step 8: Update history + save session ──
    const updatedHistory = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: result.reply },
    ];

    await saveSession(sessionId, result.state, updatedHistory);

    // ── Return response ──
    const response = { reply: result.reply };
    if (result.refCode) response.refCode = result.refCode;

    return sendSuccess(res, response);
  } catch (error) {
    logger.error('Chat controller error', { error: error.message, stack: error.stack });
    return sendError(res, 'Something went wrong. Please try again.', 500);
  }
}
