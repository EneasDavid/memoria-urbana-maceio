import { useEffect, useState } from 'react'
import { findMonument } from './find'
import { Icon, Segmented, Narrator, Waves } from '../../ui'
import { type Monument, type Report } from '../../data'
import { Photo, KindPill, VisitBanner } from '../../MobileScreens'
import { ReportSheet } from '../../ReportSheet'
import { NotFound } from './NotFound'
import { queueReport } from './reports'
import { LoginPill, TrailInvite } from '../auth/TrailInvite'
import { LegalFooter } from '../legal/LegalFooter'

// Página pública do monumento: é o que abre quando alguém lê o QR ou encosta no NFC da placa.
// Regras: abre sem login (a conta é só um convite opcional), sem menu, sem botão "voltar" desenhado (o navegador já tem), uma URL por
// monumento (/monumento/:id), o convite ao museu sempre visível e o relato de dano em 2 toques.

export function audioDescription(m: Monument): string {
  if (m.id === 'graciliano') return 'Estátua de bronze em tamanho real. O escritor está de pé, de terno, com o corpo levemente inclinado, como quem caminha pelo calçadão, com o mar de Pajuçara ao fundo.'
  if (m.id === 'nise') return 'Escultura de bronze em tamanho real. Nise está sentada, com um gato no colo, cercada por palmeiras do Corredor Vera Arruda.'
  return `${m.kind} ${m.kind === 'Praça' ? 'localizada' : 'instalada'} em ${m.address}. A audiodescrição detalhada desta peça está sendo escrita pela curadoria.`
}

export function MonumentPage({ id }: { id: string }) {
  // Princípio 18 (Postel): aceita /monumento/GRACILIANO, /monumento/01, /placa/1, nome com acento…
  const m = findMonument(id)
  const [mode, setMode] = useState<'bio' | 'desc'>('bio')
  const [report, setReport] = useState(false)
  const [narrating, setNarrating] = useState(false)
  const [copied, setCopied] = useState(false)
  // Lei de Jakob: compartilhar usa a folha nativa do celular; sem ela, copia o link
  const share = async () => {
    if (!m) return
    const url = `${window.location.origin}/monumento/${m.id}`
    try {
      if (navigator.share) return await navigator.share({ title: `${m.name} · Memória Urbana Maceió`, url })
      await navigator.clipboard.writeText(url)
      setCopied(true); window.setTimeout(() => setCopied(false), 2000)
    } catch { /* cancelado pelo usuário */ }
  }

  useEffect(() => {
    if (!m) return
    document.title = `${m.name} · Memória Urbana Maceió`
    // …e corrige a URL para a forma canônica, sem recarregar
    const canonical = `/monumento/${m.id}`
    if (window.location.pathname !== canonical) window.history.replaceState(null, '', canonical + window.location.search + window.location.hash)
  }, [m])

  if (!m) return <NotFound />

  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${m.museum.name}, ${m.museum.address}, Maceió`)

  return (
    <main id="conteudo" className="min-h-dvh bg-[#f6f3ec] text-black" data-staged={narrating ? 'narracao' : undefined}>
      {/* foto e nome */}
      <section className="relative h-[52vh] min-h-[320px] max-h-[520px] mu-stage">
        <Photo m={m} className="absolute inset-0" />
        <div className="absolute inset-0 mu-hero-veil" />
        <LoginPill returnTo={`/monumento/${m.id}`} />
        <div className="absolute inset-x-0 bottom-0">
          <div className="max-w-[760px] mx-auto px-5 pb-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <KindPill kind={m.kind} />
              <span className="text-[12px] font-semibold tracking-[0.12em] text-white/75">PLACA {m.plate} · {m.area.toUpperCase()}</span>
            </div>
            <h1 className="text-[36px] sm:text-[48px] font-bold tracking-[-0.03em] leading-[1.02]">{m.name}</h1>
            <p className="mt-2 text-[17px] sm:text-[19px] text-white/80">{m.role} · {m.years}</p>
            {m.photo && <p className="mt-2 text-[11px] text-white/80">Foto: {m.photo.credit}</p>}
          </div>
        </div>
      </section>

      <div className="max-w-[760px] mx-auto px-5 pb-12">
        {/* Princípio 20 (frequência de uso) + 13 (Fitts): o que quase todo visitante faz fica no topo, em alvos grandes */}
        <nav aria-label="Ações rápidas" className="mu-stage -mt-6 relative z-10 grid grid-cols-3 gap-2 rounded-[var(--r-card)] bg-white p-2 mu-edge mu-raise-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          {/* O play da narração é um só (no cartão logo abaixo); aqui ficam as outras ações mais usadas */}
          <a href="#museu" className="mu-press min-h-[56px] rounded-[var(--r-inner)] bg-[#1f6b6b] text-white text-[13.5px] font-semibold flex flex-col items-center justify-center gap-1">
            <Icon name="pin" size={17} stroke={2.4} />Museu
          </a>
          <button type="button" onClick={share} className="mu-press min-h-[56px] rounded-[var(--r-inner)] bg-[#1f6b6b]/10 text-[#1f6b6b] text-[13.5px] font-semibold flex flex-col items-center justify-center gap-1">
            <Icon name="arrowUR" size={17} stroke={2.4} />{copied ? 'Link copiado' : 'Compartilhar'}
          </button>
          <button type="button" onClick={() => setReport(true)} className="mu-press min-h-[56px] rounded-[var(--r-inner)] bg-[#c4402e]/10 text-[#a3321f] text-[13.5px] font-semibold flex flex-col items-center justify-center gap-1">
            <Icon name="flag" size={17} stroke={2.4} />Relatar
          </button>
        </nav>

        <div className="mu-stage"><VisitBanner m={m} /></div>

        {/* bio e audiodescrição, com narração em voz */}
        <div className="mt-6">
          <Segmented value={mode} onChange={setMode} options={[{ value: 'bio', label: 'Bio' }, { value: 'desc', label: 'Audiodescrição' }]} />
          <Narrator
            key={mode}
            playId="narrar"
            onPlayingChange={setNarrating}
            title={mode === 'bio' ? `Narração · ${m.name}` : `Audiodescrição · ${m.name}`}
            subtitle="Toque no play para ouvir"
            accent="#1f6b6b"
            text={mode === 'bio' ? m.summary : audioDescription(m)}
            textClassName="mt-5 text-[18px] sm:text-[20px] leading-[1.6] text-black/85"
          />
        </div>

        <div className="mu-stage">
        {m.quote && (
          <blockquote className="mt-7 rounded-[22px] p-6 bg-[#0b2f49] mu-navy-grad text-white">
            <Waves className="w-24 h-4 mb-3" color="#dda93f" />
            <p className="text-[20px] leading-snug font-medium">“{m.quote}”</p>
            <footer className="mt-3 text-[14px] text-white/80">— {m.name}</footer>
          </blockquote>
        )}

        {/* convite ao museu: sempre presente, sem login */}
        <section aria-labelledby="museu-titulo" id="museu" className="mt-8 rounded-[var(--r-card)] bg-white p-5 mu-edge mu-raise-1 scroll-mt-6">
          <h2 id="museu-titulo" className="text-[16px] font-semibold flex items-center gap-2"><Icon name="pin" size={17} stroke={2.3} className="text-[#1f6b6b]" />Continue a história no museu</h2>
          <p className="mt-2 text-[18px] font-semibold">{m.museum.name}</p>
          <p className="mt-0.5 text-[15px] text-black/70">{m.museum.address}</p>
          {m.museum.hours && <p className="mt-0.5 text-[14px] text-black/70">{m.museum.hours}</p>}
          <p className="mt-3 text-[15.5px] leading-snug text-black/75">{m.museum.why}</p>
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="mu-press mu-windup mt-4 flex sm:inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--r-inner)] bg-[#1f6b6b] px-6 text-[15.5px] font-semibold text-white">
            <Icon name="route" size={16} stroke={2.3} />Como chegar<Icon name="chevR" size={14} stroke={2.6} className="mu-windup-icon" />
          </a>
        </section>

        <TrailInvite plate={m.plate} returnTo={`/monumento/${m.id}`} />

        <h2 className="mt-10 text-[22px] font-bold tracking-[-0.02em]">Ficha</h2>
        <dl className="mt-3 bg-white rounded-[20px] divide-y divide-black/[0.06] mu-edge mu-raise-1">
          {[...m.facts, ['Local da obra', m.address] as [string, string]].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[130px_1fr] sm:grid-cols-[180px_1fr] gap-4 px-5 py-3.5">
              <dt className="text-[14px] text-black/70">{k}</dt>
              <dd className="text-[15px]">{v}</dd>
            </div>
          ))}
        </dl>

        {m.works && (
          <>
            <h2 className="mt-10 text-[22px] font-bold tracking-[-0.02em]">Obras para conhecer</h2>
            <div className="mt-3 -mx-5 px-5 flex gap-2.5 mu-fade-x" tabIndex={0} role="region" aria-label="Obras (role para os lados)">{m.works.map((w) => <span key={w} className="h-10 px-4 rounded-full bg-white mu-edge text-[15px] font-medium grid place-items-center whitespace-nowrap shrink-0">{w}</span>)}</div>
          </>
        )}

        <button onClick={() => setReport(true)} className="mu-press mt-10 w-full rounded-[20px] bg-white p-4 text-left flex items-center gap-3 mu-edge mu-raise-1">
          <span className="w-10 h-10 rounded-[10px] bg-[#c4402e]/10 text-[#c4402e] grid place-items-center"><Icon name="flag" size={18} stroke={2.2} /></span>
          <span className="flex-1">
            <span className="block text-[15px] font-semibold">Viu algum problema na obra?</span>
            <span className="block text-[13px] text-black/70">Danificada, pichada, placa sem funcionar… avise em 2 toques, sem cadastro.</span>
          </span>
          <Icon name="chevR" size={15} className="text-black/30" />
        </button>

        <h2 className="mt-10 text-[22px] font-bold tracking-[-0.02em]">Fontes</h2>
        <ul className="mt-3 bg-white rounded-[20px] divide-y divide-black/[0.06] mu-edge mu-raise-1">
          {m.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3.5 min-h-[48px] text-[14.5px] text-[#1f6b6b]">
                <span className="flex-1">{s.label}</span><Icon name="arrowUR" size={14} stroke={1.9} className="text-[#1f6b6b]" />
              </a>
            </li>
          ))}
        </ul>

        <LegalFooter />
        </div>
      </div>

      {report && (
        <div className="fixed inset-0 z-[200] flex justify-center">
          <div className="relative w-full max-w-[520px] h-full">
            <ReportSheet
              m={m}
              onClose={() => setReport(false)}
              onSend={(r: Omit<Report, 'id' | 'at' | 'status'>, media?: Blob) => queueReport(r, media)}
              sentText={<>Seu relato sobre <b className="text-black">{m.name}</b> ficou salvo neste aparelho e será enviado assim que o serviço de relatos entrar no ar.</>}
            />
          </div>
        </div>
      )}
    </main>
  )
}
