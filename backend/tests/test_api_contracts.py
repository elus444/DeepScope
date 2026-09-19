"""Basic API contract tests: the health check, and that every protected
endpoint actually rejects an unauthenticated caller (401) before it
touches anything -- as opposed to, say, erroring out further in with a
500 because Supabase rejected an empty token in some less obvious way.
"""
import io

from tests.conftest import auth_headers


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_documents_requires_auth(client):
    response = client.get("/documents")
    assert response.status_code == 401


def test_upload_document_requires_auth(client):
    response = client.post(
        "/documents", files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
    )
    assert response.status_code == 401


def test_list_sessions_requires_auth(client):
    response = client.get("/chat/sessions")
    assert response.status_code == 401


def test_create_session_requires_auth(client):
    response = client.post("/chat/sessions", json={"title": "test"})
    assert response.status_code == 401


def test_upload_rejects_unsupported_file_extension(client, user_a):
    response = client.post(
        "/documents",
        files={"file": ("test.exe", io.BytesIO(b"not a document"), "application/octet-stream")},
        headers=auth_headers(user_a),
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_delete_nonexistent_document_returns_404(client, user_a):
    response = client.delete(
        "/documents/00000000-0000-0000-0000-000000000000", headers=auth_headers(user_a)
    )
    assert response.status_code == 404


def test_delete_nonexistent_session_returns_404(client, user_a):
    response = client.delete(
        "/chat/sessions/00000000-0000-0000-0000-000000000000", headers=auth_headers(user_a)
    )
    assert response.status_code == 404
