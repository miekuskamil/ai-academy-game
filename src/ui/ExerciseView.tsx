import { useState } from 'react';
import type { Exercise, ExerciseResponse } from '../domain/types';
import type { GradeOutcome } from '../domain/grading';
import { Button } from './primitives/Button';
import { cn } from '../lib/cn';
import { permutation } from '../lib/shuffle';

/**
 * Renders one exercise and reports the learner's answer upward.
 *
 * Every interaction here is tap-first: ordering and matching use select-then-
 * place rather than drag, because precise dragging on a 360px handset is a
 * dexterity test, not a comprehension test.
 */
export function ExerciseView({
  exercise,
  response,
  outcome,
  hintUsed,
  seed,
  onRespond,
  onHint,
}: {
  exercise: Exercise;
  response: ExerciseResponse | undefined;
  outcome: GradeOutcome | undefined;
  hintUsed: boolean;
  /** Per-attempt seed used to shuffle answer order. */
  seed: number;
  onRespond: (response: ExerciseResponse) => void;
  onHint: () => void;
}) {
  const locked = outcome?.correct === true;

  return (
    <fieldset
      className="rounded-lg border border-line bg-surface p-4 disabled:opacity-70"
      disabled={locked}
    >
      <legend className="sr-only">{exercise.prompt}</legend>
      <p className="font-display text-lg leading-snug">{exercise.prompt}</p>

      <div className="mt-4">
        {exercise.kind === 'mcq' && (
          <McqInput
            exercise={exercise}
            response={response}
            outcome={outcome}
            seed={seed}
            onRespond={onRespond}
          />
        )}
        {exercise.kind === 'order' && (
          <OrderInput exercise={exercise} response={response} onRespond={onRespond} />
        )}
        {exercise.kind === 'match' && (
          <MatchInput exercise={exercise} response={response} outcome={outcome} onRespond={onRespond} />
        )}
        {exercise.kind === 'numeric' && (
          <NumericInput exercise={exercise} response={response} onRespond={onRespond} />
        )}
        {exercise.kind === 'prompt_rubric' && (
          <PromptInput exercise={exercise} response={response} outcome={outcome} onRespond={onRespond} />
        )}
      </div>

      {exercise.hint && !locked && (
        <div className="mt-4">
          {hintUsed ? (
            <p className="rounded-md border-l-2 border-data bg-ground-deep p-3 text-sm text-ink-dim">
              {exercise.hint}
            </p>
          ) : (
            <Button tone="ghost" onClick={onHint} className="px-0 text-sm">
              Stuck? Have a nudge
            </Button>
          )}
        </div>
      )}

      {outcome && (
        <p
          role="status"
          className={cn(
            'mt-4 rounded-md p-3 text-sm',
            outcome.correct
              ? 'bg-verified/10 text-verified'
              // Not red: a wrong answer here is something to look at again,
              // never a telling-off.
              : 'border border-data/40 bg-data/5 text-ink',
          )}
        >
          <span className="font-bold">{cheer(outcome.correct, exercise.id)} </span>
          {outcome.feedback}
        </p>
      )}
    </fieldset>
  );
}

/**
 * A little warmth on every result.
 *
 * A rotating cheer for a right answer and a kind nudge for a wrong one, picked
 * by the exercise id so it is stable per question but varied across a lesson.
 * Humour at the edges — the teaching text stays exactly as authored.
 */
const CHEERS = ['Nice one!', 'Yes!', 'Spot on.', 'Got it.', 'Bang on.', 'Lovely.'];
const NUDGES = ['Not quite —', 'Close!', 'Almost —', 'Have another look —', 'Nearly —'];
function cheer(correct: boolean, seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const pool = correct ? CHEERS : NUDGES;
  return pool[h % pool.length]!;
}

function McqInput({
  exercise,
  response,
  outcome,
  seed,
  onRespond,
}: {
  exercise: Extract<Exercise, { kind: 'mcq' }>;
  response: ExerciseResponse | undefined;
  outcome: GradeOutcome | undefined;
  seed: number;
  onRespond: (r: ExerciseResponse) => void;
}) {
  const selected = response?.kind === 'mcq' ? response.selected : [];
  const multi = exercise.answer.length > 1;

  // Display order only. Every index below is the choice's *original* index, so
  // selection, grading and the "wrong" markers all stay correct — the shuffle
  // never touches which answer is right, only where it appears on screen.
  const order = permutation(exercise.choices.length, seed + exercise.id.length);

  const toggle = (index: number) => {
    const next = multi
      ? selected.includes(index)
        ? selected.filter((i) => i !== index)
        : [...selected, index]
      : [index];
    onRespond({ kind: 'mcq', selected: next });
  };

  return (
    <>
      {multi && <p className="mb-2 text-sm text-ink-dim">Pick every one that fits.</p>}
      <ul className="flex flex-col gap-2">
        {order.map((index) => {
          const choice = exercise.choices[index]!;
          const isSelected = selected.includes(index);
          const isWrong = outcome?.wrong?.includes(index) ?? false;
          return (
            <li key={choice}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(index)}
                className={cn(
                  'tap-target w-full justify-start gap-3 rounded-md border p-3 text-left text-sm',
                  'transition-colors duration-fast ease',
                  isWrong
                    ? 'border-anomaly bg-anomaly/10'
                    : isSelected
                      ? 'border-spark bg-spark/10'
                      : 'border-line bg-ground-deep hover:border-ink-faint',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center border',
                    multi ? 'rounded-sm' : 'rounded-full',
                    isSelected ? 'border-spark bg-spark' : 'border-line',
                  )}
                />
                {choice}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function OrderInput({
  exercise,
  response,
  onRespond,
}: {
  exercise: Extract<Exercise, { kind: 'order' }>;
  response: ExerciseResponse | undefined;
  onRespond: (r: ExerciseResponse) => void;
}) {
  const placed = response?.kind === 'order' ? response.order : [];
  const remaining = exercise.items.map((_, i) => i).filter((i) => !placed.includes(i));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm text-ink-dim">
          Tap them in the order they happen, starting with whatever comes first.
        </p>
        <ol className="flex flex-col gap-2">
          {placed.map((item, position) => (
            <li key={item} className="flex items-center gap-3 rounded-md border border-spark/40 bg-spark/5 p-3">
              <span className="font-mono text-xs text-spark">{position + 1}</span>
              <span className="flex-1 text-sm">{exercise.items[item]}</span>
              <button
                type="button"
                className="tap-target text-xs text-ink-faint hover:text-ink"
                onClick={() => onRespond({ kind: 'order', order: placed.filter((i) => i !== item) })}
              >
                Take out
              </button>
            </li>
          ))}
          {placed.length === 0 && (
            <li className="rounded-md border border-dashed border-line p-3 text-sm text-ink-faint">
              Nothing here yet — tap one below to start.
            </li>
          )}
        </ol>
      </div>

      {remaining.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {remaining.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => onRespond({ kind: 'order', order: [...placed, item] })}
                className="tap-target rounded-md border border-line bg-ground-deep px-3 py-2 text-sm hover:border-ink-faint"
              >
                {exercise.items[item]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MatchInput({
  exercise,
  response,
  outcome,
  onRespond,
}: {
  exercise: Extract<Exercise, { kind: 'match' }>;
  response: ExerciseResponse | undefined;
  outcome: GradeOutcome | undefined;
  onRespond: (r: ExerciseResponse) => void;
}) {
  const mapping = response?.kind === 'match' ? response.mapping : {};
  const [active, setActive] = useState<number | null>(null);

  const choose = (right: number) => {
    if (active === null) return;
    const next = { ...mapping, [active]: right };
    setActive(null);
    onRespond({ kind: 'match', mapping: next });
  };

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {exercise.pairs.map(([left], index) => {
          const chosen = mapping[index];
          const isWrong = outcome?.wrong?.includes(index) ?? false;
          return (
            <li key={left} className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={active === index}
                onClick={() => setActive(active === index ? null : index)}
                className={cn(
                  'tap-target flex-1 justify-start rounded-md border p-3 text-left text-sm',
                  active === index ? 'border-spark bg-spark/10' : 'border-line bg-ground-deep',
                  isWrong && 'border-anomaly',
                )}
              >
                {left}
              </button>
              <span aria-hidden="true" className="text-ink-faint">
                →
              </span>
              <span
                className={cn(
                  'min-h-touch flex-1 rounded-md border border-dashed p-3 text-sm',
                  chosen === undefined ? 'border-line text-ink-faint' : 'border-verified/50 text-ink',
                )}
              >
                {chosen === undefined ? 'pick a partner' : exercise.pairs[chosen]?.[1]}
              </span>
            </li>
          );
        })}
      </ul>

      <div>
        <p className="mb-2 text-sm text-ink-dim">
          {active === null
            ? 'Tap one on the left, then tap what goes with it.'
            : 'Now tap the one that goes with it.'}
        </p>
        <ul className="flex flex-wrap gap-2">
          {exercise.pairs.map(([, right], index) => (
            <li key={right}>
              <button
                type="button"
                disabled={active === null}
                onClick={() => choose(index)}
                className="tap-target rounded-md border border-line bg-ground-deep px-3 py-2 text-sm enabled:hover:border-ink-faint disabled:opacity-40"
              >
                {right}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function NumericInput({
  exercise,
  response,
  onRespond,
}: {
  exercise: Extract<Exercise, { kind: 'numeric' }>;
  response: ExerciseResponse | undefined;
  onRespond: (r: ExerciseResponse) => void;
}) {
  const value = response?.kind === 'numeric' ? response.value : null;
  return (
    <label className="flex items-center gap-3">
      <span className="sr-only">Your answer</span>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(event) =>
          onRespond({
            kind: 'numeric',
            value: event.target.value === '' ? null : Number(event.target.value),
          })
        }
        className="min-h-touch w-32 rounded-md border border-line bg-ground-deep px-3 text-center font-mono"
      />
      {exercise.unit && <span className="text-ink-dim">{exercise.unit}</span>}
    </label>
  );
}

function PromptInput({
  exercise,
  response,
  outcome,
  onRespond,
}: {
  exercise: Extract<Exercise, { kind: 'prompt_rubric' }>;
  response: ExerciseResponse | undefined;
  outcome: GradeOutcome | undefined;
  onRespond: (r: ExerciseResponse) => void;
}) {
  const text = response?.kind === 'prompt_rubric' ? response.text : '';
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <label>
        <span className="sr-only">Write your prompt</span>
        <textarea
          value={text}
          rows={5}
          onChange={(event) => onRespond({ kind: 'prompt_rubric', text: event.target.value })}
          placeholder="Write what you would say to the model…"
          className="w-full rounded-md border border-line bg-ground-deep p-3 leading-relaxed"
        />
      </label>

      {/* The rubric is visible while writing. Prompting is taught as a skill
          with named criteria, so the criteria are never a hidden answer key. */}
      <ul className="flex flex-wrap gap-2">
        <Chip met={words >= exercise.min_words} label={`${exercise.min_words}+ words`} />
        {exercise.criteria_labels.map((label, index) => (
          <Chip
            key={label}
            label={label}
            met={outcome ? !(outcome.wrong ?? []).includes(index) : undefined}
          />
        ))}
      </ul>
      <p className="font-mono text-xs text-ink-faint">{words} words</p>
    </div>
  );
}

function Chip({ label, met }: { label: string; met: boolean | undefined }) {
  return (
    <li
      className={cn(
        'rounded-full border px-3 py-1 text-xs',
        met === true
          ? 'border-verified/60 text-verified'
          : met === false
            ? 'border-anomaly/60 text-anomaly'
            : 'border-line text-ink-faint',
      )}
    >
      {met === true ? '✓ ' : ''}
      {label}
    </li>
  );
}
