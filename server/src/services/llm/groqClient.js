

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
