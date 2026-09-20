"""Basic per-user (falling back to per-IP) API rate limiting.

DeepScope runs as a single Render instance, so slowapi's default
in-memory bucket storage is enough -- no Redis needed. Limits key on
the caller's Supabase user id (decoded the same no-signature-check way
as utils/supabase_auth.get_user_id -- the gateway already verified the
token, and a forged id here would only make the request cost against
the wrong user's bucket, never grant access to anything) so one user's
usage can't throttle another, and fall back to IP address when there's
no bearer token at all.
"""
import jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _rate_limit_key(request: Request) -> str:
    authorization = request.headers.get("authorization")
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
        except jwt.DecodeError:
            payload = {}
        user_id = payload.get("sub")
        if user_id:
            return f"user:{user_id}"
    return get_remote_address(request)


limiter = Limiter(key_func=_rate_limit_key, default_limits=["100/minute"])
