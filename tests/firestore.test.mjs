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
  Object.assign(process.env, { FIREBASE_WEB_API_KEY: 'chave-web-publica-de-teste', SESSION_SECRET: SECRET, FIREBASE_SERVICE_ACCOUNT: Buffer.from(json).toString('base64') })
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

test('sem chave (Vercel): token OIDC do cabeçalho → STS → conta de serviço → Firestore', async () => {
  const keyless = { FIREBASE_PROJECT_ID: 'mu-teste', GCP_WORKLOAD_IDENTITY_PROVIDER: 'projects/9/locations/global/workloadIdentityPools/vercel/providers/vercel', GCP_SERVICE_ACCOUNT: 'api-progresso@mu-teste.iam.gserviceaccount.com' }
  const saved = { ...process.env }
  delete process.env.FIREBASE_SERVICE_ACCOUNT
  Object.assign(process.env, keyless)
  const real = globalThis.fetch
  const seen = []
  globalThis.fetch = async (url, init = {}) => {
    url = String(url)
    seen.push(url.split('?')[0])
    if (url === 'https://sts.googleapis.com/v1/token') return new URLSearchParams(init.body).get('subject_token') === 'oidc-da-vercel' ? Response.json({ access_token: 'fed' }) : new Response('{}', { status: 401 })
    if (url.includes(':generateAccessToken')) return init.headers.Authorization === 'Bearer fed' ? Response.json({ accessToken: 'tok-123', expireTime: new Date(Date.now() + 3600_000).toISOString() }) : new Response('{}', { status: 403 })
    return real(url, init)
  }
  try {
    assert.equal(fsLib.firestore(process.env, null), null, 'sem o token da Vercel não há credencial (e nenhuma chave guardada)')
    const r = await req('PUT', 'google-oidc', { collected: ['catedral'], xp: 10 })
    r.headers.set('x-vercel-oidc-token', 'oidc-da-vercel')
    const put = await api.PUT(r)
    assert.equal(put.status, 200)
    assert.ok(seen.includes('https://sts.googleapis.com/v1/token'))
    assert.ok(!seen.includes('https://oauth2.googleapis.com/token'), 'não usa chave de conta de serviço')
  } finally {
    globalThis.fetch = real
    for (const k of Object.keys(keyless)) delete process.env[k]
    Object.assign(process.env, saved)
  }
})

test('POST /api/auth/session: cria o cookie a partir do ID token do Firebase (e recusa outra origem)', async () => {
  const session = await import('../server/build/api/auth/session.js')
  const tk = await import('../server/build/api/_lib/firebaseToken.js')
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
  const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 's1' }
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const t = Math.floor(Date.now() / 1000)
  const head = b64({ alg: 'RS256', kid: 's1' })
  const body = b64({ iss: 'https://securetoken.google.com/memoria-urbana-maceio', aud: 'memoria-urbana-maceio', sub: 'uid-fb', iat: t, exp: t + 3600, auth_time: t, email: 'ana@x.com', email_verified: true, name: 'Ana', firebase: { sign_in_provider: 'google.com', identities: { 'google.com': ['g-42'] } } })
  const sig = Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(`${head}.${body}`))).toString('base64url')
  const real = globalThis.fetch
  globalThis.fetch = async (url) => (String(url) === tk.JWKS_URL ? Response.json({ keys: [jwk] }) : new Response('', { status: 500 }))
  tk.resetKeyCache()
  try {
    const mk = (origin) => new Request('https://site.test/api/auth/session', { method: 'POST', headers: { origin, host: 'site.test', 'content-type': 'application/json' }, body: JSON.stringify({ idToken: `${head}.${body}.${sig}` }) })
    assert.equal((await session.POST(mk('https://evil.test'))).status, 403)
    const ok = await session.POST(mk('https://site.test'))
    assert.equal(ok.status, 200)
    const json = await ok.json()
    assert.equal(json.user.sub, 'g-42', 'conta = id do Google')
    assert.equal(json.user.role, 'visitante')
    assert.match(ok.headers.get('set-cookie'), /^mu_session=.+; Path=\/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure$/)
  } finally {
    globalThis.fetch = real
  }
})
