"""Authentication routes for registration, login, logout, and current user profile."""

import re
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from pymongo.errors import DuplicateKeyError

from database.models import User, RevokedToken
from auth.services import (
    hash_password,
    verify_password,
    generate_token,
    token_required,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user account with hashed password."""
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Input validations
    if not name:
        return jsonify({"error": "Name is required", "field": "name"}), 400

    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"error": "A valid email address is required", "field": "email"}), 400

    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long", "field": "password"}), 400

    # Check if user already exists
    if User.find_by_email(email):
        return jsonify({"error": "An account with this email already exists", "field": "email"}), 409

    hashed_pw = hash_password(password)

    try:
        user = User.create_user(name=name, email=email, password_hash=hashed_pw)
    except DuplicateKeyError:
        return jsonify({"error": "An account with this email already exists", "field": "email"}), 409

    token = generate_token(user_id=str(user["_id"]), email=email)

    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": User.to_dict(user)
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user credentials and issue signed JWT."""
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.find_by_email(email)
    if not user or not verify_password(password, user.get("password_hash", "")):
        return jsonify({"error": "Invalid email or password", "code": "INVALID_CREDENTIALS"}), 401

    token = generate_token(user_id=str(user["_id"]), email=email)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": User.to_dict(user)
    }), 200


@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    """Revoke the current JWT to prevent reuse."""
    payload = g.token_payload
    jti = payload.get("jti")
    exp_timestamp = payload.get("exp")

    if exp_timestamp:
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
    else:
        exp_datetime = datetime.now(timezone.utc)

    if jti:
        RevokedToken.revoke_token(jti=jti, expires_at=exp_datetime)

    return jsonify({"message": "Successfully logged out", "status": "token_revoked"}), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    """Return profile details for the authenticated user."""
    return jsonify({
        "user": User.to_dict(g.current_user)
    }), 200
