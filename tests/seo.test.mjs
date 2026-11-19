// SEO: o Google precisa achar, ler e indexar as páginas públicas (e só elas).
// Pré-requisito: `pnpm build` (que roda scripts/prerender.mjs).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { monuments } from '../src/data.ts'

const read = (p) => readFileSync(p, 'utf8')
const html = (route) => read(route === '/' ? 'dist/index.html' : `dist${route}/index.html`)
const PUBLIC = ['/', ...monuments.map((m) => `/monumento/${m.id}`), '/privacidade', '/termos', '/cookies', '/acessibilidade', '/creditos', '/sobre']

test('site.json não bloqueia indexação (Figma Make pode reescrever)', () => {
  const site = JSON.parse(read('.figma/make/site.json'))
  assert.notEqual(site.robots?.index, false, 'robots.index=false gera noindex em todas as páginas')
})

test('robots.txt libera o site, bloqueia conta/API e aponta o sitemap', () => {
  const r = read('dist/robots.txt')
  assert.match(r, /User-agent: \*/)
  assert.doesNotMatch(r, /^Disallow: \/\s*$/m, 'robots.txt bloqueia tudo')
  for (const p of ['/api/', '/app', '/painel', '/entrar']) assert.match(r, new RegExp(`Disallow: ${p.replace('/', '\\/')}`))
  assert.match(r, /Sitemap: https:\/\/.+\/sitemap\.xml/)
})

test('sitemap.xml lista todas as páginas públicas', () => {
  const s = read('dist/sitemap.xml')
  for (const r of PUBLIC) assert.ok(s.includes(`${r === '/' ? '/' : r}</loc>`), `falta ${r} no sitemap`)
  assert.ok(!/\/(app|painel|entrar|prototipo)<\/loc>/.test(s), 'rota privada no sitemap')
})

test('toda página pública tem HTML próprio, indexável, com título, descrição, canonical e conteúdo', () => {
  const titles = new Set()
  for (const r of PUBLIC) {
    assert.ok(existsSync(r === '/' ? 'dist/index.html' : `dist${r}/index.html`), `sem HTML para ${r}`)
    const h = html(r)
    assert.match(h, /<html lang="pt-BR">/)
    assert.doesNotMatch(h, /noindex/, `${r} com noindex`)
    const t = h.match(/<title>([^<]+)<\/title>/)?.[1]
    assert.ok(t && t.length >= 15 && t.length <= 90, `título ruim em ${r}: ${t}`)
    assert.ok(!titles.has(t), `título repetido: ${t}`); titles.add(t)
    const d = h.match(/<meta name="description" content="([^"]+)"/)?.[1]
    assert.ok(d && d.length >= 50 && d.length <= 170, `descrição ruim em ${r}`)
    assert.match(h, new RegExp(`<link rel="canonical" href="https://[^"]+${r === '/' ? '/' : r}">`))
    assert.match(h, /<div id="root"><main id="conteudo"[^>]*>[\s\S]*<h1>/, `${r} sem conteúdo no HTML`)
  }
})

test('monumentos têm dados estruturados válidos (JSON-LD)', () => {
  for (const m of monuments) {
    const blocks = [...html(`/monumento/${m.id}`).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((x) => JSON.parse(x[1]))
    const place = blocks.find((b) => [].concat(b['@type']).includes('TouristAttraction'))
    assert.ok(place, `${m.id} sem TouristAttraction`)
    assert.equal(place.name, m.name)
    assert.equal(place.address.addressLocality, 'Maceió')
    assert.ok(place.geo.latitude && place.geo.longitude)
    assert.ok(blocks.some((b) => b['@type'] === 'BreadcrumbList'))
  }
})

test('rotas de conta, protótipo e fallback do SPA ficam fora do índice', () => {
  for (const r of ['/entrar', '/app', '/painel', '/prototipo']) assert.match(html(r), /noindex/)
  assert.match(read('dist/spa.html'), /noindex/)
  const v = JSON.parse(read('vercel.json'))
  assert.equal(v.rewrites[0].destination, '/spa.html')
})

test('og:image não usa foto de terceiro com autorização pendente', () => {
  for (const r of PUBLIC) {
    const img = html(r).match(/<meta property="og:image" content="([^"]+)"/)?.[1]
    assert.ok(img?.endsWith('/og.png'), `${r}: ${img}`)
  }
})

test('cabeçalhos: um só H1 por página e sem pular nível (h1 → h2 → h3)', () => {
  for (const r of PUBLIC) {
    const body = html(r).split('<div id="root">')[1]
    const levels = [...body.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]))
    assert.equal(levels.filter((l) => l === 1).length, 1, `${r}: ${levels.filter((l) => l === 1).length} H1`)
    for (let i = 1; i < levels.length; i++) assert.ok(levels[i] <= levels[i - 1] + 1, `${r}: pula de h${levels[i - 1]} para h${levels[i]}`)
  }
})

test('links internos: nenhum link quebrado no HTML gerado e cada monumento liga para 3 vizinhos', () => {
  const ok = new Set(['/', ...PUBLIC, '/entrar', '/app', '/painel', '/prototipo'])
  for (const r of PUBLIC) {
    for (const [, href] of html(r).matchAll(/<a href="(\/[^"#?]*)/g)) assert.ok(ok.has(href) || existsSync('dist' + href), `${r} → ${href} quebrado`)
  }
  for (const m of monuments) assert.equal((html(`/monumento/${m.id}`).split('Perto daqui')[1] || '').match(/href="\/monumento\//g)?.length >= 3, true, `${m.id} sem "Perto daqui"`)
})

test('imagem OG 1200×630 existe e é leve; logo comprimido', () => {
  const og = readFileSync('dist/og.png')
  assert.equal(og.readUInt32BE(16), 1200); assert.equal(og.readUInt32BE(20), 630)
  assert.ok(og.length < 200_000, `og.png com ${og.length} bytes`)
  assert.ok(readFileSync('dist/memoria-urbana-logo.png').length < 80_000, 'logo pesado (Core Web Vitals)')
  assert.match(html('/'), /og:image:width" content="1200"/)
})

test('slugs limpos: URLs de monumento só com minúsculas e sem acento', () => {
  for (const m of monuments) assert.match(m.id, /^[a-z0-9-]+$/)
})
