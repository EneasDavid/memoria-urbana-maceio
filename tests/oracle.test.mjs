// Hospedagem na Oracle Cloud: a configuração do servidor não pode divergir da Vercel,
// e a API de login precisa responder fora da Vercel com os mesmos handlers.
// Pré-requisito: `pnpm build:server` (compila api/ para server/build/api).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (p) => readFileSync(p, 'utf8')
const caddy = read('infra/oracle/Caddyfile')
const vercel = JSON.parse(read('vercel.json'))

test('Caddyfile tem os mesmos cabeçalhos de segurança da Vercel (CSP, HSTS, COOP…)', () => {
  for (const b of vercel.headers) for (const { key: k, value: v } of b.headers) assert.ok(caddy.includes(`${k} "${v}"`), `cabeçalho ${k} (${b.source}) diferente da Vercel`)
  assert.match(caddy, /@entrar path \/entrar/)
  assert.match(caddy, /@site not path \/entrar/)
})

test('Caddyfile serve o HTML pré-renderizado, cai no spa.html e repassa só /api/* ao Node local', () => {
  assert.match(caddy, /try_files \{path\} \{path\}\/index\.html \/spa\.html/)
  assert.match(caddy, /handle \/api\/\* \{\s*reverse_proxy 127\.0\.0\.1:3001/)
  assert.match(caddy, /\{\$SITE_DOMAIN\}/)
})

test('setup.sh abre 80/443 no iptables da imagem Oracle e não guarda segredos no repositório', () => {
  const s = read('infra/oracle/setup.sh')
  assert.match(s, /iptables -I INPUT .*--dport \$port/)
  assert.match(s, /FIREBASE_WEB_API_KEY=\n/)
  assert.match(s, /NoNewPrivileges=true/)
})

test('workflow de deploy só roda com variáveis da Oracle e fixa a chave do host', () => {
  const w = read('.github/workflows/deploy-oracle.yml')
  assert.match(w, /vars\.ORACLE_HOST != ''/)
  assert.match(w, /StrictHostKeyChecking=yes/)
  assert.doesNotMatch(w, /StrictHostKeyChecking=no/)
})

let server, base
before(async () => {
  assert.ok(existsSync('server/build/api/auth/me.js'), 'rode `pnpm build:server` antes')
  for (const k of ['FIREBASE_WEB_API_KEY', 'SESSION_SECRET']) delete process.env[k]
  const { createServer } = await import('../server/api-server.mjs')
  server = createServer()
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  base = `http://127.0.0.1:${server.address().port}`
})
after(() => server?.close())

test('API Node responde /api/auth/me como na Vercel (sem login configurado)', async () => {
  const r = await fetch(base + '/api/auth/me')
  assert.equal(r.status, 200)
  assert.deepEqual(await r.json(), { configured: false, user: null })
})

test('API Node: login sem configuração responde 503, rota desconhecida 404, método errado 404', async () => {
  assert.equal((await fetch(base + '/api/auth/firebase-config')).status, 503)
  assert.equal((await fetch(base + '/api/auth/session', { method: 'POST', headers: { origin: base }, body: '{}' })).status, 503)
  assert.equal((await fetch(base + '/api/nada')).status, 404)
  assert.equal((await fetch(base + '/api/auth/me', { method: 'DELETE' })).status, 404)
})

test('API Node: logout limpa o cookie de sessão respeitando o protocolo do proxy', async () => {
  const host = new URL(base).host
  assert.equal((await fetch(base + '/api/auth/logout', { method: 'POST' })).status, 403, 'logout sem Origin deveria ser recusado (CSRF)')
  const r = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { 'x-forwarded-proto': 'https', origin: `https://${host}` } })
  const c = r.headers.get('set-cookie') || ''
  assert.match(c, /mu_session=;/)
  assert.match(c, /Secure/)
})

test('sem acesso de demonstração: rota removida e cookie antigo mu_demo é ignorado', async () => {
  const r = await fetch(base + '/api/auth/demo', { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: JSON.stringify({ role: 'gestor' }) })
  assert.equal(r.status, 404)
  const fake = Buffer.from(JSON.stringify({ sub: 'x', role: 'admin', demo: true, exp: 9999999999 })).toString('base64url') + '.assinatura'
  const me = await fetch(base + '/api/auth/me', { headers: { cookie: `mu_demo=${fake}` } }).then((x) => x.json())
  assert.equal(me.user, null)
})
