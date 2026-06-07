import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, engine
from .routes import applications, auth, documents, simulations

logger = logging.getLogger("oper.api")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Demo cap: no Alembic, create_all on cold start. SQLAlchemy no-ops if tables exist.
    # Tolerant of an unreachable DB so local dev / OpenAPI introspection still works.
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("schema ensured")
    except Exception as exc:  # noqa: BLE001
        logger.warning("DB unreachable on startup, continuing: %s", exc)
    yield


app = FastAPI(
    title="Oper Credits API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(simulations.router, prefix="/api/v1/simulations", tags=["simulations"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["applications"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])


@app.get("/api/v1/health", tags=["meta"])
async def health() -> dict:
    return {"status": "ok"}
