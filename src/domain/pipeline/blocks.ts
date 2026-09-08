import type { WorldId } from '../types';

/**
 * The build-board: the whole course seen sideways.
 *
 * Everything a learner does across six worlds adds up to one real AI pipeline
 * she assembles for a project she chose. Each block is unlocked by finishing the
 * world that teaches it, so the board fills in as she learns — the curriculum,
 * turned into a thing she built rather than a thing she studied.
 *
 * The six blocks mirror how a real pipeline actually runs, left to right:
 *
 *   brief → prompt → model → check → agent → result
 *
 * This file is pure data and rules. No React, no rendering, no model calls.
 */

export type BlockId = 'brief' | 'prompt' | 'model' | 'check' | 'agent' | 'result';

export interface BlockSpec {
  id: BlockId;
  /** Where it sits on the board, left to right. */
  order: number;
  /** Short label on the board. */
  title: string;
  /** One line a ten-year-old understands. */
  summary: string;
  /** The world that unlocks it — finishing that world clicks the block in. */
  unlockedBy: WorldId;
  /** The badge collected when it unlocks. */
  badge: BadgeSpec;
}

export interface BadgeSpec {
  id: string;
  /** e.g. "Prompt Scroll". */
  name: string;
  /** One line on what it marks. */
  earnedFor: string;
}

/**
 * The pipeline, in order. Each block names the world that unlocks it.
 *
 * The mapping is deliberate: you cannot assemble the prompt block until World 5
 * has actually taught prompting, so the board can never run ahead of what she
 * understands.
 */
export const BLOCKS: readonly BlockSpec[] = [
  {
    id: 'brief',
    order: 0,
    title: 'Client brief',
    summary: 'What you are asking the AI to help build.',
    unlockedBy: 'talking-to-ai',
    badge: { id: 'badge-brief', name: 'The Brief', earnedFor: 'Learning what a machine can and cannot do.' },
  },
  {
    id: 'prompt',
    order: 1,
    title: 'Prompt',
    summary: 'The instructions you write for the model.',
    unlockedBy: 'talking-to-ai',
    badge: { id: 'badge-prompt', name: 'Prompt Scroll', earnedFor: 'Learning to ask a model for exactly what you want.' },
  },
  {
    id: 'model',
    order: 2,
    title: 'Model',
    summary: 'The AI that turns your prompt into an answer.',
    unlockedBy: 'why-it-answers',
    badge: { id: 'badge-model', name: 'Model Chip', earnedFor: 'Learning how a model reads and writes.' },
  },
  {
    id: 'check',
    order: 3,
    title: 'Check',
    summary: 'A test that decides if the answer is good enough.',
    unlockedBy: 'using-ai-for-real',
    badge: { id: 'badge-check', name: 'Checkmark', earnedFor: 'Learning to measure whether an answer is any good.' },
  },
  {
    id: 'agent',
    order: 4,
    title: 'Agent',
    summary: 'The planner that runs the steps in order.',
    unlockedBy: 'ai-that-does-things',
    badge: { id: 'badge-agent', name: 'Agent Robot', earnedFor: 'Learning how an AI plans and uses tools.' },
  },
  {
    id: 'result',
    order: 5,
    title: 'Result page',
    summary: 'Your finished project, built from the pipeline.',
    unlockedBy: 'building-with-ai',
    badge: { id: 'badge-result', name: 'Ship It', earnedFor: 'Putting the whole pipeline together into a real thing.' },
  },
] as const;

export function blockById(id: BlockId): BlockSpec {
  const block = BLOCKS.find((b) => b.id === id);
  if (!block) throw new Error(`unknown block ${id}`);
  return block;
}

/**
 * The project themes she can pick from.
 *
 * Each is a real result-page template the model fills from her prompt. Picked
 * once, changeable later — the theme only changes the flavour, never which
 * blocks she assembles or what they teach.
 */
export type ThemeId = 'toys' | 'photos' | 'pets' | 'games';

export interface ThemeSpec {
  id: ThemeId;
  name: string;
  /** The client brief this theme starts her with. */
  brief: string;
  /** One-word noun for the items her result page lists. */
  item: string;
}

export const THEMES: readonly ThemeSpec[] = [
  {
    id: 'toys',
    name: 'Toy collection',
    brief: 'Build a little website that shows off my toy collection, with a fun blurb for each toy.',
    item: 'toy',
  },
  {
    id: 'photos',
    name: 'Photo gallery',
    brief: 'Build a photo gallery site that gives each photo a short, catchy caption.',
    item: 'photo',
  },
  {
    id: 'pets',
    name: 'Pet profiles',
    brief: 'Build a page of pet profiles, each with a friendly description of the pet.',
    item: 'pet',
  },
  {
    id: 'games',
    name: 'Game shelf',
    brief: 'Build a shelf of my favourite games, each with a one-line review.',
    item: 'game',
  },
] as const;

export function themeById(id: ThemeId): ThemeSpec {
  const theme = THEMES.find((t) => t.id === id);
  if (!theme) throw new Error(`unknown theme ${id}`);
  return theme;
}
