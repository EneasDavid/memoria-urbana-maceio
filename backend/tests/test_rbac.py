from app.core.rbac import ASSIGNABLE, PERMISSIONS, Perm, Role, can


def test_anonimo_le_e_relata_mas_nao_pontua():
    assert can(Role.ANONIMO, Perm.MONUMENT_READ)
    assert can(Role.ANONIMO, Perm.REPORT_CREATE)
    assert not can(Role.ANONIMO, Perm.STAMP_WRITE_OWN)


def test_hierarquia_participante_contem_anonimo():
    assert PERMISSIONS[Role.ANONIMO] < PERMISSIONS[Role.PARTICIPANTE]
    assert PERMISSIONS[Role.PARTICIPANTE] < PERMISSIONS[Role.CURADOR]
    assert PERMISSIONS[Role.PARTICIPANTE] < PERMISSIONS[Role.GESTOR]


def test_curador_e_gestor_sao_ramos_separados():
    assert can(Role.CURADOR, Perm.MONUMENT_WRITE) and not can(Role.CURADOR, Perm.REPORT_READ)
    assert can(Role.GESTOR, Perm.REPORT_READ) and not can(Role.GESTOR, Perm.MONUMENT_WRITE)


def test_so_admin_atribui_papel():
    assert [r for r in Role if can(r, Perm.ROLE_ASSIGN)] == [Role.ADMIN]
    assert Role.PARCEIRO not in ASSIGNABLE and Role.ANONIMO not in ASSIGNABLE


def test_parceiro_so_le_fluxo_agregado():
    assert PERMISSIONS[Role.PARCEIRO] == {Perm.MONUMENT_READ, Perm.FLOW_READ}
