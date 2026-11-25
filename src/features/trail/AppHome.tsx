import { useCallback, useEffect, useMemo, useState } from 'react'
import { MobileApp, type Standalone } from '../../MobileApp'
import type { User } from '../../data'
import { queueReport } from '../monument/reports'
import { logout, type SessionUser } from '../auth/useSession'
import { loadProgress } from '../../shared/progress'
import { ensureOwner } from '../../shared/deviceData'
import { byId } from '../../data'

// Área com conta: o mesmo app do protótipo do Figma (Explorar, Trilha, Passaporte e leitura da placa),
// em tela cheia e sem as simulações da apresentação. Na conta de demonstração as simulações continuam
// ligadas (caminhada, leitura de placa, amigos por perto) para dar para testar tudo sem ir à rua.
// Próximas sprints: carimbos salvos no servidor e mescla do que foi feito no aparelho (KAN-75).

const hoje = () => {
  const s = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function AppHome({ user }: { user: SessionUser }) {
  // Antes de ler qualquer dado: confere se o cache do aparelho é desta conta (senão apaga o da conta anterior)
  useState(() => ensureOwner(user.sub))
  const appUser = useMemo<User>(() => ({ name: user.name, email: user.email, color: '#c4683a', picture: user.picture }), [user.name, user.email, user.picture])
  const [dark, setDarkState] = useState(() => typeof window !== 'undefined' && (document.documentElement.classList.contains('mu-dark') || !!window.matchMedia?.('(prefers-color-scheme: dark)').matches))
  const setDark = useCallback((v: boolean) => {
    document.documentElement.classList.toggle('mu-dark', v)
    document.documentElement.style.colorScheme = v ? 'dark' : 'light'
    setDarkState(v)
  }, [])

  // Computador (1024 px ou mais): layout largo como o site do protótipo; abaixo disso, o app do celular
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 1024px)').matches)
  useEffect(() => {
    const mq = window.matchMedia?.('(min-width: 1024px)')
    if (!mq) return
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    const prev = document.title
    document.title = 'Trilha Cultural · Memória Urbana Maceió'
    // o app ocupa a tela inteira: quem rola é cada aba, não a página
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => { document.title = prev; document.body.style.overflow = overflow }
  }, [])

  // Veio da placa (QR/NFC) já com conta: abre na obra e credita o carimbo, junto com os lidos antes sem conta
  const [entry] = useState(() => {
    const q = new URLSearchParams(window.location.search)
    const w = q.get('welcome'), v = q.get('via')
    if (q.has('welcome')) window.history.replaceState(null, '', '/app')
    return { welcome: w && byId(w) ? w : undefined, via: v === 'qr' || v === 'nfc' ? (v as 'qr' | 'nfc') : undefined }
  })
  const preStamps = useMemo(() => (loadProgress().stamps || []).map(({ id, via }) => ({ id, via })), [])
  const standalone = useMemo<Standalone>(() => ({
    preStamps,
    simulate: !!user.demo,
    onLogout: () => { void logout() },
    today: hoje(),
    links: { privacy: '/privacidade', panel: user.role === 'gestor' ? '/painel' : undefined },
    desktop,
  }), [user.demo, user.role, desktop, preStamps])

  return (
    <main id="conteudo" className="fixed inset-0 bg-[#f6f3ec] mu-app-shell">
      <div className={desktop ? 'relative h-full w-full' : 'relative mx-auto h-full w-full max-w-[480px] sm:border-x sm:border-black/[0.06]'}>
        <MobileApp
          standalone={standalone}
          user={appUser}
          setUser={() => undefined}
          dark={dark}
          setDark={setDark}
          session={user.demo ? 'demonstração' : 'conta'}
          onTrack={() => undefined}
          welcome={entry.welcome}
          welcomeVia={entry.via}
          onReport={(r, media) => (user.demo ? undefined : queueReport(r, media))}
        />
      </div>
      {user.demo && (
        <p role="note" className={(desktop ? 'fixed left-4 bottom-4' : 'fixed left-1/2 top-3 -translate-x-1/2') + ' z-[999] w-max rounded-full bg-[#c4402e] px-3 py-1 text-[12px] font-semibold text-white pointer-events-none'}>
          Demonstração · nada é salvo
        </p>
      )}
    </main>
  )
}
