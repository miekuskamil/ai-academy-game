import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KnnSandbox } from './KnnSandbox';
import { SANDBOX_CHECKS } from './index';

const check = (id: string) => SANDBOX_CHECKS.find((c) => c.id === id)!;

describe('KnnSandbox', () => {
  it('tells her plainly that a model with no examples cannot guess', () => {
    render(<KnnSandbox />);
    expect(screen.getByRole('status')).toHaveTextContent(/seen nothing yet/i);
    expect(screen.getByRole('button', { name: /test her/i })).toBeDisabled();
  });

  it('lets her place an example by tapping the field', async () => {
    const user = userEvent.setup();
    render(<KnnSandbox />);
    await user.click(screen.getByRole('application'));
    expect(screen.getByText(/1 examples/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test her/i })).toBeEnabled();
  });

  it('can undo and clear without testing first', async () => {
    const user = userEvent.setup();
    render(<KnnSandbox />);
    await user.click(screen.getByRole('application'));
    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(screen.getByText(/0 examples/)).toBeInTheDocument();
  });
});

describe('knn-accuracy check', () => {
  it('passes once she reaches the bar', () => {
    const out = check('knn-accuracy').run({ accuracy: 0.9, trainingCount: 12 }, { min: 0.8 });
    expect(out.correct).toBe(true);
    expect(out.feedback).toMatch(/9 out of ten/);
  });

  it('points her at the crosses rather than just failing her', () => {
    const out = check('knn-accuracy').run({ accuracy: 0.5, trainingCount: 4 }, { min: 0.8 });
    expect(out.correct).toBe(false);
    expect(out.fraction).toBeCloseTo(0.625, 2);
    expect(out.feedback).toMatch(/crosses/);
  });

  it('asks for examples before anything else when there are none', () => {
    const out = check('knn-accuracy').run({ accuracy: 0, trainingCount: 0 }, { min: 0.8 });
    expect(out.feedback).toMatch(/place some examples/i);
  });
});

describe('knn-recovered check', () => {
  const params = { low: 0.5, high: 0.8 };

  it('needs both the breaking and the fixing', () => {
    expect(check('knn-recovered').run({ lowest: 0.4, best: 0.9 }, params).correct).toBe(true);
    expect(check('knn-recovered').run({ lowest: 0.9, best: 0.9 }, params).correct).toBe(false);
    expect(check('knn-recovered').run({ lowest: 0.2, best: 0.6 }, params).correct).toBe(false);
  });

  it('gives half credit for getting halfway', () => {
    expect(check('knn-recovered').run({ lowest: 0.2, best: 0.6 }, params).fraction).toBe(0.5);
  });

  it('says which half is still missing', () => {
    expect(check('knn-recovered').run({ lowest: 1, best: 0 }, params).feedback).toMatch(/fail on purpose/i);
    expect(check('knn-recovered').run({ lowest: 0.2, best: 0.6 }, params).feedback).toMatch(/back above eight/i);
  });

  /** The point of the lesson: the model was never the problem. */
  it('names the examples as the cause once she has done both', () => {
    expect(check('knn-recovered').run({ lowest: 0.3, best: 0.9 }, params).feedback).toMatch(
      /examples all along/i,
    );
  });
});
