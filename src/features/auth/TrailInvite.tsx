import { SessionChip } from './SessionBar'
import { Avatar, GoogleG, Icon } from '../../ui'
import { useSession } from './useSession'

const entrar = (returnTo: string) => `/entrar?returnTo=${encodeURIComponent(returnTo)}`

// Convite (opcional) para entrar na Trilha Cultural. A página continua aberta sem conta;
// isto só mostra o que a conta libera e leva ao login com Google.
export function TrailInvite({ plate, returnTo }: { plate: string; returnTo: string }) {
  const s = useSession()
  if (s.status === 'authenticated') {
    return (
      <section className="mt-6 rounded-[var(--r-card)] bg-[#0b2f49] mu-navy-grad text-white p-5 flex items-center gap-4">
        <Icon name="placa" size={26} className="text-[#dda93f] shrink-0" />
        <div className="flex-1">
          <p className="text-[16px] font-semibold">Você está na Trilha, {s.user.name.split(' ')[0]}</p>
          <p className="text-[14px] text-white/70">Leia a placa para ganhar o carimbo desta obra.</p>
        </div>
        <a href="/app" className="mu-press h-11 px-4 rounded-full bg-white text-[#0b2f49] text-[14px] font-semibold grid place-items-center shrink-0">Meus carimbos</a>
      </section>
    )
  }
  return (
    <section aria-labelledby="trilha" className="mt-6 rounded-[var(--r-card)] bg-[#0b2f49] mu-navy-grad text-white p-5">
      <p className="text-[11px] font-bold tracking-[0.14em] text-[#f2c14e]">TRILHA CULTURAL · OPCIONAL</p>
      <h2 id="trilha" className="mt-1 text-[19px] font-bold leading-snug">Ganhe o carimbo da Placa {plate}</h2>
      <p className="mt-1.5 text-[14.5px] text-white/75 leading-snug">Entre com sua conta Google para pontuar em cada monumento, guardar o passaporte e levar seus carimbos para qualquer celular. Esta página continua aberta sem conta.</p>
      <a href={entrar(returnTo)} className="mu-press mt-4 h-12 rounded-[var(--r-inner)] bg-white text-[#0b2f49] text-[15.5px] font-semibold flex items-center justify-center gap-2.5">
        <GoogleG size={18} />Entrar com Google
      </a>
    </section>
  )
}

// Atalho discreto no canto da foto: indica que dá para entrar, sem virar menu.
export function LoginPill({ returnTo }: { returnTo: string }) {
  // Mesmo chip de sessão em todas as páginas (ver SessionChip)
  return <div className="absolute right-4 top-4 z-10"><SessionChip returnTo={returnTo} /></div>
}
