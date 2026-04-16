# 📅 Slotify — AI-Powered Appointment Booking Assistant

Slotify is a full-stack, AI-driven appointment booking system. It allows users to schedule, manage, and cancel appointments using natural language, while providing administrators with a robust dashboard to manage services, availability, and bookings.

This project was built to fulfill the requirements of the **AI-Powered Appointment Booking Assistant** assignment.

---

## 🚀 Quick Start for Reviewers

To test the admin functionality and the AI booking engine, use the following credentials:

**Admin Account:**
- **Email:** `admin@slotify.com`
- **Password:** `admin123`
- **Admin Secret Key:** `slotify-admin-secret-2026` *(Required to access the Admin Panel UI)*

**Test User Account:**
- **Email:** `test@slotify.com`
- **Password:** `test123`

### Running the Project Locally

1. **Clone the repository**
2. **Setup Server:**
   ```bash
   cd server
   npm install
   # Ensure your .env file is configured with MongoDB URI and GROQ_API_KEY
   npm run seed  # Seeds the admin and test users
   npm run dev   # Starts backend on http://localhost:5000
   ```
3. **Setup Client:**
   ```bash
   cd client
   npm install
   npm run dev   # Starts frontend on http://localhost:5173
   ```

---

## 📄 Part 1: Problem Understanding (Abstract)

*Note: This section is written entirely without the use of AI tools, as per assignment requirements.*

The traditional appointment booking process is often rigid, requiring users to navigate clunky web forms, select from tiny dropdown menus, and manually match their schedules with available slots. This creates friction, especially on mobile devices, and lacks the personalized touch of interacting with a human receptionist. Conversely, for businesses, managing schedules and service offerings requires a dedicated backend system that is often disconnected from the user-facing booking interface.

Slotify solves this by introducing a conversational interface for users and a deterministic management dashboard for administrators. The core problem being addressed is **reducing the friction of scheduling**. By allowing users to type natural phrases like, "Book a dentist appointment for tomorrow morning," the cognitive load is shifted from the user to the system. 

The key user flows are divided into two distinct roles:
1. **The Customer Flow:** A user logs in, chats with the AI assistant to either book, list, or cancel an appointment. The AI seamlessly guides them through missing information (e.g., "What time works best?"), checks real-time database availability, and confirms the booking.
2. **The Admin Flow:** A business owner logs in, navigates to a secure dashboard, and handles CRUD operations for the services they offer (e.g., Dentist, Massage), defines specific weekly availability schedules for those services, and views or cancels customer appointments.

By decoupling the natural language extraction from the hard database logic, Slotify ensures that bookings are both effortlessly conversational and strictly reliable.

---

## 🏗️ Part 2: Spec & Plan

### 1. System Design (High-Level)
The system follows a classic client-server architecture with a crucial middle layer for AI processing.
*   **Frontend:** React (powered by Vite) with Tailwind CSS v3 for a responsive, dark-themed UI.
*   **Backend:** Node.js with Express.
*   **Database:** MongoDB Atlas (accessed via Mongoose).
*   **AI Engine:** Groq API running the `llama-3.3-70b-versatile` model.
*   **Authentication:** Dual JWT system (15m Access Token, 7d Refresh Token) with bcrypt for password hashing. Admin routes are double-protected with an API secret key.

**The Request Lifecycle:**
`Browser → Axios → Express (/api/chat) → Groq LLM (Intent Extraction) → Decision Engine (State Merge & DB Lookup) → Express Response → Browser`

### 2. Feature Breakdown
*   **JWT Authentication:** Secure login/register with automatic silent token refresh on expiration.
*   **Conversational Booking:** Book, list, and cancel appointments via a chat UI.
*   **Deterministic State Machine:** The AI *only* extracts data; a hardcoded decision engine handles the database logic, guaranteeing no hallucinatory bookings.
*   **Admin Dashboard:** 
    *   *Services Tab:* Add, edit, and deactivate services.
    *   *Availability Tab:* Set specific start/end times and slot durations per day, per service.
    *   *Appointments Tab:* View paginated bookings and cancel them.

### 3. Prompt Design
The system uses a strictly typed prompt design. Instead of asking the LLM to generate a conversational response, we instruct it to act purely as an **Intent Extractor**.

**Key Prompt Strategies:**
*   **Role Constraint:** *"You are an intent extractor... Return ONLY valid JSON..."*
*   **Temporal Context:** The daily date is injected into the prompt so the LLM can resolve relative terms like "tomorrow" or "next Monday" into exact ISO dates.
*   **Schema Enforcement:** We use `zod` to force the Groq API into `structured_output` mode, meaning the LLM must return exactly `{ intent, service, date, time, name, email, refCode }`. Nulls are strictly enforced for missing data.

### 4. Data Model
*   **Users:** `_id`, `name`, `email`, `password`, `role` (user/admin), `refreshToken`.
*   **ChatSessions:** Maintains conversational state across turns. Stores `userId`, `state` (current intent and collected info), and `history` (last 6 messages).
*   **Services:** `_id`, `name`, `description`, `duration`, `isActive`.
*   **AvailabilityTemplates:** `serviceId`, `dayOfWeek` (0-6), `startTime`, `endTime`, `slotDuration`.
*   **Appointments:** `serviceId`, `name`, `email`, `bookedFor` (precise Date object), `status` (CONFIRMED/CANCELLED), `refCode`.

### 5. Implementation Plan
1.  **Foundation:** Setup Express + MongoDB. Build User model and JWT Auth flow.
2.  **Admin Layer:** Build CRUD routes for Services and Availability templates.
3.  **Booking Logic:** Create the `AvailabilityService` to generate time slots based on templates and filter out already-booked slots.
4.  **AI Integration:** Implement Groq LLM to parse natural language into structured JSON.
5.  **Decision Engine:** Build the state-merging logic to handle multi-turn conversations.
6.  **Frontend:** Build responsive React UI for Chat and Admin panels.

---

## 🤖 Part 3: Implementation

We utilized AI coding assistants heavily to accelerate the development of standard boilerplate, UI scaffolding, and complex state management.

*   **Models Used:** Code was primarily generated and reviewed using **Claude 3.5 Sonnet** and **Claude 3 Opus** (via Google DeepMind's Antigravity agentic framework).
*   **Reasoning:** Claude 3.5 Sonnet excels at writing React components and Tailwind CSS quickly, while Opus is highly capable at reviewing complex architectural flows (like the 8-step Decision Engine pipeline) and ensuring MongoDB relations are correctly enforced.
*   **How it was used:** 
    *   *UI Generation:* Generating the Chat UI with typing indicators and sliding animations.
    *   *Refactoring:* Diagnosing a Tailwind v4 compilation error and seamlessly downgrading the React app to Tailwind v3 with PostCSS configuration.
    *   *Documentation:* Helping trace the precise data flow for the dry-run documentation.
*   **Tokens Used:** Estimated ~150k input tokens and ~40k output tokens across the development lifecycle.

---

## 🛡️ Part 4: Edge Cases Handled

1.  **LLM Hallucinations:** AI is not allowed to query the database. It only parses JSON. The `DecisionEngine.js` handles all business logic deterministically.
2.  **Double Bookings:** `BookingService.js` actively checks the database for existing `CONFIRMED` appointments for the exact datetime before creating a new one.
3.  **Token Theft:** Implemented Refresh Token Rotation. When a refresh token is used, a new one is generated and the old one is destroyed in the DB. If a stolen old token is reused, the system detects it and logs the user out.
4.  **Relative Dates:** If a user says "book for tomorrow", but it's 11:59 PM, the timezone difference could cause the wrong date. The system prompt dynamically injects `new Date().toISOString().split('T')[0]` on the server side so the LLM always anchors to the server's truth of "today".
5.  **Context Loss in Chat:** The `ChatSession` saves the last 3 turns of conversation (6 messages) so the LLM understands follow-ups. If the bot asks "What time?", and the user says "6pm", the LLM knows the intent is still `BOOK` based on history.
6.  **Missing Services:** If a user asks to book a "Haircut" but the admin hasn't created a Haircut service, the decision engine rejects it and lists the currently available services directly from the database.
