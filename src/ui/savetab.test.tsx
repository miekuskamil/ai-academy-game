import { afterEach, describe, expect, it, vi } from 'vitest';
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

/** Pretend to be a wider screen, where the tab lives; phones use the bottom bar. */
function asDesk(desk: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: desk && query.includes('min-width'),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

afterEach(() => vi.restoreAllMocks());

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
  it('shows the machine progress on wider screens', () => {
    asDesk(true);
    const container = createContainer({ store: new MemoryStore() });
    mount(container);
    expect(
      screen.getByRole('button', { name: /your puzzle, 0 of 20 pieces earned/i }),
    ).toBeInTheDocument();
  });

  it('reflects pieces earned and waiting', () => {
    asDesk(true);
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
      screen.getByRole('button', { name: /your puzzle, 4 of 20 pieces earned, 4 waiting/i }),
    ).toBeInTheDocument();
  });

  it('taps through to the machine page', async () => {
    asDesk(true);
    const user = userEvent.setup();
    const container = createContainer({ store: new MemoryStore() });
    mount(container);
    await user.click(screen.getByRole('button', { name: /your puzzle.*pieces earned/i }));
    expect(
      screen.getByRole('heading', { name: /build the machine|you built an ai/i }),
    ).toBeInTheDocument();
  });

  it('stays off a phone screen, where the bottom bar shows the puzzle instead', () => {
    asDesk(false);
    const container = createContainer({ store: new MemoryStore() });
    mount(container);
    expect(screen.queryByRole('button', { name: /your puzzle/i })).toBeNull();
    expect(screen.getByRole('link', { name: /puzzle/i })).toBeInTheDocument();
  });
});
