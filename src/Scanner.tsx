import { openCamera, permState, releaseCamera } from './shared/permissions'
import { findMonument } from './features/monument/find'
// Carrega o leitor de QR assim que o scanner existe (não espera a câmera abrir)
const jsqrReady = typeof window !== 'undefined' && !('BarcodeDetector' in window) ? import('jsqr') : Promise.resolve({ default: null as unknown as typeof import('jsqr').default })
import { useEffect, useRef, useState } from 'react'
import { Icon, Segmented, RarityPill } from './ui'
import { byId, monuments, type Monument } from './data'

export type ScanMode = 'qr' | 'nfc'
type Phase = 'scanning' | 'reading' | 'done'

// Padrão de QR determinístico (visual) para a placa simulada
export function FakeQR({ seed, size = 132 }: { seed: number; size?: number }) {
  const n = 25
  const cells: [number, number][] = []
  let s = seed * 9301 + 49297
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && rnd() > 0.52) cells.push([x, y])
  const F = ({ x, y }: { x: number; y: number }) => (
    <g>
      <rect x={x} y={y} width="7" height="7" fill="#111" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#111" />
    </g>
  )
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={size} height={size} shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" />
      {cells.map(([x, y]) => <rect key={x + '-' + y} x={x} y={y} width="1" height="1" fill="#111" />)}
      <F x={0} y={0} />
      <F x={n - 7} y={0} />
      <F x={0} y={n - 7} />
    </svg>
  )
}

interface NdefLike { records: { recordType: string; data?: DataView }[] }

export function Scanner({ initialMode, target, online, collected, onClose, onResult, simulate = true }: {
  /** false na área logada de verdade: nada é lido de mentira, só QR/NFC reais da placa. */
  simulate?: boolean
  initialMode: ScanMode
  target: string
  online: boolean
  collected: string[]
  onClose: () => void
  onResult: (id: string, method: ScanMode) => { xp: number; first: boolean; pending?: boolean }
}) {
  const [mode, setMode] = useState<ScanMode>(initialMode)
  const [phase, setPhase] = useState<Phase>('scanning')
  const [result, setResult] = useState<{ m: Monument; xp: number; first: boolean; pending?: boolean } | null>(null)
  const [camera, setCamera] = useState<'checking' | 'off' | 'on' | 'denied'>(simulate ? 'off' : 'checking')
  const [nfcReal, setNfcReal] = useState<'idle' | 'waiting' | 'unsupported'>('idle')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const m = byId(target)
  const hasWebNfc = typeof window !== 'undefined' && 'NDEFReader' in window
  // Leitura real em todo navegador: BarcodeDetector (Chrome/Android) ou jsQR em JavaScript (iPhone/Safari, desktop)
  const hasDetector = true

  const finish = (id: string, method: ScanMode) => {
    setPhase('reading')
    window.setTimeout(() => {
      const r = onResult(id, method)
      setResult({ m: byId(id), ...r })
      setPhase('done')
      try { navigator.vibrate?.(30) } catch { /* sem vibração */ }
    }, 200)
  }

  // Leitura simulada automática (quando a câmera real não está ligada)
  useEffect(() => {
    if (!simulate || phase !== 'scanning' || (camera === 'on' && hasDetector) || nfcReal === 'waiting') return
    const t = window.setTimeout(() => finish(target, mode), mode === 'qr' ? 2400 : 2600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, camera, nfcReal, target])

  useEffect(() => () => { releaseCamera(streamRef.current); streamRef.current = null }, [])

  // Pede uma vez só: já permitida → liga direto, sem aviso; bloqueada → mostra como liberar; nunca respondida → aviso
  useEffect(() => {
    if (simulate || mode !== 'qr') return
    let alive = true
    permState('camera').then((st) => {
      if (!alive) return
      if (st === 'granted') void startCamera()
      else if (st === 'denied') setCamera('denied')
      else setCamera((c) => (c === 'checking' ? 'off' : c))
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchMode = (v: ScanMode) => {
    setMode(v)
    setPhase('scanning')
    setResult(null)
  }

  // Câmera real + BarcodeDetector (Chrome/Android). No iPhone a leitura real fica no app nativo / câmera do sistema.
  const startCamera = async () => {
    try {
      const stream = await openCamera({ facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } })
      streamRef.current = stream
      setCamera('on')
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => undefined)
        }
      })
      // Aceita o link do QR da placa (/monumento/<id>, /p/<placa>) ou só o número da placa.
      const resolve = (raw: string) => {
        let key = raw
        try { const u = new URL(raw); key = u.pathname.split('/').filter(Boolean).pop() || raw } catch { /* texto solto */ }
        const plate = raw.match(/p\/(\d{1,3})/)?.[1]
        return findMonument(plate ?? key)
      }
      const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector
      const det = BD ? new BD({ formats: ['qr_code'] }) : null
      const jsQR = det ? null : (await jsqrReady).default
      const canvas = document.createElement('canvas')
      const ctx2d = canvas.getContext('2d', { willReadFrequently: true })
      let n = 0
      // Rápido: lê só o quadrado do centro (onde fica a mira) em 420 px, ~12 vezes por segundo;
      // a cada 5 tentativas lê o quadro inteiro, para QR fora da mira.
      const loop = async () => {
        const v = videoRef.current
        if (!streamRef.current || !v) return
        try {
          let raw: string | undefined
          if (det) raw = (await det.detect(v))[0]?.rawValue
          else if (jsQR && ctx2d && v.videoWidth) {
            const full = n++ % 5 === 4
            const side = Math.min(v.videoWidth, v.videoHeight) * (full ? 1 : 0.72)
            const sx = (v.videoWidth - side) / 2, sy = (v.videoHeight - side) / 2
            const out = full ? 560 : 420
            canvas.width = out; canvas.height = out
            ctx2d.drawImage(v, sx, sy, side, side, 0, 0, out, out)
            raw = jsQR(ctx2d.getImageData(0, 0, out, out).data, out, out, { inversionAttempts: 'dontInvert' })?.data
          }
          if (raw) {
            const found = resolve(raw)
            if (found || simulate) { finish(found ? found.id : target, 'qr'); return }
          }
        } catch { /* continua */ }
        window.setTimeout(loop, det ? 120 : 80)
      }
      loop()
    } catch {
      setCamera('denied')
    }
  }

  // Web NFC real (Chrome no Android). Safari/iOS não expõe Web NFC.
  const startRealNfc = async () => {
    if (!hasWebNfc) return setNfcReal('unsupported')
    try {
      const Reader = (window as unknown as { NDEFReader: new () => { scan: () => Promise<void>; onreading: (e: { message: NdefLike }) => void } }).NDEFReader
      const reader = new Reader()
      await reader.scan()
      setNfcReal('waiting')
      reader.onreading = (e) => {
        let id: string | null = simulate ? target : null
        for (const r of e.message.records) {
          if (r.recordType === 'url' && r.data) {
            const url = new TextDecoder().decode(r.data)
            const plate = url.match(/p\/(\d{2})/)?.[1]
            const found = monuments.find((x) => x.plate === plate)
            if (found) id = found.id
          }
        }
        if (id) finish(id, 'nfc')
      }
    } catch {
      setNfcReal('unsupported')
    }
  }

  return (
    <div className="absolute inset-0 z-50 bg-black text-white flex flex-col anim-fade">
      {/* topo */}
      <div className="pt-[58px] px-4 flex items-center justify-between relative z-10">
        <button onClick={onClose} aria-label="Fechar" className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-xl grid place-items-center"><Icon name="x" size={18} stroke={2.4} /></button>
        <Segmented dark value={mode} onChange={switchMode} options={[{ value: 'qr', label: 'QR Code' }, { value: 'nfc', label: 'Tag NFC' }]} />
        <span className={`h-7 px-2.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${online ? 'bg-white/15' : 'bg-[#ff9f0a] text-black'}`}>
          <Icon name={online ? 'wifi' : 'wifiOff'} size={13} stroke={2.2} />{online ? 'Online' : 'Offline'}
        </span>
      </div>

      {mode === 'qr' ? (
        <div className="relative flex-1 overflow-hidden">
          {/* cena da câmera simulada */}
          {camera === 'on' ? (
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          ) : !simulate ? (
            <div className="absolute inset-0 bg-[#0e1517]" />
          ) : (
            <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% 30%, #5b7a80 0%, #2a3d42 45%, #0e1517 100%)' }}>
              <div className="absolute left-0 right-0 bottom-0 h-[38%]" style={{ background: 'linear-gradient(180deg, #8d8270 0%, #5e5446 100%)' }} />
              <div className="absolute left-1/2 top-[44%] w-[210px] h-[270px] rounded-[10px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] scene-drift" style={{ background: 'linear-gradient(160deg,#1d4a5c,#0b2f49)' }}>
                <div className="px-4 pt-4 text-[10px] tracking-[0.18em] font-bold text-[#dda93f]">PLACA {m.plate}</div>
                <div className="px-4 pt-1 text-[17px] font-semibold leading-tight">{m.name}</div>
                <div className="absolute left-1/2 bottom-5 -translate-x-1/2 p-1.5 bg-white rounded-[6px]"><FakeQR seed={Number(m.plate)} size={118} /></div>
                <div className="absolute right-3 top-3 text-white/70"><Icon name="nfc" size={16} /></div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/25" />
          {!simulate && camera === 'off' && phase === 'scanning' && (
            <div role="dialog" aria-labelledby="aviso-camera-qr" data-testid="aviso-camera-qr" className="absolute left-4 right-4 top-[110px] z-20 rounded-[24px] bg-[#f6f3ec] text-black p-5 sheet-up">
              <span className="w-11 h-11 rounded-[12px] bg-[#2c8585] text-white grid place-items-center"><Icon name="scan" size={22} /></span>
              <h2 id="aviso-camera-qr" className="mt-3 text-[18px] font-bold leading-tight">Usar a câmera para ler a placa</h2>
              <p className="mt-1.5 text-[14px] leading-snug text-black/70">O navegador vai pedir permissão. A imagem fica só no seu aparelho: nada é gravado nem enviado, só o código da placa é lido.</p>
              <button onClick={startCamera} className="mt-4 w-full h-[48px] rounded-[14px] bg-[#2c8585] text-white text-[16px] font-semibold">Permitir câmera</button>
              <button onClick={onClose} className="mt-1 w-full h-[42px] text-[15px] font-semibold text-[#2c8585]">Agora não</button>
            </div>
          )}
          {/* visor */}
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[176px] h-[176px]" style={{ top: 'calc(44% + 50px)' }}>
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
              <span key={c} className={`absolute w-9 h-9 border-[4px] transition-colors duration-300 ${phase === 'scanning' ? 'border-white' : 'border-[#ffd60a]'} ${c === 'tl' ? 'left-0 top-0 border-r-0 border-b-0 rounded-tl-[22px]' : c === 'tr' ? 'right-0 top-0 border-l-0 border-b-0 rounded-tr-[22px]' : c === 'bl' ? 'left-0 bottom-0 border-r-0 border-t-0 rounded-bl-[22px]' : 'right-0 bottom-0 border-l-0 border-t-0 rounded-br-[22px]'}`} />
            ))}
            {phase === 'scanning' && <span className="absolute left-3 right-3 h-[2px] bg-[#ffd60a] shadow-[0_0_14px_#ffd60a] scanline" />}
          </div>
          <div className="absolute left-0 right-0 bottom-[150px] text-center px-8">
            <div className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-black/45 backdrop-blur-xl text-[14px] font-medium">
              {phase === 'scanning' ? 'Aponte para o QR Code da placa' : phase === 'reading' ? 'Lendo…' : 'QR Code reconhecido'}
            </div>
          </div>
          {phase === 'scanning' && (
            <div className="absolute left-0 right-0 bottom-[96px] flex justify-center">
              {simulate && camera === 'off' && <button onClick={startCamera} className="h-9 px-4 rounded-full bg-white/15 backdrop-blur-xl text-[13px] font-semibold flex items-center gap-1.5"><Icon name="scan" size={15} />Usar câmera real</button>}
              {simulate && camera === 'on' && <button onClick={() => finish(target, 'qr')} className="h-9 px-4 rounded-full bg-white/15 backdrop-blur-xl text-[13px] font-semibold">Simular leitura</button>}
              {simulate && camera === 'denied' && <span className="text-[12px] text-white/70">Câmera indisponível na pré-visualização · leitura simulada</span>}
              {!simulate && camera === 'on' && !hasDetector && <span className="max-w-[300px] text-center text-[13px] leading-snug text-white/85">Segure o celular parado, com o QR inteiro dentro do quadro.</span>}
              {!simulate && camera === 'denied' && (
                <span className="max-w-[300px] text-center text-[13px] leading-snug text-white/85">
                  Câmera bloqueada para este site. Toque no cadeado ao lado do endereço, ative a Câmera e tente de novo.
                  <button type="button" onClick={() => void startCamera()} className="mu-press mt-2 mx-auto block min-h-11 rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#0b2f49]">Tentar de novo</button>
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden" style={{ background: 'linear-gradient(180deg,#1b1b1f 0%, #000 100%)' }}>
          {/* placa com tag */}
          <div className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="relative mx-auto w-[150px] h-[150px] grid place-items-center">
              {phase === 'scanning' && [0, 1, 2].map((i) => <span key={i} className="absolute inset-0 rounded-full border-2 border-[#2c8585] nfc-ring" style={{ animationDelay: `${i * 0.6}s` }} />)}
              <div className="relative w-[96px] h-[96px] rounded-[26px] grid place-items-center" style={{ background: 'linear-gradient(160deg,#1d4a5c,#0b2f49)' }}>
                <Icon name="nfc" size={44} stroke={1.6} className="text-[#dda93f]" />
              </div>
            </div>
            {simulate && <div className="mt-3 text-[12px] tracking-[0.16em] text-white/50 font-semibold">PLACA {m.plate} · {m.tag.type}</div>}
          </div>
          {/* folha estilo iOS "Pronto para Ler" */}
          {phase !== 'done' && (
            <div className="absolute left-2 right-2 bottom-2 rounded-[38px] bg-[#f6f3ec] text-black px-6 pt-6 pb-5 text-center sheet-up">
              <div className="text-[24px] font-semibold text-[rgba(60,60,67,0.6)]">{phase === 'reading' ? 'Lendo…' : 'Pronto para Ler'}</div>
              <div className="my-5 mx-auto w-[86px] h-[86px] rounded-full grid place-items-center text-[#2c8585] border-[3px] border-[#2c8585]">
                {phase === 'reading' ? <Icon name="check" size={44} stroke={3} className="pop-in" /> : <Icon name="nfc" size={42} stroke={2} />}
              </div>
              <p className="text-[15px] leading-snug text-black/80">Aproxime o topo do celular da tag NFC da placa. Funciona sem internet.</p>
              {!simulate ? (
                hasWebNfc && nfcReal !== 'unsupported'
                  ? <button onClick={startRealNfc} className="mt-3 h-11 px-5 rounded-full bg-[#2c8585] text-white text-[14px] font-semibold">{nfcReal === 'waiting' ? 'Aguardando a tag…' : 'Começar a ler'}</button>
                  : <p className="mt-3 text-[13px] leading-snug text-black/60">Este aparelho não lê NFC pelo navegador. No iPhone, encoste o celular na placa com a tela desbloqueada: a página do monumento abre sozinha.</p>
              ) : hasWebNfc || nfcReal === 'unsupported' ? (
                <button onClick={startRealNfc} className="mt-3 text-[13px] font-semibold text-[#2c8585]">{nfcReal === 'unsupported' ? 'Web NFC indisponível · leitura simulada' : nfcReal === 'waiting' ? 'Aguardando tag real…' : 'Ler tag real (Android)'}</button>
              ) : (
                <div className="mt-3 text-[12px] text-black/45">Pré-visualização: leitura simulada</div>
              )}
              <button onClick={onClose} className="mt-4 w-full h-[50px] rounded-[14px] bg-[rgba(118,118,128,0.16)] text-[17px] font-semibold">Cancelar</button>
            </div>
          )}
        </div>
      )}

      {/* resultado */}
      {phase === 'done' && result && (
        <div className="absolute left-2 right-2 bottom-2 rounded-[34px] bg-[#f6f3ec] text-black p-5 sheet-up z-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full grid place-items-center text-white pop-in" style={{ background: result.first ? '#34c759' : '#8e8e93' }}>
              <Icon name={result.first ? 'check' : 'book'} size={26} stroke={2.6} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-black/50 font-medium">Placa {result.m.plate} · {mode === 'qr' ? 'QR Code' : 'Tag NFC'}</div>
              <div className="text-[19px] font-semibold leading-tight truncate">{result.m.name}</div>
            </div>
            <RarityPill rarity={result.m.rarity} />
          </div>

          {simulate && mode === 'nfc' && (
            <div className="mt-4 rounded-[16px] bg-white overflow-hidden text-[13px]">
              <div className="px-4 pt-3 pb-1.5 text-[11px] font-semibold tracking-[0.06em] text-black/45">CONTEÚDO LIDO DA TAG (NDEF)</div>
              {[
                ['URI', `memoriaurbana.maceio.br/p/${result.m.plate}`],
                ['Texto', `${result.m.name} · ${result.m.role} · ${result.m.years}`],
                ['Assinatura', 'ECDSA P-256 · válida no aparelho'],
                ['Memória', `${result.m.tag.type} · ${result.m.tag.type === 'NTAG216' ? '612 de 888' : result.m.tag.type === 'NTAG215' ? '402 de 504' : '138 de 144'} bytes`],
              ].map(([k, v], i) => (
                <div key={k} className={`flex gap-3 px-4 py-2 ${i < 3 ? 'border-b border-black/[0.07]' : ''}`}>
                  <span className="w-[74px] text-black/45 shrink-0">{k}</span>
                  <span className="flex-1 font-medium truncate">{v}</span>
                  {k === 'Assinatura' && <Icon name="shield" size={15} className="text-[#34c759]" />}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-[13px]">
            {result.pending ? (
              <span className="flex-1 font-semibold text-[#a35b00]">Página liberada · carimbo reservado (entre para +{result.xp} XP)</span>
            ) : result.first ? (
              <span className="flex-1 font-semibold text-[#1f6b6b]">+{result.xp} XP · carimbo adicionado ao passaporte</span>
            ) : (
              <span className="flex-1 text-black/55">Carimbo já coletado · história aberta</span>
            )}
            {!online && <span className="h-6 px-2 rounded-full bg-[#ff9f0a]/15 text-[#a35b00] text-[11px] font-semibold flex items-center gap-1"><Icon name="clock" size={12} />na fila offline</span>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => switchMode(mode)} className="h-[50px] rounded-[14px] bg-[rgba(118,118,128,0.14)] text-[16px] font-semibold">Ler outra</button>
            <button onClick={onClose} className="h-[50px] rounded-[14px] bg-[#2c8585] text-white text-[16px] font-semibold">Abrir história</button>
          </div>
          {collected.length >= monuments.length && <div className="mt-3 text-center text-[12px] text-black/50">Você completou a trilha!</div>}
        </div>
      )}
    </div>
  )
}
