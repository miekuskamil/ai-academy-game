import { useState } from 'react';
import type { SandboxState } from '../../domain/types';
import { TEMP_DEMO, answerAt, bandFor } from '../../kernels/temperature';
import { cn } from '../../lib/cn';

/**
 * The temperature dial.
 *
 * She moves a slider from steady to wild and taps "ask again" to see the AI
 * answer. Low keeps returning the same safe name; high sprays surprising ones.
 * She feels temperature by moving it, then the lesson names what she felt. The
 * check just wants her to try both ends, so it can never block her.
 */
export function TemperatureDial({
  onState,
  compact = false,
}: {
  onState?: (state: SandboxState) => void;
  compact?: boolean;
}) {
  const [temp, setTemp] = useState(0.1);
  const [answers, setAnswers] = useState<string[]>([]);
  const [triedLow, setTriedLow] = useState(false);
  const [triedHigh, setTriedHigh] = useState(false);

  const ask = () => {
    const next = answerAt(temp, Math.random());
    const list = [next, ...answers].slice(0, 6);
    setAnswers(list);
    const low = triedLow || temp < 0.34;
    const high = triedHigh || temp > 0.66;
    setTriedLow(low);
    setTriedHigh(high);
    onState?.({ triedLow: low, triedHigh: high, bothEnds: low && high });
  };

  const band = bandFor(temp);

  return (
    <div className={cn('flex flex-col gap-4', !compact && 'rounded-2xl border-2 border-line bg-surface p-5')}>
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">Temperature dial</p>
        <p className="mt-1 text-sm text-ink-dim">
          Move the dial, then ask again. Watch how steady or wild the answers get.
        </p>
      </div>

      <div className="rounded-xl border-2 border-line bg-ground-deep p-3">
        <p className="text-center text-sm text-ink">{TEMP_DEMO.prompt}</p>
      </div>

      <div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={temp}
          onChange={(e) => setTemp(Number(e.target.value))}
          className="h-10 w-full cursor-pointer accent-spark"
          aria-label="Temperature"
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] uppercase text-ink-faint">
          <span className={cn(band === 'steady' && 'text-verified')}>Steady</span>
          <span className={cn(band === 'balanced' && 'text-spark')}>Balanced</span>
          <span className={cn(band === 'wild' && 'text-data')}>Wild</span>
        </div>
      </div>

      <button
        type="button"
        onClick={ask}
        className="nrn-press self-start rounded-full border-2 border-spark bg-spark/10 px-5 py-2 text-sm font-bold text-ink"
      >
        Ask again
      </button>

      {answers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {answers.map((a, i) => (
            <span
              key={i}
              className={cn(
                'rounded-full border-2 px-3 py-1 text-sm',
                i === 0 ? 'border-spark bg-spark/10 text-ink' : 'border-line text-ink-dim',
              )}
            >
              {a}
            </span>
          ))}
        </div>
      )}

      <div
        className={cn(
          'rounded-xl border-2 p-3 text-center text-sm',
          triedLow && triedHigh
            ? 'border-verified bg-verified/10 text-verified'
            : 'border-dashed border-line text-ink-faint',
        )}
      >
        {triedLow && triedHigh
          ? 'Feel the difference? Low stays steady, high goes wild. Same AI, different mood.'
          : 'Try asking at the low end, then drag to the high end and ask again.'}
      </div>
    </div>
  );
}
