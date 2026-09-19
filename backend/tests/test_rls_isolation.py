"""Proves the actual authorization boundary: Postgres Row Level
Security, not application code.

DeepScope's backend holds no service-role key and no direct database
password (see utils/supabase_auth.py) -- every request runs through
PostgREST using the *caller's own* Supabase access token, so RLS
policies scoped to auth.uid() are the only thing standing between one
user's documents/chats and another's. These tests run against the
REAL configured Supabase project with two real accounts (see
conftest.py) specifically so a passing test means the database itself
enforced isolation, not that a mock behaved as instructed.

Chat-session isolation is covered with plain session rows (cheap, no
LLM calls). Document isolation additionally covers the one endpoint
that legitimately can't be tested any other way -- upload -- which
does call the real Gemini embeddings API for its (tiny) test file.
"""
import io

from tests.conftest import auth_headers


# ---------------------------------------------------------------------------
# Chat sessions
# ---------------------------------------------------------------------------

def test_user_cannot_list_another_users_sessions(client, user_a, user_b):
    created = client.post(
        "/chat/sessions", json={"title": "User A's private session"}, headers=auth_headers(user_a)
    )
    assert created.status_code == 200
    session_id = created.json()["id"]

    b_sessions = client.get("/chat/sessions", headers=auth_headers(user_b))
    assert b_sessions.status_code == 200
    assert session_id not in {s["id"] for s in b_sessions.json()}

    a_sessions = client.get("/chat/sessions", headers=auth_headers(user_a))
    assert session_id in {s["id"] for s in a_sessions.json()}


def test_user_cannot_delete_another_users_session(client, user_a, user_b):
    created = client.post("/chat/sessions", json={"title": "A's session"}, headers=auth_headers(user_a))
    session_id = created.json()["id"]

    delete_as_b = client.delete(f"/chat/sessions/{session_id}", headers=auth_headers(user_b))
    assert delete_as_b.status_code == 404

    # Still there for its actual owner -- B's attempt did not silently
    # succeed against A's row under the hood.
    a_sessions = client.get("/chat/sessions", headers=auth_headers(user_a))
    assert session_id in {s["id"] for s in a_sessions.json()}

    delete_as_a = client.delete(f"/chat/sessions/{session_id}", headers=auth_headers(user_a))
    assert delete_as_a.status_code == 200


def test_user_gets_empty_messages_for_a_session_id_that_is_not_theirs(client, user_a, user_b):
    """Unlike delete (which 404s), listing messages for a session_id
    you don't own returns an empty list -- RLS simply filters the
    chat_messages query to zero rows rather than the endpoint raising,
    since there's no ownership check in the code at all (see main.py) --
    the database is the only thing doing the filtering here."""
    created = client.post("/chat/sessions", json={"title": "A's session"}, headers=auth_headers(user_a))
    session_id = created.json()["id"]

    messages_as_b = client.get(f"/chat/sessions/{session_id}/messages", headers=auth_headers(user_b))
    assert messages_as_b.status_code == 200
    assert messages_as_b.json() == []


def test_each_user_only_sees_their_own_sessions_not_a_merged_list(client, user_a, user_b):
    a_created = client.post("/chat/sessions", json={"title": "Only A's"}, headers=auth_headers(user_a))
    b_created = client.post("/chat/sessions", json={"title": "Only B's"}, headers=auth_headers(user_b))
    a_id, b_id = a_created.json()["id"], b_created.json()["id"]

    a_ids = {s["id"] for s in client.get("/chat/sessions", headers=auth_headers(user_a)).json()}
    b_ids = {s["id"] for s in client.get("/chat/sessions", headers=auth_headers(user_b)).json()}

    assert a_id in a_ids and b_id not in a_ids
    assert b_id in b_ids and a_id not in b_ids


# ---------------------------------------------------------------------------
# Documents (exercises the real upload pipeline: text extraction ->
# chunking -> real Gemini embeddings -> insert)
# ---------------------------------------------------------------------------

def _upload_test_file(client, user, content: str = "DeepScope RLS isolation test document."):
    return client.post(
        "/documents",
        files={"file": ("rls-test.txt", io.BytesIO(content.encode()), "text/plain")},
        headers=auth_headers(user),
    )


def test_user_cannot_list_another_users_document(client, user_a, user_b):
    uploaded = _upload_test_file(client, user_a)
    assert uploaded.status_code == 200, uploaded.text
    document_id = uploaded.json()["id"]

    try:
        b_documents = client.get("/documents", headers=auth_headers(user_b))
        assert b_documents.status_code == 200
        assert document_id not in {d["id"] for d in b_documents.json()}

        a_documents = client.get("/documents", headers=auth_headers(user_a))
        assert document_id in {d["id"] for d in a_documents.json()}
    finally:
        client.delete(f"/documents/{document_id}", headers=auth_headers(user_a))


def test_user_cannot_delete_another_users_document(client, user_a, user_b):
    uploaded = _upload_test_file(client, user_a)
    document_id = uploaded.json()["id"]

    try:
        delete_as_b = client.delete(f"/documents/{document_id}", headers=auth_headers(user_b))
        assert delete_as_b.status_code == 404

        a_documents = client.get("/documents", headers=auth_headers(user_a))
        assert document_id in {d["id"] for d in a_documents.json()}
    finally:
        client.delete(f"/documents/{document_id}", headers=auth_headers(user_a))
