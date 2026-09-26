import type { SandboxId, SandboxState } from '../../domain/types';
import type { SandboxCheck } from '../../domain/grading';
import { PromptLab } from './PromptLab';
import { HallucinationGame } from './HallucinationGame';
import { TaskSorter } from './TaskSorter';
import { PipelineBuilder } from './PipelineBuilder';
import { AgentPlanner } from './AgentPlanner';
import { Verifier } from './Verifier';
import { TemperatureDial } from './TemperatureDial';

export interface SandboxProps {
  onState?: (state: SandboxState) => void;
  compact?: boolean;
}

/**
 * Which workbenches exist in this build.
 *
 * A lesson whose sandbox is missing simply has that exercise excluded from its
 * points, so content can be authored ahead of the interactive work without ever
 * stranding a learner behind an unanswerable question.
 */
export const SANDBOXES: Partial<Record<SandboxId, (props: SandboxProps) => JSX.Element>> = {
  'prompt-lab': PromptLab,
  'hallucination-spotter': HallucinationGame,
  'task-sorter': TaskSorter,
  'pipeline-builder': PipelineBuilder,
  'agent-planner': AgentPlanner,
  verifier: Verifier,
  'temperature-dial': TemperatureDial,
};

export function sandboxFor(id: SandboxId) {
  return SANDBOXES[id];
}

const num = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Checks read what she actually built, not what she typed.
 *
 * Registered separately from the components so the grading layer stays free of
 * React, and so a check can never quietly go missing when a sandbox ships.
 */
export const SANDBOX_CHECKS: SandboxCheck[] = [
  {
    id: 'prompt-parts',
    run: (state, params) => {
      const parts = num(state.parts ?? state.promptScore);
      const target = num(params.min, 3);
      return {
        fraction: Math.min(1, parts / 4),
        correct: parts >= target,
        feedback:
          parts >= 4
            ? 'All four parts — that is a razor-sharp ask. Beautifully done.'
            : parts >= target
              ? `${parts} of four parts covered. That is a strong, clear ask.`
              : parts === 0
                ? 'Write an ask in the box, then aim to light up the four parts.'
                : `${parts} of four so far. Add the missing parts and watch the lights fill in.`,
      };
    },
  },
  {
    id: 'spotted-fakes',
    run: (state, params) => {
      const correct = num(state.correct);
      const total = num(state.total, 8);
      const target = num(params.min, 6);
      return {
        fraction: total > 0 ? correct / total : 0,
        correct: correct >= target,
        feedback:
          correct >= target
            ? `You caught ${correct} of ${total}. You judged by thinking, not by how sure they sounded.`
            : `You caught ${correct} of ${total}. Remember: a made-up answer sounds just as confident as a true one.`,
      };
    },
  },
  {
    id: 'sorted-tasks',
    run: (state, params) => {
      const correct = num(state.correct);
      const total = num(state.total, 8);
      const target = num(params.min, 6);
      return {
        fraction: total > 0 ? correct / total : 0,
        correct: correct >= target,
        feedback:
          correct >= target
            ? `${correct} of ${total} in the best bin. You have a real feel for what AI is for.`
            : `${correct} of ${total} sorted well. Think: is it a word job, a you-only job, or a check-it job?`,
      };
    },
  },
  {
    id: 'built-pipeline',
    run: (state) => {
      const inPlace = num(state.inPlace);
      const total = num(state.total, 4);
      const done = Boolean(state.done);
      return {
        fraction: total > 0 ? inPlace / total : 0,
        correct: done && inPlace === total,
        feedback:
          inPlace === total
            ? 'Perfect pipeline — in, the AI decides, out. That is how a real build flows.'
            : done
              ? `${inPlace} of ${total} in place. Tap a step to take it back and re-order.`
              : 'Place all the steps in the order they run.',
      };
    },
  },
  {
    id: 'checked-agent',
    run: (state, params) => {
      const correct = num(state.correct);
      const total = num(state.total, 3);
      const target = num(params.min, 2);
      return {
        fraction: total > 0 ? correct / total : 0,
        correct: correct >= target,
        feedback:
          correct >= target
            ? `You caught ${correct} of ${total} wrong turns. That is real oversight.`
            : `You caught ${correct} of ${total}. Read each step against the goal — one of them does not fit.`,
      };
    },
  },
  {
    id: 'checked-care',
    run: (state, params) => {
      const correct = num(state.correct);
      const total = num(state.total, 6);
      const target = num(params.min, 4);
      return {
        fraction: total > 0 ? correct / total : 0,
        correct: correct >= target,
        feedback:
          correct >= target
            ? `${correct} of ${total} matched. You check hard when it counts and relax when it does not.`
            : `${correct} of ${total}. Think: is it just for fun, a real fact, or a safety thing?`,
      };
    },
  },
  {
    id: 'felt-temperature',
    run: (state) => {
      const bothEnds = Boolean(state.bothEnds);
      return {
        fraction: bothEnds ? 1 : Number(state.triedLow) * 0.5 + Number(state.triedHigh) * 0.5,
        correct: bothEnds,
        feedback: bothEnds
          ? 'You felt it — steady at the low end, wild at the high end. Same AI, different mood.'
          : 'Try asking at the low end, then at the high end, to feel the difference.',
      };
    },
  },
];
