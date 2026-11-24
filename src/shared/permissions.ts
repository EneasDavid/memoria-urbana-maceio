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

/** Vídeo sem áudio, sempre. Única porta de entrada para a câmera no site. */
export function openCamera(video: MediaTrackConstraints = { facingMode: 'environment' }) {
  return navigator.mediaDevices.getUserMedia({ video, audio: false })
}

/** Dispara os pedidos oficiais do navegador para localização e câmera (sem guardar posição nem imagem). */
export async function requestDevicePerms(want: { loc: boolean; cam: boolean }): Promise<Perms> {
  const out: Perms = { loc: want.loc ? null : false, cam: want.cam ? null : false }
  if (want.loc && navigator.geolocation) {
    out.loc = await new Promise<boolean>((ok) => navigator.geolocation.getCurrentPosition(() => ok(true), () => ok(false), { timeout: 15000, maximumAge: 60000 }))
  }
  if (want.cam && navigator.mediaDevices) {
    try { const s = await openCamera(); s.getTracks().forEach((t) => t.stop()); out.cam = true } catch { out.cam = false }
  }
  savePerms(out)
  return out
}
