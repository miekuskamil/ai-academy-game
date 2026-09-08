import { useContainer, useProgress } from '../hooks/useContainer';
import { cn } from '../lib/cn';

const STAGE_COPY: Record<string, string> = {
  spark: 'Barely lit. She guesses a lot and gets things wrong.',
  flicker: 'Steadier. She has seen enough examples to notice patterns.',
  steady: 'She can explain why she thinks something, not just what.',
  bright: 'She checks her own answers before she gives them.',
  brilliant: 'She plans, uses tools, and admits when she does not know.',
};

/**
 * Iskra's page.
 *
 * The companion is deliberately flawed and improves as the learner does, which
 * is what turns each concept into a bug the learner owns rather than a
 * definition handed down.
 */
export function CompanionRoute() {
  const { narrative } = useContainer();
  const { level, state, status } = useProgress();
  const stage = narrative.stageFor(level.level);
  const cleared = Object.values(status).filter((s) => s === 'completed' || s === 'mastered').length;
  const mastered = Object.values(status).filter((s) => s === 'mastered').length;

  return (
    <div className="nrn-enter mx-auto flex max-w-reading flex-col gap-6">
      <header className="text-center">
        <IskraGlyph stage={stage} />
        <h1 className="mt-4 text-2xl">{state.companionName}</h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-spark">{stage}</p>
        <p className="mt-3 text-ink-dim">{STAGE_COPY[stage]}</p>
      </header>

      <dl className="grid grid-cols-3 gap-3 text-center">
        {[
          ['Level', String(level.level)],
          ['Lessons done', String(cleared)],
          ['Mastered', String(mastered)],
        ].map(([label, value], i) => (
          <div
            key={label}
            className="nrn-stagger rounded-lg border border-line bg-surface p-4"
            style={{ '--i': i } as React.CSSProperties}
          >
            <dt className="text-xs text-ink-faint">{label}</dt>
            <dd className="mt-1 font-mono text-xl text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <BadgeShelf />

      <p className="rounded-lg border border-line bg-surface p-4 text-sm text-ink-dim">
        Every time you finish a lesson, {state.companionName} gets a little better at the thing you
        just learned. She is not a person and she does not remember you between visits — she is a
        program you are teaching.
      </p>
    </div>
  );
}

function IskraGlyph({ stage }: { stage: string }) {
  const rings = { spark: 1, flicker: 2, steady: 3, bright: 4, brilliant: 5 }[stage] ?? 1;
  return (
    <svg viewBox="0 0 120 120" className="mx-auto h-32 w-32" fill="none" role="img" aria-label={`Stage: ${stage}`}>
      {Array.from({ length: rings }, (_, i) => (
        <circle
          key={i}
          cx="60"
          cy="60"
          r={16 + i * 9}
          stroke="var(--c-spark)"
          strokeWidth="1.5"
          opacity={0.85 - i * 0.14}
          strokeDasharray={i % 2 ? '4 6' : undefined}
        />
      ))}
      <circle cx="60" cy="60" r="9" fill="var(--c-spark)" className={cn(rings > 2 && 'animate-[nrn-fire_2.4s_ease-in-out_infinite]')} />
    </svg>
  );
}

/**
 * The badges she has collected — one per world, earned by completing the
 * pipeline block that world unlocks. A quiet trophy shelf, not a points display:
 * the reward is the pipeline coming together, the badge just marks it.
 */
function BadgeShelf() {
  const { pipeline } = useContainer();
  const { state } = useProgress();
  const pipe = pipeline.evaluate(state.records);
  const earned = new Set(pipe.badges.map((b) => b.id));

  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-lg">Badges</h2>
      <p className="mt-1 text-sm text-ink-dim">
        One for each part of the pipeline you build. {pipe.badges.length} of {pipe.blocks.length} so
        far.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pipe.blocks.map((block, i) => {
          const has = earned.has(block.spec.badge.id);
          return (
            <li
              key={block.spec.badge.id}
              className={cn(
                'nrn-stagger flex flex-col items-center rounded-lg border p-3 text-center',
                has ? 'border-spark bg-spark/5' : 'border-dashed border-line opacity-60',
              )}
              style={{ '--i': i } as React.CSSProperties}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-full text-lg',
                  has ? 'bg-spark text-ground-deep' : 'bg-ground-deep text-ink-faint',
                )}
              >
                {has ? '\u2605' : '\u25cb'}
              </span>
              <span className="mt-2 text-xs font-bold text-ink">{block.spec.badge.name}</span>
              <span className="mt-1 text-[11px] text-ink-faint">
                {has ? block.spec.badge.earnedFor : 'Locked'}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
