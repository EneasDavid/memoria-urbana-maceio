import type { Report } from '../../data'

// Relatos de dano feitos na página pública. Sem login e sem dado pessoal.
// Enquanto a API de relatos não existe (KAN-24 → backend na sprint 6), eles ficam numa fila
// local do aparelho e serão enviados quando /api/reports estiver no ar.
const KEY = 'mu_reports_pending'

export function queueReport(r: Omit<Report, 'id' | 'at' | 'status'>): void {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown[]
    list.push({ ...r, at: Date.now() })
    localStorage.setItem(KEY, JSON.stringify(list.slice(-20)))
  } catch {
    /* armazenamento indisponível (aba anônima/Safari): o relato se perde, a página segue funcionando */
  }
}
