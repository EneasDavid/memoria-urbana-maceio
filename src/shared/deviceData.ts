// Dados de cada conta no aparelho, com dono conferido.
// - Todo dado da Trilha fica em chaves com o id da conta (mu_app:<conta>:…).
// - mu_owner guarda de quem é o que está no aparelho; se outra conta entrar, o cache anterior é apagado antes de abrir o app.
// - A sessão da aba (sessionStorage mu_session) guarda só o id da conta ativa; o login Google em si fica no cookie HttpOnly do servidor.
// - Sair apaga tudo o que é da pessoa (selos, pontos, trilhas, perfil local, relatos pendentes); ficam só preferências do aparelho.
const PERSONAL = /^(mu_app:|mu_progress$|mu_local_user$|mu_reports_pending$|mu_owner$)/

export function wipeUserData() {
  try {
    for (const k of Object.keys(localStorage)) if (PERSONAL.test(k)) localStorage.removeItem(k)
    sessionStorage.removeItem('mu_session')
  } catch { /* modo privado */ }
}

/** Confere o dono dos dados antes de abrir o app. Conta diferente da anterior → apaga o cache anterior. */
export function ensureOwner(account: string): 'same' | 'new' | 'switched' {
  try {
    const last = localStorage.getItem('mu_owner')
    let r: 'same' | 'new' | 'switched' = 'same'
    if (!last) r = 'new'
    else if (last !== account) {
      // guarda o perfil local recém-criado (é a conta que está entrando) e apaga o resto
      const local = localStorage.getItem('mu_local_user')
      wipeUserData()
      if (local && account.startsWith('local-')) localStorage.setItem('mu_local_user', local)
      r = 'switched'
    }
    localStorage.setItem('mu_owner', account)
    sessionStorage.setItem('mu_session', account)
    return r
  } catch { return 'same' }
}
