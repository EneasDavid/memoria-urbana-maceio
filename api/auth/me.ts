// GET /api/auth/me → { user } (200) | { user: null } (401) | { configured: false } (200)
import { authConfig, json, SESSION_COOKIE } from '../_lib/config.js'
import { parseCookies, verify } from '../_lib/session.js'

interface Session { sub: string; name: string; email: string; picture?: string; role: 'visitante' | 'gestor'; exp: number }

export async function GET(req: Request): Promise<Response> {
  const cfg = authConfig()
  const cookies = parseCookies(req.headers.get('cookie'))
  const real = cfg ? await verify<Session>(cookies[SESSION_COOKIE], cfg.sessionSecret) : null
  if (real) {
    const { exp: _exp, ...user } = real
    void _exp
    return json({ configured: true, user })
  }
  if (!cfg) return json({ configured: false, user: null })
  return json({ configured: true, user: null }, 401)
}
