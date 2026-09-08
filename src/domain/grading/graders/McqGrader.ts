import type { IGrader, GradeOutcome } from '../IGrader';
import type { McqExercise, ExerciseResponse } from '../../types';

/** Multiple choice, single or multi answer. Partial credit by overlap, so
 *  getting two of three right is visibly better than guessing. */
export class McqGrader implements IGrader<'mcq'> {
  readonly kind = 'mcq' as const;

  grade(exercise: McqExercise, response: ExerciseResponse): GradeOutcome {
    if (response.kind !== 'mcq') throw new Error('mcq grader got wrong response kind');
    const answer = new Set(exercise.answer);
    const picked = new Set(response.selected);

    const hits = [...picked].filter((i) => answer.has(i));
    const misses = [...picked].filter((i) => !answer.has(i));
    const union = new Set([...answer, ...picked]);
    const fraction = union.size === 0 ? 0 : hits.length / union.size;
    const correct = fraction === 1;

    let feedback: string;
    if (correct) feedback = exercise.explain;
    else if (picked.size === 0) feedback = 'Have a go — pick at least one and see what happens.';
    else if (misses.length && hits.length)
      feedback = 'You are onto something. One of those does not belong though — have another look.';
    else if (answer.size > picked.size && !misses.length)
      feedback = 'Everything you picked is right. There is at least one more hiding in there.';
    else feedback = 'Not quite this time. Read it through once more — you are closer than you think.';

    return { fraction, correct, feedback, wrong: misses };
  }
}
