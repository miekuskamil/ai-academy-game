import type { Exercise, ExerciseResponse, Lesson } from '../types';
import type { GradeOutcome } from './IGrader';
import type { GraderRegistry } from './GraderRegistry';
import type { PuzzleMode } from '../progress/state';

/**
 * How the grown-ups' "Hands-on puzzles" setting changes scoring.
 *  - full:   puzzles are graded like any other question.
 *  - gentle: any real attempt at a puzzle counts, so a child is never stuck on one.
 *  - off:    puzzles are left out of the lesson and out of the score.
 */
export interface GradeOptions {
  puzzleMode?: PuzzleMode;
}

/** Whether an exercise is part of this lesson attempt under the given mode. */
export function isAsked(exercise: Exercise, options: GradeOptions = {}): boolean {
  return !(exercise.kind === 'sandbox' && options.puzzleMode === 'off');
}

export interface LessonGrade {
  /** Fraction of the *gradeable* points, 0..1. */
  score: number;
  earned: number;
  available: number;
  perExercise: Record<string, GradeOutcome>;
  /** Exercises this build cannot grade yet. Excluded from the score. */
  pending: string[];
}

export class GradingService {
  constructor(private readonly registry: GraderRegistry) {}

  /** Whether this build can score the exercise at all. */
  canGrade(exercise: Exercise): boolean {
    const grader = this.registry.get(exercise.kind);
    if (!grader) return false;
    return grader.supports ? grader.supports(exercise as never) : true;
  }

  gradeOne(exercise: Exercise, response: ExerciseResponse): GradeOutcome {
    const grader = this.registry.get(exercise.kind);
    if (!grader) {
      throw new Error(`no grader registered for exercise kind: ${exercise.kind}`);
    }
    if (response.kind !== exercise.kind) {
      throw new Error(`response kind ${response.kind} does not match ${exercise.kind}`);
    }
    return grader.grade(exercise as never, response);
  }

  gradeLesson(
    lesson: Lesson,
    responses: Record<string, ExerciseResponse>,
    options: GradeOptions = {},
  ): LessonGrade {
    const perExercise: Record<string, GradeOutcome> = {};
    const pending: string[] = [];
    let earned = 0;
    let available = 0;

    for (const exercise of lesson.exercises) {
      if (!isAsked(exercise, options)) continue;
      if (!this.canGrade(exercise)) {
        pending.push(exercise.id);
        continue;
      }
      available += exercise.points;
      const response = responses[exercise.id];
      if (!response) {
        perExercise[exercise.id] = {
          fraction: 0,
          correct: false,
          feedback: 'Not answered yet.',
        };
        continue;
      }
      let outcome = this.gradeOne(exercise, response);
      if (exercise.kind === 'sandbox' && options.puzzleMode === 'gentle' && !outcome.correct) {
        outcome = { fraction: 1, correct: true, feedback: `${outcome.feedback} That go counts.` };
      }
      perExercise[exercise.id] = outcome;
      earned += outcome.fraction * exercise.points;
    }

    return {
      // With nothing gradeable at all, treat the lesson as passable rather than
      // stranding the learner behind it.
      score: available === 0 ? 1 : earned / available,
      earned,
      available,
      perExercise,
      pending,
    };
  }
}
