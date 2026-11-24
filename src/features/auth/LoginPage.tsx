import { useEffect, useState } from 'react'
import { GoogleG, Icon, LogoMark, EmMaceio, Skyline } from '../../ui'
import { loginUrl, useSession } from './useSession'
import { setMode } from '../../shared/progress'

// Entrada da área com conta. A conta é opcional: serve para pontuar na Trilha, salvar carimbos
// entre aparelhos e ver em 3D. O botão leva ao fluxo OAuth 2.0 + PKCE no servidor.
export function LoginPage({ returnTo }: { returnTo: string }) {
  const s = useSession()

  useEffect(() => {
    document.title = 'Entrar · Memória Urbana Maceió'
    if (s.status === 'authenticated') window.location.replace(returnTo)
  }, [s.status, returnTo])

  const error = new URLSearchParams(window.location.search).get('erro')
  // Sem conta: tudo o que é público funciona e o progresso fica salvo só neste aparelho.
  const publicReturn = returnTo.startsWith('/monumento/') ? returnTo : '/'
  const useDevice = () => { setMode('local'); window.location.assign(publicReturn) }

  return (
    <main id="conteudo" className="min-h-dvh grid place-items-center bg-[#f6f3ec] text-black px-5">
      <div className="w-full max-w-[420px] rounded-[28px] bg-white p-7 overflow-hidden">
        <LogoMark size={64} />
        <h1 className="mt-4 text-[26px] font-bold tracking-[-0.02em] leading-tight">Trilha Cultural</h1>
        <EmMaceio className="mt-0.5 text-[14px]" />
        <p className="mt-2 text-[15.5px] text-black/70 leading-snug">Escolha onde guardar seu progresso: na nuvem, com sua conta Google, ou só neste aparelho. As páginas dos monumentos continuam abertas a todos, sem conta.</p>

        {error && <p className="mt-4 rounded-[12px] bg-[#c4402e]/10 px-3 py-2 text-[14px] text-[#a3321f]">Não foi possível entrar ({error}). Tente de novo.</p>}

        {s.status === 'unavailable' ? (
          <p className="mt-6 rounded-[12px] bg-[#dda93f]/15 px-3 py-2.5 text-[14px] text-[#6b4d0d]">{s.reason}</p>
        ) : (
          <a href={loginUrl(returnTo)} aria-disabled={s.status === 'loading'} className="mt-6 w-full h-[52px] rounded-[14px] border border-black/10 flex items-center justify-center gap-3 text-[16px] font-semibold">
            <GoogleG size={20} />Continuar com Google
          </a>
        )}

        <div className="mt-4 flex items-center gap-3 text-[13px] text-black/70"><span className="h-px flex-1 bg-black/10" />ou<span className="h-px flex-1 bg-black/10" /></div>
        <button type="button" onClick={useDevice} className="mu-press mt-4 w-full h-[52px] rounded-[14px] bg-[#0b2f49] text-white flex items-center justify-center gap-2 text-[16px] font-semibold">
          <Icon name="lock" size={17} />Continuar sem conta, salvando neste aparelho
        </button>
        <p className="mt-2 text-[13px] leading-snug text-black/70">Monumentos vistos e trilhas ficam guardados só no cache deste celular. Nada vai para o servidor. Você pode entrar com Google depois para sincronizar.</p>

        <ul className="mt-6 space-y-2 text-[13px] text-black/70">
          <li className="flex gap-2"><Icon name="shield" size={16} className="text-[#1f6b6b] shrink-0" />Recebemos só nome, e-mail e foto do Google. Nunca a senha.</li>
          <li className="flex gap-2"><Icon name="lock" size={16} className="text-[#1f6b6b] shrink-0" />Sessão em cookie seguro; nada de token salvo no navegador.</li>
        </ul>
        <p className="mt-5 text-[12.5px] leading-snug text-black/70">
          Ao entrar, você concorda com os <a href="/termos" className="underline">Termos de uso</a> e a <a href="/privacidade" className="underline">Política de Privacidade</a>. A conta é para maiores de 13 anos (regra do Google); menores de 18 devem usá-la com autorização de um responsável.
        </p>
      <Skyline className="block -mx-7 -mb-7 mt-6 w-[calc(100%+56px)] h-12" />
      </div>
    </main>
  )
}
