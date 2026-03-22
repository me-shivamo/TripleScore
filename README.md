# TripleScore — Frontend

AI-powered JEE prep platform frontend. Built with **Next.js 14 App Router**, **TypeScript**, **Firebase Auth**, and **Tailwind CSS**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Auth | Firebase Google OAuth |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Data fetching | TanStack React Query v5 |
| Charts | Recharts |
| Icons | Lucide React |

---

## Project Structure

```
TripleScore-Frontend/
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   └── login/         # Google sign-in page
    │   ├── (app)/             # Protected app shell (sidebar + topbar)
    │   │   ├── layout.tsx     # Auth guard + onboarding redirect
    │   │   ├── dashboard/     # JEE Readiness Score, missions, quick stats
    │   │   ├── chat/          # Nova AI chat (onboarding + companion mode)
    │   │   ├── diagnostic/    # Two-test diagnostic flow
    │   │   ├── practice/      # Practice sessions (coming soon)
    │   │   ├── mocks/         # Mock test upload & analysis (coming soon)
    │   │   ├── analytics/     # Performance charts (coming soon)
    │   │   └── leaderboard/   # Leaderboard (coming soon)
    │   ├── layout.tsx         # Root layout, React Query provider
    │   └── globals.css        # Global styles
    ├── components/
    │   ├── ui/                # shadcn/ui base components (Button, Card, Badge, …)
    │   ├── layout/            # Sidebar, TopBar, MobileNav, Providers
    │   ├── dashboard/         # ReadinessScore, MissionCard, QuickStats
    │   ├── nova/              # ChatWindow, ChatInput, MessageBubble, OnboardingChat, …
    │   └── diagnostic/        # ChapterSelector, QuizScreen, TestResults, FinalSummary, …
    ├── hooks/
    │   ├── useAuth.ts         # Firebase onAuthStateChanged wrapper
    │   └── useNovaChat.ts     # Streaming chat state machine
    ├── services/              # API call functions per domain
    │   ├── auth.ts            # login()
    │   ├── dashboard.ts       # getDashboard()
    │   ├── nova.ts            # getOnboardingStatus(), getHistory()
    │   └── diagnostic.ts      # startDiagnostic(), getQuestions(), submitDiagnostic(), skipDiagnostic()
    ├── types/
    │   └── api.ts             # TypeScript interfaces for all API responses
    └── lib/
        ├── api-client.ts      # apiFetch / apiStream (attaches Firebase token)
        ├── firebase.ts        # Firebase client SDK config
        └── utils.ts           # cn() utility
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- TripleScore Backend running at `http://localhost:8000`
- Firebase project (client config keys)

### Setup

```bash
cd TripleScore-Frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and fill in your values (see Environment Variables below)

# Start the dev server
npm run dev
```

The app is now running at `http://localhost:3000`.

---

## Environment Variables

Create a `.env` file in the repo root (copy from `.env.example`):

```env
# Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase client config (from your Firebase project settings)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:abc123
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Auth Flow

1. User clicks "Get started" → Google sign-in popup (Firebase)
2. Firebase returns an ID token
3. Frontend calls `POST /auth/login` on the backend to upsert the user record
4. Every subsequent API request sends `Authorization: Bearer <id_token>` (refreshed automatically by `api-client.ts`)
5. On load, the app checks `/nova/onboarding-status` to route the user to either the onboarding chat or the main dashboard
