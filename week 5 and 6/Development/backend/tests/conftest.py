"""Shared pytest fixtures for AI Assistant backend test suite."""

import sys
from pathlib import Path
import pytest
import mongomock

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from config import TestConfig
from app import create_app
from database.connection import get_db, close_db


@pytest.fixture(autouse=True)
def reset_db_singleton():
    """Ensure database singletons are cleared before each test."""
    close_db()
    yield
    close_db()


@pytest.fixture
def mock_mongo():
    """Return an isolated mongomock client."""
    client = mongomock.MongoClient()
    return client


@pytest.fixture
def app(mock_mongo):
    """Create test Flask application wired to mongomock."""
    test_app = create_app(config_class=TestConfig, client_override=mock_mongo)
    test_app.config["TESTING"] = True
    yield test_app


@pytest.fixture
def client(app):
    """Return Flask test client."""
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Register a test user and return Authorization headers."""
    user_payload = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "Password123!"
    }
    res = client.post("/api/auth/register", json=user_payload)
    data = res.get_json()
    token = data["token"]
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
