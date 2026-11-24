"""Os 14 ataques mais comuns em sistemas web, no backend (ver docs/seguranca-14-ataques.md)."""
from pathlib import Path

from app.core.rbac import Role

ROOT = Path(__file__).resolve().parents[2]
RELATO = {"monumentId": "graciliano", "kind": "Danificado", "hasPhoto": True}


def test_digitar_admin_nao_existe_rota_de_admin(make_client):
    c = make_client()
    for path in ("/admin", "/api/v1/admin", "/api/v1/admin/users", "/api/v1/docs/../admin"):
        assert c.get(path).status_code in (401, 403, 404)


def test_trocar_id_na_url_nao_anexa_foto_no_relato_alheio(make_client):
    c = make_client()
    alheio = c.post("/api/v1/reports", json=RELATO).json()
    assert len(alheio["id"]) == 32 and alheio["id"] != "r1"  # UUID4, não sequencial
    sem_token = c.put(f"/api/v1/reports/{alheio['id']}/media", content=b"x", headers={"content-type": "image/jpeg"})
    token_errado = c.put(f"/api/v1/reports/{alheio['id']}/media", content=b"x",
                         headers={"content-type": "image/jpeg", "x-upload-token": "chute"})
    assert sem_token.status_code == 404 and token_errado.status_code == 404


def test_trocar_id_na_url_carimbos_sao_sempre_da_sessao(make_client):
    ana = make_client(Role.PARTICIPANTE, uid="ana")
    ana.post("/api/v1/me/stamps", json={"monumentId": "graciliano", "method": "qr"})
    bia = make_client(Role.PARTICIPANTE, uid="bia")
    bia.app.state.redis = ana.app.state.redis
    assert bia.get("/api/v1/me/stamps").json()["stamps"] == []
    assert bia.get("/api/v1/me/stamps?uid=ana").json()["stamps"] == []


def test_mudar_o_preco_pontos_vem_do_servidor(make_client):
    c = make_client(Role.PARTICIPANTE, uid="ana")
    assert c.post("/api/v1/me/stamps", json={"monumentId": "graciliano", "method": "qr", "xp": 999999}).status_code == 422
    assert c.post("/api/v1/me/stamps", json={"monumentId": "graciliano", "method": "qr"}).json()["xp"] == 250


def test_comprar_menos_um_valores_negativos_e_campos_estranhos_recusados(make_client):
    c = make_client(Role.PARTICIPANTE, uid="ana")
    for body in ({"monumentId": "graciliano", "method": "qr", "quantidade": -1},
                 {"monumentId": "graciliano", "method": "pix"}):
        assert c.post("/api/v1/me/stamps", json=body).status_code == 422
    assert c.post("/api/v1/me/stamps", json={"monumentId": "-1", "method": "qr"}).status_code == 404
    assert make_client().post("/api/v1/reports", json=RELATO | {"status": "Resolvido"}).status_code == 422


def test_cupom_cem_vezes_carimbo_conta_uma_vez_por_dia(make_client):
    c = make_client(Role.PARTICIPANTE, uid="ana")
    respostas = [c.post("/api/v1/me/stamps", json={"monumentId": "graciliano", "method": "nfc"}).json() for _ in range(100)]
    assert respostas[0]["xp"] == 250 and all(r["repeated"] and r["xp"] == 0 for r in respostas[1:])
    assert c.get("/api/v1/me/stamps").json()["total"] == 250


def test_premium_sem_pagar_anonimo_nao_pontua(make_client):
    c = make_client()
    assert c.post("/api/v1/me/stamps", json={"monumentId": "graciliano", "method": "qr"}).status_code == 401
    assert c.get("/api/v1/reports").status_code == 401


def test_admin_no_cadastro_papel_no_corpo_e_recusado(make_client):
    c = make_client(Role.PARTICIPANTE, uid="ana")
    assert c.post("/api/v1/me/stamps", json={"monumentId": "graciliano", "method": "qr", "role": "admin"}).status_code == 422
    assert c.get("/api/v1/reports").status_code == 403


def test_script_no_usuario_vira_texto(make_client):
    c = make_client()
    c.post("/api/v1/reports", json=RELATO | {"note": "<script>alert(1)</script>"})
    g = make_client(Role.GESTOR)
    g.app.state.reports = c.app.state.reports
    item = g.get("/api/v1/reports").json()[0]
    assert item["note"] == "<script>alert(1)</script>"  # guardado como dado; o React mostra como texto
    assert "_uploadHash" not in item and "ipHash" not in item


def test_abrir_teu_banco_regras_negam_cliente_e_portas_locais():
    fs = (ROOT / "firebase/firestore.rules").read_text()
    assert "allow read, write: if false;" in fs and "if true" not in fs
    compose = (ROOT / "infra/docker-compose.yml").read_text()
    for line in compose.splitlines():
        if "ports:" in line:
            assert all(p.strip(' "').startswith("127.0.0.1:") for p in line.split("[")[1].rstrip("]").split(","))
