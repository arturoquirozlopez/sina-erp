type Tone = 'neutral' | 'good' | 'warn' | 'risk' | 'accent';
const dotColor: Record<Tone, string> = {
  neutral: '#9CA3AF', good: '#0E8A6B', warn: '#B45309', risk: '#B91C1C', accent: '#1E88E5',
};
export function Kpi({ label, value, sub, tone = 'neutral' }: {
  label: string; value: string | number; sub?: string; tone?: Tone;
}) {
  return (
    <div className="rounded-lg p-5 bg-white border border-sina-line">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-medium text-sina-muted">
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: dotColor[tone] }} />
        {label}
      </div>
      <div className="text-[26px] leading-tight font-semibold text-sina-ink mt-2 num tracking-tight2">{value}</div>
      {sub && <div className="text-xs text-sina-muted mt-1.5">{sub}</div>}
    </div>
  );
}
