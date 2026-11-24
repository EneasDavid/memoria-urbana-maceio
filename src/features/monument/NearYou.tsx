import { useEffect, useState } from 'react'
import { Icon } from '../../ui'
import { monuments, type Monument } from '../../data'
import { distance, fmtDistance, nearby } from '../../shared/geo'
import { monumentUrl } from '../../app/router'
import { useLiveLocation } from '../../shared/useLocation'
import { loadPerms, savePerms } from '../../shared/permissions'

// "Perto daqui" com a localização REAL do visitante. Só lê o GPS depois de um toque de consentimento
// (ou se o navegador já tem a permissão). A posição fica só na memória da aba: não é gravada nem enviada.
// Sem permissão, mostra o que está perto desta obra.
export function NearYou({ m }: { m: Monument }) {
  const loc = useLiveLocation(true)
  const [asked, setAsked] = useState(false)
  useEffect(() => { if (loadPerms().loc) loc.start(); else loc.resume(); return loc.stop }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const here = loc.status === 'ok' && loc.here ? { lat: loc.here[0], lng: loc.here[1] } : null
  const list = here
    ? monuments.filter((x) => x.id !== m.id).map((x) => ({ m: x, meters: distance(here, x) })).sort((a, b) => a.meters - b.meters).slice(0, 3)
    : nearby(m, monuments)

  return (
    <section aria-labelledby="perto" className="mt-10">
      <h2 id="perto" className="text-[22px] font-bold tracking-[-0.02em]">{here ? 'Perto de você' : 'Perto desta obra'}</h2>
      {here ? (
        <p className="mt-1 text-[13.5px] text-black/70">Distâncias a partir de onde você está agora{loc.accuracy ? ` (precisão de ${loc.accuracy} m)` : ''}. Sua localização não sai do aparelho.</p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { setAsked(true); savePerms({ ...loadPerms(), loc: true }); loc.start() }} className="mu-press h-11 px-4 rounded-full bg-white mu-edge text-[14.5px] font-semibold inline-flex items-center gap-2">
            <Icon name="pin" size={16} stroke={2.3} className="text-[#1f6b6b]" />Usar minha localização
          </button>
          <span className="text-[13px] text-black/70">
            {loc.status === 'denied' ? 'Permissão negada. Mostrando o que está perto desta obra.' : loc.status === 'asking' && asked ? 'Procurando sua posição…' : 'Opcional: a posição fica só no seu celular.'}
          </span>
        </div>
      )}
      <ul className="mt-3 grid gap-2">
        {list.map(({ m: n, meters }) => (
          <li key={n.id}>
            <a href={monumentUrl(n.id)} className="mu-press flex items-center gap-3 rounded-[16px] bg-white px-4 py-3 min-h-[56px] mu-edge mu-raise-1">
              <span className="flex-1 min-w-0"><span className="block text-[15.5px] font-semibold leading-tight">{n.name}</span><span className="block text-[13px] text-black/70">{n.kind} · {n.area}</span></span>
              <span className="text-[13px] font-semibold text-[#1f6b6b] tabular">{fmtDistance(meters)}</span>
              <Icon name="chevR" size={15} stroke={2.2} className="text-black/40" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
