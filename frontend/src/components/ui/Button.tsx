import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-card font-ui font-medium ' +
  'transition-all duration-200 ease-paper select-none ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary:
    'bg-sage-500 text-paper-50 border border-sage-600 shadow-card ' +
    'hover:bg-sage-600 hover:-translate-y-px hover:shadow-card-raised ' +
    'active:translate-y-0 active:shadow-card',
  secondary:
    'bg-paper-50 text-ink-900 border border-paper-300 shadow-card ' +
    'hover:border-ink-400 hover:-translate-y-px ' +
    'active:translate-y-0',
  ghost:
    'bg-transparent text-ink-700 border border-transparent ' +
    'hover:bg-paper-200/60 hover:text-ink-900',
  danger:
    'bg-paper-50 text-terra-700 border border-terra-300 shadow-card ' +
    'hover:bg-terra-300/20',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-13 px-7 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: Props) {
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}
