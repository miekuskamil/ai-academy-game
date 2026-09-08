import { useMemo, useState } from 'react';
import { useContainer, useProgress } from '../hooks/useContainer';
import { cn } from '../lib/cn';
import { blockById, type BlockId } from '../domain/pipeline/blocks';
import { BlockDetail } from '../ui/build/BlockDetail';
import { ThemePicker } from '../ui/build/ThemePicker';
import { Vault } from '../ui/Vault';

/**
 * The machine, up close.
 *
 * The persistent strip is the teaser; this is where she comes to look properly.
 * Early on it shows the assembling contraption and the latest hint — deliberately
 * short on explanation, to keep the mystery. Once enough is built she can pick
 * what she is making, and the parts double as the real, runnable pipeline blocks
 * she can open, read, and run.
 */
export function MachineRoute() {
  const { machine, pipeline } = useContainer();
  const { state } = useProgress();
  const [openBlock, setOpenBlock] = useState<BlockId | null>(null);

  const m = useMemo(() => machine.evaluate(state.records), [machine, state.records]);
  const pipe = useMemo(() => pipeline.evaluate(state.records), [pipeline, state.records]);

  const theme = state.build?.theme ?? null;
  const anyBlockUnlocked = pipe.blocks.some((b) => b.unlocked);

  // Once she has a real block to work with, offer to name the project — but only
  // once, and never before there is anything to build.
  if (anyBlockUnlocked && !theme && m.built >= 4) {
    return <ThemePicker />;
  }

  return (
    <div className="nrn-enter mx-auto max-w-3xl">
      <header>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">Your vault</p>
        <h1 className="mt-1 text-2xl">
          {m.complete ? 'You built an AI' : 'Build the machine'}
        </h1>
        <p className="mt-2 max-w-reading text-ink-dim">
          Every lesson earns a piece. Place each one yourself to build the machine — when the last
          piece clicks in, you will see what it really is.
        </p>
      </header>

      <div className="mt-6">
        <Vault />
      </div>

      {/* The pipeline blocks become openable once unlocked — the machine is the
          pipeline, so a "part" and a "block" are the same thing seen two ways. */}
      {anyBlockUnlocked && (
        <section className="mt-8">
          <h2 className="text-lg">Open a part</h2>
          <p className="mt-1 text-sm text-ink-dim">
            {theme
              ? 'Each built section is a real piece of your pipeline. Open one to see how it works.'
              : 'Finish a few more lessons to start shaping what your machine makes.'}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pipe.blocks.map((block) => (
              <li key={block.spec.id}>
                <button
                  type="button"
                  disabled={!block.unlocked}
                  onClick={() => setOpenBlock(block.spec.id)}
                  className={cn(
                    'nrn-press w-full rounded-lg border p-3 text-left',
                    block.unlocked
                      ? 'border-spark bg-spark/5'
                      : 'border-dashed border-line opacity-60',
                  )}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                    {block.unlocked ? 'Built' : 'Locked'}
                  </span>
                  <span className="mt-1 block font-display text-sm text-ink">
                    {block.unlocked ? block.spec.title : '???'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {openBlock && (
        <BlockDetail
          block={blockById(openBlock)}
          unlocked={pipe.blocks.find((b) => b.spec.id === openBlock)?.unlocked ?? false}
          onClose={() => setOpenBlock(null)}
        />
      )}
    </div>
  );
}
