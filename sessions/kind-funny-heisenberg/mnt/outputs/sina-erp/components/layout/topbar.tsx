import { ReactNode } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';

export function TopBar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="px-8 h-16 bg-white border-b border-sina-line flex items-center justify-between gap-6">
      <div>
        <h1 className="text-[17px] font-semibold text-sina-ink tracking-tight2">{title}</h1>
        {subtitle && <p className="text-xs text-sina-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <Link href="/configuracion" className="text-sina-muted hover:text-sina-ink" title="Configuración">
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
