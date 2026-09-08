import { useState } from 'react';
import { useContainer } from '../../hooks/useContainer';
import { useProgress } from '../../hooks/useContainer';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/cn';
import { themeById, type BlockSpec } from '../../domain/pipeline/blocks';
import { PipelineRunner, type RunResult } from '../../domain/pipeline/PipelineRunner';
import { BLOCK_CODE, defaultPrompt } from './blockCode';

/**
 * A single pipeline block, opened up.
 *
 * Every block shows its *real* code — the actual prompt, the actual check, the
 * actual chaining logic — so "it is real, not fake" is something she can see for
 * herself. The prompt block is the one she can edit, and only the prompt and its
 * examples: the surrounding logic stays read-only but visible. The prompt and
 * result blocks can be run, live if a model is connected and as a recorded demo
 * otherwise.
 */
export function BlockDetail({
  block,
  unlocked,
  onClose,
}: {
  block: BlockSpec;
  unlocked: boolean;
  onClose: () => void;
}) {
  const { progress, ai } = useContainer();
  const { state } = useProgress();
  const theme = themeById((state.build?.theme ?? 'toys') as never);

  const editable = block.id === 'prompt';
  const runnable = block.id === 'prompt' || block.id === 'result';

  const [prompt, setPrompt] = useState(state.build?.prompt ?? defaultPrompt(theme));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const savePrompt = (value: string) => {
    setPrompt(value);
    progress.setBuild({ prompt: value });
  };

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const runner = new PipelineRunner(ai);
      const items = demoItems(theme.item);
      const out = await runner.run({ brief: theme.brief, prompt, items, theme });
      setResult(out);
    } finally {
      setRunning(false);
    }
  };

  const code = BLOCK_CODE[block.id](theme, prompt);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ground-deep/70 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-label={block.title}
      onClick={onClose}
    >
      <div
        className="nrn-enter max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-xl border border-line bg-surface p-5 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-spark">
              {block.badge.name}
            </p>
            <h2 className="mt-1 text-xl">{block.title}</h2>
            <p className="mt-1 text-sm text-ink-dim">{block.summary}</p>
          </div>
          <Button tone="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {!unlocked ? (
          <p className="mt-5 rounded-md border border-dashed border-line p-4 text-sm text-ink-dim">
            This block unlocks when you finish {block.unlockedBy.replace(/-/g, ' ')}.
          </p>
        ) : (
          <>
            {editable && (
              <div className="mt-5">
                <label className="font-mono text-xs uppercase tracking-wide text-ink-faint">
                  Your prompt — this is the real thing that gets sent
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => savePrompt(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-y rounded-md border border-line bg-ground-deep p-3 text-sm text-ink"
                  spellCheck
                />
                <p className="mt-1 text-xs text-ink-faint">
                  Use <span className="font-mono text-data">{'{item}'}</span> where each{' '}
                  {theme.item} name should go.
                </p>
              </div>
            )}

            <div className="mt-5">
              <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">
                {editable ? 'The code around your prompt (read-only)' : 'The real code (read-only)'}
              </p>
              <pre className="mt-2 overflow-x-auto rounded-md border border-line bg-ground-deep p-3 text-xs leading-relaxed text-ink-dim">
                <code>{code}</code>
              </pre>
            </div>

            {runnable && (
              <div className="mt-5">
                <Button onClick={run} disabled={running}>
                  {running ? 'Running…' : ai.capabilities().available ? 'Run it live' : 'Run the demo'}
                </Button>
                {!ai.capabilities().available && (
                  <p className="mt-2 text-xs text-ink-faint">
                    No model is connected, so this plays a recorded run. A grown-up can connect one in
                    settings.
                  </p>
                )}
                {result && <RunOutput result={result} />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RunOutput({ result }: { result: RunResult }) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="text-xs text-ink-faint">
        {result.live ? 'Live from the model' : 'Recorded demo run'} · the checker ran on each one
      </p>
      {result.items.map((item) => (
        <div
          key={item.item}
          className={cn(
            'rounded-md border p-3 text-sm',
            item.passed ? 'border-verified/40 bg-verified/5' : 'border-anomaly/40 bg-anomaly/5',
          )}
        >
          <p className="font-display text-ink">{item.item}</p>
          <p className="mt-1 text-ink-dim">{item.output}</p>
          <p className={cn('mt-2 text-xs', item.passed ? 'text-verified' : 'text-anomaly')}>
            {item.passed ? '✓ ' : '✗ '}
            {item.note}
          </p>
        </div>
      ))}
    </div>
  );
}

/** A few example items to run, themed. One is written to fail the check. */
function demoItems(item: string): string[] {
  const sets: Record<string, string[]> = {
    toy: ['red racing car', 'fluffy teddy bear', '(demo-fail) puzzle'],
    photo: ['sunset over the sea', 'the birthday cake', '(demo-fail) dog'],
    pet: ['Biscuit the hamster', 'Nala the cat', '(demo-fail) fish'],
    game: ['Chess', 'Snakes and Ladders', '(demo-fail) tag'],
  };
  return sets[item] ?? ['first thing', 'second thing', '(demo-fail) third'];
}
