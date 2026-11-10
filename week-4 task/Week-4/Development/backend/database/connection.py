"""MongoDB connection management and initialization."""

import logging
from flask import current_app
from pymongo import MongoClient

logger = logging.getLogger(__name__)

_mongo_client = None
_db = None


def get_db(config=None, client_override=None):
    """
    Get or initialize the MongoDB database instance.
    Checks Flask current_app.extensions first, then client_override, then singleton, then creates new.
    """
    global _mongo_client, _db

    # 1. If explicit client_override is passed
    if client_override is not None:
        _mongo_client = client_override
        if config:
            db_name = config.get("MONGODB_DATABASE") if isinstance(config, dict) else getattr(config, "MONGODB_DATABASE", "week4_ai_assistant_test")
        else:
            db_name = "week4_ai_assistant_test"
        _db = _mongo_client[db_name]
        return _db

    # 2. If running inside a Flask application context that has mongodb in extensions
    try:
        if current_app and "mongodb" in current_app.extensions:
            return current_app.extensions["mongodb"]
    except RuntimeError:
        # Outside application context
        pass

    # 3. If singleton already initialized
    if _db is not None:
        return _db

    # 4. Fallback to initializing from config
    if config is None:
        try:
            if current_app:
                config = current_app.config
            else:
                from config import Config
                config = Config
        except Exception:
            from config import Config
            config = Config

    mongo_uri = config.get("MONGODB_URI") if isinstance(config, dict) else getattr(config, "MONGODB_URI", "mongodb://localhost:27017")
    db_name = config.get("MONGODB_DATABASE") if isinstance(config, dict) else getattr(config, "MONGODB_DATABASE", "week4_ai_assistant")

    try:
        _mongo_client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=2000,
            connectTimeoutMS=2000
        )
        _db = _mongo_client[db_name]
        return _db
    except Exception as exc:
        logger.error("Failed to connect to MongoDB: %s", exc)
        raise


def init_db(app, db_instance=None):
    """
    Initialize indexes on MongoDB collections.
    """
    db = db_instance if db_instance is not None else get_db(app.config)
    try:
        # Create unique index on user email
        db.users.create_index("email", unique=True)
        # Create TTL index on revoked tokens so expired entries are purged automatically
        db.revoked_tokens.create_index("expires_at", expireAfterSeconds=0)
        # Create unique index on revoked token jti
        db.revoked_tokens.create_index("jti", unique=True)
        logger.info("MongoDB collections and indexes initialized successfully.")
    except Exception as exc:
        logger.warning("Could not initialize MongoDB indexes: %s", exc)


def close_db():
    """Close the MongoDB connection client."""
    global _mongo_client, _db
    if _mongo_client is not None:
        try:
            _mongo_client.close()
        except Exception:
            pass
        _mongo_client = None
        _db = None
