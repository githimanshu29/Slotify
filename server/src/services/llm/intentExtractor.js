

import { z } from 'zod';
import { getGroqClient } from './groqClient.js';
import logger from '../../utils/Logger.js';

// ── Zod schema for structured output validation ──
// This is what we EXPECT the LLM to return
// If it returns anything else, Zod throws and we fallback
const IntentSchema = z.object({
  intent: z
    .enum(['BOOK', 'LIST', 'CANCEL', 'CONFIRM', 'CHITCHAT', 'RESET'])
    .describe('The user intent'),
  service: z
    .string()
    .nullable()
    .describe('Service name like dentist, massage, physio'),
  date: z
    .string()
    .nullable()
    .describe('ISO date string like 2026-04-16'),
  time: z
    .string()
    .nullable()
    .describe('Time in HH:MM format like 18:00'),
  name: z
    .string()
    .nullable()
    .describe('Customer name'),
  email: z
    .string()
    .nullable()
    .describe('Customer email address'),
  refCode: z
    .string()
    .nullable()
    .describe('Appointment reference code like APT-7K3X'),
});

/**
 * Build the system prompt with today's date for relative resolution
 * Why include today's date? So "tomorrow" resolves correctly.
 */
function buildSystemPrompt() {
  const today = new Date().toISOString().split('T')[0];

  return `You are an intent extractor for an appointment booking system. Return ONLY valid JSON — no prose, no markdown, no explanation.

INTENTS:
- BOOK → user wants to book/schedule an appointment
- LIST → user wants to see their existing bookings
- CANCEL → user wants to cancel an appointment
- CONFIRM → user is saying yes/confirm to a pending action
- CHITCHAT → greeting, thanks, off-topic, or unclear
- RESET → user wants to stop, abort, or start over the current booking process

RULES:
1. Extract ONLY fields explicitly mentioned by the user
2. Use null for any field not mentioned — NEVER guess or infer
3. Today's date is ${today}. Resolve relative dates:
   - "today" → "${today}"
   - "tomorrow" → next day's ISO date
   - "next Monday" → correct ISO date
4. Resolve relative times:
   - "morning" → "09:00"
   - "afternoon" → "14:00"  
   - "evening" → "18:00"
   - "6pm" → "18:00"
   - "2:30" → "14:30" (assume PM if ambiguous)
5. If the user just says a name (like "John"), extract it as name
6. If the user just says an email (like "john@x.com"), extract it as email
7. If the user just provides a time (like "6pm"), extract it as time with intent BOOK
8. If the user says "yes", "confirm", "sure", "ok" → intent is CONFIRM
9. Reference codes look like APT-XXXX — extract as refCode

OUTPUT SCHEMA:
{ "intent": "BOOK|LIST|CANCEL|CONFIRM|CHITCHAT|RESET", "service": string|null, "date": "YYYY-MM-DD"|null, "time": "HH:MM"|null, "name": string|null, "email": string|null, "refCode": string|null }`;
}

/**
 * Extract intent and entities from user message
 *
 * @param {string} message - Raw user message
 * @param {Array} history - Last N conversation turns for context
 * @returns {object} Extracted fields matching IntentSchema
 *
 * Example:
 *   Input:  "Book dentist tomorrow at 6pm"
 *   Output: { intent:"BOOK", service:"dentist", date:"2026-04-16",
 *             time:"18:00", name:null, email:null, refCode:null }
 */
export async function extractIntent(message, history = []) {
  try {
    const llm = getGroqClient();
    const structured = llm.withStructuredOutput(IntentSchema);

    // Build messages array: system prompt + recent history + current message
    const messages = [
      { role: 'system', content: buildSystemPrompt() },
    ];

    // Add last 3 conversation turns for context
    // This helps the LLM understand follow-ups like:
    //   Bot: "What time?"  User: "6pm"  → LLM knows intent is still BOOK
    const recentHistory = history.slice(-6); // 3 pairs of user+assistant
    for (const turn of recentHistory) {
      messages.push({
        role: turn.role === 'user' ? 'user' : 'assistant',
        content: turn.content,
      });
    }

    messages.push({ role: 'user', content: message });

    const result = await structured.invoke(messages);

    logger.debug('LLM extraction result', { message, result });
    return result;
  } catch (error) {
    // ── Fallback: if LLM fails or returns garbage, default to CHITCHAT ──
    // This prevents the entire system from crashing on a bad LLM response
    logger.error('Intent extraction failed, falling back to CHITCHAT', {
      error: error.message,
    });

    return {
      intent: 'CHITCHAT',
      service: null,
      date: null,
      time: null,
      name: null,
      email: null,
      refCode: null,
    };
  }
}
