// Silhueta de Maceió no estilo do logo: mar e coqueiros em verde-água, farol e casario em azul-marinho,
// igrejas barrocas em dourado, ondas embaixo. Formas com curvas, espalhadas pela largura toda.
// Usada no site (Skyline, Ornament) e exportada para os slides.
export const SKY = { teal: '#2c8585', tealSoft: '#8fc7c2', gold: '#dda93f', goldSoft: '#ecc67a', navy: '#0b2f49', cream: '#fffaf0' }
export const SKY_W = 800
export const SKY_H = 120

const t = (x: number, s = 1, y = 0) => `transform="translate(${x} ${y}) scale(${s})"`

// Cada desenho tem a base em y=100 (unidade original) e começa em x=0.
const palm = (x: number, s: number, c: string) => `
  <path ${t(x, s, 100 - 100 * s)} d="M14 100c3-18 6-34 4-52l3 .3c2 18-1 34-3 52z" fill="${c}"/>
  <path ${t(x, s, 100 - 100 * s)} d="M19 48c-8-9-20-10-29-4 9-1 17 1 23 6-9-1-18 3-23 12 8-6 17-8 23-6-5 6-6 14-4 21 3-8 6-15 10-19 5 5 8 12 8 21 3-9 2-17-3-23 8 0 16 5 20 12-3-9-11-15-20-15 8-5 17-5 25 0-8-8-19-8-27-2z" fill="${c}"/>`
const lighthouse = (x: number, s: number, ink: string, gold: string) => `
  <path ${t(x, s, 100 - 100 * s)} d="M4 100l3-56c0-3 2-5 4-6h8c2 1 4 3 4 6l3 56z" fill="${ink}"/>
  <path ${t(x, s, 100 - 100 * s)} d="M2 38h26v-3H2zM7 35c0-7 3-11 8-14 5 3 8 7 8 14z" fill="${ink}"/>
  <path ${t(x, s, 100 - 100 * s)} d="M8 58h14l.6 8H7.4zM7 78h16l.6 8H6.4z" fill="#c8102e" opacity=".85"/>
  <circle ${t(x, s, 100 - 100 * s)} cx="15" cy="28" r="2.6" fill="${gold}"/>`
const baroque = (x: number, s: number, body: string, tower: string, win: string) => `
  <path ${t(x, s, 100 - 100 * s)} d="M0 100V58c0-4 3-7 6-8 4-10 11-15 19-15s15 5 19 15c3 1 6 4 6 8v42z" fill="${body}"/>
  <path ${t(x, s, 100 - 100 * s)} d="M48 100V30c0-3 2-6 5-7 0-8 4-12 8-14 4 2 8 6 8 14 3 1 5 4 5 7v70z" fill="${tower}"/>
  <path ${t(x, s, 100 - 100 * s)} d="M61 9V0M57 4h8M25 35v-9M21 30h8" stroke="${tower}" stroke-width="2.4" stroke-linecap="round"/>
  <path ${t(x, s, 100 - 100 * s)} d="M57 40a4 4 0 0 1 8 0v9h-8zM57 64a4 4 0 0 1 8 0v10h-8zM16 78a9 9 0 0 1 18 0v22H16zM7 63a3.5 3.5 0 0 1 7 0v7H7zM36 63a3.5 3.5 0 0 1 7 0v7h-7z" fill="${win}" opacity=".85"/>`
const casario = (x: number, s: number, ink: string, win: string) => `
  <path ${t(x, s, 100 - 100 * s)} d="M0 100V70c0-4 3-7 7-7h3c0-5 4-8 9-8s9 3 9 8h16c0-5 4-8 9-8s9 3 9 8h16c0-5 4-8 9-8s9 3 9 8h3c4 0 7 3 7 7v30z" fill="${ink}"/>
  <path ${t(x, s, 100 - 100 * s)} d="M12 78a4 4 0 0 1 8 0v10h-8zM30 78a4 4 0 0 1 8 0v10h-8zM48 78a4 4 0 0 1 8 0v10h-8zM66 78a4 4 0 0 1 8 0v10h-8zM84 78a4 4 0 0 1 8 0v10h-8z" fill="${win}" opacity=".75"/>`
const towers = (x: number, s: number, ink: string, win: string) => `
  <path ${t(x, s, 100 - 100 * s)} d="M0 100V28c0-3 2-5 5-5h22c3 0 5 2 5 5v72z" fill="${ink}"/>
  <path ${t(x, s, 100 - 100 * s)} d="M38 100V50c0-3 2-5 5-5h14c3 0 5 2 5 5v50z" fill="${ink}" opacity=".85"/>
  <path ${t(x, s, 100 - 100 * s)} d="M7 32h5v5H7zM18 32h5v5h-5zM7 44h5v5H7zM18 44h5v5h-5zM7 56h5v5H7zM18 56h5v5h-5zM7 68h5v5H7zM18 68h5v5h-5zM44 54h5v5h-5zM52 54h5v5h-5zM44 66h5v5h-5zM52 66h5v5h-5z" fill="${win}" opacity=".7"/>`
const chapel = (x: number, s: number, ink: string, gold: string, door: string) => `
  <path ${t(x, s, 100 - 100 * s)} d="M0 100V62c0-2 1-4 3-5l20-16 20 16c2 1 3 3 3 5v38z" fill="${ink}"/>
  <path ${t(x, s, 100 - 100 * s)} d="M23 40V26M17 32h12" stroke="${gold}" stroke-width="2.6" stroke-linecap="round"/>
  <path ${t(x, s, 100 - 100 * s)} d="M16 100V84a7 7 0 0 1 14 0v16z" fill="${door}"/>`
const boat = (x: number, s: number, ink: string, sail: string) => `
  <path ${t(x, s, 100 - 100 * s)} d="M0 92c14 0 34 0 56 0-4 5-12 7-28 7S4 97 0 92z" fill="${ink}"/>
  <path ${t(x, s, 100 - 100 * s)} d="M26 90V48c11 9 19 22 22 38z" fill="${sail}" stroke="${ink}" stroke-width="1.5"/>`

function raw(ink: string): string {
  const { teal, tealSoft, gold, goldSoft, cream } = SKY
  return `
  <path d="M0 104c40-14 86-16 132-4v20H0z" fill="${tealSoft}" opacity=".5"/>
  <path d="M0 110c30-6 64-6 100-1" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" fill="none"/>
  ${palm(20, 1, teal)}
  ${lighthouse(84, 0.95, ink, gold)}
  ${palm(122, 0.62, teal)}
  ${baroque(166, 1.05, goldSoft, gold, cream)}
  ${palm(262, 0.75, teal)}
  ${casario(304, 0.95, ink, cream)}
  ${chapel(424, 0.9, ink, gold, goldSoft)}
  ${palm(476, 0.55, teal)}
  ${towers(512, 1, ink, cream)}
  ${baroque(592, 0.7, ink, ink, cream)}
  ${palm(652, 0.9, teal)}
  ${boat(712, 0.75, ink, cream)}
  <path d="M758 22a20 20 0 0 1 20 20" stroke="${gold}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M0 108c30 0 34-7 66-7s36 7 66 7 34-7 66-7 36 7 66 7 34-7 66-7 36 7 66 7 34-7 66-7 36 7 66 7 34-7 66-7 36 7 66 7 34-7 66-7 36 7 66 7" fill="none" stroke="${teal}" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M170 116c90-6 200-6 330-1" fill="none" stroke="${gold}" stroke-width="2.4" stroke-linecap="round"/>`
}

/** Ornamento pequeno (coqueiro + onda + igreja) para separar seções. */
export function ornamentMarkup(ink = SKY.navy): string {
  const { teal, gold, goldSoft, cream } = SKY
  return `${palm(0, 0.5, teal)}${chapel(34, 0.42, ink, gold, goldSoft)}${baroque(64, 0.42, goldSoft, gold, cream)}
  <path d="M0 102c12 0 14-4 26-4s14 4 26 4 14-4 26-4 14 4 26 4" fill="none" stroke="${teal}" stroke-width="3" stroke-linecap="round"/>`
}

export interface Shape { tag: 'path' | 'circle'; attrs: Record<string, string> }

function parse(markup: string): Shape[] {
  const out: Shape[] = []
  for (const m of markup.matchAll(/<(path|circle)\s([^>]*?)\/>/g)) {
    const attrs: Record<string, string> = {}
    for (const a of m[2].matchAll(/([a-z-]+)="([^"]*)"/g)) attrs[a[1]] = a[2]
    out.push({ tag: m[1] as Shape['tag'], attrs })
  }
  return out
}

/** Formas como dados (sem HTML injetado): o React desenha e os slides recebem o mesmo desenho. */
export const skylineShapes = (ink = SKY.navy) => parse(raw(ink))
export const ornamentShapes = (ink = SKY.navy) => parse(ornamentMarkup(ink))
export const skylineMarkup = (ink = SKY.navy) => raw(ink)
