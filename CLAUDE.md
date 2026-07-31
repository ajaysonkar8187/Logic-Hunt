# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install            # also runs `prisma generate` via postinstall
npm run dev             # start dev server at localhost:3000
npm run build            # production build (type-checks — see gotcha below)
npm run lint

npm run db:generate       # regenerate Prisma client after schema.prisma changes
npm run db:push          # push schema.prisma to the database (no migration files)
npm run db:migrate        # `prisma migrate dev` — NOT the normal workflow here, see below
npm run db:seed          # tsx prisma/seed.ts — creates admin, one event, 10 questions
npm run db:studio        # Prisma Studio GUI
```

There is no test suite/framework configured in this repo.

Requires a `.env` (copy from `.env.example`): `DATABASE_URL` (Postgres, e.g. Neon), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (used by the seed script).

`prisma/migrations/` is gitignored — this project uses `db:push` (schema push) as its standard workflow, not `prisma migrate dev`. Don't introduce migration files unless deliberately switching workflows.

## Architecture

Next.js 14 App Router, three route groups under `src/app/`:
- `(auth)/login` — admin sign-in (NextAuth)
- `(admin)/*` — dashboard, events, questions, participants, leaderboard, qrcode (protected admin panel)
- `(student)/event/[slug]/*` — public flow: `login` → `rules` → `exam` → `thank-you`

**Two completely separate identity systems, no unified user model:**
- Admins authenticate via NextAuth (`src/lib/auth.ts`), Credentials provider only, JWT session strategy, checked against the `Admin` table with bcrypt.
- Students are *not* authenticated at all. `POST /api/exam` (`action: "login"`) just creates a `Participant` row and returns its id; the client stores `participantId` in a Zustand store (`src/lib/store.ts`) and sends it back on every subsequent call. There is no server-side session/cookie tying a request to that participant — any request with a valid `participantId` is trusted. Keep this in mind before adding participant-scoped features that assume auth.

**API route style is inconsistent by design** — `src/app/api/{events,questions}/route.ts` are REST-ish (GET/POST/PUT/DELETE, id via query param or body), while `src/app/api/exam/route.ts` is a single POST endpoint dispatching on a body `action` field (`login | start | save-answer | submit | violation`). Follow whichever pattern the file you're editing already uses.

**Scoring is server-authoritative and centralized** in `src/lib/scoring.ts` (`scoreAnswer`/`scoreExam`), called both on each autosave (`save-answer`, fires every 10s from the exam page) and again on final `submit`. The client never computes its own score. `MULTI_SELECT` and `MATCH_PAIRS` support partial credit; everything else is all-or-nothing.

**`QuestionType` has 11 enum values but the renderer only implements 4 UI shapes.** `src/components/exam/question-renderer.tsx` handles: radio-style (`MCQ`/`RIDDLE`/`PATTERN`/`LOGICAL`/`IMAGE_PUZZLE`), checkboxes (`MULTI_SELECT`), free text (`CIPHER`), and drag-free reorder (`ORDERING`). `SUDOKU`, `SPOT_DIFF`, and `MATCH_PAIRS` have schema/scoring support (`scoreAnswer` has a `MATCH_PAIRS` branch) but silently fall back to a generic text input in the renderer — if you add UI for one of these, `scoring.ts` and `validators.ts` are already expecting it.

**Per-student question/option order is deterministic, not random.** `src/app/(student)/event/[slug]/exam/page.tsx` seeds `seededShuffle` (`src/lib/utils.ts`, LCG-based Fisher-Yates) with a hash of `participant.id`, so a given student always sees the same order across reloads, but different students see different orders — a lightweight anti-collusion measure, not true randomization.

**Anti-cheat is detection-only, not enforcement.** Tab-switch, window-blur, devtools-shortcut, and copy/paste/context-menu attempts (same exam page) are logged as `Violation` rows and shown as a count badge to the student and in the admin dashboard — they never block submission or auto-fail the student.

**Exam progress lives only in client memory** (`src/lib/store.ts`, Zustand, unpersisted). A hard refresh mid-exam resets `studentInfo` and the whole `exam` slice, bouncing the student back to `/login` — only answers that already made it through an autosave tick are safe server-side.

**Tailwind theme wiring is load-bearing.** `src/styles/globals.css` defines shadcn/ui-style CSS variables (`--background`, `--border`, `--primary`, etc.) and applies `@apply border-border` / `bg-background text-foreground` globally. `tailwind.config.ts` must map every one of these to `hsl(var(--x))` under `theme.extend.colors` — if a variable's color mapping is ever missing, the *entire* build fails (webpack CSS error at `@tailwind base`, not just an unstyled element).

**`next.config.js`** sets strict security headers (CSP, `X-Frame-Options: DENY`, etc.) on every route — factor this in if adding embeds, external scripts, or iframes.

## Deployment (Vercel)

`NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` must point at the stable production alias domain (e.g. `https://logic-hunt.vercel.app`), never a per-deployment preview URL — those sit behind Vercel's own SSO/authentication wall and are unreachable by students scanning the QR code. `src/app/(admin)/qrcode/page.tsx` builds its QR link from `NEXT_PUBLIC_APP_URL` for exactly this reason; don't change it back to `window.location.origin`.

`@types/canvas-confetti` must stay installed as a dev dependency — `next build` type-checks the codebase in a way `next dev` does not, and `canvas-confetti` (used in the thank-you page) ships no bundled types.
