import { Link } from '../lib/router';
import type { InkName, Lesson } from '../domain/types';
import type { LessonStatus } from '../domain/progress/state';
import { useContainer, useProgress } from '../hooks/useContainer';
import { cn } from '../lib/cn';

const INK: Record<InkName, string> = {
  blue: 'var(--c-data)',
  pink: 'var(--c-anomaly)',
  green: 'var(--c-verified)',
  yellow: 'var(--c-spark)',
};

/**
 * The skill map.
 *
 * One vertical spine per world, which reads as a scrolling path on a handset
 * and as a set of columns on a wider screen. Both render from the same
 * `UnlockPolicy` output — the layout is a view, never a second source of truth
 * about what is open.
 */
export function MapRoute() {
  const { curriculum } = useContainer();
  const { status, state, level } = useProgress();

  const next = curriculum.nextOpen(status, state.track, state.hiddenWorlds);
  const fresh = Object.keys(state.records).length === 0;

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-2xl">
          {state.learnerName ? `${state.learnerName}'s map` : 'Your map'}
        </h1>

        {/* Shown once, to someone who has never opened this before. Everything
            after this point assumes she knows why she is here. */}
        {fresh ? (
          <div className="nrn-enter mt-4 max-w-reading rounded-lg border border-spark/30 bg-spark/5 p-5">
            <p className="text-lg leading-relaxed">
              AI is turning up in nearly everything now, and almost nobody learns how to actually
              use it well. You are about to — properly.
            </p>
            <p className="mt-3 text-ink-dim">
              You will start by talking to AI and getting real answers out of it. Then you will learn
              why it works, when to trust it, how to build real things with it, and how to put it to
              work. Along the way you will be teaching Iskra, who is not very good yet. That is rather
              the point.
            </p>
            <p className="mt-3 text-ink-dim">
              Six worlds, twenty lessons. Take as long as you like — nothing here is timed and
              nothing is ever taken away from you.
            </p>
          </div>
        ) : (
          <p className="mt-2 max-w-reading text-ink-dim">
            Six worlds, one after another. Finish a lesson and the next one opens.
          </p>
        )}
        {next && (
          <Link
            to={`/lesson/${next.id}`}
            className="nrn-press tap-target mt-4 inline-flex gap-2 rounded-md bg-spark px-4 text-sm font-bold text-ground-deep"
          >
            {fresh ? `Start here: ${next.title}` : `Carry on: ${next.title}`}
          </Link>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {curriculum.worlds
          .filter((world) => !(state.hiddenWorlds ?? []).includes(world.id))
          .map((world, shownIndex, shown) => {
          const lessons = curriculum
            .lessonsInWorld(world.id)
            .filter((lesson) => lesson.tracks.includes(state.track));
          const done = lessons.filter(
            (lesson) => status[lesson.id] === 'completed' || status[lesson.id] === 'mastered',
          ).length;
          const reachable = lessons.some((lesson) => status[lesson.id] !== 'locked');

          return (
            <section
              key={world.id}
              className={cn(
                'nrn-stagger rounded-lg border border-line bg-surface p-4',
                !reachable && 'opacity-80',
              )}
              style={
                {
                  borderTopColor: INK[world.ink],
                  borderTopWidth: 3,
                  '--i': world.index,
                } as React.CSSProperties
              }
            >
              <header className="mb-3">
                <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">
                  World {world.index} · {done}/{lessons.length}
                </p>
                <h2 className="mt-1 text-lg">{world.title}</h2>
                <p className="mt-1 text-sm text-ink-dim">{world.tagline}</p>
                {/* One clear line instead of a column of "Locked" labels. */}
                {!reachable && shownIndex > 0 && (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-ink-dim">
                    <span aria-hidden="true">🔒</span> Opens after World {shown[shownIndex - 1]!.index}
                  </p>
                )}
              </header>

              <ol className="flex flex-col">
                {lessons.map((lesson, index) => (
                  <MapNode
                    key={lesson.id}
                    lesson={lesson}
                    status={status[lesson.id] ?? 'locked'}
                    ink={INK[world.ink]}
                    last={index === lessons.length - 1}
                  />
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <p className="font-mono text-xs text-ink-faint">Level {level.level}</p>
    </div>
  );
}

function MapNode({
  lesson,
  status,
  ink,
  last,
}: {
  lesson: Lesson;
  status: LessonStatus;
  ink: string;
  last: boolean;
}) {
  const locked = status === 'locked';
  const cleared = status === 'completed' || status === 'mastered';

  const body = (
    <>
      {/* Node and edge: the same vocabulary as the level indicator. */}
      <span aria-hidden="true" className="relative flex w-6 shrink-0 flex-col items-center self-stretch">
        <span
          className={cn('mt-3 h-3 w-3 shrink-0 rounded-full border-2', cleared && 'nrn-cleared')}
          style={
            {
              borderColor: locked ? 'var(--c-line)' : ink,
              background: cleared ? ink : 'var(--c-ground-deep)',
              boxShadow: status === 'mastered' ? `0 0 10px ${ink}` : undefined,
              '--ink': ink,
            } as React.CSSProperties
          }
        />
        {!last && <span className="w-px flex-1 bg-line" />}
      </span>

      <span className="flex-1 pb-3 pt-1">
        <span className={cn('block text-sm', locked ? 'text-ink-dim' : 'text-ink')}>
          {lesson.title}
          {locked && <span className="sr-only"> (not open yet)</span>}
        </span>
        {!locked && (
          <span className="mt-0.5 block text-xs text-ink-faint">
            {status === 'mastered'
              ? '\u2605 Done with no hints'
              : status === 'completed'
                ? '\u2713 Done'
                : `Next up · ${lesson.minutes} min`}
          </span>
        )}
      </span>
    </>
  );

  if (locked) {
    return (
      <li className="flex gap-2" aria-disabled="true">
        {body}
      </li>
    );
  }

  return (
    <li>
      <Link
        to={`/lesson/${lesson.id}`}
        className="flex gap-2 rounded-md transition-colors duration-fast ease-ease hover:bg-surface-hi"
      >
        {body}
      </Link>
    </li>
  );
}
