import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from '../lib/router';
import { App } from '../App';
import { ContainerProvider } from '../hooks/useContainer';
import { createContainer, type Container } from '../domain/container';
import { MemoryStore } from '../domain/progress/MemoryStore';
import curriculum from '../generated/curriculum.json';
import { Curriculum } from '../domain/curriculum';
import type { LessonRecord } from '../domain/progress/state';

const c = new Curriculum(curriculum as never);

function mount(container: Container) {
  window.location.hash = '#/map';
  return render(
    <ContainerProvider value={container}>
      <HashRouter>
        <App />
      </HashRouter>
    </ContainerProvider>,
  );
}

describe('the machine progress tab', () => {
  it('shows the machine progress and is always on screen', () => {
    const container = createContainer({ store: new MemoryStore() });
    mount(container);
    expect(
      screen.getByRole('button', { name: /your machine, 0 of 20 parts built/i }),
    ).toBeInTheDocument();
  });

  it('reflects parts built', () => {
    const container = createContainer({ store: new MemoryStore() });
    const records: Record<string, LessonRecord> = {};
    for (const lesson of c.lessonsInWorld('talking-to-ai'))
      records[lesson.id] = {
        lessonId: lesson.id,
        best: 1,
        attempts: 1,
        bestUnaided: true,
        completedAt: 't',
        lastSeenAt: 't',
      };
    container.progress.import(
      JSON.stringify({
        v: 1,
        track: 'explorer',
        learnerName: null,
        companionName: 'Iskra',
        records,
        createdAt: 't',
        updatedAt: 't',
      }),
    );
    mount(container);
    expect(
      screen.getByRole('button', { name: /your machine, 4 of 20 parts built/i }),
    ).toBeInTheDocument();
  });

  it('taps through to the machine page', async () => {
    const user = userEvent.setup();
    const container = createContainer({ store: new MemoryStore() });
    mount(container);
    await user.click(screen.getByRole('button', { name: /your machine.*parts built/i }));
    expect(
      screen.getByRole('heading', { name: /build the machine|you built an ai/i }),
    ).toBeInTheDocument();
  });
});
