"""Carimbos da Trilha. Os pontos são calculados no servidor: o cliente só diz qual placa leu.

Barra as fraudes de valor descritas em docs/seguranca-14-ataques.md (ataques 4 a 8):
- o corpo não aceita xp, pontos, papel nem uid (extra="forbid" → 422);
- o valor vem do cadastro do monumento, nunca do navegador;
- o mesmo carimbo só conta uma vez por dia (SET NX no Redis);
- só conta com papel participante ou acima; a conta é a da sessão.
"""
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from app.core.rbac import Perm, current_uid, require

router = APIRouter(prefix="/me/stamps", tags=["carimbos"])
DEFAULT_XP = 100


class StampIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    monumentId: str = Field(pattern=r"^[a-z0-9-]{2,40}$")
    method: Literal["qr", "nfc", "gps"]


def _uid(uid: str | None = Depends(current_uid)) -> str:
    if not uid:
        raise HTTPException(401, "Entre com sua conta para continuar")
    return uid


@router.post("", status_code=201)
def add_stamp(body: StampIn, request: Request, _=Depends(require(Perm.STAMP_WRITE_OWN)), uid: str = Depends(_uid)):
    s = request.app.state
    m = s.monuments.get(body.monumentId)
    if not m:
        raise HTTPException(404, "Monumento não encontrado")
    xp = int(m.get("xp", DEFAULT_XP))
    first = s.redis.set(f"stamp:{uid}:{body.monumentId}:{date.today().isoformat()}", 1, nx=True, ex=60 * 60 * 26)
    if not first:
        return {"monumentId": body.monumentId, "xp": 0, "total": int(s.redis.get(f"xp:{uid}") or 0), "repeated": True}
    s.redis.sadd(f"stamps:{uid}", body.monumentId)
    total = s.redis.incrby(f"xp:{uid}", xp)
    return {"monumentId": body.monumentId, "xp": xp, "total": total, "repeated": False}


@router.get("")
def my_stamps(request: Request, _=Depends(require(Perm.STAMP_WRITE_OWN)), uid: str = Depends(_uid)):
    r = request.app.state.redis
    return {"stamps": sorted(r.smembers(f"stamps:{uid}")), "total": int(r.get(f"xp:{uid}") or 0)}
