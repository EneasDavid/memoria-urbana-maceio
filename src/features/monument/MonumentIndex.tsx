import { useEffect } from 'react'
import { monuments, type Monument } from '../../data'
import { Photo, KindPill } from '../../MobileScreens'
import { monumentUrl } from '../../app/router'
import { LoginPill } from '../auth/TrailInvite'
import { LegalFooter } from '../legal/LegalFooter'
import { ThemeTrails } from '../trails/ThemeTrails'
import { LogoMark, EmMaceio, Waves, FaixaAlagoas } from '../../ui'

// Lista pública. Cada card é um link comum (<a href>), então dá para abrir cada monumento
// em uma aba nova (Ctrl/⌘ + clique ou toque longo). Sem menu, sem login.
// Princípios 15 e 16 (Hick e Miller): em vez de 15 cartões de uma vez, 4 grupos por região,
// cada um com no máximo 7 itens, para a escolha ser rápida.
const GROUPS: { id: Monument['group']; title: string; hint: string }[] = [
  { id: 'orla', title: 'Orla', hint: 'Pajuçara, Ponta Verde e Jatiúca' },
  { id: 'centro', title: 'Centro histórico', hint: 'Praças e bustos do Centro' },
  { id: 'igrejas', title: 'Igrejas do Centro', hint: 'Fé, irmandades e azulejos' },
  { id: 'jaragua', title: 'Jaraguá', hint: 'O porto onde a cidade começou' },
  { id: 'bebedouro', title: 'Bebedouro', hint: 'Memória do bairro' },
  { id: 'alto', title: 'Parte alta', hint: 'Farol e Ufal' },
]

export function MonumentIndex() {
  useEffect(() => {
    document.title = 'Galeria · Memória Urbana Maceió'
  }, [])

  return (
    <main id="conteudo" className="min-h-dvh bg-[#f6f3ec] text-black">
      <div className="relative max-w-[1160px] mx-auto px-5 py-8">
        {/* Cabeçalho: logo e entrada na mesma linha; nome e descrição com a largura toda, sem espremer o título */}
        <header className="max-w-[640px]">
          <div className="flex items-center justify-between gap-3">
            <LogoMark size={68} />
            <div className="[&>a]:static"><LoginPill returnTo="/app" /></div>
          </div>
          <h1 className="mt-5 text-[32px] sm:text-[40px] font-bold tracking-[-0.025em] leading-[1.05] [text-wrap:balance] text-[#0b2f49] mu-ink">Memória Urbana<span className="sr-only"> Maceió</span></h1>
          <EmMaceio className="mt-1.5 text-[15px] tracking-[0.02em]" />
          <Waves className="mt-4 w-[132px] h-4" />
          <FaixaAlagoas className="mt-2" />
          <p className="mt-3 text-[17px] leading-[1.5] text-black/75 max-w-[34ch] [text-wrap:pretty]">Galeria: todas as estátuas, praças e igrejas do acervo. Ver por aqui não gera carimbo; o carimbo vem da placa.</p>
          <p className="mt-2 text-[14.5px] leading-[1.5] text-black/70 max-w-[42ch]">Aponte a câmera para o QR da placa ou encoste o celular no NFC. Ou escolha uma obra abaixo: não precisa de cadastro.</p>
        </header>

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

        <ThemeTrails />

        <LegalFooter />
      </div>
    </main>
  )
}
