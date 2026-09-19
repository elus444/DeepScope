"""Shared fixtures for the DeepScope backend test suite.

Most of this app's real authorization boundary is Postgres Row Level
Security, not Python -- see utils/supabase_auth.py's module docstring.
A test that mocks the Supabase client can only prove our code calls the
mock correctly; it can't prove RLS itself actually blocks cross-user
access. So tests/test_rls_isolation.py deliberately runs against the
REAL configured Supabase project with two real, disposable throwaway
accounts, created fresh per test run via Supabase's public signup
endpoint (this project has "Confirm email" disabled, so a fresh signup
returns a usable access_token immediately -- no email round-trip).

Requires SUPABASE_URL and SUPABASE_ANON_KEY in the environment (see
.env.example). These are the same public, client-safe values the
frontend already ships with; nothing here needs a service-role key --
matching the app's own principle that the backend never holds one.
"""
import os
import uuid

import httpx
import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient

load_dotenv()

import main  # noqa: E402  (import after load_dotenv so any future config.py-style env reads see it)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(main.app)


def _signup(email: str, password: str) -> dict:
    """Create a real, throwaway Supabase auth user and return
    {id, email, access_token}. Test accounts are never deleted (this
    project's anon key -- deliberately -- has no permission to delete
    auth.users rows; only a service-role key could, and the backend
    never holds one). They're inert once nothing references them."""
    response = httpx.post(
        f"{SUPABASE_URL}/auth/v1/signup",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    return {
        "id": data["user"]["id"],
        "email": email,
        "access_token": data["access_token"],
    }


@pytest.fixture()
def user_a() -> dict:
    unique = uuid.uuid4().hex[:12]
    return _signup(f"deepscope-test-a-{unique}@mailinator.com", "TestPass2026!A")


@pytest.fixture()
def user_b() -> dict:
    unique = uuid.uuid4().hex[:12]
    return _signup(f"deepscope-test-b-{unique}@mailinator.com", "TestPass2026!B")


def auth_headers(user: dict) -> dict:
    return {"Authorization": f"Bearer {user['access_token']}"}
