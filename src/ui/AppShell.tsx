import type { ReactNode } from 'react';
import { NavRail } from './NavRail';
import { SaveTab } from './SaveTab';
import { AxonLevel } from './AxonLevel';
import { useEffect } from 'react';
import { useLayout } from '../hooks/useBreakpoint';
import { useViewportKeyboard } from '../hooks/useViewportKeyboard';
import { useProgress } from '../hooks/useContainer';
import { cn } from '../lib/cn';

/**
 * The frame. Navigation and the level indicator persist across routes so a
 * route change reads as moving *within* one place rather than between pages.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const layout = useLayout();
  const { level, state } = useProgress();
  useViewportKeyboard();

  // Publish the motion preference to the document so CSS can honour it.
  useEffect(() => {
    document.documentElement.dataset.motion = state.motion ?? 'auto';
  }, [state.motion]);

  const handset = layout === 'handset';

  return (
    <div className={cn('relative min-h-[var(--vh)]', !handset && 'flex')}>
      <div aria-hidden="true" className="field-grid pointer-events-none fixed inset-0 -z-10" />

      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {!handset && <NavRail layout={layout} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            'z-hud sticky top-0 border-b border-line bg-ground/85 backdrop-blur',
            'px-4 pt-[calc(var(--safe-top)+0.75rem)] pb-3',
          )}
        >
          <div className="mx-auto flex max-w-shell items-center gap-3">
            {handset && (
              <p className="shrink-0 font-display text-lg tracking-tight">
                Neuron<span className="text-spark">.</span>
              </p>
            )}
            <AxonLevel level={level} className="min-w-0 flex-1" />
          </div>
        </header>

        <main
          id="main"
          className={cn(
            'mx-auto w-full max-w-shell flex-1 px-4 py-6',
            handset
              ? 'pb-[calc(var(--nav-h)+var(--safe-bottom)+1.5rem)]'
              : // Room for the puzzle tab fixed on the right edge.
                'pr-24',
          )}
          style={{ viewTransitionName: 'route' } as React.CSSProperties}
        >
          {children}
        </main>
      </div>

      {handset && <NavRail layout={layout} />}

      {!handset && <SaveTab />}

      <span className="sr-only" aria-live="polite">
        Level {level.level}. {state.companionName} is with you.
      </span>
    </div>
  );
}
