import { useState } from 'react'
import { Icon, type IconName } from './ui'
import type { Monument, Report } from './data'

// Relato do visitante em 2 toques: escolhe o problema → envia. Anônimo, sem conta.
const kinds: [Report['kind'], IconName][] = [
  ['Danificado', 'tag'],
  ['Sujo ou pichado', 'sparkles'],
  ['Placa / QR / NFC não funciona', 'nfc'],
  ['Informação errada', 'text'],
  ['Outro', 'chat'],
]

export function ReportSheet({ m, onClose, onSend }: { m: Monument; onClose: () => void; onSend: (r: Omit<Report, 'id' | 'at' | 'status'>) => void }) {
  const [kind, setKind] = useState<Report['kind'] | null>(null)
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState(false)
  const [sent, setSent] = useState(false)

  return (
    <div className="absolute inset-0 z-[60] flex flex-col justify-end bg-black/40 anim-fade" onClick={onClose}>
      <div className="bg-[#f6f3ec] rounded-t-[34px] px-5 pt-2 pb-8 sheet-up max-h-[92%] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pb-2"><span className="w-9 h-[5px] rounded-full bg-black/15" /></div>
        {sent ? (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#2c8585] text-white grid place-items-center pop-in"><Icon name="check" size={32} stroke={3} /></div>
            <h3 className="mt-4 text-[22px] font-bold text-black">Obrigado!</h3>
            <p className="mt-1 text-[15px] text-black/60 leading-snug">A equipe de patrimônio da prefeitura recebeu o relato sobre <b className="text-black">{m.name}</b>.</p>
            <button onClick={onClose} className="mt-6 w-full h-[50px] rounded-[14px] bg-[#0b2f49] text-white text-[16px] font-semibold">Fechar</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-[22px] font-bold tracking-[-0.01em] text-black">Relatar um problema</h3>
              <button onClick={onClose} aria-label="Fechar" className="w-[30px] h-[30px] rounded-full bg-black/[0.07] grid place-items-center text-black/50"><Icon name="x" size={15} stroke={2.6} /></button>
            </div>
            <p className="mt-1 text-[14px] text-black/55">{m.name} · anônimo, sem cadastro</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {kinds.map(([k, ic]) => (
                <button key={k} onClick={() => setKind(k)} className={`min-h-[64px] rounded-[16px] px-3 py-2.5 text-left flex items-center gap-2.5 transition border-2 ${kind === k ? 'border-[#2c8585] bg-[#2c8585]/10' : 'border-transparent bg-white'} ${k === 'Outro' ? 'col-span-2' : ''}`}>
                  <Icon name={ic} size={20} className={kind === k ? 'text-[#2c8585]' : 'text-black/45'} />
                  <span className="text-[14px] font-semibold leading-tight text-black">{k}</span>
                </button>
              ))}
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalhe (opcional)" rows={2} className="mt-3 w-full rounded-[14px] bg-white px-4 py-3 text-[15px] text-black placeholder:text-black/35 outline-none resize-none" />
            <button onClick={() => setPhoto(!photo)} className="mt-2 h-10 px-3 rounded-[12px] bg-white text-[14px] font-medium text-black/70 flex items-center gap-2"><Icon name={photo ? 'check' : 'scan'} size={16} className={photo ? 'text-[#2c8585]' : ''} />{photo ? 'Foto anexada (comprimida, ~80 KB)' : 'Anexar foto (opcional)'}</button>
            <button disabled={!kind} onClick={() => { if (kind) { onSend({ monument: m.id, kind, note: note.trim() || undefined, photo }); setSent(true) } }} className={`mt-4 w-full h-[52px] rounded-[14px] text-[17px] font-semibold transition ${kind ? 'bg-[#2c8585] text-white' : 'bg-black/[0.08] text-black/35'}`}>Enviar relato</button>
          </>
        )}
      </div>
    </div>
  )
}
