// Trilhas temáticas: agrupamento por atributos materiais e espaciais (tags) do acervo.
// Cada trilha é calculada em tempo de execução a partir de src/data.ts: novo monumento com o atributo entra sozinho.
import { monuments, type Monument } from '../../data.ts'
import { people, personById, type PlaceLink } from '../../graph.ts'
import { distance as haversine } from '../../shared/geo.ts'

export interface Trail { id: string; title: string; hint: string; items: Monument[] }

/** Ordena por vizinho mais próximo a partir do primeiro ponto: a caminhada fica curta. */
export function walkOrder<T extends { lat: number; lng: number }>(items: T[]): T[] {
  if (items.length < 3) return items
  const rest = [...items]
  const out = [rest.shift()!]
  while (rest.length) {
    const last = out[out.length - 1]
    rest.sort((a, b) => haversine(last, a) - haversine(last, b))
    out.push(rest.shift()!)
  }
  return out
}

const rule = (id: string, title: string, hint: string, f: (m: Monument) => boolean): Trail => ({ id, title, hint, items: walkOrder(monuments.filter(f)) })

export const thematicTrails = (): Trail[] => [
  rule('bronze', 'Trilha de Bronze', 'Estátuas e bustos de bronze, da orla ao Centro', (m) => m.material === 'Bronze'),
  rule('escritores', 'Trilha dos Escritores', 'Quem escreveu Alagoas', (m) => /Escritor|Poeta|Lexicógrafo|escritor/.test(m.role)),
  rule('fe', 'Trilha da Fé', 'Catedral, irmandades e azulejos', (m) => m.group === 'igrejas' || m.id === 'catedral'),
  rule('porto', 'Trilha do Porto', 'Jaraguá, onde a cidade começou', (m) => m.group === 'jaragua'),
  rule('republica', 'Trilha da República', 'Os presidentes alagoanos e o poder no Centro', (m) => ['floriano-peixoto', 'deodoro', 'tavares-bastos', 'dom-pedro-ii'].includes(m.person || '')),
  rule('braskem', 'Memória do Bebedouro', 'Patrimônio dos bairros esvaziados pelo afundamento do solo', (m) => m.group === 'bebedouro'),
].filter((t) => t.items.length >= 2)

export const trailById = (id: string) => thematicTrails().find((t) => t.id === id)

export interface PersonStep { key: string; label: string; city: string; note: string; kind: PlaceLink['kind']; href: string; internal: boolean }

/** "Trilha [Nome]": gerada em tempo de execução a partir do grafo; Maceió primeiro, depois o estado. */
export function personTrail(personId: string): { title: string; steps: PersonStep[] } | null {
  const p = personById(personId)
  if (!p) return null
  const steps = p.links.map((l, i): PersonStep => {
    const m = l.monumentId ? monuments.find((x) => x.id === l.monumentId) : undefined
    const q = m ? `${m.name}, ${m.address}, Maceió` : `${l.label}, ${l.city}, Alagoas`
    return {
      key: `${p.id}:${i}`, label: l.label, city: l.city, note: l.note, kind: l.kind, internal: !!m,
      href: m ? `/monumento/${m.id}` : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q),
    }
  })
  steps.sort((a, b) => Number(b.city === 'Maceió') - Number(a.city === 'Maceió'))
  return { title: `Trilha ${p.short}`, steps }
}

export const peopleWithTrails = () => people.filter((p) => p.links.length >= 2)
