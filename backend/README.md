# Backend · Memória Urbana Maceió (fase 2, esqueleto)

API FastAPI + Celery + Redis + Firebase, com níveis de acesso (RBAC). Arquitetura completa em [`../docs/arquitetura.md`](../docs/arquitetura.md).

```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -e '.[dev]'
pytest            # RBAC, cache de monumentos, relatos anônimos com rate limit
ruff check app tests
```

Ambiente completo (API, worker, beat, Redis e emulador do Firebase):

```bash
docker compose -f infra/docker-compose.yml up --build
# API: http://localhost:8000/api/v1/docs  ·  Firebase Emulator UI: http://localhost:4000
```

| Pasta | Conteúdo |
|---|---|
| `app/core/rbac.py` | Papéis, permissões e a dependência `require(...)` |
| `app/core/ratelimit.py` | Rate limit no Redis (relatos, parceiros) |
| `app/api/v1/` | Rotas REST (`/monuments`, `/reports`) |
| `app/repositories/` | Acesso ao Firestore (e versão em memória para testes) |
| `app/worker/` | Celery: configuração, filas, beat e tasks (stubs com a sprint de cada uma) |
