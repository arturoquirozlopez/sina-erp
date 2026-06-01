type Props = { size?: number; color?: string; accent?: string; light?: boolean };
export function SinaMark({ size = 32, color = '#0F2747', accent = '#1E88E5' }: Props) {
  return (
    <svg width={size} height={size * 1.005} viewBox="0 0 200 201" xmlns="http://www.w3.org/2000/svg" aria-label="Sina">
      <rect x="0"  y="0"   width="160" height="55" rx="2" fill={color} />
      <rect x="40" y="73"  width="160" height="55" rx="2" fill={color} />
      <rect x="0"  y="146" width="160" height="55" rx="2" fill={color} />
      <rect x="40" y="73"  width="160" height="6"  fill={accent} />
    </svg>
  );
}
export function SinaLogo({ size = 30, light = false }: { size?: number; light?: boolean }) {
  const color = light ? '#FFFFFF' : '#0F2747';
  const accent = light ? '#7EB8F7' : '#1E88E5';
  return (
    <div className="flex items-center gap-3">
      <SinaMark size={size} color={color} accent={accent} />
      <span className="font-extrabold text-[20px] leading-none" style={{ letterSpacing: '0.11em', color }}>SINA</span>
    </div>
  );
}
