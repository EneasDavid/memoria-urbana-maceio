import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon, Group, Row, SectionTitle, Toggle, RarityPill, Stamp, Avatar, Segmented, GoogleG, Narrator, type IconName } from './ui'
import { monuments, byId, walkPath, quests, badges, levelFor, type Monument, type User, type TrackEvent } from './data'
import type { ScanMode } from './Scanner'
import type { LiveLocation } from './shared/useLocation'
import { createPortal } from 'react-dom'

export interface MobileCtx {
  user: User | null
  xp: number
  collected: string[]
  heard: string[]
  online: boolean
  offlinePack: boolean
  queue: number
  stampLog: Record<string, { at: number; last?: number; method: 'qr' | 'nfc' | 'gps' | 'placa' | 'grupo'; count: number; group?: string[]; by?: string }>
  photoLog: Record<string, { at: number; src?: string; front?: string }>
  setTab?: (t: string) => void
  openPhoto: (id: string) => void
  openCapture: (id: string) => void
  myReports: Record<string, { kind: string; note?: string; photo?: boolean; at: number }[]>
  share: (id: string) => void
  shareRoute: boolean
  openMonument: (id: string) => void
  openScanner: (mode: ScanMode, target?: string) => void
  pending: string[]
  arUsed: boolean
  dark: boolean
  setDark: (v: boolean) => void
  openLogin: (reason?: string) => void
  openImmersive: (id: string, mode: 'ar' | '3d') => void
  openReport: (id: string) => void
  photos: string[]
  openOffline: () => void
  setOnline: (v: boolean) => void
  setOfflinePack: (v: boolean) => void
  setShareRoute: (v: boolean) => void
  sync: () => void
  logout: () => void
  track: (type: TrackEvent['type'], label: string, monument?: string) => void
  collectGps: (id: string) => void
  markHeard: (id: string) => void
  /** false na área logada de verdade: some tudo que é simulação do protótipo (caminhada, amigos, rede, tag fictícia). */
  simulate?: boolean
  /** Data de hoje já escrita ("Quinta, 19 de novembro"); o protótipo usa a data fixa da apresentação. */
  today?: string
  /** Links reais da área logada (página de privacidade, painel da prefeitura). */
  links?: { privacy: string; panel?: string }
  /** Localização real do aparelho (área logada). Sem ela o mapa usa o ponto inicial da trilha. */
  location?: LiveLocation
}

const isSim = (ctx: MobileCtx) => ctx.simulate !== false

const UNIT_M = 5
const CATCH = 26

// Silhueta estilizada de escultura (placeholder até a foto com crédito/licença)
export function Figure({ hue, className = '' }: { hue: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`fg-${hue}`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0.55" /><stop offset="1" stopColor="#ffffff" stopOpacity="0.18" /></linearGradient>
      </defs>
      <g fill={`url(#fg-${hue})`}>
        <circle cx="60" cy="30" r="15" />
        <path d="M42 52c4-6 32-6 36 0l6 46c1 6-4 8-7 4l-4-28-2 78c0 6-9 6-9 0l-2-40-2 40c0 6-9 6-9 0l-2-78-4 28c-3 4-8 2-7-4z" />
      </g>
    </svg>
  )
}

function LevelRing({ xp, size = 46, user }: { xp: number; size?: number; user: User | null }) {
  const { level, inLevel, need } = levelFor(xp)
  const r = size / 2 - 3
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3.5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#dda93f" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - inLevel / need)} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-[5px] grid place-items-center">
        {user ? <Avatar name={user.name} color={user.color} size={size - 10} /> : <span className="w-full h-full rounded-full bg-black/[0.06] grid place-items-center text-black/40"><Icon name="person" size={size * 0.42} /></span>}
      </div>
      <span className="absolute -bottom-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-[#0b2f49] text-white text-[11px] font-bold grid place-items-center border-2 border-white">{level}</span>
    </div>
  )
}

function OfflineBanner({ ctx }: { ctx: MobileCtx }) {
  if (ctx.online) return null
  return (
    <button onClick={ctx.openOffline} className="w-full mt-3 flex items-center gap-3 rounded-[14px] bg-[#ff9f0a]/12 px-4 py-3 text-left">
      <Icon name="wifiOff" size={20} className="text-[#c46f00]" />
      <span className="flex-1 text-[14px] leading-snug text-black/75"><b className="font-semibold text-black">Sem internet.</b> {ctx.offlinePack ? 'Pacote offline ativo: histórias, mapa e tags funcionam.' : 'Baixe o pacote offline em Perfil.'}{ctx.queue > 0 && ` ${ctx.queue} na fila.`}</span>
      <Icon name="chevR" size={14} stroke={2.4} className="text-black/30" />
    </button>
  )
}

// Foto real (com crédito) ou ilustração enquanto a curadoria não fotografa
// Economia de dados: com "Economizar dados" ligado no celular, a foto só carrega com um toque.
const saveData = typeof navigator !== 'undefined' && !!(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData
export function Photo({ m, className = '', credit = false }: { m: Monument; className?: string; credit?: boolean }) {
  const [err, setErr] = useState(false)
  const [load, setLoad] = useState(!saveData)
  const pos = /\b(absolute|fixed)\b/.test(className) ? '' : 'relative ' // evita conflito relative × absolute
  if (m.photo && !err && !load) {
    return (
      <button onClick={(e) => { e.stopPropagation(); setLoad(true) }} className={`${pos}overflow-hidden grid place-items-center text-white/80 text-[12px] ${className}`} style={{ background: `linear-gradient(160deg, ${m.hue} 0%, #0b2f49 100%)` }}>
        <span className="flex items-center gap-1.5"><Icon name="download" size={14} />Ver foto</span>
      </button>
    )
  }
  if (m.photo && !err) {
    return (
      <div className={`${pos}overflow-hidden ${className}`}>
        <img src={m.photo.src} alt={`${m.name} — ${m.role}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setErr(true)} className="absolute inset-0 w-full h-full object-cover" />
        {credit && <span className="absolute right-2 bottom-2 text-[10px] text-white/85 bg-black/35 backdrop-blur px-1.5 py-0.5 rounded">Foto: {m.photo.credit}</span>}
      </div>
    )
  }
  return (
    <div className={`${pos}overflow-hidden ${className}`} style={{ background: `linear-gradient(160deg, ${m.hue} 0%, #0b2f49 100%)` }}>
      <Figure hue={m.hue} className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[85%]" />
      {credit && <span className="absolute left-2 bottom-2 text-[10px] text-white/70">[FOTO A PRODUZIR pela curadoria]</span>}
    </div>
  )
}

export function KindPill({ kind }: { kind: Monument['kind'] }) {
  const ic: IconName = kind === 'Praça' ? 'building' : kind === 'Busto' ? 'person' : 'estatua'
  return <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full bg-white/85 backdrop-blur text-black/70 text-[11px] font-bold uppercase tracking-[0.04em]"><Icon name={ic} size={11} stroke={2.4} />{kind}</span>
}

export function VisitBanner({ m }: { m: Monument }) {
  if (m.visit === 'Aberto') return null
  const closed = m.visit === 'Fechado'
  return (
    <div className={`mt-4 rounded-[16px] px-4 py-3 flex gap-3 ${closed ? 'bg-[#c4402e]/10' : 'bg-[#dda93f]/15'}`}>
      <Icon name={closed ? 'lock' : 'clock'} size={19} className={`shrink-0 mt-0.5 ${closed ? 'text-[#c4402e]' : 'text-[#8a6413]'}`} />
      <div><div className={`text-[14.5px] font-semibold ${closed ? 'text-[#a3321f]' : 'text-[#6b4d0d]'}`}>{closed ? 'Fechado para visitação' : 'Visitação restrita'}</div><div className="text-[13.5px] text-black/65 leading-snug mt-0.5">{m.visitNote}</div></div>
    </div>
  )
}

function MonumentCard({ m, ctx }: { m: Monument; ctx: MobileCtx }) {
  const got = ctx.collected.includes(m.id)
  const pend = ctx.pending.includes(m.id)
  return (
    <button onClick={() => ctx.openMonument(m.id)} className="snap-start shrink-0 w-[210px] rounded-[22px] overflow-hidden bg-white text-left active:scale-[0.98] transition">
      <div className="h-[150px] relative">
        <Photo m={m} className="absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute left-3 top-3"><KindPill kind={m.kind} /></span>
        {got && <span className="absolute right-3 top-3 w-7 h-7 rounded-full bg-[#34c759] text-white grid place-items-center"><Icon name="check" size={16} stroke={3} /></span>}
        {pend && !got && <span className="absolute right-3 top-3 h-7 px-2 rounded-full bg-[#ff9f0a] text-black text-[11px] font-bold grid place-items-center">reservado</span>}
        {m.visit !== 'Aberto' && <span className={`absolute left-3 bottom-3 h-6 px-2 rounded-full text-[11px] font-bold grid place-items-center ${m.visit === 'Fechado' ? 'bg-[#c4402e] text-white' : 'bg-[#dda93f] text-[#0b2f49]'}`}>{m.visit === 'Fechado' ? 'Fechado' : 'Restrito'}</span>}
      </div>
      <div className="p-3.5">
        <div className="text-[16px] font-semibold leading-tight text-black truncate">{m.name}</div>
        <div className="text-[13px] text-black/50 mt-0.5 truncate">{m.role} · {m.area}</div>
      </div>
    </button>
  )
}

// ================= EXPLORAR =================
export function ExploreScreen({ ctx }: { ctx: MobileCtx }) {
  const { level, inLevel, need } = levelFor(ctx.xp)
  const orla = monuments.filter((m) => m.group === 'orla')
  const centro = monuments.filter((m) => m.group === 'centro')
  const bebedouro = monuments.filter((m) => m.group === 'bebedouro')
  const alto = monuments.filter((m) => m.group === 'alto')
  return (
    <div className="px-4 pb-36">
      <div className="flex items-end justify-between pt-2">
        <div>
          <div className="text-[13px] font-semibold text-black/45 uppercase tracking-[0.04em]">{ctx.today ?? 'Sábado, 7 de novembro'}</div>
          <h1 className="text-[34px] font-bold tracking-[-0.025em] leading-tight text-black">Explorar</h1>
        </div>
        <button onClick={() => ctx.setTab?.('perfil')} aria-label="Abrir perfil" className="rounded-full active:scale-95 transition">{ctx.user ? <Avatar name={ctx.user.name} color={ctx.user.color} size={44} /> : <span className="w-11 h-11 rounded-full bg-black/5 grid place-items-center text-black/60"><Icon name="person" size={22} /></span>}</button>
      </div>

      <OfflineBanner ctx={ctx} />

      {/* Sem barreira */}
      {/* Cartão da trilha */}
      <div className="mt-4 rounded-[24px] p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(145deg,#0b2f49 0%,#14506a 55%,#2c8585 100%)' }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0 1px,transparent 1px 9px)' }} />
        <div className="relative text-[11.5px] font-bold tracking-[0.16em] text-[#dda93f]">PASSAPORTE CULTURAL · MACEIÓ</div>
        <div className="relative text-[22px] font-bold tracking-[-0.02em] leading-tight mt-1">{ctx.user ? (ctx.collected.length ? 'Sua memória da cidade' : 'Comece sua coleção') : 'Colecione a memória de Maceió'}</div>
        {ctx.user ? (
          <>
            {(() => {
              const order = ['montepio', 'pedro2', 'martirios', 'sinimbu', 'paulo', 'graciliano', 'emilio', 'aurelio', 'ledo', 'nise', 'farol', 'ufal', 'lucena', 'santoantonio', 'solarnunes']
              const recent = monuments.filter((m) => ctx.collected.includes(m.id)).sort((a, b) => (ctx.stampLog[b.id]?.last || ctx.stampLog[b.id]?.at || 0) - (ctx.stampLog[a.id]?.last || ctx.stampLog[a.id]?.at || 0)).slice(0, 4)
              const here = ctx.location?.here
              const open = (m?: Monument) => !!m && !ctx.collected.includes(m.id) && m.visit !== 'Fechado'
              // Com a localização real, o próximo selo é a obra aberta mais perto de você
              const next = here
                ? [...monuments].filter((m) => open(m)).sort((a, b) => meters(here, [a.lat, a.lng]) - meters(here, [b.lat, b.lng]))[0]
                : order.map((id) => monuments.find((m) => m.id === id)).find((m) => open(m))
              const nextDist = here && next ? meters(here, [next.lat, next.lng]) : null
              return (
                <>
                  <div className="relative mt-4 flex items-center">
                    {recent.length ? recent.map((m, k) => (
                      <span key={m.id} className={'rounded-full bg-[#fffdf8] p-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.25)] ' + (k ? '-ml-4' : '')} style={{ zIndex: 10 - k }}><Stamp label={stampClass(m)} sub={m.area} hue={m.hue} got method={ctx.stampLog[m.id]?.method} rotate={[-8, 6, -4, 9][k]} size={54} /></span>
                    )) : <span className="w-[58px] h-[58px] rounded-full border-2 border-dashed border-white/40 grid place-items-center text-white/70"><Icon name="qr" size={24} /></span>}
                    <div className="ml-3 leading-tight">
                      <div><b className="text-[22px] font-bold">{ctx.collected.length}</b> <span className="text-[13px] text-white/75">{ctx.collected.length === 1 ? 'selo' : 'selos'}</span></div>
                      <div className="text-[12.5px] text-white/70 flex items-center gap-1 mt-0.5">{ctx.xp} pontos{isSim(ctx) && <> · <Icon name="flame" size={13} className="text-[#ffb340]" />3 dias</>}</div>
                    </div>
                  </div>
                  {next && (
                    <button onClick={() => ctx.setTab?.('trilha')} className="relative mt-4 w-full flex items-center gap-2.5 rounded-[14px] bg-white/10 px-3 py-2.5 text-left">
                      <Icon name="pin" size={18} className="text-[#dda93f] shrink-0" />
                      <span className="flex-1 min-w-0"><span className="block text-[11.5px] text-white/60">{nextDist !== null ? 'Selo mais perto de você · ' + (nextDist >= 1000 ? (nextDist / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(nextDist / 10) * 10 + ' m') : 'Próximo selo na trilha'}</span><span className="block text-[14px] font-semibold truncate">{next.name} · {next.area}</span></span>
                      <Icon name="chevR" size={16} className="text-white/60" />
                    </button>
                  )}
                </>
              )
            })()}
          </>
        ) : (
          <>
            <ul className="mt-3 space-y-1.5 text-[13.5px] text-white/85">
              <li className="flex items-center gap-2"><Icon name="placa" size={15} className="text-[#dda93f]" />Pontos e carimbos em cada placa</li>
              <li className="flex items-center gap-2"><Icon name="cube" size={15} className="text-[#dda93f]" />Monumentos em 3D e realidade aumentada</li>
              <li className="flex items-center gap-2"><Icon name="book" size={15} className="text-[#dda93f]" />Passaporte cultural de Maceió</li>
            </ul>
            <button onClick={() => ctx.openLogin()} className="mt-4 w-full h-[46px] rounded-[13px] bg-white text-black text-[15px] font-semibold flex items-center justify-center gap-2.5"><GoogleG size={18} />Entrar com Google para participar</button>
            {ctx.pending.length > 0 && <div className="mt-2 text-[12px] text-white/70 text-center">{ctx.pending.length} carimbo(s) reservado(s) esperando você entrar</div>}
          </>
        )}
      </div>

      {/* Ler placa */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {([['qr', 'qr', 'QR Code', 'Pela câmera'], ['nfc', 'nfc', 'Tag NFC', 'Funciona offline']] as const).map(([mode, icon, t, s]) => (
          <button key={mode} onClick={() => ctx.openScanner(mode)} className="bg-white rounded-[20px] p-4 text-left active:scale-[0.98] transition">
            <span className={`w-11 h-11 rounded-[12px] grid place-items-center text-white ${mode === 'qr' ? 'bg-[#2c8585]' : 'bg-[#0b2f49]'}`}><Icon name={icon} size={23} stroke={2} /></span>
            <span className="block mt-3 text-[16px] font-semibold text-black">Ler {t}</span>
            <span className="block text-[13px] text-black/50">{s}</span>
          </button>
        ))}
      </div>

            {ctx.user && (
        <>
          <SectionTitle>Missões de hoje</SectionTitle>
          <Group>
            {quests.map((q, i) => {
              const p = q.id === 'q1' ? Math.min(q.total, ctx.collected.length) : q.id === 'q2' ? (ctx.heard.length > 0 ? 1 : 0) : ctx.arUsed ? 1 : 0
              const done = p >= q.total
              return (
                <div key={q.id} className={'flex items-center gap-3 pl-4 transition-opacity ' + (done ? 'opacity-40' : '')}>
                  <span className={`w-[30px] h-[30px] rounded-full grid place-items-center shrink-0 ${done ? 'bg-black/10 text-black/60' : 'bg-[#dda93f]/15 text-[#a87a17]'}`}><Icon name={done ? 'check' : 'bolt'} size={16} stroke={2.4} /></span>
                  <div className={`flex-1 py-3 pr-4 ${i < quests.length - 1 ? 'border-b border-[rgba(60,60,67,0.12)]' : ''}`}>
                    <div className="flex items-center justify-between gap-2"><span className="text-[15px] text-black">{q.title}</span><span className={'text-[13px] font-semibold ' + (done ? 'text-black/50' : 'text-[#a87a17]')}>{done ? 'Feita' : '+' + q.xp + ' XP'}</span></div>
                    <div className="mt-1.5 h-[4px] rounded-full bg-black/[0.07] overflow-hidden"><div className="h-full rounded-full bg-[#dda93f]" style={{ width: `${(p / q.total) * 100}%` }} /></div>
                  </div>
                </div>
              )
            })}
          </Group>
        </>
      )}

          </div>
  )
}

// ================= MONUMENTO =================
export function MonumentScreen({ id, ctx, onBack }: { id: string; ctx: MobileCtx; onBack: () => void }) {
  const m = byId(id)
  const [mode, setMode] = useState<'ler' | 'ouvir' | 'desc'>('ler')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const got = ctx.collected.includes(m.id)
  const pend = ctx.pending.includes(m.id)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    ctx.track('open_story', 'História aberta', m.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.id])

  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => setProgress((p) => {
      if (p >= 1) { setPlaying(false); ctx.markHeard(m.id); return 1 }
      return p + 0.012
    }), 120)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  const changeMode = (v: typeof mode) => {
    setMode(v)
    if (v === 'desc') ctx.track('audiodesc', 'Audiodescrição aberta', m.id)
  }
  const togglePlay = () => {
    if (!playing) ctx.track('audio_play', 'Áudio iniciado', m.id)
    if (progress >= 1) setProgress(0)
    setPlaying(!playing)
  }
  const immersive = (mode: 'ar' | '3d') => {
    if (!ctx.user) return ctx.openLogin(mode === 'ar' ? 'Entre para ver em realidade aumentada' : 'Entre para ver em 3D')
    ctx.openImmersive(m.id, mode)
  }
  const total = 168
  const secs = Math.round(progress * total)
  const t = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="absolute inset-0 z-30 bg-[#f6f3ec] push-in">
      {/* barra de navegação */}
      <div className={`absolute top-0 left-0 right-0 z-20 pt-[54px] pb-2 px-3 flex items-center justify-between transition-all duration-300 ${scrolled ? 'bg-[#f6f3ec]/80 backdrop-blur-2xl border-b border-black/[0.08]' : ''}`}>
        <button onClick={onBack} className={`h-9 pl-1.5 pr-3 rounded-full flex items-center gap-0.5 text-[17px] ${scrolled ? 'text-[#2c8585]' : 'bg-black/30 backdrop-blur-xl text-white'}`}><Icon name="chevL" size={22} stroke={2.6} />Voltar</button>
        <span className={`text-[16px] font-semibold text-black transition-opacity truncate max-w-[180px] ${scrolled ? 'opacity-100' : 'opacity-0'}`}>{m.name}</span>
        <button aria-label="Compartilhar" onClick={() => ctx.share(m.id)} className={`w-9 h-9 rounded-full grid place-items-center ${scrolled ? 'text-[#2c8585]' : 'bg-black/30 backdrop-blur-xl text-white'}`}><Icon name="share" size={19} stroke={2.2} /></button>
      </div>

      <div onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 250)} className="absolute inset-0 overflow-y-auto no-scrollbar pb-36">
        {/* hero com foto real */}
        <div className="relative h-[420px] overflow-hidden">
          <Photo m={m} className="absolute inset-0" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[220px]" style={{ background: 'linear-gradient(180deg, transparent, rgba(5,20,32,0.9))' }} />
          <div className="absolute left-5 right-5 bottom-5 text-white">
            <div className="flex items-center gap-2 mb-2"><KindPill kind={m.kind} /><span className="text-[12px] font-semibold tracking-[0.1em] text-white/75">PLACA {m.plate} · {m.area.toUpperCase()}</span></div>
            <h1 className="text-[32px] font-bold tracking-[-0.025em] leading-[1.05]">{m.name}</h1>
            <div className="text-[16px] text-white/80 mt-1">{m.role} · {m.years}</div>
            <div className="mt-1.5 text-[10.5px] text-white/55">{m.photo ? `Foto: ${m.photo.credit}` : '[FOTO A PRODUZIR pela curadoria · crédito e licença]'}</div>
          </div>
        </div>

        <div className="px-4">
          <VisitBanner m={m} />
          {/* acesso livre + convite opcional */}
          {!ctx.user ? (
            <div className="mt-4 bg-white rounded-[18px] p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1f7a38]"><Icon name="check" size={16} stroke={2.6} />Página aberta — sem app e sem cadastro</div>
              <p className="mt-1 text-[13.5px] text-black/60 leading-snug">Quer mais? Entrando com Google você {pend ? 'guarda o carimbo reservado desta placa' : 'ganha o carimbo desta placa'} (+{m.xp} XP) e libera 3D e realidade aumentada.</p>
              <button onClick={() => ctx.openLogin()} className="mt-3 w-full h-[44px] rounded-[12px] bg-[#f6f3ec] text-black text-[15px] font-semibold flex items-center justify-center gap-2"><GoogleG size={17} />Entrar com Google (opcional)</button>
            </div>
          ) : (
            <div className="mt-4 bg-white rounded-[18px] p-4 flex items-center gap-3">
              {got ? (
                <><Stamp label={m.name.split(' ')[m.kind === 'Praça' ? 1 : 0] ?? m.name} sub={m.area} hue={m.hue} got rotate={-10} size={54} /><div className="flex-1"><div className="text-[15px] font-semibold text-black">Carimbo coletado</div><div className="text-[13px] text-black/50">No seu passaporte · +{m.xp} XP</div></div></>
              ) : (
                <><span className="w-[54px] h-[54px] rounded-full border-2 border-dashed border-black/15 grid place-items-center text-black/30"><Icon name="lock" size={22} /></span><div className="flex-1"><div className="text-[15px] font-semibold text-black">Colete este carimbo</div><div className="text-[13px] text-black/50">Leia a placa no local · +{m.xp} XP</div></div>
                  <div className="flex gap-1.5"><button onClick={() => ctx.openScanner('qr', m.id)} aria-label="Ler QR" className="w-10 h-10 rounded-full bg-[#2c8585] text-white grid place-items-center"><Icon name="qr" size={19} /></button><button onClick={() => ctx.openScanner('nfc', m.id)} aria-label="Ler NFC" className="w-10 h-10 rounded-full bg-[#0b2f49] text-white grid place-items-center"><Icon name="nfc" size={19} /></button></div></>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-center">
            <Segmented value={mode === 'desc' ? 'desc' : 'ler'} onChange={changeMode} options={[{ value: 'ler', label: 'Bio' }, { value: 'desc', label: 'Audiodescrição' }]} />
          </div>
          {mode === 'desc'
            ? <Narrator key={'desc-' + m.id} text={m.id === 'graciliano' ? 'Estátua de bronze em tamanho real. O escritor está de pé, de terno, com o corpo levemente inclinado, como quem caminha pelo calçadão. Fica no nível do pedestre, sem pedestal alto, com o mar de Pajuçara ao fundo.' : m.id === 'nise' ? 'Escultura de bronze em tamanho real. Nise está sentada, com um gato no colo, num banco ao nível do chão, cercada por palmeiras do Corredor Vera Arruda.' : '[AUDIODESCRIÇÃO escrita pela curadoria: posição, material, tamanho, gestos e entorno da obra.]'} title="Audiodescrição" subtitle="Áudio que descreve a obra · com legenda" autoPlay onStart={() => ctx.track('audiodesc', 'Audiodescrição ouvida', m.id)} onEnd={() => ctx.markHeard(m.id)} />
            : <Narrator key={'ler-' + m.id} text={m.summary} extra={m.facts.map(([k, v]) => k + ': ' + v.replace(/ · /g, ', ') + '.').join(' ')} title="Ouvir a história" subtitle={'Leia ou toque para ouvir · ' + (ctx.offlinePack ? 'disponível offline' : 'streaming')} onStart={() => ctx.track('audio_play', 'Narração iniciada', m.id)} onEnd={() => ctx.markHeard(m.id)} />}

          {/* imersivo (recomendado com login) */}
          <SectionTitle action={!ctx.user ? <span className="text-[12px] font-semibold text-black/45 flex items-center gap-1"><Icon name="lock" size={12} />com login</span> : undefined}>Experiência imersiva</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {([['ar', 'scan', 'Realidade aumentada', 'Informações sobre a obra na câmera'], ['3d', 'cube', 'Ver em 3D', 'Gire e aproxime']] as const).map(([k, ic, t, d]) => (
              <button key={k} onClick={() => immersive(k)} className="relative rounded-[20px] overflow-hidden text-left text-white h-[150px] active:scale-[0.98] transition">
                <Photo m={m} className="absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b2f49]/95 via-[#0b2f49]/50 to-[#0b2f49]/10" />
                <span className="absolute top-3 left-3 w-9 h-9 rounded-[10px] bg-white/20 backdrop-blur-xl grid place-items-center"><Icon name={ic} size={19} /></span>
                {!ctx.user && <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 backdrop-blur grid place-items-center"><Icon name="lock" size={14} /></span>}
                <span className="absolute left-3 right-3 bottom-3"><span className="block text-[15px] font-semibold leading-tight">{t}</span><span className="block text-[12px] text-white/70">{d}</span></span>
              </button>
            ))}
          </div>
          {ctx.user && m.visit !== 'Fechado' && (
            ctx.photos.includes(m.id)
              ? <SentPhoto m={m} ctx={ctx} />
              : <button onClick={() => ctx.openCapture(m.id)} className="mt-3 w-full h-[50px] rounded-[14px] bg-[#0b2f49] text-white text-[15px] font-semibold flex items-center justify-center gap-2"><Icon name="scan" size={18} />Tirar foto do monumento · +50 XP</button>
          )}

          {m.quote && (
            <div className="mt-6 rounded-[22px] p-5 bg-[#0b2f49] text-white">
              <div className="text-[40px] leading-none text-[#dda93f] font-serif">“</div>
              <p className="text-[19px] leading-snug font-medium -mt-2">{m.quote}</p>
              <div className="mt-3 text-[13px] text-white/55">— {m.name}</div>
            </div>
          )}

          {/* convite ao museu: sempre presente, sem login */}
          <div className="mb-3 rounded-[20px] bg-white p-4">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-[#2c8585]">Continue a história no museu</div>
            <div className="mt-1 text-[17px] font-semibold text-black">{m.museum.name}</div>
            <div className="mt-1 flex items-start gap-1.5 text-[14px] text-black/60"><Icon name="pin" size={15} />{m.museum.address}</div>
            {m.museum.hours && <div className="mt-1 text-[13px] text-black/50">{m.museum.hours}</div>}
            <p className="mt-2 text-[14px] leading-snug text-black/75">{m.museum.why}</p>
            <div className="mt-2 text-[12px] text-black/40">Aberto a todos, sem login.</div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(m.museum.name + ', ' + m.museum.address + ', Maceió'), '_blank')} className="h-[50px] rounded-[14px] bg-white text-[#2c8585] text-[15px] font-semibold flex items-center justify-center gap-2"><Icon name="route" size={18} />Como chegar</button>
            <button onClick={() => ctx.openReport(m.id)} className="h-[50px] rounded-[14px] bg-white text-[#c4402e] text-[15px] font-semibold flex items-center justify-center gap-2"><Icon name="flag" size={18} />Relatar problema</button>
          </div>

          <details className="mt-3 group">
            <summary className="list-none cursor-pointer select-none flex items-center justify-between h-[50px] px-4 rounded-[14px] bg-white text-[15px] font-semibold text-black">Ficha, obras e fontes<span className="text-[13px] font-medium text-black/40 group-open:hidden">Ver</span><span className="text-[13px] font-medium text-black/40 hidden group-open:inline">Fechar</span></summary>
          <SectionTitle>Ficha</SectionTitle>
          <Group>
            {m.facts.map(([k, v], i) => (
              <div key={k} className={`flex gap-3 px-4 py-3 ${i < m.facts.length - 1 ? 'border-b border-[rgba(60,60,67,0.12)]' : ''}`}>
                <span className="w-[112px] shrink-0 text-[14px] text-black/50">{k}</span>
                <span className="flex-1 text-[15px] text-black leading-snug">{v}</span>
              </div>
            ))}
            <div className="flex gap-3 px-4 py-3 border-t border-[rgba(60,60,67,0.12)]">
              <span className="w-[112px] shrink-0 text-[14px] text-black/50">Endereço</span>
              <span className="flex-1 text-[15px] text-black leading-snug">{m.address}</span>
            </div>
          </Group>

          {m.works && (
            <>
              <SectionTitle>Obras para conhecer</SectionTitle>
              <div className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar">
                {m.works.map((w, i) => (
                  <div key={w} className="shrink-0 w-[112px] h-[152px] rounded-[10px] shadow-[0_8px_20px_rgba(0,0,0,0.12)] p-3 flex flex-col justify-end text-white" style={{ background: ['#8a4b2a', '#2f5f73', '#4b3b63', '#3f5a3a', '#7a6a2a'][i % 5] }}>
                    <span className="text-[14px] font-semibold leading-tight">{w}</span>
                  </div>
                ))}
              </div>
              {m.id === 'graciliano' && <div className="mt-3 rounded-[16px] bg-[#dda93f]/12 px-4 py-3 text-[14px] text-[#6b4d0d] flex gap-2.5"><Icon name="sparkles" size={18} className="shrink-0 mt-0.5" />Vidas Secas é uma das obras mais cobradas no Enem.</div>}
            </>
          )}

          <SectionTitle>Fontes</SectionTitle>
          <Group>
            {m.sources.map((s, i) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className={`flex items-center gap-3 px-4 py-3 active:bg-black/5 ${i < m.sources.length - 1 ? 'border-b border-[rgba(60,60,67,0.12)]' : ''}`}>
                <span className="flex-1 text-[14px] text-[#2c8585] leading-snug">{s.label}</span>
                <Icon name="arrowUR" size={14} className="text-black/30 shrink-0" />
              </a>
            ))}
          </Group>

          <div className="mt-6 px-1 text-[12px] text-black/45 leading-relaxed">
            <div className="font-semibold uppercase tracking-[0.06em] text-black/55">Conteúdo revisado por</div>
            [NOME DO REVISOR] · [INSTITUIÇÃO DE MEMÓRIA] · Revisão em [DATA]
            <div className="mt-3 flex gap-2"><Icon name="shield" size={15} className="shrink-0 text-black/40" />Esta página não coleta dados pessoais. Cada leitura da placa é contada de forma anônima.</div>
          </div>
          </details>
        </div>
      </div>
    </div>
  )
}

// ================= MAPA / TRILHA =================
const shore: [number, number][] = [[60, 830], [95, 620], [150, 470], [200, 400], [250, 330], [300, 250], [345, 175], [400, 110], [430, 70]]

// Mapa real de Maceió (OpenStreetMap/CARTO) com projeção Web Mercator, arrastar e zoom
const TILE = 256
const project = (lat: number, lng: number, z: number): [number, number] => {
  const n = TILE * 2 ** z, r = (lat * Math.PI) / 180
  return [((lng + 180) / 360) * n, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n]
}
const unproject = (x: number, y: number, z: number): [number, number] => {
  const n = TILE * 2 ** z
  return [(Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI, (x / n) * 360 - 180]
}
const meters = (a: [number, number], b: [number, number]) => {
  const R = 6371000, dLa = ((b[0] - a[0]) * Math.PI) / 180, dLo = ((b[1] - a[1]) * Math.PI) / 180
  const h = Math.sin(dLa / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLo / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
const CATCH_M = 60
// trajeto sugerido: Centro → orla de Pajuçara → Ponta Verde → Jatiúca
const ROUTE: [number, number][] = [[-9.6651, -35.7386], [-9.6669, -35.737], [-9.6658, -35.7352], [-9.6688, -35.7326], [-9.6694, -35.726], [-9.6684, -35.7185], [-9.6672, -35.7148], [-9.6668, -35.7122], [-9.6648, -35.7058], [-9.661, -35.7005], [-9.6632, -35.6977], [-9.6565, -35.6985], [-9.6478, -35.699], [-9.6487, -35.7033]]

export function MapScreen({ ctx }: { ctx: MobileCtx }) {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 390, h: 844 })
  const [z, setZ] = useState(15)
  const [center, setCenter] = useState<[number, number]>(ROUTE[0])
  const [pos, setPos] = useState<[number, number]>(ROUTE[0])
  const [walking, setWalking] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const live = ctx.location
  const [geoLocal, setGeo] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle')
  const geo = live ? ({ ok: 'ok', asking: 'loading', denied: 'denied', unavailable: live.here ? 'ok' : 'loading', idle: 'idle' } as const)[live.status] : geoLocal
  const [askGeo, setAskGeo] = useState(true)
  // Segue a localização real enquanto não está simulando a caminhada; centraliza na primeira leitura
  const followed = useRef(false)
  const following = useRef(true)
  useEffect(() => { live?.resume(); return () => live?.stop() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!live?.here || walking) return
    setPos(live.here)
    // acompanha a pessoa andando até ela arrastar o mapa; "Centralizar em você" volta a acompanhar
    if (!followed.current || following.current) { followed.current = true; setCenter(live.here) }
  }, [live?.here, walking]) // eslint-disable-line react-hooks/exhaustive-deps
  const locate = () => {
    if (live) { setWalking(false); live.start(); if (live.here) { setPos(live.here); setCenter(live.here) } return }
    if (typeof navigator === 'undefined' || !navigator.geolocation) return setGeo('denied')
    setGeo('loading')
    navigator.geolocation.getCurrentPosition(
      (p) => { const here: [number, number] = [p.coords.latitude, p.coords.longitude]; setWalking(false); setPos(here); setCenter(here); setGeo('ok') },
      () => setGeo('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }
  const seg = useRef({ i: 0, t: 0 })
  const drag = useRef<{ x: number; y: number; c: [number, number] } | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth || 390, h: el.clientHeight || 844 })
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [])

  useEffect(() => {
    if (!walking) return
    const id = window.setInterval(() => {
      const st = seg.current
      const A0 = ROUTE[st.i], B0 = ROUTE[st.i + 1]
      if (!B0) { setWalking(false); return }
      st.t += 7 / Math.max(1, meters(A0, B0))
      if (st.t >= 1) { st.i += 1; st.t = 0 }
      const A = ROUTE[st.i], B = ROUTE[st.i + 1] ?? A
      const p: [number, number] = [A[0] + (B[0] - A[0]) * st.t, A[1] + (B[1] - A[1]) * st.t]
      setPos(p)
      setCenter(p)
    }, 50)
    return () => window.clearInterval(id)
  }, [walking])

  const lift = 70
  const c = project(center[0], center[1], z)
  const off = { x: c[0] - size.w / 2, y: c[1] - (size.h / 2 - lift) }
  const toScreen = (lat: number, lng: number): [number, number] => { const p = project(lat, lng, z); return [p[0] - off.x, p[1] - off.y] }
  const tiles: { k: string; x: number; y: number; src: string }[] = []
  const nT = 2 ** z
  const style = ctx.dark ? 'dark' : 'street'
  for (let ty = Math.floor(off.y / TILE); ty <= Math.floor((off.y + size.h) / TILE); ty++) {
    for (let tx = Math.floor(off.x / TILE); tx <= Math.floor((off.x + size.w) / TILE); tx++) {
      if (ty < 0 || ty >= nT) continue
      const wx = ((tx % nT) + nT) % nT
      tiles.push({ k: style + z + '-' + tx + '-' + ty, x: tx * TILE - off.x, y: ty * TILE - off.y, src: 'https://server.arcgisonline.com/ArcGIS/rest/services/' + (ctx.dark ? 'Canvas/World_Dark_Gray_Base' : 'World_Street_Map') + '/MapServer/tile/' + z + '/' + ty + '/' + wx })
    }
  }

  const dist = (m: Monument) => meters(pos, [m.lat, m.lng])
  const nearest = useMemo(() => [...monuments].sort((x, y) => dist(x) - dist(y))[0], [pos]) // eslint-disable-line react-hooks/exhaustive-deps
  const focus = byId(selected ?? nearest.id)
  const d = dist(focus)
  const sim = isSim(ctx)
  const located = sim || geo === 'ok'
  const near = located && d < CATCH_M
  const got = ctx.collected.includes(focus.id)
  const go = (mode: 'transit' | 'walking', dest: string) => {
    const url = 'https://www.google.com/maps/dir/?api=1&origin=' + pos[0] + ',' + pos[1] + '&destination=' + encodeURIComponent(dest) + '&travelmode=' + mode
    window.open(url, '_blank')
  }
  const restart = () => { seg.current = { i: 0, t: 0 }; setPos(ROUTE[0]); setWalking(true) }
  const zoomBy = (dz: number) => setZ((v) => Math.max(12, Math.min(17, v + dz)))
  const route = ROUTE.map(([la, lo]) => toScreen(la, lo).join(',')).join(' ')
  const me = toScreen(pos[0], pos[1])
  const mPerPx = (156543.03 * Math.cos((pos[0] * Math.PI) / 180)) / 2 ** z

  const onDown = (e: { target: EventTarget; clientX: number; clientY: number; pointerId: number; currentTarget: EventTarget }) => {
    if ((e.target as HTMLElement).closest('button')) return
    drag.current = { x: e.clientX, y: e.clientY, c: center }
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* sem captura */ }
  }
  const onMove = (e: { clientX: number; clientY: number }) => {
    const g = drag.current
    if (!g) return
    if (walking) setWalking(false)
    following.current = false
    const p0 = project(g.c[0], g.c[1], z)
    setCenter(unproject(p0[0] - (e.clientX - g.x), p0[1] - (e.clientY - g.y), z))
  }
  const onUp = () => { drag.current = null }

  return (
    <div ref={box} className="absolute inset-0 bg-[#e8e4da] overflow-hidden touch-none select-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onDoubleClick={(e) => { if (!(e.target as HTMLElement).closest('button')) zoomBy(1) }}>
      <div className="absolute inset-0" aria-hidden>
        {tiles.map((t) => <img key={t.k} src={t.src} alt="" draggable={false} className="absolute max-w-none" style={{ left: t.x, top: t.y, width: TILE, height: TILE, filter: ctx.dark ? 'none' : 'saturate(0.9)' }} />)}
        {ctx.dark && tiles.map((t) => <img key={'r' + t.k} src={t.src.replace('World_Dark_Gray_Base', 'World_Dark_Gray_Reference')} alt="" draggable={false} className="absolute max-w-none" style={{ left: t.x, top: t.y, width: TILE, height: TILE, filter: 'none' }} />)}
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <polyline points={route} fill="none" stroke="#2c8585" strokeOpacity="0.6" strokeWidth="5" strokeDasharray="1 10" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={me[0]} cy={me[1]} r={Math.max(10, CATCH_M / mPerPx)} fill="#2c8585" fillOpacity="0.1" stroke="#2c8585" strokeOpacity="0.35" />
        {live?.accuracy && geo === 'ok' && !walking && live.accuracy / mPerPx > 14 && <circle cx={me[0]} cy={me[1]} r={live.accuracy / mPerPx} fill="#0b2f49" fillOpacity="0.06" stroke="#0b2f49" strokeOpacity="0.25" strokeDasharray="3 4" />}
      </svg>
      {monuments.map((m) => {
        const [x, y] = toScreen(m.lat, m.lng)
        if (x < -40 || y < -60 || x > size.w + 40 || y > size.h + 60) return null
        const g = ctx.collected.includes(m.id)
        const isNear = located && dist(m) < CATCH_M
        const ring = m.rarity === 'Lendário' ? '#dda93f' : m.rarity === 'Raro' ? '#2c8585' : '#8e8e93'
        const sel = (selected ?? nearest.id) === m.id
        return (
          <button key={m.id} onClick={() => setSelected(m.id)} aria-label={m.name} className={'absolute -translate-x-1/2 -translate-y-full ' + (sel ? 'z-20' : 'z-10')} style={{ left: x, top: y }}>
            <span className="relative block">
              {isNear && !g && <span className="absolute left-1/2 top-[16px] -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full map-pulse" style={{ background: ring, opacity: 0.35 }} />}
              {g ? <span className="relative block rounded-full bg-white/95 p-[2px] shadow-[0_3px_8px_rgba(0,0,0,0.3)]"><Stamp label={stampClass(m)} sub={m.area} hue={m.hue} got method={ctx.stampLog[m.id]?.method} rotate={-8} size={46} /></span> : <svg width="34" height="44" viewBox="0 0 34 44" className="relative drop-shadow-[0_3px_4px_rgba(0,0,0,0.28)]"><path d="M17 42S3 27 3 16.5a14 14 0 1 1 28 0C31 27 17 42 17 42z" fill={g ? m.hue : '#ffffff'} stroke={ring} strokeWidth="2.6" /><circle cx="17" cy="16.5" r="6.5" fill={g ? '#ffffff' : m.hue} />{g && <path d="m13.6 16.6 2.4 2.4 4.4-4.8" fill="none" stroke={m.hue} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}</svg>}
              {m.visit !== 'Aberto' && <span className="absolute -left-1 -top-1 w-[16px] h-[16px] rounded-full grid place-items-center text-white text-[10px] font-bold border-2 border-white" style={{ background: m.visit === 'Fechado' ? '#c4402e' : '#dda93f' }}>{m.visit === 'Fechado' ? '×' : '!'}</span>}
              {sel && <span className="absolute left-1/2 -top-7 -translate-x-1/2 whitespace-nowrap h-6 px-2 rounded-full bg-white text-[11.5px] font-semibold text-black shadow grid place-items-center">{m.name}</span>}
            </span>
          </button>
        )
      })}
      <div className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30" style={{ left: me[0], top: me[1] }}>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#2c8585]/25 map-pulse" />
        <span className="relative block w-[18px] h-[18px] rounded-full bg-[#2c8585] border-[3px] border-white shadow-md" />
      </div>

      {!selected && (
      <div className="absolute top-[56px] left-3 right-3 z-40 flex items-center gap-3 p-2.5 pr-4 rounded-[22px] bg-white/85 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <button onClick={() => ctx.setTab?.('perfil')} aria-label="Abrir perfil" className="rounded-full active:scale-95 transition">{ctx.user ? <Avatar name={ctx.user.name} color={ctx.user.color} size={40} /> : <span className="w-10 h-10 rounded-full bg-black/5 grid place-items-center text-black/60"><Icon name="person" size={20} /></span>}</button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-black truncate">Trilha Cultural · Maceió</div>
          <div className="text-[12.5px] text-black/50">{ctx.collected.length} {ctx.collected.length === 1 ? 'selo' : 'selos'} · {ctx.xp} pontos</div>
        </div>
      </div>
      )}
      <div className="absolute left-3 top-[122px] z-40 text-[9.5px] text-black/60 bg-white/75 rounded-[6px] px-1.5 py-0.5">Mapa: Esri, HERE, OpenStreetMap</div>
      {!ctx.online && <div className="absolute top-[124px] left-1/2 -translate-x-1/2 z-40 h-7 px-3 rounded-full bg-[#ff9f0a] text-black text-[12px] font-semibold flex items-center gap-1.5 shadow"><Icon name="wifiOff" size={13} stroke={2.2} />Mapa offline</div>}

      {!selected && (
      <div className="absolute right-3 top-[132px] z-40 flex flex-col rounded-[14px] bg-white/90 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.1)] overflow-hidden">
        <button onClick={() => zoomBy(1)} aria-label="Aproximar" className="w-11 h-11 grid place-items-center text-black/70"><Icon name="plus" size={20} /></button>
        <span className="h-px bg-black/10" />
        <button onClick={() => zoomBy(-1)} aria-label="Afastar" className="w-11 h-11 grid place-items-center text-black/70 text-[24px] leading-none">−</button>
        <span className="h-px bg-black/10" />
        {sim ? (
          <button onClick={() => (walking ? setWalking(false) : seg.current.i >= ROUTE.length - 1 ? restart() : setWalking(true))} aria-label="Simular caminhada" className={'w-11 h-11 grid place-items-center ' + (walking ? 'text-[#2c8585]' : 'text-black/70')}><Icon name={walking ? 'pause' : 'walk'} size={20} /></button>
        ) : (
          <button onClick={locate} aria-label="Usar minha localização" className={'w-11 h-11 grid place-items-center ' + (geo === 'ok' ? 'text-[#2c8585]' : 'text-black/70')}><Icon name="pin" size={20} /></button>
        )}
        <span className="h-px bg-black/10" />
        <button onClick={() => { setSelected(null); setCenter(pos); following.current = true }} aria-label="Centralizar em você" className="w-11 h-11 grid place-items-center text-[#2c8585]"><Icon name="arrowUR" size={18} className="rotate-[-45deg]" /></button>
      </div>
      )}
      {live && geo === 'idle' && askGeo && !selected && (
        <div role="dialog" aria-labelledby="aviso-localizacao-titulo" data-testid="aviso-localizacao" className="absolute left-3 right-3 top-[132px] z-50 rounded-[24px] bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sheet-up">
          <span className="w-11 h-11 rounded-[12px] bg-[#2c8585] text-white grid place-items-center"><Icon name="pin" size={22} /></span>
          <h2 id="aviso-localizacao-titulo" className="mt-3 text-[18px] font-bold leading-tight text-black">Usar sua localização na Trilha</h2>
          <p className="mt-1.5 text-[14px] leading-snug text-black/70">Para mostrar onde você está, a distância até cada obra e liberar o check-in por GPS. Fica só no seu aparelho: não é gravada nem enviada, e para quando você sai da Trilha.</p>
          <button onClick={() => { setAskGeo(false); locate() }} className="mt-4 w-full h-[48px] rounded-[14px] bg-[#2c8585] text-white text-[16px] font-semibold">Permitir localização</button>
          <button onClick={() => setAskGeo(false)} className="mt-1 w-full h-[42px] text-[15px] font-semibold text-[#2c8585]">Agora não</button>
        </div>
      )}
      {!sim && !selected && geo !== 'ok' && !(live && geo === 'idle' && askGeo) && (
        <button onClick={locate} className="absolute left-1/2 -translate-x-1/2 top-[150px] z-40 h-9 px-4 rounded-full bg-[#2c8585] text-white text-[13px] font-semibold flex items-center gap-1.5 shadow-[0_6px_20px_rgba(44,133,133,0.4)] whitespace-nowrap"><Icon name="pin" size={16} />{geo === 'loading' ? 'Buscando você…' : geo === 'denied' ? 'Localização bloqueada · toque para tentar' : 'Mostrar onde estou'}</button>
      )}
      {sim && !selected && !walking && seg.current.i === 0 && seg.current.t === 0 && (
        <button onClick={() => setWalking(true)} className="absolute left-1/2 -translate-x-1/2 top-[150px] z-40 h-9 px-4 rounded-full bg-[#2c8585] text-white text-[13px] font-semibold flex items-center gap-1.5 shadow-[0_6px_20px_rgba(44,133,133,0.4)]"><Icon name="walk" size={16} />Simular caminhada</button>
      )}

      {!selected && (
        <div className="absolute left-3 right-3 bottom-[104px] z-40 rounded-[26px] bg-white/92 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.16)] p-4">
          <div className="flex items-center gap-3">
            <Photo m={focus} className="w-14 h-14 rounded-[16px] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[17px] font-semibold text-black truncate">{focus.name}</div>
              <div className="text-[13px] text-black/50 flex items-center gap-1.5"><RarityPill rarity={focus.rarity} /><span>{near ? 'Você está aqui' : !located ? 'Início da trilha' : d >= 1000 ? 'a ' + (d / 1000).toFixed(1).replace('.', ',') + ' km' : 'a ' + Math.round(d) + ' m'} · +{focus.xp} XP</span></div>
            </div>
            {got && <span className="w-8 h-8 rounded-full bg-[#34c759] text-white grid place-items-center"><Icon name="check" size={17} stroke={3} /></span>}
          </div>
          {focus.visit === 'Fechado' ? (
            <div className="mt-3"><div className="text-[13px] text-[#a3321f] font-semibold flex items-center gap-1.5"><Icon name="lock" size={14} />Fechado para visitação</div><button onClick={() => { setSelected(null); ctx.openMonument(focus.id) }} className="mt-2 w-full h-[44px] rounded-[13px] bg-black/[0.06] text-[15px] font-semibold text-black">Conhecer pela página e RA</button></div>
          ) : got ? (
            <button onClick={() => { setSelected(null); ctx.openMonument(focus.id) }} className="mt-3 w-full h-[46px] rounded-[13px] bg-black/[0.06] text-[15px] font-semibold text-black">Abrir história</button>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => { setSelected(null); ctx.openScanner('qr', focus.id) }} className="h-[46px] rounded-[13px] bg-[#2c8585] text-white text-[15px] font-semibold flex items-center justify-center gap-1.5"><Icon name="qr" size={18} />Ler QR</button>
                <button onClick={() => { setSelected(null); ctx.openScanner('nfc', focus.id) }} className="h-[46px] rounded-[13px] bg-[#0b2f49] text-white text-[15px] font-semibold flex items-center justify-center gap-1.5"><Icon name="nfc" size={18} />Tag NFC</button>
              </div>
              {near && (
              <button onClick={() => (ctx.user ? ctx.collectGps(focus.id) : ctx.openLogin('Entre para fazer check-in e pontuar'))} className="mt-1.5 w-full h-9 text-[13px] font-semibold text-[#2c8585]">Sem placa? Check-in por GPS (+{Math.round(focus.xp / 2)} XP)</button>
              )}
              <button onClick={() => setSelected(focus.id)} className="mt-2 w-full h-10 rounded-full bg-black/[0.05] text-[14px] font-semibold text-[#2c8585] flex items-center justify-center gap-1.5"><Icon name="route" size={16} />Como chegar e ver a história</button>
            </>
          )}
        </div>
      )}
      {/* ficha limpa: ao abrir um ponto, o resto da interface some */}
      {selected && (
        <div className="absolute left-3 right-3 bottom-[104px] z-40 max-h-[calc(100%-170px)] overflow-y-auto rounded-[26px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.2)] p-4">
          <div className="flex items-start gap-3">
            <Photo m={focus} className="w-16 h-16 rounded-[16px] shrink-0 overflow-hidden" />
            <div className="flex-1 min-w-0">
              <div className="text-[18px] font-bold leading-tight text-black">{focus.name}</div>
              <div className="mt-0.5 text-[13px] text-black/55">{near ? 'Você está aqui' : (d >= 1000 ? (d / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(d) + ' m') + ' · cerca de ' + Math.max(1, Math.round(d / 80)) + ' min a pé'}</div>
            </div>
            <button onClick={() => setSelected(null)} aria-label="Fechar" className="w-9 h-9 rounded-full bg-black/[0.06] flex items-center justify-center text-black/60 shrink-0"><Icon name="x" size={16} /></button>
          </div>
          {focus.visit === 'Fechado' && <div className="mt-3 text-[13px] text-[#a3321f] font-semibold flex items-center gap-1.5"><Icon name="lock" size={14} />Fechado para visitação</div>}

          <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-black/45">Como chegar</div>
          <button onClick={locate} className="mt-2 w-full h-11 rounded-[14px] bg-black/[0.04] px-3 text-[14px] font-semibold text-black/80 flex items-center gap-2"><Icon name="pin" size={16} />{geo === 'loading' ? 'Buscando sua localização…' : geo === 'ok' ? 'Usando sua localização atual' : geo === 'denied' ? 'Localização bloqueada · usando o ponto do mapa' : 'Usar minha localização atual'}</button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => go('transit', focus.lat + ',' + focus.lng)} className="h-11 rounded-[14px] text-[14px] font-semibold flex items-center justify-center gap-1.5 bg-[#0b2f49] text-white"><Icon name="route" size={17} />De ônibus</button>
            <button onClick={() => go('walking', focus.lat + ',' + focus.lng)} className="h-11 rounded-[14px] text-[14px] font-semibold flex items-center justify-center gap-1.5 bg-[#2c8585] text-white"><Icon name="walk" size={17} />A pé</button>
          </div>
          <div className="mt-1.5 text-[11px] text-black/40">Abre o trajeto no Google Maps a partir de onde você está, com linhas e horários de ônibus.</div>

          {!got && focus.visit !== 'Fechado' && (
            <>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-black/45">Chegou? Registre a visita</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => { setSelected(null); ctx.openScanner('qr', focus.id) }} className="h-11 rounded-[14px] text-[14px] font-semibold flex items-center justify-center gap-1.5 bg-black/[0.05] text-black/80"><Icon name="qr" size={17} />Ler QR</button>
                <button onClick={() => { setSelected(null); ctx.openScanner('nfc', focus.id) }} className="h-11 rounded-[14px] text-[14px] font-semibold flex items-center justify-center gap-1.5 bg-black/[0.05] text-black/80"><Icon name="nfc" size={17} />Tag NFC</button>
              </div>
              {near && <button onClick={() => (ctx.user ? ctx.collectGps(focus.id) : ctx.openLogin('Entre para fazer check-in e pontuar'))} className="mt-2 w-full h-10 rounded-full text-[13px] font-semibold text-[#2c8585]">Sem placa? Check-in por GPS (+{Math.round(focus.xp / 2)} XP)</button>}
            </>
          )}
          <button onClick={() => { setSelected(null); ctx.openMonument(focus.id) }} className="mt-3 w-full h-11 rounded-full border border-black/10 text-[14px] font-semibold text-black/80 flex items-center justify-center gap-1.5"><Icon name="book" size={16} />Ver a história</button>

          <div className="mt-3 rounded-[18px] bg-[#2c8585]/[0.08] p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2c8585]">Depois, continue no museu</div>
            <div className="mt-1 text-[15px] font-semibold text-black">{focus.museum.name}</div>
            <div className="text-[13px] text-black/55">{focus.museum.address}</div>
            <button onClick={() => go('transit', focus.museum.name + ', ' + focus.museum.address + ', Maceió')} className="mt-2 h-9 px-3 rounded-full bg-white text-[13px] font-semibold text-[#2c8585] inline-flex items-center gap-1.5"><Icon name="route" size={15} />Rota até o museu</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ================= PASSAPORTE =================
// Classe do selo (o tipo de lugar) — aparece no carimbo no lugar do nome
export const stampClass = (m: Monument) => {
  const n = (m.name + ' ' + (m.role || '')).toLowerCase()
  if (n.includes('igreja')) return 'Igreja'
  if (n.includes('solar') || n.includes('casar')) return 'Casarão'
  if (n.includes('farol')) return 'Farol'
  if (n.includes('ufal') || n.includes('campus')) return 'Universidade'
  if (n.includes('biblioteca')) return 'Biblioteca'
  if (n.includes('teatro')) return 'Teatro'
  if (n.includes('museu')) return 'Museu'
  return m.kind
}
const friendColor: Record<string, string> = { 'Jovem Werther': '#c4683a', 'Anna Karenina': '#4d6fb3', 'Gregor Samsa': '#5b8a3c' }
const viaShort = { qr: 'QR Code', nfc: 'NFC', gps: 'GPS', placa: 'Placa', grupo: 'Em grupo' } as const

export function PassportScreen({ ctx }: { ctx: MobileCtx }) {
  const [open, setOpen] = useState<string | null>(null)
  // só os selos conquistados, do mais recente para o mais antigo
  const got = monuments.filter((m) => ctx.collected.includes(m.id)).sort((a, b) => (ctx.stampLog[b.id]?.last || ctx.stampLog[b.id]?.at || 0) - (ctx.stampLog[a.id]?.last || ctx.stampLog[a.id]?.at || 0))
  const total = got.reduce((n, m) => n + (ctx.stampLog[m.id]?.count || 1), 0)
  return (
    <div className="px-4 pb-36">
      <div className="pt-2 flex items-center justify-between">
        <h1 className="text-[34px] font-bold tracking-[-0.025em] text-black">Passaporte</h1>
        <button onClick={() => ctx.setTab?.('perfil')} aria-label="Abrir perfil" className="rounded-full active:scale-95 transition">{ctx.user ? <Avatar name={ctx.user.name} color={ctx.user.color} size={44} /> : <span className="w-11 h-11 rounded-full bg-black/5 grid place-items-center text-black/60"><Icon name="person" size={22} /></span>}</button>
      </div>
      <div className="text-[14px] text-black/50 mt-0.5">{got.length ? 'Seus selos de Maceió · ' + got.length + (got.length === 1 ? ' selo' : ' selos') + ' · ' + total + (total === 1 ? ' visita' : ' visitas') : 'Seus selos de Maceió aparecem aqui'}</div>
      {got.length > 0 && <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-white px-3 py-2 text-[12.5px] text-black/55"><Icon name="hand" size={15} className="text-[#2c8585] shrink-0" />Toque num selo para ver quando foi, a foto e seus relatos.</div>}

      {got.length === 0 ? (
        <div className="mt-6 bg-white rounded-[22px] p-6 text-center">
          <div className="mx-auto w-20 h-20 rounded-full border-2 border-dashed border-black/15 grid place-items-center text-black/30"><Icon name="qr" size={30} /></div>
          <div className="mt-3 text-[17px] font-semibold text-black">Seu primeiro selo está numa placa</div>
          <div className="mt-1 text-[13.5px] text-black/55 leading-snug">Leia o QR ou encoste o celular na tag NFC de um monumento.</div>
          <button onClick={() => ctx.openScanner('qr')} className="mt-4 h-[44px] px-5 rounded-[13px] bg-[#0b2f49] text-white text-[15px] font-semibold">Ler placa</button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {got.map((m, i) => {
            const log = ctx.stampLog[m.id]
            const group = log?.group || []
            return (
              <button key={m.id} onClick={() => setOpen(m.id)} className="bg-white rounded-[22px] pt-5 pb-3 px-2 flex flex-col items-center text-center active:scale-[0.98] transition">
                <div className="stamp-in"><Stamp label={stampClass(m)} sub={m.area} hue={m.hue} got method={log?.method} count={log?.count || 1} rotate={[-9, 7, -4, 11, -12, 5, -6, 9][i % 8]} size={104} /></div>
                <div className="mt-2.5 text-[13.5px] font-semibold text-black leading-tight px-1">{stampClass(m)} · {m.area}</div>
                <div className="mt-0.5 text-[12px] text-black/45">{log ? viaShort[log.method] : 'Placa'} · {log?.count || 1}× {group.length > 0 ? '· em grupo' : ''}</div>
                {group.length > 0 && (
                  <div className="mt-1.5 flex -space-x-1.5">
                    <span className="ring-2 ring-white rounded-full"><Avatar name={ctx.user?.name || 'Você'} color={ctx.user?.color} size={20} /></span>
                    {group.map((g) => <span key={g} className="ring-2 ring-white rounded-full"><Avatar name={g} color={friendColor[g]} size={20} /></span>)}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
      {open && createPortal(<StampRecord id={open} ctx={ctx} onClose={() => setOpen(null)} />, (document.querySelector('.mu-mobile') as HTMLElement | null) ?? document.body)}
    </div>
  )
}

// Foto em tela cheia (toque na miniatura para trocar entre a obra e você)
function SentPhoto({ m, ctx }: { m: Monument; ctx: MobileCtx }) {
  return (
    <>
      <button onClick={() => ctx.openPhoto(m.id)} className="mt-3 w-full h-[50px] rounded-[14px] bg-[#34c759]/12 text-[#1f7a38] text-[15px] font-semibold flex items-center justify-center gap-2"><Icon name="check" size={18} stroke={2.4} />Foto enviada · ver foto</button>
    </>
  )
}

export function PhotoViewer({ m, photo, onClose }: { m: Monument; photo: { at: number; src?: string; front?: string }; onClose: () => void }) {
  const [swap, setSwap] = useState(false)
  const main = swap ? photo.front : photo.src
  const mini = swap ? photo.src : photo.front
  return (
    <div className="absolute inset-0 z-[66] bg-black text-white anim-fade" onClick={(e) => { e.stopPropagation(); onClose() }}>
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
        {main ? <img src={main} alt={'Foto de ' + m.name} className={'absolute inset-0 w-full h-full object-contain ' + (swap ? '-scale-x-100' : '')} /> : <Photo m={m} className="absolute inset-0" />}
        {(mini || photo.front || swap) && (
          <button onClick={() => setSwap(!swap)} aria-label="Trocar câmera" className="absolute left-4 top-[104px] w-[92px] h-[124px] rounded-[14px] overflow-hidden border-2 border-white shadow-lg bg-[#22323a]">
            {mini ? <img src={mini} alt="" className={'w-full h-full object-cover ' + (!swap ? '-scale-x-100' : '')} /> : <Photo m={m} className="w-full h-full" />}
          </button>
        )}
        <button onClick={onClose} aria-label="Fechar foto" className="absolute right-4 top-[56px] w-9 h-9 rounded-full bg-black/50 backdrop-blur-xl grid place-items-center"><Icon name="x" size={16} stroke={2.4} /></button>
        <div className="absolute left-0 right-0 bottom-0 px-5 pt-10 pb-10 bg-gradient-to-t from-black/80 to-transparent">
          <div className="text-[17px] font-semibold">{m.name}</div>
          <div className="text-[13px] text-white/70">Enviada em {when(photo.at)}</div>
        </div>
      </div>
    </div>
  )
}

const when = (at: number) => new Date(at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' às ' + new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const viaLabel = { qr: 'Lido pelo QR Code', nfc: 'Lido pela tag NFC', gps: 'Check-in por GPS', placa: 'Leitura da placa', grupo: 'Visita em grupo' } as const

// Registro do selo: classe, local, como foi lido, quantas vezes, com quem, a foto e os relatos
function StampRecord({ id, ctx, onClose }: { id: string; ctx: MobileCtx; onClose: () => void }) {
  const m = byId(id)
  const log = ctx.stampLog[id]
  const photo = ctx.photoLog[id]
  const reps = ctx.myReports[id] || []
  const group = log?.group || []
  const sec = 'mt-5 text-[12px] font-semibold uppercase tracking-[0.05em] text-black/45 px-1'
  return (
    <div className="absolute inset-0 z-[58] bg-black/40 anim-fade" onClick={onClose}>
      <div className="absolute left-0 right-0 bottom-0 max-h-[88%] overflow-y-auto no-scrollbar rounded-t-[28px] bg-[#f2f2f7] px-4 pt-3 pb-10" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => { (e.currentTarget as unknown as { _y?: number })._y = e.clientY }} onPointerUp={(e) => { const y0 = (e.currentTarget as unknown as { _y?: number })._y; if (y0 != null && e.clientY - y0 > 70 && e.currentTarget.scrollTop <= 0) onClose() }}>
        <button onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 w-9 h-9 rounded-full bg-black/[0.06] grid place-items-center text-black/60"><Icon name="x" size={16} /></button>
        <button onClick={onClose} aria-label="Arraste para baixo ou toque para fechar" className="block mx-auto w-10 h-1.5 rounded-full bg-black/15" />
        <div className="mt-4 flex flex-col items-center text-center">
          <Stamp label={stampClass(m)} sub={m.area} hue={m.hue} got method={log?.method} count={log?.count || 1} rotate={-8} size={132} />
          <div className="mt-3 text-[21px] font-bold text-black leading-tight">{stampClass(m)} · {m.area}</div>
          <div className="text-[13px] text-black/50">{m.name} · Placa {m.plate}</div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="bg-white rounded-[14px] py-2.5 text-center"><div className="text-[18px] font-bold text-black tabular-nums">{log?.count || 1}×</div><div className="text-[11.5px] text-black/50">frequência</div></div>
          <div className="bg-white rounded-[14px] py-2.5 text-center"><div className="text-[15px] font-bold text-black leading-[22px]">{log ? viaShort[log.method] : 'Placa'}</div><div className="text-[11.5px] text-black/50">leitura</div></div>
          <div className="bg-white rounded-[14px] py-2.5 text-center"><div className="text-[18px] font-bold text-black tabular-nums">{group.length + 1}</div><div className="text-[11.5px] text-black/50">{group.length ? 'pessoas' : 'pessoa'}</div></div>
        </div>

        <div className={sec}>Visitas</div>
        <div className="mt-2 bg-white rounded-[16px] divide-y divide-black/[0.06]">
          <div className="px-4 py-3"><div className="text-[15px] font-semibold text-black">Primeira: {log ? when(log.at) : '—'}</div><div className="text-[13px] text-black/50">{log ? viaLabel[log.method] : ''}</div>{log?.by && <div className="text-[13px] text-[#2c8585] font-medium mt-0.5">Registrada por {log.by} · você estava junto</div>}</div>
          {log?.last && <div className="px-4 py-3"><div className="text-[15px] font-semibold text-black">Última: {when(log.last)}</div></div>}
        </div>

        {group.length > 0 && (
          <>
            <div className={sec}>Visita em grupo</div>
            <div className="mt-2 bg-white rounded-[16px] p-4 flex items-center gap-3">
              <div className="flex -space-x-2">
                <span className="ring-2 ring-white rounded-full"><Avatar name={ctx.user?.name || 'Você'} color={ctx.user?.color} size={34} /></span>
                {group.map((g) => <span key={g} className="ring-2 ring-white rounded-full"><Avatar name={g} color={friendColor[g]} size={34} /></span>)}
              </div>
              <div className="flex-1 text-[14px] text-black/75 leading-snug">Você{group.length === 1 ? ' e ' : ', '}{group.map((g) => g.replace(/^Jovem /, '').split(' ')[0]).join(group.length > 1 ? ', ' : '')} visitaram juntos</div>
            </div>
          </>
        )}

        {photo && (
          <>
            <div className={sec}>Sua foto</div>
            <div className="mt-2 bg-white rounded-[16px] overflow-hidden">
              <button onClick={() => ctx.openPhoto(id)} aria-label="Abrir foto" className="relative block w-full h-[200px]">
                {photo.src ? <img src={photo.src} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <Photo m={m} className="absolute inset-0" />}
                {photo.front && <img src={photo.front} alt="" className="absolute left-3 top-3 w-[64px] h-[86px] object-cover rounded-[10px] border-2 border-white -scale-x-100" />}
              <span className="absolute right-3 bottom-3 h-7 px-2.5 rounded-full bg-black/55 backdrop-blur text-white text-[12px] font-semibold flex items-center gap-1"><Icon name="search" size={13} />Ver foto</span></button>
              <div className="px-4 py-2.5 text-[13px] text-black/55">Enviada em {when(photo.at)} · +50 XP</div>
            </div>
          </>
        )}

        {reps.length > 0 && (
          <>
            <div className={sec}>Seus relatos ({reps.length})</div>
            <div className="mt-2 bg-white rounded-[16px] divide-y divide-black/[0.06]">
              {reps.map((r, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2"><span className="text-[15px] font-semibold text-[#c4402e]">{r.kind}</span><span className="text-[12px] font-semibold text-[#c46f00] bg-[#ff9f0a]/12 rounded-full px-2 py-0.5">Enviado</span></div>
                  {r.note && <div className="text-[14px] text-black/75 mt-1">{r.note}</div>}
                  <div className="text-[12px] text-black/45 mt-1">{when(r.at)}{r.photo ? ' · com foto' : ''}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <button onClick={() => { onClose(); ctx.openMonument(id) }} className="mt-5 w-full h-[50px] rounded-[14px] bg-[#0b2f49] text-white text-[15px] font-semibold">Abrir história</button>
      </div>
    </div>
  )
}

// ================= PERFIL =================
export function ProfileScreen({ ctx }: { ctx: MobileCtx }) {
  const fotos = ctx.photos.length
  const relatos = Object.values(ctx.myReports).reduce((n, l) => n + l.length, 0)
  const Line = ({ icon, bg, title, sub, on, set, last }: { icon: IconName; bg: string; title: string; sub?: string; on: boolean; set: (v: boolean) => void; last?: boolean }) => (
    <div className="flex items-center gap-3 pl-4">
      <span className="w-[30px] h-[30px] rounded-[8px] grid place-items-center text-white shrink-0" style={{ background: bg }}><Icon name={icon} size={17} stroke={2} /></span>
      <div className={'flex-1 flex items-center gap-2 py-[11px] pr-4 ' + (last ? '' : 'border-b border-[rgba(60,60,67,0.12)]')}><span className="flex-1"><span className="block text-[16px] text-black">{title}</span>{sub && <span className="block text-[12.5px] text-black/50">{sub}</span>}</span><Toggle on={on} onChange={set} label={title} /></div>
    </div>
  )
  return (
    <div className="px-4 pb-36">
      <button onClick={() => ctx.setTab?.('explorar')} className="pt-1 -ml-1 h-9 flex items-center gap-0.5 text-[17px] text-[#2c8585]"><Icon name="chevL" size={22} stroke={2.6} />Voltar</button>
      <h1 className="text-[34px] font-bold tracking-[-0.025em] text-black">Perfil</h1>
      {ctx.user ? (
        <div className="mt-3 bg-white rounded-[20px] p-4">
          <div className="flex items-center gap-3">
            <Avatar name={ctx.user.name} color={ctx.user.color} size={56} />
            <div className="flex-1 min-w-0"><div className="text-[19px] font-bold text-black truncate">{ctx.user.name}</div><div className="text-[13px] text-black/50 flex items-center gap-1.5 truncate"><GoogleG size={13} />{ctx.user.email}</div></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {([[ctx.collected.length, 'selos'], [fotos, 'fotos'], [relatos, 'relatos']] as [number, string][]).map(([v, l]) => (
              <div key={l} className="rounded-[14px] bg-black/5 py-2.5 text-center"><div className="text-[20px] font-bold text-black tabular-nums">{v}</div><div className="text-[12px] text-black/50">{l}</div></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 bg-white rounded-[20px] p-4">
          <div className="text-[17px] font-semibold text-black">Explorando sem conta</div>
          <div className="text-[13px] text-black/50">Seus selos ficam só neste aparelho.</div>
          <button onClick={() => ctx.openLogin()} className="mt-3 w-full h-[46px] rounded-[13px] bg-white border border-black/12 flex items-center justify-center gap-2.5 text-[15px] font-semibold text-black"><GoogleG size={18} />Continuar com Google</button>
        </div>
      )}

      <SectionTitle>Preferências</SectionTitle>
      <Group>
        <Line icon="moon" bg="#5856d6" title="Modo noturno" on={ctx.dark} set={ctx.setDark} last={!isSim(ctx)} />
        {isSim(ctx) && <Line icon="download" bg="#34c759" title="Usar sem internet" sub="Textos, áudios e mapa · 18 MB" on={ctx.offlinePack} set={ctx.setOfflinePack} />}
        {isSim(ctx) && <Line icon="route" bg="#2c8585" title="Ajudar a prefeitura" sub="Compartilhar trajeto anônimo" on={ctx.shareRoute} set={ctx.setShareRoute} last />}
      </Group>
      {ctx.queue > 0 && <button onClick={ctx.sync} className="mt-2 w-full text-[13px] font-semibold text-[#2c8585]">{ctx.queue} leitura(s) aguardando internet · enviar agora</button>}

      <div className="mt-6"><Group>
        {ctx.links?.panel && <Row icon="chart" iconBg="#0b2f49" title="Painel da prefeitura" subtitle="Monumentos, relatos e visitas" onClick={() => { window.location.href = ctx.links!.panel! }} />}
        <Row icon="shield" iconBg="#8e8e93" title="Meus dados (LGPD)" subtitle={ctx.links ? 'Como pedir cópia ou exclusão' : 'Baixar ou excluir'} onClick={() => { if (ctx.links) window.location.href = ctx.links.privacy }} last={!ctx.user} />
        {ctx.user && <Row icon="person" iconBg="#ff3b30" title={<span className="text-[#ff3b30]">Sair da conta</span>} onClick={ctx.logout} last />}
      </Group></div>
      {isSim(ctx) && <button onClick={() => ctx.setOnline(!ctx.online)} className="mt-6 mx-auto block text-[11.5px] text-black/35">{ctx.online ? 'Teste do protótipo: simular sem internet' : 'Teste do protótipo: sem internet · tocar para voltar'}</button>}
    </div>
  )
}

// ================= ESTUDO OFFLINE =================
export function OfflineSheet({ onClose }: { onClose: () => void }) {
  const layers: [IconName, string, string, string][] = [
    ['nfc', '#0b2f49', 'Na tag', 'NTAG216 (888 bytes): link da placa + texto curto (nome, datas, resumo) + assinatura digital. Lida sem rede, com bateria só do celular.'],
    ['download', '#34c759', 'No navegador', 'O site guarda um pacote offline (service worker) no Wi-Fi: histórias, áudios comprimidos e o mapa da trilha. Nada para baixar na loja.'],
    ['sync', '#2c8585', 'Quando a rede voltar', 'Check-ins ficam numa fila assinada com data e hora; sobem sozinhos e entram no painel como “leitura offline”.'],
  ]
  const compat = [
    ['Android · Chrome', 'Lê a tag dentro do site (Web NFC)', 'Offline', '#34c759'],
    ['iPhone · Safari', 'Lê a tag e abre a página', 'Offline após 1ª visita', '#34c759'],
    ['iPhone · 1ª visita', 'Precisa de rede para abrir o site', 'Precisa rede', '#ff9f0a'],
    ['QR Code', 'Câmera nativa abre a página', 'Offline após 1ª visita', '#34c759'],
    ['Carimbo da trilha', 'Assinatura validada no aparelho', 'Offline', '#34c759'],
  ]
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/35 anim-fade" onClick={onClose}>
      <div className="bg-[#f6f3ec] rounded-t-[38px] max-h-[90%] overflow-y-auto sheet-up px-5 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#f6f3ec] pt-2 pb-2 flex justify-center z-10"><span className="w-9 h-[5px] rounded-full bg-black/15" /></div>
        <div className="flex items-center justify-between"><h2 className="text-[26px] font-bold tracking-[-0.02em] text-black">Tags sem internet</h2><button onClick={onClose} className="w-[30px] h-[30px] rounded-full bg-black/[0.07] grid place-items-center text-black/50"><Icon name="x" size={15} stroke={2.6} /></button></div>
        <p className="mt-1 text-[15px] text-black/60 leading-snug">NFC é lido por aproximação e não usa internet. O que precisa de rede é só o que vem depois — por isso o conteúdo é dividido em três camadas.</p>
        <div className="mt-4 space-y-2.5">
          {layers.map(([ic, bg, t, d], i) => (
            <div key={t} className="bg-white rounded-[18px] p-4 flex gap-3">
              <span className="w-10 h-10 rounded-[11px] grid place-items-center text-white shrink-0" style={{ background: bg }}><Icon name={ic} size={21} stroke={2} /></span>
              <div><div className="text-[13px] font-semibold text-black/40">CAMADA {i + 1}</div><div className="text-[16px] font-semibold text-black">{t}</div><div className="text-[14px] text-black/60 leading-snug mt-0.5">{d}</div></div>
            </div>
          ))}
        </div>
        <div className="mt-5 text-[13px] font-semibold text-black/45 uppercase tracking-[0.04em] px-1 mb-2">Compatibilidade</div>
        <Group>
          {compat.map(([a, b, c, color], i) => (
            <div key={a} className={`flex items-center gap-3 px-4 py-2.5 ${i < compat.length - 1 ? 'border-b border-black/[0.07]' : ''}`}>
              <span className="flex-1"><span className="block text-[15px] text-black">{a}</span><span className="block text-[12.5px] text-black/50">{b}</span></span>
              <span className="h-6 px-2.5 rounded-full text-[12px] font-semibold grid place-items-center" style={{ background: color + '22', color: color === '#ff9f0a' ? '#a35b00' : '#1f7a38' }}>{c}</span>
            </div>
          ))}
        </Group>
        <div className="mt-4 bg-white rounded-[18px] p-4 text-[14px] text-black/65 leading-snug">
          <div className="text-[15px] font-semibold text-black mb-1">Recomendação</div>
          Tag NTAG216 com proteção contra regravação + QR na mesma placa, levando ao site (PWA). Sem app: quem visita uma vez já tem a trilha no aparelho; quem nunca abriu precisa de rede só no primeiro acesso. A assinatura na tag impede carimbo falso por cópia do link.
        </div>
      </div>
    </div>
  )
}
