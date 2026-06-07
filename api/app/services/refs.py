"""Human-readable reference generators.

Format: <prefix><YYMMDD><4 hex chars>, e.g. "S260607A1B2". Race-free without a
sequence table at the cost of looking less neat than "S26060700001" in the
mock screenshots — fine for the demo.
"""
import secrets
from datetime import datetime, timezone


def generate_ref(prefix: str) -> str:
    today = datetime.now(timezone.utc).strftime("%y%m%d")
    suffix = secrets.token_hex(2).upper()
    return f"{prefix}{today}{suffix}"


def generate_claim_token() -> str:
    return secrets.token_urlsafe(24)
