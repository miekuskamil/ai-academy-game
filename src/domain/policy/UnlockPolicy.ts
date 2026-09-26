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

  /**
   * @param hiddenWorlds worlds a grown-up has put away. A prerequisite inside a
   *   hidden world does not block: it counts as met once its own prerequisites
   *   are met, so hiding World 3 lets World 4 open straight after World 2.
   */
  evaluate(
    records: Record<string, LessonRecord>,
    track: TrackId,
    hiddenWorlds: readonly string[] = [],
  ): StatusMap {
    const hidden = new Set(hiddenWorlds);
    const met = (id: string, depth = 0): boolean => {
      if (UnlockPolicy.isCleared(records[id])) return true;
      const prereq = this.curriculum.lesson(id);
      if (!prereq || depth > 64 || !hidden.has(prereq.world)) return false;
      return prereq.prereqs.every((p) => met(p, depth + 1));
    };

    const status: StatusMap = {};
    for (const lesson of this.curriculum.forTrack(track)) {
      const earned = UnlockPolicy.statusOf(records[lesson.id]);
      if (earned) {
        status[lesson.id] = earned;
        continue;
      }
      const open = lesson.prereqs.every((id) => met(id));
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
