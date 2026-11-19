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

export const DEMO_COOKIE = 'mu_demo'
export const DEMO_TTL = 60 * 60 * 2 // 2 horas
/** Acesso de demonstração (sem Google). Desligue com DEMO_LOGIN=off. O cookie de demonstração não dá acesso
 *  a nenhum dado real: a API do backend não o reconhece e o painel mostra dados simulados. */
export const demoEnabled = () => (process.env.DEMO_LOGIN || 'on') !== 'off'
/** Chave do cookie de demonstração: o SESSION_SECRET, se existir. Sem ele, uma chave fixa: forjar esse cookie
 *  só daria uma conta de demonstração, que qualquer pessoa já pode pedir. */
export const demoKey = () => (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32 ? process.env.SESSION_SECRET : 'memoria-urbana-demo-sem-privilegio-real-000000')

/** CSRF: toda rota que muda estado (POST) só aceita chamada da própria origem. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host
  if (!origin) return false
  try { return new URL(origin).host === host } catch { return false }
}
