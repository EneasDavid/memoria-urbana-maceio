import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon, Stamp, RarityPill, Avatar, type IconName } from './ui'
import { byId, levelFor, type Monument, type TrackEvent, type User } from './data'
import { Scanner, type ScanMode } from './Scanner'
import { GoogleLogin, demoAccounts } from './GoogleLogin'
import { Immersive, type ImmersiveMode } from './Immersive'
import { ReportSheet } from './ReportSheet'
import type { Report } from './data'
import { ExploreScreen, MapScreen, MonumentScreen, OfflineSheet, PassportScreen, ProfileScreen, Photo, PhotoViewer, stampClass, type MobileCtx } from './MobileScreens'

// Memória da sessão: o progresso continua quando o visitante sai do app (botão de início) e volta
const sessionStore: Record<string, unknown> = {}
function useSessionState<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => (key in sessionStore ? (sessionStore[key] as T) : init))
  useEffect(() => { sessionStore[key] = v }, [key, v])
  return [v, setV] as const
}
export type StampLog = Record<string, { at: number; last?: number; method: 'qr' | 'nfc' | 'gps' | 'placa' | 'grupo'; count: number; group?: string[]; by?: string }>
export type PhotoEntry = { at: number; src?: string; front?: string }
// Progresso por conta: cada pessoa de teste tem seus selos. O que foi feito sem conta passa para quem entrar.
function useUserState<T>(uid: string, key: string, init: T) {
  const k = uid + ':' + key
  const load = (kk: string, fallback: T): T => (kk in sessionStore ? (sessionStore[kk] as T) : fallback)
  const [st, setSt] = useState<{ k: string; v: T }>(() => ({ k, v: load(k, init) }))
  let cur = st
  if (st.k !== k) {
    cur = { k, v: load(k, st.k.startsWith('anon:') ? st.v : init) }
    sessionStore[k] = cur.v
    setSt(cur)
  }
  const set = useCallback((u: T | ((p: T) => T)) => setSt((s0) => {
    const nv = typeof u === 'function' ? (u as (p: T) => T)(s0.v) : u
    sessionStore[s0.k] = nv
    return { k: s0.k, v: nv }
  }), [])
  return [cur.v, set] as const
}

// Onde cada pessoa de teste "está" agora (simulação de proximidade, como o Strava)
const FRIEND_SPOTS: Record<string, [number, number]> = {
  'jovem.werther@exemplo.com': [-9.6669, -35.7124],
  'gregor.samsa@exemplo.com': [-9.6671, -35.7119],
  'anna.karenina@exemplo.com': [-9.6656, -35.736],
}
const NEAR_M = 150
const distM = (a: [number, number], b: [number, number]) => {
  const R = 6371000, dLa = ((b[0] - a[0]) * Math.PI) / 180, dLo = ((b[1] - a[1]) * Math.PI) / 180
  const h = Math.sin(dLa / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLo / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
type Nearby = { name: string; email: string; color?: string; d: number }
function nearbyFriends(me: User | null, m: Monument): Nearby[] {
  return demoAccounts
    .filter((a) => a.email !== me?.email)
    .map((a) => ({ name: a.name, email: a.email, color: (a as User & { color?: string }).color, d: FRIEND_SPOTS[a.email] ? distM(FRIEND_SPOTS[a.email], [m.lat, m.lng]) : Infinity }))
    .filter((a) => a.d <= NEAR_M)
    .sort((a, b) => a.d - b.d)
}
export type MyReport = { kind: string; note?: string; photo?: boolean; at: number }

// Folha de compartilhar (estilo iOS) — copiar link funciona de verdade; "Mais opções" abre o compartilhar do sistema
function ShareSheet({ m, onClose, onDone }: { m: Monument; onClose: () => void; onDone: (msg: string) => void }) {
  const url = 'https://memoriaurbana.maceio.br/p/' + m.plate
  const text = 'Conheça ' + m.name + ' na Trilha Cultural de Maceió'
  const copy = async () => {
    try { await navigator.clipboard.writeText(url) } catch { /* sem área de transferência na prévia */ }
    onDone('Link copiado')
  }
  const more = async () => {
    try { if (navigator.share) { await navigator.share({ title: m.name, text, url }); onClose(); return } } catch { /* cancelado ou indisponível */ }
    copy()
  }
  const wa = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url)
  const tile = 'bg-white rounded-[16px] py-3 flex flex-col items-center gap-1.5 text-[12px] font-semibold text-black/75 active:scale-[0.97] transition'
  return (
    <div className="absolute inset-0 z-[60] bg-black/40 anim-fade" onClick={onClose}>
      <div className="absolute left-0 right-0 bottom-0 rounded-t-[26px] bg-[#f2f2f7] px-4 pt-3 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-10 h-1.5 rounded-full bg-black/15 mb-3" />
        <div className="flex items-center gap-3 bg-white rounded-[16px] p-3">
          <span className="w-11 h-11 rounded-[12px] grid place-items-center text-white shrink-0" style={{ background: m.hue }}><Icon name="building" size={22} /></span>
          <div className="flex-1 min-w-0"><div className="text-[15px] font-semibold text-black truncate">{m.name}</div><div className="text-[12.5px] text-black/50 truncate">{url.replace('https://', '')}</div></div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a href={wa} target="_blank" rel="noreferrer" onClick={() => onDone('Abrindo o WhatsApp')} className={tile}><span className="w-11 h-11 rounded-[12px] bg-[#25d366] text-white grid place-items-center"><Icon name="chat" size={22} /></span>WhatsApp</a>
          <button onClick={copy} className={tile}><span className="w-11 h-11 rounded-[12px] bg-[#0b2f49] text-white grid place-items-center"><Icon name="share" size={21} /></span>Copiar link</button>
          <button onClick={more} className={tile}><span className="w-11 h-11 rounded-[12px] bg-black/70 text-white grid place-items-center"><Icon name="plus" size={22} /></span>Mais opções</button>
        </div>
        <button onClick={onClose} className="mt-3 w-full h-[50px] rounded-[14px] bg-white text-[16px] font-semibold text-[#2c8585]">Cancelar</button>
      </div>
    </div>
  )
}

// Visita em grupo (estilo Strava): só aparece quem está perto; a visita entra no passaporte de quem for marcado
function GroupPicker({ options, value, onChange }: { options: Nearby[]; value: string[]; onChange: (g: string[]) => void }) {
  const [open, setOpen] = useState(value.length > 0)
  if (!options.length && !value.length) return <div className="mt-3 text-[12.5px] text-black/45 flex items-center justify-center gap-1.5"><Icon name="users" size={14} />Ninguém da sua rede por perto agora</div>
  if (!open) return <button onClick={() => setOpen(true)} className="mt-3 mx-auto h-8 px-3 rounded-full bg-black/5 text-[13px] font-semibold text-black/70 flex items-center gap-1.5"><Icon name="users" size={15} />Visita em grupo? {options.length} por perto</button>
  return (
    <div className="mt-3 text-left">
      <div className="text-[12px] font-semibold text-black/45 uppercase tracking-[0.05em] mb-1.5">Quem está com você</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((f) => {
          const on = value.includes(f.name)
          return <button key={f.email} onClick={() => onChange(on ? value.filter((n) => n !== f.name) : [...value, f.name])} className={'h-8 pl-1 pr-2.5 rounded-full flex items-center gap-1.5 text-[13px] font-semibold border ' + (on ? 'bg-[#2c8585] text-white border-[#2c8585]' : 'bg-white text-black/70 border-black/10')}><Avatar name={f.name} color={f.color} size={24} />{f.name.replace(/^Jovem /, '').split(' ')[0]}<span className={on ? 'text-white/70 font-medium' : 'text-black/40 font-medium'}>· {Math.round(f.d)} m</span></button>
        })}
      </div>
      <div className="mt-1.5 text-[11.5px] text-black/45 leading-snug">Só aparece quem está a até {NEAR_M} m. A visita também vai para o passaporte de quem você marcar.</div>
    </div>
  )
}

// Foto do monumento em duas câmeras: traseira (a obra) e, alguns segundos depois, frontal (você)
function PhotoCapture({ m, user, onClose, onSend }: { m: Monument; user: User | null; onClose: () => void; onSend: (shot: { src?: string; front?: string }) => void }) {
  const [phase, setPhase] = useState<'rear' | 'wait' | 'front' | 'review'>('rear')
  const [count, setCount] = useState(3)
  const [live, setLive] = useState(false)
  const [rear, setRear] = useState<string | undefined>()
  const [front, setFront] = useState<string | undefined>()
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const stop = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null }
  const start = async (facing: 'environment' | 'user') => {
    stop(); setLive(false)
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1280 } }, audio: false })
      stream.current = st
      if (video.current) { video.current.srcObject = st; await video.current.play(); setLive(true) }
    } catch { setLive(false) }
  }
  const grab = (): string | undefined => {
    const v = video.current
    if (!live || !v || !v.videoWidth) return undefined
    const w = Math.min(720, v.videoWidth), h = Math.round((v.videoHeight / v.videoWidth) * w)
    const c = document.createElement('canvas'); c.width = w; c.height = h
    c.getContext('2d')?.drawImage(v, 0, 0, w, h)
    try { return c.toDataURL('image/jpeg', 0.82) } catch { return undefined }
  }
  useEffect(() => { start('environment'); return () => stop() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase !== 'wait') return
    if (count <= 0) { setPhase('front'); return }
    const t = window.setTimeout(() => setCount((c) => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [phase, count])
  useEffect(() => {
    if (phase !== 'front') return
    const t = window.setTimeout(() => { setFront(grab()); stop(); setPhase('review') }, 1400)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, live])
  const shoot = () => { setRear(grab()); setCount(3); setPhase('wait'); start('user') }
  const retake = () => { setRear(undefined); setFront(undefined); setPhase('rear'); start('environment') }
  return (
    <div className="absolute inset-0 z-[62] bg-black text-white overflow-hidden anim-fade">
      {phase !== 'review' ? (
        <>
          <video ref={video} playsInline muted className={'absolute inset-0 w-full h-full object-cover ' + (live ? '' : 'hidden') + (phase !== 'rear' ? ' -scale-x-100' : '')} />
          {!live && (phase === 'rear' ? <Photo m={m} className="absolute inset-0" /> : <div className="absolute inset-0 grid place-items-center" style={{ background: 'radial-gradient(80% 60% at 50% 40%, #33464f, #0b1114)' }}>{user && <Avatar name={user.name} size={120} />}</div>)}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/60" />
          <button onClick={() => { stop(); onClose() }} aria-label="Fechar" className="absolute left-4 top-[56px] w-9 h-9 rounded-full bg-black/45 backdrop-blur-xl grid place-items-center"><Icon name="x" size={16} stroke={2.4} /></button>
          <div className="absolute left-0 right-0 top-[60px] text-center text-[14px] font-semibold">{phase === 'rear' ? 'Câmera traseira · enquadre a obra' : phase === 'wait' ? 'Agora vire para você…' : 'Câmera frontal'}</div>
          {phase === 'wait' && <div className="absolute inset-0 grid place-items-center"><div className="w-28 h-28 rounded-full bg-black/45 backdrop-blur-xl grid place-items-center text-[56px] font-bold tabular-nums pop-in" key={count}>{count}</div></div>}
          {rear && phase !== 'rear' && <img src={rear} alt="" className="absolute left-4 top-[96px] w-[92px] h-[124px] object-cover rounded-[14px] border-2 border-white shadow-lg" />}
          {!live && <div className="absolute left-0 right-0 bottom-[150px] text-center text-[12px] text-white/70">Pré-visualização · no celular usa as câmeras reais</div>}
          {phase === 'rear' && <div className="absolute left-0 right-0 bottom-[44px] flex justify-center"><button onClick={shoot} aria-label="Tirar foto" className="w-[74px] h-[74px] rounded-full border-[4px] border-white grid place-items-center active:scale-95 transition"><span className="w-[60px] h-[60px] rounded-full bg-white" /></button></div>}
        </>
      ) : (
        <div className="absolute inset-0 bg-[#0b1114]">
          <div className="absolute left-4 right-4 top-[60px] bottom-[170px] rounded-[22px] overflow-hidden">
            {rear ? <img src={rear} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <Photo m={m} className="absolute inset-0" />}
            <div className="absolute left-3 top-3 w-[96px] h-[128px] rounded-[14px] overflow-hidden border-2 border-white shadow-lg bg-[#22323a] grid place-items-center">
              {front ? <img src={front} alt="" className="w-full h-full object-cover -scale-x-100" /> : user ? <Avatar name={user.name} size={56} /> : null}
            </div>
            <div className="absolute left-3 bottom-3 h-7 px-3 rounded-full bg-black/50 backdrop-blur-xl text-[12px] font-semibold flex items-center">{m.name}</div>
          </div>
          <div className="absolute left-4 right-4 bottom-[44px]">
            <button onClick={() => onSend({ src: rear, front })} className="w-full h-[52px] rounded-[15px] bg-white text-black text-[16px] font-semibold">Enviar esta foto · +50 XP</button>
            <button onClick={retake} className="mt-2 w-full h-[46px] rounded-[15px] bg-white/12 text-white text-[15px] font-semibold">Excluir e tirar outra</button>
            <p className="mt-2 text-center text-[11.5px] text-white/50">Depois de enviada, a foto desta obra não pode ser trocada.</p>
          </div>
        </div>
      )}
    </div>
  )
}

type Tab = 'explorar' | 'trilha' | 'passaporte' | 'perfil'
type NewEvent = Omit<TrackEvent, 'id' | 'at' | 'session' | 'synced'> & { synced?: boolean }

function StatusBar({ dark, online }: { dark: boolean; online: boolean }) {
  return (
    <div className={`absolute top-0 left-0 right-0 z-[60] h-[50px] px-8 pt-[17px] flex justify-between text-[16px] font-semibold pointer-events-none ${dark ? 'text-white' : 'text-black'}`}>
      <span className="tabular-nums w-[54px] text-center">9:41</span>
      <span className="flex items-center gap-1.5">
        {online ? (
          <>
            <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
            <Icon name="wifi" size={17} stroke={2.4} />
          </>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
        )}
        <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="17" height="9" rx="2.5" fill="currentColor" /><path d="M25 4.5v4a2 2 0 0 0 0-4z" fill="currentColor" opacity="0.5" /></svg>
      </span>
    </div>
  )
}

export function MobileApp({ onTrack, session, dark, setDark, user, setUser, onReport, welcome, welcomeVia }: { onTrack: (e: NewEvent) => void; session: string; dark: boolean; setDark: (v: boolean) => void; user: User | null; setUser: (u: User | null) => void; onReport: (r: Omit<Report, 'id' | 'at' | 'status'>) => void; welcome?: string; welcomeVia?: 'nfc' | 'qr' }) {
  const [tab, setTab] = useState<Tab>('explorar')
  const [xp, setXp] = useUserState(user?.email ?? 'anon', 'xp', 0)
  const [collected, setCollected] = useUserState<string[]>(user?.email ?? 'anon', 'collected', [])
  const [pending, setPending] = useUserState<string[]>(user?.email ?? 'anon', 'pending', [])
  const [arUsed, setArUsed] = useUserState(user?.email ?? 'anon', 'arUsed', false)
  const [immersive, setImmersive] = useState<{ id: string; mode: ImmersiveMode } | null>(null)
  const [loginReason, setLoginReason] = useState<string | undefined>()
  const [report, setReport] = useState<string | null>(null)
  const [photos, setPhotos] = useUserState<string[]>(user?.email ?? 'anon', 'photos', [])
  const [stampLog, setStampLog] = useUserState<StampLog>(user?.email ?? 'anon', 'stampLog2', {})
  const [photoLog, setPhotoLog] = useUserState<Record<string, PhotoEntry>>(user?.email ?? 'anon', 'photoLog2', {})
  const [capture, setCapture] = useState<string | null>(null)
  const [myReports, setMyReports] = useUserState<Record<string, MyReport[]>>(user?.email ?? 'anon', 'myReports', {})
  const [shareId, setShareId] = useState<string | null>(null)
  const [photoView, setPhotoView] = useState<string | null>(null)
  const lastMethod = useRef<'qr' | 'nfc' | 'gps' | 'placa'>(welcomeVia ?? 'placa')
  // registra no passaporte quando cada selo foi conquistado
  useEffect(() => {
    setStampLog((l) => {
      const add = collected.filter((id) => !l[id])
      if (!add.length) return l
      const n = { ...l }
      add.forEach((id) => { n[id] = { at: Date.now(), method: lastMethod.current, count: 1 } })
      return n
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collected])

  // Chegou pela página web: credita o carimbo da placa lida
  useEffect(() => {
    if (!welcome || !user) return
    const m = byId(welcome)
    if (!sessionStore['w:' + (user?.email ?? '') + welcome] && !collected.includes(welcome)) {
      sessionStore['w:' + (user?.email ?? '') + welcome] = true
      setCollected((c) => (c.includes(welcome) ? c : [...c, welcome]))
      setXp((x) => x + m.xp)
      onTrack({ type: 'stamp', label: 'Carimbo da placa (primeiro acesso ao app)', monument: welcome, offline: false, identified: true, synced: true })
    }
    if (sessionStore['r:' + (user?.email ?? '') + welcome]) return
    const t = window.setTimeout(() => { sessionStore['r:' + (user?.email ?? '') + welcome] = true; setReward({ m, xp: m.xp, levelUp: false }) }, 600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [heard, setHeard] = useUserState<string[]>(user?.email ?? 'anon', 'heard', [])
  const [online, setOnlineState] = useState(true)
  const [offlinePack, setOfflinePack] = useState(true)
  const [queue, setQueue] = useState(0)
  const [shareRoute, setShareRoute] = useState(true)
  const [monument, setMonument] = useState<string | null>(welcome ?? 'graciliano') // o app abre na página do monumento da placa lida
  const [scanner, setScanner] = useState<{ mode: ScanMode; target: string } | null>(null)
  const [login, setLogin] = useState(false)
  const [offlineSheet, setOfflineSheet] = useState(false)
  const [reward, setReward] = useState<{ m: Monument; xp: number; levelUp: boolean; pending?: boolean } | null>(null)
  const [toast, setToast] = useState<{ icon: IconName; text: string } | null>(null)
  const pendingOpen = useRef<string | null>(null)
  const pendingReward = useRef<{ m: Monument; xp: number; levelUp: boolean; pending?: boolean } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  const showToast = useCallback((icon: IconName, text: string) => {
    setToast({ icon, text })
    window.setTimeout(() => setToast(null), 2600)
  }, [])

  const track: MobileCtx['track'] = (type, label, mon) => {
    onTrack({ type, label, monument: mon, offline: !online, identified: !!user && shareRoute, synced: online })
    if (!online) setQueue((q) => q + 1)
  }

  const addXp = (gain: number) => {
    const before = levelFor(xp).level
    setXp((v) => v + gain)
    return levelFor(xp + gain).level > before
  }

  const collect = (id: string, method: 'qr' | 'nfc' | 'gps') => {
    lastMethod.current = method
    const m = byId(id)
    const first = !collected.includes(id)
    const gain = method === 'gps' ? Math.round(m.xp / 2) : m.xp
    const t: TrackEvent['type'] = method === 'qr' ? 'qr_scan' : method === 'nfc' ? 'nfc_read' : 'gps_checkin'
    track(t, method === 'qr' ? 'QR Code escaneado' : method === 'nfc' ? (online ? 'Tag NFC lida' : 'Tag NFC lida sem internet') : 'Check-in por GPS', id)
    if (!user) {
      // sem conta: a leitura conta (anônima) e o carimbo fica reservado até a pessoa entrar
      if (!pending.includes(id)) setPending((p) => [...p, id])
      return { xp: gain, first: !pending.includes(id) && first, levelUp: false, pending: true }
    }
    if (first) {
      setCollected((c) => [...c, id])
      const levelUp = addXp(gain)
      track('stamp', 'Carimbo conquistado', id)
      return { xp: gain, first, levelUp, pending: false }
    }
    setStampLog((l) => (l[id] ? { ...l, [id]: { ...l[id], count: (l[id].count || 1) + 1, last: Date.now(), method } } : l))
    return { xp: 0, first, levelUp: false, pending: false }
  }

  // marca/desmarca acompanhantes e grava a visita no passaporte deles (mesmo sem terem escaneado)
  const setGroup = (m: Monument, g: string[]) => {
    const prev = stampLog[m.id]?.group || []
    setStampLog((l) => (l[m.id] ? { ...l, [m.id]: { ...l[m.id], group: g } } : l))
    if (!user) return
    const me = user.name
    demoAccounts.filter((a) => a.email !== user.email).forEach((a) => {
      const kc = a.email + ':collected', kl = a.email + ':stampLog2'
      const col = (sessionStore[kc] as string[] | undefined) || []
      const log = (sessionStore[kl] as StampLog | undefined) || {}
      const now = g.includes(a.name), was = prev.includes(a.name)
      const e = log[m.id]
      if (now) {
        const others = [me, ...g.filter((n) => n !== a.name)]
        sessionStore[kl] = { ...log, [m.id]: e ? { ...e, group: others } : { at: Date.now(), method: 'grupo', count: 1, group: others, by: me } }
        if (!col.includes(m.id)) sessionStore[kc] = [...col, m.id]
      } else if (was && e) {
        if (e.by === me) { const n = { ...log }; delete n[m.id]; sessionStore[kl] = n; sessionStore[kc] = col.filter((x) => x !== m.id) }
        else sessionStore[kl] = { ...log, [m.id]: { ...e, group: (e.group || []).filter((n) => n !== me) } }
      }
    })
    if (g.length > prev.length) showToast('users', 'Visita registrada também para ' + g.filter((n) => !prev.includes(n)).map((n) => n.replace(/^Jovem /, '').split(' ')[0]).join(' e '))
  }

  const ctx: MobileCtx = {
    user, xp, collected, heard, online, offlinePack, queue, shareRoute, pending, arUsed, dark, setDark,
    openReport: (id) => setReport(id),
    photos, stampLog, photoLog, myReports,
    share: (id) => { setShareId(id); track('open_story', 'Compartilhar monumento', id) },
    setTab: (t) => setTab(t as Tab),
    openPhoto: (id) => { if (photoLog[id]) setPhotoView(id) },
    openCapture: (id) => { if (photos.includes(id)) return showToast('check', 'Foto desta obra já enviada'); setCapture(id) },
    openImmersive: (id, mode) => { setImmersive({ id, mode }); if (mode === 'ar') setArUsed(true); onTrack({ type: 'open_story', label: mode === 'ar' ? 'Realidade aumentada aberta' : 'Visualização 3D aberta', monument: id, offline: !online, identified: true, synced: online }) },
    openMonument: (id) => setMonument(id),
    openScanner: (mode, target) => setScanner({ mode, target: target ?? (collected.includes('graciliano') ? 'aurelio' : 'graciliano') }),
    openLogin: (reason) => { setLoginReason(reason); setLogin(true) },
    openOffline: () => setOfflineSheet(true),
    setOnline: (v) => {
      setOnlineState(v)
      if (v && queue > 0) {
        window.setTimeout(() => {
          onTrack({ type: 'sync', label: `Fila offline sincronizada (${queue})`, offline: false, identified: !!user, synced: true })
          showToast('sync', `${queue} evento(s) sincronizado(s)`)
          setQueue(0)
        }, 700)
      } else if (!v) showToast('wifiOff', 'Modo sem internet')
    },
    setOfflinePack: (v) => { setOfflinePack(v); if (v) showToast('download', 'Pacote offline baixado · 18 MB') },
    setShareRoute,
    sync: () => { onTrack({ type: 'sync', label: `Fila offline sincronizada (${queue})`, offline: false, identified: !!user, synced: true }); showToast('sync', `${queue} evento(s) sincronizado(s)`); setQueue(0) },
    logout: () => { track('logout', 'Saiu da conta'); setUser(null); showToast('person', 'Você saiu da conta') },
    track,
    collectGps: (id) => {
      const r = collect(id, 'gps')
      if (r.first) setReward({ m: byId(id), xp: r.xp, levelUp: r.levelUp })
    },
    markHeard: (id) => setHeard((h) => (h.includes(id) ? h : [...h, id])),
  }

  // Ao fechar o scanner: abre a história e mostra a recompensa
  const closeScanner = () => {
    setScanner(null)
    if (pendingOpen.current) {
      setMonument(pendingOpen.current)
      pendingOpen.current = null
    }
    if (pendingReward.current) {
      const r = pendingReward.current
      pendingReward.current = null
      window.setTimeout(() => setReward(r), 350)
    }
  }

  useEffect(() => { setScrolled(false); scrollRef.current?.scrollTo({ top: 0 }) }, [tab])

  const tabs: [Tab, IconName, string][] = [
    ['explorar', 'home', 'Explorar'],
    ['trilha', 'map', 'Trilha'],
    ['passaporte', 'book', 'Passaporte'],
  ]
  const darkStatus = dark || !!scanner || !!immersive || (!!monument && !scrolled)

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#f6f3ec] text-black select-none mu-mobile">
      <StatusBar dark={darkStatus} online={online} />

      {/* conteúdo da aba */}
      {tab === 'trilha' ? (
        <div style={{ display: monument ? 'none' : 'contents' }}><MapScreen ctx={ctx} /></div>
      ) : (
        <div ref={scrollRef} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 8)} className="absolute inset-0 overflow-y-auto no-scrollbar pt-[54px]">
          <div className={`sticky top-0 z-10 h-0 transition-opacity ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute -top-[54px] left-0 right-0 h-[54px] bg-[#f6f3ec]/80 backdrop-blur-2xl border-b border-black/[0.06]" />
          </div>
          {tab === 'explorar' && <ExploreScreen ctx={ctx} />}
          {tab === 'passaporte' && <PassportScreen ctx={ctx} />}
          {tab === 'perfil' && <ProfileScreen ctx={ctx} />}
        </div>
      )}

      {monument && <MonumentScreen key={monument} id={monument} ctx={ctx} onBack={() => setMonument(null)} />}

      {/* barra de abas flutuante (vidro) + botão de leitura */}
      {!scanner && !immersive && (
        <div className="absolute left-0 right-0 bottom-[26px] z-40 px-4 flex items-center gap-2.5">
          <nav className="flex-1 h-[64px] rounded-full bg-white/70 backdrop-blur-2xl border border-white/70 shadow-[0_10px_36px_rgba(0,0,0,0.14)] flex items-center px-1.5" aria-label="Abas">
            {tabs.map(([id, icon, label]) => {
              const active = tab === id && !monument
              return (
                <button key={id} onClick={() => { setMonument(null); setTab(id) }} className={`flex-1 h-[54px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${active ? 'bg-black/[0.07] text-[#2c8585]' : 'text-black/70'}`} aria-current={active ? 'page' : undefined}>
                  <Icon name={icon} size={23} stroke={active ? 2.2 : 1.8} />
                  <span className="text-[10px] font-semibold">{label}</span>
                </button>
              )
            })}
          </nav>
          <button onClick={() => ctx.openScanner('qr')} aria-label="Ler placa" className="w-[64px] h-[64px] rounded-full bg-[#0b2f49] text-white grid place-items-center shadow-[0_10px_30px_rgba(11,47,73,0.45)] active:scale-95 transition">
            <Icon name="scan" size={27} stroke={2} />
          </button>
        </div>
      )}

      {scanner && (
        <Scanner
          key={scanner.mode + scanner.target}
          initialMode={scanner.mode}
          target={scanner.target}
          online={online}
          collected={collected}
          onClose={closeScanner}
          onResult={(id, method) => {
            const r = collect(id, method)
            pendingOpen.current = id
            if (r.first) pendingReward.current = { m: byId(id), xp: r.xp, levelUp: r.levelUp, pending: r.pending }
            return r
          }}
        />
      )}

      {login && (
        <GoogleLogin
          reason={loginReason}
          onClose={() => setLogin(false)}
          onLogin={(u, prefs) => {
            setUser(u)
            if (pending.length) {
              const gain = pending.reduce((acc, id) => acc + byId(id).xp, 0)
              setCollected((c) => [...c, ...pending.filter((id) => !c.includes(id))])
              setXp((v) => v + gain)
              pending.forEach((id) => onTrack({ type: 'stamp', label: 'Carimbo reservado confirmado', monument: id, offline: false, identified: true, synced: true }))
              setPending([])
              window.setTimeout(() => showToast('star', `+${gain} XP · ${pending.length} carimbo(s) guardado(s)`), 2800)
            }
            setShareRoute(prefs.history)
            setLogin(false)
            onTrack({ type: 'login', label: 'Login com Google (consentimento)', offline: false, identified: true, synced: true })
            showToast('check', `Bem-vinda, ${u.name.split(' ')[0]} · progresso salvo`)
          }}
        />
      )}

      {immersive && <Immersive m={byId(immersive.id)} initial={immersive.mode} onClose={() => setImmersive(null)} onShot={() => {
        const id = immersive.id
        if (photos.includes(id)) { showToast('check', 'Foto desta obra já enviada'); return }
        if (!user) { showToast('lock', 'Entre para enviar sua foto'); return }
        setImmersive(null); setCapture(id)
      }} />}

      {capture && <PhotoCapture m={byId(capture)} user={user} onClose={() => setCapture(null)} onSend={(shot) => {
        const id = capture
        setCapture(null)
        if (photos.includes(id)) return
        setPhotos((p) => [...p, id]); setPhotoLog((l) => ({ ...l, [id]: { at: Date.now(), ...shot } })); addXp(50)
        onTrack({ type: 'stamp', label: 'Foto do monumento enviada (+50 XP)', monument: id, offline: !online, identified: true, synced: online })
        showToast('star', 'Foto enviada · +50 XP')
      }} />}

      {report && <ReportSheet m={byId(report)} onClose={() => setReport(null)} onSend={(r) => { onReport(r); setMyReports((all) => ({ ...all, [r.monument]: [...(all[r.monument] || []), { kind: r.kind, note: r.note, photo: r.photo, at: Date.now() }] })) }} />}

      {photoView && photoLog[photoView] && <PhotoViewer m={byId(photoView)} photo={photoLog[photoView]} onClose={() => setPhotoView(null)} />}

      {shareId && <ShareSheet m={byId(shareId)} onClose={() => setShareId(null)} onDone={(t) => { setShareId(null); showToast('share', t) }} />}

      {offlineSheet && <OfflineSheet onClose={() => setOfflineSheet(false)} />}

      {/* recompensa estilo "captura" */}
      {reward && (
        <div className="absolute inset-0 z-[55] bg-black/55 backdrop-blur-md grid place-items-center anim-fade" onClick={() => setReward(null)}>
          <div className="w-[300px] rounded-[32px] bg-white p-6 text-center pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="text-[12px] font-bold tracking-[0.16em] text-[#a87a17]">{reward.pending ? 'CARIMBO RESERVADO' : 'NOVO CARIMBO'}</div>
            <div className="mx-auto mt-3 w-fit stamp-in"><Stamp label={stampClass(reward.m)} sub={reward.m.area} hue={reward.m.hue} got method={stampLog[reward.m.id]?.method} count={stampLog[reward.m.id]?.count || 1} rotate={-10} size={150} /></div>
            <div className="mt-3 text-[22px] font-bold tracking-[-0.01em] text-black leading-tight">{reward.m.name}</div>
            <div className="mt-2 flex items-center justify-center gap-2"><RarityPill rarity={reward.m.rarity} /><span className="text-[15px] font-bold text-[#1f6b6b]">{reward.pending ? `+${reward.xp} XP ao entrar` : `+${reward.xp} XP`}</span></div>
            {reward.levelUp && <div className="mt-3 h-8 px-3 mx-auto w-fit rounded-full bg-[#0b2f49] text-white text-[13px] font-semibold flex items-center gap-1.5"><Icon name="star" size={14} />Subiu para o nível {levelFor(xp).level}!</div>}
            {user && !reward.pending && <GroupPicker options={nearbyFriends(user, reward.m)} value={stampLog[reward.m.id]?.group || []} onChange={(g) => setGroup(reward.m, g)} />}
            {!user && <p className="mt-3 text-[12.5px] text-black/50 leading-snug">A página continua aberta para você. Entrando com Google, o carimbo é guardado e libera 3D e realidade aumentada.</p>}
            {!user ? (
              <>
                <button onClick={() => { setReward(null); setLoginReason('Guarde seu carimbo e pontue'); setLogin(true) }} className="mt-5 w-full h-[50px] rounded-[14px] bg-[#2c8585] text-white text-[16px] font-semibold">Entrar com Google</button>
                <button onClick={() => setReward(null)} className="mt-1 w-full h-[40px] text-[14px] font-semibold text-[#2c8585]">Agora não</button>
              </>
            ) : (
              <button onClick={() => setReward(null)} className="mt-5 w-full h-[50px] rounded-[14px] bg-[#2c8585] text-white text-[16px] font-semibold">Continuar</button>
            )}
          </div>
        </div>
      )}

      {/* toast estilo Dynamic Island */}
      {toast && (
        <div className="absolute top-[54px] left-1/2 -translate-x-1/2 z-[70] h-[37px] max-w-[92%] pl-2.5 pr-4 rounded-full bg-black/90 backdrop-blur-xl text-white text-[13px] font-semibold flex items-center gap-2 island-in whitespace-nowrap overflow-hidden text-ellipsis shadow-lg">
          <span className="w-6 h-6 rounded-full bg-[#34c759] grid place-items-center"><Icon name={toast.icon} size={14} stroke={2.4} /></span>{toast.text}
        </div>
      )}
      <span className="sr-only">Sessão {session}</span>
    </div>
  )
}
