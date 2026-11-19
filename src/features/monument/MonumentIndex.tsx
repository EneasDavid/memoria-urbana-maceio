import { useEffect } from 'react'
import { monuments } from '../../data'
import { Photo, KindPill } from '../../MobileScreens'
import { monumentUrl } from '../../app/router'
import { LoginPill } from '../auth/TrailInvite'

// Lista pública. Cada card é um link comum (<a href>), então dá para abrir cada monumento
// em uma aba nova (Ctrl/⌘ + clique ou toque longo). Sem menu, sem login.
export function MonumentIndex() {
  useEffect(() => {
    document.title = 'Monumentos · Memória Urbana Maceió'
  }, [])

  return (
    <main className="min-h-dvh bg-[#f6f3ec] text-black">
      <div className="relative max-w-[1160px] mx-auto px-5 py-8">
        <div className="absolute right-5 top-8 [&>a]:static"><LoginPill returnTo="/app" /></div>
        <div className="flex items-center gap-3 pr-36">
          <img src="/memoria-urbana-logo.png" alt="" className="w-11 h-11 rounded-full object-cover bg-white" />
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.02em] leading-tight">Memória Urbana Maceió</h1>
            <p className="text-[14.5px] text-black/55">Quem são as estátuas e praças da cidade, e qual museu continua cada história.</p>
          </div>
        </div>

        <ul className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {monuments.map((m) => (
            <li key={m.id}>
              <a href={monumentUrl(m.id)} className="block group">
                <div className="relative h-[170px] rounded-[18px] overflow-hidden">
                  <Photo m={m} className="absolute inset-0" />
                  <span className="absolute left-2.5 top-2.5"><KindPill kind={m.kind} /></span>
                  <span className="absolute right-2.5 top-2.5 h-[22px] px-2 rounded-full bg-black/45 text-white text-[11px] font-bold grid place-items-center">Placa {m.plate}</span>
                </div>
                <div className="mt-2 text-[16px] font-semibold leading-tight group-hover:underline">{m.name}</div>
                <div className="text-[13.5px] text-black/50">{m.role} · {m.area}</div>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-[12.5px] text-black/45">Páginas abertas a todos, sem cadastro. Nenhum dado pessoal é coletado (LGPD).</p>
      </div>
    </main>
  )
}
