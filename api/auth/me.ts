// GET /api/auth/me → { user } (200) | { user: null } (401) | { configured: false } (200)
import { authConfig, json, SESSION_COOKIE } from '../_lib/config.js'
import { parseCookies, verify } from '../_lib/session.js'

interface Session { sub: string; name: string; email: string; picture?: string; role: 'visitante' | 'gestor'; exp: number }

export async function GET(req: Request): Promise<Response> {
  const cfg = authConfig()
  if (!cfg) return json({ configured: false, user: null })
  const s = await verify<Session>(parseCookies(req.headers.get('cookie'))[SESSION_COOKIE], cfg.sessionSecret)
  if (!s) return json({ configured: true, user: null }, 401)
  const { exp: _exp, ...user } = s
  void _exp
  return json({ configured: true, user })
}
