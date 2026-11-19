// GET /api/auth/callback?code=…&state=…
// Passo 2: confere o state (anti-CSRF), troca o code + code_verifier pelo ID token no servidor,
// valida as claims (iss, aud, exp, nonce) e cria a sessão em cookie httpOnly assinado.
import { authConfig, json, redirect, isSecure, OAUTH_COOKIE, SESSION_COOKIE, SESSION_TTL } from '../_lib/config.js'
import { cookie, decodeIdToken, parseCookies, roleFor, sign, validateClaims, verify } from '../_lib/session.js'

interface Flow { state: string; nonce: string; verifier: string; returnTo: string; exp: number }

export async function GET(req: Request): Promise<Response> {
  const cfg = authConfig()
  if (!cfg) return json({ configured: false, error: 'OAuth não configurado' }, 503)

  const url = new URL(req.url)
  const secure = isSecure(req)
  const clearFlow = cookie(OAUTH_COOKIE, '', 0, secure)
  const fail = (motivo: string) => redirect(`/entrar?erro=${encodeURIComponent(motivo)}`, [clearFlow])

  if (url.searchParams.get('error')) return fail('acesso negado')
  const flow = await verify<Flow>(parseCookies(req.headers.get('cookie'))[OAUTH_COOKIE], cfg.sessionSecret)
  const code = url.searchParams.get('code')
  if (!flow || !code || url.searchParams.get('state') !== flow.state) return fail('sessão de login expirada')

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: `${url.origin}/api/auth/callback`,
      grant_type: 'authorization_code',
      code_verifier: flow.verifier,
    }),
  })
  if (!tokenRes.ok) return fail('falha na troca do código')
  const { id_token } = (await tokenRes.json()) as { id_token?: string }
  if (!id_token) return fail('sem id_token')

  const claims = decodeIdToken(id_token)
  const problem = validateClaims(claims, { clientId: cfg.clientId, nonce: flow.nonce })
  if (problem) return fail(problem)

  // Minimização (LGPD): só o necessário para a Trilha. Nenhum token do Google é guardado.
  const session = await sign(
    {
      sub: claims.sub,
      name: claims.name || 'Visitante',
      email: claims.email || '',
      picture: claims.picture,
      role: roleFor(claims.email, cfg.gestorEmails),
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
    },
    cfg.sessionSecret,
  )
  return redirect(flow.returnTo, [clearFlow, cookie(SESSION_COOKIE, session, SESSION_TTL, secure)])
}
