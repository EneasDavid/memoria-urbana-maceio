// GET /api/progress → { configured, doc } do usuário logado com Google.
// PUT /api/progress { doc } → junta com o que já está no servidor (nada se perde), confere de quem é cada selo
// e devolve a cópia final. Perfil só no aparelho não chega aqui (não tem sessão no servidor).
//
// Verificação de dono: todo selo guardado no servidor recebe `proof` = HMAC(SESSION_SECRET, conta + monumento).
// Se chegar um selo com prova de OUTRA conta (copiado de outro perfil do mesmo aparelho, por exemplo), ele é recusado.
import { authConfig, json, sameOrigin, SESSION_COOKIE, type AuthConfig } from './_lib/config.js'
import { parseCookies, verify } from './_lib/session.js'
import { emptyDoc, mergeDocs, sanitizeDoc, type ProgressDoc } from './_lib/progressDoc.js'
import { progressStore, stampProof } from './_lib/progressStore.js'

interface Session { sub: string; exp: number }
const MAX_BODY = 64 * 1024

async function sessionSub(req: Request, cfg: AuthConfig): Promise<string | null> {
  const s = await verify<Session>(parseCookies(req.headers.get('cookie'))[SESSION_COOKIE], cfg.sessionSecret)
  return s?.sub || null
}

/** Remove selos com prova de outra conta e devolve quantos foram recusados. */
export async function dropForeignStamps(doc: ProgressDoc, secret: string, sub: string): Promise<{ doc: ProgressDoc; rejected: string[] }> {
  const rejected: string[] = []
  for (const [id, e] of Object.entries(doc.stampLog2)) {
    if (e.proof && e.proof !== (await stampProof(secret, sub, id))) rejected.push(id)
  }
  if (!rejected.length) return { doc, rejected }
  const log = { ...doc.stampLog2 }
  for (const id of rejected) delete log[id]
  return { doc: { ...doc, stampLog2: log, collected: doc.collected.filter((id) => !rejected.includes(id)) }, rejected }
}

/** Dá prova de dono a todo selo da conta que ainda não tem (e cria a entrada do passaporte se faltar). */
export async function proveStamps(doc: ProgressDoc, secret: string, sub: string): Promise<ProgressDoc> {
  const log = { ...doc.stampLog2 }
  for (const id of doc.collected) {
    const e = log[id] ?? { at: Date.now(), method: 'placa' as const, count: 1 }
    log[id] = { ...e, proof: await stampProof(secret, sub, id) }
  }
  return { ...doc, stampLog2: log }
}

async function guard(req: Request) {
  const cfg = authConfig()
  const store = progressStore()
  if (!cfg) return { error: json({ configured: false, error: 'Login não configurado' }, 503) }
  if (!store) return { error: json({ configured: false, error: 'Armazenamento online não configurado' }, 503) }
  const sub = await sessionSub(req, cfg)
  if (!sub) return { error: json({ configured: true, error: 'Entre com Google para salvar online.' }, 401) }
  return { cfg, store, sub }
}

export async function GET(req: Request): Promise<Response> {
  const g = await guard(req)
  if ('error' in g) return g.error!
  return json({ configured: true, doc: (await g.store.get(g.sub)) ?? emptyDoc() })
}

export async function PUT(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return json({ error: 'Origem não permitida.' }, 403)
  const g = await guard(req)
  if ('error' in g) return g.error!
  const text = await req.text()
  if (text.length > MAX_BODY) return json({ error: 'Progresso grande demais.' }, 413)
  let body: { doc?: unknown }
  try { body = JSON.parse(text) } catch { return json({ error: 'JSON inválido.' }, 400) }
  const { doc: incoming, rejected } = await dropForeignStamps(sanitizeDoc(body.doc), g.cfg.sessionSecret, g.sub)
  const stored = (await g.store.get(g.sub)) ?? emptyDoc()
  const merged = await proveStamps(mergeDocs(stored, incoming), g.cfg.sessionSecret, g.sub)
  await g.store.put(g.sub, merged)
  return json({ configured: true, doc: merged, rejected })
}
