// Onde o progresso de cada conta fica guardado no servidor (o primeiro configurado vale).
// - Firebase Firestore (recomendado): coleção "progresso", um documento por conta (id = SHA-256 do id Google).
//   Na Vercel, sem chave (OIDC → conta de serviço api-progresso). Passo a passo em docs/firebase.md.
// - Vercel: Upstash Redis (integração "Upstash for Redis" do Marketplace cria KV_REST_API_URL e KV_REST_API_TOKEN).
// - Servidor Oracle: arquivos JSON numa pasta (PROGRESS_DIR), um por conta, com nome = SHA-256 do id da conta.
// Sem nenhum dos dois, /api/progress responde { configured: false } e o app segue salvando só no aparelho.
import { hmacB64 } from './session.js'
import { sanitizeDoc, type ProgressDoc } from './progressDoc.js'
import { firestore } from './firestore.js'
import { vercelOidcToken } from './gcpOidc.js'

export interface ProgressStore { get(sub: string): Promise<ProgressDoc | null>; put(sub: string, doc: ProgressDoc): Promise<void> }

async function keyFor(sub: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mu-progress|' + sub))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function redisStore(url: string, token: string): ProgressStore {
  const cmd = async (args: string[]) => {
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) })
    if (!r.ok) throw new Error(`Redis respondeu ${r.status}`)
    return ((await r.json()) as { result?: unknown }).result
  }
  return {
    async get(sub) {
      const raw = await cmd(['GET', 'mu:progress:' + (await keyFor(sub))])
      return typeof raw === 'string' ? sanitizeDoc(JSON.parse(raw)) : null
    },
    async put(sub, doc) { await cmd(['SET', 'mu:progress:' + (await keyFor(sub)), JSON.stringify(doc)]) },
  }
}

function fileStore(dir: string): ProgressStore {
  const file = async (sub: string) => {
    const path = await import('node:path')
    return path.join(dir, (await keyFor(sub)) + '.json')
  }
  return {
    async get(sub) {
      const fs = await import('node:fs/promises')
      try { return sanitizeDoc(JSON.parse(await fs.readFile(await file(sub), 'utf8'))) } catch (e) { if ((e as { code?: string }).code === 'ENOENT') return null; throw e }
    },
    async put(sub, doc) {
      const fs = await import('node:fs/promises')
      await fs.mkdir(dir, { recursive: true, mode: 0o700 })
      const f = await file(sub)
      await fs.writeFile(f + '.tmp', JSON.stringify(doc), { mode: 0o600 })
      await fs.rename(f + '.tmp', f) // troca atômica: nunca fica um arquivo pela metade
    },
  }
}

function firestoreStore(req?: Request): ProgressStore | null {
  const fs = firestore(process.env, vercelOidcToken(req))
  if (!fs) return null
  return {
    async get(sub) {
      const d = await fs.getDoc('progresso/' + (await keyFor(sub)))
      return d ? sanitizeDoc(d.progresso) : null
    },
    async put(sub, doc) {
      // campos legíveis no console do Firebase; o id da conta não aparece (só o hash)
      await fs.setDoc('progresso/' + (await keyFor(sub)), { v: 1, progresso: doc as unknown as Record<string, unknown>, selos: doc.collected.length, pontos: doc.xp, atualizadoEm: new Date() })
    },
  }
}

let memory: Map<string, ProgressDoc> | null = null
/** `req` traz o token OIDC da Vercel (acesso ao Firestore sem chave). */
export function progressStore(req?: Request): ProgressStore | null {
  const fs = firestoreStore(req)
  if (fs) return fs
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) return redisStore(url, token)
  if (process.env.PROGRESS_DIR) return fileStore(process.env.PROGRESS_DIR)
  if (process.env.PROGRESS_MEMORY === '1') { // só testes
    const m = (memory ??= new Map())
    return { async get(s) { return m.get(s) ?? null }, async put(s, d) { m.set(s, d) } }
  }
  return null
}

/** Prova de dono de um selo: só o servidor sabe gerar (HMAC com SESSION_SECRET), e ela vale só para aquela conta. */
export const stampProof = (secret: string, sub: string, monument: string) => hmacB64(secret, `stamp|${sub}|${monument}`)
