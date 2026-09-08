import type { ExerciseKind } from '../types';
import type { IGrader } from './IGrader';

export class GraderRegistry {
  private readonly graders = new Map<ExerciseKind, IGrader>();

  register(grader: IGrader): this {
    this.graders.set(grader.kind, grader as IGrader);
    return this;
  }

  get(kind: ExerciseKind): IGrader | undefined {
    return this.graders.get(kind);
  }

  /** Used by a build-time check: every exercise kind in the bundle must have
   *  a grader, so content can never ship an ungradeable exercise. */
  kinds(): ExerciseKind[] {
    return [...this.graders.keys()];
  }
}
