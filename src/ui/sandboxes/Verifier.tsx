import { useState } from 'react';
import type { SandboxState } from '../../domain/types';
import { ANSWERS, CARE_LABELS, scoreCare, type Care } from '../../kernels/verifier';
import { cn } from '../../lib/cn';

const CARES: Care[] = ['trust', 'check', 'grown-up'];

/**
 * How hard should you check?
 *
 * Each AI answer needs a different level of care — some are fine to trust, some
 * need a check, some need a real grown-up. She matches each one, building the
 * World 3 habit of scaling how hard she checks to how much the answer matters.
 */
export function Verifier({
  onState,
  compact = false,
}: {
  onState?: (state: SandboxState) => void;
  compact?: boolean;
}) {
  const [guesses, setGuesses] = useState<Record<string, Care>>({});

  const guess = (id: string, care: Care) => {
    if (id in guesses) return;
    const next = { ...guesses, [id]: care };
    setGuesses(next);
    const r = scoreCare(next);
    onState?.({ correct: r.correct, total: r.total, done: r.done });
  };

  const result = scoreCare(guesses);
  const current = ANSWERS.find((a) => !(a.id in guesses));

  return (
    <div className={cn('flex flex-col gap-4', !compact && 'rounded-2xl border-2 border-line bg-surface p-5')}>
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">How hard should you check?</p>
        <p className="mt-1 text-sm text-ink-dim">
          The AI just gave you this. How carefully should you handle it?
        </p>
      </div>

      {current ? (
        <div className="rounded-xl border-2 border-spark/50 bg-spark/5 p-4">
          <p className="text-center text-sm text-ink">{current.text}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {CARES.map((care) => (
              <button
                key={care}
                type="button"
                onClick={() => guess(current.id, care)}
                className="nrn-press rounded-xl border-2 border-line bg-ground-deep px-2 py-3 text-xs font-bold text-ink hover:border-spark"
              >
                {CARE_LABELS[care]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-spark bg-spark/5 p-4 text-center text-sm text-ink">
          All judged! You matched {result.correct} of {result.total}. Checking hard when it matters,
          and relaxing when it does not — that is the whole skill.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {ANSWERS.filter((a) => a.id in guesses).map((a) => {
          const chosen = guesses[a.id]!;
          const right = chosen === a.care;
          return (
            <div
              key={a.id}
              className={cn(
                'rounded-lg border p-2 text-xs',
                right ? 'border-verified/40 bg-verified/5' : 'border-data/40 bg-data/5',
              )}
            >
              <span className="text-ink">{a.text}</span>
              <span className={cn('mt-0.5 block', right ? 'text-verified' : 'text-data')}>
                {right ? '\u2713 ' : `\u2192 better as "${CARE_LABELS[a.care]}": `}
                {a.why}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
