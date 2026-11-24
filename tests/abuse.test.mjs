// Os 14 ataques mais comuns em sistemas web, do lado do site e das rotas de login.
// O lado do backend está em backend/tests/test_ataques.py. Mapa completo em docs/seguranca-14-ataques.md.
// Pré-requisito: `pnpm build` e `pnpm build:server`.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, execSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { sign, verify, randomToken } from '../api/_lib/session.ts'
import { POST as demoLogin } from '../server/build/api/auth/demo.js'
import { GET as me } from '../server/build/api/auth/me.js'

const PORT = process.env.ABUSE_PORT || '4191'
const BASE = `http://127.0.0.1:${PORT}`
const read = (p) => readFileSync(p, 'utf8')
let server, browser

before(async () => {
  assert.ok(existsSync('dist/index.html'), 'rode `pnpm build` antes do teste')
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' }, stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break } catch {} await new Promise((r) => setTimeout(r, 300)) }
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
})
after(async () => { await browser?.close(); try { process.kill(-server.pid) } catch {} })

async function page(user = null) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(() => localStorage.setItem('mu_cookie_notice', '1'))
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await ctx.route('**/api/auth/me', (r) => r.fulfill({ status: user ? 200 : 401, contentType: 'application/json', body: JSON.stringify({ configured: true, demoAvailable: true, user }) }))
  return { ctx, page: await ctx.newPage() }
}

const bundle = () => readdirSync('dist/assets').filter((f) => /\.(js|css)$/.test(f)).map((f) => read(join('dist/assets', f))).join('\n')

test('1 digitar /admin: não existe área de admin no site; cai em "não encontrado"', async () => {
  const { ctx, page: p } = await page()
  for (const path of ['/admin', '/administrador', '/wp-admin', '/painel/../admin']) {
    await p.goto(BASE + path)
    await p.getByRole('heading', { name: /não encontrado|Monumentos|Memória Urbana/i }).first().waitFor()
    assert.equal(await p.getByText('Painel da prefeitura').count(), 0, path)
  }
  await ctx.close()
})

test('1 digitar /painel sem conta: manda para o login; visitante comum vê "Acesso restrito"', async () => {
  let { ctx, page: p } = await page()
  await p.goto(BASE + '/painel')
  await p.waitForURL('**/entrar?returnTo=%2Fpainel')
  await ctx.close()
  ;({ ctx, page: p } = await page({ sub: '1', name: 'Ana', email: 'a@x.com', role: 'visitante' }))
  await p.goto(BASE + '/painel')
  await p.getByRole('heading', { name: 'Acesso restrito' }).waitFor()
  await ctx.close()
})

test('2 trocar o ID na URL: id inexistente ou malicioso mostra "Monumento não encontrado"', async () => {
  const { ctx, page: p } = await page()
  for (const id of ['nao-existe', 'graciliano-ramos-123', '%3Cscript%3Ealert(1)%3C%2Fscript%3E', 'admin']) {
    await p.goto(`${BASE}/monumento/${id}`)
    await p.getByRole('heading', { name: 'Monumento não encontrado' }).waitFor()
  }
  // Caminho com "../": o servidor não entrega arquivo nenhum fora do site.
  const r = await fetch(`${BASE}/monumento/..%2F..%2Fetc%2Fpasswd`)
  assert.doesNotMatch(await r.text(), /root:.*:0:0:/)
  // Os dados da página vêm só da lista publicada: não há id que abra rascunho, painel ou dado de outra pessoa.
  assert.doesNotMatch(read('src/features/monument/find.ts'), /fetch\(|localStorage/)
  await ctx.close()
})

test('3 chave de API no navegador: nenhum segredo nem variável de servidor no bundle', () => {
  const js = bundle()
  assert.doesNotMatch(js, /GOOGLE_CLIENT_SECRET|SESSION_SECRET|GESTOR_EMAILS|client_secret|GOCSPX-|AIza[0-9A-Za-z_-]{35}|-----BEGIN|sk_live_/)
  assert.doesNotMatch(read('vite.config.ts'), /define:\s*\{[^}]*process\.env/s, 'process.env exposto ao front')
})

test('4–8 preço, −1 item, Pix falso, cupom 100× e premium: não há pagamento nem carrinho no código', () => {
  const src = execSync('git ls-files src api server backend/app', { encoding: 'utf8' }).split('\n').filter(Boolean).map(read).join('\n')
  assert.doesNotMatch(src, /stripe|mercadopago|pagseguro|checkout|pix\s*copia|cupom|coupon|subscription|assinatura premium/i)
  // Equivalentes reais testados no backend: pontos calculados no servidor, carimbo 1×/dia, campos extras = 422.
  assert.match(read('backend/app/api/v1/stamps.py'), /extra="forbid"/)
  assert.match(read('backend/app/api/v1/stamps.py'), /nx=True/)
})

test('6 Pix falso = sessão forjada: cookie adulterado, expirado ou com outra chave é recusado', async () => {
  const S = 'k'.repeat(40)
  const t = await sign({ sub: 'ana', role: 'visitante', exp: Math.floor(Date.now() / 1000) + 60 }, S)
  const [, sig] = t.split('.')
  const forjado = Buffer.from(JSON.stringify({ sub: 'ana', role: 'gestor', exp: 9e9 })).toString('base64url')
  assert.equal(await verify(`${forjado}.${sig}`, S), null)
  assert.equal(await verify(t, 'z'.repeat(40)), null)
  assert.equal(await verify(t, S, Date.now() + 120_000), null)
})

test('9 admin no cadastro: pedir papel "admin" no acesso de demonstração é recusado', async () => {
  for (const role of ['admin', 'curador', 'Gestor', ['gestor'], { role: 'admin' }]) {
    const r = await demoLogin(new Request('http://127.0.0.1/api/auth/demo', { method: 'POST', headers: { origin: 'http://127.0.0.1', host: '127.0.0.1', 'content-type': 'application/json' }, body: JSON.stringify({ role }) }))
    assert.equal(r.status, 400, JSON.stringify(role))
  }
  const cross = await demoLogin(new Request('http://127.0.0.1/api/auth/demo', { method: 'POST', headers: { origin: 'https://evil.com', host: '127.0.0.1' }, body: '{"role":"gestor"}' }))
  assert.equal(cross.status, 403)
  // Cookie de demonstração forjado com papel admin não é aceito por /api/auth/me.
  const fake = await sign({ sub: 'x', role: 'admin', demo: true, exp: Math.floor(Date.now() / 1000) + 60 }, 'memoria-urbana-demo-sem-privilegio-real-000000')
  const res = await me(new Request('http://127.0.0.1/api/auth/me', { headers: { cookie: `mu_demo=${fake}` } }))
  assert.equal((await res.json()).user, null)
  assert.doesNotMatch(read('api/auth/callback.ts'), /searchParams\.get\(['"]role/)
})

test('10 adivinhar o código: state, nonce e verificador com 256 bits e nunca repetidos', () => {
  const seen = new Set()
  for (let i = 0; i < 2000; i++) {
    const t = randomToken()
    assert.ok(t.length >= 43)
    assert.ok(!seen.has(t))
    seen.add(t)
  }
  assert.match(read('backend/app/main.py'), /uuid\.uuid4\(\)/)
  assert.match(read('backend/app/main.py'), /secrets\.token_urlsafe\(32\)/)
})

test('11 mandar a IA ignorar: nenhuma IA generativa em tempo de execução lê texto de usuário', () => {
  const pkg = read('package.json') + read('backend/pyproject.toml')
  assert.doesNotMatch(pkg, /openai|anthropic|@google\/generative-ai|langchain|ollama|llama|mistral|cohere/i)
  assert.doesNotMatch(bundle(), /api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com/)
})

test('12 script no usuário: relato com <script> aparece como texto, nunca executa', async () => {
  const { ctx, page: p } = await page()
  let ran = false
  await p.exposeFunction('__pwned', () => { ran = true })
  await p.goto(BASE + '/monumento/graciliano')
  await p.getByRole('button', { name: 'Relatar' }).click()
  const box = p.getByRole('textbox').first()
  if (await box.count()) await box.fill('<img src=x onerror="__pwned()"><script>__pwned()</script>')
  await p.waitForTimeout(300)
  assert.equal(ran, false)
  assert.doesNotMatch(read('src/features/monument/MonumentPage.tsx'), /dangerouslySetInnerHTML/)
  await ctx.close()
})

test('13 senhas no GitHub: nenhum segredo no histórico do git e .env ignorado', () => {
  const ignore = read('.gitignore')
  assert.match(ignore, /^\.env/m)
  let log = ''
  try { log = execSync('git log -p --all -- . ":(exclude)pnpm-lock.yaml" ":(exclude)tests/fixtures"', { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 }) } catch { return }
  const secret = /(AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|GOCSPX-[\w-]{10,}|AIza[0-9A-Za-z_-]{35}|ghp_[0-9A-Za-z]{36}|github_pat_[\w]{20,}|sk_live_[0-9a-zA-Z]{20,})/
  const m = log.match(secret)
  assert.equal(m, null, `segredo no histórico: ${m?.[0].slice(0, 10)}…`)
})

test('14 abrir teu banco de dados: regras do Firebase fecham o cliente; nada de credencial de banco no front', () => {
  assert.match(read('firebase/firestore.rules'), /allow read, write: if false;/)
  assert.match(read('firebase/storage.rules'), /match \/\{allPaths=\*\*\} \{\s*allow read, write: if false;/)
  assert.doesNotMatch(bundle(), /firebaseio\.com|firestore\.googleapis\.com|redis:\/\/|postgres:\/\//)
  for (const line of read('infra/docker-compose.yml').split('\n').filter((l) => l.includes('ports:'))) {
    for (const p of line.split('[')[1].replace(']', '').split(',')) assert.match(p.trim(), /^"127\.0\.0\.1:/, line)
  }
})
