# api — FastAPI backend

## Local dev

```bash
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Point at a local Postgres or a Neon connection string
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/oper_credits"
export JWT_SECRET="dev-secret-change-me"

uvicorn app.main:app --reload --port 8000
```

Swagger UI: <http://localhost:8000/docs>
OpenAPI JSON: <http://localhost:8000/openapi.json>

## Layout

```
api/
├── index.py              # Vercel ASGI entrypoint
├── requirements.txt
└── app/
    ├── main.py           # FastAPI app, lifespan, router mounting
    ├── config.py         # env-driven Settings
    ├── db.py             # async SQLAlchemy engine + session
    ├── deps.py           # FastAPI deps (current user, db session)
    ├── enums.py          # all domain enums
    ├── models.py         # SQLAlchemy ORM
    ├── security.py       # bcrypt + JWT
    ├── routes/           # one router per resource
    ├── schemas/          # Pydantic request/response shapes
    └── services/         # simulation calc, doc-requirements derivation
```
