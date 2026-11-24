"""Ingestão noturna dos dados abertos dos monumentos (Wikidata + Commons), da meia-noite às 4h (America/Maceio).

Em vez de preencher todo o acervo de uma vez, o worker busca um lote por execução, em horário de pouco uso,
respeitando as APIs públicas. É idempotente: a chave é o QID; reprocessar não duplica nem regrava o que não mudou.
Os itens vão para a área de preparação (`candidates`), nunca direto para o site: a curadoria revisa antes.
Mesmo fluxo do script `scripts/import-public-data.mjs` (docs/ingestao-de-dados.md).
"""
from __future__ import annotations

import hashlib
import json
from collections.abc import Callable
from datetime import datetime
from typing import Protocol
from zoneinfo import ZoneInfo

TZ = ZoneInfo("America/Maceio")
WINDOW = range(0, 4)  # 00:00 até 03:59 → termina às 4h
BATCH = 10
UA = {"User-Agent": "MemoriaUrbanaMaceio/1.0 (projeto academico; https://github.com/EneasDavid/memoria-urbana-maceio)"}
SPARQL = """SELECT ?item ?itemLabel ?coord ?image WHERE {
  ?item wdt:P131+ wd:Q168888; wdt:P625 ?coord.
  ?item wdt:P31/wdt:P279* ?t. VALUES ?t { wd:Q4989906 wd:Q179700 wd:Q16970 wd:Q33506 wd:Q22698 wd:Q39715 wd:Q16560 wd:Q860861 }
  OPTIONAL { ?item wdt:P18 ?image }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". } }"""


class Store(Protocol):
    def get(self, key: str) -> dict | None: ...
    def put(self, key: str, value: dict) -> None: ...


class RedisStore:
    """Preparação no Redis (hash `ingest:candidates`); em produção, coleção `candidates` no Firestore."""

    def __init__(self, redis):
        self.r = redis

    def get(self, key: str) -> dict | None:
        raw = self.r.hget("ingest:candidates", key)
        return json.loads(raw) if raw else None

    def put(self, key: str, value: dict) -> None:
        self.r.hset("ingest:candidates", key, json.dumps(value, ensure_ascii=False, sort_keys=True))


def in_window(now: datetime | None = None) -> bool:
    return (now or datetime.now(TZ)).astimezone(TZ).hour in WINDOW


def normalize(row: dict) -> dict:
    lng, lat = (float(x) for x in row["coord"]["value"].removeprefix("Point(").rstrip(")").split())
    return {
        "qid": row["item"]["value"].rsplit("/", 1)[-1],
        "name": row["itemLabel"]["value"],
        "lat": round(lat, 5),
        "lng": round(lng, 5),
        "image": row.get("image", {}).get("value"),
        "license": "Wikidata CC0 1.0",
    }


def fingerprint(item: dict) -> str:
    return hashlib.sha256(json.dumps(item, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def fetch_wikidata(http_get: Callable) -> list[dict]:
    r = http_get("https://query.wikidata.org/sparql", params={"query": SPARQL, "format": "json"}, headers=UA, timeout=60)
    r.raise_for_status()
    return r.json()["results"]["bindings"]


def run_batch(store: Store, rows: list[dict], redis, now: datetime | None = None, batch: int = BATCH) -> dict:
    """Processa o próximo lote. O cursor no Redis lembra onde parou; quando chega ao fim, recomeça."""
    if not in_window(now):
        return {"skipped": "fora da janela 00h–04h"}
    items = sorted({(i := normalize(r))["qid"]: i for r in rows}.values(), key=lambda x: x["qid"])
    start = int(redis.get("ingest:cursor") or 0)
    if start >= len(items):
        start = 0
    stamp = (now or datetime.now(TZ)).astimezone(TZ).isoformat()
    created = updated = unchanged = 0
    for item in items[start : start + batch]:
        fp = fingerprint(item)
        prev = store.get(item["qid"])
        if prev and prev.get("fp") == fp:
            unchanged += 1
            continue
        store.put(item["qid"], item | {"fp": fp, "fetchedAt": stamp, "status": "aguardando curadoria"})
        created += prev is None
        updated += prev is not None
    redis.set("ingest:cursor", start + batch)
    redis.set("ingest:last_run", stamp)
    return {"created": created, "updated": updated, "unchanged": unchanged, "cursor": start + batch, "total": len(items)}
