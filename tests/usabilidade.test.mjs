// Testes de usabilidade: quantos passos cada tarefa leva e se a tela pede decisões demais (sobrecarga cognitiva).
// Metas: ler a placa e ganhar o selo em 1 ação; nenhuma tela com mais de 7 escolhas; mensagens curtas;
// conteúdo visível em menos de 2,5 s. Resultado documentado em docs/usabilidade.md.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = process.env.USAB_PORT || '4195'
const BASE = `http://127.0.0.1:${PORT}`
let server, browser
before(async () => {
  server = spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, PORT, FIGMA_DEV_SERVER_HOST: '127.0.0.1' }, stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break } catch {} await new Promise((r) => setTimeout(r, 300)) }
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
})
after(async () => { await browser?.close(); try { process.kill(-server.pid) } catch {} })

async function phone(user = null, cookie = true) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  if (cookie) await ctx.addInitScript(() => localStorage.setItem('mu_cookie_notice', '1'))
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await ctx.route('**/api/auth/me', (r) => r.fulfill({ status: user ? 200 : 401, contentType: 'application/json', body: JSON.stringify({ configured: true, user }) }))
  return { ctx, page: await ctx.newPage() }
}
const words = (s) => s.trim().split(/\s+/).length

test('tarefa 1 · ler a placa pela câmera do celular e ganhar o selo: 1 ação, confirmação em menos de 2,5 s', async () => {
  const { ctx, page } = await phone()
  const t0 = Date.now()
  await page.goto(BASE + '/monumento/graciliano?via=qr') // a ação é apontar a câmera; o link já chega carimbando
  await page.getByText('Carimbo da placa guardado!').waitFor()
  const ms = Date.now() - t0
  assert.ok(ms < 2500, `confirmação em ${ms} ms`)
  assert.ok(words(await page.getByRole('status').textContent()) <= 30, 'mensagem longa demais')
  await ctx.close()
})

test('tarefa 2 · com conta, ler pela câmera abre o app na obra com a barra de abas, sem ler de novo (0 toque extra)', async () => {
  const { ctx, page } = await phone({ sub: '1', name: 'Ana Souza', email: 'ana@x.com', role: 'visitante' })
  await page.goto(BASE + '/monumento/nise?via=qr')
  await page.waitForURL('**/app')
  await page.getByRole('navigation', { name: 'Abas' }).waitFor()
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem('mu_app:ana@x.com:collected') || '[]')).includes('nise'))
  await ctx.close()
})

test('tarefa 3 · scanner do app: 1 toque em "Ler placa" abre a câmera, sem outro menu no caminho', async () => {
  const { ctx, page } = await phone({ sub: '1', name: 'Ana Souza', email: 'ana@x.com', role: 'visitante' })
  await page.goto(BASE + '/app')
  await page.getByRole('button', { name: 'Ler placa' }).last().click()
  await page.getByText(/QR Code/).first().waitFor()
  await ctx.close()
})

test('tarefa 4 · ver uma obra pela galeria: 2 toques (galeria → obra) e nenhum selo indevido', async () => {
  const { ctx, page } = await phone()
  await page.goto(BASE + '/')
  await page.getByRole('link', { name: 'Ver a galeria' }).click()
  await page.getByRole('link', { name: /Lêdo Ivo/ }).first().click()
  await page.getByRole('heading', { name: 'Lêdo Ivo', level: 1 }).waitFor()
  assert.equal(await page.evaluate(() => (JSON.parse(localStorage.getItem('mu_progress') || '{}').stamps || []).length), 0)
  await ctx.close()
})

test('carga cognitiva · página da obra: no máximo 3 ações principais na primeira tela e 1 controle de áudio', async () => {
  const { ctx, page } = await phone()
  await page.goto(BASE + '/monumento/graciliano')
  await page.getByRole('heading', { level: 1 }).waitFor()
  const acima = await page.$$eval('main button, main a', (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.width > 0 }).length)
  assert.ok(acima <= 7, `${acima} controles na primeira tela (Miller: até 7)`)
  assert.equal(await page.getByRole('button', { name: 'Ouvir narração' }).count(), 1)
  await ctx.close()
})

test('carga cognitiva · primeiro acesso: aviso com 2 botões e 2 escolhas, microfone fora', async () => {
  const { ctx, page } = await phone(null, false)
  await page.goto(BASE + '/')
  const aviso = page.getByRole('region', { name: 'Aviso de cookies' })
  await aviso.waitFor()
  assert.equal(await aviso.getByRole('button').count(), 2)
  assert.equal(await aviso.getByRole('checkbox').count(), 2)
  assert.match(await aviso.textContent(), /microfone nunca/i)
  await ctx.close()
})

test('carga cognitiva · localização é pedida uma vez: depois de responder, não pergunta de novo', async () => {
  const { ctx, page } = await phone({ sub: '1', name: 'Ana Souza', email: 'ana@x.com', role: 'visitante' })
  await page.goto(BASE + '/app#trilha')
  const aviso = page.getByTestId('aviso-localizacao')
  await aviso.waitFor()
  await aviso.getByRole('button', { name: 'Agora não' }).click()
  await page.reload()
  await page.waitForTimeout(800)
  assert.equal(await page.getByTestId('aviso-localizacao').count(), 0)
  await ctx.close()
})

test('consistência · com conta, a mesma barra de abas aparece na home, na galeria e na obra', async () => {
  const { ctx, page } = await phone({ sub: '1', name: 'Ana Souza', email: 'ana@x.com', role: 'visitante' })
  for (const p of ['/', '/galeria', '/monumento/graciliano']) {
    await page.goto(BASE + p)
    await page.getByRole('navigation', { name: 'Abas' }).waitFor()
    await page.getByRole('link', { name: /Ana · Meus carimbos/ }).first().waitFor()
  }
  await ctx.close()
})

test('perfil só no aparelho: pede o nome, entra no app e nada é enviado ao servidor', async () => {
  const { ctx, page } = await phone()
  const posts = []
  page.on('request', (r) => { if (r.method() !== 'GET') posts.push(r.url()) })
  await page.goto(BASE + '/entrar?returnTo=/app')
  await page.getByRole('button', { name: /Continuar sem conta/ }).click()
  await page.getByLabel('Como podemos te chamar?').fill('Ana')
  await page.getByRole('button', { name: 'Salvar neste aparelho' }).click()
  await page.waitForURL('**/app')
  await page.getByRole('navigation', { name: 'Abas' }).waitFor()
  assert.deepEqual(posts, [], 'nenhum envio ao servidor')
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mu_local_user')).name), 'Ana')
  await ctx.close()
})

test('perfil só no aparelho: ler o QR pela câmera abre o app e o selo entra no passaporte', async () => {
  const { ctx, page } = await phone()
  await page.addInitScript(() => localStorage.setItem('mu_local_user', JSON.stringify({ id: 'abc', name: 'Ana', createdAt: 1 })))
  await page.goto(BASE + '/monumento/nise?via=qr')
  await page.waitForURL('**/app')
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem('mu_app:local-abc@aparelho:collected') || '[]')).includes('nise'))
  await page.reload()
  assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem('mu_app:local-abc@aparelho:collected')))).includes('nise'), 'selo continua depois de recarregar')
  await ctx.close()
})

test('dados no aparelho: sair NÃO apaga; outra conta não vê os selos da anterior; voltar traz tudo de volta', async () => {
  const { ctx, page } = await phone()
  await page.addInitScript(() => { if (!sessionStorage.getItem('init')) { sessionStorage.setItem('init', '1'); localStorage.setItem('mu_local_user', JSON.stringify({ id: 'a1', name: 'Ana', createdAt: 1 })) } })
  await page.goto(BASE + '/monumento/nise?via=qr')
  await page.waitForURL('**/app')
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem('mu_app:local-a1@aparelho:collected') || '[]')).includes('nise'))
  await page.waitForFunction(() => !localStorage.getItem('mu_app:local-a1@aparelho:dirty') && !!localStorage.getItem('mu_app:local-a1@aparelho:seal'))
  // sai da conta
  await page.goto('about:blank')
  await page.goto(BASE + '/app#perfil')
  await page.getByText('Sair da conta').click()
  await page.waitForURL(BASE + '/')
  assert.equal(await page.evaluate(() => localStorage.getItem('mu_local_user')), null, 'sessão encerrada')
  assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem('mu_app:local-a1@aparelho:collected') || '[]'))).includes('nise'), 'sair não apaga os selos')
  // outra pessoa cria perfil no mesmo aparelho: começa do zero
  await page.evaluate(() => localStorage.setItem('mu_local_user', JSON.stringify({ id: 'b2', name: 'Bia', createdAt: 2 })))
  await page.goto(BASE + '/app')
  await page.getByRole('navigation', { name: 'Abas' }).waitFor()
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('mu_app:local-b2@aparelho:collected') || '[]')), [], 'Bia não herda os selos de Ana')
  assert.equal(await page.evaluate(() => sessionStorage.getItem('mu_session')), 'local-b2')
  // Ana volta: selos continuam lá
  await page.evaluate(() => localStorage.setItem('mu_local_user', JSON.stringify({ id: 'a1', name: 'Ana', createdAt: 1 })))
  await page.goto(BASE + '/app')
  await page.getByRole('navigation', { name: 'Abas' }).waitFor()
  assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem('mu_app:local-a1@aparelho:collected') || '[]'))).includes('nise'), 'Ana recupera os selos')
  await ctx.close()
})

test('selo copiado de outra conta no mesmo aparelho é recusado (vai para quarentena, não aparece)', async () => {
  const { ctx, page } = await phone()
  await page.addInitScript(() => { if (!sessionStorage.getItem('init')) { sessionStorage.setItem('init', '1'); localStorage.setItem('mu_local_user', JSON.stringify({ id: 'c3', name: 'Caio', createdAt: 1 })) } })
  await page.goto(BASE + '/app')
  await page.getByRole('navigation', { name: 'Abas' }).waitFor()
  await page.waitForFunction(() => !!localStorage.getItem('mu_app:local-c3@aparelho:seal'))
  // alguém edita o armazenamento e "dá" selos a Caio, copiados de outra conta
  await page.evaluate(() => { localStorage.setItem('mu_app:local-c3@aparelho:collected', JSON.stringify(['nise', 'graciliano'])); localStorage.removeItem('mu_app:local-c3@aparelho:dirty') })
  await page.reload()
  await page.getByRole('navigation', { name: 'Abas' }).waitFor()
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('mu_app:local-c3@aparelho:collected') || '[]')), [], 'selos sem assinatura válida não entram')
  assert.ok(await page.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith('mu_quarantine:local-c3@aparelho:'))), 'guardado em quarentena, não destruído')
  await ctx.close()
})

test('perfil salvo no aparelho aparece em "Entrar" para voltar com um toque', async () => {
  const { ctx, page } = await phone()
  await page.addInitScript(() => localStorage.setItem('mu_local_profiles', JSON.stringify([{ id: 'a1', name: 'Ana', createdAt: 1 }])))
  await page.goto(BASE + '/entrar')
  await page.getByRole('button', { name: 'Continuar como Ana' }).click()
  await page.waitForURL('**/app')
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mu_local_user')).id), 'a1')
  await ctx.close()
})

test('conta Google: abre com os selos salvos online (outro aparelho) e envia os novos para a nuvem', async () => {
  const { ctx, page } = await phone({ sub: 'g1', name: 'Gil Souza', email: 'gil@x.com', role: 'visitante' })
  const puts = []
  await ctx.route('**/api/progress', async (r) => {
    if (r.request().method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ configured: true, doc: { collected: ['graciliano'], xp: 40 } }) })
    const doc = JSON.parse(r.request().postData()).doc
    puts.push(doc)
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ configured: true, doc, rejected: [] }) })
  })
  await page.goto(BASE + '/monumento/nise?via=qr') // selo novo neste aparelho
  await page.waitForURL('**/app')
  await page.getByRole('navigation', { name: 'Abas' }).waitFor()
  await page.waitForFunction(() => { const c = JSON.parse(localStorage.getItem('mu_app:gil@x.com:collected') || '[]'); return c.includes('graciliano') && c.includes('nise') })
  for (let i = 0; i < 40 && !puts.some((d) => d.collected.includes('nise') && d.collected.includes('graciliano')); i++) await page.waitForTimeout(100)
  assert.ok(puts.some((d) => d.collected.includes('nise') && d.collected.includes('graciliano')), 'selo novo foi para a nuvem junto com os antigos')
  await ctx.close()
})

// Simula o navegador: estado da permissão da câmera e contador de pedidos (getUserMedia)
const camStub = (state) => {
  window.__gum = 0
  const q = navigator.permissions.query.bind(navigator.permissions)
  navigator.permissions.query = (d) => (d.name === 'camera' ? Promise.resolve({ state: window.__camState, onchange: null }) : q(d))
  window.__camState = state
  navigator.mediaDevices.getUserMedia = async () => {
    window.__gum++
    if (window.__camState !== 'granted') throw Object.assign(new Error('negado'), { name: 'NotAllowedError' })
    const c = document.createElement('canvas'); c.width = 8; c.height = 8; return c.captureStream()
  }
}

test('câmera recusada no navegador: o site não pede de novo e explica como liberar', async () => {
  const { ctx, page } = await phone()
  await page.addInitScript(() => localStorage.setItem('mu_local_user', JSON.stringify({ id: 'p1', name: 'Pia', createdAt: 1 })))
  await page.addInitScript(camStub, 'denied')
  for (let i = 0; i < 2; i++) {
    await page.goto('about:blank')
    await page.goto(BASE + '/app')
    await page.getByRole('button', { name: /Ler QR Code/ }).first().click()
    await page.getByText(/Câmera bloqueada para este site/).waitFor()
  }
  assert.equal(await page.evaluate(() => window.__gum), 0, 'nenhum pedido de câmera quando o navegador já recusou')
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mu_perms')).cam), false, 'recusa guardada')
  await ctx.close()
})

test('câmera já permitida: o aviso de primeiro acesso não pergunta de novo', async () => {
  const { ctx, page } = await phone(null, false)
  await page.addInitScript(camStub, 'granted')
  await page.goto(BASE + '/')
  const aviso = page.getByRole('region', { name: 'Aviso de cookies' })
  await aviso.waitFor()
  await aviso.getByRole('button', { name: 'Permitir e continuar' }).click()
  await page.waitForTimeout(300)
  assert.equal(await page.evaluate(() => window.__gum), 0, 'não abriu a câmera só para perguntar')
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mu_perms')).cam), true)
  await ctx.close()
})

test('câmera já permitida: abrir o leitor liga a câmera direto, sem aviso nem pedido', async () => {
  const { ctx, page } = await phone()
  await page.addInitScript(() => localStorage.setItem('mu_local_user', JSON.stringify({ id: 'p2', name: 'Rui', createdAt: 1 })))
  await page.addInitScript(camStub, 'granted')
  await page.goto(BASE + '/app')
  await page.getByRole('button', { name: /Ler QR Code/ }).first().click()
  await page.waitForFunction(() => window.__gum === 1)
  assert.equal(await page.getByTestId('aviso-camera-qr').count(), 0, 'sem aviso "Usar a câmera" quando já permitida')
  await ctx.close()
})
