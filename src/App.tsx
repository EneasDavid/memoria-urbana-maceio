import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { PhoneFlow, type Stage } from './PhoneFlow'
import { Website } from './Website'
import { Dashboard } from './Dashboard'
import { Segmented, Icon, type IconName } from './ui'
import { seedReports, type Report, type TrackEvent, type User } from './data'

// Memória Urbana Maceió · protótipo
// Site (web) · App no celular (jornada NFC/QR → página → login → app) · Apresentação · Painel da prefeitura.
// Os eventos e relatos são compartilhados: o que acontece no celular/site aparece no Painel.

type Screen = 'site' | 'celular' | 'apresentacao' | 'painel'

function useViewport() {
  const [v, setV] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return v
}

function Phone({ children, scale }: { children: ReactNode; scale: number }) {
  return (
    <div style={{ width: 414 * scale, height: 868 * scale }} className="shrink-0">
      <div className="relative rounded-[64px] p-[12px] bg-[#1c1c1e] shadow-[0_0_0_2px_#3a3a3c,0_40px_80px_rgba(0,0,0,0.25)] origin-top-left" style={{ width: 414, height: 868, transform: `scale(${scale})` }}>
        <div className="relative w-full h-full rounded-[52px] overflow-hidden bg-[#f6f3ec] isolate">
          {children}
          <div className="absolute top-[11px] left-1/2 -translate-x-1/2 w-[124px] h-[36px] rounded-full bg-black z-[65] pointer-events-none" />
          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[136px] h-[5px] rounded-full bg-black/70 z-[80] pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('site')
  const [dark, setDark] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<TrackEvent[]>([])
  const [reports, setReports] = useState<Report[]>(seedReports)
  const [siteId, setSiteId] = useState('graciliano')
  const [stage, setStage] = useState<Stage>('home')
  const [, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])
  const session = useRef(Math.random().toString(36).slice(2, 7)).current
  const nextId = useRef(1)
  const { w, h } = useViewport()
  const small = w < 760

  const onTrack = useCallback((e: Omit<TrackEvent, 'id' | 'at' | 'session' | 'synced'> & { synced?: boolean }) => {
    setEvents((list) => [{ ...e, synced: e.synced ?? !e.offline, id: nextId.current++, at: Date.now(), session }, ...list].slice(0, 60))
  }, [session])
  const onReport = useCallback((r: Omit<Report, 'id' | 'at' | 'status'>) => {
    setReports((list) => [{ ...r, id: Date.now(), at: Date.now(), status: 'Novo' }, ...list])
  }, [])

  useEffect(() => {
    if (events[0]?.type === 'sync') setEvents((list) => list.map((x) => (x.synced ? x : { ...x, synced: true })))
  }, [events])

  const phone = (
    <PhoneFlow stage={stage} setStage={setStage} startId={siteId} user={user} setUser={setUser} dark={dark} setDark={setDark} onTrack={onTrack} onReport={onReport} session={session} />
  )

  // Celular de verdade: só o app, em tela cheia
  if (small) return <div className={`fixed inset-0 ${dark ? 'mu-dark' : ''}`}>{phone}</div>

  const scale = Math.min(1, (h - 110) / 868)
  const tips: [IconName, string, string][] = [
    ['nfc', '1 · Encoste ou aponte', 'Notificação de NFC na tela inicial, ou câmera no QR'],
    ['globe', '2 · Página do monumento', 'Abre no navegador: livre, sem app e sem cadastro'],
    ['star', '3 · Quer pontuar?', 'Login com Google (OAuth) e app leve de 6 MB'],
    ['scan', '4 · No app', 'Trilha, carimbos, foto do monumento (+XP) e RA'],
    ['flag', 'Relatos', 'Obra danificada? Avise em 2 toques, sem conta'],
  ]
  const restart = () => setStage('home')

  return (
    <div className={`fixed inset-0 overflow-hidden mu-root ${dark ? 'mu-dark' : ''}`}>
      {/* barra de modos */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 p-1 rounded-[14px] bg-white/75 backdrop-blur-2xl border border-black/[0.06] shadow-[0_6px_24px_rgba(0,0,0,0.1)]">
        <Segmented value={screen} onChange={setScreen} options={[{ value: 'site', label: 'Site' }, { value: 'celular', label: 'App no celular' }, { value: 'apresentacao', label: 'Apresentação' }, { value: 'painel', label: 'Painel (PC)' }]} />
        <button onClick={() => setDark(!dark)} aria-label="Modo noturno" className="w-8 h-8 rounded-[9px] grid place-items-center text-black/65 hover:bg-black/[0.05]"><Icon name={dark ? 'sun' : 'moon'} size={17} /></button>
      </div>

      {screen === 'site' && (
        <div className="absolute inset-x-0 bottom-0 top-[60px]">
          <Website id={siteId} setId={setSiteId} user={user} setUser={setUser} dark={dark} setDark={setDark} onTrack={onTrack} onReport={onReport} />
        </div>
      )}

      {screen === 'painel' && (
        <div className="absolute inset-x-0 bottom-0 top-[60px]">
          <Dashboard events={events} reports={reports} setReports={setReports} bump={bump} onPublic={(id) => { if (id) setSiteId(id); setScreen('site') }} />
        </div>
      )}

      {screen === 'celular' && (
        <div className="absolute inset-0 bg-[#e9e5dc] grid place-items-center pt-[56px]">
          <div className="flex items-center gap-6">
            <Phone scale={scale}>{phone}</Phone>
            <div className="w-[170px] space-y-2">
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-black/45 mb-1">Simulação</div>
              <button onClick={restart} className="w-full h-10 rounded-[11px] bg-white text-[13.5px] font-semibold flex items-center gap-2 px-3"><Icon name="nfc" size={16} className="text-[#2c8585]" />Ler placa de novo</button>
              <select value={siteId} onChange={(e) => { setSiteId(e.target.value); setStage('home') }} className="w-full h-10 rounded-[11px] bg-white px-2 text-[13px]">
                {['graciliano', 'nise', 'martirios', 'lucena', 'farol'].map((id) => <option key={id} value={id}>Placa: {id === 'lucena' ? 'Lucena Maranhão' : id === 'martirios' ? 'Pç. Martírios' : id[0].toUpperCase() + id.slice(1)}</option>)}
              </select>
              <div className="text-[12px] text-black/45 leading-snug pt-1">Etapa: <b className="text-black/70">{{ home: 'tela inicial', web: 'página web', install: 'instalando app', app: 'app' }[stage]}</b></div>
            </div>
          </div>
        </div>
      )}

      {screen === 'apresentacao' && (
        <div className="absolute inset-0 overflow-auto bg-[#f6f3ec]">
          <div className="min-h-full flex items-center justify-center gap-16 px-10 pt-[70px] pb-8">
            <div className="hidden lg:block w-[320px] shrink-0">
              <img src="/memoria-urbana-logo.png" alt="Memória Urbana em Maceió" className="w-[76px] h-[76px] rounded-full object-cover shadow-[0_8px_24px_rgba(0,0,0,0.12)] bg-white" />
              <h1 className="mt-5 text-[40px] font-bold tracking-[-0.03em] leading-[1.05] text-black">Memória Urbana Maceió</h1>
              <p className="mt-3 text-[17px] text-black/55 leading-snug">Placas com QR e NFC que abrem a história de estátuas, bustos e praças — e uma trilha cultural para quem quiser ir além.</p>
              <ul className="mt-7 space-y-3.5">
                {tips.map(([ic, t, d]) => (
                  <li key={t} className="flex gap-3">
                    <span className="w-9 h-9 rounded-[10px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] grid place-items-center text-[#2c8585] shrink-0"><Icon name={ic} size={19} /></span>
                    <span><span className="block text-[15px] font-semibold text-black">{t}</span><span className="block text-[13.5px] text-black/50 leading-snug">{d}</span></span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex gap-2">
                <button onClick={restart} className="h-10 px-4 rounded-full bg-[#0b2f49] text-white text-[14px] font-semibold flex items-center gap-2"><Icon name="nfc" size={16} />Recomeçar jornada</button>
                <button onClick={() => setScreen('painel')} className="h-10 px-4 rounded-full bg-white text-[14px] font-semibold">Ver painel</button>
              </div>
            </div>
            <Phone scale={scale}>{phone}</Phone>
          </div>
        </div>
      )}
    </div>
  )
}
