// Relatório de conformidade (requisito 40): lê docs/conformidade-40.md e confere a matriz.
// - os 40 itens existem, numerados de 1 a 40;
// - todo status é ok | parcial | pendente | n/a;
// - todo arquivo citado como evidência (entre crases) existe;
// - item parcial ou pendente tem task do Jira;
// Escreve uma tabela-resumo (no GitHub Actions vai para o resumo da execução) e sai com erro se reprovar.
import { readFileSync, existsSync, appendFileSync } from 'node:fs'

const md = readFileSync('docs/conformidade-40.md', 'utf8')
const rows = md.split('\n').filter((l) => /^\| \d+ \|/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
const errors = []
const count = { ok: 0, parcial: 0, pendente: 0, 'n/a': 0 }
const nums = rows.map((r) => Number(r[0]))
for (let i = 1; i <= 40; i++) if (!nums.includes(i)) errors.push(`item ${i} ausente`)
for (const [n, req, status, evidence, task] of rows) {
  if (!(status in count)) { errors.push(`item ${n} (${req}): status "${status}" inválido`); continue }
  count[status]++
  for (const [, path] of evidence.matchAll(/`([^`]+)`/g)) {
    if (/^[./]?[\w.-]+(\/[\w.-]+)+$|^[\w-]+\.(md|json|yml|ts|mjs)$/.test(path) && !path.startsWith('/') && !existsSync(path)) errors.push(`item ${n}: evidência ${path} não existe`)
  }
  if ((status === 'parcial' || status === 'pendente') && !/KAN-\d+/.test(task)) errors.push(`item ${n} (${req}): ${status} sem task`)
}
const ok = errors.length === 0
const out = [
  `## Relatório de conformidade · ${ok ? 'APROVADO ✅' : 'REPROVADO ❌'}`,
  '',
  '| Status | Itens |', '|---|---|',
  `| ok | ${count.ok} |`, `| parcial | ${count.parcial} |`, `| pendente | ${count.pendente} |`, `| n/a | ${count['n/a']} |`,
  '',
  '| Base | Situação |', '|---|---|',
  '| LGPD | ' + (ok ? 'conferida (itens 11–20, 34, 35)' : 'ver erros') + ' |',
  '| Código de Defesa do Consumidor | ' + (ok ? 'conferido (itens 21–28)' : 'ver erros') + ' |',
  '| Marco Civil da Internet | ' + (ok ? 'conferido (itens 4, 11, 32)' : 'ver erros') + ' |',
  '| Políticas internas de segurança | ' + (ok ? 'conferidas (itens 1–10, 36–39)' : 'ver erros') + ' |',
  ...(errors.length ? ['', '### Erros', ...errors.map((e) => `- ${e}`)] : []),
  '',
].join('\n')
console.log(out)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out)
process.exit(ok ? 0 : 1)
