import type { ReactNode } from 'react';

/** An empty screen is an invitation to act, not an apology. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-reading py-8 text-center">
      <svg viewBox="0 0 64 64" className="mx-auto mb-5 h-14 w-14" fill="none" aria-hidden="true">
        <path d="M32 8v14M32 42v14M8 32h14M42 32h14" stroke="var(--c-line)" strokeWidth="2" />
        <circle cx="32" cy="32" r="8" stroke="var(--c-spark)" strokeWidth="2" />
        <circle cx="32" cy="32" r="2.5" fill="var(--c-spark)" />
      </svg>
      {/* It fills the whole page when shown, so it carries the page heading. */}
      <h1 className="text-xl">{title}</h1>
      <p className="mt-2 text-ink-dim">{children}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
