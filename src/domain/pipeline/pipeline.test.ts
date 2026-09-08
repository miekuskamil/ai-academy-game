import { describe, expect, it } from 'vitest';
import { Curriculum } from '../curriculum';
import { PipelineService } from './PipelineService';
import { BLOCKS, THEMES, blockById, themeById } from './blocks';
import curriculum from '../../generated/curriculum.json';
import type { LessonRecord } from '../progress/state';

const c = new Curriculum(curriculum as never);
const service = new PipelineService(c);

/** Clears every lesson in the named worlds. */
function clearWorlds(...worldIds: string[]): Record<string, LessonRecord> {
  const records: Record<string, LessonRecord> = {};
  for (const worldId of worldIds) {
    for (const lesson of c.lessonsInWorld(worldId)) {
      records[lesson.id] = {
        lessonId: lesson.id,
        best: 1,
        attempts: 1,
        bestUnaided: true,
        completedAt: 't',
        lastSeenAt: 't',
      };
    }
  }
  return records;
}

describe('the build-board', () => {
  it('has one block per stage of a real pipeline, in order', () => {
    expect(BLOCKS.map((b) => b.id)).toEqual([
      'brief',
      'prompt',
      'model',
      'check',
      'agent',
      'result',
    ]);
    expect(BLOCKS.map((b) => b.order)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('gives every block a badge', () => {
    for (const block of BLOCKS) {
      expect(block.badge.name.length).toBeGreaterThan(0);
    }
  });

  it('starts with nothing unlocked', () => {
    const state = service.evaluate({});
    expect(state.blocks.every((b) => !b.unlocked)).toBe(true);
    expect(state.badges).toEqual([]);
    expect(state.complete).toBe(false);
  });

  it('unlocks a block only when its whole world is cleared', () => {
    // Half of World 1 is not enough.
    const firstLesson = c.lessonsInWorld('talking-to-ai')[0]!;
    const partial = {
      [firstLesson.id]: { lessonId: firstLesson.id, best: 1, attempts: 1, bestUnaided: true, completedAt: 't', lastSeenAt: 't' },
    };
    expect(service.evaluate(partial).blocks[0]!.unlocked).toBe(false);

    // The whole world clears it.
    const full = clearWorlds('talking-to-ai');
    const brief = service.evaluate(full).blocks.find((b) => b.spec.id === 'brief')!;
    expect(brief.unlocked).toBe(true);
  });

  it('reports how far through the unlocking world she is', () => {
    const lessons = c.lessonsInWorld('talking-to-ai');
    const oneDone = {
      [lessons[0]!.id]: { lessonId: lessons[0]!.id, best: 1, attempts: 1, bestUnaided: true, completedAt: 't', lastSeenAt: 't' },
    };
    const brief = service.evaluate(oneDone).blocks[0]!;
    expect(brief.worldProgress).toBeCloseTo(1 / lessons.length, 5);
  });

  it('hands out the badge when the block unlocks', () => {
    const state = service.evaluate(clearWorlds('talking-to-ai'));
    expect(state.badges.map((b) => b.id)).toContain('badge-brief');
  });

  it('is complete only when every world is cleared', () => {
    const allWorlds = c.worlds.map((w) => w.id);
    const state = service.evaluate(clearWorlds(...allWorlds));
    expect(state.complete).toBe(true);
    // Six blocks, but agent and result share the last world, so six badges.
    expect(state.badges).toHaveLength(BLOCKS.length);
  });

  it('cannot be tricked into unlocking the prompt block before prompting is taught', () => {
    // Everything except the prompting world.
    const worlds = c.worlds.map((w) => w.id).filter((w) => w !== 'talking-to-ai');
    const prompt = service.evaluate(clearWorlds(...worlds)).blocks.find((b) => b.spec.id === 'prompt')!;
    expect(prompt.unlocked).toBe(false);
  });
});

describe('themes', () => {
  it('offers a short list, each with a brief and an item word', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(3);
    for (const theme of THEMES) {
      expect(theme.brief.length).toBeGreaterThan(20);
      expect(theme.item.length).toBeGreaterThan(0);
    }
  });

  it('looks up blocks and themes by id, and throws on nonsense', () => {
    expect(blockById('model').title).toBe('Model');
    expect(themeById('toys').name).toBe('Toy collection');
    expect(() => blockById('nope' as never)).toThrow();
    expect(() => themeById('nope' as never)).toThrow();
  });
});
