import { useContainer, useProgress } from '../hooks/useContainer';
import type { Mood } from '../domain/types';
import { Iskra } from '../ui/comic/cast';
import { InkDefs } from '../ui/comic/ink';

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

      <Taught />

      <p className="rounded-lg border border-line bg-surface p-4 text-sm text-ink-dim">
        Every time you finish a lesson, {state.companionName} gets a little better at the thing you
        just learned. She is not a person and she does not remember you between visits — she is a
        program you are teaching.
      </p>
    </div>
  );
}

const STAGE_MOOD: Record<string, Mood> = {
  spark: 'confused',
  flicker: 'curious',
  steady: 'calm',
  bright: 'proud',
  brilliant: 'excited',
};

/** The same Iskra as in the comics, ringed by one halo per stage she has reached. */
function IskraGlyph({ stage }: { stage: string }) {
  const rings = { spark: 1, flicker: 2, steady: 3, bright: 4, brilliant: 5 }[stage] ?? 1;
  return (
    <>
      <InkDefs />
      <svg viewBox="0 0 120 120" className="mx-auto h-40 w-40" fill="none" role="img" aria-label={`Iskra, stage: ${stage}`}>
        {Array.from({ length: rings }, (_, i) => (
          <circle
            key={i}
            cx="60"
            cy="64"
            r={34 + i * 6}
            stroke="var(--c-spark)"
            strokeWidth="1.5"
            opacity={0.7 - i * 0.12}
            strokeDasharray={i % 2 ? '4 6' : undefined}
          />
        ))}
        <Iskra x={60} y={70} scale={1.35} mood={STAGE_MOOD[stage] ?? 'calm'} />
      </svg>
    </>
  );
}

/**
 * What she has taught Iskra so far, world by world. Progress told as a story,
 * not a third reward to collect — the jigsaw is the reward.
 */
function Taught() {
  const { curriculum } = useContainer();
  const { state, status } = useProgress();
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-lg">What you have taught her</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {curriculum.worlds.map((world) => {
          const lessons = curriculum.lessonsInWorld(world.id);
          const done = lessons.filter(
            (l) => status[l.id] === 'completed' || status[l.id] === 'mastered',
          ).length;
          const all = done === lessons.length;
          return (
            <li key={world.id} className="flex items-center justify-between gap-3 text-sm">
              <span className={all ? 'text-ink' : done > 0 ? 'text-ink-dim' : 'text-ink-faint'}>
                {all ? '\u2713 ' : ''}
                {world.title}
              </span>
              <span className="font-mono text-xs text-ink-faint">
                {(state.hiddenWorlds ?? []).includes(world.id) ? 'put away' : `${done}/${lessons.length}`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
