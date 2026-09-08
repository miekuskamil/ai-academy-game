import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'primary' | 'quiet' | 'ghost';

const TONES: Record<Tone, string> = {
  primary: 'bg-spark text-ground-deep font-bold hover:bg-spark-deep',
  quiet: 'bg-surface-hi text-ink border border-line hover:border-ink-faint',
  ghost: 'text-ink-dim hover:text-ink',
};

export function Button({
  tone = 'primary',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; children: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        'nrn-press tap-target rounded-md px-4 py-2 text-sm',
        'disabled:cursor-not-allowed disabled:opacity-40',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
