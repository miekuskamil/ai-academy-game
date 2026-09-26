import type { CurriculumBundle, Lesson, TrackId, World } from './types';

/**
 * A read-only index over the compiled bundle.
 *
 * Everything downstream (unlocks, levels, the map) asks questions of this
 * object rather than walking the raw JSON, so the shape of the bundle stays a
 * detail of one file.
 */
export class Curriculum {
  private readonly lessonById = new Map<string, Lesson>();
  private readonly worldById = new Map<string, World>();
  private readonly lessonsByWorld = new Map<string, Lesson[]>();

  constructor(private readonly bundle: CurriculumBundle) {
    for (const world of bundle.worlds) {
      this.worldById.set(world.id, world);
      this.lessonsByWorld.set(world.id, []);
    }
    for (const lesson of bundle.lessons) {
      this.lessonById.set(lesson.id, lesson);
      this.lessonsByWorld.get(lesson.world)?.push(lesson);
    }
  }

  get worlds(): World[] {
    return this.bundle.worlds;
  }

  get lessons(): Lesson[] {
    return this.bundle.lessons;
  }

  get levelThresholds(): number[] {
    return this.bundle.levels;
  }

  get totalWeight(): number {
    return this.bundle.totalWeight;
  }

  lesson(id: string): Lesson | undefined {
    return this.lessonById.get(id);
  }

  /** Throws if the id is unknown. Use where a missing lesson is a bug. */
  requireLesson(id: string): Lesson {
    const lesson = this.lessonById.get(id);
    if (!lesson) throw new Error(`unknown lesson: ${id}`);
    return lesson;
  }

  world(id: string): World | undefined {
    return this.worldById.get(id);
  }

  /** The next lesson she can start, skipping worlds a grown-up has hidden. */
  nextOpen(
    status: Record<string, string>,
    track: TrackId,
    hiddenWorlds: readonly string[] = [],
  ): Lesson | undefined {
    return this.forTrack(track).find(
      (lesson) => status[lesson.id] === 'open' && !hiddenWorlds.includes(lesson.world),
    );
  }

  lessonsInWorld(worldId: string): Lesson[] {
    return this.lessonsByWorld.get(worldId) ?? [];
  }

  forTrack(track: TrackId): Lesson[] {
    return this.bundle.lessons.filter((lesson) => lesson.tracks.includes(track));
  }

  analogy(id: string | undefined) {
    if (!id) return undefined;
    return this.bundle.analogies.find((item) => item.id === id);
  }

  /** The single lesson with no prerequisites. */
  opener(): Lesson {
    const first = this.bundle.lessons.find((lesson) => lesson.prereqs.length === 0);
    if (!first) throw new Error('curriculum has no entry point');
    return first;
  }
}
