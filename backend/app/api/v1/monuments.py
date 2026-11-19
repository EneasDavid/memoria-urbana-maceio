import json

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.rbac import Perm, require

router = APIRouter(prefix="/monuments", tags=["monumentos"])


@router.get("")
def list_monuments(request: Request, _=Depends(require(Perm.MONUMENT_READ))):
    r, repo, ttl = request.app.state.redis, request.app.state.monuments, request.app.state.cache_ttl
    if cached := r.get("cache:monuments"):
        return json.loads(cached)
    items = [{k: m[k] for k in ("id", "name", "role", "plate", "kind") if k in m} for m in repo.list_published()]
    r.set("cache:monuments", json.dumps(items), ex=ttl)
    return items


@router.get("/{monument_id}")
def get_monument(monument_id: str, request: Request, _=Depends(require(Perm.MONUMENT_READ))):
    r, repo, ttl = request.app.state.redis, request.app.state.monuments, request.app.state.cache_ttl
    key = f"cache:monument:{monument_id}"
    if cached := r.get(key):
        return json.loads(cached)
    m = repo.get(monument_id)
    if not m:
        raise HTTPException(404, "Monumento não encontrado")
    r.set(key, json.dumps(m), ex=ttl)
    return m
