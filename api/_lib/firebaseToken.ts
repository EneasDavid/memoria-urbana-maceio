// Verificação do ID token do Firebase Authentication, só no servidor e sem dependências.
// O navegador entra com Google pelo Firebase (popup) e manda o ID token uma única vez para /api/auth/session.
// Aqui conferimos a assinatura RS256 com as chaves públicas do Google (sem credencial nenhuma) e as claims
// exigidas pelo Firebase: https://firebase.google.com/docs/auth/admin/verify-id-tokens
// Não importa nada (como session.ts), para poder ser testado direto com `node --test`.

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export interface FirebaseClaims {
  iss: string
  aud: string
  sub: string
  iat: number
  exp: number
  auth_time: number
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
  firebase?: { sign_in_provider?: string; identities?: Record<string, string[]> }
}

export const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

type Jwk = JsonWebKey & { kid: string }
let cache: { keys: Jwk[]; until: number } | null = null

/** Chaves públicas do Firebase Auth, guardadas pelo tempo que o Google manda (Cache-Control max-age). */
export async function publicKeys(fetcher: typeof fetch = fetch, now = Date.now()): Promise<Jwk[]> {
  if (cache && cache.until > now) return cache.keys
  const r = await fetcher(JWKS_URL)
  if (!r.ok) throw new Error(`Chaves do Firebase indisponíveis (${r.status})`)
  const maxAge = Number(/max-age=(\d+)/.exec(r.headers.get('cache-control') || '')?.[1] || 3600)
  const { keys } = (await r.json()) as { keys: Jwk[] }
  cache = { keys, until: now + maxAge * 1000 }
  return keys
}

export function resetKeyCache(): void { cache = null }

const dec = new TextDecoder()
const part = <T>(s: string): T => JSON.parse(dec.decode(fromB64url(s))) as T

/** Tempo máximo entre o login no Google e a troca pelo cookie: impede reaproveitar um token antigo. */
export const MAX_AUTH_AGE = 5 * 60

/** Devolve as claims se o token for válido para este projeto, ou o motivo da recusa. */
export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
  opts: { fetcher?: typeof fetch; now?: number } = {},
): Promise<{ claims: FirebaseClaims } | { error: string }> {
  const now = opts.now ?? Date.now()
  const pieces = typeof token === 'string' ? token.split('.') : []
  if (pieces.length !== 3) return { error: 'token malformado' }
  const [h, p, s] = pieces
  let head: { alg?: string; kid?: string }, claims: FirebaseClaims
  try { head = part(h); claims = part(p) } catch { return { error: 'token malformado' } }
  if (head.alg !== 'RS256' || !head.kid) return { error: 'algoritmo inválido' }

  const jwk = (await publicKeys(opts.fetcher, now)).find((k) => k.kid === head.kid)
  if (!jwk) return { error: 'chave desconhecida' }
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, fromB64url(s), new TextEncoder().encode(`${h}.${p}`))
  if (!ok) return { error: 'assinatura inválida' }

  const t = Math.floor(now / 1000)
  const skew = 60
  if (claims.aud !== projectId) return { error: 'audiência inválida' }
  if (claims.iss !== `https://securetoken.google.com/${projectId}`) return { error: 'emissor inválido' }
  if (!claims.sub || claims.sub.length > 128) return { error: 'sem sub' }
  if (!claims.exp || claims.exp + skew < t) return { error: 'token expirado' }
  if (!claims.iat || claims.iat - skew > t) return { error: 'token do futuro' }
  if (!claims.auth_time || claims.auth_time - skew > t) return { error: 'login do futuro' }
  if (t - claims.auth_time > MAX_AUTH_AGE) return { error: 'login antigo; entre de novo' }
  if (claims.firebase?.sign_in_provider !== 'google.com') return { error: 'só login com Google' }
  if (claims.email && claims.email_verified === false) return { error: 'e-mail não verificado' }
  return { claims }
}

/** Id estável da conta: o id do Google (o mesmo do login antigo), para não perder selos nem provas de dono. */
export function accountId(c: FirebaseClaims): string {
  return c.firebase?.identities?.['google.com']?.[0] || c.sub
}
