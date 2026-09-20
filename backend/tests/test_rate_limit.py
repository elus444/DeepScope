"""Tests for utils/rate_limit.py.

The key-function tests are pure unit tests (no network). The "actually
throttles" test spins up a tiny standalone FastAPI app using slowapi
the same way main.py does, rather than hammering a real endpoint --
main.py's limited routes either cost a real Gemini call (upload) or
run the whole agent pipeline (ask), so proving the throttle fires
against a cheap dummy route is both faster and doesn't burn API quota
tripping it.
"""
import jwt
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from utils.rate_limit import _rate_limit_key, limiter as app_limiter


def _fake_jwt(payload: dict) -> str:
    return jwt.encode(payload, key="unused-test-signing-key-32-bytes!!", algorithm="HS256")


class _FakeRequest:
    def __init__(self, headers: dict, client_host: str = "203.0.113.5"):
        self.headers = headers

        class _Client:
            host = client_host

        self.client = _Client()


def test_rate_limit_key_uses_user_id_from_bearer_token():
    token = _fake_jwt({"sub": "11111111-1111-1111-1111-111111111111"})
    request = _FakeRequest({"authorization": f"Bearer {token}"})
    assert _rate_limit_key(request) == "user:11111111-1111-1111-1111-111111111111"


def test_rate_limit_key_falls_back_to_ip_without_auth_header():
    request = _FakeRequest({})
    assert _rate_limit_key(request) == "203.0.113.5"


def test_rate_limit_key_falls_back_to_ip_for_malformed_token():
    request = _FakeRequest({"authorization": "Bearer not-a-real-jwt"})
    assert _rate_limit_key(request) == "203.0.113.5"


def test_rate_limit_key_falls_back_to_ip_for_token_without_subject():
    token = _fake_jwt({"email": "no-subject-claim@example.com"})
    request = _FakeRequest({"authorization": f"Bearer {token}"})
    assert _rate_limit_key(request) == "203.0.113.5"


def test_app_wires_the_shared_limiter_and_exception_handler():
    """main.py must register the same limiter instance rate_limit.py
    exports (not a second, differently-configured one) and slowapi's
    handler, or a limited route raises instead of returning 429."""
    import main

    assert main.app.state.limiter is app_limiter
    assert main.app.exception_handlers[RateLimitExceeded] is _rate_limit_exceeded_handler


def test_limited_route_returns_429_after_the_limit_is_exceeded():
    test_limiter = Limiter(key_func=_rate_limit_key)
    app = FastAPI()
    app.state.limiter = test_limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    @app.get("/ping")
    @test_limiter.limit("2/minute")
    def ping(request: Request):
        return {"ok": True}

    client = TestClient(app)
    headers = {"authorization": f"Bearer {_fake_jwt({'sub': 'rate-limit-test-user'})}"}

    assert client.get("/ping", headers=headers).status_code == 200
    assert client.get("/ping", headers=headers).status_code == 200
    third = client.get("/ping", headers=headers)
    assert third.status_code == 429

    # A different user's bucket is untouched by the first user's usage.
    other_headers = {"authorization": f"Bearer {_fake_jwt({'sub': 'a-different-user'})}"}
    assert client.get("/ping", headers=other_headers).status_code == 200
