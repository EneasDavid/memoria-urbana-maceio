// Grafo de conhecimento (1:N): cada personalidade homenageada liga o monumento a outros pontos de interesse
// em Maceió e em Alagoas. Resolução de entidades: o monumento aponta para a pessoa por `person` (src/data.ts),
// e cada ponto aponta para um monumento do acervo (`monumentId`) ou para um lugar com coordenadas.
// Fontes: as mesmas da curadoria (ver docs/fontes-de-dados.md). Sem Wikipedia como fonte de texto.

export interface PlaceLink {
  label: string
  kind: 'monumento' | 'museu' | 'biblioteca' | 'casa' | 'cidade' | 'lugar'
  city: string // município (todos em Alagoas, salvo indicação)
  note: string
  monumentId?: string // quando o ponto também é uma placa do acervo
  lat?: number
  lng?: number
}

export interface Person {
  id: string
  name: string
  short: string
  links: PlaceLink[]
}

export const people: Person[] = [
  { id: 'graciliano-ramos', name: 'Graciliano Ramos', short: 'Graciliano', links: [
    { label: 'Estátua na orla de Pajuçara', kind: 'monumento', city: 'Maceió', monumentId: 'graciliano', note: 'Onde a trilha começa.' },
    { label: 'Biblioteca Pública Estadual Graciliano Ramos', kind: 'biblioteca', city: 'Maceió', lat: -9.6666, lng: -35.7366, note: 'Leva o nome dele; peça Vidas Secas e São Bernardo.' },
    { label: 'Ecomuseu Comunitário Graciliano é uma Graça', kind: 'museu', city: 'Maceió', lat: -9.6467, lng: -35.746, note: 'Museu comunitário dedicado à obra do escritor.' },
    { label: 'Casa Museu Graciliano Ramos', kind: 'casa', city: 'Palmeira dos Índios', lat: -9.4066, lng: -36.6278, note: 'Casa onde morou quando foi prefeito, hoje museu.' },
    { label: 'Busto de Graciliano Ramos', kind: 'monumento', city: 'Palmeira dos Índios', lat: -9.4069, lng: -36.6309, note: 'Homenagem da cidade que ele governou.' },
    { label: 'Quebrangulo, cidade natal', kind: 'cidade', city: 'Quebrangulo', lat: -9.3197, lng: -36.4711, note: 'Onde nasceu, em 1892.' },
  ] },
  { id: 'paulo-gracindo', name: 'Paulo Gracindo', short: 'Paulo Gracindo', links: [
    { label: 'Estátua em Pajuçara', kind: 'monumento', city: 'Maceió', monumentId: 'paulo', note: 'O bairro onde ele cresceu.' },
    { label: 'Museu da Imagem e do Som de Alagoas (Misa)', kind: 'museu', city: 'Maceió', lat: -9.6727, lng: -35.7222, note: 'Memória do rádio e da TV, onde ele fez carreira.' },
  ] },
  { id: 'aurelio-buarque', name: 'Aurélio Buarque de Holanda', short: 'Aurélio', links: [
    { label: 'Estátua na Ponta Verde', kind: 'monumento', city: 'Maceió', monumentId: 'aurelio', note: 'Sentado no banco, com os óculos na mão.' },
    { label: 'Instituto Histórico e Geográfico de Alagoas', kind: 'museu', city: 'Maceió', lat: -9.662, lng: -35.7393, note: 'A Maceió onde ele estudou e deu aulas.' },
    { label: 'Passo de Camaragibe, cidade natal', kind: 'cidade', city: 'Passo de Camaragibe', lat: -9.2425, lng: -35.4925, note: 'Onde nasceu, em 1910.' },
  ] },
  { id: 'nise-da-silveira', name: 'Nise da Silveira', short: 'Nise', links: [
    { label: 'Estátua no Corredor Vera Arruda', kind: 'monumento', city: 'Maceió', monumentId: 'nise', note: 'Sentada, com um gato no colo.' },
    { label: 'Casa onde nasceu Nise da Silveira', kind: 'casa', city: 'Maceió', lat: -9.6255, lng: -35.7497, note: 'Imóvel registrado no inventário do patrimônio de Bebedouro.' },
  ] },
  { id: 'ledo-ivo', name: 'Lêdo Ivo', short: 'Lêdo Ivo', links: [
    { label: 'Estátua no Posto 7', kind: 'monumento', city: 'Maceió', monumentId: 'ledo', note: 'De frente para o mar que ele descreveu.' },
    { label: 'Biblioteca Pública Estadual Graciliano Ramos', kind: 'biblioteca', city: 'Maceió', lat: -9.6666, lng: -35.7366, note: 'Peça Ninho de Cobras.' },
  ] },
  { id: 'emilio-de-maya', name: 'Emílio de Maya', short: 'Emílio de Maya', links: [
    { label: 'Busto na Praça Emílio de Maya', kind: 'monumento', city: 'Maceió', monumentId: 'emilio', note: 'Busto de bronze de Bibiano Silva.' },
    { label: 'Atalaia, cidade natal', kind: 'cidade', city: 'Atalaia', lat: -9.5019, lng: -36.0228, note: 'Nasceu no Engenho Patrocínio, em 1906.' },
  ] },
  { id: 'floriano-peixoto', name: 'Floriano Peixoto', short: 'Floriano', links: [
    { label: 'Monumento na Praça dos Martírios', kind: 'monumento', city: 'Maceió', monumentId: 'martirios', note: 'Inaugurado em 1908.' },
    { label: 'Museu Palácio Floriano Peixoto', kind: 'museu', city: 'Maceió', lat: -9.66, lng: -35.7394, note: 'Antigo Palácio do Governo, hoje museu.' },
    { label: 'Memorial à República', kind: 'monumento', city: 'Maceió', monumentId: 'republica', note: 'Os dois primeiros presidentes eram alagoanos.' },
    { label: 'Ipioca, onde nasceu', kind: 'lugar', city: 'Maceió', lat: -9.528, lng: -35.607, note: 'Hoje bairro do litoral norte de Maceió.' },
  ] },
  { id: 'deodoro', name: 'Deodoro da Fonseca', short: 'Deodoro', links: [
    { label: 'Memorial à República', kind: 'monumento', city: 'Maceió', monumentId: 'republica', note: 'Lembra a Proclamação de 1889.' },
    { label: 'Marechal Deodoro, cidade natal', kind: 'cidade', city: 'Marechal Deodoro', lat: -9.7101, lng: -35.8951, note: 'Antiga capital de Alagoas; centro histórico tombado.' },
  ] },
  { id: 'tavares-bastos', name: 'Tavares Bastos', short: 'Tavares Bastos', links: [
    { label: 'Palácio Tavares Bastos', kind: 'monumento', city: 'Maceió', monumentId: 'tavaresbastos', note: 'Sede da Assembleia Legislativa.' },
    { label: 'Marechal Deodoro, cidade natal', kind: 'cidade', city: 'Marechal Deodoro', lat: -9.7101, lng: -35.8951, note: 'Onde nasceu, em 1839.' },
  ] },
  { id: 'visconde-de-sinimbu', name: 'Visconde de Sinimbu', short: 'Sinimbu', links: [
    { label: 'Monumento na Praça Sinimbu', kind: 'monumento', city: 'Maceió', monumentId: 'sinimbu', note: 'Restaurado em 2020.' },
    { label: 'São Miguel dos Campos, cidade natal', kind: 'cidade', city: 'São Miguel dos Campos', lat: -9.7814, lng: -36.0939, note: 'Onde nasceu, em 1810.' },
  ] },
  { id: 'braulio-cavalcante', name: 'Bráulio Cavalcante', short: 'Bráulio', links: [
    { label: 'Busto na Praça Montepio dos Artistas', kind: 'monumento', city: 'Maceió', monumentId: 'montepio', note: 'Inaugurado em 1917.' },
    { label: 'Museu Palácio Floriano Peixoto', kind: 'museu', city: 'Maceió', lat: -9.66, lng: -35.7394, note: 'Foi morto em frente a este prédio, em 1912.' },
    { label: 'Pão de Açúcar, cidade natal', kind: 'cidade', city: 'Pão de Açúcar', lat: -9.7483, lng: -37.4364, note: 'Onde nasceu, em 1887, às margens do São Francisco.' },
  ] },
  { id: 'dom-pedro-ii', name: 'Dom Pedro II', short: 'Dom Pedro II', links: [
    { label: 'Busto na Praça Dom Pedro II', kind: 'monumento', city: 'Maceió', monumentId: 'pedro2', note: 'Diante da Catedral.' },
    { label: 'Catedral Metropolitana', kind: 'monumento', city: 'Maceió', monumentId: 'catedral', note: 'Na mesma praça.' },
    { label: 'Centro histórico de Penedo', kind: 'cidade', city: 'Penedo', lat: -10.2903, lng: -36.5864, note: 'O imperador visitou a cidade na viagem de 1859.' },
  ] },
]

export const personById = (id?: string) => people.find((p) => p.id === id)

/** Índice reverso: monumentos ligados a cada pessoa (resolve a entidade a partir de qualquer ponto). */
export function monumentIdsOf(personId: string): string[] {
  const p = personById(personId)
  return p ? [...new Set(p.links.map((l) => l.monumentId).filter((x): x is string => !!x))] : []
}
