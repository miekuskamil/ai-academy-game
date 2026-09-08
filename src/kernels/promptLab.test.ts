import { describe, expect, it } from 'vitest';
import { analysePrompt, promptScore, hitsWho, hitsJob, hitsLimits, hitsShape } from './promptLab';

describe('prompt lab analysis', () => {
  it('gives no credit to a vague ask', () => {
    expect(promptScore('write about dogs')).toBeLessThanOrEqual(1);
  });

  it('lights up all four parts on a strong prompt', () => {
    const strong = 'Write three fun facts about dogs for a six-year-old, as a list, one sentence each.';
    expect(promptScore(strong)).toBe(4);
  });

  it('detects who it is for', () => {
    expect(hitsWho('explain this for a six-year-old')).toBe(true);
    expect(hitsWho('explain gravity')).toBe(false);
  });

  it('detects the job verb', () => {
    expect(hitsJob('list three ideas')).toBe(true);
    expect(hitsJob('dogs please')).toBe(false);
  });

  it('detects a limit, including bare numbers with enough context', () => {
    expect(hitsLimits('give me 3 ideas about space')).toBe(true);
    expect(hitsLimits('in under fifty words')).toBe(true);
  });

  it('detects the requested shape', () => {
    expect(hitsShape('write it as a table')).toBe(true);
    expect(hitsShape('as a list of steps')).toBe(true);
  });

  it('requires at least a few words before crediting anything', () => {
    // Too short to be a real prompt.
    expect(promptScore('list')).toBe(0);
  });

  it('returns a nudge for every missing part', () => {
    const checks = analysePrompt('dogs');
    for (const c of checks) {
      if (!c.hit) expect(c.nudge.length).toBeGreaterThan(10);
    }
  });
});
