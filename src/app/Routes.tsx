import { lazy, Suspense, useEffect } from 'react'
import { matchRoute } from './router'
import { MonumentIndex } from '../features/monument/MonumentIndex'
import { MonumentPage } from '../features/monument/MonumentPage'
import { NotFound } from '../features/monument/NotFound'
import { LoginPage } from '../features/auth/LoginPage'
import { AuthGate } from '../features/auth/AuthGate'

// Área logada e protótipo ficam em chunks separados: quem lê a placa baixa só a página pública.
const AppHome = lazy(() => import('../features/trail/AppHome').then((m) => ({ default: m.AppHome })))
const PanelPage = lazy(() => import('../features/panel/PanelPage').then((m) => ({ default: m.PanelPage })))
const Prototype = lazy(() => import('../App'))

const Loading = () => <div className="fixed inset-0 grid place-items-center bg-[#f6f3ec] text-black/45 text-[15px]">Carregando…</div>

export function Routes() {
  const route = matchRoute(window.location.pathname, window.location.search)

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
    case 'prototype':
      return <Suspense fallback={<Loading />}><Prototype /></Suspense>
    default:
      return <NotFound />
  }
}
