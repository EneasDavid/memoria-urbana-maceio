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

// ---- Pedir uma vez só ----
// O navegador é a fonte da verdade: se a pessoa já respondeu (aqui ou nas configurações), não perguntamos de novo.
// - 'granted': usa direto, sem aviso nem pedido.
// - 'denied': NÃO chama a câmera/GPS (o pedido nem apareceria); mostra como liberar no cadeado da barra de endereço.
// - 'prompt': só pede quando a pessoa toca no botão que precisa do recurso, e a resposta fica guardada.
export type PermState = 'granted' | 'denied' | 'prompt' | 'unknown'
export async function permState(name: 'camera' | 'geolocation'): Promise<PermState> {
  try {
    const perms = (navigator as Navigator & { permissions?: Permissions }).permissions
    if (!perms) return 'unknown'
    return (await perms.query({ name: name as PermissionName })).state as PermState
  } catch { return 'unknown' } // Firefox/Safari antigos não consultam câmera
}

/** Mantém mu_perms igual ao que o navegador sabe (e acompanha se a pessoa mudar nas configurações). */
export function syncPerms() {
  if (typeof navigator === 'undefined') return
  const apply = (k: 'loc' | 'cam', st: string) => {
    const v = st === 'granted' ? true : st === 'denied' ? false : null
    const p = loadPerms()
    if (v !== null && p[k] !== v) savePerms({ ...p, [k]: v })
  }
  const perms = (navigator as Navigator & { permissions?: Permissions }).permissions
  for (const [name, k] of [['geolocation', 'loc'], ['camera', 'cam']] as const) {
    perms?.query({ name: name as PermissionName }).then((st) => { apply(k, st.state); st.onchange = () => apply(k, st.state) }).catch(() => undefined)
  }
}
if (typeof window !== 'undefined') syncPerms()

export class CameraBlockedError extends Error {
  constructor() { super('A câmera está bloqueada para este site. Toque no cadeado ao lado do endereço, libere a câmera e tente de novo.'); this.name = 'NotAllowedError' }
}

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
  // já recusada no navegador: não insiste (evita pedido repetido ou falha muda)
  if ((await permState('camera')) === 'denied') { savePerms({ ...loadPerms(), cam: false }); throw new CameraBlockedError() }
  try {
    cached = await navigator.mediaDevices.getUserMedia({ video, audio: false })
  } catch (e) {
    if ((e as Error)?.name === 'NotAllowedError') savePerms({ ...loadPerms(), cam: false })
    throw e
  }
  cachedKey = key
  try { const p = loadPerms(); if (p.cam !== true) savePerms({ ...p, cam: true }) } catch { /* nada */ }
  return cached
}

/** Solta a câmera: desliga de verdade só depois de 5 minutos sem uso (ou ao sair da página).
 *  No iPhone a permissão vale enquanto a página está aberta: manter o vídeo pronto evita perguntar de novo. */
export function releaseCamera(stream?: MediaStream | null) {
  if (!stream || stream !== cached) { stream?.getTracks().forEach((t) => t.stop()); return }
  window.clearTimeout(stopTimer)
  stopTimer = window.setTimeout(() => { cached?.getTracks().forEach((t) => t.stop()); cached = null }, 300_000)
}
if (typeof window !== 'undefined') window.addEventListener('pagehide', () => { cached?.getTracks().forEach((t) => t.stop()); cached = null })

/** Dispara os pedidos oficiais do navegador para localização e câmera (sem guardar posição nem imagem).
 *  O que o navegador já respondeu não é perguntado de novo. */
export async function requestDevicePerms(want: { loc: boolean; cam: boolean }): Promise<Perms> {
  const out: Perms = { loc: want.loc ? null : false, cam: want.cam ? null : false }
  const [locSt, camSt] = await Promise.all([permState('geolocation'), permState('camera')])
  if (locSt === 'granted' || locSt === 'denied') { out.loc = locSt === 'granted'; want = { ...want, loc: false } }
  if (camSt === 'granted' || camSt === 'denied') { out.cam = camSt === 'granted'; want = { ...want, cam: false } }
  savePerms(out) // o que já se sabe fica guardado na hora (o GPS pode demorar a responder)
  if (want.loc && navigator.geolocation) {
    out.loc = await new Promise<boolean>((ok) => navigator.geolocation.getCurrentPosition(() => ok(true), (e) => ok(e.code === e.PERMISSION_DENIED ? false : true), { timeout: 15000, maximumAge: 60000 }))
    savePerms({ ...loadPerms(), loc: out.loc })
  }
  if (want.cam && navigator.mediaDevices) {
    try { const s = await openCamera(); releaseCamera(s); out.cam = true } catch { out.cam = false }
  }
  savePerms({ ...loadPerms(), ...(want.cam ? { cam: out.cam } : {}), ...(out.loc !== null ? { loc: out.loc } : {}) })
  return out
}
