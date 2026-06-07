from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_round_trip():
    h = hash_password("supersecret")
    assert verify_password("supersecret", h)
    assert not verify_password("wrong", h)


def test_password_hashes_are_unique_per_call():
    h1 = hash_password("x")
    h2 = hash_password("x")
    assert h1 != h2  # bcrypt salts each hash


def test_token_round_trip():
    uid = uuid4()
    tok = create_access_token(uid)
    assert decode_access_token(tok) == uid


def test_invalid_token_raises_401():
    with pytest.raises(HTTPException) as e:
        decode_access_token("not-a-real-token")
    assert e.value.status_code == 401
