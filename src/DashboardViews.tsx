import { useEffect, useState, type ReactNode } from 'react'
import { Icon, RarityPill, type IconName } from './ui'
import { monuments, hourly, funnel, journeys, cohorts, eventTemplates, fmt, type TrackEvent } from './data'

export function Card({ title, eyebrow, action, children, className = '' }: { title?: string; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-[18px] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 mb-4">
          <div>
            {eyebrow && <div className="text-[11px] font-semibold tracking-[0.08em] text-black/40 uppercase">{eyebrow}</div>}
            {title && <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-black">{title}</h3>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function Kpi({ icon, color, label, value, delta, note }: { icon: IconName; color: string; label: string; value: string; delta?: string; note?: string }) {
  return (
    <div className="bg-white rounded-[18px] border border-black/[0.06] p-4">
      <div className="flex items-center justify-between"><span className="text-[13px] text-black/55">{label}</span><span className="w-8 h-8 rounded-[9px] grid place-items-center" style={{ background: color + '1a', color }}><Icon name={icon} size={17} /></span></div>
      <div className="mt-2 text-[30px] font-semibold tracking-[-0.02em] text-black tabular-nums">{value}</div>
      <div className="mt-0.5 text-[12.5px]">{delta && <span className="text-[#248a3d] font-semibold">↗ {delta}</span>}{note && <span className="text-black/45"> {note}</span>}</div>
    </div>
  )
}

export function HourChart({ data = hourly, height = 150, color = '#2c8585' }: { data?: number[]; height?: number; color?: string }) {
  const w = 720
  const max = Math.max(...data)
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, height - (v / max) * (height - 12)])
  const line = pts.map((p) => p.join(',')).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${height + 22}`} className="w-full" preserveAspectRatio="none" style={{ height: height + 22 }}>
      <defs><linearGradient id="hc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={w} y1={height * f} y2={height * f} stroke="rgba(0,0,0,0.06)" />)}
      <polygon points={`0,${height} ${line} ${w},${height}`} fill="url(#hc)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => <text key={h} x={(h / 23) * w} y={height + 17} fontSize="11" fill="rgba(0,0,0,0.4)" textAnchor={h === 0 ? 'start' : 'middle'}>{String(h).padStart(2, '0')}h</text>)}
    </svg>
  )
}

// ================= FLUXO =================
export function FlowView() {
  const [focus, setFocus] = useState('geral')
  const [radius, setRadius] = useState(2)
  const sel = monuments.find((m) => m.id === focus)
  const series = sel ? hourly.map((v, i) => Math.round(v * (sel.flow / 100) * (0.8 + ((i * 7) % 5) / 10))) : hourly
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[18px] border border-black/[0.06] p-4 grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 items-end">
        <label className="text-[12px] text-black/50">Histórico de
          <select value={focus} onChange={(e) => setFocus(e.target.value)} className="mt-1 w-full h-9 rounded-[9px] bg-black/[0.04] px-3 text-[14px] text-black">
            <option value="geral">Geral</option>
            {monuments.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="text-[12px] text-black/50">Raio de análise
          <div className="mt-1 flex items-center gap-2"><input type="range" min={0.5} max={5} step={0.5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="flex-1 accent-[#2c8585]" /><span className="text-[14px] text-black tabular-nums w-12">{radius} km</span></div>
        </label>
        <div><div className="text-[12px] text-black/50">Pico de fluxo</div><div className="text-[20px] font-semibold text-black">17h — 18h</div></div>
        <div><div className="text-[12px] text-black/50">Pessoas estimadas agora</div><div className="text-[20px] font-semibold text-black tabular-nums">{fmt(Math.round(1264 * (sel ? sel.flow / 100 : 1)))}</div></div>
      </div>
      <div className="grid grid-cols-[1.7fr_1fr] gap-4">
        <Card eyebrow="Mapa de calor" title="Frequência na orla de Maceió" action={<div className="flex items-center gap-2 text-[11px] text-black/45">Baixa<span className="w-20 h-2 rounded-full" style={{ background: 'linear-gradient(90deg,#f5e3b5,#dda93f,#c4402e)' }} />Alta</div>}>
          <svg viewBox="0 0 400 300" className="w-full rounded-[12px]" style={{ background: '#f1ede4' }}>
            <defs><radialGradient id="heat"><stop offset="0" stopColor="#c4402e" stopOpacity="0.85" /><stop offset="0.45" stopColor="#dda93f" stopOpacity="0.45" /><stop offset="1" stopColor="#dda93f" stopOpacity="0" /></radialGradient></defs>
            <g stroke="#fff" strokeWidth="4">{Array.from({ length: 9 }, (_, i) => <line key={i} x1={-20} y1={40 + i * 40} x2={240} y2={-100 + i * 40} />)}</g>
            <path d="M60 300 L130 210 L190 160 L250 110 L300 60 L360 0 L400 0 L400 300 Z" fill="#a8d5ec" />
            <path d="M60 300 L130 210 L190 160 L250 110 L300 60 L360 0" fill="none" stroke="#efe2c3" strokeWidth="10" />
            {monuments.slice(0, 6).map((m, i) => {
              const x = [150, 120, 205, 270, 70, 95][i]
              const y = [180, 215, 130, 75, 250, 230][i]
              const active = !sel || sel.id === m.id
              return (
                <g key={m.id} opacity={active ? 1 : 0.25}>
                  <circle cx={x} cy={y} r={18 + m.flow * 0.45 * (radius / 2.5)} fill="url(#heat)" />
                  <circle cx={x} cy={y} r="9" fill="#fff" stroke={m.hue} strokeWidth="2.5" />
                  <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill={m.hue}>{m.plate}</text>
                </g>
              )
            })}
            <text x="310" y="220" fontSize="9" letterSpacing="2" fill="#5e9bbd" fontStyle="italic">OCEANO ATLÂNTICO</text>
          </svg>
        </Card>
        <Card eyebrow="Agora" title="Locais com maior fluxo">
          <ol className="space-y-3">
            {[...monuments].sort((a, b) => b.flow - a.flow).slice(0, 6).map((m, i) => (
              <li key={m.id} className="flex items-center gap-3">
                <span className="w-5 text-[13px] font-semibold text-black/35 tabular-nums">{i + 1}</span>
                <span className="flex-1 min-w-0"><span className="block text-[14px] font-medium text-black truncate">{m.name}</span><span className="block h-[5px] mt-1 rounded-full bg-black/[0.06] overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${m.flow}%`, background: m.hue }} /></span></span>
                <span className="text-[13px] font-semibold tabular-nums text-black/70">{m.flow}%</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
      <Card eyebrow="Histórico por hora" title={sel ? `Fluxo · ${sel.name}` : 'Fluxo geral dos monumentos'} action={<span className="text-[12px] text-black/45">Hoje · 00h às 23h</span>}>
        <HourChart data={series} color={sel?.hue ?? '#2c8585'} />
      </Card>
    </div>
  )
}

// ================= VISITANTES (rastreamento) =================
const ago = (t: number) => {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000))
  return s < 60 ? `${s}s` : `${Math.round(s / 60)} min`
}

export function VisitorsView({ events }: { events: TrackEvent[] }) {
  const [sim, setSim] = useState<TrackEvent[]>([])
  useEffect(() => {
    let n = 0
    const push = (age = 0) => {
      const tpl = eventTemplates[Math.floor(Math.random() * eventTemplates.length)]
      const m = monuments[Math.floor(Math.random() * 6)]
      n += 1
      setSim((s) => [{ id: -n, type: tpl.type as TrackEvent['type'], label: tpl.label, monument: m.id, offline: tpl.offline && Math.random() > 0.4, synced: true, at: Date.now() - age, session: 'a' + Math.random().toString(36).slice(2, 6), identified: Math.random() > 0.55 }, ...s].slice(0, 14))
    }
    for (let i = 5; i >= 0; i--) push(i * 41000)
    const t = window.setInterval(() => push(), 2600)
    return () => window.clearInterval(t)
  }, [])
  const feed = [...events.slice(0, 5).map((e) => ({ ...e, mine: true })), ...sim.map((e) => ({ ...e, mine: false }))].slice(0, 12)
  const max = funnel[0].value
  const iconFor: Record<string, IconName> = { nfc_read: 'nfc', qr_scan: 'qr', audio_play: 'speaker', checkin: 'pin', gps_checkin: 'pin', stamp: 'placa', sync: 'sync', audiodesc: 'eye', open_story: 'book', login: 'person', logout: 'person', pe_link: 'book' }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Kpi icon="users" color="#0b2f49" label="Visitantes únicos" value="5.391" delta="9,8%" note="no período" />
        <Kpi icon="person" color="#2c8585" label="Com conta Google" value="38%" delta="6 p.p." note="consentiram" />
        <Kpi icon="route" color="#dda93f" label="Pontos por visita" value="2,7" delta="0,4" note="média" />
        <Kpi icon="sync" color="#c4683a" label="Voltaram em 7 dias" value="41%" delta="3 p.p." note="coorte 20 out" />
      </div>

      <div className="grid grid-cols-[1.25fr_1fr] gap-4">
        <Card eyebrow="Jornada" title="Funil da placa até o próximo ponto">
          <div className="space-y-2.5">
            {funnel.map((f, i) => (
              <div key={f.label}>
                <div className="flex justify-between text-[13px] mb-1"><span className="text-black/75">{f.label}</span><span className="tabular-nums text-black"><b className="font-semibold">{fmt(f.value)}</b><span className="text-black/40"> · {Math.round((f.value / max) * 100)}%</span></span></div>
                <div className="h-7 rounded-[8px] bg-black/[0.04] overflow-hidden"><div className="h-full rounded-[8px] transition-all" style={{ width: `${(f.value / max) * 100}%`, background: ['#0b2f49', '#14506a', '#2c8585', '#58a8a0', '#dda93f'][i] }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-black/50">Maior perda: entre abrir a história e ouvir/assistir (−53%). Sugestão: tocar o áudio automaticamente quando a placa é lida por NFC.</p>
        </Card>
        <Card eyebrow="Tempo real" title="Eventos recebidos" action={<span className="flex items-center gap-1.5 text-[12px] text-[#248a3d] font-semibold"><span className="w-2 h-2 rounded-full bg-[#34c759] live-dot" />Ao vivo</span>}>
          <ul className="space-y-1.5 max-h-[300px] overflow-hidden">
            {feed.map((e) => (
              <li key={(e.mine ? 'm' : 's') + e.id} className={`flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 feed-in ${e.mine ? 'bg-[#2c8585]/[0.07]' : ''}`}>
                <span className="w-7 h-7 rounded-[8px] grid place-items-center bg-black/[0.05] text-black/60 shrink-0"><Icon name={iconFor[e.type] ?? 'bolt'} size={15} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] text-black truncate">{e.label}{e.monument && <span className="text-black/45"> · {monuments.find((m) => m.id === e.monument)?.name}</span>}</span>
                  <span className="block text-[11px] text-black/40 font-mono">{e.identified ? 'usr_' : 'anon_'}{e.session}{e.mine && ' · este protótipo'}</span>
                </span>
                {e.offline && <span className="h-5 px-1.5 rounded-full bg-[#ff9f0a]/15 text-[#a35b00] text-[10px] font-semibold grid place-items-center">{e.synced ? 'offline' : 'na fila'}</span>}
                <span className="text-[11px] text-black/35 tabular-nums w-10 text-right">{ago(e.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-[1fr_1.15fr] gap-4">
        <Card eyebrow="Trajetos" title="Rotas mais percorridas">
          <ul className="space-y-3">
            {journeys.map((j) => (
              <li key={j.path.join()} className="flex items-center gap-3">
                <span className="flex-1 flex flex-wrap items-center gap-1 text-[13px] text-black/80">
                  {j.path.map((p, i) => <span key={p} className="flex items-center gap-1">{i > 0 && <Icon name="chevR" size={12} className="text-black/30" />}<span className="px-2 h-6 rounded-full bg-black/[0.05] grid place-items-center">{p}</span></span>)}
                </span>
                <span className="text-[14px] font-semibold tabular-nums">{j.share}%</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card eyebrow="Retenção" title="Retorno semanal por coorte">
          <table className="w-full text-[12.5px] tabular-nums">
            <thead><tr className="text-black/40"><th className="text-left font-medium pb-2">1º acesso</th><th className="text-left font-medium pb-2">Pessoas</th>{['S0', 'S1', 'S2', 'S3', 'S4'].map((s) => <th key={s} className="font-medium pb-2">{s}</th>)}</tr></thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.week}>
                  <td className="py-[3px] text-black/70">{c.week}</td>
                  <td className="py-[3px] text-black/70">{c.size}</td>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <td key={i} className="p-[2px]">{c.r[i] !== undefined ? <div className="h-7 rounded-[6px] grid place-items-center text-[11.5px] font-semibold" style={{ background: `rgba(44,133,133,${0.12 + (c.r[i] / 100) * 0.88})`, color: c.r[i] > 50 ? '#fff' : '#134f4f' }}>{c.r[i]}%</div> : <div className="h-7 rounded-[6px] bg-black/[0.03]" />}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="rounded-[18px] bg-[#0b2f49] text-white p-5 grid grid-cols-3 gap-6">
        {[
          ['shield', 'Anônimo por padrão', 'Sem conta: ID de sessão aleatório que muda a cada 24 h. Nenhum nome, e-mail ou localização precisa.'],
          ['person', 'Identificado com consentimento', 'Login Google + aceite: jornada entre dias, pseudonimizada (usr_…). O painel nunca mostra nome ou e-mail.'],
          ['lock', 'Retenção e direitos', 'Eventos agregados após 12 meses. Exportar e excluir dados direto no app (LGPD, arts. 18 e 37).'],
        ].map(([ic, t, d]) => (
          <div key={t} className="flex gap-3"><span className="w-9 h-9 rounded-[10px] bg-white/10 grid place-items-center shrink-0 text-[#dda93f]"><Icon name={ic as IconName} size={19} /></span><div><div className="text-[14px] font-semibold">{t}</div><div className="text-[12.5px] text-white/65 leading-snug mt-0.5">{d}</div></div></div>
        ))}
      </div>
    </div>
  )
}

// ================= TRILHA CULTURAL (gamificação) =================
export function TrailView() {
  const levels = [312, 241, 158, 82, 37, 16]
  const lmax = Math.max(...levels)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Kpi icon="users" color="#0b2f49" label="Jogadores ativos (30 dias)" value="846" delta="21%" />
        <Kpi icon="placa" color="#dda93f" label="Carimbos emitidos" value="2.904" delta="17%" />
        <Kpi icon="trophy" color="#2c8585" label="Trilhas completas" value="73" note="8 de 8 pontos" />
        <Kpi icon="book" color="#a8322a" label="Passaportes PE vinculados" value="129" note="proposta de parceria" />
      </div>
      <div className="grid grid-cols-[1.2fr_1fr] gap-4">
        <Card eyebrow="Coleta" title="Carimbos por monumento e método">
          <div className="space-y-3">
            {monuments.map((m) => {
              const total = Math.round(m.views * 0.42)
              const qr = Math.round(total * 0.52), nfc = Math.round(total * 0.38), gps = total - qr - nfc
              return (
                <div key={m.id} className="grid grid-cols-[170px_1fr_60px] items-center gap-3 text-[13px]">
                  <span className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.hue }} /><span className="truncate text-black/80">{m.name}</span></span>
                  <span className="flex h-5 rounded-[6px] overflow-hidden bg-black/[0.04]" style={{ width: `${(total / 780) * 100}%` }}>
                    <span style={{ width: `${(qr / total) * 100}%` }} className="bg-[#2c8585]" /><span style={{ width: `${(nfc / total) * 100}%` }} className="bg-[#0b2f49]" /><span style={{ width: `${(gps / total) * 100}%` }} className="bg-[#dda93f]" />
                  </span>
                  <span className="text-right tabular-nums font-semibold">{fmt(total)}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex gap-4 text-[12px] text-black/55">{[['#2c8585', 'QR Code'], ['#0b2f49', 'Tag NFC'], ['#dda93f', 'GPS (sem placa)']].map(([c, l]) => <span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: c }} />{l}</span>)}</div>
        </Card>
        <div className="space-y-4">
          <Card eyebrow="Progressão" title="Jogadores por nível">
            <div className="flex items-end gap-2 h-[120px]">
              {levels.map((v, i) => <div key={i} className="flex-1 flex flex-col items-center gap-1"><span className="text-[11px] tabular-nums text-black/50">{v}</span><div className="w-full rounded-t-[6px]" style={{ height: `${(v / lmax) * 90}px`, background: i > 3 ? '#dda93f' : '#2c8585' }} /><span className="text-[11px] text-black/45">Nv {i + 1}</span></div>)}
            </div>
          </Card>
          <Card eyebrow="Missões" title="Conclusão das missões">
            {[['Visite 2 monumentos hoje', 64], ['Ouça uma história completa', 41], ['Leia uma tag NFC sem internet', 22]].map(([t, v]) => (
              <div key={t as string} className="mb-2.5"><div className="flex justify-between text-[13px]"><span className="text-black/75">{t}</span><span className="font-semibold tabular-nums">{v}%</span></div><div className="h-[6px] mt-1 rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-[#dda93f]" style={{ width: `${v}%` }} /></div></div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

// ================= TAGS NFC & QR =================
export function TagsView() {
  const statusStyle: Record<string, string> = { Ativa: 'bg-[#34c759]/12 text-[#1f7a38]', 'Placa danificada': 'bg-[#ff3b30]/12 text-[#c4231a]', 'Sem leitura há 7 dias': 'bg-[#ff9f0a]/15 text-[#a35b00]' }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Kpi icon="tag" color="#0b2f49" label="Placas com NFC + QR" value="8 / 8" note="NTAG213–216" />
        <Kpi icon="wifiOff" color="#ff9f0a" label="Leituras offline (30 dias)" value="312" note="15% das leituras NFC" />
        <Kpi icon="sync" color="#2c8585" label="Na fila de sincronização" value="4" note="aparelhos ainda sem rede" />
        <Kpi icon="shield" color="#ff3b30" label="Assinaturas inválidas" value="3" note="tentativas de carimbo falso" />
      </div>
      <Card eyebrow="Inventário" title="Estado das placas e tags" action={<span className="text-[12px] text-black/45">Atualizado agora</span>}>
        <table className="w-full text-[13.5px]">
          <thead><tr className="text-left text-[12px] text-black/40 border-b border-black/[0.07]">{['Placa', 'Monumento', 'Tag', 'Leituras', 'QR / NFC', 'Última leitura', 'Fila offline', 'Estado'].map((h) => <th key={h} className="font-medium pb-2.5 pr-3">{h}</th>)}</tr></thead>
          <tbody>
            {monuments.map((m) => {
              const nfcShare = Math.round(28 + ((Number(m.plate) * 13) % 22))
              return (
                <tr key={m.id} className="border-b border-black/[0.05] last:border-0">
                  <td className="py-3 pr-3 font-mono text-black/55">{m.plate}</td>
                  <td className="py-3 pr-3"><span className="font-medium text-black">{m.name}</span><span className="block text-[12px] text-black/45">{m.area}</span></td>
                  <td className="py-3 pr-3 text-black/70">{m.tag.type}</td>
                  <td className="py-3 pr-3 tabular-nums font-semibold">{fmt(m.views)}</td>
                  <td className="py-3 pr-3"><span className="flex h-2 w-24 rounded-full overflow-hidden bg-black/[0.05]"><span className="bg-[#2c8585]" style={{ width: `${100 - nfcShare}%` }} /><span className="bg-[#0b2f49]" style={{ width: `${nfcShare}%` }} /></span><span className="text-[11px] text-black/45 tabular-nums">{100 - nfcShare}% / {nfcShare}%</span></td>
                  <td className="py-3 pr-3 text-black/60">{m.tag.lastRead}</td>
                  <td className="py-3 pr-3 tabular-nums">{m.tag.pendingOffline || '—'}</td>
                  <td className="py-3"><span className={`h-6 px-2.5 rounded-full text-[12px] font-semibold inline-grid place-items-center ${statusStyle[m.tag.status]}`}>{m.tag.status}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <Card eyebrow="Estudo" title="Funcionamento sem internet">
          <ol className="space-y-2.5 text-[13.5px] text-black/75">
            {[
              ['Tag', 'Registro NDEF com link + texto curto + assinatura ECDSA. NTAG216 tem 888 bytes: cabe resumo de ~300 caracteres.'],
              ['App', 'Pacote offline (≈18 MB) com histórias, áudio e mapa; a assinatura é verificada no aparelho com a chave pública.'],
              ['Fila', 'Check-in com data/hora e assinatura fica no aparelho e sobe quando houver rede; o painel marca como “offline”.'],
              ['Limite', 'iPhone sem app só abre o link da tag (precisa de rede). Leitura offline completa: app nativo (Core NFC) ou Android.'],
            ].map(([k, v], i) => <li key={k} className="flex gap-3"><span className="w-6 h-6 rounded-full bg-[#0b2f49] text-white text-[12px] font-semibold grid place-items-center shrink-0">{i + 1}</span><span><b className="font-semibold text-black">{k}.</b> {v}</span></li>)}
          </ol>
        </Card>
        <Card eyebrow="Alertas" title="Manutenção">
          <ul className="space-y-3">
            {monuments.filter((m) => m.tag.status !== 'Ativa').map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-[12px] bg-black/[0.03] p-3">
                <span className={`w-9 h-9 rounded-[10px] grid place-items-center ${m.tag.status === 'Placa danificada' ? 'bg-[#ff3b30]/12 text-[#c4231a]' : 'bg-[#ff9f0a]/15 text-[#a35b00]'}`}><Icon name="tag" size={18} /></span>
                <span className="flex-1"><span className="block text-[14px] font-medium text-black">{m.name} · placa {m.plate}</span><span className="block text-[12.5px] text-black/50">{m.tag.status === 'Placa danificada' ? 'Relatado por visitantes · QR ilegível, NFC ainda responde' : 'Nenhuma leitura NFC em 7 dias · verificar tag'}</span></span>
                <RarityPill rarity={m.rarity} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

