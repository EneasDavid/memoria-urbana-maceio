from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.media import IMAGE_MAX_BYTES, VIDEO_MAX_BYTES, MediaRejected, validate
from app.core.ratelimit import hit, ip_hash
from app.core.rbac import Perm, require

router = APIRouter(prefix="/reports", tags=["relatos"])

Kind = Literal["Danificado", "Sujo ou pichado", "Placa / QR / NFC não funciona", "Informação errada", "Outro"]


class ReportIn(BaseModel):
    monumentId: str = Field(pattern=r"^[a-z0-9-]{2,40}$")
    kind: Kind
    note: str | None = Field(default=None, max_length=500)
    hasPhoto: bool = False


@router.post("", status_code=202)
def create_report(body: ReportIn, request: Request, _=Depends(require(Perm.REPORT_CREATE))):
    s = request.app.state
    who = ip_hash(request.client.host if request.client else "0.0.0.0", s.ip_salt)
    if not hit(s.redis, "rl:report", who, s.report_rate_per_hour):
        raise HTTPException(429, "Muitos relatos seguidos. Tente de novo em uma hora.")
    report_id = s.reports.add(body.model_dump() | {"ipHash": who, "status": "Novo"})
    s.enqueue("notify.new_report", report_id)
    if body.hasPhoto:
        s.enqueue("media.process_report_photo", report_id)
    return {"id": report_id, "status": "Novo"}


@router.put("/{report_id}/media", status_code=202)
async def upload_media(report_id: str, request: Request, _=Depends(require(Perm.REPORT_CREATE))):
    """Recebe a foto ou o vídeo do relato como corpo bruto (sem multipart, sem descompactar nada).

    Corta a leitura assim que passa do limite, então um arquivo gigante (ou um Content-Length falso) não ocupa memória.
    """
    s = request.app.state
    if not s.reports.get(report_id):
        raise HTTPException(404, "Relato não encontrado.")
    declared = request.headers.get("content-type", "").split(";")[0].strip().lower()
    cap = VIDEO_MAX_BYTES if declared.startswith("video/") else IMAGE_MAX_BYTES
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > cap:
        raise HTTPException(413, "Arquivo grande demais.")
    who = ip_hash(request.client.host if request.client else "0.0.0.0", s.ip_salt)
    if not hit(s.redis, "rl:media", who, s.report_rate_per_hour):
        raise HTTPException(429, "Muitos envios seguidos. Tente de novo em uma hora.")
    buf = bytearray()
    async for chunk in request.stream():
        buf += chunk
        if len(buf) > cap:
            raise HTTPException(413, "Arquivo grande demais.")
    try:
        info = validate(bytes(buf), declared)
    except MediaRejected as e:
        raise HTTPException(415, str(e)) from e
    s.reports.attach(report_id, bytes(buf), info)
    s.enqueue("media.process_report_photo" if info.kind == "image" else "media.process_report_video", report_id)
    return {"id": report_id, "kind": info.kind, "mime": info.mime, "bytes": info.size}


@router.get("")
def list_reports(request: Request, _=Depends(require(Perm.REPORT_READ))):
    return request.app.state.reports.list()
