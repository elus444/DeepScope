"""
Per-request Supabase client + auth dependency.

DeepScope never holds a service-role key or a direct Postgres password.
Every database call goes through PostgREST using the *caller's own*
access token, so Postgres Row Level Security (scoped to auth.uid()) is
the actual authorization boundary -- a bug in this file's Python can
leak nothing across users, because the database itself won't return
rows that don't belong to the token making the request.
"""
import os
import jwt
from fastapi import Header, HTTPException
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


def _client_for_token(access_token: str) -> Client:
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    # Sets the Authorization header PostgREST/RPC calls use, so
    # auth.uid() inside Postgres resolves to *this* user for every
    # query this client instance makes.
    client.postgrest.auth(access_token)
    return client


def get_supabase(authorization: str | None = Header(default=None)) -> Client:
    """
    FastAPI dependency: build a Supabase client scoped to the calling
    user's access token. Raises 401 if the header is missing or
    malformed -- an invalid/expired token itself is only caught later,
    when Supabase's gateway rejects the first query that uses it.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    return _client_for_token(token)


def get_user_id(authorization: str | None = Header(default=None)) -> str:
    """
    FastAPI dependency: the calling user's id, for logging/display only.
    Decoded without signature verification -- Supabase's gateway already
    validated the token's signature before any query runs, and every
    write this id could influence is still checked against auth.uid()
    by Postgres RLS, so a forged id here can't grant access to anything.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Malformed token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject claim")
    return user_id
