import { useCallback, useEffect, useMemo, useState } from 'react'
import { MobileApp, type Standalone } from '../../MobileApp'
import type { User } from '../../data'
import { queueReport } from '../monument/reports'
import { logout, type SessionUser } from '../auth/useSession'

// Área com conta: o mesmo app do protótipo do Figma (Explorar, Trilha, Passaporte e leitura da placa),
// em tela cheia e sem as simulações da apresentação. Na conta de demonstração as simulações continuam
// ligadas (caminhada, leitura de placa, amigos por perto) para dar para testar tudo sem ir à rua.
// Próximas sprints: carimbos salvos no servidor e mescla do que foi feito no aparelho (KAN-75).

const hoje = () => {
  const s = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function AppHome({ user }: { user: SessionUser }) {
  const appUser = useMemo<User>(() => ({ name: user.name, email: user.email, color: '#c4683a' }), [user.name, user.email])
  const [dark, setDarkState] = useState(() => typeof window !== 'undefined' && (document.documentElement.classList.contains('mu-dark') || !!window.matchMedia?.('(prefers-color-scheme: dark)').matches))
  const setDark = useCallback((v: boolean) => {
    document.documentElement.classList.toggle('mu-dark', v)
    document.documentElement.style.colorScheme = v ? 'dark' : 'light'
    setDarkState(v)
  }, [])

  useEffect(() => {
    const prev = document.title
    document.title = 'Trilha Cultural · Memória Urbana Maceió'
    // o app ocupa a tela inteira: quem rola é cada aba, não a página
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => { document.title = prev; document.body.style.overflow = overflow }
  }, [])

  const standalone = useMemo<Standalone>(() => ({
    simulate: !!user.demo,
    onLogout: () => { void logout() },
    today: hoje(),
    links: { privacy: '/privacidade', panel: user.role === 'gestor' ? '/painel' : undefined },
  }), [user.demo, user.role])

  return (
    <main id="conteudo" className="fixed inset-0 bg-[#f6f3ec] mu-app-shell">
      <div className="relative mx-auto h-full w-full max-w-[480px] sm:border-x sm:border-black/[0.06]">
        <MobileApp
          standalone={standalone}
          user={appUser}
          setUser={() => undefined}
          dark={dark}
          setDark={setDark}
          session={user.demo ? 'demonstração' : 'conta'}
          onTrack={() => undefined}
          onReport={(r, media) => (user.demo ? undefined : queueReport(r, media))}
        />
      </div>
      {user.demo && (
        <p role="note" className="fixed left-1/2 top-3 z-[999] w-max -translate-x-1/2 rounded-full bg-[#c4402e] px-3 py-1 text-[12px] font-semibold text-white pointer-events-none">
          Demonstração · nada é salvo
        </p>
      )}
    </main>
  )
}
