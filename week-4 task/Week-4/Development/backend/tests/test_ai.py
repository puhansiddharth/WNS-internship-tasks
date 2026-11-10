"""Tests for AI provider switching, service abstraction, and chat endpoints with mocks."""

from unittest.mock import MagicMock, patch
import pytest
from openai import AuthenticationError, RateLimitError
from ai.provider import get_provider_config, get_ai_client
from ai.service import generate_chat_response


def test_provider_configuration_resolution(app):
    """Test switching configurations between Groq and OpenAI."""
    with app.app_context():
        # Default is groq
        groq_cfg = get_provider_config("groq")
        assert groq_cfg.name == "groq"
        assert "groq.com" in groq_cfg.base_url
        assert groq_cfg.default_model == "llama-3.3-70b-versatile"

        # OpenAI provider
        openai_cfg = get_provider_config("openai")
        assert openai_cfg.name == "openai"
        assert "openai.com" in openai_cfg.base_url
        assert openai_cfg.default_model == "gpt-4o-mini"


def test_ai_service_mock_completion(app):
    """Test AI service generation with a mocked client to ensure no credits are spent."""
    with app.app_context():
        mock_client = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Hello! I am your AI Assistant powered by Groq LLaMA 3.3."
        mock_usage = MagicMock()
        mock_usage.prompt_tokens = 12
        mock_usage.completion_tokens = 25
        mock_usage.total_tokens = 37

        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        mock_response.usage = mock_usage

        mock_client.chat.completions.create.return_value = mock_response

        result = generate_chat_response(
            prompt="Tell me about yourself",
            provider_name="groq",
            client_override=mock_client
        )

        assert result["provider"] == "groq"
        assert result["model"] == "llama-3.3-70b-versatile"
        assert "Hello! I am your AI Assistant" in result["reply"]
        assert result["usage"]["total_tokens"] == 37

        # Verify mock was called with correct arguments
        mock_client.chat.completions.create.assert_called_once()
        call_kwargs = mock_client.chat.completions.create.call_args[1]
        assert call_kwargs["model"] == "llama-3.3-70b-versatile"
        assert len(call_kwargs["messages"]) == 2
        assert call_kwargs["messages"][1]["content"] == "Tell me about yourself"


def test_ai_service_error_handling(app):
    """Test AI service maps upstream exceptions cleanly."""
    with app.app_context():
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = AuthenticationError(
            message="Invalid API Key",
            response=MagicMock(status_code=401, headers={}),
            body={"error": {"message": "Invalid API Key"}}
        )

        with pytest.raises(RuntimeError) as exc_info:
            generate_chat_response(
                prompt="Hello",
                provider_name="groq",
                client_override=mock_client
            )
        assert "Authentication failed" in str(exc_info.value)


def test_ai_chat_endpoint_unauthorized(client):
    """Test that /api/ai/chat requires a valid JWT token."""
    res = client.post("/api/ai/chat", json={"prompt": "Hello"})
    assert res.status_code == 401


def test_ai_chat_endpoint_validation(client, auth_headers):
    """Test input validation for prompt."""
    # Empty prompt
    res_empty = client.post("/api/ai/chat", json={"prompt": "   "}, headers=auth_headers)
    assert res_empty.status_code == 400
    assert "Prompt is required" in res_empty.get_json()["error"]

    # Missing prompt
    res_missing = client.post("/api/ai/chat", json={}, headers=auth_headers)
    assert res_missing.status_code == 400

    # Overly long prompt (> 4000 characters)
    huge_prompt = "A" * 4005
    res_long = client.post("/api/ai/chat", json={"prompt": huge_prompt}, headers=auth_headers)
    assert res_long.status_code == 400
    assert "exceeds maximum allowed length" in res_long.get_json()["error"]


@patch("ai.routes.generate_chat_response")
def test_ai_chat_endpoint_success(mock_generate, client, auth_headers):
    """Test successful chat execution via API endpoint using mocked service."""
    mock_generate.return_value = {
        "provider": "groq",
        "model": "llama-3.3-70b-versatile",
        "reply": "Mocked response from Groq.",
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 15,
            "total_tokens": 25
        }
    }

    payload = {
        "prompt": "What is Flask?",
        "system_message": "Be concise."
    }

    res = client.post("/api/ai/chat", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["reply"] == "Mocked response from Groq."
    assert "user_id" in data


def test_ai_provider_info_endpoint(client, auth_headers):
    """Test retrieving provider status without exposing credentials."""
    res = client.get("/api/ai/provider", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert "active_provider" in data
    assert "providers" in data
    assert "groq" in data["providers"]
    assert "openai" in data["providers"]
    # Ensure raw API key is never in response
    assert "api_key" not in str(data)
