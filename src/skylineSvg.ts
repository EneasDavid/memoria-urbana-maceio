// Silhueta de Maceió no estilo do logo: mar e coqueiros em verde-água, farol e casario em azul-marinho,
// igreja barroca em dourado, ondas embaixo. Formas com curvas, sem blocos retos.
// Usada no site (componente Skyline) e exportada para os slides.
export const SKY = { teal: '#2c8585', tealSoft: '#8fc7c2', gold: '#dda93f', goldSoft: '#ecc67a', navy: '#0b2f49' }

function raw(ink: string): string {
  const { teal, tealSoft, gold, goldSoft } = SKY
  return `
  <path d="M0 58c18-6 34-6 52 0v12H0z" fill="${tealSoft}" opacity=".55"/>
  <path d="M0 62c14-3 28-3 44 0" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" fill="none"/>
  <path d="M30 64c2-10 4-20 3-31l2 .2c1 11-1 21-2 31z" fill="${teal}"/>
  <path d="M34 33c-5-6-13-7-19-3 6-1 11 1 15 4-6-1-12 2-15 8 5-4 11-5 15-4-3 4-4 9-3 14 2-5 4-10 7-13 3 3 5 8 5 14 2-6 1-11-2-15 5 0 10 3 13 8-2-6-7-10-13-10 5-3 11-3 16 0-5-5-12-5-17-1z" fill="${teal}"/>
  <path d="M62 64l2-34c0-2 1-3 2-4h5c1 1 2 2 2 4l2 34z" fill="${ink}"/>
  <path d="M63 26h11M65 26c0-4 1-6 3.5-8 2.5 2 3.5 4 3.5 8" fill="${ink}" stroke="${ink}" stroke-width="1.4"/>
  <circle cx="68.5" cy="21.5" r="1.6" fill="${gold}"/>
  <path d="M92 64V40c0-3 2-5 4-6 3-6 7-9 12-9s9 3 12 9c2 1 4 3 4 6v24z" fill="${goldSoft}"/>
  <path d="M120 64V22c0-2 1-4 3-5 0-5 3-8 5-9 2 1 5 4 5 9 2 1 3 3 3 5v42z" fill="${gold}"/>
  <path d="M128 8V2M125.5 4.5h5M108 25v-6M105.5 21.5h5" stroke="${gold}" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M125 30a3 3 0 0 1 6 0v6h-6zM125 46a3 3 0 0 1 6 0v7h-6zM102 50a6 6 0 0 1 12 0v14h-12zM97 41a2.5 2.5 0 0 1 5 0v5h-5zM114 41a2.5 2.5 0 0 1 5 0v5h-5z" fill="#fffaf0" opacity=".8"/>
  <path d="M150 64c1-8 2-14 1-21l2 .2c1 7 0 13-1 21z" fill="${teal}"/>
  <path d="M152 43c-4-4-9-4-13-2 4 0 8 1 11 3-4 0-8 2-10 6 4-3 8-4 11-3-2 3-2 6-1 10 1-4 3-7 5-9 2 2 4 5 4 9 1-4 0-8-2-10 4 0 7 2 9 5-1-4-5-7-9-7 3-2 7-2 11 0-4-3-9-3-12-1z" fill="${teal}"/>
  <path d="M170 64V44c0-3 2-5 5-5h2c0-3 3-5 6-5s6 2 6 5h10c0-3 3-5 6-5s6 2 6 5h2c3 0 5 2 5 5v20z" fill="${ink}"/>
  <path d="M178 50a2.5 2.5 0 0 1 5 0v6h-5zM189 50a2.5 2.5 0 0 1 5 0v6h-5zM200 50a2.5 2.5 0 0 1 5 0v6h-5zM211 50a2.5 2.5 0 0 1 5 0v6h-5z" fill="#fffaf0" opacity=".75"/>
  <path d="M228 64V30c0-2 1-3 3-3h14c2 0 3 1 3 3v34z" fill="${ink}"/>
  <path d="M252 64V40c0-2 1-3 3-3h10c2 0 3 1 3 3v24z" fill="${ink}" opacity=".85"/>
  <path d="M232 33h3v3h-3zM238 33h3v3h-3zM232 40h3v3h-3zM238 40h3v3h-3zM232 47h3v3h-3zM238 47h3v3h-3zM256 43h3v3h-3zM261 43h3v3h-3z" fill="#fffaf0" opacity=".7"/>
  <path d="M282 64V46c0-1 1-2 2-3l12-9 12 9c1 1 2 2 2 3v18z" fill="${ink}"/>
  <path d="M296 34v-8M293 29h6" stroke="${gold}" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M292 64v-9a4 4 0 0 1 8 0v9z" fill="${goldSoft}"/>
  <path d="M330 64c2-12 4-22 3-34l2 .2c1 12-1 22-2 34z" fill="${teal}"/>
  <path d="M334 30c-5-6-13-7-19-3 6-1 11 1 15 4-6-1-12 2-15 8 5-4 11-5 15-4-3 4-4 9-3 14 2-5 4-10 7-13 3 3 5 8 5 14 2-6 1-11-2-15 5 0 10 3 13 8-2-6-7-10-13-10 5-3 11-3 16 0-5-5-12-5-17-1z" fill="${teal}"/>
  <path d="M360 61c10 0 22 0 36 0-3 3-8 4-18 4s-15-1-18-4z" fill="${ink}"/>
  <path d="M377 60V36c7 6 12 14 14 22z" fill="#fffaf0" stroke="${ink}" stroke-width="1"/>
  <path d="M398 12a14 14 0 0 1 14 14" stroke="${gold}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M0 66c22 0 24-5 46-5s26 5 48 5 24-5 46-5 26 5 48 5 24-5 46-5 26 5 48 5 24-5 46-5 26 5 48 5" fill="none" stroke="${teal}" stroke-width="2.8" stroke-linecap="round"/>
  <path d="M120 69c40-4 90-4 140-1" fill="none" stroke="${gold}" stroke-width="2" stroke-linecap="round"/>`
}

export interface Shape { tag: 'path' | 'circle'; attrs: Record<string, string> }

/** Formas como dados (sem HTML injetado): o React desenha e os slides recebem o mesmo desenho. */
export function skylineShapes(ink = SKY.navy): Shape[] {
  const out: Shape[] = []
  for (const m of raw(ink).matchAll(/<(path|circle)\s([^>]*?)\/>/g)) {
    const attrs: Record<string, string> = {}
    for (const a of m[2].matchAll(/([a-z-]+)="([^"]*)"/g)) attrs[a[1]] = a[2]
    out.push({ tag: m[1] as Shape['tag'], attrs })
  }
  return out
}

export const skylineMarkup = (ink = SKY.navy) => raw(ink)
