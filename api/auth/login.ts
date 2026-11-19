// GET /api/auth/login?returnTo=/app
// Passo 1 do OAuth 2.0 Authorization Code + PKCE: gera state, nonce e code_verifier,
// guarda os três num cookie assinado de 10 min e manda o navegador para o Google.
import { authConfig, json, redirect, isSecure, OAUTH_COOKIE, OAUTH_TTL } from '../_lib/config.js'
import { cookie, pkceChallenge, randomToken, safeReturnTo, sign } from '../_lib/session.js'

export async function GET(req: Request): Promise<Response> {
  const cfg = authConfig()
  if (!cfg) return json({ configured: false, error: 'OAuth não configurado' }, 503)

  const url = new URL(req.url)
  const returnTo = safeReturnTo(url.searchParams.get('returnTo'))
  const state = randomToken()
  const nonce = randomToken()
  const verifier = randomToken(48)

  const flow = await sign({ state, nonce, verifier, returnTo, exp: Math.floor(Date.now() / 1000) + OAUTH_TTL }, cfg.sessionSecret)

  const google = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  google.search = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: `${url.origin}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString()

  return redirect(google.toString(), [cookie(OAUTH_COOKIE, flow, OAUTH_TTL, isSecure(req))])
}
