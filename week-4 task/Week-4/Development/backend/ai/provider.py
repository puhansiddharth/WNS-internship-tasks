"""AI Provider abstraction layer using official OpenAI Python SDK."""

import os
from openai import OpenAI
from flask import current_app


class AIProviderConfig:
    """Encapsulates configuration for an AI model provider."""

    def __init__(self, name: str, base_url: str, api_key: str, default_model: str):
        self.name = name
        self.base_url = base_url
        self.api_key = api_key
        self.default_model = default_model

    def is_configured(self) -> bool:
        """Check if an API key is provided and non-empty."""
        return bool(self.api_key and not self.api_key.startswith("your_") and not self.api_key.startswith("gsk_your_"))


def get_provider_config(provider_name: str = None) -> AIProviderConfig:
    """
    Retrieve provider configuration based on application settings.
    Supports 'groq' (default active provider) and 'openai'.
    """
    if current_app:
        cfg = current_app.config
        selected_provider = (provider_name or cfg.get("AI_PROVIDER", "groq")).lower()
        
        if selected_provider == "openai":
            return AIProviderConfig(
                name="openai",
                base_url=cfg.get("OPENAI_BASE_URL", "https://api.openai.com/v1"),
                api_key=cfg.get("OPENAI_API_KEY", ""),
                default_model=cfg.get("OPENAI_MODEL", "gpt-4o-mini")
            )
        else:
            # Default to groq
            return AIProviderConfig(
                name="groq",
                base_url=cfg.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
                api_key=cfg.get("GROQ_API_KEY", ""),
                default_model=cfg.get("GROQ_MODEL", "llama-3.3-70b-versatile")
            )
    else:
        # Fallback to os.getenv if called outside application context
        selected_provider = (provider_name or os.getenv("AI_PROVIDER", "groq")).lower()
        if selected_provider == "openai":
            return AIProviderConfig(
                name="openai",
                base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
                api_key=os.getenv("OPENAI_API_KEY", ""),
                default_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            )
        else:
            return AIProviderConfig(
                name="groq",
                base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
                api_key=os.getenv("GROQ_API_KEY", ""),
                default_model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
            )


def get_ai_client(provider_name: str = None, client_override: OpenAI = None) -> tuple[OpenAI, AIProviderConfig]:
    """
    Factory function returning an OpenAI client configured for the target provider.
    Accepts client_override for unit testing/mocking.
    """
    if client_override is not None:
        p_cfg = get_provider_config(provider_name)
        return client_override, p_cfg

    p_cfg = get_provider_config(provider_name)

    if not p_cfg.api_key:
        raise ValueError(
            f"API key for provider '{p_cfg.name}' is missing or empty. "
            f"Please set {p_cfg.name.upper()}_API_KEY in your .env file."
        )

    client = OpenAI(
        api_key=p_cfg.api_key,
        base_url=p_cfg.base_url,
        timeout=30.0
    )
    return client, p_cfg
