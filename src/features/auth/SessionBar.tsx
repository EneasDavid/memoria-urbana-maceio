import { Avatar, Icon, type IconName } from '../../ui'
import { useSession } from './useSession'

// Elementos de sessão iguais em todas as páginas públicas, venha a pessoa de onde vier (QR, link, galeria):
// - com conta: a mesma barra de abas do app (Explorar, Trilha, Passaporte e Ler placa) e a foto no topo;
// - sem conta: o mesmo botão "Entrar" no topo, e nada de barra (a página fica limpa para quem só quer ler).
const TABS: [string, IconName, string][] = [['', 'home', 'Explorar'], ['trilha', 'map', 'Trilha'], ['passaporte', 'book', 'Passaporte']]

export function SessionBar() {
  const s = useSession()
  if (s.status !== 'authenticated') return null
  return (
    <>
      <div aria-hidden="true" className="h-[110px]" />
      <div className="fixed left-0 right-0 bottom-[max(18px,env(safe-area-inset-bottom))] z-[120] px-4">
        <div className="mx-auto max-w-[480px] flex items-center gap-2.5">
          <nav aria-label="Abas" className="flex-1 h-[64px] rounded-full bg-white/80 backdrop-blur-2xl border border-white/70 shadow-[0_10px_36px_rgba(0,0,0,0.14)] flex items-center px-1.5">
            {TABS.map(([h, icon, label]) => (
              <a key={label} href={h ? `/app#${h}` : '/app'} className="flex-1 h-[54px] rounded-full flex flex-col items-center justify-center gap-0.5 text-black/70">
                <Icon name={icon} size={23} stroke={1.8} />
                <span className="text-[10px] font-semibold">{label}</span>
              </a>
            ))}
          </nav>
          <a href="/app#ler" aria-label="Ler placa" className="w-[64px] h-[64px] rounded-full bg-[#0b2f49] text-white grid place-items-center shadow-[0_10px_30px_rgba(11,47,73,0.45)]">
            <Icon name="scan" size={27} stroke={2} />
          </a>
        </div>
      </div>
    </>
  )
}

/** Chip do topo, igual em toda página: foto + "Meus carimbos" com conta; "Entrar" sem conta. */
export function SessionChip({ returnTo }: { returnTo: string }) {
  const s = useSession()
  if (s.status === 'authenticated') {
    return (
      <a href="/app#passaporte" className="mu-press h-10 pl-1 pr-3 rounded-full bg-black/75 backdrop-blur text-white text-[13px] font-semibold inline-flex items-center gap-2">
        <Avatar name={s.user.name} picture={s.user.picture} size={30} color="#1f6b6b" />{s.user.name.split(' ')[0]} · Meus carimbos
      </a>
    )
  }
  return (
    <a href={`/entrar?returnTo=${encodeURIComponent(returnTo)}`} className="mu-press h-10 px-3.5 rounded-full bg-black/75 backdrop-blur text-white text-[13px] font-semibold inline-flex items-center gap-1.5">
      <Icon name="placa" size={14} className="text-[#dda93f]" />Entrar · guardar carimbos
    </a>
  )
}
