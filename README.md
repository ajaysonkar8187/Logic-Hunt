# Logic Hunt 🧠

A production-quality QR-based logic challenge platform for university orientation programs. Students scan a QR code, register, solve timed logic questions, and compete for the highest score.

## Features

- **11 question types**: MCQ, multi-select, riddles, ciphers, ordering, pattern recognition, and more
- **Per-question timers**: Each question auto-advances when its timer expires
- **Anti-cheating**: Tab-switch detection, fullscreen enforcement, copy/paste blocking, activity logging
- **Live leaderboard**: Real-time admin dashboard with rankings and analytics
- **QR code generation**: Auto-generate scannable QR codes for event registration
- **CSV export**: Export participant data, scores, and rankings
- **Dark/light mode**: System-aware theme with manual toggle
- **Mobile responsive**: Works on phones, tablets, and desktops

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth.js
- **State**: Zustand
- **Animations**: Framer Motion + canvas-confetti

---

## Setup Instructions

### 1. Clone and install

```bash
git clone <your-repo-url>
cd logic-hunt
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DATABASE_URL="postgresql://user:password@host:5432/logichunt?sslmode=require"
NEXTAUTH_SECRET="generate-a-random-32-char-string"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@logichunt.com"
ADMIN_PASSWORD="admin123"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Set up database

**Option A: Neon (recommended for production)**
1. Create a free database at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL`

**Option B: Local PostgreSQL**
```bash
createdb logichunt
# Use: DATABASE_URL="postgresql://localhost:5432/logichunt"
```

### 4. Run migrations and seed

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Default Credentials

| Role  | Email                  | Password |
|-------|------------------------|----------|
| Admin | admin@logichunt.com    | admin123 |

---

## Usage Guide

### Admin Flow

1. Go to `/login` → sign in with admin credentials
2. **Dashboard**: View analytics, stats, and score distribution
3. **Events**: Create events, set time limits, start/stop competitions
4. **Questions**: Add, edit, duplicate, delete questions; search and filter
5. **Participants**: View all participants, export CSV
6. **Leaderboard**: Live rankings auto-refresh every 5 seconds
7. **QR Code**: Generate and download QR codes for event registration

### Student Flow

1. Scan QR code → lands on `/event/{slug}/login`
2. Enter name and email → proceeds to rules screen
3. Accept rules → begins timed exam
4. Answer questions with Previous/Next navigation
5. Each question has its own countdown timer
6. Auto-submits when global timer expires
7. Sees "Thank you" screen (no scores shown)

---

## Project Structure

```
logic-hunt/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   ├── (auth)/login/      # Admin login
│   │   ├── (admin)/           # Admin panel (dashboard, events, questions, etc.)
│   │   ├── (student)/event/   # Student flow (login, rules, exam, thank-you)
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── exam/              # Question renderer
│   │   └── shared/            # Theme provider, toggle
│   ├── lib/
│   │   ├── prisma.ts          # DB client
│   │   ├── auth.ts            # NextAuth config
│   │   ├── scoring.ts         # Scoring engine
│   │   ├── store.ts           # Zustand state
│   │   ├── validators.ts      # Zod schemas
│   │   └── utils.ts           # Helpers
│   ├── types/                 # TypeScript types
│   └── styles/globals.css     # Tailwind + custom styles
```

---

## Deployment (Vercel)

1. Push code to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add all `.env` variables in Vercel dashboard → Settings → Environment Variables
4. Set `NEXTAUTH_URL` to your Vercel domain
5. Deploy

The `postinstall` script runs `prisma generate` automatically.

After first deploy, run the seed via Vercel CLI:
```bash
vercel env pull .env.local
npx prisma db push
npm run db:seed
```

---

## API Reference

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | /api/events           | List events                    |
| POST   | /api/events           | Create event                   |
| PUT    | /api/events           | Update event                   |
| DELETE | /api/events?id=       | Delete event                   |
| GET    | /api/questions        | List questions                 |
| POST   | /api/questions        | Create question(s)             |
| PUT    | /api/questions        | Update question                |
| DELETE | /api/questions?id=    | Delete question                |
| POST   | /api/exam             | Login, start, save, submit     |
| GET    | /api/leaderboard      | Get rankings                   |
| GET    | /api/admin/stats      | Dashboard statistics           |
| GET    | /api/admin/export     | Export CSV                     |

---

## License

MIT
