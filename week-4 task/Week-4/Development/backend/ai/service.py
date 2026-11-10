"""AI chat completion service with error handling and response normalization."""

import logging
from openai import (
    APIConnectionError,
    RateLimitError,
    AuthenticationError,
    APIStatusError,
)
from ai.provider import get_ai_client, get_provider_config

logger = logging.getLogger(__name__)


def generate_chat_response(
    prompt: str,
    system_message: str = None,
    provider_name: str = None,
    client_override = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> dict:
    """
    Generate an AI chat completion response using the configured provider (Groq / OpenAI).
    
    Returns a standardized dictionary:
    {
        "provider": "groq",
        "model": "llama-3.3-70b-versatile",
        "reply": "...",
        "usage": {
            "prompt_tokens": 15,
            "completion_tokens": 42,
            "total_tokens": 57
        }
    }
    """
    if not prompt or not prompt.strip():
        raise ValueError("Prompt text cannot be empty")

    client, p_cfg = get_ai_client(provider_name=provider_name, client_override=client_override)

    # Build messages list
    messages = []
    if system_message and system_message.strip():
        messages.append({"role": "system", "content": system_message.strip()})
    else:
        messages.append({
            "role": "system",
            "content": "You are a helpful, professional, and knowledgeable AI assistant."
        })

    messages.append({"role": "user", "content": prompt.strip()})

    try:
        response = client.chat.completions.create(
            model=p_cfg.default_model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        reply_content = response.choices[0].message.content or ""
        usage_data = {
            "prompt_tokens": getattr(response.usage, "prompt_tokens", 0) if response.usage else 0,
            "completion_tokens": getattr(response.usage, "completion_tokens", 0) if response.usage else 0,
            "total_tokens": getattr(response.usage, "total_tokens", 0) if response.usage else 0,
        }

        return {
            "provider": p_cfg.name,
            "model": p_cfg.default_model,
            "reply": reply_content,
            "usage": usage_data,
        }

    except AuthenticationError as exc:
        logger.error("Authentication error with provider '%s': %s", p_cfg.name, exc)
        raise RuntimeError(f"Authentication failed with {p_cfg.name.capitalize()} API: Invalid or expired API key.") from exc

    except RateLimitError as exc:
        logger.error("Rate limit exceeded for provider '%s': %s", p_cfg.name, exc)
        raise RuntimeError(f"Rate limit exceeded on {p_cfg.name.capitalize()}. Please try again shortly.") from exc

    except APIConnectionError as exc:
        logger.error("Connection error reaching provider '%s': %s", p_cfg.name, exc)
        raise RuntimeError(f"Unable to reach {p_cfg.name.capitalize()} API server. Check your network connection.") from exc

    except APIStatusError as exc:
        logger.error("API status error from provider '%s' (status %s): %s", p_cfg.name, exc.status_code, exc)
        raise RuntimeError(f"{p_cfg.name.capitalize()} API returned error status {exc.status_code}: {exc.message}") from exc

    except Exception as exc:
        logger.error("Unexpected error in chat completion: %s", exc)
        raise RuntimeError(f"AI service error: {str(exc)}") from exc
