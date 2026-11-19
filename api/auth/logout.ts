// POST /api/auth/logout → apaga o cookie de sessão. POST (e não GET) para não ser disparado por um link.
import { isSecure, SESSION_COOKIE } from '../_lib/config.js'
import { cookie } from '../_lib/session.js'

export async function POST(req: Request): Promise<Response> {
  return new Response(null, { status: 204, headers: { 'Set-Cookie': cookie(SESSION_COOKIE, '', 0, isSecure(req)), 'Cache-Control': 'no-store' } })
}
