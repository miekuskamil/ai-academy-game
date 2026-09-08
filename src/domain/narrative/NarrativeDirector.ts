import type { Curriculum } from '../curriculum';
import type { EventBus } from '../events';
import type { LevelPolicy } from '../policy/LevelPolicy';

/** Iskra's visible stage. The companion grows as the learner does, so
 *  progression is legible in the story and not only in the HUD. */
export type CompanionStage = 'spark' | 'flicker' | 'steady' | 'bright' | 'brilliant';

const STAGES: CompanionStage[] = ['spark', 'flicker', 'steady', 'bright', 'brilliant'];

export interface NarrativeMoment {
  id: string;
  kind: 'unlocked' | 'levelled' | 'mastered';
  headline: string;
  detail: string;
}

/**
 * Turns progress events into story beats.
 *
 * Subscribing to the same bus as unlocks and levels is what makes the
 * celebration land in the same frame as the mechanical change.
 */
export class NarrativeDirector {
  private pending: NarrativeMoment[] = [];
  private readonly unsubscribes: Array<() => void> = [];

  constructor(
    private readonly curriculum: Curriculum,
    private readonly levels: LevelPolicy,
    bus: EventBus,
    private readonly companionName: () => string,
  ) {
    this.unsubscribes.push(
      bus.on('lesson:unlocked', ({ lessonId }) => {
        const lesson = this.curriculum.lesson(lessonId);
        if (!lesson) return;
        this.pending.push({
          id: `unlocked:${lessonId}`,
          kind: 'unlocked',
          headline: 'New path open',
          detail: `${lesson.title} is ready when you are.`,
        });
      }),
      bus.on('lesson:mastered', ({ lessonId }) => {
        const lesson = this.curriculum.lesson(lessonId);
        if (!lesson) return;
        this.pending.push({
          id: `mastered:${lessonId}`,
          kind: 'mastered',
          headline: 'Mastered',
          detail: `${lesson.title}, with no hints.`,
        });
      }),
      bus.on('level:gained', ({ to }) => {
        this.pending.push({
          id: `level:${to}`,
          kind: 'levelled',
          headline: `Level ${to}`,
          detail: `${this.companionName()} is burning brighter.`,
        });
      }),
    );
  }

  stageFor(level: number): CompanionStage {
    const chapter = this.levels.chapterFor(level);
    return STAGES[Math.min(chapter, STAGES.length) - 1] ?? 'spark';
  }

  /** Drains the queue. The UI shows these once, in order. */
  take(): NarrativeMoment[] {
    const moments = this.pending;
    this.pending = [];
    return moments;
  }

  dispose(): void {
    for (const off of this.unsubscribes) off();
    this.unsubscribes.length = 0;
  }
}
