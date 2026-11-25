// Progresso salvo online (/api/progress) e regras de junção: nada se perde e selo de outra conta é recusado.
// Os handlers usam imports .js (NodeNext): roda sobre o build de `pnpm build:server`.
import { test, before } from 'node:test'
import { existsSync } from 'node:fs'
import assert from 'node:assert/strict'
import { sign } from '../api/_lib/session.ts'
import { mergeDocs, sanitizeDoc, emptyDoc } from '../api/_lib/progressDoc.ts'

const SECRET = 'p'.repeat(48)
let api
before(async () => {
  Object.assign(process.env, { FIREBASE_WEB_API_KEY: 'chave-web-publica-de-teste', SESSION_SECRET: SECRET, PROGRESS_MEMORY: '1' })
  assert.ok(existsSync('server/build/api/progress.js'), 'rode `pnpm build:server` antes')
  api = await import('../server/build/api/progress.js')
})

const exp = () => Math.floor(Date.now() / 1000) + 3600
const cookieFor = async (sub) => `mu_session=${encodeURIComponent(await sign({ sub, name: 'X', email: `${sub}@x.com`, role: 'visitante', exp: exp() }, SECRET))}`
const req = async (method, sub, doc, origin = 'https://site.test') =>
  new Request('https://site.test/api/progress', {
    method,
    headers: { ...(sub ? { cookie: await cookieFor(sub) } : {}), origin, host: 'site.test', 'content-type': 'application/json' },
    body: doc ? JSON.stringify({ doc }) : undefined,
  })

test('junção não perde nada: união de selos, menor data, maior pontuação', () => {
  const a = sanitizeDoc({ collected: ['nise'], xp: 50, stampLog2: { nise: { at: 200, method: 'qr', count: 1 } }, heard: ['nise'] })
  const b = sanitizeDoc({ collected: ['graciliano'], xp: 80, stampLog2: { nise: { at: 100, method: 'nfc', count: 3 }, graciliano: { at: 300, method: 'qr', count: 1 } } })
  const m = mergeDocs(a, b)
  assert.deepEqual(m.collected.sort(), ['graciliano', 'nise'])
  assert.equal(m.xp, 80)
  assert.equal(m.stampLog2.nise.at, 100)
  assert.equal(m.stampLog2.nise.count, 3)
  assert.deepEqual(m.heard, ['nise'])
})

test('dados inválidos são descartados na entrada', () => {
  const d = sanitizeDoc({ collected: ['ok', '<script>', 42], xp: -5, stampLog2: { ok: { at: 1, method: 'hack', count: 1 } } })
  assert.deepEqual(d.collected, ['ok'])
  assert.equal(d.xp, 0)
  assert.deepEqual(d.stampLog2, {})
})

test('sem login: 401; de outra origem: 403', async () => {
  assert.equal((await api.GET(await req('GET'))).status, 401)
  assert.equal((await api.PUT(await req('PUT', 'a', emptyDoc(), 'https://mal.example'))).status, 403)
})

test('salva online e volta em outro aparelho, com prova de dono em cada selo', async () => {
  const put = await api.PUT(await req('PUT', 'conta-a', { collected: ['nise'], xp: 50 }))
  assert.equal(put.status, 200)
  const saved = (await put.json()).doc
  assert.match(saved.stampLog2.nise.proof, /^[A-Za-z0-9_-]{43}$/)
  // "outro aparelho": só o cookie da conta, nada local
  const got = await (await api.GET(await req('GET', 'conta-a'))).json()
  assert.deepEqual(got.doc.collected, ['nise'])
  assert.equal(got.doc.xp, 50)
})

test('envio de um aparelho não apaga o que outro aparelho já salvou', async () => {
  await api.PUT(await req('PUT', 'conta-b', { collected: ['nise'] }))
  const r = await (await api.PUT(await req('PUT', 'conta-b', { collected: ['graciliano'] }))).json()
  assert.deepEqual(r.doc.collected.sort(), ['graciliano', 'nise'])
})

test('selo com prova de OUTRA conta é recusado', async () => {
  const a = await (await api.PUT(await req('PUT', 'dona', { collected: ['nise'] }))).json()
  const copiado = { collected: ['nise'], stampLog2: { nise: a.doc.stampLog2.nise } } // prova da "dona"
  const r = await (await api.PUT(await req('PUT', 'outra', copiado))).json()
  assert.deepEqual(r.rejected, ['nise'])
  assert.deepEqual(r.doc.collected, [])
})
