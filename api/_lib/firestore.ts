// Firestore (Firebase) pela API REST, só no servidor, com uma conta de serviço do Google.
// Sem dependências: o login da conta de serviço é um JWT RS256 assinado com Web Crypto e trocado por um
// token de acesso (OAuth 2.0, RFC 7523). As regras do Firestore negam o acesso direto do navegador;
// a conta de serviço (papel "Cloud Datastore User") é a única que lê e grava.
//
// Variáveis (Vercel → Settings → Environment Variables), passo a passo em docs/firebase.md:
//   Na Vercel (sem chave): GCP_WORKLOAD_IDENTITY_PROVIDER e GCP_SERVICE_ACCOUNT (api/_lib/gcpOidc.ts)
//   Fora da Vercel: FIREBASE_SERVICE_ACCOUNT = conteúdo do JSON da conta de serviço (inteiro, ou em base64)
//   ou, separadas: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//   FIRESTORE_EMULATOR_HOST   = host:porta do emulador local (opcional; dispensa credenciais)
import { b64url, fromB64url } from './session.js'
import { federatedAccessToken, oidcFederation } from './gcpOidc.js'
import { DEFAULT_FIREBASE_PROJECT } from './config.js'

export interface ServiceAccount { projectId: string; clientEmail: string; privateKey: string }

export function serviceAccount(env: Record<string, string | undefined> = process.env): ServiceAccount | null {
  let raw = env.FIREBASE_SERVICE_ACCOUNT?.trim()
  if (raw) {
    if (!raw.startsWith('{')) { try { raw = new TextDecoder().decode(fromB64url(raw)) } catch { return null } }
    try {
      const j = JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string }
      if (j.project_id && j.client_email && j.private_key) return { projectId: j.project_id, clientEmail: j.client_email, privateKey: j.private_key }
    } catch { /* JSON inválido */ }
    return null
  }
  const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_PRIVATE_KEY: key } = env
  // a Vercel guarda quebras de linha da chave como "\n" literal
  return projectId && clientEmail && key ? { projectId, clientEmail, privateKey: key.replace(/\\n/g, '\n') } : null
}

async function importKey(pem: string): Promise<CryptoKey> {
  const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
}

/** JWT da conta de serviço (válido por 1 hora) para trocar por token de acesso. */
export async function serviceJwt(sa: ServiceAccount, now = Date.now()): Promise<string> {
  const enc = new TextEncoder()
  const iat = Math.floor(now / 1000)
  const head = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const claims = b64url(enc.encode(JSON.stringify({ iss: sa.clientEmail, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 })))
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', await importKey(sa.privateKey), enc.encode(`${head}.${claims}`))
  return `${head}.${claims}.${b64url(new Uint8Array(sig))}`
}

let cached: { token: string; until: number; who: string } | null = null
async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cached && cached.who === sa.clientEmail && cached.until > Date.now() + 60_000) return cached.token
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: await serviceJwt(sa) }),
  })
  if (!r.ok) throw new Error(`Login da conta de serviço falhou (${r.status})`)
  const j = (await r.json()) as { access_token: string; expires_in: number }
  cached = { token: j.access_token, until: Date.now() + j.expires_in * 1000, who: sa.clientEmail }
  return j.access_token
}

export interface Firestore { getDoc(path: string): Promise<Record<string, unknown> | null>; setDoc(path: string, fields: Record<string, unknown>): Promise<void> }

/**
 * Cliente do Firestore. Ordem de credencial: emulador local → sem chave (OIDC da Vercel, recomendado)
 * → conta de serviço com chave (FIREBASE_SERVICE_ACCOUNT, para o servidor Oracle ou testes).
 */
export function firestore(env: Record<string, string | undefined> = process.env, oidcToken: string | null = null): Firestore | null {
  const emulator = env.FIRESTORE_EMULATOR_HOST
  const fed = oidcFederation(env)
  const keyless = !emulator && fed && oidcToken ? fed : null
  const sa = keyless ? null : serviceAccount(env)
  const projectId = keyless ? env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT : sa?.projectId || (emulator ? env.FIREBASE_PROJECT_ID || 'demo-memoria-urbana' : '')
  if (!projectId || (!sa && !emulator && !keyless)) return null
  const base = `${emulator ? `http://${emulator}` : 'https://firestore.googleapis.com'}/v1/projects/${projectId}/databases/(default)/documents/`
  const bearer = async () => (emulator ? 'owner' : keyless ? federatedAccessToken(keyless, oidcToken!) : accessToken(sa!))
  const headers = async (): Promise<Record<string, string>> => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${await bearer()}` })
  return {
    async getDoc(path) {
      const r = await fetch(base + path, { headers: await headers() })
      if (r.status === 404) return null
      if (!r.ok) throw new Error(`Firestore respondeu ${r.status}`)
      return fromFields(((await r.json()) as { fields?: Record<string, FsValue> }).fields || {})
    },
    async setDoc(path, fields) {
      const r = await fetch(base + path, { method: 'PATCH', headers: await headers(), body: JSON.stringify({ fields: toFields(fields) }) })
      if (!r.ok) throw new Error(`Firestore respondeu ${r.status}`)
    },
  }
}

// ---- conversão entre objetos JS e o formato tipado do Firestore REST ----
type FsValue = { stringValue?: string; integerValue?: string; doubleValue?: number; booleanValue?: boolean; nullValue?: null; timestampValue?: string; arrayValue?: { values?: FsValue[] }; mapValue?: { fields?: Record<string, FsValue> } }

export function toValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null }
  if (v instanceof Date) return { timestampValue: v.toISOString() }
  if (typeof v === 'string') return { stringValue: v }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } }
  return { mapValue: { fields: toFields(v as Record<string, unknown>) } }
}
export const toFields = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, toValue(v)]))

export function fromValue(v: FsValue): unknown {
  if ('stringValue' in v) return v.stringValue
  if ('integerValue' in v) return Number(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue
  if ('booleanValue' in v) return v.booleanValue
  if ('timestampValue' in v) return v.timestampValue
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(fromValue)
  if ('mapValue' in v) return fromFields(v.mapValue?.fields || {})
  return null
}
export const fromFields = (f: Record<string, FsValue>): Record<string, unknown> => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, fromValue(v)]))
