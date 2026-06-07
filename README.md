# Oper Credits — borrower portal demo

A minimal mortgage borrower portal: simulate → sign up → fill in a multi-step application → upload supporting documents. Built as a take-home; designed to fit a strict 2-hour cap with AI assistance.

**Stack**: FastAPI · SQLAlchemy async · Neon Postgres · Angular 18 (standalone, Tailwind) · Vercel (single project, Python serverless + static SPA).

## Live demo

URL will be filled in once Vercel finishes the first deploy.

## What's in / what's out

- ✅ Anonymous simulator with a real annuity calculation (Belgian-region-aware purchase costs)
- ✅ Email/password signup that **claims** the anonymous simulation via a one-time token
- ✅ JWT-secured dashboard, three-step application wizard (Property / Financials / Personal), submit
- ✅ Document upload (multipart) with bytes stored in Postgres `BYTEA`, required-doc slots derived server-side
- ✅ OpenAPI 3.1 contract auto-generated from Pydantic v2 → TypeScript types generated for the Angular client
- ❌ See [CUTS.md](./CUTS.md) for the full list of intentional cuts and why

## Architecture in 60 seconds

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Vercel (single project)                       │
│                                                                       │
│   ┌──────────────────────┐         ┌─────────────────────────────┐   │
│   │ Static SPA (Angular) │ ──fetch─▶│ Python serverless function │   │
│   │  web/dist/.../browser│         │  api/index.py → FastAPI     │   │
│   └──────────────────────┘         └──────────────┬──────────────┘   │
│                                                    │ asyncpg + SSL    │
└────────────────────────────────────────────────────┼─────────────────┘
                                                     ▼
                                            ┌────────────────┐
                                            │  Neon Postgres │
                                            └────────────────┘
```

- One Vercel project. `vercel.json` routes `/api/*` to the Python function and falls through to `index.html` for SPA routes.
- The FastAPI app is the **single source of truth for the wire contract** — `/openapi.json` is what the Angular client codegens against (`npm run gen:api`). No hand-written API.md to drift from.
- Documents live as bytes in Postgres (`BYTEA`). Trade-off accepted: simpler than object storage at the cost of larger DB rows. See [CUTS.md](./CUTS.md).

## Data model

See the class diagram in the project notes. In short:

```
User ─┬─< Simulation (anonymous-friendly; claim_token claims it on signup)
      └─< Application ──┬─< Borrower ──< Income
                        ├─< Expense
                        └─< Document  (bytes in BYTEA, optionally scoped to a borrower)
```

The application embeds a property snapshot (a real mortgage app **is** a frozen snapshot) instead of normalising into a separate Property table. Required document slots are **derived**, not stored — see `services/doc_requirements.py`.

## Run locally

Requires Python 3.12+, Node 18+, and a Postgres reachable somewhere (Neon's free tier works fine for local dev).

```bash
# Terminal 1: backend
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+asyncpg://USER:PASS@HOST/DB"
export JWT_SECRET="dev-secret-change-me"
uvicorn app.main:app --reload --port 8000

# Terminal 2: frontend
cd web
npm install
npm run gen:api          # codegens src/app/api/schema.d.ts from localhost:8000/openapi.json
npm start                # serves on localhost:4200, proxies are not configured —
                         # for local dev, set environment.apiBase to "http://localhost:8000" if you hit CORS
```

Tests:

```bash
cd api && source .venv/bin/activate && python -m pytest -q
```

## Deploy

GitHub → Vercel auto-deploys on push. For a fresh setup:

1. **Provision a database**: in the Vercel dashboard → Storage → connect a Neon Postgres. Vercel exposes `DATABASE_URL` automatically. Our `config.py` accepts the `postgresql://...?sslmode=require` shape and rewrites it to `postgresql+asyncpg://...` at runtime — no manual reformatting needed.
2. **Set env vars** in the Vercel project:
   - `DATABASE_URL` (provided by the Neon integration)
   - `JWT_SECRET` (generate with `openssl rand -hex 32`)
3. **Push** to `main`. The build command (`cd web && npm install && npm run build`) emits the SPA bundle at `web/dist/web/browser`, and Vercel auto-detects `api/index.py` as a Python serverless function via `api/requirements.txt`.
4. The FastAPI `lifespan` runs `Base.metadata.create_all` on cold start — fine for a demo, **not** what you'd ship to prod (use Alembic).

## AI workflow notes

What I tried and what stuck:

- **Discussion-first**: I spent the opening exchanges aligning on data model and contract approach before any code. That kept later parallel work coherent.
- **OpenAPI as the contract**: Pydantic schemas in the BE produce `/openapi.json` automatically; `openapi-typescript` generates TS types for the FE. One source of truth, no hand-maintained spec doc to drift.
- **Parallel agents**: I scaffolded the BE inline (because contract decisions affect every file) and spawned background agents for (a) the Angular scaffold + screen stubs, (b) wiring the FE to the BE once the contract was live. The two agents never touched the same files.
- **What I stopped trusting AI for during the build**:
  - Library version compatibility (Tailwind v3 vs v4, openapi-typescript v6 vs v7) — I gave the agent specific version pins where wrong choices would burn 10+ minutes.
  - Vercel Python serverless quirks (asyncpg URL format, SSL config, rewrites preserving original path) — I added defensive code rather than trusting the happy-path docs.
- **What I cut to stay under 2 hours**: see [CUTS.md](./CUTS.md). The big ones: multi-borrower UI, multi-income UI (model supports both — the wizard only renders the first), phone verification, brokers/offices, refinance loan structures.

**Time accounting** (honest): the agentic time savings showed up most in the FE scaffold (the Angular agent finished an Angular CLI bootstrap + Tailwind + routing + 12 screen stubs in ~6 minutes) and the parallel FE-wiring pass that ran while I was finalising deploy config. The BE I wrote inline because the data model is the load-bearing decision and I wanted to drive it directly.

## Repository layout

```
.
├── api/                          # FastAPI app
│   ├── index.py                  # Vercel ASGI entrypoint
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, lifespan, router mounting
│   │   ├── config.py             # env-driven Settings + DATABASE_URL normaliser
│   │   ├── db.py                 # async SQLAlchemy engine + session
│   │   ├── deps.py               # CurrentUser, OptionalUser, DbSession
│   │   ├── enums.py              # all domain enums
│   │   ├── models.py             # SQLAlchemy ORM
│   │   ├── security.py           # bcrypt + JWT
│   │   ├── routes/               # auth, simulations, applications, documents
│   │   ├── schemas/              # Pydantic request/response shapes
│   │   └── services/             # simulation_calc, doc_requirements, refs
│   └── tests/                    # pytest — calc, security, doc-requirements
├── web/                          # Angular 18 SPA
│   └── src/app/
│       ├── core/                 # AuthService, services, interceptor, guard
│       ├── features/             # simulator, auth, dashboard, application wizard
│       ├── shared/               # layout shells
│       └── api/schema.d.ts       # generated from openapi.json
├── vercel.json                   # routes /api/* → Python function, else SPA
├── CUTS.md                       # explicit scope decisions
└── plan.md                       # working notes
```
