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

test('vídeo que este navegador não decodifica é aceito (duração conferida no envio) e o envio mostra animação', async () => {
  const { ctx, page } = await sheet()
  await page.setInputFiles('#relato-anexo', 'tests/fixtures/media/video.mp4')
  await page.getByTestId('anexo').waitFor({ timeout: 10000 })
  assert.match(await page.getByTestId('anexo').textContent(), /Vídeo .*duração conferida no envio/)
  await page.getByRole('button', { name: 'Danificado' }).click()
  await page.getByRole('button', { name: 'Enviar relato' }).click()
  await page.getByRole('button', { name: /Enviando vídeo/ }).waitFor()
  await page.getByText('Obrigado!').waitFor()
  await ctx.close()
})

test('enquanto verifica o arquivo aparece a animação de processamento', async () => {
  const { ctx, page } = await sheet()
  await page.evaluate(() => { const orig = File.prototype.arrayBuffer; File.prototype.arrayBuffer = function () { return new Promise((r) => setTimeout(() => r(orig.call(this)), 600)) } })
  await page.setInputFiles('#relato-anexo', 'tests/fixtures/media/foto.jpg')
  const p = page.getByTestId('anexo-processando')
  await p.waitFor()
  assert.match(await p.textContent(), /Lendo o arquivo|Verificando/)
  await page.getByTestId('anexo').waitFor()
  await ctx.close()
})

test('o contorno de foco do campo de detalhe não é cortado pela folha', async () => {
  const { ctx, page } = await sheet()
  await page.locator('textarea').focus()
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab')
  const r = await page.evaluate(() => {
    const t = document.querySelector('textarea').getBoundingClientRect()
    const clip = document.querySelector('[data-autoheight]').getBoundingClientRect()
    return { left: t.left - clip.left, right: clip.right - t.right }
  })
  await ctx.close()
  assert.ok(r.left >= 4 && r.right >= 4, `folga ${JSON.stringify(r)} (precisa de ≥ 4 px para o contorno de 3 px)`)
})

test('arquivo acima de 25 MB é barrado antes de ser lido', async () => {
  const { ctx, page } = await sheet()
  await page.setInputFiles('#relato-anexo', { name: 'grande.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(26 * 1024 * 1024) })
  assert.match(await page.getByRole('alert').textContent(), /grande demais/)
  await ctx.close()
})
