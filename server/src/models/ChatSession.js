// ─────────────────────────────────────────────────────────────
//  ChatSession Model
//  Persists conversation state across multiple turns
//
//  With JWT auth, sessions are now linked to authenticated users:
//    sessionId = `user_${userId}` (default, one session per user)
//    OR sessionId = custom ID for multiple conversations
//
//  The userId field enables:
//    - Querying all sessions for a user
//    - Preventing session hijacking (user can only access their own)
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
    // With auth: defaults to `user_${userId}`
    // This ties multiple HTTP requests to one conversation
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    // Links session to authenticated user
    // Prevents cross-user session access
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

// Index for fast user session lookups
chatSessionSchema.index({ userId: 1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;
