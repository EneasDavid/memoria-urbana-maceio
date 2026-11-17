// Teste de integração (smoke): sobe o build de produção com `vite preview`
// e verifica que a página, os assets e a logo respondem.
// Pré-requisito: `pnpm build` (gera dist/).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

const PORT = process.env.SMOKE_PORT || '4173'
const BASE = `http://127.0.0.1:${PORT}`
let server

async function waitFor(url, ms = 20000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    try {
      const r = await fetch(url)
      if (r.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`servidor não respondeu em ${ms} ms`)
}

before(async () => {
  assert.ok(existsSync('dist/index.html'), 'rode `pnpm build` antes do teste')
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], {
    env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' },
    stdio: 'ignore',
    detached: true,
  })
  await waitFor(BASE + '/')
})

after(() => {
  try { process.kill(-server.pid) } catch {}
})

test('página inicial responde 200 com o ponto de montagem do React', async () => {
  const r = await fetch(BASE + '/')
  assert.equal(r.status, 200)
  const html = await r.text()
  assert.match(html, /<div id="root"><\/div>/)
  assert.match(html, /<title>[^<]+<\/title>/)
})

test('todos os scripts e estilos do build carregam', async () => {
  const html = await (await fetch(BASE + '/')).text()
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
  assert.ok(assets.length >= 2, 'esperava JS e CSS no index.html')
  for (const a of assets) {
    const r = await fetch(BASE + a)
    assert.equal(r.status, 200, `asset quebrado: ${a}`)
  }
})

test('logo e favicon estão publicados', async () => {
  for (const p of ['/memoria-urbana-logo.png', '/favicon.png']) {
    const r = await fetch(BASE + p)
    assert.equal(r.status, 200, `faltando ${p}`)
  }
})

test('build não vaza segredos nem sourcemaps', async () => {
  const html = await (await fetch(BASE + '/')).text()
  const js = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])
  for (const a of js) {
    const code = await (await fetch(BASE + a)).text()
    assert.doesNotMatch(code, /sourceMappingURL=data:/, `sourcemap inline em ${a}`)
    assert.doesNotMatch(code, /(sk_live_|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY)/, `possível segredo em ${a}`)
  }
})
