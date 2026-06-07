"""Vercel Python serverless entrypoint.

Vercel runs the function with the repo root on sys.path (not the api/ dir),
so we need to add the directory containing this file before importing the
FastAPI app. Locally `uvicorn app.main:app` is run from inside api/, where
the path manipulation is a harmless no-op.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app  # noqa: E402, F401
