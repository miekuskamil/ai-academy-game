import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RewardSplash } from './RewardSplash';
import type { BadgeSpec } from '../domain/pipeline/blocks';

describe('RewardSplash', () => {
  it('announces the new part and points at the strip', () => {
    render(<RewardSplash partIndex={3} badge={null} onDone={() => {}} />);
    expect(screen.getByRole('dialog', { name: /new part/i })).toBeInTheDocument();
    expect(screen.getByText(/part 4 of your machine/i)).toBeInTheDocument();
    // No badge this time, so the button is the plain celebration.
    expect(screen.getByRole('button', { name: /nice/i })).toBeInTheDocument();
  });

  it('shows the badge when a world was completed', () => {
    const badge: BadgeSpec = { id: 'b', name: 'Prompt Scroll', earnedFor: 'Learning to prompt.' };
    render(<RewardSplash partIndex={11} badge={badge} onDone={() => {}} />);
    expect(screen.getByText(/badge earned: prompt scroll/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /brilliant/i })).toBeInTheDocument();
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
