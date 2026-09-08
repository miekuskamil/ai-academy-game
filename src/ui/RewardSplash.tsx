import { useEffect, useState } from 'react';
import { Button } from './primitives/Button';
import { cn } from '../lib/cn';
import type { BadgeSpec } from '../domain/pipeline/blocks';

/**
 * The moment of reward.
 *
 * When a lesson finishes and a machine part clicks into place, this splashes up
 * over the Done screen: a burst, the new part flying toward the strip with an
 * arrow, and — if this lesson also finished a world — the badge dropping in.
 * It is the deliberate "you earned something" beat the header alone was too
 * quiet to deliver.
 *
 * It respects the motion preference: with motion off it becomes a plain, still
 * "part added" card that the learner dismisses, so nothing is lost, only calmed.
 */
export function RewardSplash({
  partIndex,
  badge,
  onDone,
}: {
  partIndex: number;
  badge: BadgeSpec | null;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<'burst' | 'settle'>('burst');

  useEffect(() => {
    const t = setTimeout(() => setPhase('settle'), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ground-deep/80 p-6"
      role="dialog"
      aria-label="You earned a new part"
    >
      <div className="nrn-enter w-full max-w-sm rounded-2xl border border-spark/40 bg-surface p-6 text-center">
        {/* The burst. A ring of rays behind the new part. */}
        <div className="relative mx-auto h-28 w-28">
          <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={60 + Math.cos(a) * 26}
                  y1={60 + Math.sin(a) * 26}
                  x2={60 + Math.cos(a) * 46}
                  y2={60 + Math.sin(a) * 46}
                  stroke="var(--c-spark)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="nrn-ray"
                  style={{ animationDelay: `${i * 0.03}s` }}
                />
              );
            })}
            <circle cx="60" cy="60" r="24" fill="var(--c-spark)" className="nrn-reward-pop" />
            {/* A little cog on the new part. */}
            <g
              transform="translate(60 60)"
              stroke="var(--c-ground-deep)"
              strokeWidth="3"
              fill="none"
              className="nrn-reward-pop"
              strokeLinecap="round"
            >
              <circle r="8" />
              {Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2;
                return (
                  <line
                    key={i}
                    x1={Math.cos(a) * 8}
                    y1={Math.sin(a) * 8}
                    x2={Math.cos(a) * 12}
                    y2={Math.sin(a) * 12}
                  />
                );
              })}
            </g>
          </svg>
        </div>

        <h2 className="mt-4 font-display text-xl text-ink">A new part clicked in!</h2>
        <p className="mt-1 text-sm text-ink-dim">
          That is part {partIndex + 1} of your machine. It just landed up in the strip
          <span aria-hidden="true" className="nrn-arrow inline-block"> ↗</span>
        </p>

        {badge && (
          <div
            className={cn(
              'mt-5 rounded-xl border border-spark bg-spark/10 p-4',
              phase === 'settle' ? 'nrn-badge-in' : 'opacity-0',
            )}
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-spark text-xl text-ground-deep">
              ★
            </div>
            <p className="mt-2 font-display text-base text-ink">Badge earned: {badge.name}</p>
            <p className="mt-1 text-xs text-ink-dim">{badge.earnedFor}</p>
          </div>
        )}

        <Button className="mt-6 w-full" onClick={onDone}>
          {badge ? 'Brilliant!' : 'Nice!'}
        </Button>
      </div>
    </div>
  );
}
