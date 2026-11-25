// Texto nunca vaza nem é cortado dentro de botões e links (ex.: botão de altura fixa com rótulo em 2 linhas).
// Varre as telas principais em celular estreito (320 e 390 px), claro e escuro, e com fonte ampliada (acessibilidade).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = process.env.LAYOUT_PORT || '4197'
const BASE = `http://127.0.0.1:${PORT}`
let server, browser
before(async () => {
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' }, stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break } catch {} await new Promise((r) => setTimeout(r, 300)) }
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
})
after(async () => { await browser?.close(); try { process.kill(-server.pid) } catch {} })

const LOCAL = { id: 'a1', name: 'Maria Aparecida dos Santos', createdAt: 1 }
// seed: chaves do localStorage que cada tela precisa (perfil com nome longo, de propósito)
const PAGES = [
  { path: '/entrar', seed: {} },
  { path: '/entrar', name: '/entrar (perfis salvos)', seed: { mu_local_profiles: [LOCAL] } },
  { path: '/', seed: {} },
  { path: '/monumento/nise', seed: {} },
  { path: '/app#perfil', name: '/app (perfil)', seed: { mu_local_user: LOCAL } },
  { path: '/app#passaporte', name: '/app (passaporte)', seed: { mu_local_user: LOCAL } },
]

/** Botões e links visíveis cujo texto passa da caixa (corta ou vaza). */
function findOverflow() {
  const bad = []
  for (const el of document.querySelectorAll('button, a, [role="button"]')) {
    const box = el.getBoundingClientRect()
    if (!box.width || !box.height || !el.textContent.trim()) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[aria-hidden="true"]')) continue
    if (box.width <= 2 && box.height <= 2) continue // sr-only (ex.: "Pular para o conteúdo", só aparece no foco)
    const r = document.createRange()
    r.selectNodeContents(el)
    const t = r.getBoundingClientRect()
    const tol = 1.5
    const spills = t.width && (t.top < box.top - tol || t.bottom > box.bottom + tol || t.left < box.left - tol || t.right > box.right + tol)
    const clipped = (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') && !el.matches('.truncate, [data-truncate]') && (el.scrollHeight > el.clientHeight + tol || el.scrollWidth > el.clientWidth + tol)
    // botão com fundo ou borda: o texto não pode encostar na borda (rótulo espremido em 2 linhas numa altura fixa)
    const filled = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0
    const cramped = filled && box.height >= 36 && t.height && (t.top - box.top < 6 || box.bottom - t.bottom < 6)
    if (cramped) bad.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 60)}" espremido (folga ${Math.round(t.top - box.top)}/${Math.round(box.bottom - t.bottom)} px)`)
    if (spills || clipped) bad.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 60)}" (${Math.round(box.width)}×${Math.round(box.height)}, texto ${Math.round(t.width)}×${Math.round(t.height)})`)
  }
  return bad
}

for (const width of [320, 390]) {
  for (const scheme of ['light', 'dark']) {
    for (const zoom of [1, 1.25]) {
      test(`texto cabe nos botões e links · ${width}px · ${scheme}${zoom > 1 ? ' · fonte 125%' : ''}`, async () => {
        const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true, colorScheme: scheme })
        await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
        await ctx.route('**/api/**', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ configured: true, user: null }) }))
        const page = await ctx.newPage()
        const problems = []
        for (const p of PAGES) {
          await page.goto(BASE + '/robots.txt')
          await page.evaluate((seed) => {
            localStorage.clear()
            localStorage.setItem('mu_cookie_notice', '1')
            localStorage.setItem('mu_perms', JSON.stringify({ asked: true }))
            for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v))
          }, p.seed)
          await page.goto(BASE + p.path)
          await page.waitForLoadState('networkidle')
          if (zoom > 1) await page.evaluate((z) => { document.documentElement.style.fontSize = `${z * 100}%` }, zoom)
          await page.waitForTimeout(250)
          for (const b of await page.evaluate(findOverflow)) problems.push(`${p.name || p.path}: ${b}`)
          if (p.path === '/entrar' && !p.name) { // e depois de abrir o formulário do perfil local
            await page.getByRole('button', { name: /Continuar sem conta/ }).click()
            await page.waitForTimeout(150)
            for (const b of await page.evaluate(findOverflow)) problems.push(`/entrar (formulário): ${b}`)
          }
        }
        await ctx.close()
        assert.deepEqual(problems, [], 'texto vazando ou cortado:\n' + problems.join('\n'))
      })
    }
  }
}
