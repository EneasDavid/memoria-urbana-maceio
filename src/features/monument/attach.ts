import { LIMITS, checkBytes, fmtBytes, type MediaKind } from '../../shared/media'

// Prepara o anexo do relato no próprio aparelho, antes de qualquer envio:
// valida o conteúdo real (src/shared/media.ts), recodifica fotos e confere a duração de vídeos.
export type Attachment = { blob: Blob; kind: MediaKind; mime: string; bytes: number; preview: string; seconds?: number; label: string }
export type Prepared = { ok: true; att: Attachment } | { ok: false; reason: string }

export type Stage = 'lendo' | 'verificando' | 'preparando-foto' | 'lendo-video'

export async function prepareAttachment(file: File, onStage: (s: Stage) => void = () => {}): Promise<Prepared> {
  // 1. barra pelo tamanho antes de ler o arquivo para a memória
  if (file.size > LIMITS.videoBytes) return { ok: false, reason: `Arquivo grande demais (${fmtBytes(file.size)}). O máximo é ${LIMITS.videoBytes / 1024 / 1024} MB para vídeo e ${LIMITS.imageInBytes / 1024 / 1024} MB para foto.` }
  onStage('lendo')
  const bytes = new Uint8Array(await file.arrayBuffer())
  onStage('verificando')
  await new Promise((r) => setTimeout(r, 0)) // deixa a animação aparecer antes da checagem
  // 2. tipo real, poliglotas, scripts e dimensões
  const check = checkBytes(bytes, file.type)
  if (!check.ok) return check
  if (check.kind === 'image') { onStage('preparando-foto'); return reencodeImage(new Blob([bytes], { type: check.mime })) }
  onStage('lendo-video')
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

// 4. vídeo: o navegador lê só os metadados para conferir a duração.
//    Se este navegador não decodifica o formato (ex.: HEVC/MOV do iPhone no Chrome do computador), o vídeo
//    NÃO é recusado: já passou nas checagens de conteúdo, e o servidor confere a duração com ffprobe.
function checkVideo(blob: Blob, mime: string): Promise<Prepared> {
  const url = URL.createObjectURL(blob)
  const accept = (seconds?: number): Prepared => ({ ok: true, att: { blob, kind: 'video', mime, bytes: blob.size, preview: url, seconds, label: seconds ? `Vídeo ${seconds} s · ${fmtBytes(blob.size)}` : `Vídeo · ${fmtBytes(blob.size)} · duração conferida no envio` } })
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    v.playsInline = true
    let settled = false
    const done = (r: Prepared) => { if (settled) return; settled = true; window.clearTimeout(timer); v.removeAttribute('src'); v.load(); if (!r.ok) URL.revokeObjectURL(url); resolve(r) }
    const timer = window.setTimeout(() => done(accept()), 6000)
    v.onloadedmetadata = () => {
      const s = v.duration
      if (!Number.isFinite(s) || s <= 0) return done(accept()) // alguns MP4 só informam a duração ao tocar
      if (s > LIMITS.videoSeconds + 0.5) return done({ ok: false, reason: `Vídeo longo demais (${Math.round(s)} s). O máximo é ${LIMITS.videoSeconds} s: corte o vídeo e tente de novo.` })
      done(accept(Math.round(s)))
    }
    v.onerror = () => done(accept())
    v.src = url
  })
}
