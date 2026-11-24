import { useState } from 'react'
import { thematicTrails } from './trails'
import { monumentUrl } from '../../app/router'
import { loadProgress } from '../../shared/progress'

// Trilhas temáticas na página inicial, sem login. Os passos já visitados (cache local) aparecem marcados.
export function ThemeTrails() {
  const trails = thematicTrails()
  const [open, setOpen] = useState<string | null>(null)
  const visited = new Set(loadProgress().visited)
  return (
    <section aria-labelledby="trilhas" className="mt-10">
      <h2 id="trilhas" className="text-[22px] font-bold tracking-[-0.02em]">Trilhas temáticas</h2>
      <p className="mt-1 text-[14.5px] text-black/70">Montadas a partir do material, do tema e do lugar de cada obra. Sem cadastro.</p>
      <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {trails.map((t) => {
          const n = t.items.filter((m) => visited.has(m.id)).length
          return (
            <li key={t.id} className="rounded-[20px] bg-white mu-edge mu-raise-1">
              <button aria-expanded={open === t.id} onClick={() => setOpen(open === t.id ? null : t.id)} className="mu-press w-full text-left p-4 min-h-[64px]">
                <span className="block text-[16px] font-semibold">{t.title}</span>
                <span className="block text-[13px] text-black/70">{t.hint} · <span className="tabular">{n}/{t.items.length}</span> visitados</span>
              </button>
              {open === t.id && (
                <ol className="px-4 pb-4 grid gap-1.5">
                  {t.items.map((m, i) => (
                    <li key={m.id}><a href={monumentUrl(m.id)} className="text-[14.5px] underline-offset-2 hover:underline">{visited.has(m.id) ? '✓ ' : `${i + 1}. `}{m.name}</a></li>
                  ))}
                </ol>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
