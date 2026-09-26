import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComicPlayer } from '../ComicPlayer';
import bundle from '../../generated/curriculum.json';
import type { CurriculumBundle } from '../../domain/types';

const curriculum = bundle as CurriculumBundle;
const lesson = curriculum.lessons[0]!;

describe('drawn scenes', () => {
  /**
   * Guards the bug where lesson 1 showed an old comic: a drawing registered by
   * comic id outlived its lesson and replaced the new lesson's dialogue. Every
   * comic must show its own words, and only its own words.
   */
  it('shows each comic its own dialogue and nothing from another comic', async () => {
    const user = userEvent.setup();
    for (const l of curriculum.lessons) {
      const { unmount } = render(<ComicPlayer comic={l.open_comic} onFinish={() => {}} />);
      const reveal = screen.queryByRole('button', { name: /show the whole scene/i });
      if (reveal) await user.click(reveal);
      const text = document.body.textContent ?? '';
      const firstWords = l.open_comic.beats[0]!.text.split(' ').slice(0, 3).join(' ');
      expect(text, l.id).toContain(firstWords);
      expect(text, l.id).not.toMatch(/four legs, it is a table/i);
      unmount();
    }
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
    const svgText = [...document.querySelectorAll('svg text')].map((n) => n.textContent).join(' ');
    expect(svgText).toMatch(/nine hundred words/i);
  });
});
