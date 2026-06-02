# LeapStart Experiential Portal & Portfolio Feed

Welcome to the **LeapStart Experiential Powerhouse** platform. This application replicates the branding, design guidelines, typography, and light mode aesthetic modeled after [LeapStart India](https://leapstart.in/), bundled with an interactive public Student Showcase, live critique feedback reviews, star-ratings integration, and a secure multi-role administrative gateway.

---

## 🚀 Key Features

- **LeapStart Replica Home**: A pixel-perfect rendering of India's First Experiential Learning Powerhouse, incorporating LeapStart's pedagogy framework, the 4-year structured curriculum grid, interactive FAQ hubs, and direct CTA links.
- **Dynamic Light/Dark Theme Switcher**: Starts on the official LeapStart clean white layout on page load with an easy-to-use toggle button to transition smoothly to a midnight-slate theme on request.
- **Student Portfolio & Feed**: Enables students to publish reverse-engineered applications, and allows classmates, faculty mentors, external guest reviewers, or HR coordinators to submit Star Ratings (1-5) and written feedback logs instantly.
- **Role-Based Workspaces**: Fully integrated environments for Students, Academic Mentors, HR coordinators, and Founders with built-in telemetry registers, on-campus attendance desks, leave coordinators, and dual-peer confidential chatrooms.
- **SMTP Sandbox Interceptor**: Intercepts pass-codes and OTP recovery metrics inside a mock visual console directly inside the login pop-up, completely bypassing standard SMTP delays for instant verification testing.
- **Secure Server-Side AI Chatbot**: Powered. directly by a server-side Gemini integration, acting as an experiential virtual teaching guide and answering student queries on course blueprints, databases, or project highlights.

---

<h2>Preview:</h2>
<img width="2926" height="1676" alt="image" src="https://github.com/user-attachments/assets/998c175b-4ea9-4f5b-8182-abb83d8c8861" />


## 🔐 Environment Variables Configuration

This codebase is configured to run securely using server-side environments to fully shield sensitive tokens (such as Gemini keys). 

Copy `.env.example` to a new `.env` file in the project root:

```bash
cp .env.example .env
```

Define the parameters inside your `.env` file:

```env
# Server Port Configuration
# Note: The housing system restricts incoming ports. Maintain port 3000.
PORT=3000

# Server-Side Secure Gemini API Key
# DO NOT PREFIX WITH "VITE_". This remains highly hidden on the Express server.
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🛠️ Local Development Setup

To run this application locally, ensure you have **Node.js (v18+)** and **npm** installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Secrets
Ensure you have set your `GEMINI_API_KEY` inside `.env` as guided above.

### 3. Run the Development Server
This boots up the full-stack system incorporating the custom Express API gateway proxy and the Vite frontend listener synchronously:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your web browser.

### 4. Code Formatting & Validation
To lint and verify TypeScript types:
```bash
npm run lint
```

To run a production-ready application build:
```bash
npm run build
```

---

## 📂 Project Architecture

```text
├── server.ts                    # Express Full-Stack Server, JSON Database API, and Gemini Proxy
├── src/postgresDb.ts            # Local Postgres persistence layer, table setup, and seed data
├── src/
│   ├── App.tsx                  # Main App Router, Layout framing, and Light/Dark controller
│   ├── types.ts                 # Clean TypeScript global definitions (User profiles, Projects, Ratings)
│   ├── data.ts                  # Seed user indices, attendance templates, and leave requests
│   └── components/
│       ├── LoginScreen.tsx      # Replica LeapStart home, FAQs, and password recovery simulation
│       ├── ProjectShowcase.tsx  # Interactive public portfolio feed, rating submitters, and filters
│       ├── Sidebar.tsx          # Navigational console framework for authenticated members
│       ├── StudentDashboard.tsx # Check-in card, personal metrics charts, and leaf request lists
│       ├── MentorDashboard.tsx  # Class roster rosters, leave review hubs, and corporate lists
│       └── ChatbotWidget.tsx    # Live Gemini AI support widget with floating dialog mechanics
```

---

## 🎯 Test Credentials (Fast Pass Logins)

The portal modal is preconfigured with fast-pass validation triggers. Click any of the shortcut links on the login pop-up to test instant entries:
* **Student Demo**: `aadhira@leapstart.gmail.com` (Password: `aadhira@123`)
* **Mentor Demo**: `suhas@leapstart.gmail.com` (Password: `suhas@123`)
* **HR Coordinator**: `yuktha@leapstart.gmail.com` (Password: `yuktha@123`)
* **Founder Demo**: `saikrishna@leapstart.gmail.com` (Password: `saikrishna@123`)
