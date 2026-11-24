from datetime import datetime

import fakeredis

from app.worker.celery_app import celery
from app.worker.ingest import TZ, RedisStore, in_window, run_batch


def row(qid, name, lng=-35.73, lat=-9.66):
    return {"item": {"value": f"http://www.wikidata.org/entity/{qid}"}, "itemLabel": {"value": name}, "coord": {"value": f"Point({lng} {lat})"}}


NIGHT = datetime(2026, 11, 25, 1, 30, tzinfo=TZ)
DAY = datetime(2026, 11, 25, 14, 0, tzinfo=TZ)


def test_agendada_so_da_meia_noite_as_4h():
    sched = celery.conf.beat_schedule["ingest-public-sources"]["schedule"]
    assert sched.hour == set(range(0, 4))
    assert in_window(NIGHT) and not in_window(DAY) and not in_window(datetime(2026, 11, 25, 4, 0, tzinfo=TZ))


def test_fora_da_janela_nao_faz_nada():
    r = fakeredis.FakeRedis(decode_responses=True)
    assert run_batch(RedisStore(r), [row("Q1", "A")], r, now=DAY) == {"skipped": "fora da janela 00h–04h"}
    assert not r.exists("ingest:candidates")


def test_idempotente_sem_duplicar_e_em_lotes():
    r = fakeredis.FakeRedis(decode_responses=True)
    store = RedisStore(r)
    rows = [row(f"Q{i}", f"Bem {i}") for i in range(15)] + [row("Q3", "Bem 3")]  # Q3 repetido na fonte
    a = run_batch(store, rows, r, now=NIGHT, batch=10)
    b = run_batch(store, rows, r, now=NIGHT, batch=10)
    assert a["created"] == 10 and b["created"] == 5 and a["total"] == 15
    assert r.hlen("ingest:candidates") == 15
    c = run_batch(store, rows, r, now=NIGHT, batch=10)  # recomeça do início: nada mudou, nada regravado
    assert c["unchanged"] == 10 and c["created"] == 0 and c["updated"] == 0


def test_mudanca_na_fonte_atualiza_o_mesmo_registro():
    r = fakeredis.FakeRedis(decode_responses=True)
    store = RedisStore(r)
    run_batch(store, [row("Q9", "Antigo")], r, now=NIGHT)
    r.set("ingest:cursor", 0)
    out = run_batch(store, [row("Q9", "Nome corrigido")], r, now=NIGHT)
    assert out["updated"] == 1 and r.hlen("ingest:candidates") == 1
    assert store.get("Q9")["name"] == "Nome corrigido" and store.get("Q9")["status"] == "aguardando curadoria"
