import { useState } from 'react';
import type { SandboxState } from '../../domain/types';
import { TASKS, BIN_LABELS, scoreSort, type Bin } from '../../kernels/taskSorter';
import { cn } from '../../lib/cn';

const BINS: Bin[] = ['ask-ai', 'myself', 'check'];

/**
 * Sort the task.
 *
 * She reads a real task, then taps the bin it belongs in: ask AI, do it myself,
 * or check carefully. Tap-to-place, never drag — reliable on a thumb. It builds
 * the World 3 instinct for what AI is genuinely good for, with a friendly reason
 * revealed on every placement.
 */
export function TaskSorter({
  onState,
  compact = false,
}: {
  onState?: (state: SandboxState) => void;
  compact?: boolean;
}) {
  const [placements, setPlacements] = useState<Record<string, Bin>>({});

  const place = (taskId: string, bin: Bin) => {
    if (taskId in placements) return;
    const next = { ...placements, [taskId]: bin };
    setPlacements(next);
    const r = scoreSort(next);
    onState?.({ correct: r.correct, total: r.total, done: r.done });
  };

  const result = scoreSort(placements);
  const current = TASKS.find((t) => !(t.id in placements));

  return (
    <div className={cn('flex flex-col gap-4', !compact && 'rounded-2xl border-2 border-line bg-surface p-5')}>
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">Sort the task</p>
        <p className="mt-1 text-sm text-ink-dim">
          Read each task, then tap the bin it belongs in.
        </p>
      </div>

      {current ? (
        <div className="rounded-xl border-2 border-spark/50 bg-spark/5 p-4">
          <p className="text-center text-base text-ink">{current.text}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {BINS.map((bin) => (
              <button
                key={bin}
                type="button"
                onClick={() => place(current.id, bin)}
                className="nrn-press rounded-xl border-2 border-line bg-ground-deep px-2 py-3 text-xs font-bold text-ink hover:border-spark"
              >
                {BIN_LABELS[bin]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-spark bg-spark/5 p-4 text-center text-sm text-ink">
          All sorted! You placed {result.correct} of {result.total} in their best bin. Knowing what
          AI is for is half the skill.
        </div>
      )}

      {/* The running tally of what she has sorted, with the reveal. */}
      <div className="flex flex-col gap-1.5">
        {TASKS.filter((t) => t.id in placements).map((t) => {
          const chosen = placements[t.id]!;
          const right = chosen === t.best;
          return (
            <div
              key={t.id}
              className={cn(
                'rounded-lg border p-2 text-xs',
                right ? 'border-verified/40 bg-verified/5' : 'border-data/40 bg-data/5',
              )}
            >
              <span className="text-ink">{t.text}</span>
              <span className={cn('mt-0.5 block', right ? 'text-verified' : 'text-data')}>
                {right ? '\u2713 ' : `\u2192 better in "${BIN_LABELS[t.best]}": `}
                {t.why}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
