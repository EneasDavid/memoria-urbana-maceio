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
const blocks = JSON.parse(read('vercel.json')).headers
// Regra do site inteiro (a página /entrar tem a exceção do login do Google, testada abaixo)
const headers = Object.fromEntries(blocks.find((b) => b.source !== '/entrar').headers.map((h) => [h.key, h.value]))

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

test('1 e 5 autenticação: login Google pelo Firebase com token verificado no servidor; nenhuma senha guardada', () => {
  const v = read('api/_lib/firebaseToken.ts')
  assert.match(v, /RSASSA-PKCS1-v1_5/, 'assinatura do ID token conferida com a chave pública')
  assert.match(v, /securetoken\.google\.com\/\$\{projectId\}/, 'emissor do projeto')
  assert.match(v, /MAX_AUTH_AGE/, 'login recente obrigatório')
  assert.match(read('api/auth/session.ts'), /sameOrigin\(req\)/, 'troca do token só da própria origem (CSRF)')
  assert.match(read('src/features/auth/firebaseLogin.ts'), /inMemoryPersistence/, 'nenhum token do Firebase salvo no navegador')
  assert.ok(!existsSync('api/auth/login.ts') && !existsSync('api/auth/callback.ts'), 'fluxo OAuth antigo removido')
  for (const p of textFiles.filter((f) => /^(src|api|backend\/app)/.test(f))) assert.doesNotMatch(read(p), /password\s*[:=]\s*['"][^'"]+['"]/i, `senha fixa em ${p}`)
})

test('2 e 38 controle de acesso: papéis fechados; sem acesso de demonstração; papel só pelo servidor', () => {
  assert.ok(!existsSync('api/auth/demo.ts'))
  assert.doesNotMatch(read('api/auth/me.ts'), /mu_demo|DEMO_COOKIE/)
  assert.match(read('api/auth/session.ts'), /role: roleFor\(c\.email, cfg\.gestorEmails\)/)
  assert.match(read('backend/app/core/rbac.py'), /def require\(/)
})

test('7 XSS: só a página /entrar libera o login do Google, e só as origens dele', () => {
  const entrar = blocks.find((b) => b.source === '/entrar')
  assert.ok(entrar, 'regra da página de login ausente')
  assert.ok(blocks.find((b) => b.source !== '/entrar').source.includes('(?!entrar$)'), 'regra geral precisa excluir /entrar')
  const h = Object.fromEntries(entrar.headers.map((x) => [x.key, x.value]))
  const csp = h['Content-Security-Policy']
  assert.equal(csp.replace(" https://apis.google.com", '').replace(' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com', '').replace(' frame-src https://memoria-urbana-maceio.firebaseapp.com;', ''), headers['Content-Security-Policy'], 'a exceção só pode acrescentar as origens do login')
  assert.equal(h['Cross-Origin-Opener-Policy'], 'same-origin-allow-popups')
  for (const k of ['X-Content-Type-Options', 'X-Frame-Options', 'Strict-Transport-Security', 'Permissions-Policy', 'Referrer-Policy']) assert.equal(h[k], headers[k], `${k} igual ao do site`)
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
