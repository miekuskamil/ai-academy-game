import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('motion preference', () => {
  let container: Container;
  beforeEach(() => {
    container = createContainer({ store: new MemoryStore() });
    document.documentElement.removeAttribute('data-motion');
  });

  /**
   * The reduced-motion CSS keys off html[data-motion]. If the shell stops
   * publishing it, battery saver and the in-app "no movement" setting both
   * silently stop working, so this guards the wiring rather than the CSS.
   */
  it('publishes the motion preference onto the document', () => {
    mount(container);
    expect(document.documentElement.dataset.motion).toBe('auto');
  });

  it('reflects a change the moment a parent sets it', async () => {
    const user = userEvent.setup();
    mount(container);
    await user.click(screen.getByRole('link', { name: /grown-ups/i }));
    await user.click(screen.getByRole('button', { name: /no movement/i }));
    expect(document.documentElement.dataset.motion).toBe('off');

    await user.click(screen.getByRole('button', { name: /always animate/i }));
    expect(document.documentElement.dataset.motion).toBe('full');
  });
});
