import type { Curriculum } from '../curriculum';
import type { TrackId } from '../types';
import { COMPLETE_AT, MASTER_AT, type LessonRecord, type LessonStatus } from '../progress/state';

export type StatusMap = Record<string, LessonStatus>;

/**
 * Decides what is open. Nothing else.
 *
 * Kept separate from ProgressService (which records) and LevelPolicy (which
 * scores) so all three read the same records without knowing about each other.
 */
export class UnlockPolicy {
  constructor(private readonly curriculum: Curriculum) {}

  static statusOf(record: LessonRecord | undefined): LessonStatus | null {
    if (!record) return null;
    if (record.best >= MASTER_AT && record.bestUnaided) return 'mastered';
    if (record.best >= COMPLETE_AT) return 'completed';
    return null;
  }

  /** True once a lesson counts as done — the bar for unlocking what follows. */
  static isCleared(record: LessonRecord | undefined): boolean {
    return !!record && record.best >= COMPLETE_AT;
  }

  evaluate(records: Record<string, LessonRecord>, track: TrackId): StatusMap {
    const status: StatusMap = {};
    for (const lesson of this.curriculum.forTrack(track)) {
      const earned = UnlockPolicy.statusOf(records[lesson.id]);
      if (earned) {
        status[lesson.id] = earned;
        continue;
      }
      // A prerequisite outside the current track cannot block: the track
      // filter is a pacing tool, not a wall.
      const open = lesson.prereqs.every((id) => UnlockPolicy.isCleared(records[id]));
      status[lesson.id] = open ? 'open' : 'locked';
    }
    return status;
  }

  /** Ids that became reachable between two evaluations. */
  static newlyUnlocked(before: StatusMap, after: StatusMap): string[] {
    return Object.keys(after).filter(
      (id) => after[id] === 'open' && (before[id] === 'locked' || before[id] === undefined),
    );
  }
}
