import { useEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from 'react'

// Ícones em linha fina, no espírito dos SF Symbols
const paths: Record<string, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  map: <><path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5z" /><path d="M9 4v13M15 6.5v13" /></>,
  scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M7 12h10" /></>,
  qr: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" /></>,
  nfc: <><path d="M8.5 8.5a5 5 0 0 1 0 7" /><path d="M12 6a8.5 8.5 0 0 1 0 12" /><path d="M15.5 3.5a12 12 0 0 1 0 17" /><circle cx="5" cy="12" r="1.2" /></>,
  book: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11" /><circle cx="12" cy="8.5" r="2" /></>,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.2-4 4.4-6 8-6s6.8 2 8 6" /></>,
  chevR: <path d="m9 5 7 7-7 7" />,
  chevL: <path d="m15 5-7 7 7 7" />,
  chevD: <path d="m5 9 7 7 7-7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  play: <path d="M7 4.5v15l13-7.5z" fill="currentColor" />,
  pause: <><rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" /><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" /></>,
  text: <path d="M4 6h16M4 10h16M4 14h11M4 18h8" />,
  speaker: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  hand: <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5V4a1.5 1.5 0 0 1 3 0v7m0-5.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-.5a7 7 0 0 1-5.6-2.8L4.6 16a1.6 1.6 0 0 1 2.5-2z" />,
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  flame: <path d="M12 22a7 7 0 0 0 7-7c0-4-3-6.5-4-10-2 2-3 4-3 6-1-1-2-2-2.5-3.5C7 9.5 5 12 5 15a7 7 0 0 0 7 7z" />,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4H9z" /></>,
  wifiOff: <><path d="M3 3l18 18" /><path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14.5 10.5A10 10 0 0 1 19 13M2 9.5a15 15 0 0 1 4.5-2.8M10.5 5.1A15 15 0 0 1 22 9.5" /><circle cx="12" cy="20" r=".8" fill="currentColor" /></>,
  wifi: <><path d="M2 9.5a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0" /><circle cx="12" cy="20" r=".8" fill="currentColor" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  sparkles: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6 6 2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><circle cx="17" cy="9" r="2.8" /><path d="M16 14.6c2.8 0 4.8 1.8 5.5 4.9" /></>,
  building: <><path d="M3 21h18M5 21V10l7-5 7 5v11" /><path d="M9 21v-6h6v6M9 11h.01M15 11h.01" /></>,
  tag: <><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  shield: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  arrowUR: <path d="M7 17 17 7M8 7h9v9" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>,
  download: <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M4 19h16" />,
  sync: <><path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3" /><path d="M18 3v4h-4M6 21v-4h4" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  route: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16" /></>,
  share: <><path d="M12 15V3m0 0-4 4m4-4 4 4" /><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2" /></>,
  walk: <><circle cx="13" cy="4.5" r="1.8" /><path d="m10 21 2-6-2.5-2.5L11 8l3 3 3 1M9.5 12.5 7 14M14 15l2 6" /></>,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></>,
  cube: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m14 6 4 4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  code: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />,
  sidebar: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
}

export type IconName = keyof typeof paths

export function Icon({ name, size = 20, className = '', stroke = 1.8, style }: { name: IconName; size?: number; className?: string; stroke?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

export function Segmented<T extends string>({ value, options, onChange, dark = false, size = 'md' }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; dark?: boolean; size?: 'sm' | 'md' }) {
  return (
    <div className={`inline-flex p-[3px] rounded-[10px] ${dark ? 'bg-white/12' : 'bg-[rgba(118,118,128,0.12)]'}`} role="tablist">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`${size === 'sm' ? 'px-2.5 h-7 text-[12px]' : 'px-3.5 h-8 text-[13px]'} rounded-[8px] font-semibold transition-all duration-200 ${
              active ? (dark ? 'bg-white/25 text-white shadow-sm' : 'bg-white text-black shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)]') : dark ? 'text-white/70' : 'text-black/60'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Group({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-[14px] overflow-hidden ${className}`}>{children}</div>
}

export function Row({ icon, iconBg = '#2c8585', title, subtitle, right, onClick, last = false }: { icon?: IconName; iconBg?: string; title: ReactNode; subtitle?: ReactNode; right?: ReactNode; onClick?: () => void; last?: boolean }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className="w-full flex items-center gap-3 pl-4 text-left active:bg-black/5 transition-colors">
      {icon && (
        <span className="w-[30px] h-[30px] rounded-[7px] grid place-items-center text-white shrink-0" style={{ background: iconBg }}>
          <Icon name={icon} size={18} stroke={2} />
        </span>
      )}
      <span className={`flex-1 min-w-0 flex items-center gap-2 py-[11px] pr-4 ${last ? '' : 'border-b border-[rgba(60,60,67,0.12)]'}`}>
        <span className="flex-1 min-w-0">
          <span className="block text-[16px] leading-tight text-black truncate">{title}</span>
          {subtitle && <span className="block text-[13px] text-[rgba(60,60,67,0.6)] mt-0.5 truncate">{subtitle}</span>}
        </span>
        {right}
        {onClick && <Icon name="chevR" size={15} stroke={2.4} className="text-[rgba(60,60,67,0.3)] shrink-0" />}
      </span>
    </Tag>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between px-1 mb-2 mt-7">
      <h2 className="text-[22px] font-bold tracking-[-0.02em] text-black">{children}</h2>
      {action}
    </div>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0 ${on ? 'bg-[#2c8585]' : 'bg-[rgba(120,120,128,0.16)]'}`}>
      <span className={`absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)] transition-all duration-200 ${on ? 'left-[22px]' : 'left-[2px]'}`} />
    </button>
  )
}

export function RarityPill({ rarity }: { rarity: 'Comum' | 'Raro' | 'Lendário' }) {
  const styles = {
    Comum: 'bg-black/[0.06] text-black/60',
    Raro: 'bg-[#2c8585]/12 text-[#1f6b6b]',
    Lendário: 'bg-gradient-to-r from-[#f3d27a] to-[#dda93f] text-[#5a3d00]',
  }
  return <span className={`inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[11px] font-bold uppercase tracking-[0.04em] ${styles[rarity]}`}>{rarity === 'Lendário' && <Icon name="star" size={11} stroke={2.4} />}{rarity}</span>
}

// Carimbo circular (passaporte)
export function Stamp({ label, sub, hue, got, rotate = 0, size = 96, method, count }: { label: string; sub: string; hue: string; got: boolean; rotate?: number; size?: number; method?: 'qr' | 'nfc' | 'gps' | 'placa' | 'grupo'; count?: number }) {
  const id = label.replace(/\W/g, '') + size
  return (
    <div className="relative" style={{ width: size, height: size, transform: `rotate(${got ? rotate : 0}deg)` }}>
      <svg viewBox="0 0 100 100" width={size} height={size} className={got ? '' : 'opacity-100'}>
        <defs>
          <path id={`c-${id}`} d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0" />
        </defs>
        {got ? (
          <g fill="none" stroke={hue}>
            <circle cx="50" cy="50" r="46" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="27" strokeWidth="1.5" strokeDasharray="2 2.5" />
            <text fontSize="9.5" fontWeight="800" letterSpacing="1.6" fill={hue} stroke="none">
              <textPath href={`#c-${id}`} startOffset="2%">{(label + ' · ' + sub + ' · ').toUpperCase()}</textPath>
            </text>
            {method === 'qr' ? (
              <g fill={hue} stroke="none" opacity="0.92">
                <rect x="38" y="38" width="10" height="10" rx="1.5" /><rect x="52" y="38" width="10" height="10" rx="1.5" /><rect x="38" y="52" width="10" height="10" rx="1.5" />
                <rect x="52" y="52" width="4" height="4" /><rect x="58" y="58" width="4" height="4" /><rect x="58" y="52" width="4" height="4" opacity="0.5" />
              </g>
            ) : method === 'nfc' ? (
              <g stroke={hue} strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.92">
                <path d="M43 44.5a7 7 0 0 1 0 11" /><path d="M49 40a13 13 0 0 1 0 20" /><path d="M55 35.5a19 19 0 0 1 0 29" />
              </g>
            ) : method === 'grupo' ? (
              <g fill={hue} stroke="none" opacity="0.92"><circle cx="44" cy="44" r="5" /><circle cx="57" cy="44" r="5" /><path d="M35 60a9 9 0 0 1 18 0zM48 60a9 9 0 0 1 18 0z" /></g>
            ) : method === 'gps' ? (
              <path d="M50 37a9 9 0 0 1 9 9c0 6.5-9 15-9 15s-9-8.5-9-15a9 9 0 0 1 9-9zm0 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" fill={hue} stroke="none" opacity="0.92" />
            ) : (
              <path d="m50 36 3.7 7.6 8.3 1.2-6 5.9 1.4 8.3L50 55l-7.4 4 1.4-8.3-6-5.9 8.3-1.2z" fill={hue} stroke="none" opacity="0.9" />
            )}
          </g>
        ) : (
          <g fill="none" stroke="rgba(60,60,67,0.22)">
            <circle cx="50" cy="50" r="46" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M44 46v-4a6 6 0 0 1 12 0v4M41 46h18v13H41z" strokeWidth="2" strokeLinejoin="round" />
          </g>
        )}
      </svg>
      {got && count !== undefined && <span className="absolute -right-1 bottom-0 min-w-[30px] h-[22px] px-1.5 rounded-full text-white text-[11.5px] font-bold grid place-items-center shadow-md tabular-nums" style={{ background: hue, transform: `rotate(${-rotate}deg)` }}>×{count}</span>}
    </div>
  )
}

export function Avatar({ name, color = '#2c8585', size = 36 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span className="grid place-items-center rounded-full text-white font-semibold shrink-0" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {initials}
    </span>
  )
}

export function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  )
}

// Ondas da logo (traço da marca)
export function Waves({ className = '', color = '#2c8585' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 120 16" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M0 6c10 0 10 5 20 5s10-5 20-5 10 5 20 5 10-5 20-5 10 5 20 5 10-5 20-5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M0 12c10 0 10 3 20 3s10-3 20-3 10 3 20 3 10-3 20-3 10 3 20 3 10-3 20-3" fill="none" stroke={color} strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}


// Escolhe a melhor voz em português do Brasil disponível no aparelho (vozes neurais/online primeiro)
let voiceCache: SpeechSynthesisVoice | null | undefined
function bestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  if (voiceCache) return voiceCache
  const all = window.speechSynthesis.getVoices()
  if (!all.length) return null
  const pt = all.filter((v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith('pt'))
  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase(); const br = v.lang.toLowerCase().replace('_', '-') === 'pt-br'
    let p = br ? 100 : 0
    if (/natural|neural|online|premium|enhanced|aprimorad/.test(n)) p += 60
    if (/francisca|thalita|antonio|luciana|felipe|google português do brasil|google portugu/.test(n)) p += 40
    if (!v.localService) p += 10
    if (/compact|espeak/.test(n)) p -= 50
    return p
  }
  voiceCache = pt.sort((a, b) => score(b) - score(a))[0] || null
  return voiceCache
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  try { window.speechSynthesis.getVoices(); window.speechSynthesis.addEventListener?.('voiceschanged', () => { voiceCache = undefined; bestVoice() }) } catch { /* sem vozes */ }
}

// Narração em áudio com legenda: o texto é lido em voz (pt-BR) e a frase narrada fica destacada.
// Serve para "Ler e ouvir" (texto + áudio juntos) e para a audiodescrição.
export function Narrator({ text, extra, title, subtitle, accent = '#2c8585', autoPlay = false, onStart, onEnd, textClassName = 'mt-4 text-[17px] leading-relaxed text-black/85' }: {
  text: string; extra?: string; title: string; subtitle?: string; accent?: string; autoPlay?: boolean; onStart?: () => void; onEnd?: () => void; textClassName?: string
}) {
  const split = (t: string) => (t.match(/[^.!?…]+[.!?…]+["”']?|[^.!?…]+$/g) || [t]).map((p) => p.trim()).filter(Boolean)
  const shown = useMemo(() => split(text), [text]) // eslint-disable-line react-hooks/exhaustive-deps
  const parts = useMemo(() => [...shown, ...(extra ? split(extra) : [])], [shown, extra]) // eslint-disable-line react-hooks/exhaustive-deps
  const [playing, setPlaying] = useState(false)
  const [idx, setIdx] = useState(0)
  const [frac, setFrac] = useState(0)
  const [blocked, setBlocked] = useState(false)
  const run = useRef(0)
  const timer = useRef<number | null>(null)
  const held = useRef<SpeechSynthesisUtterance[]>([]) // Safari descarta falas sem referência e não chama onend
  const synthOk = () => typeof window !== 'undefined' && !!window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined'
  const stop = () => {
    run.current++
    try { if (synthOk() && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) window.speechSynthesis.cancel() } catch { /* sem voz */ }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
    held.current = []
  }
  const finish = (token: number) => { if (token !== run.current) return; setPlaying(false); setIdx(0); setFrac(0); held.current = []; onEnd?.() }
  // legenda por tempo, quando o aparelho não tem voz
  const silent = (from: number, token: number) => {
    const step = (i: number) => {
      if (token !== run.current) return
      if (i >= parts.length) return finish(token)
      setIdx(i); setFrac(0)
      timer.current = window.setTimeout(() => step(i + 1), Math.max(1600, parts[i].length * 60))
    }
    step(from)
  }
  // Todas as frases entram na fila de uma vez, dentro do toque — exigência do Safari/iOS
  const speakAll = (from: number, token: number) => {
    if (!synthOk()) return silent(from, token)
    const synth = window.speechSynthesis
    try { synth.resume() } catch { /* ok */ }
    const voice = bestVoice()
    let started = false
    held.current = parts.slice(from).map((p, k) => {
      const i = from + k
      const u = new SpeechSynthesisUtterance(p)
      u.lang = 'pt-BR'
      if (voice) u.voice = voice
      u.rate = voice && /natural|neural|online|google|premium|enhanced|aprimorad/i.test(voice.name) ? 1 : 0.95
      u.pitch = 1
      u.volume = 1
      u.onstart = () => { if (token !== run.current) return; started = true; setBlocked(false); setIdx(i); setFrac(0) }
      u.onboundary = (e) => { if (token === run.current && e.charIndex) setFrac(Math.min(1, e.charIndex / p.length)) }
      if (i === parts.length - 1) u.onend = () => finish(token)
      u.onerror = (e) => { if (token === run.current && i === parts.length - 1 && (e as SpeechSynthesisErrorEvent).error !== 'interrupted') finish(token) }
      return u
    })
    held.current.forEach((u) => synth.speak(u))
    // se o navegador não começou a falar (autoplay bloqueado), pede um toque
    timer.current = window.setTimeout(() => {
      if (token !== run.current || started) return
      try { synth.cancel() } catch { /* ok */ }
      setPlaying(false); setBlocked(true)
    }, 2500)
  }
  const play = (from: number) => { stop(); const tk = run.current; setPlaying(true); setBlocked(false); onStart?.(); speakAll(from, tk) }
  const toggle = () => { if (playing) { stop(); setPlaying(false) } else play(idx) }
  useEffect(() => { stop(); setPlaying(false); setIdx(0); setFrac(0); setBlocked(false); if (autoPlay) play(0); return () => stop() }, [text]) // eslint-disable-line react-hooks/exhaustive-deps
  const pct = playing || idx > 0 ? ((idx + frac) / parts.length) * 100 : 0
  return (
    <div className="mt-3">
      <div className="bg-white rounded-[18px] p-3.5 flex items-center gap-3">
        <button onClick={toggle} aria-label={playing ? 'Pausar narração' : 'Ouvir narração'} className="w-11 h-11 rounded-full grid place-items-center text-white shrink-0 active:scale-95 transition" style={{ background: accent }}><Icon name={playing ? 'pause' : 'play'} size={20} stroke={2.2} /></button>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-black leading-tight">{title}</div>
          <div className="text-[12px] text-black/50 truncate">{playing ? 'Narrando · o trecho destacado é o que está sendo lido' : blocked ? 'Toque no play para ouvir' : subtitle}</div>
          <div className="mt-1.5 h-1 rounded-full bg-black/10 overflow-hidden"><div className="h-full rounded-full transition-[width] duration-300" style={{ width: pct + '%', background: accent }} /></div>
        </div>
      </div>
      {playing && idx >= shown.length && <div className="mt-2 rounded-[14px] bg-black/80 text-white px-4 py-2.5 text-[15px] leading-snug" aria-live="polite"><span className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55 mb-0.5">Legenda · ficha da obra</span>{parts[idx]}</div>}
      <p className={textClassName} aria-live="polite">
        {shown.map((p, i) => <span key={i} className={'transition-colors duration-200 rounded-[4px] ' + (playing && i === idx ? 'bg-[#ffd60a]/45 text-black' : playing ? 'opacity-60' : '')}>{p}{' '}</span>)}
      </p>
    </div>
  )
}
