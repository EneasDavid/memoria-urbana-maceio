import { monuments, type Monument } from '../../data'

// Princípio 18 · lei de Postel: aceitar com tolerância o que vem da placa, do QR antigo ou digitado à mão.
// Aceita id em qualquer caixa e com acento ("Graciliano", "NISE"), número da placa ("01", "1", "placa-01")
// e o nome do homenageado ("graciliano-ramos", "Nise da Silveira").
export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function findMonument(raw: string): Monument | undefined {
  let key = ''
  try { key = slug(decodeURIComponent(raw)) } catch { key = slug(raw) }
  if (!key) return undefined
  const byId = monuments.find((m) => m.id === key)
  if (byId) return byId
  const plate = key.replace(/^(placa|p)-?/, '')
  if (/^\d{1,3}$/.test(plate)) return monuments.find((m) => Number(m.plate) === Number(plate))
  return monuments.find((m) => slug(m.name) === key || slug(m.name).startsWith(key + '-'))
}
