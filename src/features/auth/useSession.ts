import { useEffect, useState } from 'react'
import { clearLocalProfile, getLocalProfile } from '../../shared/localProfile'

// Sessão vinda do servidor (cookie httpOnly assinado). O navegador nunca vê o token do Google:
// o front só pergunta "quem sou eu?" em /api/auth/me.
export interface SessionUser {
  sub: string // id pseudônimo do Google (não é e-mail)
  name: string
  email: string
  picture?: string
  role: 'visitante' | 'gestor'
  demo?: boolean
  local?: boolean // perfil só neste aparelho (sem Google, nada no servidor)
}

function localUser(): SessionUser | null {
  const p = getLocalProfile()
  return p ? { sub: 'local-' + p.id, name: p.name, email: `local-${p.id}@aparelho`, role: 'visitante', local: true } : null
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous'; demoAvailable?: boolean }
  | { status: 'authenticated'; user: SessionUser }
  | { status: 'unavailable'; reason: string; demoAvailable?: boolean } // API fora do ar ou OAuth não configurado neste ambiente

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading' })
  useEffect(() => {
    let alive = true
    fetch('/api/auth/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(async (r) => {
        const ct = r.headers.get('content-type') || ''
        if (!ct.includes('application/json')) throw new Error('API de login indisponível neste ambiente')
        const body = (await r.json()) as { user?: SessionUser; configured?: boolean; demoAvailable?: boolean }
        if (!alive) return
        if (r.ok && body.user) setState({ status: 'authenticated', user: body.user })
        else if (localUser()) setState({ status: 'authenticated', user: localUser()! })
        else if (body.configured === false) setState({ status: 'unavailable', reason: 'O login com Google está indisponível no momento. Você pode continuar sem conta, salvando neste aparelho.', demoAvailable: body.demoAvailable })
        else setState({ status: 'anonymous', demoAvailable: body.demoAvailable })
      })
      .catch((e: Error) => { if (!alive) return; const lu = localUser(); setState(lu ? { status: 'authenticated', user: lu } : { status: 'unavailable', reason: e.message }) })
    return () => {
      alive = false
    }
  }, [])
  return state
}

export const loginUrl = (returnTo: string) => `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`

export async function logout(): Promise<void> {
  clearLocalProfile() // sair do perfil local; o progresso continua no aparelho
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined)
  window.location.assign('/')
}

