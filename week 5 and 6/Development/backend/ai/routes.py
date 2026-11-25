"""AI endpoints for chat interaction and provider information."""

from flask import Blueprint, request, jsonify, g
from auth.services import token_required
from ai.service import generate_chat_response
from ai.provider import get_provider_config

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")

MAX_PROMPT_LENGTH = 4000


@ai_bp.route("/chat", methods=["POST"])
@token_required
def chat():
    """
    Generate an AI response from user prompt.
    Protected by JWT authentication.
    """
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Expected a JSON object.", code="INVALID_REQUEST"), 400
    prompt = data.get("prompt", "")
    system_message = data.get("system_message", None)

    if not isinstance(prompt, str) or not prompt.strip():
        return jsonify({"error": "Prompt is required and must be non-empty text", "code": "EMPTY_PROMPT"}), 400

    if len(prompt.strip()) > MAX_PROMPT_LENGTH:
        return jsonify({
            "error": f"Prompt exceeds maximum allowed length of {MAX_PROMPT_LENGTH} characters",
            "code": "PROMPT_TOO_LONG"
        }), 400

    try:
        response_data = generate_chat_response(
            prompt=prompt.strip(),
            system_message=system_message,
        )
        return jsonify({
            "success": True,
            "data": response_data,
            "user_id": str(g.current_user["_id"])
        }), 200

    except ValueError as exc:
        return jsonify({"error": str(exc), "code": "VALIDATION_ERROR"}), 400
    except RuntimeError as exc:
        return jsonify({"error": str(exc), "code": "AI_SERVICE_ERROR"}), 502
    except Exception:
        return jsonify({"error": "The Groq request failed.", "code": "INTERNAL_ERROR"}), 500


@ai_bp.route("/provider", methods=["GET"])
@token_required
def get_provider_info():
    """
    Get the active AI provider information and configuration status.
    Secrets/keys are never exposed in responses.
    """
    groq_cfg = get_provider_config()

    return jsonify({
        "active_provider": groq_cfg.name,
        "active_model": groq_cfg.default_model,
        "providers": {
            "groq": {
                "name": "groq",
                "default_model": groq_cfg.default_model,
                "base_url": groq_cfg.base_url,
                "is_configured": groq_cfg.is_configured(),
            }
        }
    }), 200
