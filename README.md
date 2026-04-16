# Slotify — AI-Powered Appointment Booking Assistant

<div align="center">

**Replace clunky web forms with an intelligent, conversational booking experience.**

[![GitHub](https://img.shields.io/badge/GitHub-Slotify-181717?style=for-the-badge&logo=github)](https://github.com/githimanshu29/Slotify)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)

</div>

---

## 🔑 Admin Access (For Testing & Review)

To access the admin panel and add services according to your needs, please use the following credentials. Please log in with this exact email and password:

- **Email:** `admin@slotify.com`
- **Password:** `admin123`
- **Admin Secret Key:** `slotify-admin-secret-2026` *(Required to access the Admin Panel UI)*

*(Note: You must run `npm run seed` in the server directory first to populate this account).*

---

## What is Slotify?

Slotify is a modern, full-stack appointment booking system that replaces traditional date-pickers and long forms with an intelligent conversational interface. Users can seamlessly schedule, manage, and cancel their appointments by simply chatting with an AI assistant. 

Behind the scenes, the platform provides business owners with a robust, secured admin dashboard to manage service types, define specific weekly availability, and oversee all customer bookings. It is built to ensure zero AI hallucinations by combining natural language extraction with a deterministic, database-backed decision engine.

---

## Live Features

### Conversational Booking Pipeline
- Enter natural language commands (e.g., *"Book me a dentist slot for tomorrow at 10 AM"*).
- The AI seamlessly extracts intent, dates, times, and services.
- Multi-turn conversation support prompts users for any missing information before confirming.

### Deterministic AI Architecture
- LLM is used *strictly* for data extraction to JSON, never for making business decisions.
- Hard-coded Decision Engine handles all database validations, scheduling logic, and conflict resolutions.
- 100% guarantee against AI hallucinations double-booking or inventing non-existent services.

### Comprehensive Admin Dashboard
- Complete CRUD operations for **Services** (e.g., add Massage, Dentist, Therapy).
- Define precise **Availability Templates** per service (e.g., set Dentist to Mondays 9:00 AM - 5:00 PM in 30-min intervals).
- View, filter, and flexibly cancel user **Appointments**.

### Secure Authentication
- Dual-token JWT system with fast-expiring access tokens (15m) and long-lived refresh tokens (7d).
- Refresh tokens are securely rotated in the database to prevent replay and reuse attacks.
- Admin routes are secured by both JWT validation and a secondary API Secret Key.

### Modern Responsive UI
- Premium "Dark Cosmos" themed interface.
- Smooth animations, chat typing indicators, and a fully mobile-responsive design built with Tailwind CSS v3.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 (Vite) | UI framework + build tool |
| React Router v7 | Client-side routing |
| Axios | HTTP client with automatic token refresh interceptors |
| Tailwind CSS v3 | Utility-first styling for "Dark Cosmos" theme |
| Lucide React | Modern SVG iconography |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Primary cloud database |
| JWT | Access + refresh token authentication |
| bcryptjs | Secure password hashing |

### AI Core
| Technology | Purpose |
|---|---|
| Groq Cloud API | Ultra-fast inference (`llama-3.3-70b-versatile`) |
| Zod | Strict schema validation for LLM JSON outputs |

---

## Project Architecture

```text
Slotify/
├── client/                          # React frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx            # User & Admin login
│       │   ├── Register.jsx         # New user signup
│       │   ├── Chat.jsx             # Conversational booking UI
│       │   └── AdminDashboard.jsx   # Service & availability management
│       ├── components/
│       │   ├── ProtectedRoute.jsx   # Auth guard for routes
│       │   └── Sidebar.jsx          # App navigation
│       ├── context/
│       │   └── AuthContext.jsx      # Global auth state provider
│       └── api/
│           └── axios.js             # Axios instance + interceptors
│
└── server/                          # Node.js + Express backend
    ├── server.js                    # Entry point
    └── src/
        ├── models/
        │   ├── User.js              # Auth & Roles
        │   ├── Service.js           # Bookable services
        │   ├── AvailabilityTemplate.js # Weekly schedules
        │   ├── Appointment.js       # Confirmed bookings
        │   └── ChatSession.js       # Persistent chat memory
        ├── controllers/
        │   ├── authController.js    # JWT logic
        │   ├── chatController.js    # AI processing entry
        │   └── adminController.js   # Admin CRUD operations
        ├── chat/
        │   └── decisionEngine.js    # Deterministic booking logic
        ├── services/
        │   ├── llm/
        │   │   └── intentExtractor.js # Groq API + Zod schema
        │   ├── booking/
        │   │   ├── availabilityService.js
        │   │   ├── bookingService.js
        │   │   └── slotGenerator.js # Generates 30-min intervals
        │   └── session/
        │       └── sessionService.js # Chat state merging
        └── middleware/
            ├── authMiddleware.js    # JWT verification
            └── adminAuth.js         # Secret key validation
```

---

## User Flow

```text
1. Auth Gateway
   └── Register / Login

2. Admin Flow (Requires Admin Key)
   ├── Admin Dashboard
   │   ├── Services Tab → Create "Dentist" (30 min duration)
   │   ├── Availability Tab → Set Mon-Fri, 9am to 5pm for "Dentist"
   │   └── Appointments Tab → Monitor all bookings

3. User Booking Flow
   ├── Chat Interface
   │   ├── User: "I need a dentist tomorrow morning"
   │   ├── AI Intent Extractor: { intent: "BOOK", service: "dentist", time: null }
   │   ├── Decision Engine: "What exact time works for you between 9:00 and 12:00?"
   │   ├── User: "10:00 AM"
   │   ├── AI Intent Extractor: { time: "10:00" }
   │   └── State Merged → Availability Checked → Slot Reserved
   └── Confirmation: "Booking APT-7K3X confirmed!"

4. Management Flow
   └── User: "Show my bookings" or "Cancel booking APT-7K3X"
```

---

## Key Engineering Decisions

### 1. Why deterministic AI instead of LLM function calling?
LLMs are prone to hallucinations. If an LLM directly queries the database or creates records, it might invent fake timeslots or book invalid services. Slotify uses Groq strictly to parse natural language into structured JSON. The hardcoded, pure-Javascript `DecisionEngine` evaluates that JSON to make database lookups, ensuring 100% booking accuracy.

### 2. Why persist chat state in MongoDB?
Instead of passing unstructured message arrays to the LLM, the `ChatSession` model stores a strict `State` object (e.g., `{ service: "dentist", time: null }`). By selectively merging new extractions into this state over multiple turns, the system effectively manages memory without relying on massive LLM context windows.

### 3. Why Refresh Token Rotation?
Access tokens expire every 15 minutes to minimize damage if stolen. When they expire, the Axios interceptor sends the refresh token to the server. The server issues a *new* access token AND a *new* refresh token, invalidating the old one. If anyone attempts to use the old, stolen refresh token, the system detects a replay attack and forces a re-login.

### 4. Why a secondary Admin Key?
Admin accounts technically hold the same JWT structure as normal users (plus a role flag). Adding an `ADMIN_KEY` environment variable that must be passed via HTTP headers adds a secondary layer of "something you know" security to all administrative CRUD routes.

---

## API Reference

### Auth Routes
```text
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login + get tokens
POST   /api/auth/refresh           Refresh access token + rotate refresh token
POST   /api/auth/logout            Logout + clear refresh token
```

### Chat Routes
```text
POST   /api/chat                   Send message to AI assistant
```

### Admin Routes (Protected by JWT + Admin Key)
```text
GET    /api/admin/appointments     Get all bookings (paginated)
PATCH  /api/admin/appointments/:id Cancel a booking
GET    /api/admin/services         List all services
POST   /api/admin/services         Create new service
POST   /api/admin/availability     Set day/time template for a service
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account 
- [Groq AI API key](https://console.groq.com/)

### 1. Clone the repository
```bash
git clone https://github.com/githimanshu29/Slotify.git
cd Slotify
```

### 2. Server setup
```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/test
GROQ_API_KEY=your_groq_api_key

JWT_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
ADMIN_KEY=slotify-admin-secret-2026
```

### 3. Seed Database (Required)
This clears old data and creates the default Admin and Test user accounts.
```bash
npm run seed
```

Start the backend:
```bash
npm run dev
```

### 4. Client setup
In a new terminal:
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Author

**Himanshu**
Third-year undergraduate | Full Stack + GenAI Engineer

[![GitHub](https://img.shields.io/badge/GitHub-githimanshu29-181717?style=flat&logo=github)](https://github.com/githimanshu29)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/himanshu-kumar)

---

## License

MIT License — feel free to use this project as inspiration or reference.

---

<div align="center">
Built with Node.js, React, MongoDB, and Groq AI Inference
</div>
