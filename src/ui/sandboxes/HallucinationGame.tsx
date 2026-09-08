import { useState } from 'react';
import type { SandboxState } from '../../domain/types';
import { CLAIMS, scoreGuesses } from '../../kernels/hallucination';
import { cn } from '../../lib/cn';

/**
 * Spot the hallucination.
 *
 * She reads AI answers that all sound equally sure and marks each one real or
 * made-up. The point lands by feel: confidence tells you nothing, so you have to
 * think. After each guess it reveals the truth and why, turning every miss into
 * a little lesson rather than a fail.
 */
export function HallucinationGame({
  onState,
  compact = false,
}: {
  onState?: (state: SandboxState) => void;
  compact?: boolean;
}) {
  const [guesses, setGuesses] = useState<Record<string, boolean>>({});

  const guess = (id: string, real: boolean) => {
    if (id in guesses) return; // locked once answered
    const next = { ...guesses, [id]: real };
    setGuesses(next);
    const result = scoreGuesses(next);
    onState?.({ correct: result.correct, total: result.total, done: result.done });
  };

  const result = scoreGuesses(guesses);

  return (
    <div className={cn('flex flex-col gap-3', !compact && 'rounded-2xl border-2 border-line bg-surface p-5')}>
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">Spot the made-up one</p>
        <p className="mt-1 text-sm text-ink-dim">
          Every answer below sounds sure. Some are true, some are invented. Which is which?
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {CLAIMS.map((claim) => {
          const answered = claim.id in guesses;
          const pickedReal = guesses[claim.id];
          const right = answered && pickedReal === claim.real;
          return (
            <div
              key={claim.id}
              className={cn(
                'rounded-xl border-2 p-3 transition-colors',
                !answered
                  ? 'border-line'
                  : right
                    ? 'border-verified bg-verified/5'
                    : 'border-data bg-data/5',
              )}
            >
              <p className="text-sm text-ink">{claim.text}</p>
              {!answered ? (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => guess(claim.id, true)}
                    className="nrn-press rounded-full border-2 border-verified/50 px-4 py-1 text-xs font-bold text-verified"
                  >
                    Real
                  </button>
                  <button
                    type="button"
                    onClick={() => guess(claim.id, false)}
                    className="nrn-press rounded-full border-2 border-data/50 px-4 py-1 text-xs font-bold text-data"
                  >
                    Made up
                  </button>
                </div>
              ) : (
                <p className={cn('mt-2 text-xs', right ? 'text-verified' : 'text-data')}>
                  {right ? '\u2713 ' : '\u2192 '}
                  {claim.why}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          'rounded-xl border-2 p-3 text-center text-sm',
          result.done ? 'border-spark bg-spark/5 text-ink' : 'border-dashed border-line text-ink-faint',
        )}
      >
        {result.done
          ? `You caught ${result.correct} of ${result.total}. The sure ones fooled nobody — you checked instead of trusting the tone.`
          : `${Object.keys(guesses).length} of ${result.total} judged. Keep going.`}
      </div>
    </div>
  );
}
