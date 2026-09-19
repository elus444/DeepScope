"""Unit tests for the FastAPI dependencies in utils/supabase_auth.py --
the header parsing/validation that runs before any Supabase call, so
these don't need network access or a real token.

Real Postgres RLS is what actually stops one user reading another's
rows (see tests/test_rls_isolation.py); these tests only cover the
Python-level gate in front of it: is the Authorization header missing,
malformed, or carrying a token with no `sub` claim.
"""
import pytest
from fastapi import HTTPException

from utils.supabase_auth import get_supabase, get_user_id


def test_get_supabase_rejects_missing_header():
    with pytest.raises(HTTPException) as exc_info:
        get_supabase(authorization=None)
    assert exc_info.value.status_code == 401


def test_get_supabase_rejects_header_without_bearer_prefix():
    with pytest.raises(HTTPException) as exc_info:
        get_supabase(authorization="just-a-token-no-prefix")
    assert exc_info.value.status_code == 401


def test_get_supabase_rejects_bearer_with_empty_token():
    with pytest.raises(HTTPException) as exc_info:
        get_supabase(authorization="Bearer ")
    assert exc_info.value.status_code == 401


def test_get_supabase_accepts_lowercase_bearer_scheme():
    """RFC 7235 auth schemes are case-insensitive; a client that sends
    'bearer' instead of 'Bearer' must not be rejected on that basis
    alone."""
    client = get_supabase(authorization="bearer some-token-value")
    assert client is not None


def test_get_user_id_rejects_missing_header():
    with pytest.raises(HTTPException) as exc_info:
        get_user_id(authorization=None)
    assert exc_info.value.status_code == 401


def test_get_user_id_rejects_malformed_jwt():
    with pytest.raises(HTTPException) as exc_info:
        get_user_id(authorization="Bearer not-a-real-jwt")
    assert exc_info.value.status_code == 401


def _fake_jwt(payload: dict) -> str:
    """A syntactically well-formed JWT for testing get_user_id's own
    logic in isolation. get_user_id decodes with verify_signature=False
    (Supabase's gateway already checked the real signature before any
    query runs -- see the function's docstring), so the signing key
    here is irrelevant and never needs to match anything real."""
    import jwt as pyjwt

    return pyjwt.encode(payload, key="unused-test-signing-key-32-bytes!!", algorithm="HS256")


def test_get_user_id_rejects_token_without_subject_claim():
    """A syntactically valid but subject-less JWT must be rejected
    explicitly, not returned as user_id=None -- that value only ever
    reaches logging/display, but a silent None there would be a
    confusing way to fail."""
    token_without_sub = _fake_jwt({"email": "no-subject-claim@example.com"})

    with pytest.raises(HTTPException) as exc_info:
        get_user_id(authorization=f"Bearer {token_without_sub}")
    assert exc_info.value.status_code == 401


def test_get_user_id_extracts_subject_from_well_formed_token():
    token = _fake_jwt({"sub": "11111111-1111-1111-1111-111111111111"})

    user_id = get_user_id(authorization=f"Bearer {token}")
    assert user_id == "11111111-1111-1111-1111-111111111111"
