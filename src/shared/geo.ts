import type { Monument } from '../data'

/** Distância em metros entre dois pontos (fórmula de haversine). */
export function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000, rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Os monumentos mais próximos (links internos "Perto daqui": ajudam o visitante e o Google). */
export function nearby(m: Monument, all: Monument[], n = 3): { m: Monument; meters: number }[] {
  return all.filter((x) => x.id !== m.id).map((x) => ({ m: x, meters: distance(m, x) })).sort((a, b) => a.meters - b.meters).slice(0, n)
}

export const fmtDistance = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`)
