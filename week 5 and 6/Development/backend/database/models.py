"""MongoDB User and RevokedToken data access models."""

from datetime import datetime, timezone
from bson import ObjectId
from database.connection import get_db


class User:
    """User data access model."""

    @staticmethod
    def get_collection():
        return get_db()["users"]

    @classmethod
    def create_user(cls, name: str, email: str, password_hash: str) -> dict:
        """Create and persist a new user record."""
        now = datetime.now(timezone.utc)
        user_doc = {
            "name": name.strip(),
            "email": email.strip().lower(),
            "password_hash": password_hash,
            "created_at": now,
            "updated_at": now,
        }
        res = cls.get_collection().insert_one(user_doc)
        user_doc["_id"] = res.inserted_id
        return user_doc

    @classmethod
    def find_by_email(cls, email: str):
        """Find a single user by lowercase email address."""
        if not email:
            return None
        return cls.get_collection().find_one({"email": email.strip().lower()})

    @classmethod
    def find_by_id(cls, user_id):
        """Find a single user by ObjectId or string ID."""
        if not user_id:
            return None
        if isinstance(user_id, str):
            try:
                user_id = ObjectId(user_id)
            except Exception:
                return None
        return cls.get_collection().find_one({"_id": user_id})

    @classmethod
    def to_dict(cls, user_doc: dict) -> dict:
        """Sanitize user document for client responses (strips password hash)."""
        if not user_doc:
            return {}
        return {
            "id": str(user_doc["_id"]),
            "name": user_doc.get("name", ""),
            "email": user_doc.get("email", ""),
            "created_at": user_doc.get("created_at").isoformat() if isinstance(user_doc.get("created_at"), datetime) else str(user_doc.get("created_at", ""))
        }


class RevokedToken:
    """Revoked JWT token store for secure logout."""

    @staticmethod
    def get_collection():
        return get_db()["revoked_tokens"]

    @classmethod
    def revoke_token(cls, jti: str, expires_at: datetime) -> bool:
        """Store a revoked token JTI with its expiration timestamp."""
        try:
            cls.get_collection().insert_one({
                "jti": jti,
                "expires_at": expires_at,
                "revoked_at": datetime.now(timezone.utc)
            })
            return True
        except Exception:
            # If already revoked, consider it revoked
            return True

    @classmethod
    def is_token_revoked(cls, jti: str) -> bool:
        """Check whether a given token JTI is in the revocation collection."""
        if not jti:
            return True
        found = cls.get_collection().find_one({"jti": jti})
        return found is not None
