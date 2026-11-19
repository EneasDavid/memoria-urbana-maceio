// Utilidades da narração em voz (Web Speech API). Sem React, para poder testar com `node --test`.

const SENTENCE = /[^.!?…]+[.!?…]+["”')]*|[^.!?…]+$/g

/** Quebra o texto em trechos curtos (frases; frases longas são cortadas nas vírgulas).
 *  Trechos curtos deixam a legenda sincronizada e evitam o corte de fala longa do Chrome (~15 s). */
export function splitSpeech(text: string, max = 160): string[] {
  const sentences = (text.match(SENTENCE) || [text]).map((s) => s.trim()).filter(Boolean)
  const out: string[] = []
  for (const s of sentences) {
    if (s.length <= max) {
      out.push(s)
      continue
    }
    let cur = ''
    for (const piece of s.split(/(?<=[,;:])\s+/)) {
      if (cur && (cur + ' ' + piece).length > max) {
        out.push(cur)
        cur = piece
      } else cur = cur ? cur + ' ' + piece : piece
    }
    if (cur) out.push(cur)
  }
  return out
}

/** Tempo estimado de fala (ms) para animar a legenda quando o navegador não informa a palavra atual. */
export function estimateMs(text: string, rate = 1): number {
  return Math.max(1200, (text.length * 62) / rate)
}

/** Palavra que começa em `charIndex` (para destacar a palavra falada). */
export function wordAt(text: string, charIndex: number, charLength?: number): { start: number; end: number } | null {
  if (charIndex < 0 || charIndex >= text.length) return null
  if (charLength && charLength > 0) return { start: charIndex, end: Math.min(text.length, charIndex + charLength) }
  const m = text.slice(charIndex).match(/^[^\s]+/)
  return m ? { start: charIndex, end: charIndex + m[0].length } : null
}

interface VoiceLike {
  name: string
  lang: string
  localService: boolean
}

/** Melhor voz em português do Brasil; nunca escolhe voz de outro idioma (evita sotaque/leitura errada). */
export function pickVoice<V extends VoiceLike>(voices: V[]): V | null {
  const norm = (l: string) => (l || '').toLowerCase().replace('_', '-')
  const pt = voices.filter((v) => norm(v.lang).startsWith('pt'))
  const score = (v: V) => {
    const n = v.name.toLowerCase()
    let p = norm(v.lang) === 'pt-br' ? 100 : 0
    if (/natural|neural|online|premium|enhanced|aprimorad/.test(n)) p += 60
    if (/francisca|thalita|antonio|luciana|felipe|google português do brasil|google portugu/.test(n)) p += 40
    if (!v.localService) p += 10
    if (/compact|espeak/.test(n)) p -= 50
    return p
  }
  return pt.sort((a, b) => score(b) - score(a))[0] || null
}
