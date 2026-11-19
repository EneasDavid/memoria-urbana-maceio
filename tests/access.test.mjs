// Acesso de demonstração (sem Google) e aviso de permissão de câmera/galeria, no navegador.
// A API é simulada aqui (vite preview não roda /api); o comportamento do servidor é testado em oracle.test.mjs.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const PORT = process.env.ACCESS_PORT || '4181'
const BASE = `http://127.0.0.1:${PORT}`
let server, browser

before(async () => {
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' }, stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break } catch {} await new Promise((r) => setTimeout(r, 300)) }
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
})
after(async () => { await browser?.close(); try { process.kill(-server.pid) } catch {} })

async function withFakeApi(start = null, colorScheme = 'light') {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme })
  await ctx.addInitScript(() => localStorage.setItem('mu_cookie_notice', '1'))
  let user = start
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
  await page.getByRole('heading', { name: 'Explorar' }).waitFor()
  assert.match(await page.getByRole('note').textContent(), /Demonstração · nada é salvo/)
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

// Área logada igual ao protótipo do Figma: Explorar, Trilha, Passaporte e botão de leitura da placa
const REAL = { sub: 'g-123', name: 'Jovem Werther', email: 'jw@exemplo.com', role: 'visitante' }

test('área logada: abas Explorar, Trilha e Passaporte e botão "Ler placa", como no protótipo', async () => {
  const { ctx, page } = await withFakeApi(REAL)
  await page.goto(BASE + '/app')
  const abas = page.getByRole('navigation', { name: 'Abas' })
  for (const a of ['Explorar', 'Trilha', 'Passaporte']) await abas.getByRole('button', { name: a, exact: true }).waitFor()
  await page.getByLabel('Ler placa').waitFor()
  await abas.getByRole('button', { name: 'Trilha', exact: true }).click()
  await page.getByText('Trilha Cultural · Maceió').waitFor()
  await abas.getByRole('button', { name: 'Passaporte', exact: true }).click()
  await page.getByRole('heading', { name: 'Passaporte' }).waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'rolagem horizontal')
  await ctx.close()
})

test('área logada com conta real: nada simulado (sem caminhada, sem leitura falsa, sem relógio 9:41)', async () => {
  const { ctx, page } = await withFakeApi(REAL)
  await page.goto(BASE + '/app')
  await page.getByRole('heading', { name: 'Explorar' }).waitFor()
  assert.equal(await page.getByText('9:41').count(), 0)
  assert.equal(await page.getByText('Sábado, 7 de novembro').count(), 0, 'data fixa do protótipo')
  await page.getByRole('navigation', { name: 'Abas' }).getByRole('button', { name: 'Trilha', exact: true }).click()
  await page.getByRole('button', { name: 'Mostrar onde estou' }).waitFor()
  assert.equal(await page.getByText('Simular caminhada').count(), 0)
  assert.equal(await page.getByText('Sem placa? Check-in por GPS').count(), 0, 'check-in sem localização real')
  await page.getByLabel('Ler placa').click()
  const aviso = page.getByTestId('aviso-camera-qr')
  await aviso.waitFor()
  assert.match(await aviso.textContent(), /nada é gravado nem enviado/)
  await page.waitForTimeout(3200)
  assert.equal(await page.getByText('QR Code reconhecido').count(), 0, 'leitura simulada na conta real')
  assert.equal(await page.getByText('Simular leitura').count(), 0)
  await aviso.getByRole('button', { name: 'Agora não' }).click()
  await ctx.close()
})

test('área logada na demonstração: simulações ligadas para testar sem ir à rua', async () => {
  const { ctx, page } = await withFakeApi({ ...REAL, sub: 'demo-visitante', name: 'Visitante Demonstração', demo: true })
  await page.goto(BASE + '/app')
  await page.getByRole('navigation', { name: 'Abas' }).getByRole('button', { name: 'Trilha', exact: true }).click()
  await page.getByRole('button', { name: 'Simular caminhada' }).first().waitFor()
  await page.getByLabel('Ler placa').click()
  await page.getByText('QR Code reconhecido').waitFor({ timeout: 6000 })
  await ctx.close()
})

for (const scheme of ['light', 'dark']) {
  test(`área logada sem violações de acessibilidade nas 3 abas (${scheme === 'light' ? 'claro' : 'escuro'})`, async () => {
    const { ctx, page } = await withFakeApi(REAL, scheme)
    await page.goto(BASE + '/app')
    for (const tab of ['Explorar', 'Trilha', 'Passaporte']) {
      await page.getByRole('navigation', { name: 'Abas' }).getByRole('button', { name: tab, exact: true }).click()
      await page.waitForTimeout(500)
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      assert.equal(bad.length, 0, tab + ': ' + bad.map((v) => v.id).join(', '))
    }
    await ctx.close()
  })
}
