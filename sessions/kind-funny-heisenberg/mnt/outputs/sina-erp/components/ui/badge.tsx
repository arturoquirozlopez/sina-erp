type Tone = 'neutral' | 'navy' | 'sky' | 'mint' | 'amber' | 'rose';
const palette: Record<Tone, { bg: string; fg: string; dot: string; border: string }> = {
  neutral: { bg: '#F3F4F6', fg: '#374151', dot: '#9CA3AF', border: '#E5E7EB' },
  navy:    { bg: '#EEF2F8', fg: '#0F2747', dot: '#0F2747', border: '#D8E1EE' },
  sky:     { bg: '#E8F1FC', fg: '#0F2747', dot: '#1E88E5', border: '#D6E5F8' },
  mint:    { bg: '#ECF7F2', fg: '#0E8A6B', dot: '#0E8A6B', border: '#D4ECE0' },
  amber:   { bg: '#FBF4E8', fg: '#92400E', dot: '#B45309', border: '#F0E2C8' },
  rose:    { bg: '#FBEDED', fg: '#B91C1C', dot: '#B91C1C', border: '#F2D6D6' },
};
export function Badge({ tone = 'neutral', dot = false, children }: { tone?: Tone; dot?: boolean; children: React.ReactNode }) {
  const s = palette[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border"
      style={{ background: s.bg, color: s.fg, borderColor: s.border }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }} />}
      {children}
    </span>
  );
}
