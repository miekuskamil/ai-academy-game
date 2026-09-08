import type { IGrader, GradeOutcome } from '../IGrader';
import type { PromptRubricExercise, ExerciseResponse } from '../../types';

/**
 * Scores a written prompt against a rubric, with no language model involved.
 *
 * This is what lets prompting be taught as a *skill with criteria* rather than
 * a vibe. Each `must_include` group is one rubric line (role, context,
 * constraint, format, example) and is satisfied by any synonym in the group, so
 * a learner is credited for the move they made, not the exact word they chose.
 * Because it is deterministic she can re-read the feedback, edit one line, and
 * watch precisely that criterion turn green.
 */
export class PromptRubricGrader implements IGrader<'prompt_rubric'> {
  readonly kind = 'prompt_rubric' as const;

  grade(exercise: PromptRubricExercise, response: ExerciseResponse): GradeOutcome {
    if (response.kind !== 'prompt_rubric') {
      throw new Error('prompt_rubric grader got wrong response kind');
    }
    const text = response.text.trim();
    const haystack = normalise(text);
    const words = text.split(/\s+/).filter(Boolean).length;

    if (words === 0) {
      return {
        fraction: 0,
        correct: false,
        feedback: 'Write your prompt in the box, then I will check it for you.',
      };
    }

    const criteria = exercise.must_include.map((group, index) => ({
      label: exercise.criteria_labels[index] ?? `Criterion ${index + 1}`,
      met: group.some((phrase) => haystack.includes(normalise(phrase))),
    }));

    const banned = exercise.must_avoid.filter((phrase) => haystack.includes(normalise(phrase)));
    const lengthMet = words >= exercise.min_words;

    const totalChecks = criteria.length + 1; // criteria plus length
    const passed = criteria.filter((c) => c.met).length + (lengthMet ? 1 : 0);

    // Banned phrases cost one check each, floored at zero.
    const adjusted = Math.max(0, passed - banned.length);
    const fraction = totalChecks === 0 ? 1 : adjusted / totalChecks;
    const correct = adjusted === totalChecks;

    const missing = criteria.filter((c) => !c.met).map((c) => c.label);
    const notes: string[] = [];
    if (!lengthMet) notes.push(`give it a bit more — at least ${exercise.min_words} words`);
    if (missing.length) notes.push(`you still need to say ${joinWords(missing)}`);
    if (banned.length) notes.push(`swap "${banned[0]}" for something more specific`);

    return {
      fraction,
      correct,
      feedback: correct ? exercise.explain : `Good start. Now ${joinWords(notes)}.`,
      wrong: criteria.flatMap((c, i) => (c.met ? [] : [i])),
    };
  }
}

/** Reads a list the way a person would say it out loud. */
function joinWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Lowercase, strip punctuation, collapse whitespace. Keeps matching forgiving
 *  about how a 10-year-old actually types. */
function normalise(input: string): string {
  return ` ${input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}
