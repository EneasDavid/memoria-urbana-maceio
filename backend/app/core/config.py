"""Configuração por variáveis de ambiente (ver docs/arquitetura.md §3 e §6)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = "dev"  # dev | test | prod
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    firebase_project_id: str = "memoria-urbana-maceio"
    google_client_id: str = ""
    google_client_secret: str = ""
    session_ttl_seconds: int = 60 * 60 * 24 * 7
    bootstrap_admin_email: str = ""
    report_rate_per_hour: int = 5
    cache_ttl_seconds: int = 600
    public_origin: str = "https://mumcz.vercel.app"


@lru_cache
def settings() -> Settings:
    return Settings()
