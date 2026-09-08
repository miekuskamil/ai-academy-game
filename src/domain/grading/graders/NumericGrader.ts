import type { IGrader, GradeOutcome } from '../IGrader';
import type { NumericExercise, ExerciseResponse } from '../../types';

/** A number within tolerance. Feedback says which direction to move, because
 *  "wrong" teaches nothing about a quantity. */
export class NumericGrader implements IGrader<'numeric'> {
  readonly kind = 'numeric' as const;

  grade(exercise: NumericExercise, response: ExerciseResponse): GradeOutcome {
    if (response.kind !== 'numeric') throw new Error('numeric grader got wrong response kind');
    const value = response.value;
    if (value === null || !Number.isFinite(value)) {
      return {
        fraction: 0,
        correct: false,
        feedback: 'Type a number in the box and I will check it for you.',
      };
    }

    const delta = value - exercise.answer;
    const within = Math.abs(delta) <= exercise.tolerance;
    if (within) return { fraction: 1, correct: true, feedback: exercise.explain };

    // Half credit inside three times the tolerance: the right idea, imprecise.
    const near = Math.abs(delta) <= exercise.tolerance * 3;
    return {
      fraction: near ? 0.5 : 0,
      correct: false,
      feedback: near
        ? `Close! Nudge it ${delta > 0 ? 'down' : 'up'} a little and try again.`
        : `That is a long way ${delta > 0 ? 'above' : 'below'} the mark. Have another think about it.`,
    };
  }
}
