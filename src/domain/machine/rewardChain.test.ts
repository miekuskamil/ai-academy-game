import { describe, expect, it } from 'vitest';
import { createContainer } from '../container';
import { MemoryStore } from '../progress/MemoryStore';

/**
 * The reward chain, end to end — the thing that must never silently fail:
 * finish a lesson -> earn a part -> place it -> at 20/20 the vault opens.
 */
describe('reward chain (full playthrough)', () => {
  it('earns exactly one part per cleared lesson, and never for a half lesson', () => {
    const c = createContainer({ store: new MemoryStore() });
    const lessons = c.curriculum.lessons;

    // A half-done lesson (below the 0.6 clear bar) earns nothing.
    c.progress.record({ lessonId: lessons[0]!.id, score: 0.4, usedHints: false });
    expect(c.machine.evaluate(c.progress.snapshot().state.records).built).toBe(0);

    // Clearing it (>= 0.6) earns exactly one part.
    c.progress.record({ lessonId: lessons[0]!.id, score: 0.8, usedHints: false });
    expect(c.machine.evaluate(c.progress.snapshot().state.records).built).toBe(1);
  });

  it('reaches 20 earned and opens the vault only when all 20 are placed', () => {
    const c = createContainer({ store: new MemoryStore() });
    const lessons = c.curriculum.lessons;
    expect(lessons.length).toBe(20);

    // Clear every lesson.
    for (const l of lessons) {
      c.progress.record({ lessonId: l.id, score: 1, usedHints: false });
    }
    let records = c.progress.snapshot().state.records;
    expect(c.machine.evaluate(records).built).toBe(20);

    // All earned, but nothing placed yet: vault stays shut.
    let v = c.machine.vault(records, []);
    expect(v.earned).toBe(20);
    expect(v.open).toBe(false);

    // Place each earned piece, in order.
    const placed: number[] = [];
    let guard = 0;
    while (true) {
      records = c.progress.snapshot().state.records;
      const next = c.machine.vault(records, placed).next;
      if (!next || guard++ > 40) break;
      placed.push(next.index);
    }

    v = c.machine.vault(records, placed);
    expect(v.placedCount).toBe(20);
    expect(v.open).toBe(true); // the payoff fires
  });

  it('a tampered/corrupt save cannot open the vault without real clears', () => {
    const c = createContainer({ store: new MemoryStore() });
    // Claim all 20 placed, but no lessons actually cleared.
    const v = c.machine.vault({}, Array.from({ length: 20 }, (_, i) => i));
    expect(v.earned).toBe(0);
    expect(v.open).toBe(false); // earning is derived, not trusted
  });
});
