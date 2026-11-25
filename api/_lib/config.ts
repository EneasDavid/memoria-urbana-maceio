// Variáveis de ambiente sem depender dos tipos do Node (o compilador da Vercel não acha @types/node com TypeScript 7)
const processEnv: Record<string, string | undefined> = (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}
// Configuração lida das variáveis de ambiente da Vercel (Settings → Environment Variables).
// Sem elas, as rotas /api/auth/* respondem que o login não está configurado e o site segue público.
// Login: Firebase Authentication (Google). O navegador entra pelo Firebase e o servidor troca o ID token
// por um cookie de sessão próprio (HttpOnly, assinado com SESSION_SECRET). Passo a passo em docs/firebase.md.
export interface AuthConfig {
  projectId: string // projeto do Firebase (público)
  webApiKey: string // chave web do Firebase (identificador público, restrita aos domínios do site)
  authDomain: string
  sessionSecret: string
  gestorEmails: string
}

export const DEFAULT_FIREBASE_PROJECT = 'memoria-urbana-maceio'

export function authConfig(env: Record<string, string | undefined> = processEnv): AuthConfig | null {
  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT
  const webApiKey = env.FIREBASE_WEB_API_KEY || ''
  const sessionSecret = env.SESSION_SECRET || ''
  if (!webApiKey || sessionSecret.length < 32) return null
  return { projectId, webApiKey, authDomain: env.FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`, sessionSecret, gestorEmails: env.GESTOR_EMAILS || '' }
}

export const SESSION_COOKIE = 'mu_session'
export const SESSION_TTL = 60 * 60 * 24 * 7 // 7 dias

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

/** CSRF: toda rota que muda estado (POST/PUT) só aceita chamada da própria origem. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host
  if (!origin) return false
  try { return new URL(origin).host === host } catch { return false }
}
