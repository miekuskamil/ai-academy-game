import { describe, expect, it } from 'vitest';
import {
  classify,
  evaluate,
  accuracy,
  trueLabel,
  boundaryDistance,
  testPoints,
  type LabelledPoint,
} from './knn';

const left: LabelledPoint[] = [
  { x: 0.1, y: 0.2, label: 0 },
  { x: 0.15, y: 0.6, label: 0 },
  { x: 0.05, y: 0.9, label: 0 },
];
const right: LabelledPoint[] = [
  { x: 0.9, y: 0.2, label: 1 },
  { x: 0.85, y: 0.6, label: 1 },
  { x: 0.95, y: 0.9, label: 1 },
];

describe('classify', () => {
  it('says nothing when it has seen nothing', () => {
    expect(classify([], { x: 0.5, y: 0.5 })).toBeNull();
  });

  it('goes with the nearest examples', () => {
    const training = [...left, ...right];
    expect(classify(training, { x: 0.12, y: 0.3 })).toBe(0);
    expect(classify(training, { x: 0.88, y: 0.3 })).toBe(1);
  });

  it('breaks a tie deterministically, so a retry gives the same answer', () => {
    const training: LabelledPoint[] = [
      { x: 0.4, y: 0.5, label: 0 },
      { x: 0.6, y: 0.5, label: 1 },
    ];
    const first = classify(training, { x: 0.45, y: 0.5 }, 2);
    expect(first).toBe(0);
    expect(classify(training, { x: 0.45, y: 0.5 }, 2)).toBe(first);
  });

  it('copes with k larger than the training set', () => {
    expect(classify(left, { x: 0.5, y: 0.5 }, 99)).toBe(0);
  });
});

describe('the hidden pattern', () => {
  it('splits the field into two sides', () => {
    expect(trueLabel({ x: 0.05, y: 0.5 })).toBe(0);
    expect(trueLabel({ x: 0.95, y: 0.5 })).toBe(1);
  });

  it('is curved, so two dots cannot capture it', () => {
    // If the boundary were straight, it would sit at the same x for every y.
    const xs = [0.1, 0.4, 0.7].map((y) => 0.5 + 0.26 * Math.sin(y * Math.PI * 2.2));
    expect(new Set(xs.map((x) => x.toFixed(2))).size).toBeGreaterThan(1);
  });

  it('reports how awkward a point is', () => {
    expect(boundaryDistance({ x: 0.5, y: 0 })).toBeLessThan(0.05);
    expect(boundaryDistance({ x: 0.02, y: 0 })).toBeGreaterThan(0.4);
  });
});

describe('the test set', () => {
  it('is the same ten dots every time, so attempts can be compared', () => {
    expect(testPoints()).toHaveLength(10);
    expect(testPoints()).toEqual(testPoints());
  });

  it('puts about half the dots in the awkward middle', () => {
    const hard = testPoints().filter((p) => boundaryDistance(p) < 0.18).length;
    expect(hard).toBeGreaterThanOrEqual(5);
  });
});

describe('training outcomes', () => {
  it('scores zero when nothing has been taught', () => {
    expect(accuracy(evaluate([], testPoints()))).toBe(0);
  });

  it('rewards examples placed where the two colours meet', () => {
    // Four far-apart corner dots: the easy, lazy answer.
    const lazy: LabelledPoint[] = [
      { x: 0.05, y: 0.05, label: 0 },
      { x: 0.05, y: 0.95, label: 0 },
      { x: 0.95, y: 0.05, label: 1 },
      { x: 0.95, y: 0.95, label: 1 },
    ];
    // The same four, plus examples tracing the boundary itself.
    const careful: LabelledPoint[] = [...lazy];
    for (const y of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const edge = 0.5 + 0.26 * Math.sin(y * Math.PI * 2.2);
      careful.push({ x: edge - 0.07, y, label: 0 });
      careful.push({ x: edge + 0.07, y, label: 1 });
    }

    const lazyScore = accuracy(evaluate(lazy, testPoints()));
    const carefulScore = accuracy(evaluate(careful, testPoints()));

    // The lazy answer must not clear the 0.8 bar, or the lesson teaches nothing.
    expect(lazyScore).toBeLessThan(0.8);
    expect(carefulScore).toBeGreaterThan(lazyScore);
    expect(carefulScore).toBeGreaterThanOrEqual(0.8);
  });

  it('marks each test dot right or wrong against the hidden pattern', () => {
    const outcomes = evaluate([...left, ...right], testPoints());
    expect(outcomes).toHaveLength(10);
    for (const outcome of outcomes) {
      expect(outcome.correct).toBe(outcome.guess === outcome.expected);
      expect(outcome.expected).toBe(trueLabel(outcome.point));
    }
  });
});
