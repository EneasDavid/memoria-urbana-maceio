import { useCallback, useEffect, useRef, useState } from 'react'

// Localização real do aparelho, ao vivo, para a Trilha (mapa, distâncias e check-in por GPS).
// Fica só na memória da aba: não é gravada, não vai para o servidor e para de ser lida ao sair da Trilha.
// Só lê com o mapa aberto. Volta sozinha quando o navegador já tem a permissão; senão espera o "Permitir"
// do visitante, depois de um aviso que explica o uso (o pedido do navegador vem em seguida).

export type GeoStatus = 'idle' | 'asking' | 'ok' | 'denied' | 'unavailable'
export interface LiveLocation {
  status: GeoStatus
  /** [latitude, longitude] da última leitura */
  here: [number, number] | null
  /** precisão em metros informada pelo aparelho */
  accuracy: number | null
  start: () => void
  stop: () => void
  resume: () => void
}

export function useLiveLocation(enabled = true): LiveLocation {
  const supported = typeof navigator !== 'undefined' && !!navigator.geolocation
  const [status, setStatus] = useState<GeoStatus>(supported ? 'idle' : 'unavailable')
  const [here, setHere] = useState<[number, number] | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const watch = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current)
    watch.current = null
  }, [])

  const start = useCallback(() => {
    if (!supported) return setStatus('unavailable')
    if (watch.current !== null) return
    setStatus((s) => (s === 'ok' ? s : 'asking'))
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        setHere([p.coords.latitude, p.coords.longitude])
        setAccuracy(Math.round(p.coords.accuracy))
        setStatus('ok')
      },
      (e) => {
        // Só a recusa da permissão encerra a leitura. Sem sinal ou demora do GPS é passageiro:
        // continua tentando e mantém a última posição na tela.
        if (e.code === e.PERMISSION_DENIED) { stop(); setStatus('denied'); return }
        setStatus((s) => (s === 'ok' ? s : 'unavailable'))
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    )
  }, [stop, supported])

  /** Ao abrir o mapa: volta a ler sozinha se o navegador já tem a permissão (sem perguntar de novo). */
  const resume = useCallback(() => {
    if (!enabled || !supported) return
    const perms = (navigator as Navigator & { permissions?: Permissions }).permissions
    if (!perms) return
    perms.query({ name: 'geolocation' as PermissionName }).then((p) => {
      if (p.state === 'granted') start()
      else if (p.state === 'denied') setStatus('denied')
    }).catch(() => undefined)
  }, [enabled, start, supported])

  useEffect(() => stop, [stop])

  return { status, here, accuracy, start, stop, resume }
}
