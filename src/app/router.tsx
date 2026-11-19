// Roteador mínimo, sem dependências.
// Cada página é uma URL de verdade (abre em nova aba, funciona com QR/NFC e com o botão
// voltar do próprio navegador), então o app não precisa desenhar menus de "voltar".

export const LEGAL_PAGES = ['privacidade', 'termos', 'cookies', 'acessibilidade', 'creditos', 'sobre'] as const
export type LegalPage = (typeof LEGAL_PAGES)[number]

export type Route =
  | { name: 'index' }
  | { name: 'monument'; id: string }
  | { name: 'login'; returnTo: string }
  | { name: 'app' }
  | { name: 'panel' }
  | { name: 'prototype' }
  | { name: 'legal'; page: LegalPage }
  | { name: 'notFound' }

/** Só aceita caminhos internos: bloqueia open redirect ("//site", "https://site", "/\\site"). */
export function safeReturnTo(value: string | null | undefined, fallback = '/app'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}

export function matchRoute(pathname: string, search = ''): Route {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { name: 'index' }
  // Postel: aceita caixa alta, acentos, número da placa e /placa/:n (a página resolve e corrige a URL)
  const m = path.match(/^\/(?:monumento|placa|p)\/([^/]+)$/i)
  if (m) return { name: 'monument', id: m[1] }
  const lower = path.toLowerCase()
  if (lower !== path && !lower.startsWith('/monumento/')) return matchRoute(lower, search)
  if (path === '/entrar') return { name: 'login', returnTo: safeReturnTo(new URLSearchParams(search).get('returnTo')) }
  if (path === '/app') return { name: 'app' }
  if (path === '/painel') return { name: 'panel' }
  if (path === '/prototipo') return { name: 'prototype' }
  const legal = path.slice(1) as LegalPage
  if ((LEGAL_PAGES as readonly string[]).includes(legal)) return { name: 'legal', page: legal }
  return { name: 'notFound' }
}

export const monumentUrl = (id: string) => `/monumento/${id}`
