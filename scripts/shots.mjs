// Prints de revisão visual (Playwright): cada rota pública no claro e no escuro, em celular e desktop.
// Uso: pnpm build && pnpm shots   →   shots/<rota>-<tema>-<tela>.png
// O CI publica a pasta como artefato "prints" para comparar com o protótipo e com DESIGN.md.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const PORT = process.env.SHOTS_PORT || '4179'
const BASE = `http://127.0.0.1:${PORT}`
const ROUTES = ['/', '/monumento/graciliano', '/monumento/nise', '/monumento/martirios', '/privacidade', '/entrar']
const SCREENS = { celular: { width: 390, height: 844 }, desktop: { width: 1280, height: 860 } }

const server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break } catch {} await new Promise((r) => setTimeout(r, 300)) }
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
mkdirSync('shots', { recursive: true })
let n = 0
try {
  for (const route of ROUTES) for (const scheme of ['light', 'dark']) for (const [screen, viewport] of Object.entries(SCREENS)) {
    const ctx = await browser.newContext({ viewport, colorScheme: scheme, deviceScaleFactor: 1 })
    await ctx.addInitScript(() => localStorage.setItem('mu_cookie_notice', '1'))
    const page = await ctx.newPage()
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
    await page.goto(BASE + route)
    await page.waitForTimeout(500)
    const name = (route === '/' ? 'inicio' : route.slice(1).replace(/\//g, '-')) + `-${scheme === 'light' ? 'claro' : 'escuro'}-${screen}.png`
    await page.screenshot({ path: `shots/${name}`, fullPage: true })
    await ctx.close()
    n++
  }
} finally {
  await browser.close()
  try { process.kill(-server.pid) } catch {}
}
console.log(`${n} prints em shots/`)
