"""API do Memória Urbana Maceió (fase 2: esqueleto). Rodar: uvicorn app.main:create_app --factory"""
import hashlib
import secrets
import uuid

from fastapi import FastAPI
from redis import Redis

from app.api.v1 import monuments, reports, stamps
from app.core.config import settings
from app.repositories.monuments import InMemoryMonumentRepo, MonumentRepo


class InMemoryReports:
    def __init__(self):
        self.items: list[dict] = []

    def add(self, data: dict) -> tuple[str, str]:
        """Cria o relato com id impossível de adivinhar (UUID4) e devolve um token de envio de anexo.

        Só quem criou o relato recebe o token; o banco guarda apenas o hash SHA-256 dele.
        """
        rid = uuid.uuid4().hex
        token = secrets.token_urlsafe(32)
        self.items.append(data | {"id": rid, "_uploadHash": hashlib.sha256(token.encode()).hexdigest()})
        return rid, token

    def can_upload(self, rid: str, token: str | None) -> bool:
        r = self.get(rid)
        if not r or not token:
            return False
        return secrets.compare_digest(r["_uploadHash"], hashlib.sha256(token.encode()).hexdigest())

    def get(self, rid: str) -> dict | None:
        return next((r for r in self.items if r["id"] == rid), None)

    def attach(self, rid: str, data: bytes, info) -> None:
        r = self.get(rid)
        if r is not None:
            r["media"] = {"kind": info.kind, "mime": info.mime, "bytes": info.size}
            r["_blob"] = data  # em produção: Cloud Storage (pasta de quarentena até o worker processar)

    def list(self) -> list[dict]:
        return [{k: v for k, v in r.items() if k not in ("ipHash", "_blob", "_uploadHash")} for r in self.items]


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
    app.include_router(stamps.router, prefix="/api/v1")
    return app
