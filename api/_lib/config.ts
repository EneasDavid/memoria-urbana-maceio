// Configuração lida das variáveis de ambiente da Vercel (Settings → Environment Variables).
// Sem elas, as rotas /api/auth/* respondem que o login não está configurado e o site segue público.
export interface AuthConfig {
  clientId: string
  clientSecret: string
  sessionSecret: string
  gestorEmails: string
}

export function authConfig(): AuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
  const sessionSecret = process.env.SESSION_SECRET || ''
  if (!clientId || !clientSecret || sessionSecret.length < 32) return null
  return { clientId, clientSecret, sessionSecret, gestorEmails: process.env.GESTOR_EMAILS || '' }
}

export const SESSION_COOKIE = 'mu_session'
export const OAUTH_COOKIE = 'mu_oauth'
export const SESSION_TTL = 60 * 60 * 24 * 7 // 7 dias
export const OAUTH_TTL = 60 * 10 // 10 minutos para concluir o login

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } })
}

export function redirect(location: string, cookies: string[] = []): Response {
  const h = new Headers({ Location: location, 'Cache-Control': 'no-store' })
  for (const c of cookies) h.append('Set-Cookie', c)
  return new Response(null, { status: 302, headers: h })
}

export const isSecure = (req: Request) => new URL(req.url).protocol === 'https:'

/** Cookie do antigo acesso de demonstração (removido): o logout ainda o apaga de aparelhos antigos. */
export const DEMO_COOKIE = 'mu_demo'

/** CSRF: toda rota que muda estado (POST) só aceita chamada da própria origem. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host
  if (!origin) return false
  try { return new URL(origin).host === host } catch { return false }
}
