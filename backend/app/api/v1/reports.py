from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

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


@router.get("")
def list_reports(request: Request, _=Depends(require(Perm.REPORT_READ))):
    return request.app.state.reports.list()
