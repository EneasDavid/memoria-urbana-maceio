// Perfil só neste aparelho: alternativa ao login com Google. Pede apenas um nome (ou apelido)
// e guarda tudo no localStorage. Nada é enviado ao servidor; apagar o navegador apaga o perfil.
// Sair não apaga: o perfil fica na lista "perfis deste aparelho" (mu_local_profiles) e volta com selos e pontos.
const KEY = 'mu_local_user'
const LIST = 'mu_local_profiles'
export interface LocalProfile { id: string; name: string; createdAt: number }

const valid = (p: unknown): p is LocalProfile => !!p && typeof (p as LocalProfile).id === 'string' && typeof (p as LocalProfile).name === 'string' && !!(p as LocalProfile).name.trim()

export function getLocalProfile(): LocalProfile | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null')
    return valid(p) ? p : null
  } catch { return null }
}

export function listLocalProfiles(): LocalProfile[] {
  try {
    const l = JSON.parse(localStorage.getItem(LIST) || '[]')
    return Array.isArray(l) ? l.filter(valid).slice(0, 10) : []
  } catch { return [] }
}

function remember(p: LocalProfile) {
  try { localStorage.setItem(LIST, JSON.stringify([p, ...listLocalProfiles().filter((x) => x.id !== p.id)].slice(0, 10))) } catch { /* modo privado */ }
}

export function setLocalProfile(name: string): LocalProfile {
  const clean = name.replace(/[<>]/g, '').trim().slice(0, 40) || 'Visitante'
  const prev = getLocalProfile()
  // Nome igual NÃO reaproveita perfil (outra pessoa pode ter o mesmo nome): volta-se pelo botão do perfil salvo
  const id = prev?.id || (crypto.randomUUID?.() ?? String(Date.now()))
  const p = { id, name: clean, createdAt: prev?.createdAt ?? Date.now() }
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* modo privado */ }
  remember(p)
  return p
}

/** Volta a usar um perfil salvo neste aparelho. */
export function resumeLocalProfile(id: string): LocalProfile | null {
  const p = listLocalProfiles().find((x) => x.id === id)
  if (!p) return null
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* modo privado */ }
  return p
}

/** Sair do perfil local: encerra a sessão, mas o perfil e os dados continuam no aparelho. */
export function clearLocalProfile() {
  const p = getLocalProfile()
  if (p) remember(p)
  try { localStorage.removeItem(KEY) } catch { /* nada */ }
}

/** Apagar o perfil local de vez (pedido explícito). */
export function forgetLocalProfile(id: string) {
  try {
    localStorage.setItem(LIST, JSON.stringify(listLocalProfiles().filter((x) => x.id !== id)))
    if (getLocalProfile()?.id === id) localStorage.removeItem(KEY)
  } catch { /* nada */ }
}
