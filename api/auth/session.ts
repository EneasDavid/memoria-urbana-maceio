// POST /api/auth/session { idToken } → cria a sessão (cookie HttpOnly assinado) a partir do login do Firebase.
// O navegador entra com Google pelo Firebase Authentication (popup), manda o ID token aqui uma vez e descarta.
// O servidor confere assinatura e claims (api/_lib/firebaseToken.ts), exige login recente (5 min) e só então
// grava o cookie. Nenhum token do Google ou do Firebase fica guardado no navegador nem no servidor.
import { authConfig, isSecure, json, sameOrigin, SESSION_COOKIE, SESSION_TTL } from '../_lib/config.js'
import { cookie, roleFor, sign } from '../_lib/session.js'
import { accountId, verifyFirebaseIdToken } from '../_lib/firebaseToken.js'

const MAX_BODY = 8 * 1024

export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return json({ error: 'Origem não permitida.' }, 403)
  const cfg = authConfig()
  if (!cfg) return json({ configured: false, error: 'Login não configurado' }, 503)

  const text = await req.text()
  if (text.length > MAX_BODY) return json({ error: 'Pedido grande demais.' }, 413)
  let idToken: unknown
  try { idToken = (JSON.parse(text) as { idToken?: unknown }).idToken } catch { return json({ error: 'JSON inválido.' }, 400) }
  if (typeof idToken !== 'string') return json({ error: 'Falta o idToken.' }, 400)

  const r = await verifyFirebaseIdToken(idToken, cfg.projectId)
  if ('error' in r) return json({ error: `Login recusado: ${r.error}.` }, 401)
  const c = r.claims

  // Minimização (LGPD): só o necessário para a Trilha. O papel vem só do servidor (lista GESTOR_EMAILS).
  const user = { sub: accountId(c), name: c.name || 'Visitante', email: c.email || '', picture: c.picture, role: roleFor(c.email, cfg.gestorEmails) }
  const session = await sign({ ...user, exp: Math.floor(Date.now() / 1000) + SESSION_TTL }, cfg.sessionSecret)
  return json({ configured: true, user }, 200, { 'Set-Cookie': cookie(SESSION_COOKIE, session, SESSION_TTL, isSecure(req)) })
}
