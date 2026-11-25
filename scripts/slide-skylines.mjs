// Gera os PNGs das cenas do skyline para os slides (fundo transparente), em versão para fundo escuro e claro.
// Também grava os SVGs (docs/slides/skyline), que o Canva importa pelo link público do GitHub.
// Uso: node --experimental-strip-types scripts/slide-skylines.mjs <pasta-de-saída>
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { SCENES, SKY, SKY_H } from '../src/skylineSvg.ts'

const out = process.argv[2] || 'shots/skylines'
mkdirSync(out, { recursive: true })
const INK = { escuro: '#9fb8c8', claro: SKY.navy } // escuro: casario azul-acinzentado (como no slide atual)
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {})
const page = await browser.newPage({ deviceScaleFactor: 4 })
for (const [name, sc] of Object.entries(SCENES)) {
  for (const [tema, ink] of Object.entries(INK)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sc.w} ${SKY_H}" width="${sc.w}" height="${SKY_H}">${sc.draw(ink)}</svg>`
    writeFileSync(`${out}/sky-${name}-${tema}.svg`, svg.replace('<svg ', `<svg width="${sc.w * 4}" height="${SKY_H * 4}" `).replace(/ width="\d+" height="\d+">/, '>'))
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`)
    await page.setViewportSize({ width: sc.w, height: SKY_H })
    await page.screenshot({ path: `${out}/sky-${name}-${tema}.png`, omitBackground: true, clip: { x: 0, y: 0, width: sc.w, height: SKY_H } })
  }
}
await browser.close()
console.log('ok', out)
