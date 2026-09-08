import { describe, expect, it, beforeEach } from 'vitest';
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

function clearWorlds(...ids: string[]): Record<string, LessonRecord> {
  const records: Record<string, LessonRecord> = {};
  for (const id of ids)
    for (const lesson of c.lessonsInWorld(id))
      records[lesson.id] = {
        lessonId: lesson.id,
        best: 1,
        attempts: 1,
        bestUnaided: true,
        completedAt: 't',
        lastSeenAt: 't',
      };
  return records;
}

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

describe('the persistent machine strip', () => {
  let container: Container;
  beforeEach(() => {
    container = createContainer({ store: new MemoryStore() });
  });

  it('is always on screen as a nav item, on every page', () => {
    mount(container);
    // The machine is a nav link, present in the rail on every page.
    expect(screen.getByRole('link', { name: /\d+\/20/i })).toBeInTheDocument();
  });

  it('reports how many parts are built', () => {
    container.progress.import(
      JSON.stringify({
        v: 1,
        track: 'explorer',
        learnerName: null,
        companionName: 'Iskra',
        records: clearWorlds('talking-to-ai'), // 4 lessons = 4 parts
        createdAt: 't',
        updatedAt: 't',
      }),
    );
    mount(container);
    expect(screen.getAllByText('4/20').length).toBeGreaterThan(0);
  });

  it('takes you to the machine page when tapped', async () => {
    const user = userEvent.setup();
    mount(container);
    await user.click(screen.getByRole('link', { name: /\d+\/20/i }));
    expect(screen.getByRole('heading', { name: /build the machine|you built an ai/i })).toBeInTheDocument();
  });
});
