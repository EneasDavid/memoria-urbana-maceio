import { lazy, Suspense, useEffect } from 'react'
import { matchRoute } from './router'
import { MonumentIndex } from '../features/monument/MonumentIndex'
import { MonumentPage } from '../features/monument/MonumentPage'
import { NotFound } from '../features/monument/NotFound'
import { LoginPage } from '../features/auth/LoginPage'
import { AuthGate } from '../features/auth/AuthGate'
import { useSystemTheme } from './theme'
import { SkipLink } from '../features/legal/SkipLink'
import { CookieNotice } from '../features/legal/CookieNotice'
import { PrivacyPage, TermsPage, CookiesPage, AccessibilityPage, CreditsPage, AboutPage } from '../features/legal/LegalPages'

// Área logada e protótipo ficam em chunks separados: quem lê a placa baixa só a página pública.
const AppHome = lazy(() => import('../features/trail/AppHome').then((m) => ({ default: m.AppHome })))
const PanelPage = lazy(() => import('../features/panel/PanelPage').then((m) => ({ default: m.PanelPage })))
const Prototype = lazy(() => import('../App'))

const Loading = () => <div className="fixed inset-0 grid place-items-center bg-[#f6f3ec] text-black/45 text-[15px]">Carregando…</div>

const LEGAL = { privacidade: PrivacyPage, termos: TermsPage, cookies: CookiesPage, acessibilidade: AccessibilityPage, creditos: CreditsPage, sobre: AboutPage }

// Moldura das páginas públicas: link para pular ao conteúdo e aviso de cookies.
export function Routes() {
  const route = matchRoute(window.location.pathname, window.location.search)
  useSystemTheme(route.name !== 'prototype')
  if (route.name === 'prototype') {
    return (
      <>
        <p role="note" className="fixed left-2 bottom-2 z-[999] rounded-full bg-black/75 px-3 py-1 text-[11px] font-semibold text-white pointer-events-none">Protótipo de demonstração · dados e envios simulados</p>
        <Suspense fallback={<Loading />}><Prototype /></Suspense>
      </>
    )
  }
  return (
    <>
      <SkipLink />
      <Page route={route} />
      <CookieNotice />
    </>
  )
}

function Page({ route }: { route: Exclude<ReturnType<typeof matchRoute>, { name: 'prototype' }> }) {
  useEffect(() => {
    document.documentElement.lang = 'pt-BR'
  }, [])

  switch (route.name) {
    case 'index':
      return <MonumentIndex />
    case 'monument':
      return <MonumentPage id={route.id} />
    case 'login':
      return <LoginPage returnTo={route.returnTo} />
    case 'app':
      return (
        <AuthGate returnTo="/app">
          {(user) => <Suspense fallback={<Loading />}><AppHome user={user} /></Suspense>}
        </AuthGate>
      )
    case 'panel':
      return (
        <AuthGate returnTo="/painel" role="gestor">
          {(user) => <Suspense fallback={<Loading />}><PanelPage user={user} /></Suspense>}
        </AuthGate>
      )
    case 'legal': {
      const L = LEGAL[route.page]
      return <L />
    }
    default:
      return <NotFound />
  }
}
