// Anexo real no relato (foto ou vídeo), no navegador: prévia, recodificação sem EXIF e recusa de arquivos perigosos.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = process.env.ATTACH_PORT || '4177'
const BASE = `http://127.0.0.1:${PORT}`
const FX = 'tests/fixtures/media/'
let server, browser

before(async () => {
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' }, stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break } catch {} await new Promise((r) => setTimeout(r, 300)) }
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
})
after(async () => { await browser?.close(); try { process.kill(-server.pid) } catch {} })

async function sheet() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(() => localStorage.setItem('mu_cookie_notice', '1'))
  const page = await ctx.newPage()
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await page.goto(BASE + '/monumento/graciliano')
  await page.getByRole('button', { name: 'Relatar' }).click()
  await page.getByRole('dialog').waitFor()
  return { ctx, page }
}

test('foto real: aparece a prévia recodificada e vai para a fila do aparelho com o relato', async () => {
  const { ctx, page } = await sheet()
  await page.setInputFiles('#relato-anexo', FX + 'foto.jpg')
  await page.getByTestId('anexo').waitFor()
  assert.match(await page.getByTestId('anexo').textContent(), /Foto 320×240 .* sem localização/)
  await page.getByRole('button', { name: 'Danificado' }).click()
  await page.getByRole('button', { name: 'Enviar relato' }).click()
  await page.getByText('Obrigado!').waitFor()
  const saved = await page.evaluate(() => new Promise((res) => {
    const q = JSON.parse(localStorage.getItem('mu_reports_pending') || '[]').at(-1)
    const req = indexedDB.open('mu_reports_media', 1)
    req.onsuccess = () => { const g = req.result.transaction('media').objectStore('media').get(q.at); g.onsuccess = () => res({ media: q.media, type: g.result?.type, size: g.result?.size }) }
  }))
  await ctx.close()
  assert.equal(saved.media.kind, 'image')
  assert.equal(saved.type, 'image/jpeg')
  assert.ok(saved.size > 0)
})

for (const [file, msg] of [['zip-renomeado.jpg', /ZIP/], ['poliglota.jpg', /compactado escondido/], ['script.jpg', /script/], ['bomba.png', /megapixels/], ['imagem.svg', /marcação/]]) {
  test(`recusa ${file} com aviso claro e sem anexar`, async () => {
    const { ctx, page } = await sheet()
    await page.setInputFiles('#relato-anexo', FX + file)
    const alert = page.getByRole('alert')
    await alert.waitFor()
    assert.match(await alert.textContent(), msg)
    assert.equal(await page.getByTestId('anexo').count(), 0)
    await ctx.close()
  })
}

test('arquivo acima de 25 MB é barrado antes de ser lido', async () => {
  const { ctx, page } = await sheet()
  await page.setInputFiles('#relato-anexo', { name: 'grande.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(26 * 1024 * 1024) })
  assert.match(await page.getByRole('alert').textContent(), /grande demais/)
  await ctx.close()
})
