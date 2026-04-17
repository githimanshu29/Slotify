

import { extractIntent } from '../services/llm/intentExtractor.js';
import { loadSession, saveSession, mergeState } from '../services/session/sessionService.js';
import { handleIntent } from '../chat/decisionEngine.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';
import Service from '../models/Service.js';
import logger from '../utils/Logger.js';

/**
 * Handle incoming chat message
 * POST /api/chat
 * Header: Authorization: Bearer <accessToken>
 * Body: { message: string, sessionId?: string }
 *
 * sessionId is optional — defaults to `user_${userId}`
 * This means each user gets one conversation by default,
 * or they can maintain multiple by sending different sessionIds
 */
export async function handleMessage(req, res) {
  try {
    const { message, sessionId: clientSessionId } = req.body;
    const { userId, email } = req.user;

    // ── Validate input ──
    if (!message) {
      return sendError(res, 'message is required', 400);
    }

    // ── Derive sessionId from user if not provided ──
    const sessionId = clientSessionId || `user_${userId}`;

    logger.info('Chat message received', { sessionId, userId, message });

    // ── Step 1: Load session state from DB ──
    const { state, history } = await loadSession(sessionId, userId);

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

    await saveSession(sessionId, userId, result.state, updatedHistory);

    // ── Return response ──
    const response = { reply: result.reply };
    if (result.refCode) response.refCode = result.refCode;

    return sendSuccess(res, response);
  } catch (error) {
    logger.error('Chat controller error', { error: error.message, stack: error.stack });
    return sendError(res, 'Something went wrong. Please try again.', 500);
  }
}

/**
 * Fetch available services for the user UI
 * GET /api/chat/services
 */
export async function getAvailableServices(req, res) {
  try {
    const services = await Service.find({ isActive: true }).select('name duration description price').sort({ name: 1 });
    return sendSuccess(res, services);
  } catch (error) {
    logger.error('Error fetching available services', { error: error.message });
    return sendError(res, 'Failed to list services', 500);
  }
}
