// "Continuar com Google" pelo Firebase Authentication.
// O SDK do Firebase só é baixado no clique (import dinâmico): as páginas dos monumentos continuam leves.
// O navegador recebe o ID token, entrega uma vez ao servidor (/api/auth/session), que cria o cookie de sessão
// HttpOnly, e encerra o login do Firebase na hora. Nenhum token fica salvo no navegador (persistência em memória).

export type LoginResult = { ok: true } | { ok: false; message: string }

const MESSAGES: Record<string, string> = {
  'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de concluir.',
  'auth/cancelled-popup-request': 'A janela do Google foi fechada antes de concluir.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com o Google. Confira a internet e tente de novo.',
  'auth/unauthorized-domain': 'Este endereço ainda não está autorizado para login.',
}

type Ready = {
  auth: import('firebase/auth').Auth
  provider: import('firebase/auth').GoogleAuthProvider
  sdk: typeof import('firebase/auth')
}
let ready: Ready | null = null
let preparing: Promise<Ready | null> | null = null

/** Prepara o login ao abrir a página /entrar: busca a configuração e baixa o SDK ANTES do clique.
 *  O navegador só deixa abrir a janela do Google se ela for aberta direto no clique; qualquer espera antes
 *  (fetch, import) faz o pop-up ser bloqueado. */
export function prepareGoogle(): Promise<Ready | null> {
  if (ready) return Promise.resolve(ready)
  preparing ??= (async () => {
    const cfgRes = await fetch('/api/auth/firebase-config', { headers: { Accept: 'application/json' } }).catch(() => null)
    const cfg = cfgRes?.ok ? ((await cfgRes.json()) as { apiKey: string; authDomain: string; projectId: string }) : null
    if (!cfg?.apiKey) return null
    const [{ initializeApp, getApps }, sdk] = await Promise.all([import('firebase/app'), import('firebase/auth')])
    const existing = getApps().find((a) => a.name === 'mu')
    const app = existing ?? initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId }, 'mu')
    // initializeAuth só pode rodar uma vez por app
    const auth = existing ? sdk.getAuth(app) : sdk.initializeAuth(app, { persistence: sdk.inMemoryPersistence, popupRedirectResolver: sdk.browserPopupRedirectResolver })
    const provider = new sdk.GoogleAuthProvider() // escopos padrão: openid, email e profile
    provider.setCustomParameters({ prompt: 'select_account' })
    ready = { auth, provider, sdk }
    return ready
  })().catch(() => { preparing = null; return null })
  return preparing
}

/** Já preparado? O botão usa isso para abrir a janela do Google sem nenhuma espera. */
export const isGoogleReady = () => !!ready

export async function signInWithGoogle(): Promise<LoginResult> {
  // Caminho normal: tudo já preparado → a janela abre na mesma "tarefa" do clique (sem await antes).
  const r0 = ready ?? (await prepareGoogle())
  if (!r0) return { ok: false, message: 'O login com Google está indisponível no momento.' }
  const { auth, provider, sdk } = r0
  try {
    const cred = await sdk.signInWithPopup(auth, provider)
    const idToken = await cred.user.getIdToken()
    const r = await fetch('/api/auth/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    if (!r.ok) {
      const body = (await r.json().catch(() => ({}))) as { error?: string }
      return { ok: false, message: body.error || 'Não foi possível entrar.' }
    }
    return { ok: true }
  } catch (e) {
    const code = (e as { code?: string }).code || ''
    return { ok: false, message: MESSAGES[code] || 'Não foi possível entrar com Google. Tente de novo.' }
  } finally {
    await sdk.signOut(auth).catch(() => undefined) // a sessão é só o cookie do servidor
  }
}
