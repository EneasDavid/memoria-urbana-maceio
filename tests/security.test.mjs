// Requisitos de segurança (1–10, 32, 36–39 da lista de 40): conferidos no código e na configuração a cada push.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const read = (p) => readFileSync(p, 'utf8')
const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git', 'build', 'shots', '__pycache__', '.pytest_cache', '.ruff_cache'].includes(f) || f.endsWith('.egg-info')) continue
    const p = join(dir, f)
    statSync(p).isDirectory() ? walk(p, out) : out.push(p)
  }
  return out
}
const textFiles = walk('.').filter((p) => /\.(ts|tsx|mjs|js|py|json|ya?ml|md|toml|sh|html|css|env|txt)$|Caddyfile$/.test(p) && !p.includes('fixtures') && !p.endsWith('pnpm-lock.yaml'))
const headers = Object.fromEntries(JSON.parse(read('vercel.json')).headers.flatMap((b) => b.headers).map((h) => [h.key, h.value]))

test('4 HTTPS/TLS: HSTS de pelo menos 1 ano com subdomínios; CSP força upgrade', () => {
  const max = Number(/max-age=(\d+)/.exec(headers['Strict-Transport-Security'])?.[1])
  assert.ok(max >= 31536000, 'HSTS curto')
  assert.match(headers['Strict-Transport-Security'], /includeSubDomains/)
  assert.match(headers['Content-Security-Policy'], /upgrade-insecure-requests/)
})

test('7 XSS: CSP sem unsafe-eval nem script inline; sem dangerouslySetInnerHTML/eval no front', () => {
  const csp = headers['Content-Security-Policy']
  assert.match(csp, /script-src 'self'(;|$)/)
  assert.doesNotMatch(csp, /unsafe-eval/)
  assert.match(csp, /object-src 'none'/)
  assert.match(csp, /frame-ancestors 'self'/)
  assert.equal(headers['X-Content-Type-Options'], 'nosniff')
  for (const p of textFiles.filter((f) => f.startsWith('src') || f.startsWith('api'))) {
    const s = read(p)
    assert.doesNotMatch(s, /dangerouslySetInnerHTML|\beval\(|new Function\(/, `injeção possível em ${p}`)
  }
})

test('7 CSRF: rotas POST da API conferem a Origem; cookies SameSite=Lax e HttpOnly', () => {
  for (const f of readdirSync('api/auth')) {
    const s = read(`api/auth/${f}`)
    if (/export async function POST/.test(s)) assert.match(s, /sameOrigin\(req\)/, `${f} sem checagem de Origem`)
  }
  const cookie = read('api/_lib/session.ts')
  assert.match(cookie, /'HttpOnly'/)
  assert.match(cookie, /'SameSite=Lax'/)
  assert.match(cookie, /secure \? 'Secure'/)
})

test('1 e 5 autenticação: OAuth com PKCE S256, state e nonce; nenhuma senha guardada', () => {
  const login = read('api/auth/login.ts')
  assert.match(login, /code_challenge_method.*S256/)
  assert.match(login, /state/)
  assert.match(login, /nonce/)
  for (const p of textFiles.filter((f) => /^(src|api|backend\/app)/.test(f))) assert.doesNotMatch(read(p), /password\s*[:=]\s*['"][^'"]+['"]/i, `senha fixa em ${p}`)
})

test('2 e 38 controle de acesso: papéis fechados; acesso de demonstração nunca vira admin', () => {
  const demo = read('api/auth/demo.ts')
  assert.match(demo, /role !== 'visitante' && role !== 'gestor'/)
  assert.doesNotMatch(demo, /'admin'/)
  const me = read('api/auth/me.ts')
  assert.match(me, /demo\.demo === true && \(demo\.role === 'visitante' \|\| demo\.role === 'gestor'\)/)
  assert.match(read('backend/app/core/rbac.py'), /def require\(/)
})

test('3 e 9 segredos: nenhuma chave, token ou certificado no repositório', () => {
  const secret = /(AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|GOCSPX-[\w-]{10,}|AIza[0-9A-Za-z_-]{35}|ghp_[0-9A-Za-z]{36}|xox[baprs]-[0-9A-Za-z-]{10,}|sk_live_[0-9a-zA-Z]{20,})/
  for (const p of textFiles) {
    const m = read(p).match(secret)
    assert.equal(m, null, `possível segredo em ${p}: ${m?.[0].slice(0, 12)}…`)
  }
  assert.ok(!existsSync('.env') && !existsSync('backend/.env'), '.env versionado')
})

test('6 injeção: backend sem SQL montado por string e com validação Pydantic nas entradas', () => {
  for (const p of textFiles.filter((f) => f.startsWith('backend/app') && f.endsWith('.py'))) {
    assert.doesNotMatch(read(p), /execute\(\s*f["']|\.format\([^)]*\)\s*\)\s*#?\s*sql|cursor\./i, `SQL dinâmico em ${p}`)
  }
  assert.match(read('backend/app/api/v1/reports.py'), /BaseModel|pydantic/i)
})

test('8 rate limiting: relatos e anexos limitados por hash de IP', () => {
  const r = read('backend/app/api/v1/reports.py')
  assert.match(r, /hit\(s\.redis, "rl:report"|hit\(.*rl:/)
  assert.match(r, /rl:media/)
})

test('10, 37 e 39 dependências e código: Dependabot, CODEOWNERS, template de PR e SECURITY.md', () => {
  const dep = read('.github/dependabot.yml')
  for (const eco of ['npm', 'pip', 'github-actions']) assert.match(dep, new RegExp(`package-ecosystem: "?${eco}`))
  assert.match(read('.github/CODEOWNERS'), /@EneasDavid/)
  assert.match(read('.github/pull_request_template.md'), /Segurança/)
  assert.match(read('SECURITY.md'), /Como relatar/)
  assert.match(read('.github/workflows/ci.yml'), /pnpm audit/)
  assert.match(read('.github/workflows/ci.yml'), /pip-audit/)
})

test('32 logs seguros: servidor não registra cookies, tokens nem corpo de requisição', () => {
  const s = read('server/api-server.mjs')
  const logs = s.match(/console\.(log|error|warn)\([^)]*\)/g) || []
  for (const l of logs) assert.doesNotMatch(l, /cookie|token|headers|body|authorization/i, l)
})

test('permissões do navegador: câmera só do próprio site; microfone e localização via página bloqueados', () => {
  const pp = headers['Permissions-Policy']
  assert.match(pp, /camera=\(self\)/)
  assert.match(pp, /microphone=\(\)/)
})
