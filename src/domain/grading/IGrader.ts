import type { Exercise, ExerciseKind, ExerciseResponse } from '../types';

export interface GradeOutcome {
  /** 0..1 of this exercise's points. Partial credit is encouraged. */
  fraction: number;
  correct: boolean;
  /** Learner-facing, specific, never scolding. */
  feedback: string;
  /** Indices or keys the UI should mark as wrong, when meaningful. */
  wrong?: number[];
}

/**
 * The open/closed seam of the whole app.
 *
 * New exercise types register a grader; the lesson player never changes. Every
 * grader is deterministic and runs offline — a language model is an optional
 * enrichment, never a dependency, so grading stays instant, free and
 * reproducible. A child gets the same score for the same answer, always.
 */
export interface IGrader<K extends ExerciseKind = ExerciseKind> {
  readonly kind: K;
  grade(exercise: Extract<Exercise, { kind: K }>, response: ExerciseResponse): GradeOutcome;
  /**
   * Whether this specific exercise can be graded in this build.
   *
   * A sandbox exercise whose workbench has not been built yet must be excluded
   * from the lesson's available points rather than scored as zero — otherwise a
   * lesson made mostly of sandbox work is impossible to finish, and everything
   * behind it stays locked forever. Defaults to true.
   */
  supports?(exercise: Extract<Exercise, { kind: K }>): boolean;
}
