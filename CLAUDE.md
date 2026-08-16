# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Two independent npm packages, no workspace root: `backend/` (Express 5 + Prisma 7 + SQLite) and `frontend/` (React 19 + Vite + Tailwind v4). Install and run each separately.

## Commands

Backend (`cd backend`):
```bash
npm run dev          # tsx src/server.ts — API on http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run build        # tsc -> dist/
npx prisma migrate dev --name <name>   # create + apply migration, regenerates client
npx prisma generate  # regenerate client into src/generated/prisma
npx prisma studio
```

Frontend (`cd frontend`):
```bash
npm run dev          # Vite dev server (default :5173)
npm run lint         # eslint .
npm run build        # tsc -b && vite build
```

No test framework is configured in either package.

### DATABASE_URL gotcha

`.env` is gitignored and not present. `src/prismaClient.ts` falls back to `file:./dev.db`, so `npm run dev` works without it — but `prisma.config.ts` passes `process.env["DATABASE_URL"]` straight through with no fallback, so **every `npx prisma` command fails unless `DATABASE_URL` is set** (`DATABASE_URL="file:./dev.db"` in `backend/.env`).

The generated Prisma client is committed under `backend/src/generated/prisma/` and imported directly by `prismaClient.ts`. Re-run `prisma generate` and commit the output after schema changes.

## Domain model

Content hierarchy: `Subject` + `Grade` → `Lesson` → `Quiz` → `QuestionPair` → `Question` → `Option`.

**`QuestionPair` is the central concept.** The game is head-to-head between exactly two players. Each pair carries the shared round metadata (`question_order`, `timer_seconds`, `difficulty`) and holds exactly two `Question` rows distinguished by `player_set`: `"A"` for player slot 1, `"B"` for player slot 2. The two players never see the same question — they see the parallel question from the same pair. Every question has exactly 4 options with exactly one `is_correct`. The `player_set` ↔ `player_slot` mapping (`slot 1 → "A"`, `slot 2 → "B"`) is recomputed inline in several controllers.

## Backend architecture

`routes/*.routes.ts` → `controllers/*.controller.ts` → `prisma` singleton. Controllers hold all validation inline and wrap bodies in try/catch returning `{ message }` JSON; there is no error middleware and no request-validation library. The only service is `services/publishValidation.service.ts`.

### Quiz publish gate

`status` goes `"draft"` → `"published"`. `validateQuizForPublish()` is the single choke point and enforces: title present; lesson/subject/grade resolvable; `question_pairs.length === quiz.questions_per_player`; positive timer per pair; both A and B questions per pair and nothing else; non-empty text and explanation; exactly 4 options with exactly 1 correct and no empty option text. Only published quizzes can start a session. Add new authoring invariants here rather than in controllers.

### Game session state machine

`GameSession` holds the whole turn cursor: `current_player_slot` and `current_question_order`. There is no websocket or polling — the frontend drives the flow and the server re-validates every request against the cursor.

- `POST /api/game-sessions/start` — creates the session with both `SessionPlayer` rows, `status: "in_progress"`, slot 1 / order 1.
- `GET .../player/:playerSlot/questions` — returns the whole ordered list of that player's questions with options (correct flags stripped via `select`). Rejects unless session is in progress and it is that slot's turn.
- `POST .../answer` and `.../timeout` — each rejects unless: session in progress, slot's turn, question's `player_set` matches the slot, the pair belongs to this session's quiz, and (answer only) the pair's `question_order` equals `current_question_order`. Both create a `PlayerAnswer` (unique per `session_player_id` + `question_id`, so replays 409) and increment `current_question_order`.
- `POST .../finish` — requires answer count `=== questions_per_player` **and** `current_question_order === questions_per_player + 1`. For slot 1 it resets the cursor to slot 2 / order 1; for slot 2 it just stamps `completed_at`.
- `GET .../results` — requires both players to have `completed_at`, computes winner/tie by correct count, and **mutates** the session to `completed` (a GET with a write side effect; calling it twice is tolerated but the state change is not idempotent-looking).

## Frontend architecture

Routing lives entirely in `src/App.tsx`; two areas: `/teacher/*` (authoring: Dashboard → GameForm → QuestionPairEditor) and `/game/*` (play: StartScreen → PlayerSetup → Instructions → PlayerIntro → QuestionScreen → FinalResults).

- All server access goes through `src/services/api.ts`, which hardcodes `API_BASE_URL = "http://localhost:3000/api"` (no env var, no Vite proxy). CORS is wide open on the backend.
- There is no `GET /quizzes/:id`; `getQuizById()` fetches the full list and filters client-side.
- Player names are passed between screens via react-router `location.state` (`PlayerSetup` → `PlayerIntro`), not the URL — deep-linking into `/game/:quizId/start-session` shows "بيانات اللعبة غير مكتملة".
- `QuestionScreen` runs the countdown client-side and tracks its own `currentIndex` while the server independently tracks `current_question_order`. Any change to answer/timeout submission must keep the two cursors advancing together, or subsequent submits fail with "This is not the current question".
- Server state lives in `useState` per page with `any` types — no data-fetching library, no shared store.

## UI conventions

The product UI is Arabic and right-to-left. `index.html` is `lang="en"` with no `dir`; each page sets `dir="rtl"` on its own root element. Styling is Tailwind v4 utility classes only, wired through the `@tailwindcss/vite` plugin with `@import "tailwindcss"` in `src/index.css` — there is no `tailwind.config.js` and no PostCSS config. New user-facing strings should be Arabic; error strings surfaced from the API are English and rendered as-is.
