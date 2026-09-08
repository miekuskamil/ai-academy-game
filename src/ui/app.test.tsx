import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from '../lib/router';
import { App } from '../App';
import { ContainerProvider } from '../hooks/useContainer';
import { createContainer, type Container } from '../domain/container';
import { MemoryStore } from '../domain/progress/MemoryStore';

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

describe('Neuron app', () => {
  let container: Container;

  beforeEach(() => {
    container = createContainer({ store: new MemoryStore() });
  });

  it('starts a new learner at level 1 with one lesson open', () => {
    mount(container);
    expect(screen.getByRole('group', { name: /level 1/i })).toBeInTheDocument();

    // Appears twice on purpose: the resume button and its node on the map.
    const opener = container.curriculum.opener();
    expect(screen.getAllByRole('link', { name: new RegExp(opener.title, 'i') }).length).toBeGreaterThan(0);
  });

  it('shows later lessons as locked rather than hiding them', () => {
    mount(container);
    expect(screen.getAllByText('Locked').length).toBeGreaterThan(0);
  });

  it('walks a lesson from the comic through to the exercises', async () => {
    const user = userEvent.setup();
    mount(container);

    await user.click(screen.getAllByRole('link', { name: /start here|carry on/i })[0]!);

    // Cold open first: the concept is felt before it is named.
    await user.click(screen.getByRole('button', { name: /show the whole scene/i }));
    await user.click(screen.getByRole('button', { name: /so what is going on|try it yourself/i }));

    if (screen.queryByRole('button', { name: /what is going on here/i })) {
      await user.click(screen.getByRole('button', { name: /what is going on here/i }));
    }
    // The lesson now teaches before it names: step through Learn if present.
    if (screen.queryByRole('button', { name: /got it — what is it called/i })) {
      await user.click(screen.getByRole('button', { name: /got it — what is it called/i }));
    }
    expect(screen.getByRole('heading', { name: /worth remembering/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /right, test me/i }));
    expect(screen.getByRole('button', { name: /see how i did/i })).toBeInTheDocument();
  });

  it('will not let a learner submit before answering anything', async () => {
    const user = userEvent.setup();
    mount(container);
    await user.click(screen.getAllByRole('link', { name: /start here|carry on/i })[0]!);
    await user.click(screen.getByRole('button', { name: /show the whole scene/i }));
    await user.click(screen.getByRole('button', { name: /so what is going on|try it yourself/i }));
    if (screen.queryByRole('button', { name: /what is going on here/i })) {
      await user.click(screen.getByRole('button', { name: /what is going on here/i }));
    }
    if (screen.queryByRole('button', { name: /got it — what is it called/i })) {
      await user.click(screen.getByRole('button', { name: /got it — what is it called/i }));
    }
    await user.click(screen.getByRole('button', { name: /right, test me/i }));

    expect(screen.getByRole('button', { name: /see how i did/i })).toBeDisabled();
  });

  it('raises the level and opens the next lesson after a clean run', async () => {
    const user = userEvent.setup();
    const opener = container.curriculum.opener();
    // Answer correctly through the domain, exactly as the UI would.
    container.progress.record({ lessonId: opener.id, score: 1, usedHints: false });

    mount(container);
    const snapshot = container.progress.snapshot();
    expect(snapshot.status[opener.id]).toBe('mastered');
    for (const next of opener.unlocks) {
      expect(snapshot.status[next]).toBe('open');
    }
    expect(screen.getAllByText(/mastered/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('link', { name: /grown-ups/i }));
    expect(screen.getByRole('heading', { name: /for grown-ups/i })).toBeInTheDocument();
  });

  it('refuses a locked lesson opened by its direct link', () => {
    const locked = container.curriculum.lessons.find((l) => l.prereqs.length > 0)!;
    window.location.hash = `#/lesson/${locked.id}`;
    render(
      <ContainerProvider value={container}>
        <HashRouter>
          <App />
        </HashRouter>
      </ContainerProvider>,
    );
    expect(screen.getByRole('heading', { name: /not open yet/i })).toBeInTheDocument();
  });

  it('offers a way back from an address that does not exist', () => {
    window.location.hash = '#/nonsense';
    render(
      <ContainerProvider value={container}>
        <HashRouter>
          <App />
        </HashRouter>
      </ContainerProvider>,
    );
    expect(screen.getByRole('heading', { name: /nothing at this address/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to the map/i })).toBeInTheDocument();
  });

  it('states plainly that nothing leaves the device', async () => {
    const user = userEvent.setup();
    mount(container);
    await user.click(screen.getByRole('link', { name: /grown-ups/i }));
    expect(screen.getByText(/stays on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/no account/i)).toBeInTheDocument();
  });

  it('asks for confirmation before erasing progress', async () => {
    const user = userEvent.setup();
    const opener = container.curriculum.opener();
    container.progress.record({ lessonId: opener.id, score: 1, usedHints: false });
    mount(container);

    await user.click(screen.getByRole('link', { name: /grown-ups/i }));
    await user.click(screen.getByRole('button', { name: /erase progress/i }));
    expect(container.progress.snapshot().state.records[opener.id]).toBeDefined();

    await user.click(screen.getByRole('button', { name: /yes, erase it/i }));
    expect(container.progress.snapshot().state.records).toEqual({});
  });

  it('switches pace without losing progress', async () => {
    const user = userEvent.setup();
    const opener = container.curriculum.opener();
    container.progress.record({ lessonId: opener.id, score: 1, usedHints: false });
    mount(container);

    await user.click(screen.getByRole('link', { name: /grown-ups/i }));
    await user.click(screen.getByRole('button', { name: /builder/i }));

    const snapshot = container.progress.snapshot();
    expect(snapshot.state.track).toBe('builder');
    expect(snapshot.state.records[opener.id]).toBeDefined();
  });

  it('gives the companion a stage that grows with the level', async () => {
    const user = userEvent.setup();
    mount(container);
    await user.click(screen.getByRole('link', { name: /iskra/i }));
    const heading = screen.getByRole('heading', { name: 'Iskra' });
    expect(heading).toBeInTheDocument();
    expect(within(heading.parentElement!).getByText('spark')).toBeInTheDocument();
  });
});

describe('lesson navigation and shuffling', () => {
  let container: Container;
  beforeEach(() => {
    container = createContainer({ store: new MemoryStore() });
  });

  async function reachName(user: ReturnType<typeof userEvent.setup>) {
    mount(container);
    await user.click(screen.getAllByRole('link', { name: /start here|carry on/i })[0]!);
    await user.click(screen.getByRole('button', { name: /show the whole scene/i }));
    await user.click(screen.getByRole('button', { name: /so what is going on|try it yourself/i }));
    if (screen.queryByRole('button', { name: /what is going on here/i })) {
      await user.click(screen.getByRole('button', { name: /what is going on here/i }));
    }
    if (screen.queryByRole('button', { name: /got it — what is it called/i })) {
      await user.click(screen.getByRole('button', { name: /got it — what is it called/i }));
    }
  }

  it('lets a learner step back into a tutorial page from the tracker', async () => {
    const user = userEvent.setup();
    await reachName(user);
    expect(screen.getByRole('heading', { name: /worth remembering/i })).toBeInTheDocument();

    // Watch is a completed tutorial stage, so it is a button.
    const watch = screen.getByRole('button', { name: /^watch$/i });
    await user.click(watch);
    // Back in the comic.
    expect(screen.getByRole('button', { name: /show the whole scene/i })).toBeInTheDocument();

    // And a way straight back to where the recap started.
    const back = screen.getByRole('button', { name: /back to recap/i });
    await user.click(back);
    expect(screen.getByRole('heading', { name: /worth remembering/i })).toBeInTheDocument();
  });

  it('never turns Test into a shortcut on the tracker', async () => {
    const user = userEvent.setup();
    await reachName(user);
    // Test is an exercise stage: it must never be a button, only a marker.
    expect(screen.queryByRole('button', { name: /^test$/i })).not.toBeInTheDocument();
  });
});
