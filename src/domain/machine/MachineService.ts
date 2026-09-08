import type { Curriculum } from '../curriculum';
import { UnlockPolicy } from '../policy/UnlockPolicy';
import type { LessonRecord } from '../progress/state';

/**
 * The Machine.
 *
 * A mysterious contraption that builds itself, one part per lesson, and lives in
 * a strip that is always on screen. The learner does not start knowing what it
 * is — parts appear as sketchy, unlabelled shapes and only resolve as more of
 * them connect. Hints surface at milestones, and by the end she realises the
 * machine she assembled by learning is an AI pipeline: the very thing the course
 * was teaching. The reveal is the reward.
 *
 * This is pure domain: which parts exist, in what order, and which are built.
 * All drawing lives in the UI. Progress is derived from lesson records, exactly
 * like level and unlocks, so a part can never appear that was not earned.
 */

export type MachineSection = 'intake' | 'core' | 'dials' | 'voice' | 'hands';

export interface MachinePart {
  /** 0..19, the order it assembles in. */
  index: number;
  /** The lesson that builds it. */
  lessonId: string;
  /** Which subsystem it belongs to — used to group the reveal. */
  section: MachineSection;
  /** Shown only once the part is built and the learner taps it. */
  name: string;
}

/** Milestone hints, revealed as the machine fills. Keyed by parts-built count. */
export interface MachineHint {
  atParts: number;
  text: string;
}

export const MACHINE_HINTS: readonly MachineHint[] = [
  { atParts: 1, text: 'Something is starting to take shape. Keep going to see what it becomes.' },
  { atParts: 4, text: 'It has a mouth of some kind — a place where things go in.' },
  { atParts: 7, text: 'A core is forming behind the intake. This might be the part that thinks.' },
  { atParts: 11, text: 'Rows of little dials are wiring themselves into the core.' },
  { atParts: 14, text: 'It is growing a way to speak. Whatever this is, it answers back.' },
  { atParts: 18, text: 'Arms. It can reach out and do things now, not just talk.' },
  { atParts: 20, text: 'It is finished. You built an AI — the whole pipeline, one lesson at a time.' },
];

/** Which section each world contributes, in curriculum order. */
const WORLD_SECTION: Record<string, MachineSection> = {
  'talking-to-ai': 'intake',
  'why-it-answers': 'core',
  'using-ai-for-real': 'dials',
  'whats-inside': 'core',
  'building-with-ai': 'hands',
  'ai-that-does-things': 'voice',
};

export interface MachineState {
  parts: MachinePart[];
  /** How many are built, 0..20. */
  built: number;
  total: number;
  /** The most recent hint unlocked, if any. */
  hint: MachineHint | null;
  /** True the moment the last part is placed. */
  complete: boolean;
  /** The index just completed, for a one-shot assemble animation, or null. */
  justBuilt: number | null;
}

/**
 * The vault: the active-assembly view of progress.
 *
 * Earning a piece (finishing a lesson) is separate from placing it. `earned` is
 * how many she has unlocked; `placed` is how many she has actually slotted into
 * the vault herself. `waiting` is the earned-but-unplaced pieces she can still
 * click in. The vault opens only when every earned piece is placed AND all are
 * earned — the final turn of the key.
 */
export interface VaultState {
  earned: number;
  placedCount: number;
  total: number;
  /** Earned pieces not yet placed, in order — the ones she can slot next. */
  waiting: MachinePart[];
  /** The next piece to place, or null if none waiting. */
  next: MachinePart | null;
  /** Which slot indices are filled. */
  placedSet: Set<number>;
  /** True only when all pieces are earned and placed — the vault opens. */
  open: boolean;
  hint: MachineHint | null;
}

export class MachineService {
  private readonly order: MachinePart[];

  constructor(curriculum: Curriculum) {
    // Build the fixed part order: worlds in curriculum order, lessons within.
    this.order = [];
    let index = 0;
    for (const world of curriculum.worlds) {
      const section = WORLD_SECTION[world.id] ?? 'core';
      for (const lesson of curriculum.lessonsInWorld(world.id)) {
        this.order.push({ index, lessonId: lesson.id, section, name: partName(section, index) });
        index += 1;
      }
    }
  }

  get total(): number {
    return this.order.length;
  }

  /**
   * @param records lesson progress
   * @param previousBuilt the built-count from the last render, so we can flag
   *        the single part that just appeared for its assemble animation
   */
  evaluate(records: Record<string, LessonRecord>, previousBuilt = 0): MachineState {
    const builtFlags = this.order.map((part) => UnlockPolicy.isCleared(records[part.lessonId]));
    const built = builtFlags.filter(Boolean).length;

    const hint =
      [...MACHINE_HINTS].reverse().find((h) => built >= h.atParts) ?? null;

    // The just-built part is the highest built index, but only when the count
    // actually grew since last time — so it animates once, not on every render.
    let justBuilt: number | null = null;
    if (built > previousBuilt) {
      for (let i = builtFlags.length - 1; i >= 0; i -= 1) {
        if (builtFlags[i]) {
          justBuilt = i;
          break;
        }
      }
    }

    return {
      parts: this.order,
      built,
      total: this.order.length,
      hint,
      complete: built === this.order.length,
      justBuilt,
    };
  }

  /** Whether a given part index is built, for the given records. */
  isBuilt(index: number, records: Record<string, LessonRecord>): boolean {
    const part = this.order[index];
    return !!part && UnlockPolicy.isCleared(records[part.lessonId]);
  }

  /**
   * The vault: earned pieces, placed pieces, and what she can slot next.
   *
   * @param records lesson progress (drives what is earned)
   * @param placed  the indices she has actively placed into the vault
   */
  vault(records: Record<string, LessonRecord>, placed: number[]): VaultState {
    const placedSet = new Set(placed);
    const earnedFlags = this.order.map((part) => UnlockPolicy.isCleared(records[part.lessonId]));
    const earned = earnedFlags.filter(Boolean).length;

    // Earned but not yet placed, in assembly order.
    const waiting = this.order.filter(
      (part) => earnedFlags[part.index] && !placedSet.has(part.index),
    );

    const placedCount = this.order.filter((part) => placedSet.has(part.index)).length;
    const open = earned === this.order.length && placedCount === this.order.length;

    const hint =
      [...MACHINE_HINTS].reverse().find((h) => placedCount >= h.atParts) ?? null;

    return {
      earned,
      placedCount,
      total: this.order.length,
      waiting,
      next: waiting[0] ?? null,
      placedSet,
      open,
      hint,
    };
  }
}

/** A quiet, slightly mysterious name revealed when a built part is tapped. */
function partName(section: MachineSection, index: number): string {
  const names: Record<MachineSection, string[]> = {
    intake: ['the funnel', 'the sorter', 'the sampler', 'the filter', 'the feeder', 'the intake gate'],
    core: ['the reader', 'the map wheel', 'the guesser', 'the drum', 'the core casing'],
    dials: ['the dial bank', 'the balance arm', 'the tuner', 'the governor'],
    voice: ['the shaper', 'the mimic', 'the splitter', 'the checker', 'the speaker'],
    hands: ['the reacher', 'the tester', 'the hand'],
  };
  const list = names[section];
  return list[index % list.length] ?? 'a part';
}
