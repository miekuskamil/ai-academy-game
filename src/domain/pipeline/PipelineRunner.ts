import type { IAIProvider } from '../ai/IAIProvider';
import type { ThemeSpec } from './blocks';

/**
 * Running the pipeline she assembled.
 *
 * The pipeline is real: her prompt, with her examples, actually goes to a model
 * when one is connected, and her checker actually runs on the output. When no
 * model is connected it plays a *recorded* run of the same shape, so the whole
 * thing demonstrates end to end with nothing plugged in — nobody is ever blocked
 * by not having a model, and the code on screen is the same either way.
 *
 * She edits prompts and examples only. The surrounding logic here is real and
 * visible but not editable, which keeps it safe without pretending it is fake.
 */

export interface PipelineInput {
  /** The client brief — what she is asking the AI to help build. */
  brief: string;
  /** Her prompt template. `{item}` is replaced per item. */
  prompt: string;
  /** The example items to run through the pipeline. */
  items: string[];
  theme: ThemeSpec;
}

export interface ItemResult {
  item: string;
  /** What the model produced for this item. */
  output: string;
  /** Whether the checker passed it. */
  passed: boolean;
  /** Why it passed or failed, in kid-friendly words. */
  note: string;
  /** True when this came from the recorded demo, not a live model. */
  recorded: boolean;
}

export interface RunResult {
  items: ItemResult[];
  live: boolean;
}

/** The check every output must pass — the eval, shaped for a 10-year-old. */
export function runCheck(output: string, item: string): { passed: boolean; note: string } {
  const trimmed = output.trim();
  if (trimmed.length < 8) {
    return { passed: false, note: 'Too short — a good blurb says something real.' };
  }
  if (trimmed.length > 240) {
    return { passed: false, note: 'A bit long — the checker wants something snappy.' };
  }
  // A weak but honest relevance check: the blurb should mention the item.
  const mentionsItem = trimmed.toLowerCase().includes(item.toLowerCase().split(' ')[0]!);
  if (!mentionsItem) {
    return { passed: false, note: `It never mentions the ${item}. The checker caught that.` };
  }
  return { passed: true, note: 'Says something real, the right length, and on topic.' };
}

/** Fill a prompt template with one item. */
export function fillPrompt(template: string, item: string): string {
  return template.replaceAll('{item}', item);
}

export class PipelineRunner {
  constructor(private readonly ai: IAIProvider) {}

  /**
   * Run every item through prompt → model → check.
   *
   * Live when a model is connected; otherwise a recorded demo of the same
   * shape, clearly labelled as recorded so nothing is pretended.
   */
  async run(input: PipelineInput, signal?: AbortSignal): Promise<RunResult> {
    const live = this.ai.capabilities().available;

    const items: ItemResult[] = [];
    for (const item of input.items) {
      const output = live
        ? await this.ai.complete([{ role: 'user', content: fillPrompt(input.prompt, item) }], signal)
        : recordedOutput(item, input.theme);
      const { passed, note } = runCheck(output, item);
      items.push({ item, output: output.trim(), passed, note, recorded: !live });
    }

    return { items, live };
  }
}

/**
 * A believable canned answer per item, used when no model is connected.
 *
 * Deliberately plain and a little imperfect — one item is written to *fail* the
 * checker, so the demo shows the check doing its job rather than a suspiciously
 * perfect run.
 */
function recordedOutput(item: string, theme: ThemeSpec): string {
  const first = item.toLowerCase().split(' ')[0]!;
  const templates: Record<string, string> = {
    toys: `This ${first} is a firm favourite — bright, well-loved, and always first out of the box.`,
    photos: `A lovely shot of the ${first}, caught in warm light with plenty of character.`,
    pets: `Meet ${item}: friendly, a little cheeky, and happiest when there is something to chase.`,
    games: `${item} is a brilliant pick for a rainy afternoon — easy to learn, hard to put down.`,
  };
  // Make the very first demo item fail the check on purpose, to show the eval.
  if (first === 'broken' || item.startsWith('(demo-fail)')) return 'nice';
  return templates[theme.id] ?? `A neat little blurb about the ${first}.`;
}
