import { useMemo, useState } from 'react';
import type { SandboxState } from '../../domain/types';
import { PIPELINES, scoreArrangement, shuffled } from '../../kernels/pipelineBuilder';
import { cn } from '../../lib/cn';

/**
 * Build the pipeline.
 *
 * The steps of a real AI project arrive shuffled. She taps them in the order she
 * thinks they run, building the in-decide-out shape herself. Tap a step to add
 * it to the line; tap it in the line to take it back. It makes World 5's "a
 * project is a little pipeline" idea something she assembles, not just reads.
 */
export function PipelineBuilder({
  onState,
  compact = false,
}: {
  onState?: (state: SandboxState) => void;
  compact?: boolean;
}) {
  const steps = PIPELINES.plant!;
  const bench = useMemo(() => shuffled(steps), [steps]);
  const [line, setLine] = useState<string[]>([]);

  const place = (id: string) => {
    if (line.includes(id)) return;
    const next = [...line, id];
    setLine(next);
    report(next);
  };

  const takeBack = (id: string) => {
    const next = line.filter((x) => x !== id);
    setLine(next);
    report(next);
  };

  const report = (arr: string[]) => {
    const r = scoreArrangement(steps, arr);
    onState?.({ inPlace: r.inPlace, total: r.total, done: arr.length === steps.length });
  };

  const result = scoreArrangement(steps, line);
  const done = line.length === steps.length;
  const waiting = bench.filter((s) => !line.includes(s.id));

  return (
    <div className={cn('flex flex-col gap-4', !compact && 'rounded-2xl border-2 border-line bg-surface p-5')}>
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">Build the pipeline</p>
        <p className="mt-1 text-sm text-ink-dim">
          Put the steps in the order they run: something in, the AI decides, something out.
        </p>
      </div>

      {/* The line she is building. */}
      <div className="flex flex-col gap-2 rounded-xl border-2 border-dashed border-line p-3">
        {line.length === 0 && (
          <p className="text-center text-xs text-ink-faint">Tap a step below to start your pipeline.</p>
        )}
        {line.map((id, i) => {
          const step = steps.find((s) => s.id === id)!;
          const right = step.order === i;
          return (
            <button
              key={id}
              type="button"
              onClick={() => takeBack(id)}
              className={cn(
                'nrn-press flex items-center gap-3 rounded-xl border-2 p-2 text-left text-sm',
                done
                  ? right
                    ? 'border-verified bg-verified/5'
                    : 'border-data bg-data/5'
                  : 'border-spark/40 bg-spark/5',
              )}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink/10 font-mono text-xs">
                {i + 1}
              </span>
              <span className="text-ink">{step.text}</span>
            </button>
          );
        })}
      </div>

      {/* The bench of steps still to place. */}
      {waiting.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Steps to place</p>
          {waiting.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => place(s.id)}
              className="nrn-press rounded-xl border-2 border-line bg-ground-deep p-2 text-left text-sm text-ink hover:border-spark"
            >
              {s.text}
            </button>
          ))}
        </div>
      )}

      {done && (
        <div
          className={cn(
            'rounded-xl border-2 p-3 text-center text-sm',
            result.correct ? 'border-verified bg-verified/10 text-verified' : 'border-data bg-data/5 text-ink',
          )}
        >
          {result.correct
            ? 'Perfect pipeline! In, the AI decides, out. That is exactly how a real build flows.'
            : `${result.inPlace} of ${result.total} in the right spot. Tap one to take it back and try again.`}
        </div>
      )}
    </div>
  );
}
