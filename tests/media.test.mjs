// Segurança dos anexos do relato (foto ou vídeo): mesmas regras no aparelho (src/shared/media.ts)
// e no servidor (backend/app/core/media.py, testado no pytest). Arquivos de ataque em tests/fixtures/media.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { checkBytes, sniff, imageSize, hiddenPayload, LIMITS } from '../src/shared/media.ts'

const f = (n) => new Uint8Array(readFileSync(`tests/fixtures/media/${n}`))

test('aceita foto JPEG, PNG e WebP e vídeo MP4 pelo conteúdo', () => {
  assert.deepEqual(checkBytes(f('foto.jpg'), 'image/jpeg'), { ok: true, kind: 'image', mime: 'image/jpeg' })
  assert.equal(checkBytes(f('foto.png'), 'image/png').ok, true)
  assert.equal(checkBytes(f('foto.webp'), 'image/webp').ok, true)
  assert.deepEqual(checkBytes(f('video.mp4'), 'video/mp4'), { ok: true, kind: 'video', mime: 'video/mp4' })
})

test('lê as dimensões do cabeçalho sem decodificar', () => {
  assert.deepEqual(imageSize(f('foto.jpg'), 'image/jpeg'), { w: 320, h: 240 })
  assert.deepEqual(imageSize(f('foto.png'), 'image/png'), { w: 320, h: 240 })
  assert.deepEqual(imageSize(f('foto.webp'), 'image/webp'), { w: 320, h: 240 })
})

for (const [file, why] of [
  ['arquivo.zip', /ZIP/],
  ['zip-renomeado.jpg', /ZIP/],
  ['bomba.gz', /GZIP/],
  ['imagem.svg', /SVG|marcação/],
  ['pagina.png', /SVG|marcação|HTML/],
  ['programa.jpg', /executável/],
  ['poliglota.jpg', /compactado escondido/],
  ['script.jpg', /script/],
  ['bomba.png', /megapixels/],
]) {
  test(`recusa ${file}`, () => {
    const r = checkBytes(f(file), 'image/jpeg')
    assert.equal(r.ok, false, file)
    assert.match(r.reason, why)
  })
}

test('limite de tamanho: foto > 10 MB e vídeo > 25 MB', () => {
  const big = new Uint8Array(LIMITS.imageInBytes + 1); big.set(f('foto.jpg'))
  assert.match(checkBytes(big).reason, /grande demais/)
  const vid = new Uint8Array(LIMITS.videoBytes + 1); vid.set(f('video.mp4'))
  assert.match(checkBytes(vid).reason, /grande demais/)
})

test('tipo declarado precisa bater com o conteúdo', () => {
  assert.match(checkBytes(f('foto.jpg'), 'video/mp4').reason, /não bate/)
})

test('não recusa mídia legítima por coincidência de bytes (ZIP só com estrutura plausível)', () => {
  const noise = new Uint8Array(2_000_000)
  let x = 12345
  for (let i = 0; i < noise.length; i++) { x = (x * 1103515245 + 12345) >>> 0; noise[i] = x >>> 24 }
  noise.set([0x50, 0x4b, 0x03, 0x04, 0xff, 0xff], 1000) // "PK\3\4" solto, sem versão/método válidos
  assert.equal(hiddenPayload(noise), null)
})

test('sniff identifica bloqueados com nome claro', () => {
  assert.equal(sniff(f('arquivo.zip')).kind, 'blocked')
  assert.equal(sniff(new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0, 0, 0, 0, 0, 0])).what, 'arquivo RAR')
})
