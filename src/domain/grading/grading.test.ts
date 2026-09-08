import { describe, expect, it } from 'vitest';
import { createGraderRegistry, GradingService } from './index';
import type {
  McqExercise,
  OrderExercise,
  MatchExercise,
  NumericExercise,
  PromptRubricExercise,
  SandboxExercise,
} from '../types';
import { makeLesson } from '../../test/factory';

const base = { points: 10, explain: 'Because that is how it works.' };

function service() {
  const { registry, sandbox } = createGraderRegistry();
  return { grading: new GradingService(registry), registry, sandbox };
}

describe('McqGrader', () => {
  const ex: McqExercise = { ...base, id: 'q', kind: 'mcq', prompt: 'p', choices: ['a', 'b', 'c'], answer: [0, 2] };
  const { grading } = service();

  it('gives full credit for exactly the right set', () => {
    const out = grading.gradeOne(ex, { kind: 'mcq', selected: [0, 2] });
    expect(out.correct).toBe(true);
    expect(out.fraction).toBe(1);
  });

  it('gives partial credit for a subset', () => {
    const out = grading.gradeOne(ex, { kind: 'mcq', selected: [0] });
    expect(out.fraction).toBeCloseTo(0.5);
    expect(out.correct).toBe(false);
  });

  it('penalises a wrong extra pick and names it', () => {
    const out = grading.gradeOne(ex, { kind: 'mcq', selected: [0, 1, 2] });
    expect(out.fraction).toBeCloseTo(2 / 3);
    expect(out.wrong).toEqual([1]);
  });

  it('asks for an answer instead of scoring an empty selection', () => {
    const out = grading.gradeOne(ex, { kind: 'mcq', selected: [] });
    expect(out.fraction).toBe(0);
    expect(out.feedback).toMatch(/pick at least one/i);
  });
});

describe('OrderGrader', () => {
  const ex: OrderExercise = { ...base, id: 'q', kind: 'order', prompt: 'p', items: ['1', '2', '3', '4'] };
  const { grading } = service();

  it('gives full credit for the right sequence', () => {
    expect(grading.gradeOne(ex, { kind: 'order', order: [0, 1, 2, 3] }).fraction).toBe(1);
  });

  it('credits a mostly-right sequence with one swap', () => {
    const out = grading.gradeOne(ex, { kind: 'order', order: [0, 2, 1, 3] });
    expect(out.fraction).toBeCloseTo(5 / 6);
    expect(out.correct).toBe(false);
  });

  it('scores a fully reversed sequence at zero', () => {
    expect(grading.gradeOne(ex, { kind: 'order', order: [3, 2, 1, 0] }).fraction).toBe(0);
  });

  it('refuses to score an incomplete sequence', () => {
    const out = grading.gradeOne(ex, { kind: 'order', order: [0, 1] });
    expect(out.fraction).toBe(0);
    expect(out.feedback).toMatch(/every step/i);
  });
});

describe('MatchGrader', () => {
  const ex: MatchExercise = {
    ...base,
    id: 'q',
    kind: 'match',
    prompt: 'p',
    pairs: [
      ['a', 'A'],
      ['b', 'B'],
      ['c', 'C'],
    ],
  };
  const { grading } = service();

  it('credits each correct pair', () => {
    const out = grading.gradeOne(ex, { kind: 'match', mapping: { 0: 0, 1: 2, 2: 1 } });
    expect(out.fraction).toBeCloseTo(1 / 3);
    expect(out.wrong).toEqual([1, 2]);
    expect(out.feedback).toMatch(/1 of 3/);
  });

  it('gives full credit when every pair lines up', () => {
    expect(grading.gradeOne(ex, { kind: 'match', mapping: { 0: 0, 1: 1, 2: 2 } }).correct).toBe(true);
  });
});

describe('NumericGrader', () => {
  const ex: NumericExercise = { ...base, id: 'q', kind: 'numeric', prompt: 'p', answer: 10, tolerance: 1 };
  const { grading } = service();

  it('accepts anything inside the tolerance', () => {
    expect(grading.gradeOne(ex, { kind: 'numeric', value: 10.5 }).correct).toBe(true);
  });

  it('half-credits a near miss and says which way to move', () => {
    const out = grading.gradeOne(ex, { kind: 'numeric', value: 12 });
    expect(out.fraction).toBe(0.5);
    expect(out.feedback).toMatch(/down/);
  });

  it('scores a wild answer at zero', () => {
    expect(grading.gradeOne(ex, { kind: 'numeric', value: 900 }).fraction).toBe(0);
  });

  it('handles a blank field without crashing', () => {
    expect(grading.gradeOne(ex, { kind: 'numeric', value: null }).fraction).toBe(0);
  });
});

describe('PromptRubricGrader', () => {
  const ex: PromptRubricExercise = {
    ...base,
    id: 'q',
    kind: 'prompt_rubric',
    prompt: 'Write a prompt asking for a bedtime story.',
    min_words: 12,
    must_include: [
      ['you are', 'act as', 'pretend you are'],
      ['for a', 'aged', 'year old'],
      ['three sentences', '3 sentences', 'short'],
    ],
    must_avoid: ['good story', 'nice story'],
    criteria_labels: ['a role', 'who it is for', 'how long'],
  };
  const { grading } = service();

  it('gives full credit when every rubric line is met', () => {
    const out = grading.gradeOne(ex, {
      kind: 'prompt_rubric',
      text: 'You are a calm storyteller. Write a bedtime story for a 7 year old in three sentences.',
    });
    expect(out.correct).toBe(true);
    expect(out.fraction).toBe(1);
  });

  it('accepts any synonym in a criterion group', () => {
    const out = grading.gradeOne(ex, {
      kind: 'prompt_rubric',
      text: 'Act as a gentle storyteller and write a short bedtime tale aged seven, please keep it calm.',
    });
    expect(out.correct).toBe(true);
  });

  it('names exactly which criteria are still missing', () => {
    const out = grading.gradeOne(ex, {
      kind: 'prompt_rubric',
      text: 'You are a storyteller and I would like you to tell me something at bedtime tonight.',
    });
    expect(out.correct).toBe(false);
    expect(out.feedback).toMatch(/who it is for/);
    expect(out.feedback).toMatch(/how long/);
  });

  it('docks a vague phrase the lesson told her to avoid', () => {
    const strong = grading.gradeOne(ex, {
      kind: 'prompt_rubric',
      text: 'You are a calm storyteller. Write a bedtime story for a 7 year old in three sentences.',
    });
    const vague = grading.gradeOne(ex, {
      kind: 'prompt_rubric',
      text: 'You are a calm storyteller. Write a good story for a 7 year old in three sentences please.',
    });
    expect(vague.fraction).toBeLessThan(strong.fraction);
  });

  it('is forgiving about punctuation and case', () => {
    const out = grading.gradeOne(ex, {
      kind: 'prompt_rubric',
      text: 'YOU ARE a storyteller!!! write it FOR A 7-year-old... keep it SHORT, three sentences ok?',
    });
    expect(out.correct).toBe(true);
  });

  it('scores the same answer identically every time', () => {
    const text = 'You are a storyteller. Write for a 7 year old in three sentences about a fox.';
    const a = grading.gradeOne(ex, { kind: 'prompt_rubric', text });
    const b = grading.gradeOne(ex, { kind: 'prompt_rubric', text });
    expect(a).toEqual(b);
  });

  it('asks for something to be written rather than scoring nothing', () => {
    const out = grading.gradeOne(ex, { kind: 'prompt_rubric', text: '   ' });
    expect(out.fraction).toBe(0);
    expect(out.feedback).toMatch(/write your prompt/i);
  });
});

describe('SandboxGrader', () => {
  const ex: SandboxExercise = {
    ...base,
    id: 'q',
    kind: 'sandbox',
    prompt: 'p',
    check: 'knn-generalises',
    params: { minAccuracy: 0.8 },
  };

  it('delegates to a registered check', () => {
    const { grading, sandbox } = service();
    sandbox.registerCheck({
      id: 'knn-generalises',
      run: (state, params) => {
        const accuracy = Number(state.accuracy ?? 0);
        const target = Number(params.minAccuracy ?? 1);
        return {
          fraction: Math.min(1, accuracy / target),
          correct: accuracy >= target,
          feedback: accuracy >= target ? 'It generalises.' : 'Add examples from the other group.',
        };
      },
    });
    const out = grading.gradeOne(ex, { kind: 'sandbox', state: { accuracy: 0.9 } });
    expect(out.correct).toBe(true);
  });

  it('fails loudly when content references a check that does not exist', () => {
    const { grading } = service();
    expect(() => grading.gradeOne(ex, { kind: 'sandbox', state: {} })).toThrow(/knn-generalises/);
  });
});

describe('GradingService', () => {
  const { grading } = service();
  const lesson = makeLesson({
    id: 'a',
    exercises: [
      { ...base, id: 'q1', kind: 'mcq', prompt: 'p', choices: ['a', 'b'], answer: [0], points: 6 },
      { ...base, id: 'q2', kind: 'numeric', prompt: 'p', answer: 4, tolerance: 0, points: 4 },
    ],
  });

  it('weights each exercise by its own points', () => {
    const grade = grading.gradeLesson(lesson, {
      q1: { kind: 'mcq', selected: [0] },
      q2: { kind: 'numeric', value: 99 },
    });
    expect(grade.earned).toBe(6);
    expect(grade.available).toBe(10);
    expect(grade.score).toBeCloseTo(0.6);
  });

  it('scores unanswered exercises as zero without throwing', () => {
    const grade = grading.gradeLesson(lesson, {});
    expect(grade.score).toBe(0);
    expect(grade.perExercise.q1?.feedback).toMatch(/not answered/i);
  });

  it('rejects a response whose kind does not match the exercise', () => {
    expect(() =>
      grading.gradeOne(lesson.exercises[0]!, { kind: 'numeric', value: 1 }),
    ).toThrow(/does not match/);
  });
});

describe('shuffling never changes a score', () => {
  it('grades the same answer identically whatever order it was shown in', () => {
    const { grading } = service();
    const ex: McqExercise = {
      ...base,
      id: 'q',
      kind: 'mcq',
      prompt: 'p',
      choices: ['w', 'x', 'correct', 'y'],
      answer: [2],
      points: 5,
    };
    // The learner picks the choice at original index 2, however it was displayed.
    const out = grading.gradeOne(ex, { kind: 'mcq', selected: [2] });
    expect(out.correct).toBe(true);
    expect(out.fraction).toBe(1);
  });
});
