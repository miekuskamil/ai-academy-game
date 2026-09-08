import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptLab } from './PromptLab';

describe('PromptLab UI', () => {
  it('shows four unlit parts to start', () => {
    render(<PromptLab />);
    expect(screen.getByText(/who it is for/i)).toBeInTheDocument();
    expect(screen.getByText(/the job/i)).toBeInTheDocument();
    expect(screen.getByText(/the limits/i)).toBeInTheDocument();
    expect(screen.getByText(/the shape/i)).toBeInTheDocument();
    expect(screen.getByText(/start typing/i)).toBeInTheDocument();
  });

  it('lights up and reports state as she writes a strong prompt', async () => {
    const user = userEvent.setup();
    const states: number[] = [];
    render(<PromptLab onState={(s) => states.push(Number(s.parts))} />);

    await user.type(
      screen.getByRole('textbox'),
      'Write three fun dog facts for a six-year-old, as a list, one sentence each.',
    );

    // The final reported score should be all four parts.
    expect(states[states.length - 1]).toBe(4);
    expect(screen.getByText(/all four lit/i)).toBeInTheDocument();
  });
});
