# CLAUDE.md — repo root

Borrower-portal take-home: simulate → sign up → file an application → upload docs. Hard 2h build window, so scope is deliberately tight.

## Stack & layout

- `api/` — FastAPI (Python 3.11+), async SQLAlchemy on Postgres, Vercel Python serverless. Entrypoint: `api/index.py` re-exports `app.main:app`.
- `web/` — Angular 18 SPA, standalone components, lazy-loaded routes, Tailwind. Built to `web/dist/web/browser`.
- `vercel.json` — rewrites `/api/*` → `api/index`, everything else → SPA `index.html`. Build runs from `web/`.
- `CUTS.md` — read this before suggesting features. Anything listed there is intentionally out of scope.
- `plan.md` — original constraints and approach. `screenshots/` — reference UI from the brief.

## Things to know before editing

- **Don't reintroduce cut scope.** Check `CUTS.md` first. If a feature looks missing, it's probably cut on purpose.
- **No Alembic.** Schema is `Base.metadata.create_all` on lifespan startup; if you change `api/app/models.py`, expect to drop/recreate the dev DB.
- **Two README/CLAUDE files per surface.** Per-directory `CLAUDE.md` files in `api/` and `web/` carry the specifics — keep them as the source of truth for that surface; this file is the cross-cutting overview.
- **`web/src/app/api/schema.d.ts` is generated** from the FastAPI OpenAPI spec via `npm run gen:api` (needs the API running on :8000). Regenerate after route/schema changes; don't hand-edit.
- **Auth model:** bearer JWT in `localStorage` (XSS trade-off acknowledged in `CUTS.md`). Don't switch to cookies without revisiting the Vercel same-origin setup.
- **Single-origin in prod, two-origin locally.** Prod is same-origin via the rewrite; local dev runs API on :8000 and SPA on :4200 and relies on `CORSMiddleware` + `environment.apiBase`.

## Local dev

```bash
# api (in one shell)
cd api && source .venv/bin/activate
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/oper_credits"
export JWT_SECRET="dev-secret-change-me"
uvicorn app.main:app --reload --port 8000

# web (in another)
cd web && npm start         # ng serve on :4200
```

## Temp files

Use `tmp/` at the repo root for any scratch artifacts (already gitignored implicitly via the global rule). Never write to `/tmp`.
