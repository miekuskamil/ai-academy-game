import { useMemo, useState } from 'react';
import {
  accuracy,
  evaluate,
  classify,
  testPoints,
  type Label,
  type LabelledPoint,
  type TestOutcome,
} from '../../kernels/knn';
import type { SandboxState } from '../../domain/types';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/cn';

const K = 3;
const SIZE = 320;

/**
 * The first thing she trains.
 *
 * She taps to place example dots of two colours, then runs ten test dots she
 * has never seen. The hidden pattern is a curve, so the lazy strategy — four
 * dots in the corners — deliberately falls short of the bar. The only way past
 * it is to put examples where the two colours actually meet, which is the
 * lesson: a model learns the boundary, and the awkward cases are the ones that
 * teach it something.
 *
 * Everything is tap-driven. Placing a dot is a single touch, never a drag.
 */
export function KnnSandbox({
  onState,
  compact = false,
}: {
  onState?: (state: SandboxState) => void;
  compact?: boolean;
}) {
  const [training, setTraining] = useState<LabelledPoint[]>([]);
  const [brush, setBrush] = useState<Label>(0);
  const [outcomes, setOutcomes] = useState<TestOutcome[] | null>(null);
  // Both extremes are kept because one lesson asks her to break it on purpose
  // and then recover.
  const [lowest, setLowest] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);

  const tests = useMemo(() => testPoints(), []);

  const place = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setTraining((current) => [...current, { x, y, label: brush }]);
    setOutcomes(null);
  };

  const run = () => {
    const result = evaluate(training, tests, K);
    const score = accuracy(result);
    const nextLow = lowest === null ? score : Math.min(lowest, score);
    const nextBest = best === null ? score : Math.max(best, score);

    setOutcomes(result);
    setLowest(nextLow);
    setBest(nextBest);
    onState?.({
      accuracy: score,
      lowest: nextLow,
      best: nextBest,
      trainingCount: training.length,
      runs: (outcomes ? 1 : 0) + 1,
    });
  };

  const score = outcomes ? accuracy(outcomes) : null;
  const right = outcomes ? outcomes.filter((o) => o.correct).length : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {([0, 1] as Label[]).map((label) => (
          <button
            key={label}
            type="button"
            aria-pressed={brush === label}
            onClick={() => setBrush(label)}
            className={cn(
              'tap-target gap-2 rounded-md border px-3 text-sm transition-colors duration-fast ease',
              brush === label ? 'border-ink bg-surface-hi' : 'border-line bg-ground-deep',
            )}
          >
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 rounded-full"
              style={{ background: label === 0 ? 'var(--c-data)' : 'var(--c-spark)' }}
            />
            {label === 0 ? 'Blue' : 'Amber'}
          </button>
        ))}
        <p className="text-sm text-ink-dim">Tap the square to add an example.</p>
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[420px] touch-none rounded-lg border border-line bg-ground-deep"
        onClick={place}
        role="application"
        aria-label={`Training field. ${training.length} examples placed. ${
          score === null ? 'Not tested yet.' : `Iskra got ${right} of ${tests.length} right.`
        }`}
      >
        {[1, 2, 3].map((i) => (
          <g key={i} stroke="var(--c-line-soft)" strokeWidth="1">
            <line x1={(SIZE / 4) * i} y1="0" x2={(SIZE / 4) * i} y2={SIZE} />
            <line x1="0" y1={(SIZE / 4) * i} x2={SIZE} y2={SIZE} />
          </g>
        ))}

        {/* What Iskra currently believes, sampled coarsely. Shown only after a
            test so she forms her own expectation first. */}
        {outcomes &&
          training.length > 0 &&
          Array.from({ length: 16 }, (_, gx) =>
            Array.from({ length: 16 }, (_, gy) => {
              const p = { x: (gx + 0.5) / 16, y: (gy + 0.5) / 16 };
              const guess = classify(training, p, K);
              if (guess === null) return null;
              return (
                <rect
                  key={`${gx}-${gy}`}
                  x={(gx / 16) * SIZE}
                  y={(gy / 16) * SIZE}
                  width={SIZE / 16}
                  height={SIZE / 16}
                  fill={guess === 0 ? 'var(--c-data)' : 'var(--c-spark)'}
                  opacity="0.13"
                />
              );
            }),
          )}

        {training.map((point, i) => (
          <circle
            key={`${point.x}-${point.y}-${i}`}
            cx={point.x * SIZE}
            cy={point.y * SIZE}
            r="6"
            fill={point.label === 0 ? 'var(--c-data)' : 'var(--c-spark)'}
            stroke="var(--c-ground-deep)"
            strokeWidth="1.5"
          />
        ))}

        {outcomes?.map((outcome, i) => (
          <g key={`t-${i}`}>
            <rect
              x={outcome.point.x * SIZE - 7}
              y={outcome.point.y * SIZE - 7}
              width="14"
              height="14"
              rx="3"
              fill="var(--c-ground-deep)"
              stroke={outcome.correct ? 'var(--c-verified)' : 'var(--c-anomaly)'}
              strokeWidth="2"
            />
            <path
              d={
                outcome.correct
                  ? `M${outcome.point.x * SIZE - 3.5},${outcome.point.y * SIZE} l2.5,3 l4.5,-5.5`
                  : `M${outcome.point.x * SIZE - 3.5},${outcome.point.y * SIZE - 3.5} l7,7 M${
                      outcome.point.x * SIZE + 3.5
                    },${outcome.point.y * SIZE - 3.5} l-7,7`
              }
              fill="none"
              stroke={outcome.correct ? 'var(--c-verified)' : 'var(--c-anomaly)'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        ))}
      </svg>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={run} disabled={training.length === 0}>
          {outcomes ? 'Test her again' : 'Test her'}
        </Button>
        <Button
          tone="quiet"
          onClick={() => {
            setTraining((c) => c.slice(0, -1));
            setOutcomes(null);
          }}
          disabled={training.length === 0}
        >
          Undo
        </Button>
        <Button
          tone="ghost"
          onClick={() => {
            setTraining([]);
            setOutcomes(null);
          }}
          disabled={training.length === 0}
        >
          Clear
        </Button>
        <p className="font-mono text-xs text-ink-faint">{training.length} examples</p>
      </div>

      <p
        role="status"
        className={cn(
          'rounded-md p-3 text-sm',
          score === null
            ? 'border border-dashed border-line text-ink-dim'
            : score >= 0.8
              ? 'bg-verified/10 text-verified'
              : 'border border-data/40 bg-data/5 text-ink',
        )}
      >
        {score === null
          ? training.length === 0
            ? 'Iskra has seen nothing yet, so she cannot guess anything. Give her some examples.'
            : 'Now test her on ten dots she has never seen.'
          : `Iskra got ${right} of ${tests.length} right. ${
              score >= 0.8
                ? 'She has found the pattern.'
                : right === 0
                  ? 'Every single one wrong — have a look at where the crosses are.'
                  : 'Look at where the crosses are. That is where she is still guessing.'
            }`}
      </p>

      {!compact && score !== null && score < 0.8 && (
        <p className="text-sm text-ink-dim">
          The two colours meet along a line you cannot see. Iskra only knows what you have shown
          her, so the dots nearest that line are worth the most.
        </p>
      )}
    </div>
  );
}
