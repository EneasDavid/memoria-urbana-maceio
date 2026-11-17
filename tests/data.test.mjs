// Testes de integridade dos dados (camada de conteúdo).
// Roda com: node --experimental-strip-types --test tests/
// Objetivo: achar falhas (falta → erro → falha) antes que cheguem à placa.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { monuments, byId } from '../src/data.ts'

// Caixa aproximada de Maceió (AL)
const BBOX = { latMin: -9.75, latMax: -9.45, lngMin: -35.85, lngMax: -35.65 }

test('há monumentos cadastrados', () => {
  assert.ok(monuments.length >= 5, `esperava ao menos 5, veio ${monuments.length}`)
})

test('ids e números de placa são únicos', () => {
  const ids = monuments.map((m) => m.id)
  const plates = monuments.map((m) => m.plate)
  assert.equal(new Set(ids).size, ids.length, 'id duplicado')
  assert.equal(new Set(plates).size, plates.length, 'placa duplicada')
})

for (const m of monuments) {
  test(`monumento "${m.name}" está completo`, () => {
    assert.ok(m.name.trim(), 'nome vazio')
    assert.ok(m.summary.trim().length > 80, 'bio curta demais')
    assert.ok(m.address.trim(), 'endereço vazio')
    assert.equal(byId(m.id), m, 'byId não encontra o monumento')
  })

  test(`monumento "${m.name}" fica em Maceió`, () => {
    assert.ok(m.lat >= BBOX.latMin && m.lat <= BBOX.latMax, `lat fora: ${m.lat}`)
    assert.ok(m.lng >= BBOX.lngMin && m.lng <= BBOX.lngMax, `lng fora: ${m.lng}`)
  })

  test(`monumento "${m.name}" convida para um museu`, () => {
    // Regra do produto: o convite ao museu aparece sempre, sem login.
    assert.ok(m.museum, 'sem museu')
    assert.ok(m.museum.name.trim(), 'museu sem nome')
    assert.ok(m.museum.address.trim(), 'museu sem endereço')
    assert.ok(m.museum.why.trim(), 'museu sem motivo da visita')
  })

  test(`monumento "${m.name}" tem fontes seguras`, () => {
    for (const s of m.sources) {
      assert.match(s.url, /^https:\/\//, `fonte sem HTTPS: ${s.url}`)
      assert.ok(s.label.trim(), 'fonte sem rótulo')
    }
  })
}
