// Cofre de cada conta no aparelho + cópia online.
//
// Aparelho
// - Cada conta tem suas chaves (mu_app:<conta>:collected, …:xp, …:stampLog2 etc.). Várias contas convivem no mesmo
//   aparelho sem misturar, e SAIR NÃO APAGA NADA: ao entrar de novo, selos, pontos e passaporte estão lá.
// - Selo de dono (mu_app:<conta>:seal): assinatura HMAC de "id da conta + dados", feita com uma chave do aparelho
//   que fica no IndexedDB e não pode ser lida nem copiada por JavaScript (CryptoKey não extraível).
//   Ao abrir o app, a assinatura é conferida: se os dados foram copiados de outra conta ou alterados à mão,
//   vão para quarentena (mu_quarantine:…), não aparecem para esta conta, e a cópia online (se houver) é restaurada.
// - mu_app:<conta>:dirty marca uma gravação ainda não assinada (aba fechada no meio): não conta como adulteração.
//
// Online (conta Google)
// - /api/progress guarda o progresso por conta no servidor (sessão em cookie HttpOnly; o navegador nunca vê token).
// - Ao abrir: junta aparelho + servidor sem perder nada. A cada mudança: envia (com espera curta), e ao fechar a aba.
// - Cada selo no servidor recebe prova de dono (HMAC do servidor); selo com prova de outra conta é recusado.
// - Perfil só no aparelho (sem Google) fica só no cofre local.
import { PROGRESS_FIELDS, canonical, emptyDoc, isEmptyDoc, mergeDocs, sanitizeDoc, type ProgressDoc } from '../../api/_lib/progressDoc.ts'
import type { SessionUser } from '../features/auth/useSession'

export { PROGRESS_FIELDS }
const LS = 'mu_app:'
const k = (acct: string, f: string) => `${LS}${acct}:${f}`

export type VaultStatus = 'new' | 'ok' | 'legacy' | 'foreign' | 'tampered'
export type OnlineStatus = 'synced' | 'offline' | 'unavailable' | 'local'
export interface VaultResult { status: VaultStatus; online: OnlineStatus; quarantined?: string }

// ---------- leitura e escrita do cofre ----------
export function readLocal(acct: string): ProgressDoc {
  const raw: Record<string, unknown> = {}
  try {
    for (const f of PROGRESS_FIELDS) {
      const v = localStorage.getItem(k(acct, f))
      if (v != null) raw[f] = JSON.parse(v)
    }
  } catch { /* modo privado ou JSON quebrado: segue com o que deu para ler */ }
  return sanitizeDoc(raw)
}

function hasLocal(acct: string): boolean {
  try { return PROGRESS_FIELDS.some((f) => localStorage.getItem(k(acct, f)) != null) } catch { return false }
}

export function writeLocal(acct: string, doc: ProgressDoc) {
  try { for (const f of PROGRESS_FIELDS) localStorage.setItem(k(acct, f), JSON.stringify(doc[f])) } catch { /* cota cheia */ }
}

function removeLocal(acct: string) {
  try { for (const f of [...PROGRESS_FIELDS, 'seal', 'dirty']) localStorage.removeItem(k(acct, f)) } catch { /* nada */ }
}

// ---------- chave do aparelho (não extraível) ----------
let keyPromise: Promise<CryptoKey | null> | null = null
function deviceKey(): Promise<CryptoKey | null> {
  return (keyPromise ??= new Promise<CryptoKey | null>((resolve) => {
    try {
      if (!globalThis.indexedDB || !crypto?.subtle) return resolve(null)
      const req = indexedDB.open('mu_vault', 1)
      req.onupgradeneeded = () => req.result.createObjectStore('k')
      req.onerror = () => resolve(null)
      req.onsuccess = () => {
        const db = req.result
        const get = db.transaction('k').objectStore('k').get('hmac')
        get.onerror = () => resolve(null)
        get.onsuccess = async () => {
          if (get.result) return resolve(get.result as CryptoKey)
          try {
            const key = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
            const put = db.transaction('k', 'readwrite').objectStore('k').put(key, 'hmac')
            put.onsuccess = () => resolve(key)
            put.onerror = () => resolve(null)
          } catch { resolve(null) }
        }
      }
    } catch { resolve(null) }
  }))
}

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
async function signature(owner: string, acct: string, doc: ProgressDoc): Promise<string> {
  const msg = new TextEncoder().encode(`mu-vault|1|${owner}|${acct}|${canonical(doc)}`)
  const key = await deviceKey()
  // Sem IndexedDB (aba anônima de alguns navegadores): só o resumo SHA-256, que ainda amarra os dados ao dono
  return key ? 'h:' + hex(await crypto.subtle.sign('HMAC', key, msg)) : 's:' + hex(await crypto.subtle.digest('SHA-256', msg))
}

interface Seal { v: 1; owner: string; sig: string }
function readSeal(acct: string): Seal | null {
  try {
    const s = JSON.parse(localStorage.getItem(k(acct, 'seal')) || 'null')
    return s && s.v === 1 && typeof s.owner === 'string' && typeof s.sig === 'string' ? s : null
  } catch { return null }
}

export async function sealAccount(acct: string, owner: string) {
  try {
    const sig = await signature(owner, acct, readLocal(acct))
    localStorage.setItem(k(acct, 'seal'), JSON.stringify({ v: 1, owner, sig } satisfies Seal))
    localStorage.removeItem(k(acct, 'dirty'))
  } catch { /* sem crypto: segue sem selo */ }
}

/** Confere se o que está no cofre desta conta é mesmo desta conta. */
export async function verifyLocal(acct: string, owner: string): Promise<VaultStatus> {
  const seal = readSeal(acct)
  if (!hasLocal(acct)) return 'new'
  if (!seal) return 'legacy' // dados de antes do selo: aceitos uma vez e assinados agora
  if (seal.owner !== owner) return 'foreign'
  try {
    if (seal.sig === (await signature(owner, acct, readLocal(acct)))) return 'ok'
    // O tipo de assinatura mudou (ex.: IndexedDB apagado): não dá para conferir, então não pune a pessoa
    if (seal.sig.slice(0, 2) !== (await signature(owner, acct, emptyDoc())).slice(0, 2)) return 'legacy'
  } catch { return 'ok' }
  if (localStorage.getItem(k(acct, 'dirty')) === owner) return 'ok' // gravação interrompida antes de assinar
  return 'tampered'
}

/** Tira os dados do cofre sem destruir (podem ser conferidos depois). Devolve a chave da quarentena. */
function quarantine(acct: string): string {
  const qk = `mu_quarantine:${acct}:${Date.now()}`
  try {
    const raw: Record<string, string | null> = {}
    for (const f of [...PROGRESS_FIELDS, 'seal']) raw[f] = localStorage.getItem(k(acct, f))
    localStorage.setItem(qk, JSON.stringify(raw))
  } catch { /* cota cheia: ainda assim não mostra para esta conta */ }
  removeLocal(acct)
  return qk
}

// ---------- servidor ----------
type Remote = { ok: true; doc: ProgressDoc } | { ok: false; why: 'offline' | 'unavailable' }
async function remote(method: 'GET' | 'PUT', doc?: ProgressDoc, keepalive = false): Promise<Remote> {
  try {
    const r = await fetch('/api/progress', {
      method,
      credentials: 'same-origin',
      keepalive,
      headers: { Accept: 'application/json', ...(doc ? { 'Content-Type': 'application/json' } : {}) },
      body: doc ? JSON.stringify({ doc }) : undefined,
    })
    if (!(r.headers.get('content-type') || '').includes('application/json')) return { ok: false, why: 'unavailable' }
    const body = (await r.json()) as { doc?: unknown }
    return r.ok && body.doc ? { ok: true, doc: sanitizeDoc(body.doc) } : { ok: false, why: 'unavailable' }
  } catch {
    return { ok: false, why: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'unavailable' }
  }
}

// ---------- conta ativa ----------
let active: { acct: string; owner: string; online: boolean } | null = null
let sealTimer: ReturnType<typeof setTimeout> | undefined
let syncTimer: ReturnType<typeof setTimeout> | undefined

/** Chamado pelo app a cada gravação (síncrono): marca como não assinado e agenda assinatura e envio. */
export function noteWrite(acct: string) {
  if (!active || active.acct !== acct) return
  try { localStorage.setItem(k(acct, 'dirty'), active.owner) } catch { /* nada */ }
  clearTimeout(sealTimer)
  sealTimer = setTimeout(() => { if (active) void sealAccount(active.acct, active.owner) }, 250)
  if (active.online) { clearTimeout(syncTimer); syncTimer = setTimeout(() => void pushNow(), 1500) }
}

export async function pushNow(keepalive = false): Promise<boolean> {
  if (!active?.online) return false
  clearTimeout(syncTimer)
  const doc = readLocal(active.acct)
  if (isEmptyDoc(doc)) return true
  return (await remote('PUT', doc, keepalive)).ok
}

let listening = false
function listen() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('online', () => void pushNow())
  window.addEventListener('pagehide', () => void pushNow(true)) // fechar a aba ou o app não perde o último selo
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void pushNow(true) })
}

/** Abre o cofre da conta antes do app ler qualquer dado: confere o dono, junta com a nuvem e assina. */
export async function openVault(user: SessionUser): Promise<VaultResult> {
  const acct = user.email, owner = user.sub
  const cloud = !user.local && !user.demo
  active = { acct, owner, online: cloud }
  try { sessionStorage.setItem('mu_session', owner) } catch { /* nada */ }
  rememberAccount(acct, owner)

  const status = await verifyLocal(acct, owner)
  const quarantined = status === 'foreign' || status === 'tampered' ? quarantine(acct) : undefined
  let online: OnlineStatus = cloud ? 'unavailable' : 'local'

  if (cloud) {
    const local = readLocal(acct)
    const got = await remote('GET')
    if (got.ok) {
      const merged = mergeDocs(got.doc, local)
      writeLocal(acct, merged)
      if (canonical(merged) !== canonical(got.doc)) {
        const put = await remote('PUT', merged)
        if (put.ok) writeLocal(acct, put.doc) // volta com a prova de dono de cada selo
      }
      online = 'synced'
    } else online = got.why
    listen()
  }
  await sealAccount(acct, owner)
  return { status, online, quarantined }
}

// ---------- contas conhecidas neste aparelho ----------
function rememberAccount(acct: string, owner: string) {
  try {
    const list = JSON.parse(localStorage.getItem('mu_accounts') || '{}') as Record<string, string>
    if (list[acct] !== owner) { list[acct] = owner; localStorage.setItem('mu_accounts', JSON.stringify(list)) }
  } catch { /* nada */ }
}

/** Sair: encerra só a sessão. Os dados da conta continuam guardados (e na nuvem, com Google). */
export async function endSession() {
  await pushNow().catch(() => false)
  active = null
  try {
    sessionStorage.removeItem('mu_session')
    // leituras feitas sem conta já foram creditadas a quem entrou: não passam para a próxima pessoa
    const p = JSON.parse(localStorage.getItem('mu_progress') || 'null')
    if (p?.stamps?.length) localStorage.setItem('mu_progress', JSON.stringify({ ...p, stamps: [] }))
  } catch { /* nada */ }
}

/** Apagar de verdade os dados de UMA conta neste aparelho (pedido explícito da pessoa, LGPD). */
export function wipeAccount(acct: string) {
  removeLocal(acct)
  try {
    const list = JSON.parse(localStorage.getItem('mu_accounts') || '{}') as Record<string, string>
    delete list[acct]
    localStorage.setItem('mu_accounts', JSON.stringify(list))
  } catch { /* nada */ }
}
