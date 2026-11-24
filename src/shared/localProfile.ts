// Perfil só neste aparelho: alternativa ao login com Google. Pede apenas um nome (ou apelido)
// e guarda tudo no localStorage. Nada é enviado ao servidor; apagar o navegador apaga o perfil.
const KEY = 'mu_local_user'
export interface LocalProfile { id: string; name: string; createdAt: number }

export function getLocalProfile(): LocalProfile | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null')
    return p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim() ? p : null
  } catch { return null }
}

export function setLocalProfile(name: string): LocalProfile {
  const clean = name.replace(/[<>]/g, '').trim().slice(0, 40) || 'Visitante'
  const prev = getLocalProfile()
  const id = prev?.id || (crypto.randomUUID?.() ?? String(Date.now()))
  const p = { id, name: clean, createdAt: prev?.createdAt ?? Date.now() }
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* modo privado */ }
  return p
}

export function clearLocalProfile() { try { localStorage.removeItem(KEY) } catch { /* nada */ } }
