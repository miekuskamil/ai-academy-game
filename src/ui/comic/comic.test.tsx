import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComicPlayer } from '../ComicPlayer';
import { sceneFor } from './scenes/W1RulesScene';
import bundle from '../../generated/curriculum.json';
import type { CurriculumBundle } from '../../domain/types';

const curriculum = bundle as CurriculumBundle;
const lesson = curriculum.lessons[0]!;

describe('drawn scenes', () => {
  it('has a scene registered for the opening comic', () => {
    expect(sceneFor(lesson.open_comic)).toBeDefined();
  });

  /**
   * Hand-composing twenty scenes was never realistic, so a lesson without
   * bespoke artwork still gets a drawn panel built from its beat data. No
   * lesson falls back to plain text.
   */
  it('draws a panel even for a comic with no bespoke artwork', () => {
    const undrawn = curriculum.lessons.find((l) => !sceneFor(l.open_comic))!;
    render(<ComicPlayer comic={undrawn.open_comic} onFinish={() => {}} />);
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
  });

  it('gives every comic in the course a drawn opening panel', () => {
    for (const lesson of curriculum.lessons) {
      const { unmount } = render(<ComicPlayer comic={lesson.open_comic} onFinish={() => {}} />);
      expect(screen.getAllByRole('img').length, lesson.id).toBeGreaterThan(0);
      unmount();
    }
  });

  /**
   * Every panel carries a description of what it draws, because the argument of
   * this scene is made visually — a screen reader user has to get the same joke.
   */
  it('describes each panel for anyone who cannot see it', async () => {
    const user = userEvent.setup();
    render(<ComicPlayer comic={lesson.open_comic} onFinish={() => {}} />);
    await user.click(screen.getByRole('button', { name: /show the whole scene/i }));

    const panels = screen.getAllByRole('img');
    expect(panels.length).toBe(lesson.open_comic.beats.length);
    for (const panel of panels) {
      expect(panel.getAttribute('aria-label')?.length ?? 0).toBeGreaterThan(20);
    }
  });

  it('reveals panels one beat at a time', async () => {
    const user = userEvent.setup();
    render(<ComicPlayer comic={lesson.open_comic} onFinish={() => {}} />);
    expect(screen.getAllByRole('img')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /^next$/i }));
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('keeps the dialogue as real text rather than baking it into a drawing', async () => {
    const user = userEvent.setup();
    render(<ComicPlayer comic={lesson.open_comic} onFinish={() => {}} />);
    await user.click(screen.getByRole('button', { name: /show the whole scene/i }));
    // Speech is <text> inside the SVG, so it stays selectable and searchable.
    expect(screen.getByText(/He has four legs\./)).toBeInTheDocument();
  });
});
