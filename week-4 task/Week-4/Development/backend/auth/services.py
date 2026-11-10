"""Authentication services: password hashing, JWT generation, validation, and route protection."""

import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps
import jwt
from flask import request, jsonify, g, current_app
from werkzeug.security import generate_password_hash, check_password_hash

from database.models import User, RevokedToken


def hash_password(password: str) -> str:
    """Generate salted hash for password."""
    return generate_password_hash(password, method="scrypt")


def verify_password(password: str, password_hash: str) -> bool:
    """Check plain text password against stored hash."""
    if not password or not password_hash:
        return False
    return check_password_hash(password_hash, password)


def generate_token(user_id: str, email: str, expires_in_minutes: int = None) -> str:
    """Generate signed JWT token containing user identity and unique JTI."""
    secret_key = current_app.config.get("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
    algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
    if expires_in_minutes is None:
        expires_in_minutes = current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", 60)

    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=expires_in_minutes)
    jti = str(uuid.uuid4())

    payload = {
        "sub": str(user_id),
        "email": email,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }

    token = jwt.encode(payload, secret_key, algorithm=algorithm)
    # PyJWT 2+ returns str
    return token if isinstance(token, str) else token.decode("utf-8")


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token, checking expiration and revocation."""
    secret_key = current_app.config.get("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
    algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")

    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as exc:
        raise ValueError(f"Invalid token: {str(exc)}")

    # Check token revocation
    jti = payload.get("jti")
    if jti and RevokedToken.is_token_revoked(jti):
        raise ValueError("Token has been revoked")

    return payload


def token_required(f):
    """Decorator to enforce valid JWT authentication on protected routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            return jsonify({"error": "Authorization header is missing", "code": "AUTH_HEADER_MISSING"}), 401

        parts = auth_header.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Authorization header must be Bearer <token>", "code": "INVALID_HEADER_FORMAT"}), 401

        token = parts[1].strip()

        try:
            payload = decode_token(token)
        except ValueError as exc:
            return jsonify({"error": str(exc), "code": "INVALID_OR_EXPIRED_TOKEN"}), 401

        user_id = payload.get("sub")
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found or account deactivated", "code": "USER_NOT_FOUND"}), 401

        # Store user and token information in Flask context
        g.current_user = user
        g.token_payload = payload

        return f(*args, **kwargs)

    return decorated
