import { useState } from 'react';
import type { SandboxState } from '../../domain/types';
import { PLANS, scoreChecks } from '../../kernels/agentPlanner';
import { cn } from '../../lib/cn';

/**
 * Keep the agent honest.
 *
 * Each plan reaches for a goal, but one step has taken a wrong turn. She reads
 * the steps and taps the bad one. It builds the World 6 skill of oversight —
 * catching a wrong step early, while it is still cheap to fix, instead of only
 * judging the final result.
 */
export function AgentPlanner({
  onState,
  compact = false,
}: {
  onState?: (state: SandboxState) => void;
  compact?: boolean;
}) {
  const [guesses, setGuesses] = useState<Record<string, number>>({});

  const guess = (planId: string, stepIndex: number) => {
    if (planId in guesses) return;
    const next = { ...guesses, [planId]: stepIndex };
    setGuesses(next);
    const r = scoreChecks(next);
    onState?.({ correct: r.correct, total: r.total, done: r.done });
  };

  const result = scoreChecks(guesses);

  return (
    <div className={cn('flex flex-col gap-4', !compact && 'rounded-2xl border-2 border-line bg-surface p-5')}>
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">Keep the agent honest</p>
        <p className="mt-1 text-sm text-ink-dim">
          Each plan has one step that took a wrong turn. Tap the bad step to catch it.
        </p>
      </div>

      {PLANS.map((plan) => {
        const answered = plan.id in guesses;
        const picked = guesses[plan.id];
        const right = answered && picked === plan.badStep;
        return (
          <div key={plan.id} className="rounded-xl border-2 border-line p-3">
            <p className="text-xs font-bold text-ink">Goal: {plan.goal}</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {plan.steps.map((step, i) => {
                const isPicked = picked === i;
                const isBad = i === plan.badStep;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={answered}
                    onClick={() => guess(plan.id, i)}
                    className={cn(
                      'nrn-press flex items-center gap-2 rounded-lg border-2 p-2 text-left text-sm transition-colors',
                      !answered
                        ? 'border-line hover:border-spark'
                        : isBad
                          ? 'border-verified bg-verified/10'
                          : isPicked
                            ? 'border-data bg-data/5'
                            : 'border-line opacity-60',
                    )}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink/10 font-mono text-[10px]">
                      {i + 1}
                    </span>
                    <span className="text-ink">{step}</span>
                    {answered && isBad && <span className="ml-auto text-xs text-verified">wrong turn</span>}
                  </button>
                );
              })}
            </div>
            {answered && (
              <p className={cn('mt-2 text-xs', right ? 'text-verified' : 'text-data')}>
                {right ? '\u2713 ' : '\u2192 '}
                {plan.why}
              </p>
            )}
          </div>
        );
      })}

      <div
        className={cn(
          'rounded-xl border-2 p-3 text-center text-sm',
          result.done ? 'border-spark bg-spark/5 text-ink' : 'border-dashed border-line text-ink-faint',
        )}
      >
        {result.done
          ? `You caught ${result.correct} of ${result.total} wrong turns. That is oversight — staying the boss of a fast helper.`
          : `${Object.keys(guesses).length} of ${result.total} checked.`}
      </div>
    </div>
  );
}
