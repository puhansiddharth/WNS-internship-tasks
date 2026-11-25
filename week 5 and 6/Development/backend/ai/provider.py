"""Groq configuration and client factory."""

from dataclasses import dataclass, field

from flask import current_app
from groq import Groq
from config import Config

GROQ_API_ORIGIN = "https://api.groq.com"


@dataclass(frozen=True)
class AIProviderConfig:
    default_model: str
    api_key: str = field(repr=False)
    name: str = "groq"
    base_url: str = GROQ_API_ORIGIN

    def is_configured(self) -> bool:
        return bool(self.api_key and not self.api_key.startswith(("your_", "gsk_your_")))


def get_provider_config() -> AIProviderConfig:
    config = current_app.config if current_app else vars(Config)
    return AIProviderConfig(
        default_model=config.get("GROQ_MODEL", Config.GROQ_MODEL),
        api_key=config.get("GROQ_API_KEY", "").strip(),
    )


def get_ai_client(client_override=None):
    config = get_provider_config()
    if client_override is not None:
        return client_override, config
    if not config.is_configured():
        raise ValueError("Set GROQ_API_KEY in backend/.env to use chat.")
    return Groq(api_key=config.api_key, base_url=config.base_url, timeout=20, max_retries=0), config
