// Núcleo do login: assinatura de sessão, PKCE, cookies e validação do ID token.
// Sem dependências: usa Web Crypto (Node 18+ e Vercel Functions).
// Este arquivo não importa nada, para poder ser testado direto com `node --test`.

const enc = new TextEncoder()
const dec = new TextDecoder()

export function b64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)
  const bin = atob(pad)
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function randomToken(bytes = 32): string {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)))
}

/** PKCE S256 (RFC 7636): challenge = BASE64URL(SHA256(verifier)). */
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(verifier))
  return b64url(new Uint8Array(digest))
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

/** Token compacto "payload.assinatura" (HMAC-SHA256). `exp` em segundos é obrigatório. */
export async function sign(payload: Record<string, unknown> & { exp: number }, secret: string): Promise<string> {
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET precisa de pelo menos 32 caracteres')
  const body = b64url(enc.encode(JSON.stringify(payload)))
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body))
  return `${body}.${b64url(new Uint8Array(sig))}`
}

export async function verify<T extends { exp: number }>(token: string | undefined | null, secret: string, now = Date.now()): Promise<T | null> {
  if (!token || !secret) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  let ok = false
  try {
    ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64url(sig), enc.encode(body))
  } catch {
    return null
  }
  if (!ok) return null
  try {
    const data = JSON.parse(dec.decode(fromB64url(body))) as T
    if (typeof data.exp !== 'number' || data.exp * 1000 < now) return null
    return data
  } catch {
    return null
  }
}

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of (header || '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function cookie(name: string, value: string, maxAgeSeconds: number, secure = true): string {
  return [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`, secure ? 'Secure' : ''].filter(Boolean).join('; ')
}

/** Só caminhos internos: bloqueia open redirect. */
export function safeReturnTo(value: string | null | undefined, fallback = '/app'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}

export interface IdClaims {
  iss: string
  aud: string
  sub: string
  exp: number
  nonce?: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

/** Lê o payload do ID token. Ele veio direto do endpoint de token do Google por TLS
 *  (OIDC Core 3.1.3.7, item 6), então validamos as claims; a assinatura é garantida pelo TLS. */
export function decodeIdToken(idToken: string): IdClaims {
  const part = idToken.split('.')[1]
  if (!part) throw new Error('id_token malformado')
  return JSON.parse(dec.decode(fromB64url(part))) as IdClaims
}

export function validateClaims(c: IdClaims, opts: { clientId: string; nonce: string; now?: number }): string | null {
  const now = (opts.now ?? Date.now()) / 1000
  if (c.iss !== 'https://accounts.google.com' && c.iss !== 'accounts.google.com') return 'emissor inválido'
  if (c.aud !== opts.clientId) return 'audiência inválida'
  if (!c.exp || c.exp < now) return 'token expirado'
  if (c.nonce !== opts.nonce) return 'nonce inválido'
  if (!c.sub) return 'sem sub'
  if (c.email && c.email_verified === false) return 'e-mail não verificado'
  return null
}

export function roleFor(email: string | undefined, gestorEmails: string | undefined): 'visitante' | 'gestor' {
  const list = (gestorEmails || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  return email && list.includes(email.toLowerCase()) ? 'gestor' : 'visitante'
}
