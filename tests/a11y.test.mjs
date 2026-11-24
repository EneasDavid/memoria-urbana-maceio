// Acessibilidade (itens 8, 9, 10 e 11): axe-core em todas as páginas públicas, no modo claro e no escuro,
// e navegação por teclado. Bloqueia o CI em violações "serious" ou "critical" (WCAG 2.1 A/AA).
// Pré-requisito: `pnpm build` e `pnpm exec playwright install chromium` (CHROME_PATH usa outro Chrome).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const PORT = process.env.A11Y_PORT || '4174'
const BASE = `http://127.0.0.1:${PORT}`
const ROUTES = ['/', '/monumento/graciliano', '/monumento/nise', '/monumento/nao-existe', '/entrar', '/app', '/privacidade', '/termos', '/cookies', '/acessibilidade', '/creditos', '/sobre']
let server, browser

before(async () => {
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' }, stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE + '/')).ok) break } catch {}
    await new Promise((r) => setTimeout(r, 300))
  }
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
})
after(async () => {
  await browser?.close()
  try { process.kill(-server.pid) } catch {}
})

async function open(path, colorScheme = 'light') {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme, locale: 'pt-BR', reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort()) // fotos de terceiros fora: teste determinístico
  await page.goto(BASE + path)
  await page.waitForTimeout(400)
  return { ctx, page }
}

for (const scheme of ['light', 'dark']) {
  for (const path of ROUTES) {
    test(`axe sem violações graves: ${path} (${scheme === 'light' ? 'claro' : 'escuro'})`, async () => {
      const { ctx, page } = await open(path, scheme)
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      await ctx.close()
      assert.equal(bad.length, 0, bad.map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`).join('\n'))
    })
  }
}

test('teclado: primeiro Tab é "Pular para o conteúdo" e leva ao main', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Pular para o conteúdo')
  await page.keyboard.press('Enter')
  assert.equal(await page.evaluate(() => location.hash), '#conteudo')
  await ctx.close()
})

test('teclado: foco é visível em links e botões', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)
  assert.notEqual(outline, 'none')
  await ctx.close()
})

test('teclado: ouvir narração, abrir relato, fechar com Esc', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  const play = page.getByRole('button', { name: 'Ouvir narração' })
  await play.focus()
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Ouvir narração')
  const relato = page.getByRole('button', { name: /Viu algum problema/ })
  await relato.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('dialog').waitFor()
  assert.ok(await page.evaluate(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement)), 'foco não entrou no diálogo')
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('dialog').count(), 0, 'Esc não fechou o diálogo')
  await ctx.close()
})

test('aviso de cookies aparece uma vez e some ao confirmar', async () => {
  const { ctx, page } = await open('/')
  const aviso = page.getByRole('region', { name: 'Aviso de cookies' })
  assert.equal(await aviso.count(), 1)
  await page.getByRole('button', { name: 'Só o essencial' }).click()
  await page.reload()
  await page.waitForTimeout(300)
  assert.equal(await aviso.count(), 0)
  await ctx.close()
})
