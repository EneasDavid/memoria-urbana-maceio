import React, { useEffect, useRef, useState, type ReactNode } from 'react'
import { AutoHeight, Icon, type IconName } from './ui'
import { prepareAttachment, type Attachment, type Stage } from './features/monument/attach'
import { LIMITS } from './shared/media'
import type { Monument, Report } from './data'

// Relato do visitante em 2 toques: escolhe o problema → envia. Anônimo, sem conta.
const kinds: [Report['kind'], IconName][] = [
  ['Danificado', 'tag'],
  ['Sujo ou pichado', 'sparkles'],
  ['Placa / QR / NFC não funciona', 'nfc'],
  ['Informação errada', 'text'],
  ['Outro', 'chat'],
]

export function ReportSheet({ m, onClose, onSend, sentText }: { m: Monument; onClose: () => void; onSend: (r: Omit<Report, 'id' | 'at' | 'status'>, media?: Blob) => void | Promise<void>; sentText?: ReactNode }) {
  const [kind, setKind] = useState<Report['kind'] | null>(null)
  const [note, setNote] = useState('')
  const [att, setAtt] = useState<Attachment | null>(null)
  const [attErr, setAttErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState<Stage>('lendo')
  const [sending, setSending] = useState(false)
  const STAGE: Record<Stage, string> = { lendo: 'Lendo o arquivo…', verificando: 'Verificando a segurança do arquivo…', 'preparando-foto': 'Preparando a foto (tirando a localização)…', 'lendo-video': 'Conferindo o vídeo…' }
  const send = async () => {
    if (!kind || sending) return
    setSending(true)
    const started = Date.now()
    try {
      await onSend({ monument: m.id, kind, note: note.trim() || undefined, photo: att?.kind === 'image', media: att ? { kind: att.kind, mime: att.mime, bytes: att.bytes, seconds: att.seconds } : undefined }, att?.blob)
    } finally {
      // com anexo, mostra o envio por pelo menos 600 ms: o visitante vê que algo aconteceu
      if (att) await new Promise((r) => setTimeout(r, Math.max(0, 600 - (Date.now() - started))))
      setSending(false)
      setSent(true)
    }
  }
  const fileRef = useRef<HTMLInputElement>(null)
  // Aviso antes de abrir câmera/galeria (pedido de permissão explicado). Lembrado no aparelho em mu_media_ok.
  const [askMedia, setAskMedia] = useState(false)
  const mediaOk = () => { try { return localStorage.getItem('mu_media_ok') === '1' } catch { return false } }
  const [knowsMedia, setKnowsMedia] = useState(mediaOk)
  const acceptMedia = () => { try { localStorage.setItem('mu_media_ok', '1') } catch { /* aba anônima */ } setKnowsMedia(true); setAskMedia(false) }
  useEffect(() => () => { if (att) URL.revokeObjectURL(att.preview) }, [att])
  const pick = async (f: File | undefined) => {
    if (!f) return
    setAttErr(null); setBusy(true)
    try {
      const r = await prepareAttachment(f, setStage)
      if (r.ok) setAtt(r.att); else { setAtt(null); setAttErr(r.reason) }
    } catch { setAttErr('Não foi possível ler este arquivo.') }
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ''
  }
  const [sent, setSent] = useState(false)
  const [closing, setClosing] = useState(false)
  const [bounce, setBounce] = useState(0)
  const [drag, setDrag] = useState(0)
  const dragStart = useRef<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  // Princípio 4 (pose a pose): a folha tem pose de saída, não some de repente
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const close = () => { if (closing) return; if (reduce) return onClose(); setClosing(true); window.setTimeout(onClose, 220) }
  // Princípio 19 (Jakob): arrastar a alça para baixo fecha, como nas folhas do iOS e do Android
  const onDown = (e: React.PointerEvent) => { dragStart.current = e.clientY; (e.target as Element).setPointerCapture?.(e.pointerId) }
  const onMove = (e: React.PointerEvent) => { if (dragStart.current != null) setDrag(Math.max(0, e.clientY - dragStart.current)) }
  const onUp = () => { if (dragStart.current == null) return; dragStart.current = null; if (drag > 90) close(); else setDrag(0) }
  const closeRef = useRef(close)
  closeRef.current = close
  // Diálogo acessível: foco entra no painel e Esc fecha (item 11)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    box.current?.querySelector<HTMLElement>('button, textarea')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`absolute inset-0 z-[60] flex flex-col justify-end bg-black/40 backdrop-blur-[2px] ${closing ? 'mu-veil-out' : 'anim-fade'}`} onClick={close}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="relato-titulo" className={`bg-[#f6f3ec] rounded-t-[34px] px-5 pt-1 pb-8 max-h-[92%] overflow-y-auto mu-raise-2 ${closing ? 'mu-sheet-out' : 'mu-sheet-in'}`} style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center py-2.5 cursor-grab touch-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-hidden="true"><span className="w-10 h-[5px] rounded-full bg-black/20" /></div>
        <AutoHeight>
        {sent ? (
          <div className="text-center py-6">
            <div className="relative mx-auto w-16 h-16 rounded-full bg-[#1f6b6b] text-white grid place-items-center pop-in"><span className="mu-burst" aria-hidden="true" /><Icon name="check" size={32} stroke={3} /></div>
            <h3 className="mt-4 text-[22px] font-bold text-black">Obrigado!</h3>
            <p className="mt-1 text-[15px] text-black/70 leading-snug">{sentText ?? <>A equipe de patrimônio da prefeitura recebeu o relato sobre <b className="text-black">{m.name}</b>. (Demonstração: nada é enviado de verdade.)</>}</p>
            <button onClick={close} className="mu-press mt-6 w-full h-[52px] rounded-[14px] bg-[#0b2f49] text-white text-[16px] font-semibold">Fechar</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 id="relato-titulo" className="text-[22px] font-bold tracking-[-0.01em] text-black">Relatar um problema</h3>
              <button onClick={close} aria-label="Fechar" className="mu-hit mu-press w-[34px] h-[34px] rounded-full bg-black/[0.07] grid place-items-center text-black/60"><Icon name="x" size={15} stroke={2.6} /></button>
            </div>
            <p className="mt-1 text-[14px] text-black/70">{m.name} · anônimo, sem cadastro</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {kinds.map(([k, ic]) => (
                <button key={k + (kind === k ? bounce : '')} onClick={() => { setKind(k); setBounce((b) => b + 1) }} className={`mu-press min-h-[64px] rounded-[16px] px-3 py-2.5 text-left flex items-center gap-2.5 border-2 ${kind === k ? 'border-[#1f6b6b] bg-[#1f6b6b]/10 mu-boing' : 'border-transparent bg-white mu-edge'} ${k === 'Outro' ? 'col-span-2' : ''}`} aria-pressed={kind === k}>
                  <Icon name={ic} size={20} stroke={2.2} className={kind === k ? 'text-[#1f6b6b]' : 'text-black/55'} />
                  <span className="text-[14px] font-semibold leading-tight text-black">{k}</span>
                </button>
              ))}
            </div>
            <textarea aria-label="Detalhe do problema (opcional)" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalhe (opcional). Não escreva nomes ou contatos." rows={2} className="mt-3 w-full rounded-[14px] bg-white px-4 py-3 text-[16px] text-black placeholder:text-black/45 mu-edge resize-none focus-visible:outline-[3px]" />
            {/* anexo real: foto ou vídeo, validado e (foto) recodificado no aparelho — src/shared/media.ts */}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm" className="sr-only" id="relato-anexo" tabIndex={-1} aria-hidden="true" onChange={(e) => pick(e.target.files?.[0])} />
            <input type="file" accept="image/*,video/*" capture="environment" className="sr-only" id="relato-camera" tabIndex={-1} aria-hidden="true" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
            {att ? (
              <div className="mt-2 flex items-center gap-3 rounded-[14px] bg-white p-2 mu-edge" data-testid="anexo">
                {att.kind === 'image'
                  ? <img src={att.preview} alt="Prévia da foto anexada" className="w-14 h-14 rounded-[10px] object-cover" />
                  : <video src={att.preview} className="w-14 h-14 rounded-[10px] object-cover bg-black" muted playsInline aria-label="Prévia do vídeo anexado" />}
                <span className="flex-1 text-[13.5px] text-black/75 leading-tight">{att.label}</span>
                <button onClick={() => setAtt(null)} className="mu-press h-11 px-3 rounded-[10px] text-[13.5px] font-semibold text-[#a3321f]">Remover</button>
              </div>
            ) : (
              busy ? (
                <div className="mt-2 flex items-center gap-3 rounded-[14px] bg-white p-2 mu-edge" role="status" aria-live="polite" data-testid="anexo-processando">
                  <span className="w-14 h-14 rounded-[10px] mu-shimmer shrink-0" aria-hidden="true" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] text-black/75 leading-tight">{STAGE[stage]}</span>
                    <span className="mt-2 block mu-indet" aria-hidden="true" />
                  </span>
                </div>
              ) : (
                askMedia && !knowsMedia ? (
                  <div className="mt-2 rounded-[14px] bg-white p-4 mu-edge" role="dialog" aria-labelledby="perm-titulo" data-testid="aviso-permissao">
                    <h3 id="perm-titulo" className="text-[15px] font-semibold flex items-center gap-2"><Icon name="shield" size={17} stroke={2.2} className="text-[#1f6b6b]" />Acesso à câmera ou à galeria</h3>
                    <p className="mt-1.5 text-[13.5px] leading-snug text-black/75">O celular vai pedir permissão para abrir a câmera ou as suas fotos. O site recebe <strong>só o arquivo que você escolher</strong>: não vê as outras fotos, não grava nada sozinho e tira a localização da foto antes de guardar. Você pode negar e enviar o relato sem anexo.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <label htmlFor="relato-camera" onClick={acceptMedia} className="mu-press h-12 rounded-[12px] bg-[#1f6b6b] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"><Icon name="scan" size={16} stroke={2.2} />Câmera</label>
                      <label htmlFor="relato-anexo" onClick={acceptMedia} className="mu-press h-12 rounded-[12px] bg-[#1f6b6b]/10 text-[#1f6b6b] text-[14px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"><Icon name="image" size={16} stroke={2.2} />Galeria</label>
                    </div>
                    <button type="button" onClick={() => setAskMedia(false)} className="mt-2 w-full h-11 text-[14px] font-semibold text-black/70">Agora não</button>
                  </div>
                ) : knowsMedia ? (
                  <div className="mt-2 flex gap-2">
                    <label htmlFor="relato-camera" className="mu-press h-11 px-3 rounded-[12px] bg-white mu-edge text-[14px] font-medium text-black/75 inline-flex items-center gap-2 cursor-pointer"><Icon name="scan" size={16} stroke={2} />Câmera</label>
                    <label htmlFor="relato-anexo" className="mu-press h-11 px-3 rounded-[12px] bg-white mu-edge text-[14px] font-medium text-black/75 inline-flex items-center gap-2 cursor-pointer"><Icon name="image" size={16} stroke={2} />Galeria (foto ou vídeo)</label>
                  </div>
                ) : (
                  <button type="button" onClick={() => setAskMedia(true)} className="mu-press mt-2 h-11 px-3 rounded-[12px] bg-white mu-edge text-[14px] font-medium text-black/75 inline-flex items-center gap-2" aria-describedby="relato-anexo-regras">
                    <Icon name="scan" size={16} stroke={2} />Anexar foto ou vídeo (opcional)
                  </button>
                )
              )
            )}
            {attErr && <p role="alert" className="mt-2 rounded-[12px] bg-[#c4402e]/10 px-3 py-2 text-[13px] leading-snug text-[#a3321f]">{attErr}</p>}
            <p id="relato-anexo-regras" className="mt-3 text-[12.5px] leading-snug text-black/70">Foto (JPG, PNG, WebP, HEIC) até {LIMITS.imageInBytes / 1024 / 1024} MB ou vídeo (MP4, MOV, WebM) até {LIMITS.videoBytes / 1024 / 1024} MB e {LIMITS.videoSeconds} s. Arquivos compactados e documentos são recusados. Não pedimos nome nem contato. Fotos têm a localização removida e não devem mostrar rostos. Saiba mais na <a href="/privacidade" className="underline">Política de Privacidade</a>.</p>
            <button disabled={!kind || busy || sending} aria-busy={sending} onClick={send} className={`mu-press mt-4 w-full h-[54px] rounded-[14px] text-[17px] font-semibold inline-flex items-center justify-center gap-2.5 ${kind ? 'bg-[#1f6b6b] text-white' : 'bg-black/[0.08] text-black/45'}`}>{sending ? <><span className="mu-spin" aria-hidden="true" />{att?.kind === 'video' ? 'Enviando vídeo…' : att ? 'Enviando foto…' : 'Enviando…'}</> : 'Enviar relato'}</button>
          </>
        )}
        </AutoHeight>
      </div>
    </div>
  )
}
