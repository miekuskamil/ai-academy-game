import { useMemo, useState } from 'react';
import { useContainer, useProgress } from '../hooks/useContainer';
import { cn } from '../lib/cn';
import { blockById, type BlockId } from '../domain/pipeline/blocks';
import { BlockDetail } from '../ui/build/BlockDetail';
import { ThemePicker } from '../ui/build/ThemePicker';
import { Vault } from '../ui/Vault';

/**
 * The vault page.
 *
 * During the course it is only the jigsaw: earn a piece, place it, watch the
 * picture form. One reward, nothing competing with it. When the picture is
 * complete the finale opens underneath — pick a project and run the pipeline she
 * built, part by part.
 */
export function MachineRoute() {
  const { machine, pipeline } = useContainer();
  const { state } = useProgress();
  const [openBlock, setOpenBlock] = useState<BlockId | null>(null);

  const m = useMemo(() => machine.evaluate(state.records), [machine, state.records]);
  const pipe = useMemo(() => pipeline.evaluate(state.records), [pipeline, state.records]);

  const theme = state.build?.theme ?? null;
  const open = machine.vault(state.records, state.build?.placed ?? []).open;

  return (
    <div className="nrn-enter mx-auto max-w-3xl">
      <header>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">Your vault</p>
        <h1 className="mt-1 text-2xl">
          {m.complete ? 'You built an AI' : 'Build the machine'}
        </h1>
        <p className="mt-2 max-w-reading text-ink-dim">
          {m.complete
            ? 'Every piece is in. Here is what you were building all along.'
            : 'Every lesson earns a jigsaw piece. Place each one yourself — when the last piece clicks in, you will see what the picture really is.'}
        </p>
      </header>

      <div className="mt-6">
        <Vault />
      </div>

      {/* The finale: once the picture is complete, the machine becomes a real
          pipeline she can run. Hidden until then so it never competes with the
          jigsaw as a second reward. */}
      {open && !theme && (
        <div className="mt-8">
          <ThemePicker />
        </div>
      )}
      {open && theme && (
        <section className="mt-8">
          <h2 className="text-lg">Run your AI</h2>
          <p className="mt-1 text-sm text-ink-dim">
            Each part of the picture is a real step of an AI pipeline. Open one to see it work.
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
