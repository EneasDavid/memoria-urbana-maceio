// Camada de segurança dos anexos do relato (foto ou vídeo). Mesmas regras de backend/app/core/media.py.
// O navegador não é confiável: o servidor repete tudo. Aqui o objetivo é recusar cedo, sem gastar dados do visitante.
//
// Regras:
//  1. Tamanho: foto até 10 MB na entrada (sai ≤ ~600 KB depois de recodificada); vídeo até 25 MB e 30 s.
//  2. Tipo pelo conteúdo (assinatura/"magic bytes"), nunca pela extensão ou pelo MIME que o arquivo diz ter.
//     Só JPEG, PNG, WebP, HEIC/HEIF, MP4/MOV e WebM. ZIP, GZIP, 7z, RAR, TAR, PDF, SVG, HTML, XML, EXE/ELF: recusados.
//  3. Arquivo poliglota (imagem válida com ZIP ou script embutido): recusado se houver assinatura de arquivo
//     compactado ou marcador de script em qualquer ponto.
//  4. Bomba de descompressão: foto com mais de 40 megapixels ou lado maior que 12.000 px é recusada antes de decodificar.
//  5. Foto é sempre recodificada no aparelho (canvas → JPEG ≤ 1600 px): some EXIF/GPS e qualquer byte que não seja pixel.

export const LIMITS = {
  imageInBytes: 10 * 1024 * 1024,
  videoBytes: 25 * 1024 * 1024,
  videoSeconds: 30,
  maxPixels: 40_000_000,
  maxSide: 12_000,
  outSide: 1600,
} as const

export type MediaKind = 'image' | 'video'
export type Sniffed = { kind: MediaKind; mime: string } | { kind: 'blocked'; what: string } | { kind: 'unknown' }

const has = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v)
const ascii = (b: Uint8Array, from: number, len: number) => String.fromCharCode(...b.subarray(from, from + len))

/** Identifica o tipo real pelos primeiros bytes. */
export function sniff(b: Uint8Array): Sniffed {
  if (b.length < 12) return { kind: 'unknown' }
  if (has(b, [0xff, 0xd8, 0xff])) return { kind: 'image', mime: 'image/jpeg' }
  if (has(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: 'image', mime: 'image/png' }
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return { kind: 'image', mime: 'image/webp' }
  if (ascii(b, 4, 4) === 'ftyp') {
    const brand = ascii(b, 8, 4)
    if (['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1', 'avif'].includes(brand)) return { kind: 'image', mime: brand === 'avif' ? 'image/avif' : 'image/heic' }
    // Áudio e imagem JPEG 2000 no mesmo contêiner não são vídeo de relato
    if (['M4A ', 'M4B ', 'M4P ', 'F4A ', 'F4B ', 'jp2 ', 'jpx ', 'crx '].includes(brand)) return { kind: 'blocked', what: `arquivo "${brand.trim()}" (não é vídeo)` }
    // Qualquer outra marca ISO-BMFF é vídeo: celulares usam dezenas (isom, mp42, qt, 3gp6, 3g2a, MSNV, XAVC…).
    // A segurança vem das outras checagens (tamanho, conteúdo escondido) e do ffprobe no servidor.
    return { kind: 'video', mime: brand === 'qt  ' ? 'video/quicktime' : brand.startsWith('3g') ? 'video/3gpp' : 'video/mp4' }
  }
  if (has(b, [0x1a, 0x45, 0xdf, 0xa3])) return { kind: 'video', mime: 'video/webm' }
  // bloqueados explicitamente (mensagem mais clara para quem envia)
  if (has(b, [0x50, 0x4b, 0x03, 0x04]) || has(b, [0x50, 0x4b, 0x05, 0x06])) return { kind: 'blocked', what: 'arquivo ZIP' }
  if (has(b, [0x1f, 0x8b])) return { kind: 'blocked', what: 'arquivo GZIP' }
  if (has(b, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return { kind: 'blocked', what: 'arquivo 7z' }
  if (ascii(b, 0, 4) === 'Rar!') return { kind: 'blocked', what: 'arquivo RAR' }
  if (has(b, [0x42, 0x5a, 0x68])) return { kind: 'blocked', what: 'arquivo BZIP2' }
  if (has(b, [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00])) return { kind: 'blocked', what: 'arquivo XZ' }
  if (b.length > 262 && ascii(b, 257, 5) === 'ustar') return { kind: 'blocked', what: 'arquivo TAR' }
  if (ascii(b, 0, 4) === '%PDF') return { kind: 'blocked', what: 'PDF' }
  if (ascii(b, 0, 2) === 'MZ' || has(b, [0x7f, 0x45, 0x4c, 0x46])) return { kind: 'blocked', what: 'programa executável' }
  if (/^\s*</.test(ascii(b, 0, 64)) || has(b, [0xef, 0xbb, 0xbf, 0x3c])) return { kind: 'blocked', what: 'texto/marcação (SVG, HTML ou XML)' }
  return { kind: 'unknown' }
}

// Assinaturas de arquivo compactado no meio do arquivo (poliglota) e marcadores de script/injeção.
// Para não recusar vídeo legítimo por coincidência de 4 bytes, o ZIP só conta com estrutura plausível:
// cabeçalho local com versão < 64 e método 0/8/12/14, ou fim de diretório que termina exatamente no fim do arquivo.
const SIX = [
  [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07], // RAR
  [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], // 7z
]
// Só marcadores com 5+ caracteres: padrões curtos (como "<%=", 3 bytes) aparecem por acaso em vídeos de 20 MB
// e recusavam vídeos legítimos.
const SCRIPT = /<script|<\?php|<svg[\s>]|<html|<iframe|javascript:|onerror\s*=|onload\s*=|<!entity|\beval\s*\(/i

function zipInside(b: Uint8Array): boolean {
  for (let i = 1; i + 30 <= b.length; i++) {
    if (b[i] !== 0x50 || b[i + 1] !== 0x4b) continue
    if (b[i + 2] === 0x03 && b[i + 3] === 0x04 && b[i + 4] < 64 && b[i + 5] === 0 && [0, 8, 12, 14].includes(b[i + 8]) && b[i + 9] === 0) return true
  }
  const from = Math.max(1, b.length - 65_557)
  for (let i = b.length - 22; i >= from; i--) {
    if (b[i] === 0x50 && b[i + 1] === 0x4b && b[i + 2] === 0x05 && b[i + 3] === 0x06 && i + 22 + (b[i + 20] | (b[i + 21] << 8)) === b.length) return true
  }
  return false
}

/** Procura conteúdo escondido em qualquer ponto do arquivo. */
export function hiddenPayload(b: Uint8Array): string | null {
  if (zipInside(b)) return 'arquivo compactado escondido dentro da mídia'
  for (const sig of SIX) {
    outer: for (let i = 1; i <= b.length - sig.length; i++) {
      if (b[i] !== sig[0]) continue
      for (let j = 1; j < sig.length; j++) if (b[i + j] !== sig[j]) continue outer
      return 'arquivo compactado escondido dentro da mídia'
    }
  }
  // texto: decodifica como latin1 em blocos (com sobreposição) para achar marcadores de script
  const CH = 1 << 20
  const dec = new TextDecoder('latin1')
  for (let i = 0; i < b.length; i += CH - 32) {
    if (SCRIPT.test(dec.decode(b.subarray(i, Math.min(b.length, i + CH))))) return 'código/script escondido dentro da mídia'
  }
  return null
}

/** Lê largura e altura do cabeçalho, sem decodificar a imagem (proteção contra bomba de descompressão). */
export function imageSize(b: Uint8Array, mime: string): { w: number; h: number } | null {
  const u16 = (i: number) => (b[i] << 8) | b[i + 1]
  const u32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
  const le16 = (i: number) => b[i] | (b[i + 1] << 8)
  const le24 = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16)
  if (mime === 'image/png') return { w: u32(16), h: u32(20) }
  if (mime === 'image/jpeg') {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue }
      const marker = b[i + 1]
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue }
      const len = u16(i + 2)
      if ((marker >= 0xc0 && marker <= 0xcf) && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { h: u16(i + 5), w: u16(i + 7) }
      i += 2 + len
    }
    return null
  }
  if (mime === 'image/webp') {
    const chunk = ascii(b, 12, 4)
    if (chunk === 'VP8X') return { w: le24(24) + 1, h: le24(27) + 1 }
    if (chunk === 'VP8 ') return { w: le16(26) & 0x3fff, h: le16(28) & 0x3fff }
    if (chunk === 'VP8L') { const v = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 } }
    return null
  }
  return null // HEIC/AVIF: o navegador decodifica e o canvas mede depois
}

export type Check = { ok: true; kind: MediaKind; mime: string } | { ok: false; reason: string }

/** Validação completa dos bytes. `declared` é o tipo que o navegador informou (só para conferir coerência). */
export function checkBytes(b: Uint8Array, declared = ''): Check {
  const s = sniff(b)
  if (s.kind === 'blocked') return { ok: false, reason: `Tipo não aceito: ${s.what}. Envie uma foto (JPG, PNG, WebP, HEIC) ou um vídeo (MP4, MOV, WebM).` }
  if (s.kind === 'unknown') return { ok: false, reason: 'Não reconhecemos este arquivo como foto ou vídeo.' }
  const limit = s.kind === 'image' ? LIMITS.imageInBytes : LIMITS.videoBytes
  if (b.length > limit) return { ok: false, reason: `Arquivo grande demais: máximo de ${limit / 1024 / 1024} MB para ${s.kind === 'image' ? 'foto' : 'vídeo'}.` }
  if (b.length === 0) return { ok: false, reason: 'Arquivo vazio.' }
  if (declared && !declared.startsWith(s.kind + '/') && declared !== 'application/octet-stream') return { ok: false, reason: 'O conteúdo do arquivo não bate com o tipo informado.' }
  if (s.kind === 'image') {
    const size = imageSize(b, s.mime)
    if (size && (size.w * size.h > LIMITS.maxPixels || size.w > LIMITS.maxSide || size.h > LIMITS.maxSide || size.w === 0 || size.h === 0)) {
      return { ok: false, reason: 'Imagem com dimensões fora do limite (máx. 40 megapixels).' }
    }
  }
  const hidden = hiddenPayload(b)
  if (hidden) return { ok: false, reason: `Arquivo recusado por segurança: ${hidden}.` }
  return { ok: true, kind: s.kind, mime: s.mime }
}

export function fmtBytes(n: number) {
  return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}
