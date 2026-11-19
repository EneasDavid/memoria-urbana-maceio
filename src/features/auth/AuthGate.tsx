import { useEffect, type ReactNode } from 'react'
import { useSession, type SessionUser } from './useSession'

// Protege as rotas da área logada (/app, /painel). As páginas de monumento NÃO passam por aqui.
export function AuthGate({ children, returnTo, role }: { children: (user: SessionUser) => ReactNode; returnTo: string; role?: SessionUser['role'] }) {
  const s = useSession()

  useEffect(() => {
    if (s.status === 'anonymous') window.location.replace(`/entrar?returnTo=${encodeURIComponent(returnTo)}`)
  }, [s.status, returnTo])

  if (s.status === 'authenticated') {
    if (role && s.user.role !== role) return <Message title="Acesso restrito" text="Esta área é só para a equipe de patrimônio da prefeitura." />
    return <>{children(s.user)}</>
  }
  if (s.status === 'unavailable') return <Message title="Área com conta indisponível" text={s.reason + ' As páginas dos monumentos continuam abertas a todos.'} />
  return <Message title="Carregando…" text="" />
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <main className="min-h-dvh grid place-items-center bg-[#f6f3ec] text-black px-6">
      <div className="text-center max-w-[440px]">
        <h1 className="text-[22px] font-bold">{title}</h1>
        {text && <p className="mt-2 text-[15px] text-black/60">{text}</p>}
        {text && <a href="/" className="mt-5 inline-flex h-11 items-center rounded-full bg-[#2c8585] px-5 text-[15px] font-semibold text-white">Ver monumentos</a>}
      </div>
    </main>
  )
}
