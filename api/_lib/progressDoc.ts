// Progresso da Trilha de uma conta (selos, pontos, passaporte, áudios ouvidos, relatos).
// Mesmo formato no aparelho (localStorage mu_app:<conta>:<campo>) e no servidor (/api/progress).
// Este arquivo não importa nada: é usado pelo front (src/shared/deviceData.ts), pela API e pelos testes.

export type StampMethod = 'qr' | 'nfc' | 'gps' | 'placa' | 'grupo'
export interface StampEntry { at: number; last?: number; method: StampMethod; count: number; group?: string[]; by?: string; proof?: string }
export interface MyReportEntry { kind: string; note?: string; photo?: boolean; at: number }
export interface ProgressDoc {
  collected: string[]
  pending: string[]
  xp: number
  stampLog2: Record<string, StampEntry>
  heard: string[]
  arUsed: boolean
  myReports: Record<string, MyReportEntry[]>
}

/** Campos guardados por conta. O MobileApp persiste exatamente estes. */
export const PROGRESS_FIELDS = ['collected', 'pending', 'xp', 'stampLog2', 'heard', 'arUsed', 'myReports'] as const
export type ProgressField = (typeof PROGRESS_FIELDS)[number]

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/
const METHODS = new Set(['qr', 'nfc', 'gps', 'placa', 'grupo'])
const MAX = 500

export const emptyDoc = (): ProgressDoc => ({ collected: [], pending: [], xp: 0, stampLog2: {}, heard: [], arUsed: false, myReports: {} })

const ids = (v: unknown): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && ID.test(x)))].slice(0, MAX) : [])
const num = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(Math.floor(v), max) : 0)
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[<>]/g, '').slice(0, max) : undefined)

/** Aceita qualquer coisa (JSON do aparelho ou do corpo da requisição) e devolve só o que é válido. */
export function sanitizeDoc(raw: unknown): ProgressDoc {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const log: Record<string, StampEntry> = {}
  if (r.stampLog2 && typeof r.stampLog2 === 'object') {
    for (const [id, e] of Object.entries(r.stampLog2 as Record<string, Record<string, unknown>>).slice(0, MAX)) {
      if (!ID.test(id) || !e || typeof e !== 'object' || !METHODS.has(e.method as string)) continue
      const entry: StampEntry = { at: num(e.at, 9e15), method: e.method as StampMethod, count: Math.max(1, num(e.count, 1e6)) }
      if (e.last != null) entry.last = num(e.last, 9e15)
      if (Array.isArray(e.group)) entry.group = e.group.filter((x): x is string => typeof x === 'string').slice(0, 20).map((x) => x.slice(0, 80))
      if (typeof e.by === 'string') entry.by = str(e.by, 80)
      if (typeof e.proof === 'string' && /^[A-Za-z0-9_-]{20,100}$/.test(e.proof)) entry.proof = e.proof
      log[id] = entry
    }
  }
  const reports: Record<string, MyReportEntry[]> = {}
  if (r.myReports && typeof r.myReports === 'object') {
    for (const [id, list] of Object.entries(r.myReports as Record<string, unknown>).slice(0, MAX)) {
      if (!ID.test(id) || !Array.isArray(list)) continue
      reports[id] = list
        .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && typeof (x as { kind?: unknown }).kind === 'string')
        .slice(-20)
        .map((x) => ({ kind: str(x.kind, 40)!, at: num(x.at, 9e15), ...(x.note ? { note: str(x.note, 500) } : {}), ...(x.photo ? { photo: true } : {}) }))
    }
  }
  const collected = ids(r.collected)
  return {
    collected,
    pending: ids(r.pending).filter((id) => !collected.includes(id)),
    xp: num(r.xp, 1e7),
    stampLog2: log,
    heard: ids(r.heard),
    arUsed: r.arUsed === true,
    myReports: reports,
  }
}

/** Junta duas cópias sem perder nada: união de selos, menor data de conquista, maior contagem e maior pontuação. */
export function mergeDocs(a: ProgressDoc, b: ProgressDoc): ProgressDoc {
  const collected = [...new Set([...a.collected, ...b.collected])].slice(0, MAX)
  const log: Record<string, StampEntry> = { ...a.stampLog2 }
  for (const [id, e] of Object.entries(b.stampLog2)) {
    const o = log[id]
    if (!o) { log[id] = e; continue }
    const first = e.at && (!o.at || e.at < o.at) ? e : o
    const last = Math.max(o.last ?? o.at, e.last ?? e.at)
    log[id] = { ...first, count: Math.max(o.count, e.count), ...(last ? { last } : {}), proof: o.proof || e.proof }
    if (!log[id].proof) delete log[id].proof
  }
  const reports: Record<string, MyReportEntry[]> = { ...a.myReports }
  for (const [id, list] of Object.entries(b.myReports)) {
    const seen = new Set((reports[id] || []).map((x) => `${x.at}|${x.kind}`))
    reports[id] = [...(reports[id] || []), ...list.filter((x) => !seen.has(`${x.at}|${x.kind}`))].sort((x, y) => x.at - y.at).slice(-20)
  }
  return {
    collected,
    pending: [...new Set([...a.pending, ...b.pending])].filter((id) => !collected.includes(id)).slice(0, MAX),
    xp: Math.max(a.xp, b.xp),
    stampLog2: log,
    heard: [...new Set([...a.heard, ...b.heard])].slice(0, MAX),
    arUsed: a.arUsed || b.arUsed,
    myReports: reports,
  }
}

export const isEmptyDoc = (d: ProgressDoc) => !d.collected.length && !d.pending.length && !d.xp && !d.heard.length && !d.arUsed && !Object.keys(d.myReports).length && !Object.keys(d.stampLog2).length

/** JSON com chaves em ordem: a mesma informação gera sempre o mesmo texto (base das assinaturas). */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter((k) => (v as Record<string, unknown>)[k] !== undefined).map((k) => JSON.stringify(k) + ':' + canonical((v as Record<string, unknown>)[k])).join(',') + '}'
  return JSON.stringify(v ?? null)
}
