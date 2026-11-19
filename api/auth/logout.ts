// POST /api/auth/logout → apaga os cookies de sessão (real e de demonstração).
// POST (e não GET) para não ser disparado por um link, e só da própria origem (CSRF).
import { DEMO_COOKIE, isSecure, json, sameOrigin, SESSION_COOKIE } from '../_lib/config.js'
import { cookie } from '../_lib/session.js'

export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return json({ error: 'Origem não permitida.' }, 403)
  const h = new Headers({ 'Cache-Control': 'no-store' })
  h.append('Set-Cookie', cookie(SESSION_COOKIE, '', 0, isSecure(req)))
  h.append('Set-Cookie', cookie(DEMO_COOKIE, '', 0, isSecure(req)))
  return new Response(null, { status: 204, headers: h })
}
