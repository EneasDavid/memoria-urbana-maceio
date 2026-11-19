import { useCallback, useState } from 'react'
import { Dashboard } from '../../Dashboard'
import { seedReports, type Report } from '../../data'
import type { SessionUser } from '../auth/useSession'

// Painel da prefeitura, só para contas com papel "gestor" (e-mails em GESTOR_EMAILS).
// Ainda usa os dados simulados do protótipo; a API de relatos e visitas entra na sprint 6.
export function PanelPage({ user }: { user: SessionUser }) {
  const [reports, setReports] = useState<Report[]>(seedReports)
  const [, setV] = useState(0)
  const bump = useCallback(() => setV((v) => v + 1), [])
  void user
  return (
    <div className="fixed inset-0">
      <Dashboard events={[]} reports={reports} setReports={setReports} bump={bump} onPublic={(id) => window.open(id ? `/monumento/${id}` : '/', '_blank')} />
    </div>
  )
}
