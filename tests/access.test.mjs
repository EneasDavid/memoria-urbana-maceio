// Acesso de demonstração (sem Google) e aviso de permissão de câmera/galeria, no navegador.
// A API é simulada aqui (vite preview não roda /api); o comportamento do servidor é testado em oracle.test.mjs.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = process.env.ACCESS_PORT || '4181'
const BASE = `http://127.0.0.1:${PORT}`
let server, browser

before(async () => {
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' }, stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break } catch {} await new Promise((r) => setTimeout(r, 300)) }
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
})
after(async () => { await browser?.close(); try { process.kill(-server.pid) } catch {} })

async function withFakeApi() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(() => localStorage.setItem('mu_cookie_notice', '1'))
  let user = null
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await ctx.route('**/api/auth/me', (r) => r.fulfill({ status: user ? 200 : 200, contentType: 'application/json', body: JSON.stringify({ configured: false, demoAvailable: true, user }) }))
  await ctx.route('**/api/auth/demo', async (r) => {
    const { role } = r.request().postDataJSON()
    user = { sub: `demo-${role}`, name: role === 'gestor' ? 'Gestora Demonstração' : 'Visitante Demonstração', email: `${role}@demo.invalid`, role, demo: true }
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) })
  })
  return { ctx, page: await ctx.newPage() }
}

test('login sem Google: "Como visitante" abre a Trilha com aviso de demonstração', async () => {
  const { ctx, page } = await withFakeApi()
  await page.goto(BASE + '/entrar?returnTo=/app')
  await page.getByRole('heading', { name: 'Acesso de demonstração' }).waitFor()
  await page.getByRole('button', { name: 'Como visitante' }).click()
  await page.waitForURL('**/app')
  await page.getByRole('heading', { name: /Olá, Visitante/ }).waitFor()
  assert.match(await page.getByRole('note').textContent(), /Conta de demonstração/)
  await ctx.close()
})

test('login sem Google: "Como gestor" abre o painel marcado como demonstração', async () => {
  const { ctx, page } = await withFakeApi()
  await page.goto(BASE + '/entrar')
  await page.getByRole('button', { name: 'Como gestor' }).click()
  await page.waitForURL('**/painel')
  await page.getByText('Demonstração · dados simulados').waitFor()
  await ctx.close()
})

test('câmera/galeria: aviso de permissão antes de abrir, com opção de negar; lembrado depois', async () => {
  const { ctx, page } = await withFakeApi()
  await page.goto(BASE + '/monumento/graciliano')
  await page.getByRole('button', { name: 'Relatar' }).click()
  await page.getByRole('button', { name: /Anexar foto ou vídeo/ }).click()
  const aviso = page.getByTestId('aviso-permissao')
  await aviso.waitFor()
  assert.match(await aviso.textContent(), /só o arquivo que você escolher/)
  await page.getByRole('button', { name: 'Agora não' }).click()
  assert.equal(await aviso.count(), 0)
  await page.getByRole('button', { name: /Anexar foto ou vídeo/ }).click()
  await page.locator('label[for="relato-anexo"]').click()
  assert.equal(await page.evaluate(() => localStorage.getItem('mu_media_ok')), '1')
  assert.equal(await page.locator('#relato-camera').getAttribute('capture'), 'environment')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Relatar' }).click()
  await page.locator('label[for="relato-camera"]').waitFor()
  assert.equal(await page.getByTestId('aviso-permissao').count(), 0, 'aviso repetido depois de aceito')
  await ctx.close()
})
