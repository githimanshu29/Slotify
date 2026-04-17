# SLOTIFY — AI-Powered Appointment Booking Assistant.

**Assignment Report — Full Stack + GenAI Engineering**

[![GitHub](https://img.shields.io/badge/GitHub-Slotify-181717?style=for-the-badge&logo=github)](https://github.com/githimanshu29/Slotify)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)

---

## 🔑 Admin Access (For Testing & Review)

To review the admin dashboard and see how the database is populated, please log in with the following preset credentials:

- **Email:** `admin@slotify.com` *(Must be this exact email)*
- **Password:** `admin123`
- **Admin Secret Key:** `slotify-admin-secret-2026` *(Required to pass the secondary security check on the Admin Dashboard)*

*(Note: Run `npm run seed` in the `server` directory first if running locally to populate the database).*

---

## Part 1 — Problem Understanding (NO AI)

### Abstract
Booking an appointment today — whether with a dentist, a physiotherapist, or a massage therapist — requires navigating through clunky website forms and dropdown menus: pick a date, pick a time, pick a service, fill in contact details, submit. This process is complex for the user and fragile for the business, because it gives no guidance when a slot is taken and requires the user to already know exactly what they want before they even start.

Slotify replaces that form with a natural conversation. A user can simply type *"Book me a dentist slot for tomorrow morning"* and the system will intuitively figure out everything else — it asks only for the pieces that are missing, checks availability of the exact slot, and confirms the booking in a single chat conversation using natural language. No forms, no page reloads, and no confusion.

On the business side, a secure admin dashboard lets the clinic or business owner decide which services they offer, set the exact days and hours each service runs, and view or cancel any booking. This gives the business complete control without needing any technical knowledge.

The core engineering challenge was making the AI incredibly useful without making it unpredictable. The solution: the language model is used *strictly* to parse natural language into structured data. A separate, hard-coded decision engine makes all actual booking decisions — availability checks, conflict detection, and confirmation — ensuring zero hallucinations and fully deterministic behaviour.

### Key User Flows

**User Booking Flow:**
1. User opens the chat interface and types a natural language booking request.
2. AI extracts intent, service, date, and time — asking follow-up questions for any missing fields.
3. Decision engine checks real-time availability against the database.
4. If a slot is taken, the system automatically suggests the nearest alternatives.
5. User confirms the choice — the booking is created and a reference code (e.g., APT-7K3X) is generated.
6. User can view upcoming appointments or seamlessly cancel them holding their reference code.

**Admin Flow:**
1. Admin logs in with credentials and enters the secondary admin secret key.
2. Creates services (e.g., Dentist, Massage) with specific durations.
3. Sets weekly availability templates per service (e.g., Mon–Fri 9 AM–5 PM, 30-min slots).
4. Monitors all confirmed bookings in a paginated, filterable table.
5. Can flexibly cancel any user's booking if necessary.

---

## Part 2 — Spec & Plan (AI-Assisted)

### 2.1 System Design
Slotify follows a strict three-layer principle to prevent AI hallucinations:

| Layer | Technology | Responsibility |
|---|---|---|
| **Language Layer** | Groq (llama-3.1-8b-instant) | Parse natural language → structured JSON |
| **Decision Layer** | Node.js Decision Engine | All business logic — availability, conflicts, flow |
| **Persistence Layer**| MongoDB + Mongoose | Single source of truth for all data |

**Request lifecycle:**
```text
POST /api/chat
   │
   ├─ 1. Load ChatSession (state) from MongoDB
   ├─ 2. LLM extracts intent + fields → structured JSON
   ├─ 3. Merge extracted fields into persistent state
   ├─ 4. Decision Engine evaluates state → decides next action
   ├─ 5. If BOOK + all fields ready → check availability
   ├─ 6. If CONFIRM → create Appointment document
   ├─ 7. Save updated state back to MongoDB
   └─ 8. Return reply to frontend
```

### 2.2 Feature Breakdown

**Conversational Booking Pipeline:**
- Multi-turn state machine: service → date → time → name → email → confirm.
- State persists across HTTP requests via MongoDB `ChatSession` documents.
- Sessions auto-expire after 2 hours of inactivity via MongoDB TTL index.

**Deterministic Decision Engine:**
- LLM outputs are treated as untrusted input and validated via Zod before use.
- 100% of booking decisions are in pure JS code.
- Edge cases handled: past dates, duplicate bookings, ambiguous services, early cancellations mid-flow.

**Secure Authentication Framework:**
- Dual-token JWT: access tokens expire in 15 minutes, refresh tokens in 7 days.
- Refresh token rotation: old token is invalidated on every refresh — completely preventing replay attacks.
- Admin routes protected by JWT + a secondary `ADMIN_KEY` header.

### 2.3 Prompt Design
The system prompt given to the LLM on every request ensures accuracy without creativity:

```text
System:
  You are a strict intent extraction engine for an appointment booking system.
  TODAY: {today}

  Your ONLY job: parse the user message into structured JSON.
  You do NOT decide anything, book anything, or generate responses.

  Intent values: BOOK | CONFIRM | CANCEL | LIST | CHITCHAT | RESET

  Field rules:
    - Only extract fields explicitly mentioned. Null = not mentioned.
    - date: resolve "tomorrow", "next Monday" using today's date.
    - time: "6pm"→"18:00", "morning"→"09:00", "evening"→"18:00".

  Output schema (enforced via Zod + Groq function-calling):
    { intent, service, date, time, name, email, refCode }
```

- **Temperature: 0** — removes variance so extraction results are deterministic.
- **MaxTokens: 512** — extraction never needs a lengthy generation.
- **Last 6 turns** included as context to resolve natural follow-ups like "Book this".

### 2.4 Data Model

**Service:** `name`, `duration`, `description`, `isActive`
**AvailabilityTemplate:** `serviceId`, `dayOfWeek`, `startTime`, `endTime`, `slotDuration`
**Appointment:** `serviceId`, `name`, `email`, `bookedFor`, `status`, `refCode`, `sessionId`
**ChatSession:** `sessionId`, `state.intent`, `state.collectedInfo`, `updatedAt` (TTL indexed)

---

## Part 3 — Implementation (AI-Assisted)

### 3.1 AI Tools Used
- **Claude (Anthropic) / Antigravity AI:** System architecture, codebase restructuring, decision engine generation, and prompt refinement.
- **Groq Cloud (Inference):** Used strictly for ultra-fast runtime LLM intent extraction.

### 3.2 Model Choice & Reasoning
**Inference Model:** `llama-3.1-8b-instant` via Groq Cloud API.

- Chosen drastically over 70B parameter models due to network congestion — the 8B model ensures our Chat UI remains ultra-fast and instantly responsive. 
- Strong instruction-following capabilities tailored perfectly for `withStructuredOutput` schema mapping.
- Because the Model doesn't generate conversation or write creative copy, a heavy parameter model is overkill and leads to latency.

### 3.3 Architecture Highlights & Key Engineering Decisions

**Why LLM extraction + deterministic engine instead of LLM function calling?**
LLMs are prone to hallucinations. Letting an LLM call database functions directly risks hallucinated timeslots, fabricated service names, or unpredictable software destruction. Slotify uses the LLM *only* as a structured parser to return a validated JSON object. The strict `DecisionEngine.js` file handles all verification.

**Why persist chat state in MongoDB instead of relying on massive Context Windows?**
Passing heavy conversation histories on every chat request is wasteful, slow, and fragile. Instead, Slotify maintains a typed JSON state object (`intent`, `collectedInfo`, `selectedSlot`) in MongoDB. The LLM only sees the last 6 turns. This protects against API Token Limits and makes the booking state machine entirely auditable.

**Why Refresh Token Rotation?**
Access tokens intentionally expire every 15 minutes to minimize systemic damage if stolen. When they expire, Axios intercepts the error to fetch a new token seamlessly using a long-lived refresh token in HTTP-only logic, which then destroys the old refresh token (Preventing rotation-reuse attacks).

### 3.4 Tech Stack
- **Frontend**: React 19 (Vite), React Router v7, Axios, Tailwind CSS v3, Lucide React
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **AI Integration**: Groq Cloud API, Langchain, Zod schemas
- **Auth**: JWT (jsonwebtoken), bcryptjs

---

## Part 4 — Edge Cases
*Every single edge case below is handled by the decision engine or validation layer — preventing the LLM from taking the wrong path.*

| # | Edge Case | How It's Handled | Layer |
|---|---|---|---|
| 1 | "Book this" with no context | State is null → decision engine asks 'What service would you like to book?' | Decision Engine |
| 2 | Ambiguous time | LLM resolves via strict prompt maps: "evening"→18:00, "morning"→09:00 | LLM Prompt |
| 3 | Past date requested | `isDateInPast()` validation blocks DB queries → rejected with human feedback | Service Layer |
| 4 | Exact slot requested is taken | `findNearestAlternatives()` calculates the closest open timeslots | SlotGenerator |
| 5 | Mid-flow "Stop" user exit | UI / NLP triggered `RESET` intent completely wipes the state clean | NLP + Engine |
| 6 | Broken / Invalid Email | LLM Zod enforces structure → returns `null` if broken → Engine re-asks | Zod Schema |
| 7 | Duplicate Booking (same exact email/slot) | `findOne` lock prevents `Appointment.create()` → graceful error thrown | Service Layer |
| 8 | LLM completely crashes | `try-catch` falls back to `CHITCHAT` intent mapping → stops app from crashing | AI Service |
| 9 | Duplicate Admin Services | Mongoose unique indices block duplicate slugs → 409 Conflict | MongoDB |
| 10 | Session expiry during booking | TTL collection expires memory natively after 2h | MongoDB |

---

<div align="center">
Built natively with Node.js, React, Mongoose, and Groq Cloud
</div>
