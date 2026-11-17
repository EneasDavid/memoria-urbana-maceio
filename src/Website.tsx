import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon, Segmented, GoogleG, Avatar, Waves } from './ui'
import { monuments, byId, type User, type TrackEvent, type Report } from './data'
import { Photo, KindPill, VisitBanner } from './MobileScreens'
import { GoogleLogin } from './GoogleLogin'
import { Immersive } from './Immersive'
import { ReportSheet } from './ReportSheet'
import { FakeQR } from './Scanner'

// Versão web (desktop/notebook): a página do monumento é o centro.
// Sem perfil. A conta (opcional) aparece em destaque só para liberar RA e 3D.

type NewEvent = Omit<TrackEvent, 'id' | 'at' | 'session' | 'synced'> & { synced?: boolean }

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm grid place-items-center anim-fade" onClick={onClose}>
      <div className="relative w-[420px] h-[min(820px,92vh)] rounded-[36px] overflow-hidden bg-[#f6f3ec] shadow-2xl mu-mobile" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}

export function Website({ id, setId, user, setUser, dark, setDark, onTrack, onReport }: {
  id: string; setId: (id: string) => void; user: User | null; setUser: (u: User | null) => void; dark: boolean; setDark: (v: boolean) => void
  onTrack: (e: NewEvent) => void; onReport: (r: Omit<Report, 'id' | 'at' | 'status'>) => void
}) {
  const m = byId(id)
  const [mode, setMode] = useState<'ler' | 'ouvir' | 'desc'>('ler')
  const [login, setLogin] = useState<string | null>(null)
  const [imm, setImm] = useState<'ar' | '3d' | null>(null)
  const [report, setReport] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const top = useRef<HTMLDivElement>(null)

  useEffect(() => {
    top.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setMode('ler'); setProgress(0); setPlaying(false)
    onTrack({ type: 'open_story', label: 'Página aberta no site', monument: id, offline: false, identified: !!user })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => setProgress((p) => (p >= 1 ? (setPlaying(false), 1) : p + 0.01)), 120)
    return () => window.clearInterval(t)
  }, [playing])

  const openImm = (k: 'ar' | '3d') => (user ? setImm(k) : setLogin(k === 'ar' ? 'Entre para ver em realidade aumentada' : 'Entre para ver em 3D'))

  return (
    <div ref={top} className="absolute inset-0 overflow-y-auto bg-[#f6f3ec] text-black">
      {/* faixa de conta — bem visível e opcional */}
      {!user && (
        <div className="bg-[#0b2f49] text-white">
          <div className="max-w-[1160px] mx-auto px-6 h-11 flex items-center justify-center gap-3 text-[14px]">
            <Icon name="scan" size={16} className="text-[#dda93f]" />
            <span><b className="font-semibold">Trilha Cultural:</b> pontue em cada placa e veja os monumentos em realidade aumentada. Crie sua conta grátis.</span>
            <button onClick={() => setLogin('Crie sua conta para liberar a realidade aumentada')} className="ml-2 h-7 px-3 rounded-full bg-[#dda93f] text-[#0b2f49] text-[13px] font-semibold">Criar conta</button>
          </div>
        </div>
      )}

      {/* cabeçalho */}
      <header className="sticky top-0 z-40 bg-[#f6f3ec]/80 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6 h-16 flex items-center gap-6">
          <button onClick={() => setId('graciliano')} className="flex items-center gap-2.5">
            <img src="/memoria-urbana-logo.png" alt="" className="w-9 h-9 rounded-full object-cover bg-white" />
            <span className="text-[16px] font-semibold tracking-[-0.01em]">Memória Urbana <span className="text-black/45 font-normal">Maceió</span></span>
          </button>
          <nav className="flex items-center gap-5 text-[14px] text-black/65">
            <a href="#explorar" className="hover:text-black">Monumentos</a>
            <a href="#como" className="hover:text-black">Como funciona</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDark(!dark)} aria-label="Modo noturno" className="w-9 h-9 rounded-full bg-black/[0.05] grid place-items-center text-black/70"><Icon name={dark ? 'sun' : 'moon'} size={18} /></button>
            {user ? (
              <div className="h-9 pl-1 pr-3 rounded-full bg-white flex items-center gap-2 text-[13px]">
                <Avatar name={user.name} color={user.color} size={28} /><span className="font-semibold">{user.name.split(' ')[0]}</span>
                <span className="text-[#2c8585] font-semibold flex items-center gap-1"><Icon name="check" size={13} stroke={2.6} />RA liberada</span>
                <button onClick={() => setUser(null)} className="ml-1 text-black/45 hover:text-black">Sair</button>
              </div>
            ) : (
              <>
                <button onClick={() => setLogin('')} className="h-9 px-4 rounded-full text-[14px] font-semibold text-black/75 hover:bg-black/[0.05]">Entrar</button>
                <button onClick={() => setLogin('Crie sua conta para liberar a realidade aumentada')} className="h-9 px-4 rounded-full bg-[#2c8585] text-white text-[14px] font-semibold flex items-center gap-2 shadow-[0_4px_14px_rgba(44,133,133,0.35)]"><GoogleG size={15} />Criar conta · libera RA</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="max-w-[1160px] mx-auto px-6 pt-6">
        <div className="text-[13px] text-black/45 mb-3">{m.group === 'orla' ? 'Orla de Maceió' : 'Centro histórico'} › Placa {m.plate}</div>
        <div className="relative h-[460px] rounded-[28px] overflow-hidden">
          <Photo m={m} className="absolute inset-0" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(5,20,32,0.88) 100%)' }} />
          <div className="absolute left-8 right-8 bottom-7 text-white flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3"><KindPill kind={m.kind} /><span className="text-[12px] font-semibold tracking-[0.12em] text-white/75">{m.area.toUpperCase()}</span></div>
              <h1 className="text-[52px] font-bold tracking-[-0.03em] leading-[1]">{m.name}</h1>
              <div className="mt-2 text-[19px] text-white/80">{m.role} · {m.years}</div>
            </div>
            <div className="text-[11px] text-white/55 text-right shrink-0">{m.photo ? `Foto: ${m.photo.credit}` : '[FOTO A PRODUZIR pela curadoria]'}</div>
          </div>
        </div>
      </section>

      {/* corpo */}
      <section className="max-w-[1160px] mx-auto px-6 py-8 grid grid-cols-[1fr_360px] gap-8 items-start">
        <div>
          <div className="flex items-center justify-between">
            <Segmented value={mode} onChange={setMode} options={[{ value: 'ler', label: 'Bio' }, { value: 'desc', label: 'Audiodescrição' }]} />
          </div>

          <VisitBanner m={m} />
          {mode === 'desc' ? (
            <div className="mt-5 bg-white rounded-[20px] p-5 text-[17px] leading-relaxed text-black/80">
              {m.id === 'graciliano' ? 'Estátua de bronze em tamanho real. O escritor está de pé, de terno, com o corpo levemente inclinado, como quem caminha pelo calçadão, com o mar de Pajuçara ao fundo.' : m.id === 'nise' ? 'Escultura de bronze em tamanho real. Nise está sentada, com um gato no colo, cercada por palmeiras do Corredor Vera Arruda.' : '[AUDIODESCRIÇÃO escrita pela curadoria]'}
            </div>
          ) : (
            <p className="mt-6 text-[21px] leading-[1.55] text-black/85 tracking-[-0.01em]">{m.summary}</p>
          )}
            <div className="mt-5 bg-white rounded-[20px] p-5 flex items-center gap-5">
              <button onClick={() => { if (!playing) onTrack({ type: 'audio_play', label: 'Áudio iniciado (site)', monument: id, offline: false, identified: !!user }); if (progress >= 1) setProgress(0); setPlaying(!playing) }} className="w-14 h-14 rounded-full bg-[#0b2f49] text-white grid place-items-center shrink-0"><Icon name={playing ? 'pause' : 'play'} size={24} /></button>
              <div className="flex-1"><div className="text-[15px] font-semibold">{mode === 'desc' ? 'Audiodescrição' : 'Narração'} · {m.name}</div><div className="mt-2 h-[5px] rounded-full bg-black/[0.08]"><div className="h-full rounded-full bg-[#2c8585]" style={{ width: `${progress * 100}%` }} /></div></div>
              <span className="text-[13px] text-black/45 tabular-nums">2:48</span>
            </div>

          {m.quote && (
            <blockquote className="mt-7 rounded-[22px] p-6 bg-[#0b2f49] text-white">
              <Waves className="w-24 h-4 mb-3" color="#dda93f" />
              <p className="text-[22px] leading-snug font-medium">“{m.quote}”</p>
              <footer className="mt-3 text-[14px] text-white/55">— {m.name}</footer>
            </blockquote>
          )}

          <h2 className="mt-10 text-[24px] font-bold tracking-[-0.02em]">Ficha</h2>
          <dl className="mt-3 bg-white rounded-[20px] divide-y divide-black/[0.06]">
            {[...m.facts, ['Local da obra', m.address] as [string, string]].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[180px_1fr] gap-4 px-5 py-3.5"><dt className="text-[14px] text-black/50">{k}</dt><dd className="text-[15px]">{v}</dd></div>
            ))}
          </dl>

          {m.works && (
            <>
              <h2 className="mt-10 text-[24px] font-bold tracking-[-0.02em]">Obras para conhecer</h2>
              <div className="mt-3 flex gap-3 flex-wrap">{m.works.map((w) => <span key={w} className="h-10 px-4 rounded-full bg-white text-[15px] font-medium grid place-items-center">{w}</span>)}</div>
            </>
          )}

          <h2 className="mt-10 text-[24px] font-bold tracking-[-0.02em]">Fontes</h2>
          <ul className="mt-3 bg-white rounded-[20px] divide-y divide-black/[0.06]">
            {m.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3.5 text-[14.5px] text-[#2c8585] hover:bg-black/[0.02]"><span className="flex-1">{s.label}</span><Icon name="arrowUR" size={14} className="text-black/30" /></a></li>)}
          </ul>
          <p className="mt-4 text-[12.5px] text-black/45">Conteúdo revisado por [NOME DO REVISOR] · [INSTITUIÇÃO DE MEMÓRIA] · Revisão em [DATA]</p>
        </div>

        {/* lateral */}
        <aside className="sticky top-24 space-y-4">
          <div className="rounded-[24px] overflow-hidden bg-white">
            <div className="relative h-[170px]">
              <Photo m={m} className="absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b2f49] via-[#0b2f49]/40 to-transparent" />
              <div className="absolute left-4 bottom-3 text-white"><div className="text-[11px] font-bold tracking-[0.14em] text-[#dda93f]">EXPERIÊNCIA IMERSIVA</div><div className="text-[19px] font-bold leading-tight">Realidade aumentada e 3D</div></div>
              {!user && <span className="absolute right-3 top-3 h-7 px-2.5 rounded-full bg-black/45 backdrop-blur text-white text-[12px] font-semibold flex items-center gap-1"><Icon name="lock" size={13} />com conta</span>}
            </div>
            <div className="p-4">
              {user ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => openImm('3d')} className="h-11 rounded-[12px] bg-[#0b2f49] text-white text-[14px] font-semibold flex items-center justify-center gap-2"><Icon name="cube" size={17} />Ver em 3D</button>
                    <button onClick={() => openImm('ar')} className="h-11 rounded-[12px] bg-[#2c8585] text-white text-[14px] font-semibold flex items-center justify-center gap-2"><Icon name="scan" size={17} />Prévia RA</button>
                  </div>
                  <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-[#f6f3ec] p-3">
                    <div className="p-1 bg-white rounded-[8px]"><FakeQR seed={Number(m.plate) + 40} size={64} /></div>
                    <div className="text-[13px] text-black/60 leading-snug"><b className="text-black">Baixe o app:</b> aponte a câmera do celular para o QR. No app você pontua, fotografa o monumento e usa a RA no local.</div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[14px] text-black/60 leading-snug">A página é aberta para todos. Para pontuar na Trilha Cultural, fotografar o monumento e usar realidade aumentada: entre com Google e baixe o app.</p>
                  <button onClick={() => setLogin('Crie sua conta para liberar a realidade aumentada')} className="mt-3 w-full h-12 rounded-[13px] bg-[#2c8585] text-white text-[15px] font-semibold flex items-center justify-center gap-2.5"><GoogleG size={17} />Criar conta grátis com Google</button>
                  <button onClick={() => setLogin('')} className="mt-1.5 w-full h-10 text-[14px] font-semibold text-[#2c8585]">Já tenho conta · Entrar</button>
                </>
              )}
            </div>
          </div>

          <div className="rounded-[20px] bg-white p-4">
            <div className="text-[15px] font-semibold flex items-center gap-2"><Icon name="pin" size={17} className="text-[#2c8585]" />Como chegar · continue a história no museu</div>
            <p className="mt-2 text-[15px] font-semibold text-black/85">{m.museum.name}</p>
            <p className="mt-0.5 text-[14px] text-black/60">{m.museum.address}</p>
            {m.museum.hours && <p className="mt-0.5 text-[13px] text-black/45">{m.museum.hours}</p>}
            <p className="mt-2 text-[14px] leading-snug text-black/70">{m.museum.why}</p>
            <a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(m.museum.name + ', ' + m.museum.address + ', Maceió')} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2c8585] px-4 text-[14px] font-semibold text-white"><Icon name="route" size={15} />Abrir no mapa</a>
            <p className="mt-2 text-[12px] text-black/40">Aberto a todos, sem login.</p>
          </div>

          <button onClick={() => setReport(true)} className="w-full rounded-[20px] bg-white p-4 text-left flex items-center gap-3 hover:bg-white/80">
            <span className="w-10 h-10 rounded-[11px] bg-[#c4402e]/10 text-[#c4402e] grid place-items-center"><Icon name="flag" size={19} /></span>
            <span className="flex-1"><span className="block text-[15px] font-semibold">Viu algum problema?</span><span className="block text-[13px] text-black/55">Obra danificada, placa sem funcionar… avise em 2 toques.</span></span>
            <Icon name="chevR" size={15} className="text-black/30" />
          </button>
        </aside>
      </section>

      {/* explorar */}
      <section id="explorar" className="max-w-[1160px] mx-auto px-6 pb-10">
        <div className="flex items-end justify-between"><h2 className="text-[28px] font-bold tracking-[-0.02em]">Continue explorando</h2><Waves className="w-28 h-4" /></div>
        <div className="mt-4 grid grid-cols-5 gap-4">
          {monuments.filter((x) => x.id !== id).map((x) => (
            <button key={x.id} onClick={() => setId(x.id)} className="text-left group">
              <div className="relative h-[150px] rounded-[18px] overflow-hidden"><Photo m={x} className="absolute inset-0 group-hover:scale-[1.03] transition-transform duration-300" /><span className="absolute left-2.5 top-2.5"><KindPill kind={x.kind} /></span></div>
              <div className="mt-2 text-[15px] font-semibold leading-tight">{x.name}</div>
              <div className="text-[13px] text-black/50">{x.role} · {x.area}</div>
            </button>
          ))}
        </div>
      </section>

      <section id="como" className="border-t border-black/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6 py-10 grid grid-cols-3 gap-8">
          {[
            ['qr', 'Aponte a câmera', 'O QR da placa abre esta página no navegador. Sem app, sem cadastro.'],
            ['nfc', 'Ou encoste o celular', 'A notificação da tag NFC aparece na tela inicial e abre a mesma página.'],
            ['star', 'Quer pontuar? Entre e baixe o app', 'Login Google + app leve: trilha, carimbos, foto do monumento e RA.'],
          ].map(([ic, t, d]) => (
            <div key={t} className="flex gap-3"><span className="w-11 h-11 rounded-[12px] bg-white grid place-items-center text-[#2c8585] shrink-0"><Icon name={ic as 'qr'} size={22} /></span><div><div className="text-[16px] font-semibold">{t}</div><div className="text-[14px] text-black/55 leading-snug mt-0.5">{d}</div></div></div>
          ))}
        </div>
        <div className="max-w-[1160px] mx-auto px-6 pb-10 text-[12.5px] text-black/45 flex items-center gap-2"><Icon name="shield" size={14} />Página leve (~150 KB sem fotos), fontes do sistema e fotos sob demanda. Nenhum dado pessoal é coletado sem conta (LGPD).</div>
      </section>

      {login !== null && (
        <Modal onClose={() => setLogin(null)}>
          <GoogleLogin reason={login || undefined} onClose={() => setLogin(null)} onLogin={(u) => { setUser(u); setLogin(null); onTrack({ type: 'login', label: 'Conta criada no site (Google)', offline: false, identified: true, synced: true }) }} />
        </Modal>
      )}
      {imm && <Modal onClose={() => setImm(null)}><Immersive m={m} initial={imm} onClose={() => setImm(null)} onShot={() => undefined} /></Modal>}
      {report && <Modal onClose={() => setReport(false)}><ReportSheet m={m} onClose={() => setReport(false)} onSend={onReport} /></Modal>}
    </div>
  )
}
