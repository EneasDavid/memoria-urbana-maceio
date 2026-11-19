// Pós-build de SEO: o Google precisa achar e ler as páginas sem depender do JavaScript.
// Gera, a partir de dist/index.html:
//   - um index.html por rota pública (monumentos e páginas legais) com título, descrição, canonical,
//     Open Graph, JSON-LD e o texto principal dentro de #root (o React substitui ao carregar);
//   - index.html com noindex para as rotas de conta (/entrar, /app, /painel) e o protótipo;
//   - robots.txt e sitemap.xml com a URL do site (SITE_URL).
// Variáveis: SITE_URL (padrão: Vercel) e GOOGLE_SITE_VERIFICATION (código do Search Console, opcional).
import fs from 'node:fs'
import path from 'node:path'
import { monuments } from '../src/data.ts'
import { nearby, fmtDistance } from '../src/shared/geo.ts'

const DIST = path.resolve(import.meta.dirname, '../dist')
export const SITE = (process.env.SITE_URL || 'https://memoria-urbana-maceio.vercel.app').replace(/\/+$/, '')
const VERIFY = process.env.GOOGLE_SITE_VERIFICATION || ''
const NAME = 'Memória Urbana Maceió'
const TODAY = new Date().toISOString().slice(0, 10)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const cut = (s, n = 155) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)) + '…')
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`

const LEGAL = {
  privacidade: ['Política de Privacidade', 'Quais dados o Memória Urbana Maceió trata, por quê, por quanto tempo e como exercer seus direitos pela LGPD.'],
  termos: ['Termos de uso', 'Regras de uso do Memória Urbana Maceió: serviço gratuito, conduta, segurança na rua e propriedade intelectual.'],
  cookies: ['Cookies', 'Os únicos cookies e armazenamentos que o site usa, todos essenciais. Sem publicidade e sem rastreamento.'],
  acessibilidade: ['Acessibilidade', 'Compromisso com a WCAG 2.1 AA, recursos de acessibilidade do site e limitações conhecidas.'],
  creditos: ['Créditos das imagens', 'Autoria, fonte e situação de uso de cada foto exibida no Memória Urbana Maceió.'],
  sobre: ['Sobre o projeto', 'Projeto acadêmico, gratuito e sem fins lucrativos sobre as estátuas e praças de Maceió e os museus da cidade.'],
}
const PRIVATE = ['entrar', 'app', 'painel', 'prototipo']

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
  .replace(/\s*<meta name="robots"[^>]*>/, '')
  .replace(/\s*<meta property="og:(title|description)"[^>]*>/g, '')
  .replace(/\s*<meta name="description"[^>]*>/, '')

function page({ route, title, description, body = '', jsonld = [], index = true }) {
  const url = SITE + route
  const head = [
    `<meta name="description" content="${esc(description)}">`,
    `<meta name="robots" content="${index ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'}">`,
    index ? `<link rel="canonical" href="${esc(url)}">` : '',
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${NAME}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${SITE}/og.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="Memória Urbana Maceió: estátuas, praças e museus de Maceió">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="theme-color" content="#f6f3ec" media="(prefers-color-scheme: light)">`,
    `<meta name="theme-color" content="#0e1418" media="(prefers-color-scheme: dark)">`,
    `<meta name="color-scheme" content="light dark">`,
    VERIFY ? `<meta name="google-site-verification" content="${esc(VERIFY)}">` : '',
    ...jsonld.map(ld),
  ].filter(Boolean).join('\n    ')
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>\n    ${head}`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}

function write(route, html) {
  const file = route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route.slice(1), 'index.html')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, html)
}

const org = { '@type': 'Organization', name: NAME, url: SITE + '/', logo: SITE + '/memoria-urbana-logo.png' }
const crumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + item })) })

// Monumentos
for (const m of monuments) {
  const route = `/monumento/${m.id}`
  const long = `${m.name} · ${m.role} | ${NAME}`
  const title = long.length <= 75 ? long : `${m.name} | ${NAME}`
  const description = cut(m.summary)
  const body = `<main id="conteudo" style="max-width:640px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;line-height:1.55">
<p>${esc(m.kind)} · Placa ${esc(m.plate)} · ${esc(m.area)}</p>
<h1>${esc(m.name)}</h1>
<p>${esc(m.role)} · ${esc(m.years)}</p>
<p>${esc(m.summary)}</p>
<h2>Continue a história no museu</h2>
<p><strong>${esc(m.museum.name)}</strong>, ${esc(m.museum.address)}${m.museum.hours ? ` · ${esc(m.museum.hours)}` : ''}. ${esc(m.museum.why)}</p>
<h2>Fontes</h2>
<ul>${m.sources.map((s) => `<li><a href="${esc(s.url)}">${esc(s.label)}</a></li>`).join('')}</ul>
<h2>Perto daqui</h2>
<ul>${nearby(m, monuments).map(({ m: n, meters }) => `<li><a href="/monumento/${n.id}">${esc(n.name)}</a> · ${fmtDistance(meters)}</li>`).join('')}</ul>
<p><a href="/">Ver todos os monumentos de Maceió</a></p>
</main>`
  const place = {
    '@context': 'https://schema.org',
    '@type': ['TouristAttraction', m.kind === 'Praça' ? 'Park' : 'LandmarksOrHistoricalBuildings'],
    name: m.name,
    description: m.summary,
    url: SITE + route,
    address: { '@type': 'PostalAddress', streetAddress: m.address, addressLocality: 'Maceió', addressRegion: 'AL', addressCountry: 'BR' },
    geo: { '@type': 'GeoCoordinates', latitude: m.lat, longitude: m.lng },
    isAccessibleForFree: true,
    publicAccess: m.visit !== 'Fechado',
    inLanguage: 'pt-BR',
    citation: m.sources.map((s) => s.url),
  }
  write(route, page({ route, title, description, body, jsonld: [place, crumbs([['Monumentos', '/'], [m.name, route]])] }))
}

// Página inicial (lista)
{
  const body = `<main id="conteudo" style="max-width:640px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;line-height:1.55">
<h1>${NAME}</h1>
<p>Quem são as estátuas e praças de Maceió e qual museu continua cada história. Sem cadastro e sem rastreamento.</p>
<ul>${monuments.map((m) => `<li><a href="/monumento/${m.id}">${esc(m.name)}</a>: ${esc(m.role)} · ${esc(m.area)}</li>`).join('')}</ul>
</main>`
  const site = { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: SITE + '/', inLanguage: 'pt-BR', publisher: org }
  const list = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Monumentos de Maceió', itemListElement: monuments.map((m, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/monumento/${m.id}`, name: m.name })) }
  write('/', page({ route: '/', title: `${NAME}: estátuas, praças e museus de Maceió`, description: 'Quem são as estátuas e praças de Maceió e qual museu continua cada história. Páginas abertas pelo QR ou NFC das placas, sem cadastro.', body, jsonld: [site, list] }))
}

// Páginas legais
for (const [slug, [t, d]] of Object.entries(LEGAL)) {
  const body = `<main id="conteudo" style="max-width:640px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif"><h1>${esc(t)}</h1><p>${esc(d)}</p></main>`
  write('/' + slug, page({ route: '/' + slug, title: `${t} · ${NAME}`, description: d, body }))
}

// Rotas de conta e protótipo: fora do índice
for (const slug of PRIVATE) write('/' + slug, page({ route: '/' + slug, title: NAME, description: 'Área do Memória Urbana Maceió.', index: false }))

// Fallback do SPA (rotas desconhecidas, como /monumento/nao-existe): sem conteúdo e fora do índice.
// vercel.json e o Caddy reescrevem para /spa.html só quando não existe arquivo para a rota.
fs.writeFileSync(path.join(DIST, 'spa.html'), page({ route: '/', title: NAME, description: 'Memória Urbana Maceió.', index: false }))

// robots.txt e sitemap.xml
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /app\nDisallow: /painel\nDisallow: /entrar\nDisallow: /prototipo\n\nSitemap: ${SITE}/sitemap.xml\n`)
const urls = [['/', '1.0'], ...monuments.map((m) => [`/monumento/${m.id}`, '0.9']), ...Object.keys(LEGAL).map((s) => ['/' + s, '0.3'])]
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, p]) => `  <url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod><priority>${p}</priority></url>`).join('\n')}\n</urlset>\n`)

console.log(`SEO: ${urls.length} URLs no sitemap, ${PRIVATE.length} rotas noindex, site ${SITE}`)
