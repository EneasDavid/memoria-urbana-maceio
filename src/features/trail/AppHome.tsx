import { useCallback, useEffect, useMemo, useState } from 'react'
import { MobileApp, type Standalone } from '../../MobileApp'
import type { User } from '../../data'
import { queueReport } from '../monument/reports'
import { logout, type SessionUser } from '../auth/useSession'
import { loadProgress, saveProgress } from '../../shared/progress'
import { openVault, endSession, wipeAccount, type VaultResult } from '../../shared/deviceData'
import { forgetLocalProfile } from '../../shared/localProfile'
import { byId } from '../../data'

// Área com conta: o mesmo app do protótipo do Figma (Explorar, Trilha, Passaporte e leitura da placa),
// em tela cheia e sem as simulações da apresentação. Na conta de demonstração as simulações continuam
// ligadas (caminhada, leitura de placa, amigos por perto) para dar para testar tudo sem ir à rua.
// Carimbos: cofre por conta no aparelho (com selo de dono) + cópia no servidor com Google (KAN-75), ver shared/deviceData.

const hoje = () => {
  const s = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function AppHome({ user }: { user: SessionUser }) {
  // Antes de ler qualquer dado: confere se o cofre do aparelho é desta conta e junta com a cópia online
  const [vault, setVault] = useState<VaultResult | null>(null)
  useEffect(() => {
    let alive = true
    openVault(user).then((r) => { if (alive) setVault(r) }, () => { if (alive) setVault({ status: 'ok', online: 'unavailable' }) })
    return () => { alive = false }
  }, [user])
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
  // Leituras feitas sem conta: passam para esta conta uma vez só (não ficam para a próxima pessoa do aparelho)
  const [preStamps] = useState(() => {
    const p = loadProgress()
    const list = (p.stamps || []).map(({ id, via }) => ({ id, via }))
    if (list.length) saveProgress({ ...p, stamps: [] })
    return list
  })
  const standalone = useMemo<Standalone>(() => ({
    preStamps,
    simulate: !!user.demo,
    onLogout: () => { void logout() },
    onWipeDevice: () => {
      if (!window.confirm(user.local ? 'Apagar seu perfil, selos e pontos deste aparelho? Não dá para desfazer.' : 'Apagar seus selos e pontos deste aparelho? A cópia da sua conta Google continua na nuvem.')) return
      void endSession().then(() => {
        wipeAccount(user.email)
        if (user.local) forgetLocalProfile(user.sub.replace(/^local-/, ''))
        return logout()
      })
    },
    today: hoje(),
    links: { privacy: '/privacidade', panel: user.role === 'gestor' ? '/painel' : undefined },
    desktop,
  }), [user, desktop, preStamps])

  if (!vault) {
    return (
      <main id="conteudo" className="fixed inset-0 grid place-items-center bg-[#f6f3ec] text-black" aria-busy="true">
        <p role="status" className="text-[15px] text-black/70">Carregando seus selos…</p>
      </main>
    )
  }

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
      {vault.quarantined && (
        <p role="alert" className="fixed left-1/2 top-3 -translate-x-1/2 z-[999] w-max max-w-[92vw] rounded-full bg-[#dda93f] px-3 py-1 text-[12px] font-semibold text-black">
          Encontramos dados de outra conta neste aparelho e não os misturamos com os seus.
        </p>
      )}
      {user.demo && (
        <p role="note" className={(desktop ? 'fixed left-4 bottom-4' : 'fixed left-1/2 top-3 -translate-x-1/2') + ' z-[999] w-max rounded-full bg-[#c4402e] px-3 py-1 text-[12px] font-semibold text-white pointer-events-none'}>
          Demonstração · nada é salvo
        </p>
      )}
    </main>
  )
}
