// Trilhas temáticas, grafo de personalidades e progresso local-first.
// Pré-requisito para a parte no navegador: `pnpm build`.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { monuments } from '../src/data.ts'
import { people, monumentIdsOf } from '../src/graph.ts'
import { thematicTrails, personTrail, walkOrder } from '../src/features/trails/trails.ts'
import { loadProgress } from '../src/shared/progress.ts'

test('grafo: toda pessoa citada num monumento existe e todo monumento do grafo existe no acervo', () => {
  const ids = new Set(monuments.map((m) => m.id))
  const pids = new Set(people.map((p) => p.id))
  for (const m of monuments) if (m.person) assert.ok(pids.has(m.person), `${m.id} aponta para pessoa inexistente ${m.person}`)
  for (const p of people) for (const l of p.links) {
    if (l.monumentId) assert.ok(ids.has(l.monumentId), `${p.id} → ${l.monumentId}`)
    else assert.ok(Number.isFinite(l.lat) && Number.isFinite(l.lng), `${p.id} → ${l.label} sem coordenadas`)
  }
})

test('grafo 1:N: Graciliano liga a estátua à Biblioteca em Maceió e a Palmeira dos Índios', () => {
  const t = personTrail('graciliano-ramos')
  assert.equal(t.title, 'Trilha Graciliano')
  assert.ok(t.steps.some((s) => /Biblioteca Pública Estadual/.test(s.label) && s.city === 'Maceió'))
  assert.ok(t.steps.some((s) => s.city === 'Palmeira dos Índios'))
  assert.equal(t.steps[0].city, 'Maceió', 'Maceió primeiro')
  assert.deepEqual(monumentIdsOf('graciliano-ramos'), ['graciliano'])
})

test('Trilha de Bronze: só obras de bronze georreferenciadas, em ordem de caminhada', () => {
  const bronze = thematicTrails().find((t) => t.id === 'bronze')
  assert.ok(bronze.items.length >= 3)
  for (const m of bronze.items) assert.equal(m.material, 'Bronze')
  assert.deepEqual(walkOrder(bronze.items).map((m) => m.id), bronze.items.map((m) => m.id))
})

test('progresso local tolera dado corrompido ou adulterado', () => {
  const fake = (v) => ({ getItem: () => v })
  assert.deepEqual(loadProgress(fake('{lixo')).visited, [])
  assert.deepEqual(loadProgress(fake(JSON.stringify({ v: 1, visited: ['a', 7, { x: 1 }], trails: {}, mode: 'admin' }))), { v: 1, visited: ['a'], trails: {}, mode: null })
})

const PORT = process.env.TRAILS_PORT || '4193'
const BASE = `http://127.0.0.1:${PORT}`
let server, browser
before(async () => {
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' }, stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break } catch {} await new Promise((r) => setTimeout(r, 300)) }
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
})
after(async () => { await browser?.close(); try { process.kill(-server.pid) } catch {} })

async function guest() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(() => localStorage.setItem('mu_cookie_notice', '1'))
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await ctx.route('**/api/auth/me', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: '{"configured":true,"user":null}' }))
  return { ctx, page: await ctx.newPage() }
}

test('QR da placa → página abre sem login; "+ Mais sobre" gera a Trilha e pergunta onde salvar', async () => {
  const { ctx, page } = await guest()
  await page.goto(BASE + '/monumento/graciliano?utm_source=placa')
  await page.getByRole('heading', { name: 'Graciliano Ramos', level: 1 }).waitFor()
  assert.equal(page.url().includes('/entrar'), false, 'sem login wall')
  await page.getByRole('button', { name: /Mais sobre Graciliano Ramos/ }).click()
  await page.getByRole('button', { name: 'Gerar a Trilha Graciliano' }).click()
  await page.getByText(/Deseja sincronizar seu progresso na nuvem/).waitFor()
  await page.getByRole('checkbox', { name: /Biblioteca Pública Estadual/ }).check()
  await page.getByRole('button', { name: 'Salvar neste aparelho' }).click()
  await page.getByText('Progresso salvo só neste aparelho.').waitFor()
  // Hidratação pelo cache: recarregar mantém o passo marcado e a visita aparece na Trilha de Bronze
  await page.reload()
  await page.getByRole('button', { name: /Mais sobre Graciliano Ramos/ }).click()
  await page.getByRole('button', { name: 'Gerar a Trilha Graciliano' }).click()
  assert.equal(await page.getByRole('checkbox', { name: /Biblioteca Pública Estadual/ }).isChecked(), true)
  assert.equal(await page.getByText(/Deseja sincronizar/).count(), 0, 'não pergunta de novo')
  await page.goto(BASE + '/')
  await page.getByRole('button', { name: /Trilha de Bronze/ }).click()
  await page.getByRole('link', { name: '✓ Graciliano Ramos' }).waitFor()
  await ctx.close()
})
