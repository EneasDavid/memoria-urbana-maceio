import { useEffect, useState } from 'react'
import { GoogleG, Icon } from '../../ui'
import { demoLogin, loginUrl, useSession } from './useSession'

// Entrada da área com conta. A conta é opcional: serve para pontuar na Trilha, salvar carimbos
// entre aparelhos e ver em 3D. O botão leva ao fluxo OAuth 2.0 + PKCE no servidor.
export function LoginPage({ returnTo }: { returnTo: string }) {
  const s = useSession()

  useEffect(() => {
    document.title = 'Entrar · Memória Urbana Maceió'
    if (s.status === 'authenticated') window.location.replace(returnTo)
  }, [s.status, returnTo])

  const error = new URLSearchParams(window.location.search).get('erro')
  const [busy, setBusy] = useState<'visitante' | 'gestor' | null>(null)
  const [demoErr, setDemoErr] = useState<string | null>(null)
  const demoAvailable = (s.status === 'anonymous' || s.status === 'unavailable') && s.demoAvailable
  const enterDemo = async (role: 'visitante' | 'gestor') => {
    setBusy(role); setDemoErr(null)
    try { await demoLogin(role); window.location.assign(role === 'gestor' ? '/painel' : returnTo) }
    catch (e) { setDemoErr((e as Error).message); setBusy(null) }
  }

  return (
    <main id="conteudo" className="min-h-dvh grid place-items-center bg-[#f6f3ec] text-black px-5">
      <div className="w-full max-w-[420px] rounded-[28px] bg-white p-7">
        <img src="/memoria-urbana-logo.png" alt="" className="w-12 h-12 rounded-full object-cover" />
        <h1 className="mt-4 text-[26px] font-bold tracking-[-0.02em] leading-tight">Trilha Cultural</h1>
        <p className="mt-2 text-[15.5px] text-black/70 leading-snug">Entre para pontuar em cada placa, guardar seus carimbos e ver os monumentos em 3D. As páginas dos monumentos continuam abertas a todos, sem conta.</p>

        {error && <p className="mt-4 rounded-[12px] bg-[#c4402e]/10 px-3 py-2 text-[14px] text-[#a3321f]">Não foi possível entrar ({error}). Tente de novo.</p>}

        {s.status === 'unavailable' ? (
          <p className="mt-6 rounded-[12px] bg-[#dda93f]/15 px-3 py-2.5 text-[14px] text-[#6b4d0d]">{s.reason}</p>
        ) : (
          <a href={loginUrl(returnTo)} aria-disabled={s.status === 'loading'} className="mt-6 w-full h-[52px] rounded-[14px] border border-black/10 flex items-center justify-center gap-3 text-[16px] font-semibold">
            <GoogleG size={20} />Continuar com Google
          </a>
        )}

        {demoAvailable && (
          <section aria-labelledby="demo-titulo" className="mt-6 rounded-[16px] bg-[#f6f3ec] p-4 mu-edge">
            <h2 id="demo-titulo" className="text-[15px] font-semibold">Acesso de demonstração</h2>
            <p className="mt-1 text-[13.5px] leading-snug text-black/70">Para conhecer a Trilha e o painel sem conta Google. Sem senha e sem dado pessoal; a sessão dura 2 horas e nada fica salvo.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => enterDemo('visitante')} disabled={!!busy} className="mu-press h-12 rounded-[12px] bg-white mu-edge text-[14px] font-semibold inline-flex items-center justify-center gap-2">{busy === 'visitante' ? <span className="mu-spin" aria-hidden="true" /> : null}Como visitante</button>
              <button type="button" onClick={() => enterDemo('gestor')} disabled={!!busy} className="mu-press h-12 rounded-[12px] bg-[#0b2f49] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2">{busy === 'gestor' ? <span className="mu-spin" aria-hidden="true" /> : null}Como gestor</button>
            </div>
            {demoErr && <p role="alert" className="mt-2 text-[13px] text-[#a3321f]">{demoErr}</p>}
          </section>
        )}

        <ul className="mt-6 space-y-2 text-[13px] text-black/70">
          <li className="flex gap-2"><Icon name="shield" size={16} className="text-[#1f6b6b] shrink-0" />Recebemos só nome, e-mail e foto do Google. Nunca a senha.</li>
          <li className="flex gap-2"><Icon name="lock" size={16} className="text-[#1f6b6b] shrink-0" />Sessão em cookie seguro; nada de token salvo no navegador.</li>
        </ul>
        <p className="mt-5 text-[12.5px] leading-snug text-black/70">
          Ao entrar, você concorda com os <a href="/termos" className="underline">Termos de uso</a> e a <a href="/privacidade" className="underline">Política de Privacidade</a>. A conta é para maiores de 13 anos (regra do Google); menores de 18 devem usá-la com autorização de um responsável.
        </p>
        <a href="/" className="mt-5 block text-center text-[15px] font-semibold text-[#1f6b6b]">Explorar sem conta</a>
      </div>
    </main>
  )
}
