// POST /api/auth/demo { role: "visitante" | "gestor" } → cookie mu_demo (2 h) e { user }.
// Acesso de demonstração para avaliar a Trilha e o painel sem conta Google. Não tem senha nem dado pessoal:
// o "usuário" é fictício, marcado com demo: true, e nunca vira admin. Desligue com DEMO_LOGIN=off.
import { DEMO_COOKIE, DEMO_TTL, demoEnabled, demoKey, isSecure, json, sameOrigin } from '../_lib/config.js'
import { cookie, sign } from '../_lib/session.js'

export const DEMO_USERS = {
  visitante: { sub: 'demo-visitante', name: 'Visitante Demonstração', email: 'visitante@demo.invalid', role: 'visitante' as const },
  gestor: { sub: 'demo-gestor', name: 'Gestora Demonstração', email: 'gestor@demo.invalid', role: 'gestor' as const },
}

export async function POST(req: Request): Promise<Response> {
  if (!demoEnabled()) return json({ error: 'Acesso de demonstração desligado neste ambiente.' }, 404)
  if (!sameOrigin(req)) return json({ error: 'Origem não permitida.' }, 403)
  let role: unknown
  try { role = ((await req.json()) as { role?: unknown }).role } catch { role = undefined }
  if (role !== 'visitante' && role !== 'gestor') return json({ error: 'Papel inválido.' }, 400)
  const user = { ...DEMO_USERS[role], demo: true }
  const token = await sign({ ...user, exp: Math.floor(Date.now() / 1000) + DEMO_TTL }, demoKey())
  return json({ user }, 200, { 'Set-Cookie': cookie(DEMO_COOKIE, token, DEMO_TTL, isSecure(req)) })
}
