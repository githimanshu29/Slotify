// ─────────────────────────────────────────────────────────────
//  Singleton Groq LLM Client (via LangChain)
//
//  Why Groq? → Fastest inference for open-source models
//  Why LangChain? → Structured output via .withStructuredOutput()
//  Why singleton? → One instance for the entire app lifetime,
//                   avoids creating new connections per request
//
//  Model: llama-3.3-70b-versatile
//    - Fast enough for real-time chat (~200ms responses)
//    - Good at structured JSON extraction
//    - Free tier: 14,400 req/day (plenty for assignment)
//
//  Temperature: 0 → deterministic output
//    We want "book dentist tomorrow" to ALWAYS produce the same
//    structured JSON, not creative variations
// ─────────────────────────────────────────────────────────────

import { ChatGroq } from '@langchain/groq';

let clientInstance = null;

/**
 * Get (or create) the singleton Groq client
 * @returns {ChatGroq}
 */
export function getGroqClient() {
  if (!clientInstance) {
    clientInstance = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
    });
  }
  return clientInstance;
}
