import { describe, expect, it } from 'vitest';
import { createContainer } from '../../domain/container';
import { MemoryStore } from '../../domain/progress/MemoryStore';
import { SANDBOX_CHECKS } from '../sandboxes';

/**
 * The grown-ups' controls must change what the child actually experiences, not
 * just a label. These pin the behaviour behind each switch.
 */
function fresh() {
  return createContainer({ store: new MemoryStore(), sandboxChecks: SANDBOX_CHECKS });
}

function clear(c: ReturnType<typeof fresh>, ids: string[]) {
  for (const id of ids) c.progress.record({ lessonId: id, score: 1, usedHints: false });
}

describe('hiding a world', () => {
  it('lets the next world open without it, instead of blocking everything after', () => {
    const c = fresh();
    const w2 = c.curriculum.lessonsInWorld('why-it-answers');
    const w3 = c.curriculum.lessonsInWorld('using-ai-for-real');
    const w4first = c.curriculum.lessonsInWorld('whats-inside')[0]!;

    clear(c, [...c.curriculum.lessonsInWorld('talking-to-ai'), ...w2].map((l) => l.id));
    expect(c.progress.snapshot().status[w4first.id]).toBe('locked');

    c.progress.setWorldHidden('using-ai-for-real', true);
    expect(c.progress.snapshot().status[w4first.id]).toBe('open');
    // Nothing in the hidden world was marked done.
    for (const l of w3) expect(c.progress.snapshot().state.records[l.id]).toBeUndefined();
  });

  it('never offers a hidden lesson as the next one to start', () => {
    const c = fresh();
    clear(c, c.curriculum.lessonsInWorld('talking-to-ai').map((l) => l.id));
    c.progress.setWorldHidden('why-it-answers', true);
    const { status, state } = c.progress.snapshot();
    const next = c.curriculum.nextOpen(status, state.track, state.hiddenWorlds);
    expect(next?.world).toBe('using-ai-for-real');
  });

  it('keeps progress when a world is hidden and shown again', () => {
    const c = fresh();
    const w1 = c.curriculum.lessonsInWorld('talking-to-ai').map((l) => l.id);
    clear(c, w1);
    c.progress.setWorldHidden('talking-to-ai', true);
    c.progress.setWorldHidden('talking-to-ai', false);
    for (const id of w1) expect(c.progress.snapshot().status[id]).not.toBe('locked');
  });
});

describe('puzzle mode', () => {
  const c = fresh();
  const lesson = c.curriculum.lessons.find((l) => l.exercises.some((e) => e.kind === 'sandbox'))!;
  const sandbox = lesson.exercises.find((e) => e.kind === 'sandbox')!;
  const failedTry = { [sandbox.id]: { kind: 'sandbox' as const, state: {} } };

  it('full: a failed puzzle scores as failed', () => {
    const g = c.grading.gradeLesson(lesson, failedTry, { puzzleMode: 'full' });
    expect(g.perExercise[sandbox.id]!.correct).toBe(false);
  });

  it('gentle: any real try at a puzzle counts', () => {
    const g = c.grading.gradeLesson(lesson, failedTry, { puzzleMode: 'gentle' });
    expect(g.perExercise[sandbox.id]!.correct).toBe(true);
  });

  it('gentle: an untouched puzzle still does not count', () => {
    const g = c.grading.gradeLesson(lesson, {}, { puzzleMode: 'gentle' });
    expect(g.perExercise[sandbox.id]!.correct).toBe(false);
  });

  it('off: the puzzle is left out of the lesson and the score', () => {
    const full = c.grading.gradeLesson(lesson, {}, { puzzleMode: 'full' });
    const off = c.grading.gradeLesson(lesson, {}, { puzzleMode: 'off' });
    expect(off.perExercise[sandbox.id]).toBeUndefined();
    expect(off.available).toBe(full.available - sandbox.points);
  });
});
