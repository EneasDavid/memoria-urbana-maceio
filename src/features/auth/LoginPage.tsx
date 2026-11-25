import { useEffect, useState } from 'react'
import { GoogleG, Icon, LogoMark, EmMaceio, Skyline } from '../../ui'
import { loginUrl, useSession } from './useSession'
import { setMode } from '../../shared/progress'
import { listLocalProfiles, resumeLocalProfile, setLocalProfile } from '../../shared/localProfile'

// Entrada da área com conta. A conta é opcional: serve para pontuar na Trilha, salvar carimbos
// entre aparelhos. O botão leva ao fluxo OAuth 2.0 + PKCE no servidor.
export function LoginPage({ returnTo }: { returnTo: string }) {
  const s = useSession()

  useEffect(() => {
    document.title = 'Entrar · Memória Urbana Maceió'
    if (s.status === 'authenticated' && !s.user.local) window.location.replace(returnTo)
  }, [s.status, returnTo])

  const error = new URLSearchParams(window.location.search).get('erro')
  // Sem conta: tudo o que é público funciona e o progresso fica salvo só neste aparelho.
  const [asking, setAsking] = useState(false)
  const [name, setName] = useState('')
  const useDevice = (e?: React.FormEvent) => { e?.preventDefault(); setLocalProfile(name); setMode('local'); window.location.assign(returnTo) }
  // Perfis que já usaram este aparelho: sair não apaga, então dá para voltar com selos e pontos
  const [saved] = useState(() => listLocalProfiles())
  const resume = (id: string) => { if (resumeLocalProfile(id)) { setMode('local'); window.location.assign(returnTo) } }

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
          <a href={loginUrl(returnTo)} aria-disabled={s.status === 'loading'} className="mt-6 w-full min-h-[52px] px-4 py-2.5 rounded-[14px] border border-black/10 flex items-center justify-center gap-3 text-[16px] leading-tight font-semibold text-center">
            <GoogleG size={20} className="shrink-0" /><span>Continuar com Google</span>
          </a>
        )}

        {saved.length > 0 && (
          <div className="mt-4">
            <p className="text-[13px] font-semibold text-black/70">Perfis salvos neste aparelho</p>
            <ul className="mt-2 space-y-2">
              {saved.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => resume(p.id)} className="mu-press w-full min-h-12 rounded-[14px] border border-black/10 px-4 py-2 flex items-center gap-2 text-[15px] leading-tight font-semibold text-left">
                    <Icon name="person" size={17} className="text-[#1f6b6b] shrink-0" /><span className="min-w-0 break-words">Continuar como {p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 text-[13px] text-black/70"><span className="h-px flex-1 bg-black/10" />ou<span className="h-px flex-1 bg-black/10" /></div>
        {!asking ? (
          <button type="button" aria-label="Continuar sem conta, salvando neste aparelho" onClick={() => setAsking(true)} className="mu-press mt-4 w-full min-h-[52px] px-4 py-2.5 rounded-[14px] bg-[#0b2f49] text-white flex items-center justify-center gap-2.5 text-[16px] leading-tight font-semibold">
            <Icon name="lock" size={17} className="shrink-0" />
            <span className="flex flex-col items-start text-left">Continuar sem conta<span className="text-[13px] font-medium text-white/80">Salvando só neste aparelho</span></span>
          </button>
        ) : (
          <form onSubmit={useDevice} className="mt-4 rounded-[14px] bg-[#f6f3ec] p-4">
            <label htmlFor="nome-local" className="block text-[15px] font-semibold">Como podemos te chamar?</label>
            <input id="nome-local" autoFocus required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" placeholder="Ex.: Ana (fica só neste celular)" className="mt-2 w-full h-12 rounded-[12px] border border-black/15 bg-white px-3 text-[16px]" />
            <button type="submit" className="mu-press mt-3 w-full min-h-12 px-4 py-2 rounded-[12px] bg-[#0b2f49] text-white text-[16px] font-semibold">Salvar neste aparelho</button>
          </form>
        )}
        <p className="mt-2 text-[13px] leading-snug text-black/70">Seu nome, selos e trilhas ficam só neste celular. Nada vai para o servidor. Você pode entrar com Google depois para sincronizar.</p>

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
