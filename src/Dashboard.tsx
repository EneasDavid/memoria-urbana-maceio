import { useEffect, useState, type ReactNode } from 'react'
import { Icon, Segmented, LogoMark, EmMaceio, Skyline, Arcs, type IconName } from './ui'
import { monuments, kpis, origins, weekly, hourly, fmt, eventTemplates, type Monument, type Report, type TrackEvent } from './data'
import { Photo } from './MobileScreens'
import { Card, Kpi, HourChart } from './DashboardViews'

// Painel da prefeitura — simples: cadastrar/atualizar monumentos e responder relatos.
// Visitas e API de fluxo são extras.

type View = 'monumentos' | 'relatos' | 'visitas' | 'api'

const ago = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `há ${Math.round(s / 60)} min`
  if (s < 86400) return `há ${Math.round(s / 3600)} h`
  return `há ${Math.round(s / 86400)} d`
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="block text-[12.5px] font-medium text-black/50 mb-1">{label}</span>{children}</label>
}
const input = 'w-full h-10 rounded-[10px] bg-black/[0.04] px-3 text-[14.5px] text-black outline-none focus:ring-2 focus:ring-[#2c8585]/40'

const visitOpts: Monument['visit'][] = ['Aberto', 'Restrito', 'Fechado']

// ================= MONUMENTOS =================
function Editor({ m, onSave, onClose, onPublic }: { m: Monument; onSave: (m: Monument) => void; onClose: () => void; onPublic: (id: string) => void }) {
  const [d, setD] = useState<Monument>({ ...m, facts: m.facts.map((f) => [...f] as [string, string]), sources: m.sources.map((s) => ({ ...s })) })
  const [saved, setSaved] = useState(false)
  const set = <K extends keyof Monument>(k: K, v: Monument[K]) => { setD((x) => ({ ...x, [k]: v })); setSaved(false) }
  return (
    <div className="fixed inset-0 z-[150] flex justify-end bg-black/20 anim-fade" onClick={onClose}>
      <div className="w-[520px] h-full bg-[#f6f3ec] shadow-2xl flex flex-col push-in" onClick={(e) => e.stopPropagation()}>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-black/[0.06] bg-white/70 backdrop-blur-xl">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/[0.05] grid place-items-center"><Icon name="x" size={15} stroke={2.4} /></button>
          <div className="flex-1 min-w-0"><div className="text-[16px] font-semibold truncate">{d.name || 'Novo monumento'}</div><div className="text-[12px] text-black/45">Placa {d.plate}</div></div>
          <button onClick={() => onPublic(d.id)} className="h-9 px-3 rounded-[10px] text-[13px] font-semibold text-[#2c8585] hover:bg-black/[0.04]">Ver página</button>
          <button onClick={() => { onSave(d); setSaved(true) }} className="h-9 px-4 rounded-[10px] bg-[#2c8585] text-white text-[14px] font-semibold">{saved ? 'Salvo ✓' : 'Salvar'}</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="relative h-[180px] rounded-[16px] overflow-hidden"><Photo m={d} className="absolute inset-0" /></div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Foto (URL)"><input className={input} value={d.photo?.src ?? ''} onChange={(e) => set('photo', e.target.value ? { ...{ src: d.photo?.src ?? '', credit: d.photo?.credit ?? '', source: d.photo?.source ?? '', license: d.photo?.license ?? '' }, src: e.target.value } : undefined)} placeholder="https://…" /></Field>
            <Field label="Crédito da foto"><input className={input} value={d.photo?.credit ?? ''} onChange={(e) => set('photo', { ...{ src: d.photo?.src ?? '', credit: d.photo?.credit ?? '', source: d.photo?.source ?? '', license: d.photo?.license ?? '' }, credit: e.target.value })} placeholder="Autor / órgão" /></Field>
            <Field label="Fonte da foto (página)"><input className={input} value={d.photo?.source ?? ''} onChange={(e) => set('photo', { ...{ src: d.photo?.src ?? '', credit: d.photo?.credit ?? '', source: d.photo?.source ?? '', license: d.photo?.license ?? '' }, source: e.target.value })} placeholder="https://…" /></Field>
            <Field label="Licença / autorização"><input className={input} value={d.photo?.license ?? ''} onChange={(e) => set('photo', { ...{ src: d.photo?.src ?? '', credit: d.photo?.credit ?? '', source: d.photo?.source ?? '', license: d.photo?.license ?? '' }, license: e.target.value })} placeholder="Ex.: CC BY 4.0, autorizada por e-mail em…" /></Field>
          </div>
          <Field label="Nome"><input className={input} value={d.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <Field label="Quem/o quê"><input className={input} value={d.role} onChange={(e) => set('role', e.target.value)} /></Field>
            <Segmented value={d.kind} onChange={(v) => set('kind', v)} options={[{ value: 'Estátua', label: 'Estátua' }, { value: 'Busto', label: 'Busto' }, { value: 'Praça', label: 'Praça' }, { value: 'Patrimônio', label: 'Patrimônio' }]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Datas"><input className={input} value={d.years} onChange={(e) => set('years', e.target.value)} /></Field>
            <Field label="Bairro"><input className={input} value={d.area} onChange={(e) => set('area', e.target.value)} /></Field>
          </div>
          <Field label="Endereço"><input className={input} value={d.address} onChange={(e) => set('address', e.target.value)} /></Field>
          <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
            <Field label="Visitação"><Segmented value={d.visit} onChange={(v) => set('visit', v)} options={visitOpts.map((v) => ({ value: v, label: v }))} /></Field>
            <Field label="Aviso de visitação"><input className={input} value={d.visitNote ?? ''} onChange={(e) => set('visitNote', e.target.value)} placeholder="Ex.: área desocupada pela Defesa Civil" /></Field>
          </div>
          <Field label="Resumo (linguagem simples)"><textarea className={`${input} h-auto py-2.5 leading-snug`} rows={5} value={d.summary} onChange={(e) => set('summary', e.target.value)} /></Field>
          <div>
            <div className="text-[12.5px] font-medium text-black/50 mb-1">Ficha</div>
            <div className="space-y-2">
              {d.facts.map(([k, v], i) => (
                <div key={i} className="grid grid-cols-[150px_1fr_32px] gap-2">
                  <input className={input} value={k} onChange={(e) => set('facts', d.facts.map((f, j) => (j === i ? [e.target.value, f[1]] : f)) as [string, string][])} />
                  <input className={input} value={v} onChange={(e) => set('facts', d.facts.map((f, j) => (j === i ? [f[0], e.target.value] : f)) as [string, string][])} />
                  <button onClick={() => set('facts', d.facts.filter((_, j) => j !== i))} className="h-10 rounded-[10px] text-black/35 hover:text-[#c4402e]"><Icon name="x" size={14} /></button>
                </div>
              ))}
              <button onClick={() => set('facts', [...d.facts, ['', '']])} className="h-9 px-3 rounded-[10px] text-[13px] font-semibold text-[#2c8585] flex items-center gap-1.5"><Icon name="plus" size={14} />Adicionar linha</button>
            </div>
          </div>
          <div>
            <div className="text-[12.5px] font-medium text-black/50 mb-1">Fontes (sem Wikipedia)</div>
            <div className="space-y-2">
              {d.sources.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_32px] gap-2">
                  <input className={input} value={s.label} placeholder="Título · veículo · data" onChange={(e) => set('sources', d.sources.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <input className={input} value={s.url} placeholder="https://…" onChange={(e) => set('sources', d.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                  <button onClick={() => set('sources', d.sources.filter((_, j) => j !== i))} className="h-10 rounded-[10px] text-black/35 hover:text-[#c4402e]"><Icon name="x" size={14} /></button>
                </div>
              ))}
              <button onClick={() => set('sources', [...d.sources, { label: '', url: '' }])} className="h-9 px-3 rounded-[10px] text-[13px] font-semibold text-[#2c8585] flex items-center gap-1.5"><Icon name="plus" size={14} />Adicionar fonte</button>
              {d.sources.some((s) => /wikipedia/i.test(s.url)) && <div className="text-[12.5px] text-[#c4402e]">Fontes da Wikipedia não são aceitas — use órgãos oficiais, imprensa ou pesquisa acadêmica.</div>}
            </div>
          </div>
          <Field label="Estado da placa">
            <select className={input} value={d.tag.status} onChange={(e) => set('tag', { ...d.tag, status: e.target.value as Monument['tag']['status'] })}>
              <option>Ativa</option><option>Placa danificada</option><option>Sem leitura há 7 dias</option>
            </select>
          </Field>
        </div>
      </div>
    </div>
  )
}

function Monumentos({ reports, onEdit, onNew }: { reports: Report[]; onEdit: (id: string) => void; onNew: () => void }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'todos' | 'orla' | 'centro' | 'bebedouro' | 'alto'>('todos')
  const list = monuments.filter((m) => (filter === 'todos' || m.group === filter) && (m.name + m.area + m.role).toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 flex-1 max-w-[300px] rounded-[11px] bg-black/[0.05] flex items-center gap-2 px-3"><Icon name="search" size={16} className="text-black/40" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar monumento" className="flex-1 bg-transparent outline-none text-[14.5px]" /></div>
        <Segmented size="sm" value={filter} onChange={setFilter} options={[{ value: 'todos', label: 'Todos' }, { value: 'orla', label: 'Orla' }, { value: 'centro', label: 'Centro' }, { value: 'bebedouro', label: 'Bebedouro' }, { value: 'alto', label: 'Farol/UFAL' }]} />
        <button onClick={onNew} className="ml-auto h-10 px-4 rounded-[11px] bg-[#2c8585] text-white text-[14px] font-semibold flex items-center gap-2"><Icon name="plus" size={16} stroke={2.4} />Novo monumento</button>
      </div>
      <div className="bg-white rounded-[18px] border border-black/[0.06] divide-y divide-black/[0.06]">
        {list.map((m) => {
          const open = reports.filter((r) => r.monument === m.id && r.status !== 'Resolvido').length
          const status = open ? `${open} relato${open > 1 ? 's' : ''}` : m.tag.status === 'Ativa' ? 'Placa ok' : m.tag.status
          const tone = open || m.tag.status === 'Placa danificada' ? 'bg-[#c4402e]/10 text-[#c4402e]' : m.tag.status === 'Ativa' ? 'bg-[#2c8585]/10 text-[#1f6b6b]' : 'bg-[#dda93f]/15 text-[#8a6413]'
          const vt = m.visit === 'Aberto' ? 'text-[#1f6b6b]' : m.visit === 'Restrito' ? 'text-[#8a6413]' : 'text-[#c4402e]'
          return (
            <button key={m.id} onClick={() => onEdit(m.id)} className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-black/[0.02]">
              <Photo m={m} className="w-14 h-14 rounded-[12px] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-[15.5px] font-semibold truncate">{m.name || 'Sem nome'}</span><span className="text-[12px] text-black/40 font-mono">#{m.plate}</span></div>
                <div className="text-[13px] text-black/50 truncate">{m.kind} · {m.role} · {m.area}</div>
              </div>
              <span className={`text-[12.5px] font-semibold w-24 ${vt}`}>{m.visit}</span>
              <span className="text-[12.5px] text-black/45 w-28">{m.sources.length} fonte{m.sources.length !== 1 ? 's' : ''}{m.photo ? '' : ' · sem foto'}</span>
              <span className={`h-7 px-2.5 rounded-full text-[12px] font-semibold grid place-items-center w-36 ${tone}`}>{status}</span>
              <Icon name="chevR" size={15} className="text-black/25" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ================= RELATOS =================
function Relatos({ reports, setStatus, onEdit }: { reports: Report[]; setStatus: (id: number, s: Report['status']) => void; onEdit: (id: string) => void }) {
  const [tab, setTab] = useState<'abertos' | 'resolvidos'>('abertos')
  const list = reports.filter((r) => (tab === 'abertos' ? r.status !== 'Resolvido' : r.status === 'Resolvido')).sort((a, b) => b.at - a.at)
  return (
    <div>
      <div className="mb-4"><Segmented value={tab} onChange={setTab} options={[{ value: 'abertos', label: `Abertos (${reports.filter((r) => r.status !== 'Resolvido').length})` }, { value: 'resolvidos', label: 'Resolvidos' }]} /></div>
      <div className="space-y-3">
        {list.length === 0 && <div className="bg-white rounded-[18px] p-8 text-center text-black/45">Nenhum relato aqui.</div>}
        {list.map((r) => {
          const m = monuments.find((x) => x.id === r.monument)!
          return (
            <div key={r.id} className="bg-white rounded-[18px] border border-black/[0.06] p-4 flex items-center gap-4 feed-in">
              <Photo m={m} className="w-16 h-16 rounded-[12px] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><Icon name="flag" size={15} className="text-[#c4402e]" /><span className="text-[15.5px] font-semibold">{r.kind}</span>{r.photo && <span className="h-5 px-1.5 rounded bg-black/[0.05] text-[11px] text-black/55 grid place-items-center">com foto</span>}</div>
                <div className="text-[13.5px] text-black/60 mt-0.5 truncate">{m.name}{r.note ? ` — “${r.note}”` : ''}</div>
                <div className="text-[12px] text-black/40 mt-0.5">{ago(r.at)} · visitante anônimo</div>
              </div>
              <button onClick={() => onEdit(m.id)} className="h-9 px-3 rounded-[10px] text-[13px] font-semibold text-[#2c8585] hover:bg-black/[0.04]">Abrir</button>
              <Segmented size="sm" value={r.status} onChange={(v) => setStatus(r.id, v)} options={[{ value: 'Novo', label: 'Novo' }, { value: 'Em andamento', label: 'Em andamento' }, { value: 'Resolvido', label: 'Resolvido' }]} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ================= VISITAS (extra) =================
function Visitas({ events }: { events: TrackEvent[] }) {
  const [sim, setSim] = useState<{ id: number; label: string; m: string; at: number; offline: boolean }[]>([])
  useEffect(() => {
    let n = 0
    const push = (age = 0) => {
      const t = eventTemplates[Math.floor(Math.random() * eventTemplates.length)]
      n += 1
      setSim((s) => [{ id: n, label: t.label, m: monuments[Math.floor(Math.random() * monuments.length)].name, at: Date.now() - age, offline: t.offline }, ...s].slice(0, 8))
    }
    for (let i = 4; i >= 0; i--) push(i * 45000)
    const id = window.setInterval(() => push(), 3000)
    return () => window.clearInterval(id)
  }, [])
  const mine = events.slice(0, 4).map((e) => ({ id: -e.id, label: e.label + ' · este protótipo', m: monuments.find((x) => x.id === e.monument)?.name ?? '—', at: e.at, offline: e.offline }))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Kpi icon="eye" color="#0b2f49" label="Leituras de placa (30 dias)" value={fmt(kpis.acessos + events.length)} delta="14%" />
        <Kpi icon="users" color="#2c8585" label="Visitantes únicos" value={fmt(kpis.unicos)} delta="10%" />
        <Kpi icon="nfc" color="#dda93f" label="Por QR / NFC" value="24% / 15%" note="do total" />
        <Kpi icon="download" color="#c4683a" label="Baixaram o app" value="846" note="após a página web" />
      </div>
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <Card eyebrow="Semanal" title="Leituras de placa">
          <div className="h-[170px] flex items-end gap-2">
            {weekly.map((v, i) => <div key={i} className="flex-1 rounded-t-[6px]" style={{ height: `${(v / 1000) * 100}%`, background: i === weekly.length - 1 ? '#0b2f49' : '#2c8585' }} />)}
          </div>
        </Card>
        <Card eyebrow="Origem" title="Como chegam">
          <div className="flex h-3 rounded-full overflow-hidden">{origins.map((o) => <span key={o.label} style={{ width: `${o.value}%`, background: o.color }} />)}</div>
          <ul className="mt-4 space-y-2">{origins.map((o) => <li key={o.label} className="flex items-center gap-2 text-[13px]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: o.color }} /><span className="flex-1 text-black/65">{o.label}</span><b className="tabular-nums font-semibold">{o.value}%</b></li>)}</ul>
        </Card>
      </div>
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <Card eyebrow="Hoje" title="Fluxo por hora (todas as placas)"><HourChart data={hourly} height={130} /></Card>
        <Card eyebrow="Tempo real" title="Últimos eventos" action={<span className="flex items-center gap-1.5 text-[12px] text-[#1f6b6b] font-semibold"><span className="w-2 h-2 rounded-full bg-[#2c8585] live-dot" />ao vivo</span>}>
          <ul className="space-y-2">{[...mine, ...sim].slice(0, 7).map((e) => <li key={e.id} className="text-[13px] flex items-center gap-2 feed-in"><span className="flex-1 truncate"><b className="font-medium">{e.label}</b><span className="text-black/45"> · {e.m}</span></span>{e.offline && <span className="text-[10.5px] text-[#8a6413] font-semibold">offline</span>}<span className="text-[11.5px] text-black/35 w-14 text-right">{ago(e.at)}</span></li>)}</ul>
        </Card>
      </div>
      <p className="text-[12.5px] text-black/45 flex items-center gap-2"><Icon name="shield" size={14} />Contagem anônima e agregada. Números ilustrativos do protótipo.</p>
    </div>
  )
}

// ================= API =================
function Api() {
  const [on, setOn] = useState(false)
  const [key, setKey] = useState<string | null>(null)
  const sample = `GET https://api.memoriaurbana.maceio.br/v1/fluxo?monumento=graciliano&de=2026-11-01&ate=2026-11-07&por=hora

{
  "monumento": "graciliano",
  "nome": "Graciliano Ramos",
  "bairro": "Pajuçara",
  "visitacao": "aberto",
  "leituras": [
    { "hora": "2026-11-07T17:00-03:00", "total": 92, "qr": 51, "nfc": 34, "offline": 7 },
    { "hora": "2026-11-07T18:00-03:00", "total": 84, "qr": 46, "nfc": 31, "offline": 7 }
  ],
  "privacidade": "agregado, anônimo, mínimo de 10 pessoas por célula"
}`
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
      <Card eyebrow="Beta" title="API de fluxo de visitas">
        <p className="text-[14px] text-black/60 leading-snug">Dados de visitação por monumento para turismo, mobilidade, segurança e pesquisa. Só contagens agregadas e anônimas.</p>
        <pre className="mt-4 rounded-[14px] bg-[#0b2f49] text-[#e8f1f1] text-[12px] leading-[1.55] p-4 overflow-x-auto font-mono">{sample}</pre>
        <div className="mt-4 grid grid-cols-3 gap-3 text-[13px]">
          {[['GET /v1/monumentos', 'Lista com placa, tipo, visitação e coordenadas'], ['GET /v1/fluxo', 'Leituras por hora, dia ou semana'], ['GET /v1/relatos/abertos', 'Situação das obras, sem dados pessoais']].map(([e, d]) => (
            <div key={e} className="rounded-[12px] bg-black/[0.03] p-3"><div className="font-mono text-[12px] font-semibold text-[#1f6b6b]">{e}</div><div className="text-black/55 mt-1 leading-snug">{d}</div></div>
          ))}
        </div>
      </Card>
      <div className="space-y-4">
        <Card title="Publicação">
          <div className="flex items-center justify-between"><span className="text-[14.5px]">Publicar como dados abertos</span>
            <button role="switch" aria-checked={on} onClick={() => setOn(!on)} className={`relative w-[51px] h-[31px] rounded-full transition-colors ${on ? 'bg-[#2c8585]' : 'bg-black/15'}`}><span className={`absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-[2px]'}`} /></button>
          </div>
          <p className="mt-2 text-[12.5px] text-black/50">{on ? 'Disponível como CSV + JSON no portal de dados.' : 'Desligado: só parceiros com chave acessam.'}</p>
        </Card>
        <Card title="Chave de acesso">
          {key ? <div className="font-mono text-[13px] bg-black/[0.04] rounded-[10px] px-3 py-2.5 break-all">{key}</div> : <p className="text-[13.5px] text-black/55">Gere uma chave para um parceiro (secretaria, universidade, turismo).</p>}
          <button onClick={() => setKey('mu_live_' + Math.random().toString(36).slice(2, 10) + '…')} className="mt-3 w-full h-10 rounded-[11px] bg-[#0b2f49] text-white text-[14px] font-semibold">{key ? 'Gerar outra' : 'Gerar chave'}</button>
          <p className="mt-2 text-[12px] text-black/45">Limite: 1.000 chamadas/dia · cache de 15 min.</p>
        </Card>
      </div>
    </div>
  )
}

export function Dashboard({ events, reports, setReports, bump, onPublic }: { events: TrackEvent[]; reports: Report[]; setReports: (r: Report[]) => void; bump: () => void; onPublic: (id?: string) => void }) {
  const [view, setView] = useState<View>('monumentos')
  const [editing, setEditing] = useState<string | null>(null)
  const openReports = reports.filter((r) => r.status === 'Novo').length

  const nav: [View, IconName, string, string?][] = [
    ['monumentos', 'building', 'Monumentos'],
    ['relatos', 'flag', 'Relatos'],
    ['visitas', 'chart', 'Visitas', 'extra'],
    ['api', 'code', 'API de fluxo', 'beta'],
  ]
  const titles: Record<View, [string, string]> = {
    monumentos: ['Monumentos', 'Cadastre e atualize as páginas que abrem pelas placas.'],
    relatos: ['Relatos', 'Problemas avisados pelos visitantes, em 2 toques e sem cadastro.'],
    visitas: ['Visitas', 'Acompanhamento anônimo das leituras das placas.'],
    api: ['API de fluxo', 'Dados agregados de visitação para parceiros e dados abertos.'],
  }
  const newMonument = () => {
    const n = monuments.length + 1
    const m: Monument = {
      id: 'novo-' + n, plate: String(n).padStart(2, '0'), name: '', role: '', years: '', area: 'Centro', address: '', kind: 'Busto', group: 'centro', visit: 'Aberto', rarity: 'Comum', xp: 80,
      lat: -9.6658, lng: -35.7352, x: 70 + n * 3, y: 540, hue: '#2c8585', views: 0, change: 0, flow: 0, summary: '', facts: [['Escultor', '']], sources: [],
      museum: { name: '', address: '', why: '' },
      tag: { type: 'NTAG216', status: 'Ativa', lastRead: '—', pendingOffline: 0 },
    }
    monuments.push(m)
    bump()
    setEditing(m.id)
  }

  return (
    <div className="flex h-full bg-[#f6f3ec] text-black mu-desktop">
      <aside className="w-[232px] shrink-0 bg-white/60 backdrop-blur-2xl border-r border-black/[0.06] flex flex-col pt-5 pb-4 px-3">
        <div className="px-2 mb-6">
          <div className="flex items-center gap-2.5">
            <LogoMark size={44} />
            <div className="leading-tight">
              <div className="text-[14.5px] font-bold text-[#0b2f49] mu-ink">Memória Urbana</div>
              <EmMaceio className="text-[11.5px] gap-1.5 [&>span]:w-3" />
            </div>
          </div>
          <div className="mt-3 inline-flex h-6 items-center gap-1.5 rounded-full bg-[#0b2f49]/[0.07] px-2.5 text-[11.5px] font-semibold text-[#0b2f49] mu-ink"><Icon name="placa" size={13} />Painel da Prefeitura</div>
        </div>
        <nav className="space-y-0.5">
          {nav.map(([id, ic, l, tag]) => (
            <button key={id} onClick={() => setView(id)} className={`w-full h-10 px-2.5 rounded-[10px] flex items-center gap-2.5 text-[14.5px] transition-colors ${view === id ? 'bg-[#2c8585]/12 text-[#1f6b6b] font-semibold' : 'text-black/70 hover:bg-black/[0.04]'}`}>
              <Icon name={ic} size={18} />{l}
              {id === 'relatos' && openReports > 0 && <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-[#c4402e] text-white text-[11px] font-semibold grid place-items-center">{openReports}</span>}
              {tag && <span className="ml-auto text-[10.5px] uppercase tracking-[0.06em] text-black/35 font-semibold">{tag}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <Skyline className="block w-full h-9 mb-3 opacity-80" />
          <button onClick={() => onPublic()} className="w-full h-9 px-2.5 rounded-[10px] flex items-center gap-2.5 text-[14px] text-black/65 hover:bg-black/[0.04]"><Icon name="globe" size={17} />Ver site público</button>
          <div className="flex items-center gap-2.5 px-2 pt-3 mt-2 border-t border-black/[0.08]">
            <span className="w-8 h-8 rounded-full bg-[#0b2f49] text-white text-[12px] font-semibold grid place-items-center">FM</span>
            <div className="leading-tight"><div className="text-[13px] font-semibold">FMAC · Patrimônio</div><div className="text-[11.5px] text-black/45">Prefeitura de Maceió</div></div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1120px] mx-auto px-8 pt-8 pb-12">
          <h1 className="text-[32px] font-bold tracking-[-0.025em]">{titles[view][0]}</h1>
          <Arcs className="mt-2" />
          <p className="mt-2 mb-6 text-[14.5px] text-black/50">{titles[view][1]}</p>
          {view === 'monumentos' && <Monumentos reports={reports} onEdit={setEditing} onNew={newMonument} />}
          {view === 'relatos' && <Relatos reports={reports} setStatus={(id, s) => setReports(reports.map((r) => (r.id === id ? { ...r, status: s } : r)))} onEdit={setEditing} />}
          {view === 'visitas' && <Visitas events={events} />}
          {view === 'api' && <Api />}
        </div>
      </main>
      {editing && (
        <Editor
          key={editing}
          m={monuments.find((x) => x.id === editing)!}
          onClose={() => setEditing(null)}
          onPublic={(id) => onPublic(id)}
          onSave={(d) => { const i = monuments.findIndex((x) => x.id === d.id); if (i >= 0) monuments[i] = d; bump() }}
        />
      )}
    </div>
  )
}
