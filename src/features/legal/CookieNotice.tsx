import { useEffect, useState } from 'react'
import { requestDevicePerms, savePerms } from '../../shared/permissions'

// Aviso de cookies (item 3). O site só usa armazenamento essencial (sessão de login e preferências);
// não há cookies de publicidade nem de análise, então não há o que aceitar ou recusar: é um aviso.
const KEY = 'mu_cookie_notice'

export function CookieNotice() {
  const [show, setShow] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [loc, setLoc] = useState(true)
  const [cam, setCam] = useState(true)
  useEffect(() => {
    try { setShow(!localStorage.getItem(KEY)) } catch { setShow(true) }
  }, [])
  if (!show) return null
  const ok = (ask: boolean) => {
    if (ask && (loc || cam)) void requestDevicePerms({ loc, cam })
    else savePerms({ loc: false, cam: false })
    try { localStorage.setItem(KEY, '1') } catch { /* navegação privada */ }
    // Princípio 7: sai em arco (some de vez depois da animação; sem animação se "reduzir movimento")
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setShow(false)
    setLeaving(true)
    window.setTimeout(() => setShow(false), 300)
  }
  return (
    <section role="region" aria-label="Aviso de cookies" className={`fixed inset-x-3 bottom-3 z-[150] mx-auto max-w-[620px] rounded-[20px] bg-[#0b2f49] mu-navy-grad text-white p-4 ${leaving ? 'mu-arc-out' : 'mu-sheet-in'} shadow-[0_10px_40px_rgba(0,0,0,0.35)] flex flex-col sm:flex-row sm:items-center gap-3`}>
      <div className="flex-1">
        <p className="text-[14px] leading-snug">
          Usamos só cookies essenciais: o de login (se você entrar) e preferências guardadas no seu aparelho. Nada de publicidade ou rastreamento.{' '}
          <a href="/cookies" className="underline underline-offset-2 font-semibold">Saiba mais</a>
        </p>
        <fieldset className="mt-2 text-[13.5px] leading-snug">
          <legend className="font-semibold text-[#dda93f]">Para a experiência completa, permitir também:</legend>
          <label className="mt-1 flex items-start gap-2"><input type="checkbox" checked={loc} onChange={(e) => setLoc(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#dda93f]" /><span><b>Localização</b>: mostrar as obras perto de você. Fica só no aparelho.</span></label>
          <label className="mt-1 flex items-start gap-2"><input type="checkbox" checked={cam} onChange={(e) => setCam(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#dda93f]" /><span><b>Câmera</b>: ler o QR da placa dentro do site. Sem gravar imagem.</span></label>
          <p className="mt-1 text-white/75">O microfone nunca é usado. A galeria de fotos só é pedida se você anexar uma foto.</p>
        </fieldset>
      </div>
      <div className="flex sm:flex-col gap-2 shrink-0">
        <button onClick={() => ok(true)} className="mu-press h-11 px-5 rounded-[12px] bg-white text-[#0b2f49] text-[14px] font-semibold">Permitir e continuar</button>
        <button onClick={() => ok(false)} className="mu-press h-11 px-5 rounded-[12px] border border-white/40 text-white text-[14px] font-semibold">Só o essencial</button>
      </div>
    </section>
  )
}
