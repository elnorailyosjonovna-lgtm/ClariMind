import uuid


def unique_email(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"


def test_register_success(client):
    email = unique_email("newuser")

    response = client.post("/api/v1/auth/register", json={
        "full_name": "New User",
        "email": email,
        "password": "securepassword123"
    })

    assert response.status_code in [200, 201]


def test_register_duplicate_email(client):
    email = unique_email("duplicate")

    client.post("/api/v1/auth/register", json={
        "full_name": "Duplicate User",
        "email": email,
        "password": "password123"
    })

    response = client.post("/api/v1/auth/register", json={
        "full_name": "Duplicate User",
        "email": email,
        "password": "password123"
    })

    assert response.status_code in [400, 409, 422]


def test_login_success(client):
    email = unique_email("logintest")

    client.post("/api/v1/auth/register", json={
        "full_name": "Login Test",
        "email": email,
        "password": "password123"
    })

    response = client.post("/api/v1/auth/login", data={
        "username": email,
        "password": "password123"
    })

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client):
    email = unique_email("wrongpass")

    client.post("/api/v1/auth/register", json={
        "full_name": "Wrong Password Test",
        "email": email,
        "password": "password123"
    })

    response = client.post("/api/v1/auth/login", data={
        "username": email,
        "password": "wrongpassword"
    })

    assert response.status_code == 400


def test_login_nonexistent_user(client):
    email = unique_email("nobody")

    response = client.post("/api/v1/auth/login", data={
        "username": email,
        "password": "password123"
    })

    assert response.status_code == 400