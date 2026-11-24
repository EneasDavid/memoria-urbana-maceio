// Progresso local-first: funciona sem conta. Fica só neste aparelho (localStorage) até a pessoa escolher sincronizar.
// Nada é enviado ao servidor sem login. LGPD: dado do próprio usuário, no próprio aparelho, apagável a qualquer momento.

export type SaveMode = 'local' | 'nuvem' | null
export interface Progress {
  v: 1
  visited: string[] // ids de monumentos abertos
  trails: Record<string, string[]> // trilha → passos concluídos
  mode: SaveMode // escolha feita no aviso de persistência
}

const KEY = 'mu_progress'
const empty = (): Progress => ({ v: 1, visited: [], trails: {}, mode: null })

export function loadProgress(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): Progress {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return empty()
    const p = JSON.parse(raw)
    if (p?.v !== 1 || !Array.isArray(p.visited) || typeof p.trails !== 'object') return empty()
    return { v: 1, visited: p.visited.filter((x: unknown) => typeof x === 'string').slice(0, 500), trails: p.trails, mode: p.mode === 'local' || p.mode === 'nuvem' ? p.mode : null }
  } catch {
    return empty()
  }
}

export function saveProgress(p: Progress, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage) {
  try { storage?.setItem(KEY, JSON.stringify(p)) } catch { /* modo privado ou cota cheia: segue sem salvar */ }
}

export function markVisited(id: string, p = loadProgress()): Progress {
  if (p.visited.includes(id)) return p
  const next = { ...p, visited: [...p.visited, id] }
  saveProgress(next)
  return next
}

export function toggleStep(trail: string, step: string, p = loadProgress()): Progress {
  const done = new Set(p.trails[trail] || [])
  if (done.has(step)) done.delete(step)
  else done.add(step)
  const next = { ...p, trails: { ...p.trails, [trail]: [...done] } }
  saveProgress(next)
  return next
}

export function setMode(mode: SaveMode, p = loadProgress()): Progress {
  const next = { ...p, mode }
  saveProgress(next)
  return next
}

export function clearProgress(storage: Pick<Storage, 'removeItem'> | undefined = globalThis.localStorage) {
  try { storage?.removeItem(KEY) } catch { /* nada */ }
}
