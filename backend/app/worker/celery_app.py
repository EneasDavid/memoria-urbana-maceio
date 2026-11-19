"""Celery: filas default, media e notify; agendamentos no beat (docs/arquitetura.md §6).
Rodar: celery -A app.worker.celery_app worker -Q default,media,notify  |  celery -A app.worker.celery_app beat
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

cfg = settings()
celery = Celery("memoria_urbana", broker=cfg.celery_broker_url, backend=cfg.celery_result_backend, include=["app.worker.tasks"])
celery.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_time_limit=120,
    task_default_queue="default",
    task_routes={"media.*": {"queue": "media"}, "notify.*": {"queue": "notify"}},
    timezone="America/Maceio",
    beat_schedule={
        "flush-visits": {"task": "default.flush_visits", "schedule": crontab(minute="*/15")},
        "check-tag-health": {"task": "default.check_tag_health", "schedule": crontab(hour=6, minute=0)},
        "purge-expired": {"task": "default.purge_expired", "schedule": crontab(hour=3, minute=0)},
    },
)
