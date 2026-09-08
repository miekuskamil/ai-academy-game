/**
 * The task-sorter's brain.
 *
 * A bank of real tasks she sorts into three bins: ask AI, do it myself, or check
 * carefully. It builds the World 3 judgment skill — knowing what AI is genuinely
 * good for. Pure and testable; the UI presents these and scores the sort.
 */

export type Bin = 'ask-ai' | 'myself' | 'check';

export interface Task {
  id: string;
  text: string;
  /** The best bin for this task. */
  best: Bin;
  why: string;
}

export const BIN_LABELS: Record<Bin, string> = {
  'ask-ai': 'Ask AI',
  myself: 'Do it myself',
  check: 'Check carefully',
};

export const TASKS: readonly Task[] = [
  {
    id: 't1',
    text: 'Rewrite my message to sound friendlier.',
    best: 'ask-ai',
    why: 'A word job — exactly what AI is great at. Low stakes, easy win.',
  },
  {
    id: 't2',
    text: 'Decide the perfect birthday gift for my mum.',
    best: 'myself',
    why: 'Only you know your mum. This needs your judgment, not the AI\u2019s.',
  },
  {
    id: 't3',
    text: 'Give me a fact with a date for my history report.',
    best: 'check',
    why: 'AI can help, but it might invent a date. Verify before you trust it.',
  },
  {
    id: 't4',
    text: 'Brainstorm ten names for my robot.',
    best: 'ask-ai',
    why: 'Idea-spraying is an AI strength, and there is no wrong answer to check.',
  },
  {
    id: 't5',
    text: 'Work out exactly how much money I have saved.',
    best: 'check',
    why: 'Exact maths is shaky for AI. Do it, then check on a calculator.',
  },
  {
    id: 't6',
    text: 'Decide whether to tell my friend a hard truth.',
    best: 'myself',
    why: 'A real human moment. This is yours to feel and decide, not a chatbot\u2019s.',
  },
  {
    id: 't7',
    text: 'Summarise a long article I have to read.',
    best: 'check',
    why: 'AI summarises well, but can miss or twist things. Skim to confirm.',
  },
  {
    id: 't8',
    text: 'Turn my messy notes into a tidy list.',
    best: 'ask-ai',
    why: 'Tidying words into shape is a perfect, low-risk AI task.',
  },
];

export interface SortResult {
  correct: number;
  total: number;
  done: boolean;
}

/** Score a sort (taskId → chosen bin) against the best bin. */
export function scoreSort(placements: Record<string, Bin>): SortResult {
  const placed = TASKS.filter((t) => t.id in placements);
  const correct = placed.filter((t) => placements[t.id] === t.best).length;
  return { correct, total: TASKS.length, done: placed.length === TASKS.length };
}
