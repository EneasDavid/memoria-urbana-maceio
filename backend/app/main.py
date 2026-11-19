"""API do Memória Urbana Maceió (fase 2: esqueleto). Rodar: uvicorn app.main:create_app --factory"""
import secrets

from fastapi import FastAPI
from redis import Redis

from app.api.v1 import monuments, reports
from app.core.config import settings
from app.repositories.monuments import InMemoryMonumentRepo, MonumentRepo


class InMemoryReports:
    def __init__(self):
        self.items: list[dict] = []

    def add(self, data: dict) -> str:
        rid = f"r{len(self.items) + 1}"
        self.items.append(data | {"id": rid})
        return rid

    def list(self) -> list[dict]:
        return [{k: v for k, v in r.items() if k != "ipHash"} for r in self.items]


def create_app(redis: Redis | None = None, monument_repo: MonumentRepo | None = None, enqueue=None) -> FastAPI:
    cfg = settings()
    app = FastAPI(
        title="Memória Urbana Maceió · API",
        version="0.1.0",
        docs_url=None if cfg.env == "prod" else "/api/v1/docs",
        openapi_url=None if cfg.env == "prod" else "/api/v1/openapi.json",
    )
    app.state.redis = redis or Redis.from_url(cfg.redis_url, decode_responses=True)
    app.state.monuments = monument_repo or InMemoryMonumentRepo([])
    app.state.reports = InMemoryReports()
    app.state.cache_ttl = cfg.cache_ttl_seconds
    app.state.report_rate_per_hour = cfg.report_rate_per_hour
    app.state.ip_salt = secrets.token_hex(16)  # rotacionado a cada deploy; task purge_expired também rotaciona
    if enqueue is None:
        from app.worker.celery_app import celery

        def enqueue(name: str, *args):
            celery.send_task(name, args=args)

    app.state.enqueue = enqueue

    @app.get("/api/v1/health")
    def health():
        return {"ok": True}

    app.include_router(monuments.router, prefix="/api/v1")
    app.include_router(reports.router, prefix="/api/v1")
    return app
