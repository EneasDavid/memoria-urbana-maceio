import { monuments } from '../../data'
import { Avatar } from '../../ui'
import { monumentUrl } from '../../app/router'
import { logout, type SessionUser } from '../auth/useSession'

// Área com conta (esqueleto). Próximas sprints: carimbos salvos no servidor, passaporte, 3D/RA.
// A gamificação sem login (cache do aparelho) está em estudo no Jira e, quando o visitante entrar,
// os carimbos guardados no aparelho serão mesclados à conta.
export function AppHome({ user }: { user: SessionUser }) {
  return (
    <main className="min-h-dvh bg-[#f6f3ec] text-black">
      <div className="max-w-[760px] mx-auto px-5 py-8">
        <div className="flex items-center gap-3">
          {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-full" /> : <Avatar name={user.name} size={44} />}
          <div className="flex-1">
            <h1 className="text-[22px] font-bold leading-tight">Olá, {user.name.split(' ')[0]}</h1>
            <p className="text-[14px] text-black/55">Sua Trilha Cultural</p>
          </div>
          <button onClick={logout} className="h-9 px-4 rounded-full bg-black/[0.06] text-[14px] font-semibold">Sair</button>
        </div>

        <section className="mt-8 rounded-[22px] bg-white p-5">
          <h2 className="text-[17px] font-semibold">Carimbos</h2>
          <p className="mt-1 text-[14px] text-black/55">Leia a placa de um monumento para ganhar o carimbo. (Em construção.)</p>
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {monuments.slice(0, 9).map((m) => (
              <li key={m.id}>
                <a href={monumentUrl(m.id)} className="block rounded-[14px] bg-[#f6f3ec] px-3 py-2.5 text-[14px] font-medium">{m.name}</a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
