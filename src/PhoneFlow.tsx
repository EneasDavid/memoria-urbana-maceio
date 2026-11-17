import { useEffect, useState } from 'react'
import { Icon, Segmented, GoogleG, Waves, Narrator } from './ui'
import { byId, type User, type TrackEvent, type Report } from './data'
import { Photo, KindPill, VisitBanner } from './MobileScreens'
import { GoogleLogin } from './GoogleLogin'
import { ReportSheet } from './ReportSheet'
import { MobileApp } from './MobileApp'
import { FakeQR } from './Scanner'

// Jornada real do visitante no celular:
// 1) encosta na tag NFC (notificação na tela inicial) ou aponta a câmera para o QR
// 2) abre a PÁGINA WEB do monumento — livre, sem app e sem cadastro
// 3) a página avisa que dá para pontuar → login Google (OAuth) → baixar o app
// 4) no app: trilha cultural, pontos, foto do monumento (+XP) e realidade aumentada

type NewEvent = Omit<TrackEvent, 'id' | 'at' | 'session' | 'synced'> & { synced?: boolean }
export type Stage = 'home' | 'web' | 'install' | 'app'

function Status({ dark }: { dark?: boolean }) {
  return (
    <div className={`absolute top-0 left-0 right-0 z-[60] h-[50px] px-8 pt-[17px] flex justify-between text-[16px] font-semibold pointer-events-none ${dark ? 'text-white' : 'text-black'}`}>
      <span className="w-[54px] text-center tabular-nums">9:41</span>
      <span className="flex items-center gap-1.5"><Icon name="wifi" size={17} stroke={2.4} /><svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="17" height="9" rx="2.5" fill="currentColor" /></svg></span>
    </div>
  )
}

// 1 — Tela inicial com notificação de NFC
function Home({ plate, name, onOpen }: { plate: string; name: string; onOpen: (via: 'nfc' | 'qr') => void }) {
  const [show, setShow] = useState(false)
  const [cam, setCam] = useState(false)
  useEffect(() => { const t = window.setTimeout(() => setShow(true), 700); return () => window.clearTimeout(t) }, [])
  return (
    <div className="absolute inset-0 overflow-hidden text-white" style={{ background: 'radial-gradient(120% 70% at 30% 0%, #2c8585 0%, #0b2f49 60%, #071d2e 100%)' }}>
      <Status dark />
      <Waves className="absolute left-0 right-0 bottom-[150px] w-full h-10 opacity-40" color="#dda93f" />
      <div className="pt-[110px] text-center">
        <div className="text-[18px] font-medium text-white/80">sábado, 7 de novembro</div>
        <div className="text-[88px] font-semibold leading-none tracking-[-0.03em] mt-1">9:41</div>
      </div>
      {show && (
        <button onClick={() => onOpen('nfc')} className="absolute left-3 right-3 top-[58px] z-10 rounded-[22px] bg-white/80 backdrop-blur-2xl text-black p-3.5 flex gap-3 text-left shadow-2xl island-in">
          <span className="w-10 h-10 rounded-[10px] bg-[#0b2f49] text-white grid place-items-center shrink-0"><Icon name="nfc" size={22} /></span>
          <span className="flex-1 min-w-0">
            <span className="flex justify-between text-[13px] text-black/50"><span className="font-semibold uppercase tracking-[0.03em]">Tag NFC</span><span>agora</span></span>
            <span className="block text-[15px] font-semibold leading-tight mt-0.5">Abrir “memoriaurbana.maceio.br”</span>
            <span className="block text-[13.5px] text-black/60 truncate">Placa {plate} · {name}</span>
          </span>
        </button>
      )}
      <div className="absolute left-4 right-4 bottom-[118px] rounded-[20px] bg-white/12 backdrop-blur-xl p-4 text-[13px] text-white/85 leading-snug">
        <b className="text-white">Simulação:</b> você encostou o celular na placa {plate}. Toque na notificação — ou
        <button onClick={() => setCam(true)} className="ml-1 underline underline-offset-2 font-semibold">aponte a câmera para o QR</button>.
      </div>
      <div className="absolute left-4 right-4 bottom-[26px] h-[78px] rounded-[30px] bg-white/15 backdrop-blur-2xl flex items-center justify-around">
        {(['globe', 'scan', 'chat', 'map'] as const).map((i) => i === 'scan'
          ? <button key={i} onClick={() => setCam(true)} aria-label="Abrir câmera para ler o QR" className="w-[54px] h-[54px] rounded-[14px] bg-white text-[#0b2f49] grid place-items-center ring-2 ring-[#ffd60a] active:scale-95 transition"><Icon name={i} size={26} /></button>
          : <span key={i} className="w-[54px] h-[54px] rounded-[14px] bg-white/85 text-[#0b2f49] grid place-items-center opacity-60"><Icon name={i} size={26} /></span>)}
      </div>
      {cam && <QrCamera plate={plate} name={name} onClose={() => setCam(false)} onRead={() => { setCam(false); onOpen('qr') }} />}
    </div>
  )
}

// 1b — Câmera nativa do celular apontando para o QR da placa (mesma animação do leitor do app)
function QrCamera({ plate, name, onClose, onRead }: { plate: string; name: string; onClose: () => void; onRead: () => void }) {
  const [found, setFound] = useState(false)
  useEffect(() => { const t = window.setTimeout(() => setFound(true), 2200); return () => window.clearTimeout(t) }, [])
  useEffect(() => {
    if (!found) return
    const t = window.setTimeout(onRead, 1400)
    return () => window.clearTimeout(t)
  }, [found]) // eslint-disable-line react-hooks/exhaustive-deps
  const edge = found ? 'border-[#ffd60a]' : 'border-white'
  return (
    <div className="absolute inset-0 z-[70] bg-black text-white overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% 30%, #5b7a80 0%, #2a3d42 45%, #0e1517 100%)' }}>
        <div className="absolute left-0 right-0 bottom-0 h-[38%]" style={{ background: 'linear-gradient(180deg, #8d8270 0%, #5e5446 100%)' }} />
        <div className="absolute left-1/2 top-[44%] w-[210px] h-[270px] rounded-[10px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] scene-drift" style={{ background: 'linear-gradient(160deg,#1d4a5c,#0b2f49)' }}>
          <div className="px-4 pt-4 text-[10px] tracking-[0.18em] font-bold text-[#dda93f]">PLACA {plate}</div>
          <div className="px-4 pt-1 text-[17px] font-semibold leading-tight">{name}</div>
          <div className="absolute left-1/2 bottom-5 -translate-x-1/2 p-1.5 bg-white rounded-[6px]"><FakeQR seed={Number(plate)} size={118} /></div>
        </div>
      </div>
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[176px] h-[176px]" style={{ top: 'calc(44% + 50px)' }}>
        <span className={'absolute left-0 top-0 w-9 h-9 border-[4px] border-r-0 border-b-0 rounded-tl-[22px] transition-colors duration-300 ' + edge} />
        <span className={'absolute right-0 top-0 w-9 h-9 border-[4px] border-l-0 border-b-0 rounded-tr-[22px] transition-colors duration-300 ' + edge} />
        <span className={'absolute left-0 bottom-0 w-9 h-9 border-[4px] border-r-0 border-t-0 rounded-bl-[22px] transition-colors duration-300 ' + edge} />
        <span className={'absolute right-0 bottom-0 w-9 h-9 border-[4px] border-l-0 border-t-0 rounded-br-[22px] transition-colors duration-300 ' + edge} />
        {!found && <span className="absolute left-3 right-3 h-[2px] bg-[#ffd60a] shadow-[0_0_14px_#ffd60a] scanline" />}
      </div>
      <Status dark />
      <button onClick={onClose} aria-label="Fechar câmera" className="absolute left-4 top-[58px] z-[71] w-9 h-9 rounded-full bg-black/45 backdrop-blur-xl grid place-items-center">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg>
      </button>
      {found && (
        <button onClick={onRead} className="absolute left-1/2 -translate-x-1/2 top-[64px] z-[71] h-9 px-4 rounded-full bg-[#ffd60a] text-black text-[14px] font-semibold flex items-center gap-1.5 shadow-lg">
          <Icon name="globe" size={15} />memoriaurbana.maceio.br
        </button>
      )}
      <div className="absolute left-0 right-0 bottom-[130px] text-center px-8">
        <div className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-black/45 backdrop-blur-xl text-[14px] font-medium">
          {found ? 'QR Code reconhecido · abrindo…' : 'Aponte para o QR Code da placa'}
        </div>
      </div>
      <div className="absolute left-0 right-0 bottom-[34px] flex justify-center">
        <span className="w-[68px] h-[68px] rounded-full border-[4px] border-white/90 grid place-items-center"><span className="w-[54px] h-[54px] rounded-full bg-white/90" /></span>
      </div>
    </div>
  )
}

// 2 — Página web do monumento (navegador do celular)
function MobileWeb({ id, user, onLogin, onTrack, onReport }: { id: string; user: User | null; onLogin: () => void; onTrack: (e: NewEvent) => void; onReport: (r: Omit<Report, 'id' | 'at' | 'status'>) => void }) {
  const m = byId(id)
  const [mode, setMode] = useState<'ler' | 'desc'>('ler')
  const [report, setReport] = useState(false)
  const [cta, setCta] = useState(true)
  const [playing, setPlaying] = useState(false)
  useEffect(() => { onTrack({ type: 'open_story', label: 'Página aberta pela placa (navegador)', monument: id, offline: false, identified: false }) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="absolute inset-0 bg-[#f6f3ec] text-black">
      <Status dark />
      <div className="absolute inset-0 overflow-y-auto no-scrollbar pb-[200px]">
        <div className="relative h-[380px]">
          <Photo m={m} className="absolute inset-0" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 45%, rgba(5,20,32,0.9) 100%)' }} />
          <div className="absolute left-5 top-[58px] flex items-center gap-2 text-white"><img src="/memoria-urbana-logo.png" alt="" className="w-8 h-8 rounded-full bg-white object-cover" /><span className="text-[13px] font-semibold">Memória Urbana Maceió</span></div>
          {!cta && <button onClick={onLogin} className="absolute right-4 top-[56px] h-8 px-3 rounded-full bg-black/35 backdrop-blur-xl text-white text-[12.5px] font-semibold flex items-center gap-1.5 active:scale-95 transition"><Icon name="star" size={13} />{user ? 'Pontuar' : 'Entrar'}</button>}
          <div className="absolute left-5 right-5 bottom-5 text-white">
            <div className="flex items-center gap-2 mb-2"><KindPill kind={m.kind} /><span className="text-[12px] font-semibold tracking-[0.1em] text-white/75">PLACA {m.plate}</span></div>
            <h1 className="text-[30px] font-bold tracking-[-0.025em] leading-[1.05]">{m.name}</h1>
            <div className="text-[15px] text-white/80 mt-1">{m.role} · {m.years}</div>
            <div className="mt-1 text-[10px] text-white/55">{m.photo ? `Foto: ${m.photo.credit}` : '[FOTO A PRODUZIR]'}</div>
          </div>
        </div>
        <div className="px-4">
          <VisitBanner m={m} />
          <div className="mt-4 flex justify-center"><Segmented value={mode} onChange={setMode} options={[{ value: 'ler', label: 'Bio' }, { value: 'desc', label: 'Audiodescrição' }]} /></div>
          {mode === 'desc'
            ? <Narrator key="desc" text={m.id === 'graciliano' ? 'Estátua de bronze em tamanho real. O escritor está de pé, de terno, com o corpo levemente inclinado, como quem caminha pelo calçadão. Fica no nível do pedestre, sem pedestal alto, com o mar de Pajuçara ao fundo.' : m.id === 'nise' ? 'Escultura de bronze em tamanho real. Nise está sentada, com um gato no colo, num banco ao nível do chão, cercada por palmeiras do Corredor Vera Arruda.' : '[AUDIODESCRIÇÃO escrita pela curadoria: posição, material, tamanho, gestos e entorno da obra.]'} title="Audiodescrição" subtitle="Áudio que descreve a obra · com legenda" autoPlay onStart={() => onTrack({ type: 'audiodesc', label: 'Audiodescrição ouvida (navegador)', monument: id, offline: false, identified: false })} />
            : <Narrator key="ler" text={m.summary} extra={m.facts.map(([k, v]) => k + ': ' + v.replace(/ · /g, ', ') + '.').join(' ')} title="Ouvir a história" subtitle="Leia ou toque para ouvir" onStart={() => onTrack({ type: 'audio_play', label: 'Narração ouvida (navegador)', monument: id, offline: false, identified: false })} />}
          <div className="mt-5 bg-white rounded-[16px] divide-y divide-black/[0.06]">
            {m.facts.map(([k, v]) => <div key={k} className="flex gap-3 px-4 py-2.5"><span className="w-[104px] shrink-0 text-[13px] text-black/50">{k}</span><span className="flex-1 text-[14px]">{v}</span></div>)}
          </div>
          {/* Como chegar: convite ao museu, sempre presente, sem login */}
          <div className="mt-4 rounded-[18px] bg-white p-4">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-[#2c8585]">Como chegar · continue no museu</div>
            <div className="mt-1 text-[16px] font-semibold text-black">{m.museum.name}</div>
            <div className="mt-1 flex items-start gap-1.5 text-[13px] text-black/60"><Icon name="pin" size={14} />{m.museum.address}</div>
            {m.museum.hours && <div className="mt-1 text-[12px] text-black/50">{m.museum.hours}</div>}
            <p className="mt-2 text-[13px] leading-snug text-black/75">{m.museum.why}</p>
            <a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(m.museum.name + ', ' + m.museum.address + ', Maceió')} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2c8585] px-4 text-[13px] font-semibold text-white"><Icon name="route" size={14} />Abrir no mapa</a>
          </div>
          <details className="mt-5 group">
            <summary className="list-none cursor-pointer select-none flex items-center justify-between px-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-black/45">Fontes ({m.sources.length})<span className="normal-case tracking-normal font-medium group-open:hidden">Ver</span><span className="normal-case tracking-normal font-medium hidden group-open:inline">Fechar</span></summary>
            <div className="mt-2 bg-white rounded-[16px] divide-y divide-black/[0.06]">
              {m.sources.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="block px-4 py-2.5 text-[13px] text-[#2c8585] leading-snug">{s.label}</a>)}
            </div>
          </details>
          <button onClick={() => setReport(true)} className="mt-4 w-full h-[46px] rounded-[13px] bg-white text-[#c4402e] text-[15px] font-semibold flex items-center justify-center gap-2"><Icon name="flag" size={17} />Relatar problema nesta obra</button>
        </div>
      </div>

      {/* convite para pontuar */}
      {cta && (
        <div className="absolute left-3 right-3 bottom-[86px] z-20 rounded-[24px] bg-[#0b2f49] text-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.35)] sheet-up">
          <button onClick={() => setCta(false)} aria-label="Fechar" className="absolute right-3 top-3 w-7 h-7 rounded-full bg-white/10 grid place-items-center"><Icon name="x" size={13} stroke={2.6} /></button>
          <div className="flex items-center gap-3 pr-8">
            <span className="w-11 h-11 rounded-full bg-[#dda93f] text-[#0b2f49] grid place-items-center shrink-0"><Icon name="star" size={22} stroke={2.2} /></span>
            <div><div className="text-[15px] font-semibold leading-tight">Você está em {m.name}: vale +{m.xp} pontos</div><div className="text-[12.5px] text-white/65 leading-snug mt-0.5">Entre com Google e baixe o app para pontuar, fotografar e ver em realidade aumentada.</div></div>
          </div>
          <button onClick={onLogin} className="mt-3 w-full h-[46px] rounded-[13px] bg-white text-black text-[15px] font-semibold flex items-center justify-center gap-2.5"><GoogleG size={18} />{user ? 'Continuar e baixar o app' : 'Pontuar com Google'}</button>
        </div>
      )}

      {/* barra do navegador */}
      <div className="absolute left-0 right-0 bottom-0 z-30 h-[82px] bg-[#f6f3ec]/90 backdrop-blur-2xl border-t border-black/[0.06] px-4 pt-2.5">
        <div className="h-11 rounded-[13px] bg-black/[0.06] flex items-center justify-center gap-1.5 text-[15px]"><Icon name="lock" size={13} className="text-black/50" />memoriaurbana.maceio.br</div>
      </div>
      {report && <ReportSheet m={m} onClose={() => setReport(false)} onSend={onReport} />}
    </div>
  )
}

// 3 — Instalar o app (loja genérica)
function Install({ onDone }: { onDone: () => void }) {
  const [p, setP] = useState(0)
  useEffect(() => {
    if (p === 0 || p >= 1) return
    const t = window.setTimeout(() => setP((x) => Math.min(1, x + 0.08)), 90)
    return () => window.clearTimeout(t)
  }, [p])
  return (
    <div className="absolute inset-0 z-[70] bg-black/40 flex flex-col justify-end anim-fade">
      <div className="bg-[#f6f3ec] rounded-t-[34px] p-6 pb-10 sheet-up text-black">
        <div className="flex justify-center -mt-3 mb-3"><span className="w-9 h-[5px] rounded-full bg-black/15" /></div>
        <div className="flex items-center gap-4">
          <img src="/memoria-urbana-logo.png" alt="" className="w-[76px] h-[76px] rounded-[18px] bg-white object-cover shadow" />
          <div className="flex-1"><div className="text-[19px] font-bold leading-tight">Memória Urbana Maceió</div><div className="text-[13.5px] text-black/55">Trilha cultural · Prefeitura de Maceió</div><div className="text-[12.5px] text-black/45 mt-0.5">Grátis · 6 MB · funciona em celulares simples</div></div>
        </div>
        <ul className="mt-5 space-y-2 text-[14px] text-black/70">
          <li className="flex gap-2"><Icon name="star" size={17} className="text-[#dda93f]" />Pontos e carimbos em cada placa</li>
          <li className="flex gap-2"><Icon name="scan" size={17} className="text-[#2c8585]" />Foto do monumento vale pontos extras</li>
          <li className="flex gap-2"><Icon name="cube" size={17} className="text-[#0b2f49]" />Realidade aumentada e 3D</li>
        </ul>
        <button onClick={() => (p >= 1 ? onDone() : p === 0 && setP(0.04))} className="mt-6 w-full h-[52px] rounded-[14px] bg-[#2c8585] text-white text-[17px] font-semibold relative overflow-hidden">
          {p > 0 && p < 1 && <span className="absolute inset-y-0 left-0 bg-white/20" style={{ width: `${p * 100}%` }} />}
          <span className="relative">{p === 0 ? 'Instalar' : p < 1 ? `Instalando… ${Math.round(p * 100)}%` : 'Abrir'}</span>
        </button>
        <p className="mt-3 text-[12px] text-black/45 text-center">Simulação da loja de aplicativos</p>
      </div>
    </div>
  )
}

function HomeBar({ light, onHome }: { light: boolean; onHome: () => void }) {
  return (
    <button onClick={onHome} aria-label="Ir para a tela inicial" title="Tela inicial" className="absolute bottom-[6px] left-1/2 -translate-x-1/2 z-[95] w-[160px] h-[20px] grid place-items-center group">
      <span className={'block w-[134px] h-[5px] rounded-full transition-all group-active:w-[120px] ' + (light ? 'bg-white/85' : 'bg-black/80')} />
    </button>
  )
}

export function PhoneFlow({ stage, setStage, startId, user, setUser, dark, setDark, onTrack, onReport, session }: {
  stage: Stage; setStage: (s: Stage) => void; startId: string; user: User | null; setUser: (u: User | null) => void; dark: boolean; setDark: (v: boolean) => void
  onTrack: (e: NewEvent) => void; onReport: (r: Omit<Report, 'id' | 'at' | 'status'>) => void; session: string
}) {
  const [login, setLogin] = useState(false)
  const [via, setVia] = useState<'nfc' | 'qr'>('nfc')
  const m = byId(startId)
  if (stage === 'app') {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <MobileApp key={'app-' + startId} welcome={startId} welcomeVia={via} onTrack={onTrack} session={session} dark={dark} setDark={setDark} user={user} setUser={setUser} onReport={onReport} />
        <HomeBar light={dark} onHome={() => setStage('home')} />
      </div>
    )
  }
  return (
    <div className="relative w-full h-full overflow-hidden mu-mobile">
      {stage === 'home' && <Home plate={m.plate} name={m.name} onOpen={(via) => { setVia(via); onTrack({ type: via === 'nfc' ? 'nfc_read' : 'qr_scan', label: via === 'nfc' ? 'Tag NFC lida (notificação do sistema)' : 'QR lido pela câmera do celular', monument: startId, offline: false, identified: false }); setStage('web') }} />}
      {(stage === 'web' || stage === 'install') && <MobileWeb id={startId} user={user} onTrack={onTrack} onReport={onReport} onLogin={() => (user ? setStage('install') : setLogin(true))} />}
      {login && (
        <GoogleLogin reason={`Pontue em ${m.name} com sua conta Google`} onClose={() => setLogin(false)} onLogin={(u) => { setUser(u); setLogin(false); onTrack({ type: 'login', label: 'Login Google (OAuth) pela página web', offline: false, identified: true, synced: true }); setStage('install') }} />
      )}
      {stage === 'install' && <Install onDone={() => setStage('app')} />}
      <HomeBar light={stage === 'home'} onHome={() => { setLogin(false); setStage('home') }} />
    </div>
  )
}
