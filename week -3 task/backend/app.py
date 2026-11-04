"""
Flask Backend Application for Angular + Flask Integration Demo.
Demonstrates REST APIs, CORS configuration, request validation, and JSON responses.
"""

from datetime import datetime
import time
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

# Start timestamp for tracking uptime
START_TIME = time.time()

# Configure CORS
# In production, restrict origins to specific domain names.
# For development, allow Angular (http://localhost:4200 and http://127.0.0.1:4200)
# and standard local origins for the standalone JavaScript demo.
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:4200",
                "http://127.0.0.1:4200",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:8000",
                "http://127.0.0.1:8000",
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "null",  # Allows file:// origin if index.html is double-clicked
            ],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
)


@app.route("/", methods=["GET"])
def index():
    """Root endpoint providing high-level API metadata."""
    return (
        jsonify(
            {
                "service": "Angular Flask Integration Demo API",
                "version": "1.0.0",
                "status": "online",
                "endpoints": {
                    "health": "/health [GET]",
                    "hello": "/hello [GET]",
                    "greet": "/greet [POST]",
                },
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        ),
        200,
    )


@app.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint.
    Returns backend health status, uptime, and server time.
    """
    uptime_seconds = round(time.time() - START_TIME, 2)
    return (
        jsonify(
            {
                "status": "healthy",
                "service": "Flask Backend",
                "uptime_seconds": uptime_seconds,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        ),
        200,
    )


@app.route("/hello", methods=["GET"])
def hello():
    """
    Sample GET endpoint.
    Returns a simple welcoming JSON response.
    """
    return jsonify({"message": "Hello from Flask"}), 200


@app.route("/greet", methods=["POST"])
def greet():
    """
    Personalized Greeting POST endpoint.
    Expects JSON body: {"name": "string"}
    Validates that 'name' is provided and not empty.
    """
    # 1. Ensure the request contains JSON data
    if not request.is_json:
        return (
            jsonify(
                {
                    "error": "Invalid Content-Type. Request body must be JSON formatted."
                }
            ),
            400,
        )

    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return (
            jsonify(
                {"error": "Invalid JSON payload. Please provide a valid JSON object."}
            ),
            400,
        )

    # 2. Extract and validate the 'name' field
    raw_name = data.get("name")

    if raw_name is None:
        return (
            jsonify({"error": "Missing required field: 'name' is required."}),
            400,
        )

    if not isinstance(raw_name, str):
        return (
            jsonify({"error": "Field 'name' must be a text string."}),
            400,
        )

    name = raw_name.strip()
    if not name:
        return (
            jsonify({"error": "Name cannot be empty or contain only whitespace."}),
            400,
        )

    # 3. Return personalized greeting
    return (
        jsonify(
            {
                "message": f"Hello {name}",
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        ),
        200,
    )


@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 Not Found errors with a JSON response."""
    return (
        jsonify(
            {
                "error": "Resource not found",
                "status_code": 404,
                "path": request.path,
            }
        ),
        404,
    )


@app.errorhandler(405)
def method_not_allowed_error(error):
    """Handle 405 Method Not Allowed errors with a JSON response."""
    return (
        jsonify(
            {
                "error": f"Method {request.method} not allowed for {request.path}",
                "status_code": 405,
            }
        ),
        405,
    )


@app.errorhandler(500)
def internal_server_error(error):
    """Handle 500 Internal Server errors with a JSON response."""
    return (
        jsonify(
            {
                "error": "Internal server error occurred",
                "status_code": 500,
            }
        ),
        500,
    )


if __name__ == "__main__":
    # Run the Flask development server on port 5000
    print("Starting Flask Backend on http://127.0.0.1:5000 ...")
    app.run(host="127.0.0.1", port=5000, debug=True)
