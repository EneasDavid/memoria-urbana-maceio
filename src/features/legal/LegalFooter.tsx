import { LEGAL_LINKS, ORG } from '../../legal/org'

// Rodapé de todas as páginas públicas: links legais + natureza do projeto (itens 1, 2, 3, 15).
export function LegalFooter() {
  return (
    <footer className="mt-12 border-t border-black/10 pt-6 pb-24 text-[13px] text-black/70">
      <div className="flex items-center gap-2.5">
        <img src="/memoria-urbana-logo.png" alt="" className="w-7 h-7 rounded-full object-cover mu-multiply" />
        <span className="font-semibold text-black">{ORG.nome}</span>
      </div>
      <p className="mt-2 leading-snug">{ORG.natureza} Sem cadastro para ler e sem rastreamento de visitantes.</p>
      <nav aria-label="Informações legais" className="mt-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {LEGAL_LINKS.map((l) => (
            <li key={l.href}><a href={l.href} className="inline-flex min-h-[32px] items-center underline underline-offset-2 hover:text-black">{l.label}</a></li>
          ))}
        </ul>
      </nav>
    </footer>
  )
}
