// Testes do núcleo de login: sessão assinada (api/_lib/session.ts), verificação do ID token do Firebase
// (api/_lib/firebaseToken.ts), acesso sem chave ao Google Cloud (api/_lib/gcpOidc.ts) e open redirect.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sign, verify, safeReturnTo, roleFor, parseCookies, cookie } from '../api/_lib/session.ts'
import { verifyFirebaseIdToken, accountId, resetKeyCache, JWKS_URL } from '../api/_lib/firebaseToken.ts'
import { federatedAccessToken, oidcFederation, resetOidcCache, vercelOidcToken } from '../api/_lib/gcpOidc.ts'

const SECRET = 'x'.repeat(40)
const inOneHour = () => Math.floor(Date.now() / 1000) + 3600

test('sessão assinada volta igual', async () => {
  const t = await sign({ sub: '123', role: 'visitante', exp: inOneHour() }, SECRET)
  const s = await verify(t, SECRET)
  assert.equal(s.sub, '123')
})

test('sessão adulterada é recusada', async () => {
  const t = await sign({ sub: '123', role: 'visitante', exp: inOneHour() }, SECRET)
  const [body, sig] = t.split('.')
  const forged = Buffer.from(JSON.stringify({ sub: '123', role: 'gestor', exp: inOneHour() })).toString('base64url')
  assert.equal(await verify(`${forged}.${sig}`, SECRET), null)
  assert.equal(await verify(`${body}.${sig}x`, SECRET), null)
  assert.equal(await verify(t, 'y'.repeat(40)), null)
})

test('sessão expirada é recusada', async () => {
  const t = await sign({ sub: '1', exp: Math.floor(Date.now() / 1000) - 1 }, SECRET)
  assert.equal(await verify(t, SECRET), null)
})

test('segredo curto é rejeitado', async () => {
  await assert.rejects(() => sign({ exp: inOneHour() }, 'curto'))
})

test('returnTo só aceita caminho interno (anti open redirect)', () => {
  assert.equal(safeReturnTo('/app'), '/app')
  assert.equal(safeReturnTo('//evil.com'), '/app')
  assert.equal(safeReturnTo('https://evil.com'), '/app')
  assert.equal(safeReturnTo('/\\evil.com'), '/app')
  assert.equal(safeReturnTo(null), '/app')
})

// ---- ID token do Firebase: chave RSA de teste no lugar das chaves públicas do Google ----
const PROJECT = 'memoria-urbana-maceio'
const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' }
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
async function idToken(claims, { kid = 'k1', key = pair.privateKey, alg = 'RS256' } = {}) {
  const head = b64({ alg, kid, typ: 'JWT' })
  const body = b64(claims)
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${body}`))
  return `${head}.${body}.${Buffer.from(sig).toString('base64url')}`
}
const now = () => Math.floor(Date.now() / 1000)
const claims = (over = {}) => ({ iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, sub: 'firebase-uid', iat: now() - 10, exp: now() + 3600, auth_time: now() - 10, email: 'a@b.com', email_verified: true, firebase: { sign_in_provider: 'google.com', identities: { 'google.com': ['1098765'] } }, ...over })
let jwksCalls = 0
const fetcher = async (url) => { assert.equal(url, JWKS_URL); jwksCalls++; return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'cache-control': 'public, max-age=600' } }) }

test('ID token do Firebase válido é aceito e a conta usa o id do Google', async () => {
  resetKeyCache()
  const r = await verifyFirebaseIdToken(await idToken(claims()), PROJECT, { fetcher })
  assert.ok('claims' in r, r.error)
  assert.equal(accountId(r.claims), '1098765', 'mesmo id do login antigo: selos e provas de dono continuam valendo')
  await verifyFirebaseIdToken(await idToken(claims()), PROJECT, { fetcher })
  assert.equal(jwksCalls, 1, 'chaves públicas reaproveitadas pelo tempo do cache')
})

test('ID token do Firebase é recusado se adulterado, de outro projeto, velho ou sem Google', async () => {
  resetKeyCache()
  const other = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
  const bad = async (t, motivo) => { const r = await verifyFirebaseIdToken(t, PROJECT, { fetcher }); assert.ok('error' in r, `deveria recusar: ${motivo}`); assert.match(r.error, motivo) }
  await bad(await idToken(claims(), { key: other.privateKey }), /assinatura/)
  await bad(await idToken(claims(), { kid: 'outra' }), /chave desconhecida/)
  await bad(await idToken(claims(), { alg: 'HS256' }), /algoritmo/)
  await bad(await idToken(claims({ aud: 'outro-projeto' })), /audiência/)
  await bad(await idToken(claims({ iss: 'https://securetoken.google.com/outro' })), /emissor/)
  await bad(await idToken(claims({ exp: now() - 3600 })), /expirado/)
  await bad(await idToken(claims({ auth_time: now() - 3600 })), /login antigo/)
  await bad(await idToken(claims({ firebase: { sign_in_provider: 'anonymous' } })), /só login com Google/)
  await bad(await idToken(claims({ email_verified: false })), /não verificado/)
  await bad('nao.e.um.jwt.valido', /malformado/)
  const [h, , sig] = (await idToken(claims())).split('.')
  await bad(`${h}.${b64(claims({ sub: 'outra-pessoa' }))}.${sig}`, /assinatura/)
})

test('acesso sem chave: token da Vercel → STS → conta de serviço, com cache', async () => {
  resetOidcCache()
  assert.equal(oidcFederation({}), null)
  const fed = oidcFederation({ GCP_WORKLOAD_IDENTITY_PROVIDER: 'projects/1/locations/global/workloadIdentityPools/vercel/providers/vercel', GCP_SERVICE_ACCOUNT: 'api-progresso@p.iam.gserviceaccount.com' })
  assert.equal(vercelOidcToken(new Request('https://x', { headers: { 'x-vercel-oidc-token': 'jwt-da-vercel' } }), {}), 'jwt-da-vercel')
  const seen = []
  const fake = async (url, init) => {
    seen.push(String(url))
    if (String(url) === 'https://sts.googleapis.com/v1/token') {
      const b = new URLSearchParams(init.body)
      assert.equal(b.get('subject_token'), 'jwt-da-vercel')
      assert.equal(b.get('audience'), '//iam.googleapis.com/projects/1/locations/global/workloadIdentityPools/vercel/providers/vercel')
      assert.equal(b.get('subject_token_type'), 'urn:ietf:params:oauth:token-type:jwt')
      return Response.json({ access_token: 'federado' })
    }
    assert.match(String(url), /iamcredentials\.googleapis\.com\/v1\/projects\/-\/serviceAccounts\/api-progresso%40p\.iam\.gserviceaccount\.com:generateAccessToken$/)
    assert.equal(init.headers.Authorization, 'Bearer federado')
    assert.deepEqual(JSON.parse(init.body).scope, ['https://www.googleapis.com/auth/datastore'], 'só o escopo do Firestore')
    return Response.json({ accessToken: 'token-da-conta', expireTime: new Date(Date.now() + 3600_000).toISOString() })
  }
  assert.equal(await federatedAccessToken(fed, 'jwt-da-vercel', fake), 'token-da-conta')
  assert.equal(await federatedAccessToken(fed, 'jwt-da-vercel', fake), 'token-da-conta')
  assert.equal(seen.length, 2, 'segunda chamada usa o cache')
  resetOidcCache()
  await assert.rejects(() => federatedAccessToken(fed, 'x', async () => new Response('', { status: 403 })), /recusada/)
})

test('papel de gestor só para e-mails da lista', () => {
  assert.equal(roleFor('Gestora@Maceio.al.gov.br', 'gestora@maceio.al.gov.br, outro@x.com'), 'gestor')
  assert.equal(roleFor('qualquer@gmail.com', 'gestora@maceio.al.gov.br'), 'visitante')
  assert.equal(roleFor(undefined, ''), 'visitante')
})

test('cookie de sessão sai com HttpOnly, Secure e SameSite', () => {
  const c = cookie('mu_session', 'abc', 60)
  assert.match(c, /HttpOnly/)
  assert.match(c, /Secure/)
  assert.match(c, /SameSite=Lax/)
  assert.deepEqual(parseCookies('a=1; mu_session=abc'), { a: '1', mu_session: 'abc' })
})
