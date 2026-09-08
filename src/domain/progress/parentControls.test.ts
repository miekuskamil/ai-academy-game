import { describe, expect, it } from 'vitest';
import { createContainer } from '../container';
import { MemoryStore } from './MemoryStore';

function fresh() {
  return createContainer({ store: new MemoryStore() }).progress;
}

describe('parent controls', () => {
  it('sets and clears a 4-digit pin, rejecting bad input', () => {
    const p = fresh();
    expect(p.snapshot().state.pin ?? null).toBeNull();
    p.setPin('1234');
    expect(p.snapshot().state.pin).toBe('1234');
    p.setPin('abc'); // invalid → cleared
    expect(p.snapshot().state.pin ?? null).toBeNull();
    p.setPin('9999');
    p.setPin(null);
    expect(p.snapshot().state.pin ?? null).toBeNull();
  });

  it('hides and unhides a world without deleting progress', () => {
    const p = fresh();
    p.setWorldHidden('why-it-answers', true);
    expect(p.snapshot().state.hiddenWorlds).toContain('why-it-answers');
    p.setWorldHidden('why-it-answers', false);
    expect(p.snapshot().state.hiddenWorlds ?? []).not.toContain('why-it-answers');
  });

  it('sets the puzzle mode', () => {
    const p = fresh();
    p.setPuzzleMode('gentle');
    expect(p.snapshot().state.puzzleMode).toBe('gentle');
    p.setPuzzleMode('off');
    expect(p.snapshot().state.puzzleMode).toBe('off');
  });
});
