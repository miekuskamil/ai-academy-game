import type { IGrader, GradeOutcome } from '../IGrader';
import type { OrderExercise, ExerciseResponse } from '../../types';

/**
 * Sequencing. Scored on correctly ordered *pairs* rather than exact position,
 * so one item slipped out of place does not wipe out an otherwise sound
 * sequence — which is what a learner has actually demonstrated.
 */
export class OrderGrader implements IGrader<'order'> {
  readonly kind = 'order' as const;

  grade(exercise: OrderExercise, response: ExerciseResponse): GradeOutcome {
    if (response.kind !== 'order') throw new Error('order grader got wrong response kind');
    const n = exercise.items.length;
    const given = response.order;

    if (given.length !== n) {
      return {
        fraction: 0,
        correct: false,
        feedback: 'Pop every step into place first, then I will check it.',
      };
    }

    const position = new Map<number, number>();
    given.forEach((item, index) => position.set(item, index));

    let concordant = 0;
    let total = 0;
    for (let a = 0; a < n; a += 1) {
      for (let b = a + 1; b < n; b += 1) {
        total += 1;
        const pa = position.get(a);
        const pb = position.get(b);
        if (pa === undefined || pb === undefined) continue;
        if (pa < pb) concordant += 1;
      }
    }

    const fraction = total === 0 ? 1 : concordant / total;
    const correct = fraction === 1;
    const wrong = correct ? [] : given.filter((item, index) => item !== index);

    return {
      fraction,
      correct,
      feedback: correct
        ? exercise.explain
        : fraction > 0.6
          ? 'So close. Most of that order is right — a couple are swapped around.'
          : 'Have a think about what has to happen before anything else can. Start there.',
      wrong,
    };
  }
}
