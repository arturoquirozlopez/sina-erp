import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type FieldProps = { label?: string; hint?: string; error?: string };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  ({ label, hint, error, className, ...p }, ref) => (
    <label className="block">
      {label && <span className="block text-xs font-medium text-sina-body mb-1.5">{label}</span>}
      <input ref={ref} {...p}
        className={clsx(
          'w-full px-3 py-2 rounded-md border border-sina-line bg-white text-sm text-sina-ink placeholder:text-sina-muted ring-focus',
          error && 'border-sina-rose',
          className
        )}
      />
      {hint && <span className="block text-xs text-sina-muted mt-1">{hint}</span>}
      {error && <span className="block text-xs text-sina-rose mt-1">{error}</span>}
    </label>
  )
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(
  ({ label, children, className, ...p }, ref) => (
    <label className="block">
      {label && <span className="block text-xs font-medium text-sina-body mb-1.5">{label}</span>}
      <select ref={ref} {...p} className={clsx('w-full px-3 py-2 rounded-md border border-sina-line bg-white text-sm text-sina-ink ring-focus', className)}>
        {children}
      </select>
    </label>
  )
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(
  ({ label, className, ...p }, ref) => (
    <label className="block">
      {label && <span className="block text-xs font-medium text-sina-body mb-1.5">{label}</span>}
      <textarea ref={ref} {...p} className={clsx('w-full px-3 py-2 rounded-md border border-sina-line bg-white text-sm text-sina-ink ring-focus', className)} />
    </label>
  )
);
Textarea.displayName = 'Textarea';
