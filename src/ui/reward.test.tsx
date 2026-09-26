import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RewardSplash } from './RewardSplash';

describe('RewardSplash', () => {
  it('shows the earned piece and says where it went', () => {
    const { container } = render(<RewardSplash partIndex={3} onPlace={() => {}} onDone={() => {}} />);
    expect(screen.getByRole('dialog', { name: /you earned a puzzle piece/i })).toBeInTheDocument();
    expect(screen.getByText(/waiting in your vault/i)).toBeInTheDocument();
    // The real piece is drawn, clipped to its jigsaw shape.
    expect(container.querySelector('clipPath#reward-clip-3')).not.toBeNull();
    // Nothing about the old strip.
    expect(screen.queryByText(/strip/i)).toBeNull();
  });

  it('offers to take her straight to the vault, or later', async () => {
    const user = userEvent.setup();
    const onPlace = vi.fn();
    const onDone = vi.fn();
    render(<RewardSplash partIndex={0} onPlace={onPlace} onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: /place it now/i }));
    expect(onPlace).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: /later/i }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});


import { createContainer } from '../domain/container';
import { MemoryStore } from '../domain/progress/MemoryStore';
import { SANDBOX_CHECKS } from './sandboxes';

describe('earning a part at the end of a lesson', () => {
  it('produces a newly-built machine part the first time a lesson is cleared', () => {
    const container = createContainer({ store: new MemoryStore(), sandboxChecks: SANDBOX_CHECKS });
    const opener = container.curriculum.opener();

    // Before: nothing built.
    const before = container.machine.evaluate(container.progress.snapshot().state.records);
    expect(before.built).toBe(0);

    // Clearing the opener for the first time builds exactly one part — the thing
    // the reward splash celebrates. (The splash component itself is covered by
    // the unit tests above; this guards the earn-a-part mechanic behind it.)
    container.progress.record({ lessonId: opener.id, score: 1, usedHints: false });

    const after = container.machine.evaluate(
      container.progress.snapshot().state.records,
      before.built,
    );
    expect(after.built).toBe(1);
    expect(after.justBuilt).toBe(0);

    // Re-recording the same lesson does not build another part, so the splash
    // never re-fires on a retry.
    container.progress.record({ lessonId: opener.id, score: 1, usedHints: false });
    const retry = container.machine.evaluate(
      container.progress.snapshot().state.records,
      after.built,
    );
    expect(retry.built).toBe(1);
    expect(retry.justBuilt).toBeNull();
  });
});
