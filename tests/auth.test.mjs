// Testes do núcleo de login (api/_lib/session.ts): assinatura de sessão, PKCE, claims e open redirect.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sign, verify, pkceChallenge, safeReturnTo, validateClaims, roleFor, parseCookies, cookie } from '../api/_lib/session.ts'

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

test('PKCE S256 bate com o vetor da RFC 7636', async () => {
  assert.equal(await pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
})

test('returnTo só aceita caminho interno (anti open redirect)', () => {
  assert.equal(safeReturnTo('/app'), '/app')
  assert.equal(safeReturnTo('//evil.com'), '/app')
  assert.equal(safeReturnTo('https://evil.com'), '/app')
  assert.equal(safeReturnTo('/\\evil.com'), '/app')
  assert.equal(safeReturnTo(null), '/app')
})

test('claims do ID token são validadas', () => {
  const ok = { iss: 'https://accounts.google.com', aud: 'cid', sub: 's', exp: inOneHour(), nonce: 'n', email_verified: true }
  assert.equal(validateClaims(ok, { clientId: 'cid', nonce: 'n' }), null)
  assert.match(validateClaims({ ...ok, aud: 'outro' }, { clientId: 'cid', nonce: 'n' }), /audiência/)
  assert.match(validateClaims({ ...ok, nonce: 'x' }, { clientId: 'cid', nonce: 'n' }), /nonce/)
  assert.match(validateClaims({ ...ok, iss: 'https://evil' }, { clientId: 'cid', nonce: 'n' }), /emissor/)
  assert.match(validateClaims({ ...ok, exp: 1 }, { clientId: 'cid', nonce: 'n' }), /expirado/)
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
