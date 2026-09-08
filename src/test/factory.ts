import type { CurriculumBundle, Lesson } from '../domain/types';
import { Curriculum } from '../domain/curriculum';

/** A tiny hand-built curriculum. Tests assert on policy behaviour, not on the
 *  real content, so authoring changes cannot break the domain suite. */
export function makeLesson(partial: Partial<Lesson> & Pick<Lesson, 'id'>): Lesson {
  return {
    world: 'w1',
    title: partial.id,
    goal: 'goal',
    tracks: ['explorer', 'builder'],
    prereqs: [],
    minutes: 5,
    open_comic: { id: `${partial.id}-open`, title: 'open', beats: [] },
    play: 'none',
    name_it: [],
    exercises: [],
    weight: 1,
    depth: 0,
    unlocks: [],
    totalPoints: 10,
    ...partial,
  };
}

/**
 *   a -> b -> c
 *        b -> d   (builder only)
 */
export function testBundle(): CurriculumBundle {
  return {
    version: 1,
    worlds: [{ id: 'w1', index: 1, title: 'World one', tagline: 'tagline', ink: 'blue' }],
    analogies: [],
    glossary: [],
    levels: [0, 2, 5, 9],
    totalWeight: 8,
    lessons: [
      makeLesson({ id: 'a', weight: 1, depth: 0, unlocks: ['b'] }),
      makeLesson({ id: 'b', weight: 2, depth: 1, prereqs: ['a'], unlocks: ['c', 'd'] }),
      makeLesson({ id: 'c', weight: 3, depth: 2, prereqs: ['b'] }),
      makeLesson({ id: 'd', weight: 2, depth: 2, prereqs: ['b'], tracks: ['builder'] }),
    ],
  };
}

export function testCurriculum(): Curriculum {
  return new Curriculum(testBundle());
}
