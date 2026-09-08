import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackupPanel } from './BackupPanel';
import { ContainerProvider } from '../../hooks/useContainer';
import { createContainer, type Container } from '../../domain/container';
import { MemoryStore } from '../../domain/progress/MemoryStore';

/** jsdom's File has no .text(); real browsers do. Patch it for the test. */
function fileWithText(content: string, name: string): File {
  const file = new File([content], name, { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => content });
  return file;
}

function wrap(container: Container) {
  return render(
    <ContainerProvider value={container}>
      <BackupPanel />
    </ContainerProvider>,
  );
}

describe('BackupPanel', () => {
  let container: Container;
  beforeEach(() => {
    container = createContainer({ store: new MemoryStore() });
  });

  it('offers save and load, and explains auto-save already runs', () => {
    wrap(container);
    expect(screen.getByRole('button', { name: /save to a file/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load from a file/i })).toBeInTheDocument();
    expect(screen.getByText(/saves itself on this device automatically/i)).toBeInTheDocument();
  });

  it('restores progress from an exported file', async () => {
    const user = userEvent.setup();
    // Produce a real export from a container that has progress.
    const source = createContainer({ store: new MemoryStore() });
    source.progress.record({ lessonId: source.curriculum.opener().id, score: 1, usedHints: false });
    const json = source.progress.export();

    wrap(container);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileWithText(json, 'neuron-progress.json');
    await user.upload(input, file);

    // Wait for the async import to finish (message appears), then assert.
    expect(await screen.findByText(/restored from your file/i)).toBeInTheDocument();
    const snap = container.progress.snapshot();
    expect(snap.status[source.curriculum.opener().id]).toBe('mastered');
  });

  it('reports a bad file without changing anything', async () => {
    const user = userEvent.setup();
    wrap(container);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, fileWithText('not json', 'bad.json'));
    expect(await screen.findByText(/could not be read/i)).toBeInTheDocument();
  });
});
