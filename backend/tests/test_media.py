"""Segurança dos anexos de relato: as mesmas fixtures de tests/fixtures/media usadas no front."""
from pathlib import Path

import pytest

from app.core.media import IMAGE_MAX_BYTES, VIDEO_MAX_BYTES, MediaRejected, hidden_payload, image_size, validate

FX = Path(__file__).resolve().parents[2] / "tests" / "fixtures" / "media"


def read(name: str) -> bytes:
    return (FX / name).read_bytes()


@pytest.mark.parametrize("name,mime,kind", [("foto.jpg", "image/jpeg", "image"), ("foto.png", "image/png", "image"),
                                            ("foto.webp", "image/webp", "image"), ("video.mp4", "video/mp4", "video")])
def test_aceita_midia_legitima(name, mime, kind):
    info = validate(read(name), mime)
    assert (info.kind, info.mime) == (kind, mime)


def test_le_dimensoes_sem_decodificar():
    assert image_size(read("foto.jpg"), "image/jpeg") == (320, 240)
    assert image_size(read("foto.png"), "image/png") == (320, 240)
    assert image_size(read("foto.webp"), "image/webp") == (320, 240)


@pytest.mark.parametrize("name,msg", [
    ("arquivo.zip", "ZIP"), ("zip-renomeado.jpg", "ZIP"), ("bomba.gz", "GZIP"), ("imagem.svg", "marcação"),
    ("pagina.png", "marcação"), ("programa.jpg", "executável"), ("poliglota.jpg", "compactado escondido"),
    ("script.jpg", "script"), ("bomba.png", "megapixels"),
])
def test_recusa_ataques(name, msg):
    with pytest.raises(MediaRejected, match=msg):
        validate(read(name), "image/jpeg")


def test_limites_de_tamanho():
    with pytest.raises(MediaRejected, match="grande demais"):
        validate(read("foto.jpg") + b"\0" * IMAGE_MAX_BYTES)
    with pytest.raises(MediaRejected, match="grande demais"):
        validate(read("video.mp4") + b"\0" * VIDEO_MAX_BYTES)


def test_tipo_declarado_precisa_bater():
    with pytest.raises(MediaRejected, match="não bate"):
        validate(read("foto.jpg"), "video/mp4")


def test_pk_solto_nao_e_falso_positivo():
    data = bytearray(read("video.mp4")) + bytes(range(256)) * 4000
    data[500:506] = b"PK\x03\x04\xff\xff"
    assert hidden_payload(bytes(data)) is None


def _relato(c):
    j = c.post("/api/v1/reports", json={"monumentId": "graciliano", "kind": "Danificado", "hasPhoto": True}).json()
    c.headers["x-upload-token"] = j["uploadToken"]
    return j["id"]


def test_upload_aceita_foto_e_enfileira_processamento(make_client):
    c = make_client()
    rid = _relato(c)
    r = c.put(f"/api/v1/reports/{rid}/media", content=read("foto.jpg"), headers={"content-type": "image/jpeg"})
    assert r.status_code == 202 and r.json()["mime"] == "image/jpeg"
    assert ("media.process_report_photo", rid) in c.queued


def test_upload_recusa_zip_disfarcado_e_poliglota(make_client):
    c = make_client()
    rid = _relato(c)
    for name in ("zip-renomeado.jpg", "poliglota.jpg", "script.jpg", "imagem.svg", "bomba.png"):
        r = c.put(f"/api/v1/reports/{rid}/media", content=read(name), headers={"content-type": "image/jpeg"})
        assert r.status_code == 415, name


def test_upload_corta_arquivo_grande_pelo_content_length(make_client):
    c = make_client()
    rid = _relato(c)
    big = read("foto.jpg") + b"\0" * (IMAGE_MAX_BYTES + 1)
    r = c.put(f"/api/v1/reports/{rid}/media", content=big, headers={"content-type": "image/jpeg"})
    assert r.status_code == 413


def test_upload_em_relato_inexistente(make_client):
    r = make_client().put("/api/v1/reports/r999/media", content=read("foto.jpg"), headers={"content-type": "image/jpeg"})
    assert r.status_code == 404


def test_video_grande_nao_e_falso_positivo():
    import random
    rnd = random.Random(42)
    data = bytearray(read("video.mp4")) + rnd.randbytes(20 * 1024 * 1024)
    for i in range(4096, len(data), 1_000_003):
        data[i:i + 3] = b"<%="
    assert validate(bytes(data), "video/mp4").kind == "video"


@pytest.mark.parametrize("brand", [b"3gp6", b"3g2a", b"XAVC", b"mp71", b"iso8", b"qt  "])
def test_marcas_de_video_de_celular(brand):
    data = b"\x00\x00\x00\x18ftyp" + brand + b"\x00" * 64
    assert validate(data, "video/mp4").kind == "video"


def test_audio_m4a_recusado():
    with pytest.raises(MediaRejected, match="não é vídeo"):
        validate(b"\x00\x00\x00\x18ftypM4A " + b"\x00" * 64, "video/mp4")
