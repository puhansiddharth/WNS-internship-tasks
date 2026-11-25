"""Tests for authentication routes, JWT issuance, validation, and revocation."""

import pytest


def test_health_check_endpoint(client):
    """Test health check endpoint."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["service"] == "AI Assistant Backend"


def test_register_success(client):
    """Test successful user registration."""
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "Password123!"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert "token" in data
    assert data["user"]["name"] == "Jane Doe"
    assert data["user"]["email"] == "jane@example.com"
    assert "password_hash" not in data["user"]


def test_register_validation_errors(client):
    """Test validation errors on user registration."""
    # Missing name
    res = client.post("/api/auth/register", json={"email": "a@b.com", "password": "pass1234"})
    assert res.status_code == 400
    assert "Name is required" in res.get_json()["error"]

    # Invalid email
    res = client.post("/api/auth/register", json={"name": "Test", "email": "invalid-email", "password": "pass1234"})
    assert res.status_code == 400
    assert "valid email" in res.get_json()["error"]

    # Short password
    res = client.post("/api/auth/register", json={"name": "Test", "email": "valid@email.com", "password": "123"})
    assert res.status_code == 400
    assert "at least 6 characters" in res.get_json()["error"]


def test_register_duplicate_email(client):
    """Test rejecting duplicate email registrations."""
    payload = {
        "name": "Duplicate Tester",
        "email": "duplicate@example.com",
        "password": "Password123!"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.get_json()["error"]


def test_login_success_and_failure(client):
    """Test user login with valid and invalid credentials."""
    # Register user
    client.post("/api/auth/register", json={
        "name": "Login Tester",
        "email": "login@example.com",
        "password": "CorrectPassword123"
    })

    # Successful login
    login_res = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "CorrectPassword123"
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert "token" in login_data
    assert login_data["user"]["email"] == "login@example.com"

    # Incorrect password
    wrong_pw_res = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "WrongPassword"
    })
    assert wrong_pw_res.status_code == 401
    assert "Invalid email or password" in wrong_pw_res.get_json()["error"]

    # Nonexistent email
    nonexistent_res = client.post("/api/auth/login", json={
        "email": "ghost@example.com",
        "password": "SomePassword"
    })
    assert nonexistent_res.status_code == 401


def test_protected_me_endpoint(client, auth_headers):
    """Test accessing /api/auth/me with and without token."""
    # Missing token
    res_no_auth = client.get("/api/auth/me")
    assert res_no_auth.status_code == 401

    # Malformed token
    res_bad_auth = client.get("/api/auth/me", headers={"Authorization": "InvalidHeaderFormat"})
    assert res_bad_auth.status_code == 401

    # Valid token
    res_auth = client.get("/api/auth/me", headers=auth_headers)
    assert res_auth.status_code == 200
    data = res_auth.get_json()
    assert data["user"]["email"] == "testuser@example.com"


def test_logout_and_token_revocation(client, auth_headers):
    """Test logging out revokes the token so subsequent requests fail."""
    # First access succeeds
    res_before = client.get("/api/auth/me", headers=auth_headers)
    assert res_before.status_code == 200

    # Logout
    logout_res = client.post("/api/auth/logout", headers=auth_headers)
    assert logout_res.status_code == 200
    assert logout_res.get_json()["status"] == "token_revoked"

    # Attempting to reuse revoked token must fail with 401
    res_after = client.get("/api/auth/me", headers=auth_headers)
    assert res_after.status_code == 401
    assert "revoked" in res_after.get_json()["error"].lower()
