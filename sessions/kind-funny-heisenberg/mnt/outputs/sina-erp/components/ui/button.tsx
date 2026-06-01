import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const styles: Record<Variant, string> = {
  primary:  'bg-sina-navy text-white hover:bg-sina-deep border border-sina-navy',
  secondary:'bg-white border border-sina-line text-sina-navy hover:border-sina-mid',
  ghost:    'bg-transparent text-sina-body hover:bg-sina-lineSoft border border-transparent',
  danger:   'bg-white border border-sina-line text-sina-rose hover:border-sina-rose',
  accent:   'bg-sina-sky text-white hover:brightness-95 border border-sina-sky',
};
const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-4 py-2.5 text-sm',
};

export const Btn = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', className, children, disabled, ...p }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(
        sizes[size],
        'rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed',
        styles[variant],
        className
      )}
      {...p}
    >
      {children}
    </button>
  )
);
Btn.displayName = 'Btn';
