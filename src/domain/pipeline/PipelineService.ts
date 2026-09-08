import type { Curriculum } from '../curriculum';
import { UnlockPolicy } from '../policy/UnlockPolicy';
import type { LessonRecord } from '../progress/state';
import type { WorldId } from '../types';
import { BLOCKS, type BlockId, type BlockSpec, type BadgeSpec } from './blocks';

export interface BlockState {
  spec: BlockSpec;
  unlocked: boolean;
  /** How far through the unlocking world she is, 0..1 — drives the board fill. */
  worldProgress: number;
}

export interface PipelineState {
  blocks: BlockState[];
  /** Badges earned so far, in unlock order. */
  badges: BadgeSpec[];
  /** True once every block is in place. */
  complete: boolean;
}

/**
 * Turns raw lesson progress into the state of the build-board.
 *
 * Pure and derived, exactly like level and unlocks: a block is unlocked when
 * every lesson in its world is cleared. Nothing is stored — recomputed from the
 * same append-only records, so a corrupt save can never hand out a badge that
 * was not earned.
 */
export class PipelineService {
  constructor(private readonly curriculum: Curriculum) {}

  /** Whether every lesson in a world has been cleared. */
  private worldComplete(worldId: WorldId, records: Record<string, LessonRecord>): boolean {
    const lessons = this.curriculum.lessonsInWorld(worldId);
    if (lessons.length === 0) return false;
    return lessons.every((lesson) => UnlockPolicy.isCleared(records[lesson.id]));
  }

  /** Fraction of a world's lessons cleared, 0..1. */
  private worldProgress(worldId: WorldId, records: Record<string, LessonRecord>): number {
    const lessons = this.curriculum.lessonsInWorld(worldId);
    if (lessons.length === 0) return 0;
    const done = lessons.filter((lesson) => UnlockPolicy.isCleared(records[lesson.id])).length;
    return done / lessons.length;
  }

  evaluate(records: Record<string, LessonRecord>): PipelineState {
    const blocks: BlockState[] = BLOCKS.map((spec) => ({
      spec,
      unlocked: this.worldComplete(spec.unlockedBy, records),
      worldProgress: this.worldProgress(spec.unlockedBy, records),
    }));

    const badges = blocks.filter((b) => b.unlocked).map((b) => b.spec.badge);
    const complete = blocks.every((b) => b.unlocked);

    return { blocks, badges, complete };
  }

  /** The block a given world unlocks, if any — used to celebrate on completion. */
  blockForWorld(worldId: WorldId): BlockId | null {
    return BLOCKS.find((b) => b.unlockedBy === worldId)?.id ?? null;
  }
}
