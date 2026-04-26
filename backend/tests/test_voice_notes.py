from unittest.mock import patch, MagicMock
import io

def test_get_notes_empty(client, auth_headers):
    response = client.get("/api/v1/notes", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_notes_unauthorized(client):
    response = client.get("/api/v1/notes")
    assert response.status_code == 401

def test_create_note(client, auth_headers):
    # Try without structured_data first to isolate the issue
    response = client.post("/api/v1/notes", json={
        "transcript": "I want to build a productivity app",
        "structured_data": None
    }, headers=auth_headers)
    print("Create note response:", response.status_code, response.json())
    assert response.status_code == 200
    assert "id" in response.json()

def test_delete_note(client, auth_headers):
    # First create a note
    create_response = client.post("/api/v1/notes", json={
        "transcript": "Note to be deleted",
        "structured_data": None
    }, headers=auth_headers)
    note_id = create_response.json()["id"]

    # Then delete it
    delete_response = client.delete(
        f"/api/v1/notes/{note_id}",
        headers=auth_headers
    )
    assert delete_response.status_code == 200

    # Verify it's gone
    get_response = client.get("/api/v1/notes", headers=auth_headers)
    note_ids = [n["id"] for n in get_response.json()]
    assert note_id not in note_ids

def test_delete_note_unauthorized(client, auth_headers):
    # Create a note
    create_response = client.post("/api/v1/notes", json={
        "transcript": "Private note",
        "structured_data": None
    }, headers=auth_headers)
    note_id = create_response.json()["id"]

    # Try to delete without auth
    response = client.delete(f"/api/v1/notes/{note_id}")
    assert response.status_code == 401

