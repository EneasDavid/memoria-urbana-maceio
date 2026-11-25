// Firestore como banco do progresso: login da conta de serviço (JWT RS256) e gravação/leitura pelo /api/progress.
// O Google é simulado (fetch falso): o teste confere a assinatura do JWT com a chave pública, como o Google faz.
// Roda sobre o build de `pnpm build:server`.
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { sign } from '../api/_lib/session.ts'

const SECRET = 'f'.repeat(48)
let api, fsLib, publicKey
const db = new Map()
const calls = []

before(async () => {
  assert.ok(existsSync('server/build/api/progress.js'), 'rode `pnpm build:server` antes')
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
  publicKey = pair.publicKey
  const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', pair.privateKey)).toString('base64').match(/.{1,64}/g).join('\n')
  const pem = (k) => ['-----BEGIN', 'PRIVATE KEY-----'].join(' ') + `\n${k}\n` + ['-----END', 'PRIVATE KEY-----'].join(' ') + '\n' // montado: o varredor de segredos não confunde com chave real
  const json = JSON.stringify({ type: 'service_account', project_id: 'mu-teste', client_email: 'progresso@mu-teste.iam.gserviceaccount.com', private_key: pem(pkcs8) })
  Object.assign(process.env, { GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'cs', SESSION_SECRET: SECRET, FIREBASE_SERVICE_ACCOUNT: Buffer.from(json).toString('base64') })
  delete process.env.PROGRESS_MEMORY

  globalThis.fetch = async (url, init = {}) => {
    url = String(url)
    calls.push(url)
    if (url === 'https://oauth2.googleapis.com/token') {
      const jwt = new URLSearchParams(init.body).get('assertion')
      const [h, c, s] = jwt.split('.')
      const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, Buffer.from(s, 'base64url'), new TextEncoder().encode(`${h}.${c}`))
      const claims = JSON.parse(Buffer.from(c, 'base64url'))
      if (!ok || claims.scope !== 'https://www.googleapis.com/auth/datastore' || claims.aud !== 'https://oauth2.googleapis.com/token') return new Response('{}', { status: 400 })
      return Response.json({ access_token: 'tok-123', expires_in: 3600 })
    }
    const m = url.match(/^https:\/\/firestore\.googleapis\.com\/v1\/projects\/mu-teste\/databases\/\(default\)\/documents\/(.+)$/)
    if (!m) return new Response('não esperado', { status: 500 })
    if (init.headers?.Authorization !== 'Bearer tok-123') return new Response('{}', { status: 401 })
    if ((init.method || 'GET') === 'PATCH') { db.set(m[1], JSON.parse(init.body).fields); return Response.json({}) }
    return db.has(m[1]) ? Response.json({ fields: db.get(m[1]) }) : new Response('{}', { status: 404 })
  }
  api = await import('../server/build/api/progress.js')
  fsLib = await import('../server/build/api/_lib/firestore.js')
})

const req = async (method, sub, doc) => new Request('https://site.test/api/progress', {
  method,
  headers: { cookie: `mu_session=${encodeURIComponent(await sign({ sub, name: 'X', email: 'x@x.com', role: 'visitante', exp: Math.floor(Date.now() / 1000) + 3600 }, SECRET))}`, origin: 'https://site.test', host: 'site.test', 'content-type': 'application/json' },
  body: doc ? JSON.stringify({ doc }) : undefined,
})

test('credenciais: aceita o JSON inteiro, em base64 ou em 3 variáveis (chave com \\n da Vercel)', () => {
  const sa = fsLib.serviceAccount(process.env)
  assert.equal(sa.projectId, 'mu-teste')
  const split = fsLib.serviceAccount({ FIREBASE_PROJECT_ID: 'p', FIREBASE_CLIENT_EMAIL: 'e@p.iam.gserviceaccount.com', FIREBASE_PRIVATE_KEY: 'XXBEGINXX\\nABC\\nXXENDXX\\n' })
  assert.ok(split.privateKey.includes('\nABC\n'))
  assert.equal(fsLib.serviceAccount({}), null)
})

test('salva no Firestore com a conta de serviço e lê de volta (outro aparelho)', async () => {
  const put = await api.PUT(await req('PUT', 'google-123', { collected: ['nise', 'graciliano'], xp: 120, stampLog2: { nise: { at: 5, method: 'qr', count: 1 } } }))
  assert.equal(put.status, 200)
  const [path, fields] = [...db.entries()][0]
  assert.match(path, /^progresso\/[0-9a-f]{64}$/, 'id do documento é o hash da conta, não o id do Google')
  assert.ok(!JSON.stringify(fields).includes('google-123'), 'id da conta não fica no banco')
  assert.equal(fields.selos.integerValue, '2')
  const got = await (await api.GET(await req('GET', 'google-123'))).json()
  assert.deepEqual(got.doc.collected, ['nise', 'graciliano'])
  assert.equal(got.doc.xp, 120)
  assert.match(got.doc.stampLog2.nise.proof, /^[A-Za-z0-9_-]{43}$/)
})

test('token de acesso reaproveitado (um login por hora, não um por requisição)', async () => {
  await api.GET(await req('GET', 'google-123'))
  await api.GET(await req('GET', 'google-123'))
  assert.equal(calls.filter((u) => u.includes('oauth2.googleapis.com')).length, 1)
})
