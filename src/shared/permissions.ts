// Permissões do aparelho, pedidas no primeiro acesso (junto do aviso de cookies) ou na hora do uso.
// - Localização e câmera: o aviso de boas-vindas pergunta; o navegador mostra o pedido oficial em seguida.
// - Galeria de fotos: só quando a pessoa vai anexar uma foto (aviso próprio no relato).
// - Microfone: NUNCA. Nenhuma chamada pede áudio e o cabeçalho Permissions-Policy bloqueia (microphone=()).
const KEY = 'mu_perms'
export interface Perms { loc: boolean | null; cam: boolean | null }

export function loadPerms(): Perms {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { loc: typeof p.loc === 'boolean' ? p.loc : null, cam: typeof p.cam === 'boolean' ? p.cam : null }
  } catch { return { loc: null, cam: null } }
}
export function savePerms(p: Perms) { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* privado */ } }

// A câmera é aberta uma vez e reaproveitada: fechar o leitor só "solta" o vídeo, que fica pronto por 2 minutos.
// Assim o navegador não pede permissão de novo a cada leitura (o iPhone pede de novo só se a página recarregar).
let cached: MediaStream | null = null
let cachedKey = ''
let stopTimer: number | undefined
const live = (s: MediaStream | null) => !!s && s.getVideoTracks().some((t) => t.readyState === 'live')

/** Vídeo sem áudio, sempre. Única porta de entrada para a câmera no site. */
export async function openCamera(video: MediaTrackConstraints = { facingMode: 'environment' }): Promise<MediaStream> {
  const key = JSON.stringify(video)
  window.clearTimeout(stopTimer)
  if (live(cached) && cachedKey === key) return cached!
  if (live(cached)) cached!.getTracks().forEach((t) => t.stop())
  cached = await navigator.mediaDevices.getUserMedia({ video, audio: false })
  cachedKey = key
  try { const p = loadPerms(); if (p.cam !== true) savePerms({ ...p, cam: true }) } catch { /* nada */ }
  return cached
}

/** Solta a câmera: desliga de verdade só depois de 2 minutos sem uso (ou ao sair da página). */
export function releaseCamera(stream?: MediaStream | null) {
  if (!stream || stream !== cached) { stream?.getTracks().forEach((t) => t.stop()); return }
  window.clearTimeout(stopTimer)
  stopTimer = window.setTimeout(() => { cached?.getTracks().forEach((t) => t.stop()); cached = null }, 120_000)
}
if (typeof window !== 'undefined') window.addEventListener('pagehide', () => { cached?.getTracks().forEach((t) => t.stop()); cached = null })

/** Dispara os pedidos oficiais do navegador para localização e câmera (sem guardar posição nem imagem). */
export async function requestDevicePerms(want: { loc: boolean; cam: boolean }): Promise<Perms> {
  const out: Perms = { loc: want.loc ? null : false, cam: want.cam ? null : false }
  if (want.loc && navigator.geolocation) {
    out.loc = await new Promise<boolean>((ok) => navigator.geolocation.getCurrentPosition(() => ok(true), () => ok(false), { timeout: 15000, maximumAge: 60000 }))
  }
  if (want.cam && navigator.mediaDevices) {
    try { const s = await openCamera(); releaseCamera(s); out.cam = true } catch { out.cam = false }
  }
  savePerms(out)
  return out
}
