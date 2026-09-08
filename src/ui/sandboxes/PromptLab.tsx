import { useState } from 'react';
import type { SandboxState } from '../../domain/types';
import { analysePrompt, type PromptCheck } from '../../kernels/promptLab';
import { cn } from '../../lib/cn';

/**
 * The prompt lab.
 *
 * She types a prompt and watches four little lights flick on as she covers each
 * part of a good ask — who it is for, the job, the limits, the shape. It is the
 * hands-on heart of the prompting world: instant, playful feedback that rewards
 * her for thinking about each part, not for guessing magic words.
 *
 * The checks are forgiving on purpose. A near miss still lights up, and every
 * dark light offers a friendly nudge rather than a scolding.
 */
export function PromptLab({
  onState,
  compact = false,
}: {
  onState?: (state: SandboxState) => void;
  compact?: boolean;
}) {
  const [text, setText] = useState('');
  const checks = analysePrompt(text);
  const lit = checks.filter((c) => c.hit).length;

  const update = (value: string) => {
    setText(value);
    const score = analysePrompt(value).filter((c) => c.hit).length;
    onState?.({ promptScore: score, promptText: value, parts: score });
  };

  return (
    <div className={cn('flex flex-col gap-4', !compact && 'rounded-2xl border-2 border-line bg-surface p-5')}>
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">Prompt lab</p>
        <p className="mt-1 text-sm text-ink-dim">
          Write an ask below. Watch the four lights flick on as you cover each part. Try for all four!
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => update(e.target.value)}
        rows={3}
        placeholder="Try: Write three fun dog facts for a six-year-old, one sentence each."
        className="w-full resize-y rounded-xl border-2 border-line bg-ground-deep p-3 text-sm text-ink placeholder:text-ink-faint focus:border-spark focus:outline-none"
        spellCheck
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {checks.map((c) => (
          <Light key={c.part} check={c} />
        ))}
      </div>

      <div
        className={cn(
          'rounded-xl border-2 p-3 text-center text-sm transition-colors',
          lit === 4
            ? 'border-verified bg-verified/10 text-verified'
            : lit === 0
              ? 'border-dashed border-line text-ink-faint'
              : 'border-spark/40 bg-spark/5 text-ink',
        )}
      >
        {lit === 4
          ? "All four lit — that is a razor-sharp ask. The AI barely has to guess!"
          : lit === 0
            ? 'Start typing an ask above.'
            : `${lit} of 4 lit. ${firstDark(checks)}`}
      </div>
    </div>
  );
}

function Light({ check }: { check: PromptCheck }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all',
        check.hit
          ? 'nrn-correct border-verified bg-verified/10'
          : 'border-dashed border-line/60',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid h-8 w-8 place-items-center rounded-full text-lg transition-all',
          check.hit ? 'bg-verified text-ground-deep' : 'bg-ground-deep text-ink-faint',
        )}
      >
        {check.hit ? '\u2713' : '\u25cb'}
      </span>
      <span className={cn('text-xs font-bold', check.hit ? 'text-ink' : 'text-ink-faint')}>
        {check.label}
      </span>
    </div>
  );
}

/** The nudge for the first missing part, so she always has one clear next move. */
function firstDark(checks: PromptCheck[]): string {
  return checks.find((c) => !c.hit)?.nudge ?? '';
}
