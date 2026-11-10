"""Tests for MongoDB database models and operations."""

from bson import ObjectId
from database.models import User, RevokedToken
from auth.services import hash_password, verify_password
from datetime import datetime, timezone, timedelta


def test_user_creation_and_retrieval(app):
    """Test creating a user and retrieving by email and id."""
    with app.app_context():
        pw_hash = hash_password("SecurePassword456")
        user = User.create_user(
            name="Alice Walker",
            email="Alice@Example.com",
            password_hash=pw_hash
        )

        assert user is not None
        assert user["name"] == "Alice Walker"
        assert user["email"] == "alice@example.com"  # Stored lowercase
        assert verify_password("SecurePassword456", user["password_hash"])
        assert not verify_password("WrongPassword", user["password_hash"])

        # Find by lowercase email
        found_by_email = User.find_by_email("alice@example.com")
        assert found_by_email is not None
        assert found_by_email["_id"] == user["_id"]

        # Find by ID (both ObjectId and str)
        found_by_id = User.find_by_id(user["_id"])
        assert found_by_id is not None
        assert found_by_id["email"] == "alice@example.com"

        found_by_str_id = User.find_by_id(str(user["_id"]))
        assert found_by_str_id is not None
        assert found_by_str_id["_id"] == user["_id"]


def test_user_to_dict_sanitization(app):
    """Ensure user dictionary omits password hash and formats ID."""
    with app.app_context():
        raw_user = {
            "_id": ObjectId("507f1f77bcf86cd799439011"),
            "name": "Bob Smith",
            "email": "bob@example.com",
            "password_hash": "scrypt:secret_hash",
            "created_at": datetime(2026, 11, 10, 12, 0, 0, tzinfo=timezone.utc),
        }
        sanitized = User.to_dict(raw_user)
        assert sanitized["id"] == "507f1f77bcf86cd799439011"
        assert sanitized["name"] == "Bob Smith"
        assert sanitized["email"] == "bob@example.com"
        assert "password_hash" not in sanitized


def test_revoked_token_management(app):
    """Test revoking JWT tokens and querying revocation status."""
    with app.app_context():
        jti = "test-token-uuid-12345"
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        assert not RevokedToken.is_token_revoked(jti)

        RevokedToken.revoke_token(jti=jti, expires_at=expires_at)
        assert RevokedToken.is_token_revoked(jti)
        assert not RevokedToken.is_token_revoked("unknown-jti")
