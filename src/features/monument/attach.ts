import { LIMITS, checkBytes, fmtBytes, type MediaKind } from '../../shared/media'

// Prepara o anexo do relato no próprio aparelho, antes de qualquer envio:
// valida o conteúdo real (src/shared/media.ts), recodifica fotos e confere a duração de vídeos.
export type Attachment = { blob: Blob; kind: MediaKind; mime: string; bytes: number; preview: string; seconds?: number; label: string }
export type Prepared = { ok: true; att: Attachment } | { ok: false; reason: string }

export async function prepareAttachment(file: File): Promise<Prepared> {
  // 1. barra pelo tamanho antes de ler o arquivo para a memória
  if (file.size > LIMITS.videoBytes) return { ok: false, reason: `Arquivo grande demais (${fmtBytes(file.size)}). O máximo é ${LIMITS.videoBytes / 1024 / 1024} MB para vídeo e ${LIMITS.imageInBytes / 1024 / 1024} MB para foto.` }
  const bytes = new Uint8Array(await file.arrayBuffer())
  // 2. tipo real, poliglotas, scripts e dimensões
  const check = checkBytes(bytes, file.type)
  if (!check.ok) return check
  if (check.kind === 'image') return reencodeImage(new Blob([bytes], { type: check.mime }))
  return checkVideo(new Blob([bytes], { type: check.mime }), check.mime)
}

// 3. foto: decodifica, confere megapixels e redesenha em JPEG ≤ 1600 px. Só os pixels sobrevivem:
//    EXIF/GPS, metadados e qualquer conteúdo escondido ficam para trás.
async function reencodeImage(src: Blob): Promise<Prepared> {
  let bmp: ImageBitmap
  try { bmp = await createImageBitmap(src) } catch { return { ok: false, reason: 'Não foi possível abrir esta foto. Tente JPG ou PNG.' } }
  if (bmp.width * bmp.height > LIMITS.maxPixels) { bmp.close(); return { ok: false, reason: 'Imagem com dimensões fora do limite (máx. 40 megapixels).' } }
  const scale = Math.min(1, LIMITS.outSide / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82))
  if (!blob) return { ok: false, reason: 'Não foi possível preparar a foto.' }
  return { ok: true, att: { blob, kind: 'image', mime: 'image/jpeg', bytes: blob.size, preview: URL.createObjectURL(blob), label: `Foto ${w}×${h} · ${fmtBytes(blob.size)} · sem localização` } }
}

// 4. vídeo: o navegador lê só os metadados para conferir a duração
function checkVideo(blob: Blob, mime: string): Promise<Prepared> {
  const url = URL.createObjectURL(blob)
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    const done = (r: Prepared) => { v.removeAttribute('src'); v.load(); if (!r.ok) URL.revokeObjectURL(url); resolve(r) }
    const timer = window.setTimeout(() => done({ ok: false, reason: 'Não foi possível ler este vídeo.' }), 8000)
    v.onloadedmetadata = () => {
      window.clearTimeout(timer)
      const s = v.duration
      if (!Number.isFinite(s) || s <= 0) return done({ ok: false, reason: 'Não foi possível ler a duração do vídeo.' })
      if (s > LIMITS.videoSeconds + 0.5) return done({ ok: false, reason: `Vídeo longo demais (${Math.round(s)} s). O máximo é ${LIMITS.videoSeconds} s.` })
      done({ ok: true, att: { blob, kind: 'video', mime, bytes: blob.size, preview: url, seconds: Math.round(s), label: `Vídeo ${Math.round(s)} s · ${fmtBytes(blob.size)}` } })
    }
    v.onerror = () => { window.clearTimeout(timer); done({ ok: false, reason: 'Formato de vídeo não suportado neste aparelho.' }) }
    v.src = url
  })
}
