import { useEffect, useRef, useState } from 'react'
import { Icon, Segmented } from './ui'
import type { Monument } from './data'

// Experiência imersiva 100% no navegador (sem baixar app):
// • RA: câmera do celular (getUserMedia) + rótulos ancorados que acompanham o movimento do aparelho.
//   Em produção: WebXR no Android e AR Quick Look no iPhone, abertos pelo próprio site.
// • 3D: prévia orbital; o modelo real vem de fotogrametria (GLB/USDZ) exibido com <model-viewer>.

export type ImmersiveMode = 'ar' | '3d'

function Fallback({ m }: { m: Monument }) {
  return (
    <div className="absolute inset-0 grid place-items-center" style={{ background: `linear-gradient(160deg, ${m.hue}, #0b2f49)` }}>
      <span className="text-white/60 text-[12px]">[FOTO A PRODUZIR pela curadoria]</span>
    </div>
  )
}

export function Immersive({ m, initial, onClose, onShot }: { m: Monument; initial: ImmersiveMode; onClose: () => void; onShot: () => void }) {
  const [mode, setMode] = useState<ImmersiveMode>(initial)
  const [cam, setCam] = useState<'trying' | 'on' | 'off'>('trying')
  const [found, setFound] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [rot, setRot] = useState(-18)
  const [zoom, setZoom] = useState(1)
  const [flash, setFlash] = useState(false)
  const [shots, setShots] = useState(0)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const drag = useRef<{ x: number; r: number } | null>(null)

  // câmera para RA
  useEffect(() => {
    if (mode !== 'ar') return
    let alive = true
    setFound(false)
    const t = window.setTimeout(() => alive && setFound(true), 1600)
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        if (!alive) return s.getTracks().forEach((x) => x.stop())
        stream.current = s
        setCam('on')
        requestAnimationFrame(() => { if (video.current) { video.current.srcObject = s; video.current.play().catch(() => undefined) } })
      })
      .catch(() => alive && setCam('off'))
    const onOrient = (e: DeviceOrientationEvent) => setTilt({ x: Math.max(-1, Math.min(1, (e.gamma ?? 0) / 25)), y: Math.max(-1, Math.min(1, ((e.beta ?? 60) - 60) / 25)) })
    window.addEventListener('deviceorientation', onOrient)
    return () => {
      alive = false
      window.clearTimeout(t)
      window.removeEventListener('deviceorientation', onOrient)
      stream.current?.getTracks().forEach((x) => x.stop())
      stream.current = null
    }
  }, [mode])

  // auto-giro no 3D
  useEffect(() => {
    if (mode !== '3d') return
    const id = window.setInterval(() => { if (!drag.current) setRot((r) => r + 0.35) }, 30)
    return () => window.clearInterval(id)
  }, [mode])

  const shoot = () => {
    setFlash(true)
    setShots((s) => s + 1)
    onShot()
    window.setTimeout(() => setFlash(false), 220)
  }

  const labels: { t: string; v: string; x: number; y: number }[] = m.facts.slice(0, 3).map(([t, v], i) => ({ t, v, x: [18, 58, 26][i], y: [30, 44, 62][i] }))

  return (
    <div className="absolute inset-0 z-[58] bg-black text-white overflow-hidden anim-fade"
      onPointerMove={(e) => { if (mode === 'ar') { const r = e.currentTarget.getBoundingClientRect(); setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 }) } }}>
      {/* topo */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-[56px] px-4 flex items-center justify-between">
        <button onClick={onClose} aria-label="Fechar" className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl grid place-items-center"><Icon name="x" size={18} stroke={2.4} /></button>
        <Segmented dark value={mode} onChange={setMode} options={[{ value: 'ar', label: 'Realidade aumentada' }, { value: '3d', label: '3D' }]} />
        <span className="w-9" />
      </div>

      {mode === 'ar' ? (
        <>
          {/* cena */}
          {cam === 'on' ? (
            <video ref={video} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          ) : m.photo ? (
            <img src={m.photo.src} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 transition-transform duration-300" style={{ transform: `scale(1.12) translate(${tilt.x * -10}px, ${tilt.y * -8}px)` }} />
          ) : (
            <Fallback m={m} />
          )}
          <div className="absolute inset-0 bg-black/15" />

          {!found ? (
            <div className="absolute inset-0 grid place-items-center">
              <div className="w-[190px] h-[190px] rounded-[30px] border-2 border-white/80 ar-scan" />
              <div className="absolute bottom-[170px] h-9 px-4 rounded-full bg-black/45 backdrop-blur-xl text-[14px] font-medium flex items-center">Aponte para {m.kind === 'Praça' ? 'o monumento' : m.kind === 'Busto' ? 'o busto' : 'a estátua'}…</div>
            </div>
          ) : (
            <>
              {/* rótulos ancorados (parallax pelo giroscópio / mouse) */}
              {labels.map((l, i) => (
                <div key={l.t} className="absolute pop-in" style={{ left: `${l.x}%`, top: `${l.y}%`, transform: `translate(${tilt.x * (14 + i * 8)}px, ${tilt.y * (10 + i * 6)}px)`, animationDelay: `${i * 0.12}s` }}>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white shadow-[0_0_0_5px_rgba(255,255,255,0.25)]" />
                    <div className="max-w-[170px] rounded-[14px] bg-white/80 backdrop-blur-xl text-black px-3 py-2 shadow-lg">
                      <div className="text-[10px] font-bold tracking-[0.08em] text-black/45 uppercase">{l.t}</div>
                      <div className="text-[12.5px] font-semibold leading-snug">{l.v}</div>
                    </div>
                  </div>
                </div>
              ))}
              {/* placa virtual flutuante */}
              <div className="absolute left-1/2 top-[14%] pop-in" style={{ transform: `translate(calc(-50% + ${tilt.x * 26}px), ${tilt.y * 18}px) perspective(600px) rotateY(${tilt.x * 10}deg) rotateX(${-tilt.y * 8}deg)` }}>
                <div className="rounded-[18px] px-4 py-3 text-center shadow-2xl border border-white/30" style={{ background: 'linear-gradient(150deg, rgba(11,47,73,0.92), rgba(44,133,133,0.88))' }}>
                  <div className="text-[10px] font-bold tracking-[0.18em] text-[#dda93f]">PLACA {m.plate} · {m.kind.toUpperCase()}</div>
                  <div className="text-[19px] font-bold leading-tight">{m.name}</div>
                  <div className="text-[12px] text-white/75">{m.role} · {m.years}</div>
                </div>
              </div>
            </>
          )}

          {/* barra inferior */}
          <div className="absolute left-0 right-0 bottom-[34px] z-20 flex flex-col items-center gap-3">
            <div className="h-7 px-3 rounded-full bg-black/45 backdrop-blur-xl text-[11.5px] font-medium flex items-center gap-1.5">
              <Icon name="globe" size={13} />{cam === 'on' ? 'Câmera ativa · roda no navegador, sem app' : 'Pré-visualização · no celular usa a câmera'}
            </div>
            <div className="flex items-center gap-8">
              <span className="w-11 text-center text-[12px] text-white/70 tabular-nums">{shots ? `${shots} foto${shots > 1 ? 's' : ''}` : ''}</span>
              <button onClick={shoot} aria-label="Tirar foto" className="w-[72px] h-[72px] rounded-full border-[4px] border-white grid place-items-center active:scale-95 transition"><span className="w-[58px] h-[58px] rounded-full bg-white" /></button>
              <button onClick={() => setMode('3d')} aria-label="Ver em 3D" className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-xl grid place-items-center text-[12px] font-bold">3D</button>
            </div>
          </div>
          {flash && <div className="absolute inset-0 bg-white z-30" />}
        </>
      ) : (
        <>
          {/* palco 3D */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 55% at 50% 45%, #2b3a40 0%, #0d1214 70%)' }} />
          <div className="absolute left-1/2 top-[58%] w-[280px] h-[60px] -translate-x-1/2 rounded-[50%] bg-black/60 blur-xl" />
          <div className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => { drag.current = { x: e.clientX, r: rot }; e.currentTarget.setPointerCapture(e.pointerId) }}
            onPointerMove={(e) => { if (drag.current) setRot(drag.current.r + (e.clientX - drag.current.x) * 0.6) }}
            onPointerUp={() => { drag.current = null }}
            onWheel={(e) => setZoom((z) => Math.max(0.7, Math.min(1.5, z - e.deltaY * 0.001)))}
            style={{ perspective: 900 }}>
            <div className="absolute left-1/2 top-[44%]" style={{ transformStyle: 'preserve-3d', transform: `translate(-50%, -50%) scale(${zoom}) rotateX(-8deg) rotateY(${rot}deg)` }}>
              {/* figura (frente e verso) */}
              <div className="relative w-[190px] h-[250px]" style={{ transformStyle: 'preserve-3d', transform: 'translateY(-70px)' }}>
                {[0, 180].map((a) => (
                  <div key={a} className="absolute inset-0 rounded-[14px] overflow-hidden border border-white/10" style={{ transform: `rotateY(${a}deg) translateZ(1px)`, backfaceVisibility: 'hidden' }}>
                    {m.photo ? <img src={m.photo.src} alt="" className="w-full h-full object-cover" style={{ filter: a ? 'brightness(0.45) sepia(0.4)' : 'none' }} draggable={false} /> : <Fallback m={m} />}
                  </div>
                ))}
              </div>
              {/* pedestal cilíndrico (16 faces) */}
              <div className="absolute left-1/2 top-[110px]" style={{ transformStyle: 'preserve-3d' }}>
                {Array.from({ length: 16 }, (_, i) => (
                  <div key={i} className="absolute w-[46px] h-[70px] -ml-[23px]" style={{ transform: `rotateY(${i * 22.5}deg) translateZ(112px)`, background: `linear-gradient(180deg, hsl(30 8% ${62 - Math.abs(Math.sin((i * 22.5 + rot) * Math.PI / 180)) * 18}%), hsl(30 6% 28%))` }} />
                ))}
                <div className="absolute w-[230px] h-[230px] -ml-[115px] -mt-[115px] rounded-full" style={{ transform: 'rotateX(90deg)', background: 'radial-gradient(circle, #8f877b, #5b554d)' }} />
              </div>
            </div>
          </div>
          <div className="absolute left-4 right-4 bottom-[34px] z-20 rounded-[22px] bg-white/10 backdrop-blur-2xl border border-white/15 p-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-[11px] bg-white/15 grid place-items-center"><Icon name="sync" size={20} /></span>
              <div className="flex-1">
                <div className="text-[15px] font-semibold">Arraste para girar · role para aproximar</div>
                <div className="text-[12px] text-white/65 leading-snug">Prévia. O modelo real vem de fotogrametria (~80 fotos do celular) e abre no navegador: WebXR no Android, AR Quick Look no iPhone.</div>
              </div>
            </div>
            <button onClick={() => setMode('ar')} className="mt-3 w-full h-[46px] rounded-[13px] bg-white text-black text-[15px] font-semibold flex items-center justify-center gap-2"><Icon name="scan" size={18} />Ver no seu espaço (RA)</button>
          </div>
        </>
      )}
    </div>
  )
}
