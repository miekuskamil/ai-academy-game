import type { Curriculum } from '../curriculum';
import type { LessonRecord } from '../progress/state';
import { UnlockPolicy } from './UnlockPolicy';

export interface LevelState {
  level: number;
  points: number;
  /** Points needed to have reached the current level. */
  floor: number;
  /** Points needed for the next level, or null at the cap. */
  next: number | null;
  /** 0..1 through the current level; 1 at the cap. */
  fraction: number;
}

/**
 * Level is a *derived* reading of the same records the map uses, never a stored
 * counter. Two sources of truth is how progression systems rot: a corrupt save
 * cannot inflate a level that is recomputed on every read, and export/import
 * has nothing to desynchronise.
 *
 * Deeper lessons are worth more (`weight = 1 + depth`), so points track real
 * conceptual ground covered rather than lessons ticked off.
 */
export class LevelPolicy {
  constructor(private readonly curriculum: Curriculum) {}

  points(records: Record<string, LessonRecord>): number {
    let total = 0;
    for (const lesson of this.curriculum.lessons) {
      if (UnlockPolicy.isCleared(records[lesson.id])) total += lesson.weight;
    }
    return total;
  }

  evaluate(records: Record<string, LessonRecord>): LevelState {
    return this.fromPoints(this.points(records));
  }

  fromPoints(points: number): LevelState {
    const thresholds = this.curriculum.levelThresholds;
    let level = 1;
    for (let i = 0; i < thresholds.length; i += 1) {
      if (points >= (thresholds[i] ?? Infinity)) level = i + 1;
      else break;
    }
    const floor = thresholds[level - 1] ?? 0;
    const next = level < thresholds.length ? (thresholds[level] ?? null) : null;
    const span = next === null ? 0 : next - floor;
    const fraction = span <= 0 ? 1 : Math.min(1, (points - floor) / span);
    return { level, points, floor, next, fraction };
  }

  /** Level bands pace the story: new chapters and companion stages. */
  chapterFor(level: number): number {
    if (level >= 12) return 5;
    if (level >= 9) return 4;
    if (level >= 6) return 3;
    if (level >= 3) return 2;
    return 1;
  }
}
