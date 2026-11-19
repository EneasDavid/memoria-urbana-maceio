// Conformidade legal e LGPD: as 17 regras para um site não ser processado, checadas a cada push.
// Rodar depois de `pnpm build` (o item 7 inspeciona o bundle em dist/).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { monuments } from '../src/data.ts'
import { ORG } from '../src/legal/org.ts'

const read = (p) => readFileSync(p, 'utf8')
const walk = (dir, exts) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p, exts) : exts.some((e) => p.endsWith(e)) ? [p] : []
  })
const LEGAL = read('src/features/legal/LegalPages.tsx')
const PUBLIC = [...walk('src/features', ['.tsx', '.ts']), 'src/ReportSheet.tsx', 'src/app/Routes.tsx']
const publicText = PUBLIC.map((p) => [p, read(p)])
const section = (name) => {
  const i = LEGAL.indexOf(`export function ${name}(`)
  const j = LEGAL.indexOf('export function', i + 10)
  return LEGAL.slice(i, j === -1 ? undefined : j)
}

test('1. política de privacidade com as seções da LGPD', () => {
  const s = section('PrivacyPage')
  for (const t of ['Quem é o controlador', 'Base legal', 'Retenção', 'Cookies', 'Compartilhamento', 'transferência internacional', 'Direitos do titular', 'Encarregado', 'Crianças e adolescentes', 'art. 18'])
    assert.match(s, new RegExp(t, 'i'), `falta "${t}" na política de privacidade`)
})

test('2. termos de uso com objeto, conduta, responsabilidade e foro', () => {
  const s = section('TermsPage')
  for (const t of ['O que é o serviço', 'Uso adequado', 'Limitação de responsabilidade', 'Lei aplicável', 'Propriedade intelectual']) assert.match(s, new RegExp(t), `falta "${t}"`)
})

test('3. aviso de cookies montado em todas as páginas públicas e página de cookies', () => {
  assert.match(read('src/app/Routes.tsx'), /<CookieNotice \/>/)
  const s = section('CookiesPage')
  for (const c of ['mu_session', 'mu_oauth', 'mu_cookie_notice', 'mu_reports_pending']) assert.ok(s.includes(c), `cookie ${c} não documentado`)
})

test('4. política de reembolso: serviço gratuito e nenhum código de pagamento', () => {
  assert.match(section('TermsPage'), /reembolso/)
  const pay = /stripe|mercadopago|mercado ?pago|pagseguro|paypal|checkout|cart[aã]o de cr[eé]dito/i
  for (const p of [...walk('src', ['.ts', '.tsx']), ...walk('api', ['.ts'])]) assert.doesNotMatch(read(p), pay, `código de pagamento em ${p}`)
})

test('5. formulários informam finalidade e linkam a política (LGPD)', () => {
  assert.match(read('src/ReportSheet.tsx'), /href="\/privacidade"/, 'relato sem link para a política')
  assert.match(read('src/features/auth/LoginPage.tsx'), /href="\/privacidade"/, 'login sem link para a política')
  assert.match(read('src/features/auth/LoginPage.tsx'), /href="\/termos"/, 'login sem link para os termos')
})

test('6. só dados necessários: formulários públicos não pedem identificação', () => {
  const pii = /type="(email|tel)"|placeholder="[^"]*(e-?mail|telefone|cpf|whatsapp|endere[cç]o|seu nome)/i
  for (const [p, src] of publicText) assert.doesNotMatch(src, pii, `campo de dado pessoal em ${p}`)
})

test('7. sem scripts de rastreamento no bundle nem na configuração', () => {
  const trackers = /googletagmanager|google-analytics|gtag\(|fbq\(|connect\.facebook\.net|hotjar\.com|clarity\.ms|cdn\.segment\.com|mixpanel\.com|amplitude\.com|plausible\.io|matomo\.(js|php)|analytics\.tiktok|doubleclick\.net/i
  assert.ok(existsSync('dist/index.html'), 'rode pnpm build antes')
  for (const p of walk('dist', ['.html', '.js'])) {
    const m = read(p).match(trackers)
    assert.equal(m, null, `rastreador "${m?.[0]}" em ${p}`)
  }
  const site = JSON.parse(read('.figma/make/site.json'))
  assert.ok(!site.analytics?.googleAnalyticsId, 'Google Analytics ligado em .figma/make/site.json')
  assert.ok(!site.customScripts, 'scripts customizados em .figma/make/site.json')
  const csp = JSON.parse(read('vercel.json')).headers[0].headers.find((h) => h.key === 'Content-Security-Policy')?.value || ''
  assert.match(csp, /script-src 'self'(;|$)/, 'CSP precisa limitar scripts ao próprio site')
  assert.doesNotMatch(csp, /unsafe-eval/)
  assert.match(csp, /connect-src 'self'/, 'CSP precisa impedir envio de dados a terceiros')
})

test('8. acessibilidade: idioma, declaração e verificação automática', () => {
  assert.equal(JSON.parse(read('.figma/make/site.json')).language, 'pt-BR')
  assert.match(section('AccessibilityPage'), /WCAG 2\.1/)
  assert.ok(existsSync('tests/a11y.test.mjs'), 'teste automático de acessibilidade ausente')
  assert.match(read('src/index.css'), /prefers-reduced-motion/)
})

test('9. toda <img> pública tem alt', () => {
  for (const [p, src] of publicText) {
    for (const tag of src.match(/<img\b[^>]*>/g) || []) assert.match(tag, /\balt=/, `img sem alt em ${p}: ${tag.slice(0, 80)}`)
  }
  assert.match(read('src/MobileScreens.tsx'), /<img src=\{m\.photo\.src\} alt=\{/, 'foto do monumento sem alt')
})

test('10/11. contraste e teclado: foco visível e link para pular conteúdo', () => {
  assert.match(read('src/index.css'), /:focus-visible\s*\{[^}]*outline:\s*3px/)
  assert.match(read('src/app/Routes.tsx'), /<SkipLink \/>/)
  for (const f of ['src/features/monument/MonumentPage.tsx', 'src/features/monument/MonumentIndex.tsx', 'src/features/auth/LoginPage.tsx']) assert.match(read(f), /id="conteudo"/, `${f} sem id="conteudo"`)
  assert.match(read('src/ReportSheet.tsx'), /role="dialog"[\s\S]*aria-modal="true"/)
  assert.match(read('src/ReportSheet.tsx'), /Escape/)
})

test('12. sem avaliações, notas ou depoimentos inventados', () => {
  const fake = /depoimento|testemunho|★|estrelas|avalia[çc](ão|ões) de (clientes|usu[aá]rios)|rating|testimonial/i
  for (const [p, src] of publicText.filter(([p]) => !p.endsWith('LegalPages.tsx'))) assert.doesNotMatch(src, fake, `conteúdo de avaliação em ${p}`)
  assert.match(read('src/features/panel/PanelPage.tsx'), /Dados simulados/, 'painel com números simulados sem aviso')
  assert.match(read('src/app/Routes.tsx'), /dados e envios simulados/, 'protótipo sem aviso de simulação')
})

test('13. sem promessas falsas nas páginas públicas', () => {
  const claims = [/Nenhum dado pessoal é coletado/i, /100% seguro/i, /garantimos/i, /oficial da prefeitura/i]
  for (const [p, src] of publicText.filter(([p]) => !p.endsWith('ReportSheet.tsx'))) for (const c of claims) assert.doesNotMatch(src, c, `promessa indevida em ${p}`)
  assert.match(read('src/features/monument/MonumentPage.tsx'), /sentText=/, 'página pública usa o texto "a prefeitura recebeu" do protótipo')
})

test('14. toda foto tem autor, fonte e situação da licença', () => {
  for (const m of monuments.filter((x) => x.photo)) {
    assert.ok(m.photo.credit.trim(), `${m.id}: sem autor`)
    assert.match(m.photo.source, /^https:\/\//, `${m.id}: sem fonte`)
    assert.ok(m.photo.license.trim(), `${m.id}: sem licença/situação`)
  }
  assert.match(read('src/features/legal/LegalPages.tsx'), /export function CreditsPage/)
})

test('15. dados do projeto publicados', () => {
  assert.ok(ORG.responsavel && ORG.natureza && ORG.pessoaJuridica && ORG.cidade)
  assert.match(ORG.contato.url, /^https:\/\//)
  assert.match(ORG.natureza, /sem vínculo oficial|Não tem vínculo oficial/i)
})

test('16. conformidade LGPD documentada (registro de operações)', () => {
  const d = read('docs/lgpd.md')
  for (const t of ['Registro das operações', 'Base legal', 'Retenção', 'Direitos do titular', 'Incidente']) assert.match(d, new RegExp(t, 'i'), `docs/lgpd.md sem "${t}"`)
})

test('17. riscos jurídicos mapeados com dono e mitigação', () => {
  const d = read('docs/riscos-juridicos.md')
  assert.ok((d.match(/^\| R\d+/gm) || []).length >= 8, 'matriz de riscos com menos de 8 itens')
  for (const t of ['Mitigação', 'Probabilidade', 'Impacto']) assert.match(d, new RegExp(t))
})
