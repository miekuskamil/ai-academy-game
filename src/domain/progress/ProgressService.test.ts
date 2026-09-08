import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressService } from './ProgressService';
import { MemoryStore } from './MemoryStore';
import { UnlockPolicy } from '../policy/UnlockPolicy';
import { LevelPolicy } from '../policy/LevelPolicy';
import { EventBus } from '../events';
import { testCurriculum } from '../../test/factory';

function build() {
  const curriculum = testCurriculum();
  const store = new MemoryStore();
  const bus = new EventBus();
  const service = new ProgressService(
    store,
    curriculum,
    new UnlockPolicy(curriculum),
    new LevelPolicy(curriculum),
    bus,
    () => '2026-01-01T00:00:00.000Z',
  );
  return { service, store, bus };
}

describe('ProgressService', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(() => {
    ctx = build();
  });

  it('starts a new learner on the explorer track with nothing recorded', () => {
    const { state, level } = ctx.service.snapshot();
    expect(state.track).toBe('explorer');
    expect(state.records).toEqual({});
    expect(level.level).toBe(1);
  });

  it('records an attempt and persists it', () => {
    ctx.service.record({ lessonId: 'a', score: 0.8, usedHints: false });
    expect(ctx.store.load()?.records.a?.best).toBe(0.8);
  });

  it('never lowers a score on a retry', () => {
    ctx.service.record({ lessonId: 'a', score: 0.9, usedHints: false });
    const after = ctx.service.record({ lessonId: 'a', score: 0.2, usedHints: false });
    expect(after.state.records.a?.best).toBe(0.9);
    expect(after.state.records.a?.attempts).toBe(2);
  });

  it('keeps unaided status tied to the best attempt', () => {
    ctx.service.record({ lessonId: 'a', score: 0.95, usedHints: true });
    expect(ctx.service.snapshot().status.a).toBe('completed');
    ctx.service.record({ lessonId: 'a', score: 1, usedHints: false });
    expect(ctx.service.snapshot().status.a).toBe('mastered');
  });

  it('emits completion, unlock and level events from one attempt', () => {
    const completed = vi.fn();
    const unlocked = vi.fn();
    const levelled = vi.fn();
    ctx.bus.on('lesson:completed', completed);
    ctx.bus.on('lesson:unlocked', unlocked);
    ctx.bus.on('level:gained', levelled);

    ctx.service.record({ lessonId: 'a', score: 1, usedHints: false });

    expect(completed).toHaveBeenCalledWith({ lessonId: 'a' });
    expect(unlocked).toHaveBeenCalledWith({ lessonId: 'b' });
    // 1 point is below the level-2 threshold of 2, so no level yet.
    expect(levelled).not.toHaveBeenCalled();

    ctx.service.record({ lessonId: 'b', score: 1, usedHints: false });
    // a(1) + b(2) = 3 points, which clears the level-2 threshold of 2.
    expect(levelled).toHaveBeenCalledWith({ from: 1, to: 2 });
  });

  it('does not re-emit completion for a lesson already cleared', () => {
    const completed = vi.fn();
    ctx.bus.on('lesson:completed', completed);
    ctx.service.record({ lessonId: 'a', score: 0.7, usedHints: false });
    ctx.service.record({ lessonId: 'a', score: 0.9, usedHints: false });
    expect(completed).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown lesson id rather than recording a ghost', () => {
    expect(() => ctx.service.record({ lessonId: 'nope', score: 1, usedHints: false })).toThrow();
  });

  it('clamps scores outside 0..1', () => {
    ctx.service.record({ lessonId: 'a', score: 4, usedHints: false });
    expect(ctx.service.snapshot().state.records.a?.best).toBe(1);
  });

  it('round-trips through export and import', () => {
    ctx.service.record({ lessonId: 'a', score: 1, usedHints: false });
    const backup = ctx.service.export();

    const fresh = build();
    expect(fresh.service.import(backup)).toBe(true);
    expect(fresh.service.snapshot().state.records.a?.best).toBe(1);
  });

  it('refuses a corrupt backup without touching existing progress', () => {
    ctx.service.record({ lessonId: 'a', score: 1, usedHints: false });
    expect(ctx.service.import('not json')).toBe(false);
    expect(ctx.service.import('{"v":99}')).toBe(false);
    expect(ctx.service.snapshot().state.records.a?.best).toBe(1);
  });

  it('drops imported records for lessons this build no longer has', () => {
    const backup = JSON.stringify({
      v: 1,
      track: 'explorer',
      learnerName: null,
      companionName: 'Iskra',
      records: {
        a: { lessonId: 'a', best: 1, attempts: 1, bestUnaided: true, completedAt: null, lastSeenAt: 'x' },
        removed: {
          lessonId: 'removed',
          best: 1,
          attempts: 1,
          bestUnaided: true,
          completedAt: null,
          lastSeenAt: 'x',
        },
      },
      createdAt: 'x',
      updatedAt: 'x',
    });
    expect(ctx.service.import(backup)).toBe(true);
    const state = ctx.service.snapshot().state;
    expect(state.records.a).toBeDefined();
    expect(state.records.removed).toBeUndefined();
  });

  it('resets to an empty profile but keeps the chosen track', () => {
    ctx.service.setTrack('builder');
    ctx.service.record({ lessonId: 'a', score: 1, usedHints: false });
    const after = ctx.service.reset();
    expect(after.state.records).toEqual({});
    expect(after.state.track).toBe('builder');
  });
});
