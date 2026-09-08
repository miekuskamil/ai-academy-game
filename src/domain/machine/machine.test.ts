import { describe, expect, it } from 'vitest';
import { Curriculum } from '../curriculum';
import { MachineService, MACHINE_HINTS } from './MachineService';
import curriculum from '../../generated/curriculum.json';
import type { LessonRecord } from '../progress/state';

const c = new Curriculum(curriculum as never);
const machine = new MachineService(c);

function clearFirst(n: number): Record<string, LessonRecord> {
  const records: Record<string, LessonRecord> = {};
  const state = machine.evaluate({});
  for (let i = 0; i < n; i += 1) {
    const part = state.parts[i]!;
    records[part.lessonId] = {
      lessonId: part.lessonId,
      best: 1,
      attempts: 1,
      bestUnaided: true,
      completedAt: 't',
      lastSeenAt: 't',
    };
  }
  return records;
}

describe('the machine', () => {
  it('has one part per lesson, in a fixed order', () => {
    expect(machine.total).toBe(20);
    const order = machine.evaluate({}).parts.map((p) => p.index);
    expect(order).toEqual([...Array(20).keys()]);
  });

  it('starts with nothing built', () => {
    const state = machine.evaluate({});
    expect(state.built).toBe(0);
    expect(state.complete).toBe(false);
    expect(state.hint).toBeNull();
  });

  it('builds one part for each lesson cleared', () => {
    expect(machine.evaluate(clearFirst(3)).built).toBe(3);
    expect(machine.evaluate(clearFirst(11)).built).toBe(11);
  });

  it('reveals hints as it fills, never before their threshold', () => {
    expect(machine.evaluate(clearFirst(1)).hint?.atParts).toBe(1);
    expect(machine.evaluate(clearFirst(6)).hint?.atParts).toBe(4);
    expect(machine.evaluate(clearFirst(20)).hint?.atParts).toBe(20);
  });

  it('completes only when every lesson is done', () => {
    expect(machine.evaluate(clearFirst(19)).complete).toBe(false);
    expect(machine.evaluate(clearFirst(20)).complete).toBe(true);
  });

  it('flags the just-built part only when the count grows', () => {
    // Growing from 2 to 3 flags index 2 (the third part).
    expect(machine.evaluate(clearFirst(3), 2).justBuilt).toBe(2);
    // Re-rendering at the same count flags nothing, so it animates once.
    expect(machine.evaluate(clearFirst(3), 3).justBuilt).toBeNull();
  });

  it('groups parts into subsystems that assemble in order', () => {
    const sections = machine.evaluate({}).parts.map((p) => p.section);
    // First parts are intake, last are hands — the machine builds front to back.
    expect(sections[0]).toBe('intake');
    // Under the v2 arc, the final world (agents) maps to the 'voice' subsystem.
    expect(sections[19]).toBe('voice');
    // The machine still assembles through several distinct subsystems.
    expect(new Set(sections).size).toBeGreaterThanOrEqual(3);
  });

  it('cannot show a part that was not earned', () => {
    // Clearing a late lesson without the early ones builds only that one.
    const parts = machine.evaluate({}).parts;
    const late = parts[15]!;
    const records = {
      [late.lessonId]: {
        lessonId: late.lessonId,
        best: 1,
        attempts: 1,
        bestUnaided: true,
        completedAt: 't',
        lastSeenAt: 't',
      },
    };
    const state = machine.evaluate(records);
    expect(state.built).toBe(1);
    expect(machine.isBuilt(15, records)).toBe(true);
    expect(machine.isBuilt(0, records)).toBe(false);
  });

  it('has hints covering the whole journey', () => {
    expect(MACHINE_HINTS[0]!.atParts).toBe(1);
    expect(MACHINE_HINTS[MACHINE_HINTS.length - 1]!.atParts).toBe(20);
  });
});

describe('the vault (active assembly)', () => {
  function clearN(n: number): Record<string, LessonRecord> {
    const records: Record<string, LessonRecord> = {};
    const state = machine.evaluate({});
    for (let i = 0; i < n; i += 1) {
      const part = state.parts[i]!;
      records[part.lessonId] = {
        lessonId: part.lessonId,
        best: 1,
        attempts: 1,
        bestUnaided: true,
        completedAt: 't',
        lastSeenAt: 't',
      };
    }
    return records;
  }

  it('separates earning a piece from placing it', () => {
    const v = machine.vault(clearN(3), []);
    expect(v.earned).toBe(3);
    expect(v.placedCount).toBe(0);
    expect(v.waiting).toHaveLength(3);
    expect(v.next?.index).toBe(0);
  });

  it('lets pieces be placed one at a time', () => {
    const records = clearN(3);
    const v = machine.vault(records, [0, 1]);
    expect(v.placedCount).toBe(2);
    expect(v.waiting).toHaveLength(1);
    expect(v.next?.index).toBe(2);
  });

  it('opens only when every piece is earned and placed', () => {
    const all = clearN(20);
    expect(machine.vault(all, [...Array(19).keys()]).open).toBe(false);
    expect(machine.vault(all, [...Array(20).keys()]).open).toBe(true);
  });

  it('does not open if pieces are earned but not placed', () => {
    expect(machine.vault(clearN(20), []).open).toBe(false);
  });

  it('reveals hints as pieces are placed, not merely earned', () => {
    const records = clearN(6);
    // Earned 6, placed only 1 → hint keyed to placed count.
    expect(machine.vault(records, [0]).hint?.atParts).toBe(1);
    expect(machine.vault(records, [0, 1, 2, 3]).hint?.atParts).toBe(4);
  });
});
