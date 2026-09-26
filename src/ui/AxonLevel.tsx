import { useEffect, useRef, useState } from 'react';
import type { LevelState } from '../domain/policy/LevelPolicy';
import { useReducedMotion } from '../hooks/useBreakpoint';
import { cn } from '../lib/cn';

/**
 * The level indicator, drawn as a length of axon with a signal travelling
 * along it.
 *
 * This is the one place the design spends its boldness. It is not decoration:
 * the same vocabulary — node, edge, travelling spark — is reused for the skill
 * map, so the shape a learner reads as "my progress" is the same shape the
 * course teaches as "a network". Progress and subject matter are one picture.
 */
export function AxonLevel({ level, className }: { level: LevelState; className?: string }) {
  const reduced = useReducedMotion();
  const [pulse, setPulse] = useState(false);
  const previous = useRef(level.level);

  useEffect(() => {
    if (level.level > previous.current && !reduced) {
      setPulse(true);
      const timer = window.setTimeout(() => setPulse(false), 900);
      return () => window.clearTimeout(timer);
    }
    previous.current = level.level;
    return undefined;
  }, [level.level, reduced]);

  const percent = Math.round(level.fraction * 100);
  const remaining = level.next === null ? 0 : Math.max(0, level.next - level.points);
  const atCap = level.next === null;

  return (
    <div
      className={cn('flex items-center gap-3', className)}
      role="group"
      aria-label={
        atCap
          ? `Level ${level.level}, the highest level, ${level.points} points`
          : `Level ${level.level}, ${percent} percent to level ${level.level + 1}, ${remaining} points to go`
      }
    >
      <span aria-hidden="true" className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
        Level
      </span>
      <Node label={String(level.level)} state="lit" pulsing={pulse} />

      <div className="relative h-4 flex-1 min-w-[48px]" aria-hidden="true">
        {/* Dendrite: the unfired remainder of the segment. */}
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        {/* Fired portion. Width is the only thing that animates. */}
        <span
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-spark transition-[width] duration-slow ease-ease"
          style={{ width: `${percent}%`, boxShadow: '0 0 10px var(--c-spark)' }}
        />
        {/* Signal head, parked where the charge has reached. */}
        {!atCap && (
          <span
            className={cn(
              'absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-spark',
              'transition-[left] duration-slow ease-ease',
              !reduced && 'animate-[nrn-throb_1.8s_ease-in-out_infinite]',
            )}
            style={{ left: `${percent}%` }}
          />
        )}
      </div>

      <Node label={atCap ? '★' : String(level.level + 1)} state={atCap ? 'lit' : 'dim'} />

      <p className="hidden font-mono text-xs tabular-nums text-ink-faint sm:block">
        {atCap ? `${level.points} pts` : `${remaining} to go`}
      </p>
    </div>
  );
}

function Node({
  label,
  state,
  pulsing = false,
}: {
  label: string;
  state: 'lit' | 'dim';
  pulsing?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid h-9 w-9 shrink-0 place-items-center rounded-full border font-mono text-sm font-bold',
        state === 'lit'
          ? 'border-spark bg-spark text-ground-deep'
          : 'border-line bg-ground-deep text-ink-faint',
        pulsing && 'animate-[nrn-fire_0.9s_var(--m-ease)]',
      )}
      style={state === 'lit' ? { boxShadow: '0 0 14px rgba(255, 180, 84, 0.45)' } : undefined}
    >
      {label}
    </span>
  );
}
