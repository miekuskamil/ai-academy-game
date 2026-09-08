import type { EventBus } from '../events';
import type { Curriculum } from '../curriculum';
import type { TrackId } from '../types';
import type { LevelPolicy, LevelState } from '../policy/LevelPolicy';
import type { StatusMap } from '../policy/UnlockPolicy';
import { UnlockPolicy } from '../policy/UnlockPolicy';
import type { IProgressStore } from './IProgressStore';
import { COMPLETE_AT, MASTER_AT, emptyProgress, type LessonRecord, type ProgressState } from './state';
import { isProgressState, migrate } from './migrations';

export interface AttemptInput {
  lessonId: string;
  /** Fraction of the lesson's available points, 0..1. */
  score: number;
  usedHints: boolean;
}

export interface ProgressSnapshot {
  state: ProgressState;
  status: StatusMap;
  level: LevelState;
}

/**
 * Records what happened and persists it. It does not decide what that means —
 * UnlockPolicy and LevelPolicy do, from the same records.
 */
export class ProgressService {
  private state: ProgressState;

  constructor(
    private readonly store: IProgressStore,
    private readonly curriculum: Curriculum,
    private readonly unlocks: UnlockPolicy,
    private readonly levels: LevelPolicy,
    private readonly bus: EventBus,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    this.state = store.load() ?? emptyProgress(this.now());
  }

  snapshot(): ProgressSnapshot {
    return {
      state: structuredClone(this.state),
      status: this.unlocks.evaluate(this.state.records, this.state.track),
      level: this.levels.evaluate(this.state.records),
    };
  }

  record(input: AttemptInput): ProgressSnapshot {
    const lesson = this.curriculum.requireLesson(input.lessonId);
    const score = clamp01(input.score);
    const timestamp = this.now();

    const beforeStatus = this.unlocks.evaluate(this.state.records, this.state.track);
    const beforeLevel = this.levels.evaluate(this.state.records);
    const beforeCleared = UnlockPolicy.isCleared(this.state.records[lesson.id]);
    const beforeMastered = beforeStatus[lesson.id] === 'mastered';

    const previous = this.state.records[lesson.id];
    const improved = !previous || score > previous.best;
    const next: LessonRecord = {
      lessonId: lesson.id,
      // A retry can only ever raise the score.
      best: previous ? Math.max(previous.best, score) : score,
      attempts: (previous?.attempts ?? 0) + 1,
      // Unaided status follows the best attempt, not the latest one.
      bestUnaided: improved ? !input.usedHints : (previous?.bestUnaided ?? false),
      completedAt:
        previous?.completedAt ?? (score >= COMPLETE_AT ? timestamp : null),
      lastSeenAt: timestamp,
    };

    this.state = {
      ...this.state,
      records: { ...this.state.records, [lesson.id]: next },
      updatedAt: timestamp,
    };
    this.store.save(this.state);

    const afterStatus = this.unlocks.evaluate(this.state.records, this.state.track);
    const afterLevel = this.levels.evaluate(this.state.records);

    this.bus.emit('attempt:recorded', {
      lessonId: lesson.id,
      score,
      usedHints: input.usedHints,
    });
    if (!beforeCleared && next.best >= COMPLETE_AT) {
      this.bus.emit('lesson:completed', { lessonId: lesson.id });
    }
    if (!beforeMastered && afterStatus[lesson.id] === 'mastered') {
      this.bus.emit('lesson:mastered', { lessonId: lesson.id });
    }
    for (const id of UnlockPolicy.newlyUnlocked(beforeStatus, afterStatus)) {
      this.bus.emit('lesson:unlocked', { lessonId: id });
    }
    if (afterLevel.level > beforeLevel.level) {
      this.bus.emit('level:gained', { from: beforeLevel.level, to: afterLevel.level });
    }
    this.bus.emit('progress:changed', { reason: 'attempt' });

    return this.snapshot();
  }

  setTrack(track: TrackId): ProgressSnapshot {
    this.patch({ track });
    return this.snapshot();
  }

  setMotion(motion: import('./state').MotionPreference): ProgressSnapshot {
    this.patch({ motion });
    return this.snapshot();
  }

  /** Set or clear the grown-ups PIN. Pass null to remove the lock. */
  setPin(pin: string | null): ProgressSnapshot {
    this.patch({ pin: pin && /^\d{4}$/.test(pin) ? pin : null });
    return this.snapshot();
  }

  /** Show or hide a world on the map. Never touches saved progress. */
  setWorldHidden(worldId: string, hidden: boolean): ProgressSnapshot {
    const current = new Set(this.state.hiddenWorlds ?? []);
    if (hidden) current.add(worldId);
    else current.delete(worldId);
    this.patch({ hiddenWorlds: [...current] });
    return this.snapshot();
  }

  /** How much of the hands-on puzzle to expose. */
  setPuzzleMode(mode: import('./state').PuzzleMode): ProgressSnapshot {
    this.patch({ puzzleMode: mode });
    return this.snapshot();
  }

  /** Update the build-board project (theme, prompt, or example items). */
  setBuild(build: Partial<import('./state').BuildState>): ProgressSnapshot {
    const current = this.state.build ?? { theme: null, prompt: null, items: [], placed: [] };
    this.patch({ build: { ...current, ...build } });
    return this.snapshot();
  }

  /** Place an earned piece into the vault (the hands-on assembly step). */
  placePiece(index: number): ProgressSnapshot {
    const current = this.state.build ?? { theme: null, prompt: null, items: [], placed: [] };
    const placed = current.placed ?? [];
    if (!placed.includes(index)) {
      this.patch({ build: { ...current, placed: [...placed, index].sort((a, b) => a - b) } });
    }
    return this.snapshot();
  }

  setNames(learnerName: string | null, companionName?: string): ProgressSnapshot {
    this.patch({
      learnerName,
      ...(companionName ? { companionName } : {}),
    });
    return this.snapshot();
  }

  reset(): ProgressSnapshot {
    this.state = emptyProgress(this.now(), this.state.track);
    this.store.save(this.state);
    this.bus.emit('progress:changed', { reason: 'reset' });
    return this.snapshot();
  }

  /** Backup file. This is the only way progress leaves the device. */
  export(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /** Returns false and changes nothing if the file is not usable. */
  import(raw: string): boolean {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return false;
    }
    const migrated = migrate(parsed, this.now());
    if (!migrated || !isProgressState(migrated)) return false;
    // Drop records for lessons this build no longer has.
    const records: Record<string, LessonRecord> = {};
    for (const [id, record] of Object.entries(migrated.records)) {
      if (this.curriculum.lesson(id)) records[id] = record;
    }
    this.state = { ...migrated, records, updatedAt: this.now() };
    this.store.save(this.state);
    this.bus.emit('progress:changed', { reason: 'import' });
    return true;
  }

  private patch(partial: Partial<ProgressState>): void {
    this.state = { ...this.state, ...partial, updatedAt: this.now() };
    this.store.save(this.state);
    this.bus.emit('progress:changed', { reason: 'settings' });
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export { COMPLETE_AT, MASTER_AT };
