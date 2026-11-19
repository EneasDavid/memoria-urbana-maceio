# Arquivos de teste de anexos

Usados por `tests/media.test.mjs`, `tests/attach.test.mjs` e `backend/tests/test_media.py`. Todos são inofensivos: imitam a forma de um ataque, mas não executam nada.

**Aceitos:**
- `foto.jpg`, `foto.png`, `foto.webp`: fotos de 320×240.
- `video.mp4`: cabeçalho MP4 mínimo.

**Recusados:**

| Arquivo | O que é |
|---|---|
| `arquivo.zip` | ZIP |
| `zip-renomeado.jpg` | ZIP com extensão de foto |
| `bomba.gz` | GZIP de 10 MB que ocupa 9 KB |
| `imagem.svg` | SVG com script |
| `pagina.png` | HTML com extensão de foto |
| `programa.jpg` | Cabeçalho de executável Windows |
| `poliglota.jpg` | JPEG válido com um ZIP grudado no fim |
| `script.jpg` | JPEG válido com `<script>` num comentário |
| `bomba.png` | PNG que declara 50.000 × 50.000 px |
