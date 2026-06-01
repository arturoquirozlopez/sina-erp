import { ReactNode } from 'react';
import clsx from 'clsx';

type Props = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: string;
};
export function Card({ title, subtitle, action, children, className, padding = 'p-6' }: Props) {
  return (
    <div className={clsx('bg-white rounded-lg border border-sina-line', className)}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-sina-line flex items-center justify-between">
          <div>
            {title && <h3 className="text-[13px] font-semibold text-sina-ink tracking-tight2">{title}</h3>}
            {subtitle && <p className="text-xs text-sina-muted mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">{action}</div>
        </div>
      )}
      <div className={padding}>{children}</div>
    </div>
  );
}
