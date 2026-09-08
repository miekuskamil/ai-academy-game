import type { IGrader, GradeOutcome } from '../IGrader';
import type { SandboxExercise, ExerciseResponse, SandboxState } from '../../types';

export interface SandboxCheck {
  /** Matches `check` in the lesson YAML. */
  id: string;
  run(state: SandboxState, params: Record<string, number | string | boolean>): GradeOutcome;
}

/**
 * Grades what the learner *did* in an interactive sandbox — trained a
 * classifier that generalises, found the bias in a dataset, drove a loss curve
 * down. Checks are registered by the sandboxes themselves, so adding a sandbox
 * never touches this class.
 */
export class SandboxGrader implements IGrader<'sandbox'> {
  readonly kind = 'sandbox' as const;
  private readonly checks = new Map<string, SandboxCheck>();

  registerCheck(check: SandboxCheck): this {
    this.checks.set(check.id, check);
    return this;
  }

  hasCheck(id: string): boolean {
    return this.checks.has(id);
  }

  /** False until this sandbox's check is registered. */
  supports(exercise: SandboxExercise): boolean {
    return this.checks.has(exercise.check);
  }

  grade(exercise: SandboxExercise, response: ExerciseResponse): GradeOutcome {
    if (response.kind !== 'sandbox') throw new Error('sandbox grader got wrong response kind');
    const check = this.checks.get(exercise.check);
    if (!check) {
      // Loud in development, harmless for the learner: never block on a bug.
      throw new Error(`no sandbox check registered for "${exercise.check}"`);
    }
    return check.run(response.state, exercise.params);
  }
}
