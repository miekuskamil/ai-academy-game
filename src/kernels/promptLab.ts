/**
 * The prompt lab's brain.
 *
 * Pure functions that look at a prompt and decide which of the four parts of a
 * good ask it covers: who it is for, the job, the limits, and the shape. No
 * React, no model calls — just honest keyword-and-shape checks a ten-year-old's
 * writing will actually trigger. Kept separate from the UI so it can be tested
 * and so the grading layer never imports React.
 *
 * This is deliberately forgiving. The goal is to reward her for thinking about
 * each part, not to police exact words. A near miss still lights up.
 */

export type PromptPart = 'who' | 'job' | 'limits' | 'shape';

export interface PromptCheck {
  part: PromptPart;
  label: string;
  hit: boolean;
  /** A friendly nudge shown when the part is missing. */
  nudge: string;
}

const WHO = [
  'for a', 'for my', 'for kids', 'for adults', 'year old', 'year-old', 'aged',
  'beginner', 'teacher', 'friend', 'child', 'grown up', 'grown-up', 'audience',
  'so a', 'someone who', 'people who',
];

const JOB = [
  'write', 'list', 'explain', 'compare', 'make', 'give me', 'plan', 'summarise',
  'summarize', 'draw', 'describe', 'suggest', 'help me', 'create', 'come up with',
  'translate', 'fix', 'sort', 'name', 'invent', 'turn', 'rewrite',
];

const LIMITS = [
  'under', 'less than', 'no more than', 'only', 'in ', 'words', 'sentences',
  'minutes', 'short', 'quick', 'brief', 'exactly', 'at most', 'up to', 'cheap',
  'budget', 'simple', 'three', 'five', 'ten', 'one ', 'two ', 'a few',
];

const SHAPE = [
  'as a list', 'as a table', 'bullet', 'numbered', 'steps', 'in order',
  'one sentence', 'a paragraph', 'table', 'list', 'poem', 'rhyme', 'chart',
  'each one', 'per line', 'in the style',
];

function hasAny(text: string, needles: string[]): boolean {
  const t = text.toLowerCase();
  return needles.some((n) => t.includes(n));
}

/** Whether the prompt names who the answer is for. */
export function hitsWho(text: string): boolean {
  return hasAny(text, WHO);
}

/** Whether the prompt states a clear job (a verb telling the AI what to do). */
export function hitsJob(text: string): boolean {
  return hasAny(text, JOB);
}

/** Whether the prompt sets a limit (length, count, budget, simplicity). */
export function hitsLimits(text: string): boolean {
  // A bare number followed by a noun also counts as a limit ("3 ideas").
  if (/\b\d+\b/.test(text) && text.trim().split(/\s+/).length >= 4) return true;
  return hasAny(text, LIMITS);
}

/** Whether the prompt asks for a particular shape or format. */
export function hitsShape(text: string): boolean {
  return hasAny(text, SHAPE);
}

export function analysePrompt(text: string): PromptCheck[] {
  const trimmed = text.trim();
  const enough = trimmed.split(/\s+/).filter(Boolean).length >= 3;
  return [
    {
      part: 'who',
      label: 'Who it is for',
      hit: enough && hitsWho(trimmed),
      nudge: 'Who is the answer for? Try "for a six-year-old" or "for my teacher".',
    },
    {
      part: 'job',
      label: 'The job',
      hit: enough && hitsJob(trimmed),
      nudge: 'What should the AI do? Start with a word like "write", "list", or "explain".',
    },
    {
      part: 'limits',
      label: 'The limits',
      hit: enough && hitsLimits(trimmed),
      nudge: 'Set a limit — how long or how many? Try "three ideas" or "under 50 words".',
    },
    {
      part: 'shape',
      label: 'The shape',
      hit: enough && hitsShape(trimmed),
      nudge: 'What shape should it take? Try "as a list", "a table", or "one sentence each".',
    },
  ];
}

/** How many of the four parts a prompt covers, 0..4. */
export function promptScore(text: string): number {
  return analysePrompt(text).filter((c) => c.hit).length;
}
