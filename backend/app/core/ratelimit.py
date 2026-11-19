"""Rate limit de janela fixa no Redis (relatos anônimos e parceiros)."""
import hashlib
from datetime import UTC, datetime

from redis import Redis


def ip_hash(ip: str, salt: str) -> str:
    # Nunca guardamos o IP: só um hash com sal rotacionado (LGPD).
    return hashlib.sha256(f"{salt}:{ip}".encode()).hexdigest()[:24]


def hit(r: Redis, key_prefix: str, subject: str, limit: int, window_seconds: int = 3600) -> bool:
    """Conta uma ação. Devolve False quando passou do limite na janela atual."""
    bucket = datetime.now(UTC).strftime("%Y%m%d%H") if window_seconds == 3600 else datetime.now(UTC).strftime("%Y%m%d%H%M")
    key = f"{key_prefix}:{subject}:{bucket}"
    n = r.incr(key)
    if n == 1:
        r.expire(key, window_seconds)
    return n <= limit
