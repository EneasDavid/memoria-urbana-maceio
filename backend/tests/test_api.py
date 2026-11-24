from app.core.rbac import Role


def test_health(make_client):
    assert make_client().get("/api/v1/health").json() == {"ok": True}


def test_monumentos_publicos_sem_login_e_sem_rascunho(make_client):
    c = make_client()
    ids = [m["id"] for m in c.get("/api/v1/monuments").json()]
    assert ids == ["graciliano"]
    assert c.get("/api/v1/monuments/graciliano").status_code == 200
    assert c.get("/api/v1/monuments/rascunho").status_code == 404


def test_monumento_vem_do_cache_na_segunda_leitura(make_client):
    c = make_client()
    c.get("/api/v1/monuments/graciliano")
    assert c.app.state.redis.get("cache:monument:graciliano")


def test_relato_anonimo_enfileira_tasks_e_tem_rate_limit(make_client):
    c = make_client()
    body = {"monumentId": "graciliano", "kind": "Danificado", "hasPhoto": True}
    rid = c.post("/api/v1/reports", json=body).json()["id"]
    assert ("notify.new_report", rid) in c.queued and ("media.process_report_photo", rid) in c.queued
    for _ in range(4):
        c.post("/api/v1/reports", json=body)
    assert c.post("/api/v1/reports", json=body).status_code == 429


def test_relato_invalido_e_recusado(make_client):
    assert make_client().post("/api/v1/reports", json={"monumentId": "../x", "kind": "Danificado"}).status_code == 422


def test_listar_relatos_exige_gestor(make_client):
    assert make_client(Role.ANONIMO).get("/api/v1/reports").status_code == 401
    assert make_client(Role.PARTICIPANTE).get("/api/v1/reports").status_code == 403
    assert make_client(Role.CURADOR).get("/api/v1/reports").status_code == 403
    assert make_client(Role.GESTOR).get("/api/v1/reports").status_code == 200


def test_lista_de_relatos_nao_expoe_hash_de_ip(make_client):
    c = make_client(Role.GESTOR)
    c.post("/api/v1/reports", json={"monumentId": "graciliano", "kind": "Outro"})
    assert "ipHash" not in c.get("/api/v1/reports").json()[0]
