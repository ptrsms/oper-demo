# CLAUDE.md — api/

FastAPI backend. Runs as a Vercel Python serverless function in prod and as plain uvicorn locally.

## Entry points

- `index.py` — Vercel ASGI entrypoint, just re-exports `app.main:app`. Don't put logic here.
- `app/main.py` — FastAPI construction, CORS, lifespan, router mounting. All routes are prefixed `/api/v1/...`.

## Module map

```
app/
├── main.py            # app + lifespan + router mounting
├── config.py          # pydantic-settings Settings, env-driven
├── db.py              # async engine, SessionLocal, get_db()
├── deps.py            # CurrentUser / OptionalUser / DbSession annotated deps
├── enums.py           # ALL domain enums live here, nowhere else
├── models.py          # SQLAlchemy 2.0 typed ORM (single file by design)
├── security.py        # bcrypt + PyJWT (HS256)
├── routes/            # one router per resource: auth, simulations, applications, documents
├── schemas/           # Pydantic request/response shapes, one file per resource
└── services/          # simulation_calc, doc_requirements, refs (pure functions, no FastAPI)
```

## Conventions

- **SQLAlchemy 2.0 typed style.** Use `Mapped[...]` + `mapped_column(...)`. No legacy `Column(...)` declarations.
- **Async everywhere.** All routes and DB calls are `async`. Use `await db.scalar(...)`, `await db.execute(...)`. Never call sync session methods.
- **One enum file.** New enums go in `app/enums.py` — don't scatter them next to models or schemas.
- **Routes are thin.** Validate (Pydantic) → query/mutate (SQLAlchemy) → return Pydantic response. Business logic that's worth a name goes into `app/services/` as a pure function (see `simulation_calc.py`, `doc_requirements.py` as the pattern).
- **Deps via `Annotated` aliases.** Use `CurrentUser`, `OptionalUser`, `DbSession` from `deps.py` rather than re-declaring `Depends(...)` in each handler.
- **No Alembic.** Schema changes ship as model edits; `create_all` runs on lifespan startup. If you change a model in a way that drops/renames a column, the dev DB must be dropped — there's no migration history to preserve.
- **Errors:** raise `HTTPException` with explicit `status_code=status.HTTP_*`. Don't return error envelopes.
- **JWT subject is the user UUID as a string.** `create_access_token(user.id)` / `decode_access_token` round-trip handles this.

## Database

- Postgres only (uses `asyncpg` + `PGUUID`, `BYTEA` via `LargeBinary`). No SQLite fallback.
- Pool is sized for serverless cold starts: `pool_size=1`, `max_overflow=2`. Don't bump this casually — Neon connection counts matter.
- Documents are stored inline as `LargeBinary` (`bytes in Postgres`). Acknowledged trade-off; don't suggest swapping to Vercel Blob without revisiting `CUTS.md`.

## Tests

Run from the `api/` directory with the venv active:

```bash
pytest
```

`tests/` holds the few meaningful tests (simulation calc, doc-requirements derivation, security round-trip). Pattern: test pure services directly, not via the HTTP layer. When you add a new pure function in `services/`, add a focused test alongside it; don't add HTTP-level tests for trivial route wiring.

## When working here

- Touching a route's request/response shape? Update the matching file under `app/schemas/`, then run `npm run gen:api` from `web/` so the FE types stay in sync.
- Adding a new resource? New file under `routes/`, mount it in `main.py`, mirror the schema file, and use the existing `auth.py` router as the structural template.
- Don't add middleware, structured logging sinks, rate limiting, or background workers — explicitly out of scope (see `CUTS.md`).
