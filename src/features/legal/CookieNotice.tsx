import { useEffect, useState } from 'react'

// Aviso de cookies (item 3). O site só usa armazenamento essencial (sessão de login e preferências);
// não há cookies de publicidade nem de análise, então não há o que aceitar ou recusar: é um aviso.
const KEY = 'mu_cookie_notice'

export function CookieNotice() {
  const [show, setShow] = useState(false)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    try { setShow(!localStorage.getItem(KEY)) } catch { setShow(true) }
  }, [])
  if (!show) return null
  const ok = () => {
    try { localStorage.setItem(KEY, '1') } catch { /* navegação privada */ }
    // Princípio 7: sai em arco (some de vez depois da animação; sem animação se "reduzir movimento")
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setShow(false)
    setLeaving(true)
    window.setTimeout(() => setShow(false), 300)
  }
  return (
    <section role="region" aria-label="Aviso de cookies" className={`fixed inset-x-3 bottom-3 z-[150] mx-auto max-w-[620px] rounded-[20px] bg-[#0b2f49] mu-navy-grad text-white p-4 ${leaving ? 'mu-arc-out' : 'mu-sheet-in'} shadow-[0_10px_40px_rgba(0,0,0,0.35)] flex flex-col sm:flex-row sm:items-center gap-3`}>
      <p className="text-[14px] leading-snug flex-1">
        Usamos só cookies essenciais: o de login (se você entrar) e preferências guardadas no seu aparelho. Nada de publicidade ou rastreamento.{' '}
        <a href="/cookies" className="underline underline-offset-2 font-semibold">Saiba mais</a>
      </p>
      <button onClick={ok} className="mu-press h-11 px-6 rounded-[12px] bg-white text-[#0b2f49] text-[14px] font-semibold shrink-0">Entendi</button>
    </section>
  )
}
