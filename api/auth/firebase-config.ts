// GET /api/auth/firebase-config → configuração pública do Firebase para o botão "Continuar com Google".
// A chave web do Firebase é um identificador público (vai para o navegador de qualquer forma), mas não entra
// no bundle: o navegador só a busca na hora de entrar. No Google Cloud ela é restrita aos domínios do site
// e às APIs de login (Identity Toolkit e Token Service). Quem protege os dados são as regras do Firestore
// (tudo negado ao navegador) e a sessão do servidor.
import { authConfig, json } from '../_lib/config.js'

export async function GET(): Promise<Response> {
  const cfg = authConfig()
  if (!cfg) return json({ configured: false }, 503)
  return json({ configured: true, apiKey: cfg.webApiKey, authDomain: cfg.authDomain, projectId: cfg.projectId }, 200, { 'Cache-Control': 'public, max-age=300' })
}
