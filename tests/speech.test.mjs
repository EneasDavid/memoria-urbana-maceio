// Testes da narração: divisão em trechos, palavra falada e escolha de voz.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitSpeech, wordAt, pickVoice, estimateMs } from '../src/shared/speech.ts'

test('divide em frases e mantém a ordem', () => {
  assert.deepEqual(splitSpeech('Nasceu em 1892. Foi prefeito! Morreu em 1953?'), ['Nasceu em 1892.', 'Foi prefeito!', 'Morreu em 1953?'])
})

test('frase longa é cortada nas vírgulas, sem perder texto', () => {
  const longa = 'Graciliano Ramos, escritor alagoas, ' + 'foi prefeito de Palmeira dos Índios, dirigiu a Imprensa Oficial, '.repeat(4) + 'e escreveu Vidas Secas.'
  const partes = splitSpeech(longa, 120)
  assert.ok(partes.length > 1)
  assert.ok(partes.every((p) => p.length <= 120))
  assert.equal(partes.join(' ').replace(/\s+/g, ' '), longa.trim().replace(/\s+/g, ' '))
})

test('palavra falada a partir do charIndex', () => {
  assert.deepEqual(wordAt('Nise da Silveira', 5), { start: 5, end: 7 })
  assert.deepEqual(wordAt('Nise da Silveira', 8, 8), { start: 8, end: 16 })
  assert.equal(wordAt('abc', 10), null)
})

test('escolhe voz pt-BR e nunca voz de outro idioma', () => {
  const v = (name, lang, localService = true) => ({ name, lang, localService })
  assert.equal(pickVoice([v('Samantha', 'en-US'), v('Joana', 'pt-PT'), v('Luciana', 'pt-BR')]).name, 'Luciana')
  assert.equal(pickVoice([v('Google português do Brasil', 'pt_BR', false), v('eSpeak pt', 'pt-BR')]).name, 'Google português do Brasil')
  assert.equal(pickVoice([v('Samantha', 'en-US')]), null)
})

test('estimativa de tempo cresce com o texto', () => {
  assert.ok(estimateMs('a'.repeat(200)) > estimateMs('a'.repeat(20)))
})
