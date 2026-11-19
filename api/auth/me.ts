// GET /api/auth/me → { user } (200) | { user: null } (401) | { configured: false } (200)
// Também reconhece o acesso de demonstração (cookie mu_demo), sempre com demo: true.
import { authConfig, DEMO_COOKIE, demoEnabled, demoKey, json, SESSION_COOKIE } from '../_lib/config.js'
import { parseCookies, verify } from '../_lib/session.js'

interface Session { sub: string; name: string; email: string; picture?: string; role: 'visitante' | 'gestor'; demo?: boolean; exp: number }

export async function GET(req: Request): Promise<Response> {
  const cfg = authConfig()
  const cookies = parseCookies(req.headers.get('cookie'))
  const real = cfg ? await verify<Session>(cookies[SESSION_COOKIE], cfg.sessionSecret) : null
  if (real) {
    const { exp: _exp, demo: _d, ...user } = real
    void _exp; void _d
    return json({ configured: true, demoAvailable: demoEnabled(), user })
  }
  const demo = demoEnabled() ? await verify<Session>(cookies[DEMO_COOKIE], demoKey()) : null
  if (demo && demo.demo === true && (demo.role === 'visitante' || demo.role === 'gestor')) {
    const { exp: _exp, ...user } = demo
    void _exp
    return json({ configured: !!cfg, demoAvailable: true, user })
  }
  if (!cfg) return json({ configured: false, demoAvailable: demoEnabled(), user: null })
  return json({ configured: true, demoAvailable: demoEnabled(), user: null }, 401)
}
