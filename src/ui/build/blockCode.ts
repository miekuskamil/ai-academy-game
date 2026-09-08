import type { ThemeSpec } from '../../domain/pipeline/blocks';
import type { BlockId } from '../../domain/pipeline/blocks';

/**
 * The real code each block shows.
 *
 * This is not decoration — it is the actual shape of what runs. The prompt block
 * shows her live prompt embedded in the real call; the others show the genuine
 * logic (the check she designed, the agent loop that chains them). Keeping it
 * real is the whole point of "actual working app": she can read exactly what her
 * pipeline does, even though she only edits the prompt.
 */

export function defaultPrompt(theme: ThemeSpec): string {
  return `Write one short, fun ${theme.item} blurb for "{item}". One sentence. Mention the ${theme.item} by name.`;
}

export const BLOCK_CODE: Record<BlockId, (theme: ThemeSpec, prompt: string) => string> = {
  brief: (theme) => `// The client brief — what you are building.
const brief = ${JSON.stringify(theme.brief)};

// Everything downstream serves this one goal.`,

  prompt: (theme, prompt) => `// Your prompt, filled in for each ${theme.item}.
function buildPrompt(item) {
  const template = ${JSON.stringify(prompt)};
  return template.replaceAll("{item}", item);
}`,

  model: (theme) => `// The model turns each prompt into an answer.
async function askModel(prompt) {
  const reply = await model.complete([
    { role: "user", content: prompt },
  ]);
  return reply.trim();
}
// Same call whether it is Ollama on your network
// or a recorded demo — the ${theme.item} blurbs come out here.`,

  check: (theme) => `// Your checker — the eval, in code.
function check(output, item) {
  if (output.length < 8) return fail("Too short.");
  if (output.length > 240) return fail("Too long.");
  if (!output.toLowerCase().includes(item))
    return fail("It never mentions the ${theme.item}.");
  return pass("Real, right length, on topic.");
}`,

  agent: () => `// The agent runs the steps in order, for every item.
async function runPipeline(items) {
  const results = [];
  for (const item of items) {
    const prompt = buildPrompt(item);   // your prompt
    const output = await askModel(prompt); // the model
    const verdict = check(output, item);   // your checker
    results.push({ item, output, verdict });
  }
  return results;
}`,

  result: (theme) => `// The result page, built from what passed the check.
function renderPage(results) {
  return results
    .filter((r) => r.verdict.passed)
    .map((r) => card(r.item, r.output))
    .join("");
}
// One card per ${theme.item}. That is your ${theme.name.toLowerCase()}.`,
};
