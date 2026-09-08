/**
 * The pipeline-builder's brain.
 *
 * She is given the steps of a real AI pipeline, shuffled, and has to put them in
 * the order they actually run: something in, the AI decides, something out. It
 * makes the World 5 "a project is a little pipeline" idea concrete by having her
 * build one. Pure and testable.
 */

export interface PipelineStep {
  id: string;
  text: string;
  /** Correct position, 0-based. */
  order: number;
}

/** A few ready-made pipelines she can assemble. */
export const PIPELINES: Record<string, PipelineStep[]> = {
  plant: [
    { id: 'p0', text: 'The soil sensor reads that the soil is dry', order: 0 },
    { id: 'p1', text: 'The reading is sent to the AI helper', order: 1 },
    { id: 'p2', text: 'The AI decides the plant needs water', order: 2 },
    { id: 'p3', text: 'A light blinks to tell you to water it', order: 3 },
  ],
  photo: [
    { id: 'q0', text: 'You give the AI a photo of your toy', order: 0 },
    { id: 'q1', text: 'The AI looks at the photo', order: 1 },
    { id: 'q2', text: 'The AI writes a fun caption', order: 2 },
    { id: 'q3', text: 'The caption appears under the photo', order: 3 },
  ],
};

export interface BuildResult {
  correct: boolean;
  /** How many steps are in their right place. */
  inPlace: number;
  total: number;
}

/** Score an arrangement (array of step ids) against the true order. */
export function scoreArrangement(steps: PipelineStep[], arrangement: string[]): BuildResult {
  const byId = new Map(steps.map((s) => [s.id, s]));
  let inPlace = 0;
  arrangement.forEach((id, position) => {
    const step = byId.get(id);
    if (step && step.order === position) inPlace += 1;
  });
  return { correct: inPlace === steps.length, inPlace, total: steps.length };
}

/** A deterministic shuffle so the puzzle is stable within a session. */
export function shuffled(steps: PipelineStep[], seed = 7): PipelineStep[] {
  const out = [...steps];
  let s = seed;
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  // Guard: if the shuffle happens to be identity, rotate by one.
  if (out.every((step, i) => step.order === i)) out.push(out.shift()!);
  return out;
}
