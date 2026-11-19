"""Tarefas assíncronas. Cada uma vira uma task no Jira (épico E10). Todas idempotentes, com retry e backoff."""
from app.worker.celery_app import celery

RETRY = {"autoretry_for": (Exception,), "retry_backoff": True, "max_retries": 5}


@celery.task(name="media.generate_narration", **RETRY)
def generate_narration(monument_id: str, version: int) -> None:
    """Gera bio.mp3 e desc.mp3 com Google Cloud Text-to-Speech (pt-BR) e sobe no Storage."""
    raise NotImplementedError("Sprint 8: narração TTS")


@celery.task(name="media.process_report_photo", **RETRY)
def process_report_photo(report_id: str) -> None:
    """Reduz para 1280 px, remove EXIF/GPS, gera miniatura e roda moderação."""
    raise NotImplementedError("Sprint 7: fotos de relatos")


@celery.task(name="notify.new_report", **RETRY)
def new_report(report_id: str) -> None:
    """Avisa a equipe de patrimônio (e-mail ou Telegram)."""
    raise NotImplementedError("Sprint 8: notificação de relatos")


@celery.task(name="default.flush_visits")
def flush_visits() -> None:
    """Move contadores visits:* e HyperLogLog hll:* do Redis para visits_daily no Firestore."""
    raise NotImplementedError("Sprint 8: agregação de visitas")


@celery.task(name="default.check_tag_health")
def check_tag_health() -> None:
    """Marca placas sem leitura há 7 dias."""
    raise NotImplementedError("Sprint 8: saúde das tags")


@celery.task(name="default.purge_expired")
def purge_expired() -> None:
    """Retenção LGPD: anonimiza relatos com mais de 12 meses e rotaciona o sal do hash de IP."""
    raise NotImplementedError("Sprint 9: retenção LGPD")


@celery.task(name="default.delete_user_data", **RETRY)
def delete_user_data(uid: str) -> None:
    """Apaga perfil, carimbos e sessões de quem pediu exclusão."""
    raise NotImplementedError("Sprint 9: exclusão de conta")


@celery.task(name="default.merge_device_progress", **RETRY)
def merge_device_progress(uid: str, payload: dict) -> None:
    """Valida os tokens de carimbo do aparelho e grava na conta (depende do estudo de gamificação sem login)."""
    raise NotImplementedError("Sprint 9: mescla do progresso do aparelho")
