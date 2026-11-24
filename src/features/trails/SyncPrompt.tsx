import { useEffect, useState } from 'react'
import { loadProgress, setMode, type SaveMode } from '../../shared/progress'

// Aviso de persistência híbrida, não bloqueante: aparece uma vez, quando a pessoa interage com uma trilha sem conta.
// "Salvar neste aparelho" mantém tudo local; "Sincronizar na nuvem" leva ao login com Google e volta para cá.
export function SyncPrompt({ returnTo }: { returnTo: string }) {
  const [mode, setM] = useState<SaveMode>(() => loadProgress().mode)
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' }).then((r) => r.json()).then((j) => setSignedIn(!!j?.user && !j.user.demo)).catch(() => {})
  }, [])
  if (signedIn || mode) {
    return mode === 'local' ? <p className="mt-3 text-[13px] text-black/60">Progresso salvo só neste aparelho.</p> : null
  }
  return (
    <div role="region" aria-label="Onde guardar seu progresso" className="mt-4 rounded-[16px] border border-[#1f6b6b]/25 bg-[#1f6b6b]/[0.06] p-4">
      <p className="text-[15px] font-semibold">Deseja sincronizar seu progresso na nuvem (Login com Google) ou salvar localmente no cache deste dispositivo?</p>
      <p className="mt-1 text-[13px] text-black/70">Você pode continuar a trilha agora; esta escolha não bloqueia nada.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`/entrar?returnTo=${encodeURIComponent(returnTo)}`} onClick={() => setMode('nuvem')} className="mu-press h-11 px-4 rounded-full bg-[#1f6b6b] text-white text-[14.5px] font-semibold grid place-items-center">Sincronizar na nuvem</a>
        <button onClick={() => setM(setMode('local').mode)} className="mu-press h-11 px-4 rounded-full bg-white mu-edge text-[14.5px] font-semibold">Salvar neste aparelho</button>
      </div>
    </div>
  )
}
