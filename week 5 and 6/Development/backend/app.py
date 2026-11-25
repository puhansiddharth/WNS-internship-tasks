"""Main Flask application entry point and factory for AI Assistant backend."""

import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from database.connection import get_db, init_db
from auth.routes import auth_bp
from ai.routes import ai_bp
from ai.provider import get_provider_config
from tasks import tasks_bp
from ai.task_agent import agent_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_assistant")


def create_app(config_class=Config, client_override=None):
    """
    Application factory to create and configure the Flask application.
    Accepts client_override (e.g., mongomock) for isolated testing.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize CORS
    frontend_origin = app.config.get("FRONTEND_ORIGIN", "http://localhost:4200")
    CORS(
        app,
        resources={r"/api/*": {"origins": [frontend_origin, "http://localhost:4200", "http://127.0.0.1:4200"]}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )

    # Initialize MongoDB connection & indexes
    try:
        db = get_db(config=app.config, client_override=client_override)
        app.extensions["mongodb"] = db
        init_db(app, db_instance=db)
    except Exception as exc:
        logger.warning("MongoDB initial connection deferred: %s", exc)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(agent_bp)

    # Centralized Health Endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_status = "connected"
        try:
            db = get_db(config=app.config)
            # Ping database
            db.command("ping")
        except Exception:
            db_status = "disconnected"

        return jsonify({
            "status": "healthy",
            "service": "AI Assistant Backend",
            "database": db_status,
            "active_ai_provider": "groq",
            "active_ai_model": get_provider_config().default_model,
            "ai_configured": get_provider_config().is_configured(),
            "environment": app.config.get("FLASK_ENV", "development"),
        }), 200

    # Centralized Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad request", "message": str(error.description if hasattr(error, 'description') else error)}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({"error": "Unauthorized", "message": "Authentication required to access this resource"}), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({"error": "Forbidden", "message": "You do not have permission to access this resource"}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found", "message": "The requested resource could not be found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"error": "Method not allowed", "message": "HTTP method not supported on this endpoint"}), 405

    @app.errorhandler(500)
    def internal_error(error):
        logger.error("Unhandled internal server error: %s", error)
        return jsonify({"error": "Internal server error", "message": "An unexpected error occurred on the server"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    debug = app.config.get("DEBUG", True)
    logger.info("Starting AI Assistant Flask backend on port %s (debug=%s)", port, debug)
    app.run(host="127.0.0.1", port=port, debug=debug, use_reloader=False, use_debugger=False)
