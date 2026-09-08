import { describe, expect, it } from 'vitest';
import { PIPELINES, scoreArrangement, shuffled } from './pipelineBuilder';
import { PLANS, scoreChecks } from './agentPlanner';

describe('pipeline builder', () => {
  const steps = PIPELINES.plant!;
  it('scores a perfect arrangement', () => {
    const order = [...steps].sort((a, b) => a.order - b.order).map((s) => s.id);
    const r = scoreArrangement(steps, order);
    expect(r.correct).toBe(true);
    expect(r.inPlace).toBe(steps.length);
  });
  it('counts partial correctness', () => {
    const order = [...steps].sort((a, b) => a.order - b.order).map((s) => s.id);
    const swapped = [order[1]!, order[0]!, ...order.slice(2)];
    const r = scoreArrangement(steps, swapped);
    expect(r.correct).toBe(false);
    expect(r.inPlace).toBe(steps.length - 2);
  });
  it('never returns the identity order from shuffled', () => {
    const sh = shuffled(steps);
    const isIdentity = sh.every((s, i) => s.order === i);
    expect(isIdentity).toBe(false);
  });
});

describe('agent planner', () => {
  it('every plan has a bad step with a reason', () => {
    for (const p of PLANS) {
      expect(p.badStep).toBeGreaterThanOrEqual(0);
      expect(p.badStep).toBeLessThan(p.steps.length);
      expect(p.why.length).toBeGreaterThan(20);
    }
  });
  it('scores catching all wrong turns', () => {
    const guesses = Object.fromEntries(PLANS.map((p) => [p.id, p.badStep]));
    const r = scoreChecks(guesses);
    expect(r.correct).toBe(PLANS.length);
    expect(r.done).toBe(true);
  });
  it('does not credit a wrong pick', () => {
    const p = PLANS[0]!;
    const wrong = (p.badStep + 1) % p.steps.length;
    expect(scoreChecks({ [p.id]: wrong }).correct).toBe(0);
  });
});
