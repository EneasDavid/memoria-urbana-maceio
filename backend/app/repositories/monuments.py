"""Acesso a monumentos. Em produção lê do Firestore; nos testes, de memória."""
from typing import Protocol


class MonumentRepo(Protocol):
    def list_published(self) -> list[dict]: ...
    def get(self, monument_id: str) -> dict | None: ...


class InMemoryMonumentRepo:
    def __init__(self, items: list[dict]):
        self._items = {m["id"]: m for m in items}

    def list_published(self) -> list[dict]:
        return [m for m in self._items.values() if m.get("status", "published") == "published"]

    def get(self, monument_id: str) -> dict | None:
        m = self._items.get(monument_id)
        return m if m and m.get("status", "published") == "published" else None


class FirestoreMonumentRepo:
    """Implementação real (task da sprint 7): firebase_admin.firestore.client().collection('monuments')."""

    def __init__(self, client):
        self._col = client.collection("monuments")

    def list_published(self) -> list[dict]:
        return [d.to_dict() | {"id": d.id} for d in self._col.where("status", "==", "published").stream()]

    def get(self, monument_id: str) -> dict | None:
        snap = self._col.document(monument_id).get()
        if not snap.exists:
            return None
        data = snap.to_dict() | {"id": snap.id}
        return data if data.get("status") == "published" else None
