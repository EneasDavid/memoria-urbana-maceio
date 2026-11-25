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

export async function signInWithGoogle(): Promise<LoginResult> {
  const cfgRes = await fetch('/api/auth/firebase-config', { headers: { Accept: 'application/json' } }).catch(() => null)
  const cfg = cfgRes?.ok ? ((await cfgRes.json()) as { apiKey: string; authDomain: string; projectId: string }) : null
  if (!cfg?.apiKey) return { ok: false, message: 'O login com Google está indisponível no momento.' }

  const [{ initializeApp, getApps }, authSdk] = await Promise.all([import('firebase/app'), import('firebase/auth')])
  const { initializeAuth, getAuth, inMemoryPersistence, browserPopupRedirectResolver, GoogleAuthProvider, signInWithPopup, signOut } = authSdk
  const existing = getApps().find((a) => a.name === 'mu')
  const app = existing ?? initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId }, 'mu')
  // initializeAuth só pode rodar uma vez por app (segundo clique reaproveita)
  const auth = existing ? getAuth(app) : initializeAuth(app, { persistence: inMemoryPersistence, popupRedirectResolver: browserPopupRedirectResolver })
  const provider = new GoogleAuthProvider() // escopos padrão: openid, email e profile
  provider.setCustomParameters({ prompt: 'select_account' })

  try {
    const cred = await signInWithPopup(auth, provider)
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
    await signOut(auth).catch(() => undefined) // a sessão é só o cookie do servidor
  }
}
