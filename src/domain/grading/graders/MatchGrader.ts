import type { IGrader, GradeOutcome } from '../IGrader';
import type { MatchExercise, ExerciseResponse } from '../../types';

/** Pair the left column to the right. Credit per correct pair. */
export class MatchGrader implements IGrader<'match'> {
  readonly kind = 'match' as const;

  grade(exercise: MatchExercise, response: ExerciseResponse): GradeOutcome {
    if (response.kind !== 'match') throw new Error('match grader got wrong response kind');
    const n = exercise.pairs.length;
    if (n === 0) return { fraction: 1, correct: true, feedback: exercise.explain };

    const wrong: number[] = [];
    let hits = 0;
    for (let i = 0; i < n; i += 1) {
      if (response.mapping[i] === i) hits += 1;
      else wrong.push(i);
    }

    const fraction = hits / n;
    const correct = hits === n;
    return {
      fraction,
      correct,
      feedback: correct
        ? exercise.explain
        : hits === 0
          ? 'None of those line up yet. Start with the one you feel surest about and work out from there.'
          : `${hits} of ${n} are paired up right. Keep going.`,
      wrong,
    };
  }
}
