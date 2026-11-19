// Revisão automática pelas Web Interface Guidelines da Vercel (vercel-labs/web-interface-guidelines),
// nas páginas públicas, no navegador (Playwright) e no código. Complementa a11y.test.mjs e ux.test.mjs.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const PORT = process.env.GUIDE_PORT || '4178'
const BASE = `http://127.0.0.1:${PORT}`
const ROUTES = ['/', '/monumento/graciliano', '/monumento/nise', '/privacidade', '/entrar']
let server, browser

before(async () => {
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' }, stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break } catch {} await new Promise((r) => setTimeout(r, 300)) }
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
})
after(async () => { await browser?.close(); try { process.kill(-server.pid) } catch {} })

async function open(path) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(() => {
    localStorage.setItem('mu_cookie_notice', '1')
    window.__cls = 0
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value }).observe({ type: 'layout-shift', buffered: true })
  })
  const page = await ctx.newPage()
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await page.goto(BASE + path)
  await page.waitForTimeout(700)
  return { ctx, page }
}

const files = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p] })
const publicSrc = [...files('src/features'), 'src/ReportSheet.tsx', 'src/ui.tsx'].filter((p) => /\.tsx?$/.test(p)).map((p) => [p, readFileSync(p, 'utf8')])

for (const path of ROUTES) {
  test(`${path}: botões só com ícone têm nome acessível; links externos com noopener; sem layout shift`, async () => {
    const { ctx, page } = await open(path)
    const r = await page.evaluate(() => ({
      unnamed: [...document.querySelectorAll('button, a[href]')].filter((e) => e.offsetParent && !(e.textContent || '').trim() && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.querySelector('img[alt]:not([alt=""])')).map((e) => e.outerHTML.slice(0, 80)),
      unsafeBlank: [...document.querySelectorAll('a[target="_blank"]')].filter((a) => !/noopener|noreferrer/.test(a.rel)).map((a) => a.href),
      cls: window.__cls,
    }))
    await ctx.close()
    assert.deepEqual(r.unnamed, [], 'botão sem nome')
    assert.deepEqual(r.unsafeBlank, [], 'target=_blank sem rel')
    assert.ok(r.cls < 0.1, `CLS ${r.cls.toFixed(3)}`)
  })
}

test('HTML: color-scheme e theme-color por tema; idioma pt-BR', () => {
  const h = readFileSync('dist/monumento/graciliano/index.html', 'utf8')
  assert.match(h, /<meta name="color-scheme" content="light dark">/)
  assert.match(h, /theme-color[^>]+prefers-color-scheme: dark/)
  assert.match(h, /<html lang="pt-BR">/)
})

test('campos de texto com 16 px ou mais (iOS não dá zoom ao focar)', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  await page.getByRole('button', { name: 'Relatar' }).click()
  const fs = await page.locator('textarea').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))
  await ctx.close()
  assert.ok(fs >= 16, `${fs}px`)
})

test('toque sem atraso (touch-action: manipulation) e títulos balanceados', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  const r = await page.evaluate(() => ({ touch: getComputedStyle(document.querySelector('nav[aria-label="Ações rápidas"] button')).touchAction, wrap: getComputedStyle(document.querySelector('h1')).textWrap }))
  await ctx.close()
  assert.equal(r.touch, 'manipulation')
  assert.match(r.wrap, /balance/)
})

test('números que mudam usam algarismos tabulares (não "pulam")', () => {
  assert.match(readFileSync('src/index.css', 'utf8'), /\.tabular[^{]*\{ font-variant-numeric: tabular-nums/)
  assert.match(readFileSync('src/ui.tsx', 'utf8'), /truncate tabular/)
})

test('código: reticências tipográficas, sem outline:none solto, alvos âncora com scroll-margin', () => {
  for (const [p, src] of publicSrc) {
    const text = src.replace(/\{?\.\.\.[\w[(]/g, '') // spread do JS não conta
    assert.doesNotMatch(text, />[^<{]*\.\.\.[^<]*</, `use "…" em ${p}`)
    assert.doesNotMatch(src, /className=["`][^"`]*\boutline-(none|0)\b(?![^"`]*focus-visible:)/, `foco removido sem substituto em ${p}`)
  }
  assert.match(readFileSync('src/index.css', 'utf8'), /\[id\] \{ scroll-margin-top/)
})

test('só um controle de narração por página (sem "dois plays")', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  const n = await page.getByRole('button', { name: /Ouvir|Pausar narração/ }).count()
  await ctx.close()
  assert.equal(n, 1)
})

for (const width of [320, 390, 768]) {
  test(`responsivo em ${width} px: nenhuma página rola para o lado`, async () => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } })
    await ctx.addInitScript(() => localStorage.setItem('mu_cookie_notice', '1'))
    const page = await ctx.newPage()
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
    const bad = []
    for (const path of ROUTES) {
      await page.goto(BASE + path)
      await page.waitForTimeout(300)
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      if (over > 1) bad.push(`${path} (+${over}px)`)
    }
    await ctx.close()
    assert.deepEqual(bad, [])
  })
}

test('Core Web Vitals no celular: LCP < 2,5 s e CLS < 0,1 na página do monumento', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(() => {
    localStorage.setItem('mu_cookie_notice', '1')
    window.__lcp = 0; window.__cls = 0
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value }).observe({ type: 'layout-shift', buffered: true })
  })
  const page = await ctx.newPage()
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await page.goto(BASE + '/monumento/graciliano')
  await page.waitForTimeout(1200)
  const v = await page.evaluate(() => ({ lcp: window.__lcp, cls: window.__cls }))
  await ctx.close()
  assert.ok(v.lcp < 2500, `LCP ${Math.round(v.lcp)} ms`)
  assert.ok(v.cls < 0.1, `CLS ${v.cls.toFixed(3)}`)
})
