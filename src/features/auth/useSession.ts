import { useEffect, useState } from 'react'

// Sessão vinda do servidor (cookie httpOnly assinado). O navegador nunca vê o token do Google:
// o front só pergunta "quem sou eu?" em /api/auth/me.
export interface SessionUser {
  sub: string // id pseudônimo do Google (não é e-mail)
  name: string
  email: string
  picture?: string
  role: 'visitante' | 'gestor'
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: SessionUser }
  | { status: 'unavailable'; reason: string } // API fora do ar ou OAuth não configurado neste ambiente

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading' })
  useEffect(() => {
    let alive = true
    fetch('/api/auth/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(async (r) => {
        const ct = r.headers.get('content-type') || ''
        if (!ct.includes('application/json')) throw new Error('API de login indisponível neste ambiente')
        const body = (await r.json()) as { user?: SessionUser; configured?: boolean }
        if (!alive) return
        if (r.ok && body.user) setState({ status: 'authenticated', user: body.user })
        else if (body.configured === false) setState({ status: 'unavailable', reason: 'Login com Google ainda não configurado neste ambiente.' })
        else setState({ status: 'anonymous' })
      })
      .catch((e: Error) => alive && setState({ status: 'unavailable', reason: e.message }))
    return () => {
      alive = false
    }
  }, [])
  return state
}

export const loginUrl = (returnTo: string) => `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined)
  window.location.assign('/')
}
