"""Segurança dos anexos de relato (foto ou vídeo). Mesmas regras de src/shared/media.ts.

O servidor não confia no navegador: repete todas as checagens nos bytes recebidos.

Regras:
1. Tamanho máximo: foto 10 MB, vídeo 25 MB. O endpoint corta o upload ao passar do limite (lê em streaming).
2. Tipo pelo conteúdo (magic bytes). Só JPEG, PNG, WebP, HEIC/HEIF/AVIF, MP4/MOV e WebM.
   ZIP, GZIP, 7z, RAR, BZIP2, XZ, TAR, PDF, SVG/HTML/XML e executáveis são recusados. O servidor nunca descompacta nada.
3. Poliglotas: ZIP (cabeçalho local plausível ou fim de diretório no fim do arquivo), RAR ou 7z embutidos são recusados,
   assim como marcadores de script e injeção (<script, <?php, javascript:, onerror=, <!ENTITY…).
4. Bomba de descompressão: dimensões lidas do cabeçalho; mais de 40 megapixels ou lado > 12.000 px é recusado
   antes de qualquer decodificação. A task media.process_report_photo recodifica com Pillow e
   Image.MAX_IMAGE_PIXELS = 40_000_000 como segunda barreira.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

IMAGE_MAX_BYTES = 10 * 1024 * 1024
VIDEO_MAX_BYTES = 25 * 1024 * 1024
VIDEO_MAX_SECONDS = 30
MAX_PIXELS = 40_000_000
MAX_SIDE = 12_000

HEIF_BRANDS = {b"heic", b"heix", b"hevc", b"heim", b"heis", b"mif1", b"msf1", b"avif"}
NOT_VIDEO = {b"M4A ", b"M4B ", b"M4P ", b"F4A ", b"F4B ", b"jp2 ", b"jpx ", b"crx "}
# só marcadores com 5+ caracteres: "<%=" (3 bytes) aparecia por acaso em vídeos grandes
SCRIPT = re.compile(rb"<script|<\?php|<svg[\s>]|<html|<iframe|javascript:|onerror\s*=|onload\s*=|<!entity|\beval\s*\(", re.I)
SIX = (b"Rar!\x1a\x07", b"7z\xbc\xaf\x27\x1c")


class MediaRejected(ValueError):
    """Arquivo recusado; a mensagem é segura para mostrar ao visitante."""


@dataclass(frozen=True)
class MediaInfo:
    kind: str  # "image" | "video"
    mime: str
    size: int
    width: int | None = None
    height: int | None = None


def sniff(b: bytes) -> tuple[str, str]:
    """Retorna (kind, mime) com kind em image | video | blocked | unknown."""
    if len(b) < 12:
        return "unknown", ""
    if b.startswith(b"\xff\xd8\xff"):
        return "image", "image/jpeg"
    if b.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image", "image/png"
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
        return "image", "image/webp"
    if b[4:8] == b"ftyp":
        brand = b[8:12]
        if brand in HEIF_BRANDS:
            return "image", "image/avif" if brand == b"avif" else "image/heic"
        if brand in NOT_VIDEO:
            return "blocked", f'arquivo "{brand.decode("latin1").strip()}" (não é vídeo)'
        # qualquer outra marca ISO-BMFF é vídeo (celulares usam dezenas); o ffprobe no worker confere
        if brand == b"qt  ":
            return "video", "video/quicktime"
        return "video", "video/3gpp" if brand.startswith(b"3g") else "video/mp4"
    if b.startswith(b"\x1a\x45\xdf\xa3"):
        return "video", "video/webm"
    blocked = [
        (b"PK\x03\x04", "arquivo ZIP"), (b"PK\x05\x06", "arquivo ZIP"), (b"\x1f\x8b", "arquivo GZIP"),
        (b"7z\xbc\xaf\x27\x1c", "arquivo 7z"), (b"Rar!", "arquivo RAR"), (b"BZh", "arquivo BZIP2"),
        (b"\xfd7zXZ\x00", "arquivo XZ"), (b"%PDF", "PDF"), (b"MZ", "programa executável"), (b"\x7fELF", "programa executável"),
    ]
    for sig, what in blocked:
        if b.startswith(sig):
            return "blocked", what
    if len(b) > 262 and b[257:262] == b"ustar":
        return "blocked", "arquivo TAR"
    if b.lstrip()[:1] == b"<" or b.startswith(b"\xef\xbb\xbf<"):
        return "blocked", "texto/marcação (SVG, HTML ou XML)"
    return "unknown", ""


def _zip_inside(b: bytes) -> bool:
    i = b.find(b"PK\x03\x04", 1)
    while i != -1 and i + 30 <= len(b):
        if b[i + 4] < 64 and b[i + 5] == 0 and b[i + 8] in (0, 8, 12, 14) and b[i + 9] == 0:
            return True
        i = b.find(b"PK\x03\x04", i + 1)
    start = max(1, len(b) - 65_557)
    i = b.rfind(b"PK\x05\x06", start)
    while i != -1:
        if i + 22 <= len(b) and i + 22 + int.from_bytes(b[i + 20:i + 22], "little") == len(b):
            return True
        i = b.rfind(b"PK\x05\x06", start, i)
    return False


def hidden_payload(b: bytes) -> str | None:
    if _zip_inside(b) or any(b.find(sig, 1) != -1 for sig in SIX):
        return "arquivo compactado escondido dentro da mídia"
    if SCRIPT.search(b):
        return "código/script escondido dentro da mídia"
    return None


def image_size(b: bytes, mime: str) -> tuple[int, int] | None:
    if mime == "image/png":
        return int.from_bytes(b[16:20], "big"), int.from_bytes(b[20:24], "big")
    if mime == "image/jpeg":
        i = 2
        while i + 9 < len(b):
            if b[i] != 0xFF:
                i += 1
                continue
            m = b[i + 1]
            if m in (0xD8, 0x01) or 0xD0 <= m <= 0xD7:
                i += 2
                continue
            seg = int.from_bytes(b[i + 2:i + 4], "big")
            if 0xC0 <= m <= 0xCF and m not in (0xC4, 0xC8, 0xCC):
                return int.from_bytes(b[i + 7:i + 9], "big"), int.from_bytes(b[i + 5:i + 7], "big")
            i += 2 + seg
        return None
    if mime == "image/webp":
        chunk = b[12:16]
        if chunk == b"VP8X":
            return int.from_bytes(b[24:27], "little") + 1, int.from_bytes(b[27:30], "little") + 1
        if chunk == b"VP8 ":
            return int.from_bytes(b[26:28], "little") & 0x3FFF, int.from_bytes(b[28:30], "little") & 0x3FFF
        if chunk == b"VP8L":
            v = int.from_bytes(b[21:25], "little")
            return (v & 0x3FFF) + 1, ((v >> 14) & 0x3FFF) + 1
    return None


def validate(b: bytes, declared: str = "") -> MediaInfo:
    kind, what = sniff(b)
    if kind == "blocked":
        raise MediaRejected(f"Tipo não aceito: {what}.")
    if kind == "unknown":
        raise MediaRejected("Não reconhecemos este arquivo como foto ou vídeo.")
    limit = IMAGE_MAX_BYTES if kind == "image" else VIDEO_MAX_BYTES
    if len(b) > limit:
        raise MediaRejected(f"Arquivo grande demais: máximo de {limit // (1024 * 1024)} MB.")
    if declared and declared != "application/octet-stream" and not declared.startswith(kind + "/"):
        raise MediaRejected("O conteúdo do arquivo não bate com o tipo informado.")
    w = h = None
    if kind == "image":
        size = image_size(b, what)
        if size:
            w, h = size
            if w == 0 or h == 0 or w * h > MAX_PIXELS or w > MAX_SIDE or h > MAX_SIDE:
                raise MediaRejected("Imagem com dimensões fora do limite (máx. 40 megapixels).")
    hidden = hidden_payload(b)
    if hidden:
        raise MediaRejected(f"Arquivo recusado por segurança: {hidden}.")
    return MediaInfo(kind=kind, mime=what, size=len(b), width=w, height=h)
