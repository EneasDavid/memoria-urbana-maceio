import { useEffect } from 'react'

// Segue o modo claro/escuro do aparelho (prefers-color-scheme) e acompanha a troca ao vivo.
// O tema escuro é a classe .mu-dark no <html> (regras em index.css, as mesmas do protótipo).
export function useSystemTheme(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const root = document.documentElement
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    const apply = () => {
      root.classList.toggle('mu-dark', mq.matches)
      root.style.colorScheme = mq.matches ? 'dark' : 'light'
      meta!.content = mq.matches ? '#0e1418' : '#f6f3ec'
    }
    apply()
    mq.addEventListener('change', apply)
    return () => {
      mq.removeEventListener('change', apply)
      root.classList.remove('mu-dark')
      root.style.colorScheme = ''
    }
  }, [enabled])
}
