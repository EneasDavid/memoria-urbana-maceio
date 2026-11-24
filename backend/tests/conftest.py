import fakeredis
import pytest
from fastapi.testclient import TestClient

from app.core.rbac import Role, current_role, current_uid
from app.main import create_app
from app.repositories.monuments import InMemoryMonumentRepo

MONUMENTS = [
    {"id": "graciliano", "name": "Graciliano Ramos", "role": "Escritor", "plate": "01", "kind": "Estátua",
     "status": "published", "xp": 250},
    {"id": "rascunho", "name": "Rascunho", "role": "-", "plate": "99", "kind": "Busto", "status": "draft"},
]


@pytest.fixture
def make_client():
    def _make(role: Role = Role.ANONIMO, uid: str | None = None):
        queued: list[tuple] = []
        app = create_app(redis=fakeredis.FakeRedis(decode_responses=True), monument_repo=InMemoryMonumentRepo(MONUMENTS),
                         enqueue=lambda name, *a: queued.append((name, *a)))
        app.dependency_overrides[current_role] = lambda: role
        app.dependency_overrides[current_uid] = lambda: uid
        client = TestClient(app)
        client.queued = queued
        return client

    return _make
