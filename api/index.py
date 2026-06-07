"""Vercel Python serverless entrypoint.

Vercel detects the `app` ASGI callable and routes /api/* to it (see vercel.json).
The same module is used for local dev: `uvicorn app.main:app --reload` from /api.
"""
from app.main import app  # noqa: F401
