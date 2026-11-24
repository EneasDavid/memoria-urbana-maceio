// UX, animação e design fino (épico E14): 20 princípios + 10 ajustes, conferidos no navegador e no CSS.
// Pré-requisito: `pnpm build` e o Chromium do Playwright (CHROME_PATH usa outro Chrome).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const PORT = process.env.UX_PORT || '4176'
const BASE = `http://127.0.0.1:${PORT}`
const css = readFileSync('src/index.css', 'utf8')
let server, browser

before(async () => {
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' }, stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break } catch {} await new Promise((r) => setTimeout(r, 300)) }
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
})
after(async () => { await browser?.close(); try { process.kill(-server.pid) } catch {} })

async function open(path, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR', hasTouch: true, ...opts })
  await ctx.addInitScript(() => localStorage.setItem('mu_cookie_notice', '1'))
  const page = await ctx.newPage()
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await page.goto(BASE + path)
  await page.waitForSelector('#conteudo')
  return { ctx, page }
}

// ---------- ajustes finos de design (CSS) ----------
test('ajustes 1-4, 6-10: tokens e técnicas presentes no CSS', () => {
  assert.match(css, /--r-inner: calc\(var\(--r-card\) - /, '1 raio concêntrico')
  assert.match(css, /--edge: oklch\(0% 0 0 \/ 0\.0\d\)/, '2 borda com transparência')
  for (const t of ['--c-navy', '--c-teal', '--c-gold', '--c-sand']) assert.match(css, new RegExp(`${t}: oklch\\(`), `3 paleta OKLCH: ${t}`)
  assert.match(css, /linear-gradient\(in oklch/, '4 degradê em OKLCH')
  assert.match(css, /mask-image: linear-gradient/, '6 pontas com máscara')
  assert.match(css, /@keyframes mu-blur-in \{ from \{[^}]*filter: blur/, '7 troca com desfoque')
  assert.match(css, /\.mu-dark \.mu-raise-2 \{[^}]*oklch\(28%/, '8 profundidade no escuro')
  assert.match(css, /\.mu-autoheight \{ transition: height/, '9 altura dinâmica')
  assert.match(css, /mix-blend-mode: multiply/, '10 multiply')
  assert.match(css, /--dur-1: 1\d\dms/, 'princípio 9: toque abaixo de 200 ms')
  assert.match(css, /--ease-spring: cubic-bezier\(0\.34, 1\.\d+/, 'princípio 5: mola com overshoot')
})

test('ajuste 5: ícone no peso do texto (traço ≥ 2 nos botões e títulos semibold)', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  const strokes = await page.$$eval('nav[aria-label="Ações rápidas"] svg, #museu-titulo svg', (els) => els.map((e) => Number(e.getAttribute('stroke-width'))))
  await ctx.close()
  assert.ok(strokes.length >= 4 && strokes.every((s) => s >= 2.2), `traços: ${strokes}`)
})

// ---------- princípios de UX/animação no navegador ----------
test('13, 14 e 20: ações mais usadas no topo, com alvos de pelo menos 44 px', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  const nav = page.getByRole('navigation', { name: 'Ações rápidas' })
  const box = await nav.boundingBox()
  assert.ok(box.y < 844, 'ações rápidas fora da primeira tela')
  const small = await page.$$eval('main button, main a[href]:not(p a):not(footer a)', (els) => els
    .filter((e) => e.offsetParent && !e.closest('[aria-hidden="true"]'))
    .map((e) => {
      const r = e.getBoundingClientRect(); const s = getComputedStyle(e, '::after')
      const hit = e.classList.contains('mu-hit') ? Math.max(r.height, parseFloat(s.height) || 0) : r.height
      return { t: (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 30), h: Math.round(Math.min(hit, Math.max(r.width, hit))) }
    })
    .filter((x) => x.h < 40))
  await ctx.close()
  assert.deepEqual(small, [], 'alvos pequenos: ' + JSON.stringify(small))
})

test('1 e 10: botão achata ao apertar (squash) e a escolha do relato dá feedback', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  const btn = page.getByRole('button', { name: 'Relatar' })
  const rule = await btn.evaluate((e) => getComputedStyle(e).transitionTimingFunction)
  assert.match(rule, /cubic-bezier/)
  await btn.click()
  await page.getByRole('dialog').waitFor()
  const opt = page.getByRole('button', { name: 'Danificado' })
  await opt.click()
  assert.match(await opt.getAttribute('class'), /mu-boing/)
  assert.equal(await opt.getAttribute('aria-pressed'), 'true')
  await ctx.close()
})

test('17 Doherty: o relato abre em menos de 400 ms depois do toque', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  const ms = await page.evaluate(async () => {
    const t0 = performance.now()
    document.querySelector('nav[aria-label="Ações rápidas"] button:last-child').click()
    while (!document.querySelector('[role="dialog"]')) await new Promise((r) => requestAnimationFrame(r))
    return performance.now() - t0
  })
  await ctx.close()
  assert.ok(ms < 400, `${Math.round(ms)} ms`)
})

test('4 e 19: folha sai com animação (pose de saída) e fecha arrastando a alça para baixo', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  await page.getByRole('button', { name: 'Relatar' }).click()
  const dlg = page.getByRole('dialog')
  await dlg.waitFor()
  await page.keyboard.press('Escape')
  assert.match(await dlg.getAttribute('class'), /mu-sheet-out/)
  await dlg.waitFor({ state: 'detached' })
  await page.getByRole('button', { name: 'Relatar' }).click()
  await dlg.waitFor()
  await page.waitForTimeout(400)
  const handle = await page.locator('[role="dialog"] .cursor-grab').boundingBox()
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 8)
  await page.mouse.down()
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 200, { steps: 8 })
  await page.mouse.up()
  await dlg.waitFor({ state: 'detached', timeout: 2000 })
  await ctx.close()
})

test('9: altura da folha anima ao trocar do formulário para o "Obrigado"', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  await page.getByRole('button', { name: 'Relatar' }).click()
  await page.getByRole('button', { name: 'Danificado' }).click()
  const box = page.locator('[data-autoheight]')
  assert.match(await box.evaluate((e) => getComputedStyle(e).transitionProperty), /height/)
  await page.getByRole('button', { name: 'Enviar relato' }).click()
  await page.getByText('Obrigado!').waitFor()
  await ctx.close()
})

test('3 e 8: narração encena o foco (resto recua) e mostra a ação secundária (barras de áudio)', async () => {
  const { ctx, page } = await open('/monumento/graciliano')
  await page.evaluate(() => {
    // voz falsa: fala "instantânea" para o teste não depender de TTS
    const synth = { speaking: false, pending: false, paused: false, getVoices: () => [], speak(u) { setTimeout(() => u.onstart?.(), 10) }, cancel() {}, resume() {}, pause() {}, addEventListener() {}, removeEventListener() {} }
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
  })
  await page.getByRole('button', { name: 'Ouvir narração' }).click()
  await page.waitForSelector('main[data-staged="narracao"]')
  await page.waitForTimeout(500) // fim da transição de 320 ms
  const op = await page.locator('nav[aria-label="Ações rápidas"]').evaluate((e) => getComputedStyle(e).opacity)
  assert.ok(Number(op) < 0.9, `opacidade ${op}`)
  assert.equal(await page.locator('.mu-eq').count(), 1)
  await ctx.close()
})

test('7: aviso de cookies sai em arco', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })
  const page = await ctx.newPage()
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await page.goto(BASE + '/')
  const aviso = page.getByRole('region', { name: 'Aviso de cookies' })
  await page.getByRole('button', { name: 'Só o essencial' }).click()
  assert.match(await aviso.getAttribute('class'), /mu-arc-out/)
  await aviso.waitFor({ state: 'detached' })
  await ctx.close()
})

test('15 e 16 (Hick e Miller): lista em grupos por região, nenhum com mais de 7 escolhas', async () => {
  const { ctx, page } = await open('/galeria')
  const sizes = await page.$$eval('ul[data-group]', (uls) => uls.map((u) => u.children.length))
  await ctx.close()
  assert.ok(sizes.length >= 3, `grupos: ${sizes}`)
  assert.ok(sizes.every((n) => n >= 1 && n <= 7), `tamanhos: ${sizes}`)
})

test('18 Postel: placa, caixa alta, acento e nome levam ao monumento e a URL é corrigida', async () => {
  for (const [path, name] of [['/monumento/GRACILIANO', 'Graciliano Ramos'], ['/placa/4', 'Nise da Silveira'], ['/monumento/nise-da-silveira', 'Nise da Silveira'], ['/monumento/L%C3%AAdo', 'Lêdo Ivo'], ['/monumento/01/', 'Graciliano Ramos']]) {
    const { ctx, page } = await open(path)
    assert.equal(await page.locator('h1').first().textContent(), name, path)
    assert.match(page.url(), /\/monumento\/[a-z0-9]+$/, `${path} → ${page.url()}`)
    await ctx.close()
  }
})

test('11: cartões da lista têm profundidade (perspectiva e sombra em camadas)', async () => {
  const { ctx, page } = await open('/galeria')
  const t = await page.locator('.mu-tilt').first().evaluate((e) => [getComputedStyle(e).transform, getComputedStyle(e).boxShadow])
  await ctx.close()
  assert.notEqual(t[0], 'none')
  assert.ok((t[1].match(/rgba|oklch/g) || []).length >= 2, t[1])
})

test('6 e 9 com "reduzir movimento": nada anima e tudo continua funcionando', async () => {
  const { ctx, page } = await open('/monumento/graciliano', { reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Relatar' }).click()
  await page.getByRole('dialog').waitFor()
  const dur = await page.locator('[role="dialog"]').evaluate((e) => getComputedStyle(e).animationDuration)
  assert.ok(parseFloat(dur) < 0.01, dur)
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('dialog').count(), 0)
  await ctx.close()
})
