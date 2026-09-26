import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from '../../lib/router';
import { App } from '../../App';
import { ContainerProvider } from '../../hooks/useContainer';
import { createContainer, type Container } from '../../domain/container';
import { MemoryStore } from '../../domain/progress/MemoryStore';
import curriculum from '../../generated/curriculum.json';
import { Curriculum } from '../../domain/curriculum';
import type { LessonRecord } from '../../domain/progress/state';

const c = new Curriculum(curriculum as never);

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

function seed(container: Container, records: Record<string, LessonRecord>, build?: unknown) {
  container.progress.import(
    JSON.stringify({
      v: 1,
      track: 'explorer',
      learnerName: null,
      companionName: 'Iskra',
      build: build ?? { theme: null, prompt: null, items: [] },
      records,
      createdAt: 't',
      updatedAt: 't',
    }),
  );
}

function mountMachine(container: Container) {
  window.location.hash = '#/machine';
  return render(
    <ContainerProvider value={container}>
      <HashRouter>
        <App />
      </HashRouter>
    </ContainerProvider>,
  );
}

describe('the machine page', () => {
  let container: Container;
  beforeEach(() => {
    container = createContainer({ store: new MemoryStore() });
  });

  it('shows the assembling machine with nothing built at the start', () => {
    mountMachine(container);
    expect(screen.getByRole('heading', { name: /build the machine/i })).toBeInTheDocument();
    expect(screen.getAllByText(/0 of 20 placed/i).length).toBeGreaterThan(0);
  });

  it('never interrupts the jigsaw with a project picker mid-course', () => {
    // A whole world done used to swap the page for a picker; the vault stays.
    seed(container, clearWorlds('talking-to-ai'));
    mountMachine(container);
    expect(screen.getByRole('heading', { name: /build the machine/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /what should your ai make/i })).toBeNull();
    expect(screen.queryByRole('heading', { name: /run your ai/i })).toBeNull();
  });

  it('opens the finale once the picture is complete', async () => {
    const user = userEvent.setup();
    const all: Record<string, LessonRecord> = {};
    for (const w of c.worlds) Object.assign(all, clearWorlds(w.id));
    seed(container, all, { theme: null, prompt: null, items: [], placed: [...Array(20).keys()] });
    mountMachine(container);
    expect(screen.getByRole('heading', { name: /what should your ai make/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /toy collection/i }));
    await user.click(screen.getAllByRole('button', { name: /^built/i })[0]!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('the prompt block', () => {
  let container: Container;
  beforeEach(() => {
    container = createContainer({ store: new MemoryStore() });
    const all: Record<string, LessonRecord> = {};
    for (const w of c.worlds) Object.assign(all, clearWorlds(w.id));
    seed(container, all, { theme: 'toys', prompt: null, items: [], placed: [...Array(20).keys()] });
  });

  it('lets her edit the prompt and run a recorded demo', async () => {
    const user = userEvent.setup();
    mountMachine(container);
    await user.click(screen.getByRole('button', { name: /prompt/i }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /run the demo/i }));
    expect(await screen.findByText(/recorded demo run/i)).toBeInTheDocument();
  });
});
