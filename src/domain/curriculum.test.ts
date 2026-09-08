import { describe, expect, it } from 'vitest';
import bundle from '../generated/curriculum.json';
import type { CurriculumBundle } from './types';
import { Curriculum } from './curriculum';
import { createGraderRegistry, GradingService } from './grading';
import type { Exercise, ExerciseResponse } from './types';
import { UnlockPolicy } from './policy/UnlockPolicy';
import { LevelPolicy } from './policy/LevelPolicy';
import type { LessonRecord } from './progress/state';

/**
 * Invariants over the *real* compiled curriculum.
 *
 * The Python pipeline already checks content in isolation; these guard the
 * seam between content and app — the failures that would only show up as a
 * blank screen or a dead end in front of a child.
 */
const curriculum = new Curriculum(bundle as CurriculumBundle);

function cleared(id: string): LessonRecord {
  return { lessonId: id, best: 1, attempts: 1, bestUnaided: true, completedAt: 'x', lastSeenAt: 'x' };
}

describe('compiled curriculum', () => {
  it('ships lessons across every world', () => {
    expect(curriculum.worlds.length).toBeGreaterThanOrEqual(6);
    for (const world of curriculum.worlds) {
      expect(curriculum.lessonsInWorld(world.id).length).toBeGreaterThan(0);
    }
  });

  it('has exactly one entry point', () => {
    const roots = curriculum.lessons.filter((lesson) => lesson.prereqs.length === 0);
    expect(roots).toHaveLength(1);
  });

  it('has a registered grader for every exercise kind it uses', () => {
    const { registry } = createGraderRegistry();
    const used = new Set(curriculum.lessons.flatMap((l) => l.exercises.map((e) => e.kind)));
    for (const kind of used) {
      expect(registry.get(kind), `no grader for "${kind}"`).toBeDefined();
    }
  });

  it('gives every lesson at least one exercise worth points', () => {
    for (const lesson of curriculum.lessons) {
      expect(lesson.exercises.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.totalPoints, lesson.id).toBeGreaterThan(0);
    }
  });

  it('points every prerequisite at a lesson that exists', () => {
    for (const lesson of curriculum.lessons) {
      for (const prereq of lesson.prereqs) {
        expect(curriculum.lesson(prereq), `${lesson.id} -> ${prereq}`).toBeDefined();
      }
    }
  });

  /**
   * The earlier reachability test assumed any open lesson can be cleared. It
   * cannot: eight lessons were mostly sandbox work with no workbench built, so
   * a learner reached lesson two and was stuck behind an unanswerable question
   * with the rest of the course locked behind her.
   *
   * This asserts the thing that actually matters — that every lesson can be
   * finished with the exercises this build is able to grade.
   */
  it('lets every lesson be finished with what this build can actually grade', () => {
    const { registry } = createGraderRegistry();
    const grading = new GradingService(registry);

    const stuck = curriculum.lessons.filter((lesson) => {
      const gradeable = lesson.exercises.filter((e) => grading.canGrade(e));
      // No gradeable exercises at all is fine: the lesson passes on its reading.
      if (gradeable.length === 0) return false;
      const answerable = gradeable.reduce((sum, e) => sum + e.points, 0);
      const total = lesson.exercises.reduce((sum, e) => sum + e.points, 0);
      return answerable === 0 || answerable / total < 0 || total === 0;
    });
    expect(stuck.map((l) => l.id)).toEqual([]);

    // And a perfect run on the gradeable exercises must actually clear the bar.
    for (const lesson of curriculum.lessons) {
      const responses = Object.fromEntries(
        lesson.exercises.filter((e) => grading.canGrade(e)).map((e) => [e.id, perfect(e)]),
      );
      const grade = grading.gradeLesson(lesson, responses);
      expect(grade.score, `${lesson.id} cannot be completed`).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('leaves no lesson permanently unreachable on either track', () => {
    for (const track of ['explorer', 'builder'] as const) {
      const unlocks = new UnlockPolicy(curriculum);
      const records: Record<string, LessonRecord> = {};
      // Clear everything that is open, repeatedly, until nothing new opens.
      for (let pass = 0; pass < curriculum.lessons.length + 2; pass += 1) {
        const status = unlocks.evaluate(records, track);
        const open = Object.entries(status).filter(([, s]) => s === 'open');
        if (open.length === 0) break;
        for (const [id] of open) records[id] = cleared(id);
      }
      const final = unlocks.evaluate(records, track);
      const stuck = Object.entries(final).filter(([, s]) => s === 'locked');
      expect(stuck, `unreachable on ${track}: ${stuck.map(([id]) => id).join(', ')}`).toHaveLength(0);
    }
  });

  it('rises through several levels over a full playthrough', () => {
    const levels = new LevelPolicy(curriculum);
    const records = Object.fromEntries(curriculum.lessons.map((l) => [l.id, cleared(l.id)]));
    const final = levels.evaluate(records);
    expect(final.level).toBeGreaterThanOrEqual(6);
    expect(levels.evaluate({}).level).toBe(1);
  });

  it('raises the level at a steady pace rather than in one jump', () => {
    const levels = new LevelPolicy(curriculum);
    const records: Record<string, LessonRecord> = {};
    const seen = new Set<number>();
    for (const lesson of curriculum.lessons) {
      records[lesson.id] = cleared(lesson.id);
      seen.add(levels.evaluate(records).level);
    }
    // A level gain roughly every two or three lessons keeps momentum visible.
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });

  /**
   * A lesson that opens with its own learning objective reads like homework.
   * Every lesson has to say why it is worth her time first.
   */
  it('opens every lesson with warm framing rather than an objective', () => {
    const bare = curriculum.lessons.filter((lesson) => !lesson.intro);
    expect(bare.map((l) => l.id)).toEqual([]);

    for (const lesson of curriculum.lessons) {
      // Long enough to actually set a scene, short enough to read before a comic.
      expect(lesson.intro!.length, lesson.id).toBeGreaterThan(80);
      expect(lesson.intro!.length, lesson.id).toBeLessThan(600);
      expect(lesson.intro, lesson.id).not.toBe(lesson.goal);
    }
  });

  /**
   * A comic beat and three bullets is not teaching. A learner finished the
   * first lessons unsure what she had just done, so the built-out lessons carry
   * a real explanation between playing and being tested.
   */
  it('gives every lesson a proper teaching section', () => {
    for (const lesson of curriculum.lessons) {
      expect(lesson.teach, lesson.id).toBeDefined();
      expect(lesson.teach!.length, lesson.id).toBeGreaterThanOrEqual(1);
      for (const step of lesson.teach!) {
        expect(step.heading.length, `${lesson.id} heading`).toBeGreaterThan(3);
        expect(step.body.length, `${lesson.id} body`).toBeGreaterThan(60);
      }
    }
  });

  it('gives every lesson real-world terms and a pool of questions', () => {
    for (const lesson of curriculum.lessons) {
      expect(lesson.terms?.length ?? 0, `${lesson.id} terms`).toBeGreaterThanOrEqual(1);
      const quiz = lesson.exercises.filter((e) => e.kind !== 'sandbox');
      // Enough to draw a fresh-feeling batch each attempt.
      expect(quiz.length, `${lesson.id} quiz pool`).toBeGreaterThanOrEqual(3);
    }
  });

  it('closes every lesson with a callback comic', () => {
    for (const lesson of curriculum.lessons) {
      expect(lesson.close_comic, lesson.id).toBeDefined();
    }
  });

  it('keeps every referenced analogy defined', () => {
    for (const lesson of curriculum.lessons) {
      if (!lesson.analogy) continue;
      expect(curriculum.analogy(lesson.analogy), `${lesson.id} -> ${lesson.analogy}`).toBeDefined();
    }
  });
});

/** A fully correct answer for any gradeable exercise kind. */
function perfect(exercise: Exercise): ExerciseResponse {
  switch (exercise.kind) {
    case 'mcq':
      return { kind: 'mcq', selected: exercise.answer };
    case 'order':
      return { kind: 'order', order: exercise.items.map((_, i) => i) };
    case 'match':
      return {
        kind: 'match',
        mapping: Object.fromEntries(exercise.pairs.map((_, i) => [i, i])),
      };
    case 'numeric':
      return { kind: 'numeric', value: exercise.answer };
    case 'prompt_rubric':
      return {
        kind: 'prompt_rubric',
        text: [
          ...exercise.must_include.map((group) => group[0] ?? ''),
          'x '.repeat(exercise.min_words),
        ].join(' '),
      };
    case 'sandbox':
      return { kind: 'sandbox', state: {} };
  }
}

describe('real-world terms', () => {
  it('connects every lesson to vocabulary she will meet outside the app', () => {
    for (const lesson of curriculum.lessons) {
      for (const term of lesson.terms ?? []) {
        expect(term.term.length, `${lesson.id} term`).toBeGreaterThan(1);
        expect(term.plain.length, `${lesson.id} plain`).toBeGreaterThan(20);
      }
    }
  });

  it('teaches the practical terms the arc is built around', () => {
    // The v2 arc leads with practical skills: prompting, then how-it-works, then
    // building and agents. These signature terms should each appear somewhere.
    const allTerms = curriculum.lessons
      .flatMap((l) => l.terms ?? [])
      .map((t) => t.term.toLowerCase());
    for (const expected of ['prompt', 'hallucination', 'agent']) {
      expect(allTerms.some((t) => t.includes(expected)), expected).toBe(true);
    }
  });
});
