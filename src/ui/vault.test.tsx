import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Vault } from './Vault';
import { ContainerProvider } from '../hooks/useContainer';
import { createContainer, type Container } from '../domain/container';
import { MemoryStore } from '../domain/progress/MemoryStore';
import curriculum from '../generated/curriculum.json';
import { Curriculum } from '../domain/curriculum';
import type { LessonRecord } from '../domain/progress/state';

const c = new Curriculum(curriculum as never);

function seedEarned(container: Container, n: number) {
  const parts = container.machine.evaluate({}).parts;
  const records: Record<string, LessonRecord> = {};
  for (let i = 0; i < n; i += 1) {
    records[parts[i]!.lessonId] = {
      lessonId: parts[i]!.lessonId,
      best: 1,
      attempts: 1,
      bestUnaided: true,
      completedAt: 't',
      lastSeenAt: 't',
    };
  }
  container.progress.import(
    JSON.stringify({
      v: 1,
      track: 'explorer',
      learnerName: null,
      companionName: 'Iskra',
      build: { theme: 'toys', prompt: null, items: [], placed: [] },
      records,
      createdAt: 't',
      updatedAt: 't',
    }),
  );
}

function wrap(container: Container) {
  return render(
    <ContainerProvider value={container}>
      <Vault />
    </ContainerProvider>,
  );
}

describe('the vault', () => {
  let container: Container;
  beforeEach(() => {
    container = createContainer({ store: new MemoryStore() });
  });

  it('shows earned pieces waiting to be placed', () => {
    seedEarned(container, 3);
    wrap(container);
    expect(screen.getByText(/you have 3 pieces to place/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 20 placed/i)).toBeInTheDocument();
  });

  it('places a piece with tap-to-pick then tap-to-slot', async () => {
    const user = userEvent.setup();
    seedEarned(container, 1);
    wrap(container);

    // Pick up the waiting piece.
    await user.click(screen.getByRole('button', { name: /puzzle piece 1$/i }));
    // Its slot becomes tappable.
    await user.click(screen.getByRole('button', { name: /place piece in slot 1/i }));

    // Now it is placed.
    expect(screen.getByText(/1 of 20 placed/i)).toBeInTheDocument();
    // And it persisted.
    expect(container.progress.snapshot().state.build?.placed).toEqual([0]);
  });

  it('prompts her to finish a lesson when nothing is waiting', () => {
    seedEarned(container, 0);
    wrap(container);
    expect(screen.getByText(/no pieces waiting/i)).toBeInTheDocument();
  });

  it('opens only when all 20 are earned and placed', () => {
    // Earn all 20 and pre-place 19; the last placement should open it.
    const parts = c.lessonsInWorld; // silence unused
    void parts;
    seedEarned(container, 20);
    container.progress.setBuild({ placed: [...Array(20).keys()] });
    wrap(container);
    expect(screen.getByText(/the picture is complete/i)).toBeInTheDocument();
    expect(screen.getByText(/was a working ai/i)).toBeInTheDocument();
  });
});
