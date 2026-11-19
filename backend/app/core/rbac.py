"""Níveis de acesso (RBAC). Fonte da verdade da matriz em docs/arquitetura.md §4.

Hierarquia: anonimo ⊂ participante ⊂ {curador | gestor} ⊂ admin. O parceiro é um papel de máquina (chave de API).
A API aplica as permissões com a dependência `require(...)`. O front só esconde telas.
"""
from enum import StrEnum

from fastapi import Depends, HTTPException, Request, status


class Role(StrEnum):
    ANONIMO = "anonimo"
    PARTICIPANTE = "participante"
    CURADOR = "curador"
    GESTOR = "gestor"
    ADMIN = "admin"
    PARCEIRO = "parceiro"


class Perm(StrEnum):
    MONUMENT_READ = "monument:read"
    REPORT_CREATE = "report:create"
    VISIT_CREATE = "visit:create"
    STAMP_WRITE_OWN = "stamp:write_own"
    IMMERSIVE_READ = "immersive:read"
    PROFILE_DELETE_OWN = "profile:delete_own"
    MONUMENT_WRITE = "monument:write"
    MONUMENT_PUBLISH = "monument:publish"
    REPORT_READ = "report:read"
    REPORT_UPDATE = "report:update"
    ANALYTICS_READ = "analytics:read"
    FLOW_READ = "flow:read"
    ROLE_ASSIGN = "role:assign"
    AUDIT_READ = "audit:read"


_ANON = {Perm.MONUMENT_READ, Perm.REPORT_CREATE, Perm.VISIT_CREATE}
_PART = _ANON | {Perm.STAMP_WRITE_OWN, Perm.IMMERSIVE_READ, Perm.PROFILE_DELETE_OWN}
_CUR = _PART | {Perm.MONUMENT_WRITE, Perm.MONUMENT_PUBLISH}
_GEST = _PART | {Perm.REPORT_READ, Perm.REPORT_UPDATE, Perm.ANALYTICS_READ, Perm.FLOW_READ}

PERMISSIONS: dict[Role, frozenset[Perm]] = {
    Role.ANONIMO: frozenset(_ANON),
    Role.PARTICIPANTE: frozenset(_PART),
    Role.CURADOR: frozenset(_CUR),
    Role.GESTOR: frozenset(_GEST),
    Role.ADMIN: frozenset(Perm),
    Role.PARCEIRO: frozenset({Perm.MONUMENT_READ, Perm.FLOW_READ}),
}

# Quem pode receber cada papel por PATCH /admin/users/{uid}/role (parceiro é por chave, não por usuário).
ASSIGNABLE = {Role.PARTICIPANTE, Role.CURADOR, Role.GESTOR, Role.ADMIN}


def can(role: Role, perm: Perm) -> bool:
    return perm in PERMISSIONS.get(role, frozenset())


def current_role(request: Request) -> Role:
    """Papel da requisição. A sessão (Redis) é resolvida por um middleware e salva em request.state."""
    return getattr(request.state, "role", Role.ANONIMO)


def require(perm: Perm):
    """Dependência FastAPI: 401 se precisa de conta, 403 se a conta não tem o papel."""

    def dep(role: Role = Depends(current_role)) -> Role:
        if can(role, perm):
            return role
        if role == Role.ANONIMO:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Entre com sua conta para continuar")
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Seu nível de acesso não permite esta ação")

    return dep
