// Login (Google ou só neste aparelho), localização real e aviso de permissão de câmera/galeria, no navegador.
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

async function withFakeApi(start = null, colorScheme = 'light', extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme, ...extra })
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

test('login: Google ou "continuar sem conta, salvando neste aparelho"; sem acesso de demonstração', async () => {
  const { ctx, page } = await withFakeApi()
  await page.goto(BASE + '/entrar?returnTo=/monumento/nise')
  await page.getByRole('button', { name: /Continuar sem conta, salvando neste aparelho/ }).waitFor()
  assert.equal(await page.getByText('Acesso de demonstração').count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Como gestor' }).count(), 0)
  await page.getByRole('button', { name: /Continuar sem conta/ }).click()
  await page.waitForURL('**/monumento/nise')
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mu_progress')).mode), 'local')
  await ctx.close()
})

test('perto daqui: com permissão, usa a localização real do visitante', async () => {
  const { ctx, page } = await withFakeApi(null, 'light', { permissions: ['geolocation'], geolocation: { latitude: -9.6658, longitude: -35.7352, accuracy: 15 } })
  await page.goto(BASE + '/monumento/graciliano')
  await page.getByRole('heading', { name: 'Perto de você' }).waitFor()
  const first = await page.locator('#perto ~ ul li').first().textContent()
  assert.match(first, /Martírios|Catedral|Tavares Bastos|Bom Jesus/, 'no Centro, o mais perto é do Centro, não da orla')
  await ctx.close()
})

test('perto daqui: sem permissão, mostra o que está perto da obra e oferece usar a localização', async () => {
  const { ctx, page } = await withFakeApi()
  await page.goto(BASE + '/monumento/graciliano')
  await page.getByRole('heading', { name: 'Perto desta obra' }).waitFor()
  await page.getByRole('button', { name: 'Usar minha localização' }).waitFor()
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
  await page.getByTestId('aviso-localizacao').getByRole('button', { name: 'Agora não' }).click()
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

// Localização real do aparelho no mapa da Trilha
const trilha = (page) => page.getByRole('navigation', { name: 'Abas' }).getByRole('button', { name: 'Trilha', exact: true }).click()

test('localização: aviso antes do pedido do navegador, com opção de recusar', async () => {
  const { ctx, page } = await withFakeApi(REAL)
  await page.goto(BASE + '/app')
  await trilha(page)
  const aviso = page.getByTestId('aviso-localizacao')
  await aviso.waitFor()
  assert.match(await aviso.textContent(), /não é gravada nem enviada/)
  await aviso.getByRole('button', { name: 'Agora não' }).click()
  await page.getByRole('button', { name: 'Mostrar onde estou' }).waitFor()
  assert.equal(await page.getByText('Você está aqui').count(), 0, 'sem localização não há "Você está aqui"')
  await ctx.close()
})

test('localização: com permissão, mostra onde a pessoa está, libera o GPS e acompanha o movimento', async () => {
  const { ctx, page } = await withFakeApi(REAL, 'light', { permissions: ['geolocation'], geolocation: { latitude: -9.66705, longitude: -35.71245, accuracy: 25 } })
  await page.goto(BASE + '/app')
  await trilha(page)
  await page.getByText('Você está aqui').waitFor()
  assert.equal(await page.getByTestId('aviso-localizacao').count(), 0, 'permissão já dada: sem pedir de novo')
  await page.getByText(/Check-in por GPS/).first().waitFor()
  await ctx.setGeolocation({ latitude: -9.665, longitude: -35.735 })
  // No Centro, o mais perto é uma das placas da Praça dos Martírios ou da Praça Dom Pedro II (acervo ampliado)
  await page.getByText(/Praça dos Martírios|Catedral Metropolitana|Palácio Tavares Bastos|Igreja Bom Jesus/).first().waitFor()
  await page.getByRole('navigation', { name: 'Abas' }).getByRole('button', { name: 'Explorar', exact: true }).click()
  assert.match(await page.getByText(/Selo mais perto de você/).first().textContent(), /\d+ m/)
  await ctx.close()
})

test('painel do gestor com a identidade da logo e sem estrela', async () => {
  const { ctx, page } = await withFakeApi({ sub: 'g1', name: 'Gestora', email: 'g@prefeitura.example', role: 'gestor' })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(BASE + '/painel')
  await page.getByText('Painel da Prefeitura').waitFor()
  assert.equal(await page.locator('.mu-skyline').count() > 0, true, 'silhueta da cidade')
  assert.equal(await page.locator('path[d^="m12 3 2.7 5.6"]').count(), 0, 'estrela no painel')
  await ctx.close()
})

// Lista de monumentos da área logada
test('lista de monumentos: por área, filtro e abre a história', async () => {
  const { ctx, page } = await withFakeApi(REAL)
  await page.goto(BASE + '/app')
  const lista = page.getByTestId('lista-monumentos')
  await lista.waitFor()
  for (const area of ['Orla', 'Centro histórico', 'Bebedouro', 'Parte alta']) await lista.getByRole('heading', { name: area, level: 3 }).waitFor()
  assert.match(await lista.textContent(), /0 de \d+ com selo/)
  await lista.getByRole('button', { name: 'Centro histórico' }).click()
  assert.equal(await lista.getByRole('heading', { level: 3 }).count(), 1, 'filtro mostra só uma área')
  await lista.getByRole('button', { name: /Praça dos Martírios/ }).click()
  await page.getByRole('button', { name: 'Voltar' }).waitFor()
  await ctx.close()
})

test('lista de monumentos: com localização, ordena por perto e mostra a distância', async () => {
  const { ctx, page } = await withFakeApi(REAL, 'light', { permissions: ['geolocation'], geolocation: { latitude: -9.66705, longitude: -35.71245 } })
  await page.goto(BASE + '/app')
  const abas = page.getByRole('navigation', { name: 'Abas' })
  await abas.getByRole('button', { name: 'Trilha', exact: true }).click()
  await page.getByText('Você está aqui').waitFor()
  await abas.getByRole('button', { name: 'Explorar', exact: true }).click()
  const lista = page.getByTestId('lista-monumentos')
  assert.equal(await lista.getByRole('button', { name: 'Perto de você' }).getAttribute('aria-pressed'), 'true')
  await lista.getByRole('heading', { name: 'Mais perto de você' }).waitFor()
  assert.match(await lista.locator('li').first().textContent(), /Graciliano Ramos.*\d+ m/)
  await ctx.close()
})

// Área logada no computador: site largo como o protótipo, não a coluna do celular
for (const width of [1024, 1440]) {
  test(`computador (${width} px): topo com abas, lista em cartões e ficha em painel`, async () => {
    const { ctx, page } = await withFakeApi(REAL, 'light', { viewport: { width, height: 860 } })
    await page.goto(BASE + '/app')
    const abas = page.getByRole('navigation', { name: 'Abas' })
    await abas.getByRole('button', { name: 'Explorar', exact: true }).waitFor()
    assert.equal(await page.getByRole('navigation', { name: 'Abas' }).count(), 1, 'só o topo, sem a barra de baixo do celular')
    const box = await page.getByTestId('lista-monumentos').boundingBox()
    assert.ok(box && box.width > 500, 'lista ocupa a largura do computador (não a coluna de 480 px)')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'rolagem horizontal')
    const top = await page.locator('header').first().boundingBox()
    assert.ok(top && top.height <= 80, 'topo em uma linha')
    await page.getByTestId('lista-monumentos').getByRole('button', { name: /Graciliano Ramos/ }).first().click()
    await page.getByRole('dialog', { name: 'Detalhe' }).waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('dialog', { name: 'Detalhe' }).waitFor({ state: 'detached' })
    await abas.getByRole('button', { name: 'Trilha', exact: true }).click()
    await page.getByTestId('lista-monumentos').waitFor()
    await ctx.close()
  })
}

for (const scheme of ['light', 'dark']) {
  test(`computador sem violações de acessibilidade (${scheme === 'light' ? 'claro' : 'escuro'})`, async () => {
    const { ctx, page } = await withFakeApi(REAL, scheme, { viewport: { width: 1440, height: 900 } })
    await page.goto(BASE + '/app')
    for (const tab of ['Explorar', 'Trilha', 'Passaporte']) {
      await page.getByRole('navigation', { name: 'Abas' }).getByRole('button', { name: tab, exact: true }).click()
      await page.waitForTimeout(500)
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      assert.equal(bad.length, 0, tab + ': ' + bad.map((v) => v.id + ' ' + v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')).join(' | '))
    }
    await ctx.close()
  })
}
