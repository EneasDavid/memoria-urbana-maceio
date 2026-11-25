// Núcleo da sessão: assinatura HMAC, cookies e papéis. A verificação do login do Firebase fica em firebaseToken.ts.
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

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

/** HMAC-SHA256 em base64url (43 caracteres). Usado nas provas de dono dos selos. */
export async function hmacB64(secret: string, message: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(message))
  return b64url(new Uint8Array(sig))
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

export function roleFor(email: string | undefined, gestorEmails: string | undefined): 'visitante' | 'gestor' {
  const list = (gestorEmails || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  return email && list.includes(email.toLowerCase()) ? 'gestor' : 'visitante'
}
