import { useState } from 'react'
import { Icon, GoogleG, Toggle, Stamp, Avatar } from './ui'
import type { User } from './data'

// Simulação do fluxo "Entrar com Google" (OAuth 2.0 / OpenID Connect).
// No produto real o botão abre a tela oficial do Google (Google Identity Services);
// o app recebe só nome, e-mail e foto — nunca a senha.
export const demoAccounts: User[] = [
  { name: 'Jovem Werther', email: 'jovem.werther@exemplo.com', color: '#c4683a' },
  { name: 'Anna Karenina', email: 'anna.karenina@exemplo.com', color: '#4d6fb3' },
  { name: 'Gregor Samsa', email: 'gregor.samsa@exemplo.com', color: '#5b8a3c' },
]

export function GoogleLogin({ onClose, onLogin, reason }: { reason?: string; onClose: () => void; onLogin: (u: User, prefs: { history: boolean; location: boolean }) => void }) {
  const [step, setStep] = useState<'intro' | 'choose' | 'consent'>('intro')
  const [account, setAccount] = useState<User>(demoAccounts[0])
  const [history, setHistory] = useState(true)
  const [location, setLocation] = useState(true)

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/35 anim-fade" onClick={onClose}>
      <div className="relative bg-[#f6f3ec] rounded-t-[38px] max-h-[92%] overflow-y-auto sheet-up" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex justify-center pt-2 pb-1 bg-[#f6f3ec]"><span className="w-9 h-[5px] rounded-full bg-black/15" /></div>
        <button onClick={onClose} aria-label="Fechar" className="absolute right-4 top-4 z-20 w-[30px] h-[30px] rounded-full bg-black/[0.07] grid place-items-center text-black/50"><Icon name="x" size={15} stroke={2.6} /></button>

        {step === 'intro' && (
          <div className="px-6 pb-8 pt-3">
            <div className="relative h-[150px] mb-4">
              <div className="absolute left-[18%] top-3"><Stamp label="Graciliano" sub="Pajuçara" hue="#2c8585" got rotate={-12} size={92} /></div>
              <div className="absolute left-[44%] top-0"><Stamp label="Aurélio" sub="Ponta Verde" hue="#3f63b8" got rotate={8} size={84} /></div>
              <div className="absolute left-[34%] top-[62px]"><Stamp label="Nise" sub="Jatiúca" hue="#9b5aa6" got rotate={-4} size={80} /></div>
            </div>
            {reason && <div className="mb-2 inline-flex h-7 px-3 rounded-full bg-[#2c8585]/10 text-[#2c8585] text-[12.5px] font-semibold items-center">{reason}</div>}
            <h2 className="text-[28px] font-bold tracking-[-0.02em] leading-tight text-black">Crie sua conta grátis</h2>
            <p className="mt-2 text-[16px] text-black/60 leading-snug">As páginas dos monumentos continuam abertas para todos. A conta é opcional e libera a parte interativa no app leve: pontos, foto do monumento e realidade aumentada.</p>
            <ul className="mt-5 space-y-3.5">
              {[
                ['scan', '#2c8585', 'Realidade aumentada e 3D', 'Veja informações sobre a obra na câmera e gire o monumento.'],
                ['trophy', '#dda93f', 'Pontos, carimbos e missões', 'Cada placa lida vira carimbo na Trilha Cultural.'],
              ].map(([ic, bg, t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="w-10 h-10 rounded-[11px] grid place-items-center text-white shrink-0" style={{ background: bg }}><Icon name={ic as 'map'} size={21} stroke={2} /></span>
                  <span><span className="block text-[15px] font-semibold text-black">{t}</span><span className="block text-[14px] text-black/55 leading-snug">{d}</span></span>
                </li>
              ))}
            </ul>
            <button onClick={() => setStep('choose')} className="mt-7 w-full h-[52px] rounded-[14px] bg-white border border-black/10 flex items-center justify-center gap-3 text-[16px] font-semibold text-black shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:scale-[0.99] transition">
              <GoogleG size={20} />Continuar com Google
            </button>
            <button onClick={onClose} className="mt-2 w-full h-[48px] text-[16px] font-semibold text-[#2c8585]">Explorar sem conta</button>
            <p className="mt-2 text-[12px] text-center text-black/45 leading-snug">Sem conta, nada sai do seu aparelho: a contagem de leituras é anônima (LGPD).</p>
          </div>
        )}

        {step === 'choose' && (
          <div className="px-5 pb-8 pt-3">
            <div className="mx-auto w-fit h-6 px-2.5 rounded-full bg-[#ff9f0a]/15 text-[#a35b00] text-[11px] font-semibold flex items-center mb-4">Simulação · no app real abre a tela oficial do Google</div>
            <div className="text-center">
              <div className="mx-auto w-fit"><GoogleG size={30} /></div>
              <h3 className="mt-3 text-[22px] font-semibold text-black">Escolha uma conta</h3>
              <p className="text-[14px] text-black/55">para continuar em Memória Urbana</p>
            </div>
            <div className="mt-5 bg-white rounded-[16px] overflow-hidden">
              {demoAccounts.map((a, i) => (
                <button key={a.email} onClick={() => { setAccount(a); setStep('consent') }} className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-black/5 ${i < demoAccounts.length - 1 ? 'border-b border-black/[0.07]' : ''}`}>
                  <Avatar name={a.name} color={a.color} size={38} />
                  <span className="flex-1 min-w-0"><span className="block text-[15px] font-semibold text-black">{a.name}</span><span className="block text-[13px] text-black/50 truncate">{a.email}</span></span>
                  <Icon name="chevR" size={15} stroke={2.4} className="text-black/25" />
                </button>
              ))}
            </div>
            <button onClick={() => setStep('intro')} className="mt-4 w-full h-[44px] text-[15px] font-semibold text-[#2c8585]">Voltar</button>
          </div>
        )}

        {step === 'consent' && (
          <div className="px-5 pb-8 pt-3">
            <div className="flex items-center gap-3 bg-white rounded-[16px] p-3.5">
              <Avatar name={account.name} color={account.color} size={42} />
              <div className="min-w-0"><div className="text-[15px] font-semibold text-black">{account.name}</div><div className="text-[13px] text-black/50 truncate">{account.email}</div></div>
            </div>
            <h3 className="mt-5 text-[20px] font-bold tracking-[-0.01em] text-black">O que o app vai usar</h3>
            <p className="mt-1 text-[14px] text-black/55 leading-snug">Do Google recebemos só nome, e-mail e foto. Você escolhe o resto e pode mudar depois em Perfil.</p>
            <div className="mt-4 bg-white rounded-[16px] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.07]">
                <span className="flex-1"><span className="block text-[15px] font-medium text-black">Salvar carimbos e histórico</span><span className="block text-[13px] text-black/50">Necessário para a trilha e o passaporte</span></span>
                <Toggle on={history} onChange={setHistory} label="Salvar histórico" />
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1"><span className="block text-[15px] font-medium text-black">Localização durante a trilha</span><span className="block text-[13px] text-black/50">Só com o app aberto · nunca em segundo plano</span></span>
                <Toggle on={location} onChange={setLocation} label="Localização" />
              </div>
            </div>
            <div className="mt-4 flex gap-2.5 text-[12.5px] text-black/55 leading-snug px-1">
              <Icon name="shield" size={18} className="text-[#34c759] shrink-0" />
              <span>No painel da prefeitura sua jornada aparece pseudonimizada (ID aleatório), nunca com nome ou e-mail. Dados guardados por até 12 meses; exclusão a qualquer momento.</span>
            </div>
            <button onClick={() => onLogin(account, { history, location })} className="mt-6 w-full h-[52px] rounded-[14px] bg-[#2c8585] text-white text-[17px] font-semibold active:scale-[0.99] transition">Concordar e entrar</button>
            <button onClick={() => setStep('choose')} className="mt-2 w-full h-[44px] text-[15px] font-semibold text-[#2c8585]">Trocar conta</button>
          </div>
        )}
      </div>
    </div>
  )
}
