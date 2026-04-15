// ─────────────────────────────────────────────────────────────
//  ChatSession Model
//  Persists conversation state across multiple turns
//
//  Why this exists: The booking flow is multi-turn:
//    Turn 1: "Book dentist tomorrow" → service + date filled
//    Turn 2: "6pm"                   → time filled
//    Turn 3: "John"                  → name filled
//    Turn 4: "john@email.com"        → email filled
//    Turn 5: "yes"                   → CONFIRM → create booking
//
//  Without persistent state, every turn would start fresh
//  and the user would have to repeat everything.
//
//  State is saved via upsert (Step 8 of system design):
//    await ChatSession.findOneAndUpdate(
//      { sessionId },
//      { state, updatedAt: new Date() },
//      { upsert: true, new: true }
//    );
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    // Client generates this (UUID) and sends it with every request
    // This ties multiple HTTP requests to one conversation
  },

  state: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
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
    }),
  },

  history: {
    type: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
      },
    ],
    default: [],
    // Last N turns sent to LLM for context
    // Capped at 6 entries (3 user + 3 assistant)
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;
