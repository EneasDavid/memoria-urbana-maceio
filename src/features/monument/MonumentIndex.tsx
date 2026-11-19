import { useEffect } from 'react'
import { monuments, type Monument } from '../../data'
import { Photo, KindPill } from '../../MobileScreens'
import { monumentUrl } from '../../app/router'
import { LoginPill } from '../auth/TrailInvite'
import { LegalFooter } from '../legal/LegalFooter'

// Lista pública. Cada card é um link comum (<a href>), então dá para abrir cada monumento
// em uma aba nova (Ctrl/⌘ + clique ou toque longo). Sem menu, sem login.
// Princípios 15 e 16 (Hick e Miller): em vez de 15 cartões de uma vez, 4 grupos por região,
// cada um com no máximo 7 itens, para a escolha ser rápida.
const GROUPS: { id: Monument['group']; title: string; hint: string }[] = [
  { id: 'orla', title: 'Orla', hint: 'Pajuçara, Ponta Verde e Jatiúca' },
  { id: 'centro', title: 'Centro histórico', hint: 'Praças e bustos do Centro' },
  { id: 'bebedouro', title: 'Bebedouro', hint: 'Memória do bairro' },
  { id: 'alto', title: 'Parte alta', hint: 'Farol e Ufal' },
]

export function MonumentIndex() {
  useEffect(() => {
    document.title = 'Monumentos · Memória Urbana Maceió'
  }, [])

  return (
    <main id="conteudo" className="min-h-dvh bg-[#f6f3ec] text-black">
      <div className="relative max-w-[1160px] mx-auto px-5 py-8">
        <div className="absolute right-5 top-8 [&>a]:static"><LoginPill returnTo="/app" /></div>
        <div className="flex items-center gap-3 pr-36">
          <img src="/memoria-urbana-logo.png" alt="" className="w-11 h-11 rounded-full object-cover mu-multiply" />
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.02em] leading-tight">Memória Urbana Maceió</h1>
            <p className="text-[14.5px] text-black/70">Quem são as estátuas e praças da cidade, e qual museu continua cada história.</p>
          </div>
        </div>

        {GROUPS.map((g) => {
          const list = monuments.filter((m) => m.group === g.id)
          if (!list.length) return null
          return (
            <section key={g.id} aria-labelledby={`grupo-${g.id}`} className="mt-9">
              <h2 id={`grupo-${g.id}`} className="text-[20px] font-bold tracking-[-0.02em] flex items-baseline gap-2">
                {g.title}<span className="text-[13px] font-medium text-black/70">{list.length} {list.length === 1 ? 'lugar' : 'lugares'} · {g.hint}</span>
              </h2>
              <ul className="mt-3 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" data-group={g.id}>
                {list.map((m) => (
                  <li key={m.id}>
                    <a href={monumentUrl(m.id)} className="block group mu-press rounded-[18px]">
                      <div className="relative h-[170px] rounded-[18px] overflow-hidden mu-tilt mu-photo-edge">
                        <Photo m={m} className="absolute inset-0" />
                        <span className="absolute left-2.5 top-2.5"><KindPill kind={m.kind} /></span>
                        <span className="absolute right-2.5 top-2.5 h-[22px] px-2 rounded-full bg-black/60 text-white text-[11px] font-bold grid place-items-center">Placa {m.plate}</span>
                      </div>
                      <div className="mt-2 text-[16px] font-semibold leading-tight group-hover:underline">{m.name}</div>
                      <div className="text-[13.5px] text-black/70">{m.role} · {m.area}</div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        <LegalFooter />
      </div>
    </main>
  )
}
