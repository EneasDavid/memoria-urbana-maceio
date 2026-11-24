import { useState } from 'react'
import { Icon } from '../../ui'
import { personById } from '../../graph'
import { personTrail } from './trails'
import { loadProgress, toggleStep } from '../../shared/progress'
import { SyncPrompt } from './SyncPrompt'

// "+ Mais sobre [Pessoa]": seção expansível que gera, em tempo de execução, a "Trilha [Pessoa]"
// a partir do grafo de conhecimento. Funciona sem conta; o progresso fica no aparelho.
export function PersonTrail({ personId, returnTo }: { personId?: string; returnTo: string }) {
  const p = personById(personId)
  const [open, setOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const [progress, setProgress] = useState(loadProgress)
  if (!p) return null
  const trail = personTrail(p.id)!
  const done = new Set(progress.trails[trail.title] || [])

  return (
    <section aria-labelledby="mais-sobre" className="mt-8 rounded-[var(--r-card)] bg-white mu-edge mu-raise-1">
      <h2 id="mais-sobre" className="text-[16px] font-semibold">
        <button aria-expanded={open} aria-controls="mais-sobre-corpo" onClick={() => setOpen((o) => !o)} className="mu-press w-full flex items-center gap-2 p-5 text-left min-h-[56px]">
          <span aria-hidden className="text-[#1f6b6b] text-[20px] leading-none w-5">{open ? '−' : '+'}</span>
          <span className="flex-1">Mais sobre {p.name}</span>
          <span className="text-[13px] font-normal text-black/60">{trail.steps.length} lugares</span>
        </button>
      </h2>
      {open && (
        <div id="mais-sobre-corpo" className="px-5 pb-5">
          <p className="text-[15px] leading-snug text-black/75">Outros lugares de Maceió e de Alagoas ligados a {p.short}. Monte a sua trilha e marque o que já visitou.</p>
          {!started ? (
            <button onClick={() => setStarted(true)} className="mu-press mt-4 h-12 w-full sm:w-auto px-6 rounded-[var(--r-inner)] bg-[#1f6b6b] text-white text-[15.5px] font-semibold inline-flex items-center justify-center gap-2">
              <Icon name="route" size={16} stroke={2.3} />Gerar a {trail.title}
            </button>
          ) : (
            <>
              <h3 className="mt-4 text-[18px] font-bold">{trail.title} <span className="text-[14px] font-normal text-black/60 tabular">· {done.size}/{trail.steps.length}</span></h3>
              <ol className="mt-3 grid gap-2">
                {trail.steps.map((s, i) => (
                  <li key={s.key} className="flex items-start gap-3 rounded-[16px] bg-[#f6f3ec] p-3">
                    <input type="checkbox" aria-label={`Visitei: ${s.label}`} checked={done.has(s.key)} onChange={() => setProgress(toggleStep(trail.title, s.key))} className="mt-1 h-5 w-5 accent-[#1f6b6b]" />
                    <span className="flex-1 min-w-0">
                      <a href={s.href} {...(s.internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })} className="block text-[15.5px] font-semibold leading-tight underline-offset-2 hover:underline">{i + 1}. {s.label}</a>
                      <span className="block text-[13px] text-black/70">{s.city} · {s.note}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <SyncPrompt returnTo={returnTo} />
            </>
          )}
        </div>
      )}
    </section>
  )
}
