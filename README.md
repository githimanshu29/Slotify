# 📅 Slotify — AI-Powered Appointment Booking Assistant

Slotify is a modern, full-stack appointment booking system that replaces clunky web forms with an intelligent conversational interface. Users can seamlessly schedule, manage, and cancel their appointments by simply chatting with an AI assistant. It also features a complete, secure admin dashboard for business owners to manage services and availability.

## To access admin panel -> to add services according to admin, pls use following credentials:
- **Email:** `admin@slotify.com` (pls login with this exact email and password)
- **Password:** `admin123`
- **Admin Secret Key:** `slotify-admin-secret-2026` (this key needed to acces admin panel)

![Slotify Demo](https://img.shields.io/badge/Status-Completed-success) ![Tech](https://img.shields.io/badge/Stack-MERN-blue)

## ✨ Features

- **Conversational Booking Pipeline**: Users chat naturally to schedule an appointment (e.g., *"Book me a dentist slot for next Monday at 10 AM"*). The AI seamlessly extracts missing information and guides the user.
- **Deterministic AI Architecture**: The system uses a Large Language Model (Groq Llama-3) *strictly* for data extraction (Natural Language → JSON). All database validation, scheduling logic, and conflict resolution are handled by a hard-coded deterministic engine to guarantee zero AI hallucinations.
- **Robust Admin Dashboard**: Administrators have a dedicated, protected UI to:
  - Add, edit, or disable **Services** (e.g., Massage, Dentist).
  - Define **Availability Templates** per service (e.g., Mondays 9:00 AM - 5:00 PM in 30-min slots).
  - View, filter, and cancel user **Appointments**.
- **Secure Authentication**: Implements a dual-token JWT system (short-lived access tokens with secure refresh token rotation) and bcrypt password hashing. Admin routes are double-protected with an API secret key.
- **Modern Responsive UI**: A premium, "Dark Cosmos" themed interface featuring smooth animations and tailwind-powered responsive design.

## 🛠️ Tech Stack

**Frontend:**
- React 19 (Vite)
- Tailwind CSS v3
- Axios (with interceptors for auto-token refresh)
- React Router v7
- Lucide React (Icons)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) & bcryptjs

**AI & Engine:**
- Groq Cloud API (`llama-3.3-70b-versatile`)
- Zod (for strict LLM schema validation)

## 🏗️ Architecture & Insights

Slotify solves a major problem with AI chatbots: **hallucinations**. By explicitly separating the AI parsing from the business logic, the system is reliable.

1. **Extract**: User message → `extractIntent()` via Groq LLM → Returns strict JSON using `zod`.
2. **Merge**: The extracted entities are merged into a persistent MongoDB `ChatSession`.
3. **Decide**: A hardcoded `DecisionEngine` evaluates the exact state of the session. If fields are missing (e.g., time), it asks for them. If all fields are present, it cross-references the MongoDB `AvailabilityTemplates` and existing `Appointments` to find conflicts.
4. **Execute**: The user confirms the final timeslot, and the booking is securely saved to the database.

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB Database URI
- [Groq API Key](https://console.groq.com/) for the AI models

### 1. Setup Backend
```bash
cd server
npm install

# Create a .env file based on environment requirements:
# MONGO_URI=your_mongo_url
# GROQ_API_KEY=your_groq_key
# JWT_SECRET=secret1
# JWT_REFRESH_SECRET=secret2
# ADMIN_KEY=slotify-admin-secret-2026
```

### 2. Seed the Database
Run the seeder to populate default Admin and User accounts, and clear out old test data.
```bash
npm run seed
```

### 3. Setup Frontend
```bash
cd ../client
npm install
```

### 4. Run the Application
You will need two terminals to run both client and server simultaneously.
```bash
# Terminal 1 - Backend (localhost:5000)
cd server
npm run dev

# Terminal 2 - Frontend (localhost:5173)
cd client
npm run dev
```

## 🧪 Testing the Application

If you ran the `seed` script, you can immediately test the application using the following mock credentials.

**Test Admin Flow:**
- **Email:** `admin@slotify.com`
- **Password:** `admin123`
- **Admin Secret Key:** `slotify-admin-secret-2026` (Enter this when clicking "Admin Panel" in the sidebar)
- *Once inside, try creating a Service and assigning it Weekly Availability so users can book it!*

**Test User Chat Flow:**
- **Email:** `test@slotify.com`
- **Password:** `test123`
- *Type: "Show my bookings", or try booking a new appointment for a service the Admin created!*
