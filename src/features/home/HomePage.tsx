import { useEffect } from 'react'
import { monuments } from '../../data'
import { people } from '../../graph'
import { thematicTrails } from '../trails/trails'
import { ThemeTrails } from '../trails/ThemeTrails'
import { LoginPill } from '../auth/TrailInvite'
import { LegalFooter } from '../legal/LegalFooter'
import { LogoMark, EmMaceio, Waves, FaixaAlagoas, Skyline, Ornament, Icon } from '../../ui'
import { monumentUrl } from '../../app/router'

// Página inicial: apresenta o projeto. A lista completa fica na Galeria (/galeria), que não gera carimbo.
export function HomePage() {
  useEffect(() => { document.title = 'Memória Urbana Maceió · O monumento como convite' }, [])
  const destaque = ['graciliano', 'nise', 'catedral', 'lucena'].map((id) => monuments.find((m) => m.id === id)!).filter(Boolean)
  const passos = [
    ['placa', 'Aponte a câmera para o QR da placa', 'Ou encoste o celular no NFC. Abre direto, sem app e sem cadastro, e o carimbo já fica guardado.'],
    ['play', 'Leia, ouça e entenda', 'Quem foi, por que está ali, narração em voz e audiodescrição para quem não enxerga.'],
    ['pin', 'Continue a história no museu', 'Toda obra convida para um museu ou biblioteca perto, com endereço, horário e o motivo da visita.'],
  ] as const
  return (
    <main id="conteudo" className="min-h-dvh bg-[#f6f3ec] text-black overflow-x-hidden">
      <section className="relative bg-[#0b2f49] text-white">
        <div className="relative max-w-[1160px] mx-auto px-5 pt-8 pb-4">
          <div className="flex items-center justify-between gap-3">
            <LogoMark size={72} />
            <div className="[&>a]:static"><LoginPill returnTo="/app" /></div>
          </div>
          <h1 className="mt-6 text-[38px] sm:text-[54px] font-bold tracking-[-0.03em] leading-[1.02] max-w-[16ch] [text-wrap:balance]">O monumento como convite<span className="sr-only"> · Memória Urbana Maceió</span></h1>
          <EmMaceio className="mt-2 text-[15px] [&]:text-[#8fc7c2]" />
          <FaixaAlagoas className="mt-4" />
          <p className="mt-4 text-[18px] leading-[1.5] text-white/85 max-w-[46ch] [text-wrap:pretty]">As estátuas, praças e igrejas de Maceió estão à vista de todos, mas pouca gente sabe quem foram os homenageados. O Memória Urbana coloca uma placa com QR e NFC em cada obra: um toque e você conhece a história e o museu que a continua.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/galeria" className="mu-press h-12 px-6 rounded-full text-[16px] font-bold inline-flex items-center gap-2" style={{ background: '#ecc67a', color: '#0b2f49' }}><Icon name="placa" size={17} />Ver a galeria</a>
            <a href="#trilhas" className="mu-press h-12 px-6 rounded-full bg-white/10 border border-white/25 text-[16px] font-semibold inline-flex items-center gap-2"><Icon name="route" size={17} />Trilhas temáticas</a>
          </div>
        </div>
        <Skyline className="block w-full h-auto max-h-[180px] [&_[fill='#0b2f49']]:fill-[#7fa6b5]" />
      </section>

      <div className="max-w-[1160px] mx-auto px-5">
        <section aria-labelledby="como" className="mt-12">
          <div className="flex items-end gap-3"><Ornament className="w-14 h-14" /><h2 id="como" className="text-[28px] font-bold tracking-[-0.02em]">Como funciona</h2></div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            {passos.map(([icon, t, d], i) => (
              <li key={t} className="rounded-[22px] bg-white p-5 mu-edge mu-raise-1">
                <span className="w-11 h-11 rounded-full grid place-items-center text-white" style={{ background: ['#c8102e', '#1f4fa3', '#dda93f'][i] }}><Icon name={icon} size={19} /></span>
                <h3 className="mt-3 text-[18px] font-bold">{i + 1}. {t}</h3>
                <p className="mt-1 text-[15px] leading-snug text-black/70">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="numeros" className="mt-12 rounded-[26px] bg-[#0b2f49] text-white p-6 sm:p-8 relative overflow-hidden">
          <h2 id="numeros" className="text-[24px] font-bold">O acervo hoje</h2>
          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[[monuments.length, 'monumentos com página própria'], [thematicTrails().length, 'trilhas temáticas'], [people.length, 'personalidades ligadas'], ['0', 'cadastros exigidos para ler']].map(([n, l]) => (
              <div key={String(l)}><dt className="sr-only">{l}</dt><dd><span className="block text-[38px] font-bold text-[#dda93f] tabular">{n}</span><span className="text-[14px] text-white/80">{l}</span></dd></div>
            ))}
          </dl>
          <Waves className="mt-5 w-40 h-4" color="#8fc7c2" />
        </section>

        <section aria-labelledby="destaques" className="mt-12">
          <div className="flex items-end gap-3"><Ornament className="w-14 h-14" /><h2 id="destaques" className="text-[28px] font-bold tracking-[-0.02em]">Algumas histórias</h2></div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {destaque.map((m) => (
              <li key={m.id}>
                <a href={monumentUrl(m.id)} className="mu-press block rounded-[22px] bg-white p-5 h-full mu-edge mu-raise-1">
                  <span className="text-[12px] font-semibold tracking-[0.1em] text-[#1f6b6b] uppercase">{m.kind} · {m.area}</span>
                  <span className="mt-1 block text-[18px] font-bold leading-tight">{m.name}</span>
                  <span className="mt-1 block text-[14px] text-black/70 line-clamp-3">{m.summary}</span>
                </a>
              </li>
            ))}
          </ul>
          <a href="/galeria" className="mt-4 inline-flex items-center gap-1 text-[16px] font-semibold text-[#1f6b6b]">Ver todos na galeria<Icon name="chevR" size={14} /></a>
        </section>

        <div id="trilhas" className="scroll-mt-6"><ThemeTrails /></div>

        <section aria-labelledby="privacidade-home" className="mt-12 rounded-[22px] bg-white p-6 mu-edge mu-raise-1">
          <h2 id="privacidade-home" className="text-[22px] font-bold">Sem cadastro, sem rastreio</h2>
          <p className="mt-2 text-[15.5px] leading-snug text-black/75">Ler, ouvir e seguir trilhas funcionam sem conta, e o seu progresso fica neste aparelho. A localização e a câmera só são pedidas quando você usa e podem ser recusadas. O microfone nunca é usado. Quer levar seus carimbos para outro celular? Entre com Google.</p>
        </section>

        <LegalFooter />
      </div>
    </main>
  )
}
