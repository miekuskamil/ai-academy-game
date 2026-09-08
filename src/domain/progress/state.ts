import type { TrackId } from '../types';

/** Bumped whenever the persisted shape changes. Drives migrations. */
export const PROGRESS_VERSION = 1;

export const COMPLETE_AT = 0.6;
export const MASTER_AT = 0.9;

export type LessonStatus = 'locked' | 'open' | 'completed' | 'mastered';

/** One lesson's history. Append-only in spirit: a retry never lowers a score. */
export interface LessonRecord {
  lessonId: string;
  /** Best fraction of available points ever scored, 0..1. */
  best: number;
  attempts: number;
  /** Whether the best-scoring attempt used no hints. Gates mastery only. */
  bestUnaided: boolean;
  completedAt: string | null;
  lastSeenAt: string;
}

/** 'auto' follows the device setting. 'full' overrides it on. */
export type MotionPreference = 'auto' | 'full' | 'off';

/** How much of the hands-on puzzle to expose. */
export type PuzzleMode = 'full' | 'gentle' | 'off';

export interface ProgressState {
  v: number;
  track: TrackId;
  /**
   * Android battery saver silently reports `prefers-reduced-motion: reduce`,
   * which switched the drawn comics off with no way to get them back. This lets
   * a parent turn them on regardless.
   */
  motion?: MotionPreference;
  /** Chosen display name. Never leaves the device. */
  learnerName: string | null;
  companionName: string;
  /**
   * Optional 4-digit lock for the grown-ups page. Null means no lock. Stored in
   * plain text on-device on purpose: it keeps a curious child out of settings,
   * not an attacker out of data (there is no data to steal — nothing is uploaded).
   */
  pin?: string | null;
  /**
   * World ids a grown-up has chosen to hide for now. Lets a parent gate the
   * harder building/agent worlds, or a topic they want to hold back. Hidden
   * worlds simply do not appear on the map; progress is never deleted.
   */
  hiddenWorlds?: string[];
  /**
   * Puzzle exposure. 'full' shows every sandbox; 'gentle' keeps them but lets a
   * miss still count so a stuck child is never blocked; 'off' skips the
   * hands-on sandbox step entirely and lets the lesson's questions carry it.
   */
  puzzleMode?: PuzzleMode;
  /** The build-board project: her chosen theme and edited prompt. Optional so
   *  old saves migrate cleanly; the picker sets it on first visit. */
  build?: BuildState;
  records: Record<string, LessonRecord>;
  createdAt: string;
  updatedAt: string;
}

/** Her project on the build-board. Prompt and examples are the only editable
 *  parts of the pipeline; everything else is fixed and derived. */
export interface BuildState {
  theme: string | null;
  /** Her edited prompt template. Null until she opens the prompt block. */
  prompt: string | null;
  /** The example items she runs through the pipeline. */
  items: string[];
  /**
   * Part indices she has actively placed into the vault. Earning a piece (by
   * finishing a lesson) is separate from placing it — placement is the hands-on
   * puzzle step, so this is stored rather than derived.
   */
  placed?: number[];
}

export function emptyBuild(): BuildState {
  return { theme: null, prompt: null, items: [], placed: [] };
}

export function emptyProgress(now: string, track: TrackId = 'explorer'): ProgressState {
  return {
    v: PROGRESS_VERSION,
    track,
    learnerName: null,
    companionName: 'Iskra',
    motion: 'auto',
    build: emptyBuild(),
    records: {},
    createdAt: now,
    updatedAt: now,
  };
}
