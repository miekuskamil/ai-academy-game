import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from '../lib/router';
import type { ExerciseResponse, SandboxState } from '../domain/types';
import type { BadgeSpec } from '../domain/pipeline/blocks';
import { RewardSplash } from '../ui/RewardSplash';
import type { GradeOutcome } from '../domain/grading';
import { COMPLETE_AT, MASTER_AT } from '../domain/progress/state';
import { useContainer, useProgress } from '../hooks/useContainer';
import { ComicPlayer } from '../ui/ComicPlayer';
import { ExerciseView } from '../ui/ExerciseView';
import { sandboxFor } from '../ui/sandboxes';
import { Prop } from '../ui/comic/props';
import { InkDefs } from '../ui/comic/ink';
import { shuffled } from '../lib/shuffle';
import { Button } from '../ui/primitives/Button';
import { EmptyState } from '../ui/EmptyState';
import { cn } from '../lib/cn';

type Stage = 'open' | 'play' | 'teach' | 'name' | 'stretch' | 'close';

const STAGE_LABEL: Record<Stage, string> = {
  open: 'Watch',
  play: 'Try',
  teach: 'Learn',
  name: 'Recap',
  stretch: 'Test',
  close: 'Done',
};

/**
 * One lesson, in the order the pedagogy requires:
 *
 *   open    a comic where Iskra gets it wrong        (concrete)
 *   play    hands on, no jargon                      (visual)
 *   name    the actual terminology, only now         (symbolic)
 *   stretch exercises
 *   close   a comic that closes the loop
 *
 * Terminology is deliberately last. A learner should have felt the idea before
 * anyone gives it a name.
 */
/** Where the opening comic hands off to, depending on what the lesson has. */
function firstTeachingStage(
  lesson: { play: string; teach?: unknown[] },
  puzzleMode: import('../domain/progress/state').PuzzleMode = 'full',
): Stage {
  if (lesson.play !== 'none' && puzzleMode !== 'off') return 'play';
  if (lesson.teach && lesson.teach.length > 0) return 'teach';
  return 'name';
}

/** A prop drawn small, beside a teaching step. Props are authored around a
 *  translated origin spanning roughly ±52 x and -22..52 y, so the viewBox and
 *  translate below are sized to contain that, not the 0,0 corner. */
function TeachProp({ kind }: { kind: import('../domain/types').PropKind }) {
  return (
    <svg viewBox="0 0 120 80" className="h-14 w-24 shrink-0" aria-hidden="true">
      <InkDefs />
      <Prop kind={kind} mood="calm" x={60} y={40} order={0} />
    </svg>
  );
}

export function LessonRoute() {
  const { lessonId } = useParams();
  const { curriculum, grading, progress, machine, pipeline } = useContainer();
  const { status, state: progressState } = useProgress();
  const puzzleMode = progressState.puzzleMode ?? 'full';
  const navigate = useNavigate();

  const lesson = lessonId ? curriculum.lesson(lessonId) : undefined;

  const [stage, setStageRaw] = useState<Stage>('open');
  // The furthest stage reached. Going back to a tutorial page must not lower it,
  // so revisiting never re-locks what was already unlocked.
  const [reached, setReached] = useState<Stage>('open');
  // Where the learner was before jumping back to recap. Lets them return to
  // exactly where they left off instead of walking the whole lesson again.
  const [returnTo, setReturnTo] = useState<Stage | null>(null);
  const STAGE_ORDER: Stage[] = ['open', 'play', 'teach', 'name', 'stretch', 'close'];
  const setStage = (next: Stage) => {
    // A normal forward step clears any pending "return" — this is the new place.
    setReturnTo(null);
    setStageRaw(next);
    setReached((far) =>
      STAGE_ORDER.indexOf(next) > STAGE_ORDER.indexOf(far) ? next : far,
    );
  };
  // Jump back to recap, remembering where to come back to.
  const recapAt = (target: Stage) => {
    setReturnTo((current) => current ?? stage);
    setStageRaw(target);
  };
  const returnFromRecap = () => {
    if (returnTo) {
      setStageRaw(returnTo);
      setReturnTo(null);
    }
  };
  const [responses, setResponses] = useState<Record<string, ExerciseResponse>>({});
  const [outcomes, setOutcomes] = useState<Record<string, GradeOutcome>>({});
  const [hints, setHints] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ score: number; unaided: boolean } | null>(null);
  // What this lesson just earned, for the celebration splash on the Done screen.
  const [reward, setReward] = useState<{ partIndex: number; badge: BadgeSpec | null } | null>(null);
  // What she built in the workbench. Sandbox exercises are answered by doing,
  // not by typing, so their response is whatever the sandbox last reported.
  const [sandboxState, setSandboxState] = useState<SandboxState | null>(null);
  // Changes once per attempt. Reordering questions and answers by this seed
  // stops anything being memorised by position, without reshuffling mid-answer.
  const [attemptSeed, setAttemptSeed] = useState(() => Math.floor(Math.random() * 1e9));

  // Questions in this attempt's order. Sandbox exercises stay put (there is
  // nothing positional to memorise), only the quiz questions are reordered.
  const shuffledExercises = useMemo(() => {
    if (!lesson) return [];
    const fixed = lesson.exercises.filter((e) => e.kind === 'sandbox');
    const quiz = lesson.exercises.filter((e) => e.kind !== 'sandbox');
    return [...fixed, ...shuffled(quiz, attemptSeed)];
  }, [lesson, attemptSeed]);

  const Workbench = lesson ? sandboxFor(lesson.play) : undefined;

  if (!lesson) {
    return (
      <EmptyState title="No lesson here" action={<Button onClick={() => navigate('/map')}>Back to the map</Button>}>
        That link does not point at a lesson in this build.
      </EmptyState>
    );
  }

  if (status[lesson.id] === 'locked') {
    return (
      <EmptyState title="Not open yet" action={<Button onClick={() => navigate('/map')}>See the map</Button>}>
        Finish what comes before this one and it will open.
      </EmptyState>
    );
  }

  // Anything this build cannot grade is shown as a note, never as a question
  // she is expected to answer.
  const askable = shuffledExercises.filter((exercise) => grading.canGrade(exercise));
  const answered = askable.filter(
    (exercise) => responses[exercise.id] || (exercise.kind === 'sandbox' && sandboxState),
  ).length;

  const check = () => {
    // Work done in the play stage counts as the answer to any sandbox exercise
    // she has not touched again during the questions.
    const withSandbox = { ...responses };
    if (sandboxState) {
      for (const exercise of askable) {
        if (exercise.kind === 'sandbox' && !withSandbox[exercise.id]) {
          withSandbox[exercise.id] = { kind: 'sandbox', state: sandboxState };
        }
      }
    }
    const grade = grading.gradeLesson(lesson, withSandbox);
    setOutcomes(grade.perExercise);

    const everyCorrect = askable.every((e) => grade.perExercise[e.id]?.correct);
    if (!everyCorrect && grade.score < COMPLETE_AT) return; // let her fix it first

    const unaided = hints.size === 0;

    // Snapshot the machine and badges before recording, so we can celebrate
    // exactly what this lesson earned: a new part always, a badge if this was
    // the lesson that finished a world.
    const before = machine.evaluate(progress.snapshot().state.records);
    const badgesBefore = new Set(
      pipeline.evaluate(progress.snapshot().state.records).badges.map((b) => b.id),
    );
    const wasCleared = before.built;

    progress.record({ lessonId: lesson.id, score: grade.score, usedHints: !unaided });

    const after = machine.evaluate(progress.snapshot().state.records);
    const newBadge = pipeline
      .evaluate(progress.snapshot().state.records)
      .badges.find((b) => !badgesBefore.has(b.id));

    setResult({ score: grade.score, unaided });
    // Only celebrate when a part actually clicked in (a first clear, not a retry).
    if (after.built > wasCleared) {
      setReward({ partIndex: after.built - 1, badge: newBadge ?? null });
    }
    setStage('close');
  };

  return (
    <article className="nrn-enter mx-auto max-w-reading">
      <header className="mb-5">
        <Link to="/map" className="font-mono text-xs uppercase tracking-wide text-ink-faint hover:text-ink-dim">
          ← {curriculum.world(lesson.world)?.title ?? 'Map'}
        </Link>
        <h1 className="mt-2 text-2xl">{lesson.title}</h1>
        {/* The warm framing comes first. An objective stated at a ten-year-old
            before she knows why she should care is just homework. */}
        {lesson.intro && <p className="mt-3 text-lg leading-relaxed">{lesson.intro}</p>}
        <p className="mt-3 font-mono text-xs uppercase tracking-wide text-ink-faint">
          By the end · {lesson.goal}
        </p>
      </header>

      <StageTrack stage={stage} reached={reached} onJump={recapAt} />

      {returnTo && stage !== returnTo && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-spark/40 bg-spark/5 p-3">
          <p className="text-sm text-ink-dim">
            Just having a recap? You can jump straight back to where you were.
          </p>
          <Button className="ml-auto" onClick={returnFromRecap}>
            Back to {STAGE_LABEL[returnTo]}
          </Button>
        </div>
      )}

      {stage === 'open' && (
        <ComicPlayer
          comic={lesson.open_comic}
          onFinish={() => setStage(firstTeachingStage(lesson, puzzleMode))}
          finishLabel={lesson.play === 'none' ? 'So what is going on?' : 'Try it yourself'}
        />
      )}

      {stage === 'play' && (
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-lg">Your turn</h2>
          <p className="mt-2 text-ink-dim">
            {lesson.play_brief ??
              'Have a go yourself before anyone explains it. Getting it wrong here is the point.'}
          </p>
          <div className="mt-4">
            {Workbench ? (
              <Workbench onState={setSandboxState} />
            ) : (
              <p className="rounded-md border border-dashed border-line p-4 text-sm text-ink-faint">
                The <span className="font-mono text-data">{lesson.play}</span> workbench is still being
                built. Carry on to what it is called.
              </p>
            )}
          </div>
          <Button
            className="mt-5"
            onClick={() => setStage(lesson.teach && lesson.teach.length > 0 ? 'teach' : 'name')}
          >
            What is going on here?
          </Button>
        </section>
      )}

      {stage === 'teach' && lesson.teach && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg">Here is what is really happening</h2>
          {lesson.teach.map((step, i) => (
            <div
              key={step.heading}
              className="nrn-stagger rounded-lg border border-line bg-surface p-5"
              style={{ '--i': i } as React.CSSProperties}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                {step.prop !== 'none' && (
                  <div className="shrink-0" aria-hidden="true">
                    <TeachProp kind={step.prop} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg text-spark">{step.heading}</h3>
                  <p className="mt-2 leading-relaxed text-ink">{step.body}</p>
                </div>
              </div>
            </div>
          ))}
          {lesson.terms && lesson.terms.length > 0 && <TermList terms={lesson.terms} />}

          <Button className="self-start" onClick={() => setStage('name')}>
            Got it — what is it called?
          </Button>
        </section>
      )}

      {stage === 'name' && (
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-lg">Worth remembering</h2>
          <p className="mt-2 text-ink-dim">
            The few things from this lesson to carry into the next one.
          </p>

          {lesson.name_it.length > 0 && (
            <div className="mt-5">
              <ul className="flex flex-col gap-3">
                {lesson.name_it.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-spark"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button className="mt-6" onClick={() => setStage('stretch')}>
            Right, test me
          </Button>
        </section>
      )}

      {stage === 'stretch' && (
        <section className="flex flex-col gap-4">
          {askable.map((exercise) =>
            exercise.kind === 'sandbox' && Workbench ? (
              <fieldset key={exercise.id} className="rounded-lg border border-line bg-surface p-4">
                <legend className="sr-only">{exercise.prompt}</legend>
                <p className="font-display text-lg leading-snug">{exercise.prompt}</p>
                <div className="mt-4">
                  <Workbench
                    compact
                    onState={(state) => {
                      setSandboxState(state);
                      setResponses((current) => ({
                        ...current,
                        [exercise.id]: { kind: 'sandbox', state },
                      }));
                    }}
                  />
                </div>
                {outcomes[exercise.id] && (
                  <p
                    role="status"
                    className={cn(
                      'mt-4 rounded-md p-3 text-sm',
                      outcomes[exercise.id]!.correct
                        ? 'bg-verified/10 text-verified'
                        : 'border border-data/40 bg-data/5 text-ink',
                    )}
                  >
                    {outcomes[exercise.id]!.feedback}
                  </p>
                )}
              </fieldset>
            ) : (
            <ExerciseView
              key={exercise.id}
              exercise={exercise}
              response={responses[exercise.id]}
              outcome={outcomes[exercise.id]}
              hintUsed={hints.has(exercise.id)}
              seed={attemptSeed}
              onRespond={(response) =>
                setResponses((current) => ({ ...current, [exercise.id]: response }))
              }
              onHint={() => setHints((current) => new Set(current).add(exercise.id))}
            />
            ),
          )}

          {askable.length < lesson.exercises.length && (
            <p className="rounded-lg border border-dashed border-line p-4 text-sm text-ink-dim">
              {lesson.exercises.length - askable.length === 1 ? 'One more part' : 'Some more parts'} of
              this lesson needs the <span className="font-mono text-data">{lesson.play}</span>{' '}
              workbench, which is still being built. It will not count against you.
            </p>
          )}

          <div className="sticky bottom-[calc(var(--nav-h)+var(--safe-bottom))] -mx-4 border-t border-line bg-ground/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0">
            <div className="flex items-center gap-4">
              <Button onClick={check} disabled={answered === 0}>
                See how I did
              </Button>
              <p className="font-mono text-xs text-ink-faint">
                {answered} of {askable.length} answered
              </p>
            </div>
          </div>
        </section>
      )}

      {stage === 'close' && result && reward && (
        <RewardSplash
          partIndex={reward.partIndex}
          badge={reward.badge}
          onDone={() => setReward(null)}
        />
      )}

      {stage === 'close' && result && (
        <Result
          lesson={lesson.title}
          score={result.score}
          unaided={result.unaided}
          onMap={() => navigate('/map')}
          onRetry={() => {
            setOutcomes({});
            setResult(null);
            setResponses({});
            setHints(new Set());
            setSandboxState(null);
            setAttemptSeed(Math.floor(Math.random() * 1e9));
            setStage('stretch');
          }}
        >
          {lesson.close_comic && (
            <ComicPlayer comic={lesson.close_comic} onFinish={() => navigate('/map')} finishLabel="Back to the map" />
          )}
        </Result>
      )}
    </article>
  );
}

function Result({
  lesson,
  score,
  unaided,
  onMap,
  onRetry,
  children,
}: {
  lesson: string;
  score: number;
  unaided: boolean;
  onMap: () => void;
  onRetry: () => void;
  children?: React.ReactNode;
}) {
  const mastered = score >= MASTER_AT && unaided;
  const percent = Math.round(score * 100);

  return (
    <section className="flex flex-col gap-5">
      <div
        className={cn(
          'rounded-lg border p-5',
          mastered ? 'border-verified/50 bg-verified/5' : 'border-spark/40 bg-spark/5',
        )}
      >
        <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">
          {mastered ? 'Mastered' : 'Done'}
        </p>
        <h2 className="mt-1 text-xl">{lesson}</h2>
        <p className="mt-2 text-ink-dim">
          {percent}% of the points{unaided ? ', with no hints' : ''}.
          {!mastered && ' A clean run with no hints earns mastery — you can come back for it any time.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={onMap}>Back to the map</Button>
          {!mastered && (
            <Button tone="quiet" onClick={onRetry}>
              Try for mastery
            </Button>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

/** Stages a learner may jump back into. Watch, Learn and Name it are pure
 *  tutorial and safe to revisit. Try and Test are exercises: revisiting Try
 *  re-opens an empty workbench (handled by remounting), and Test is never
 *  reachable by tapping, so an answer can never be reached without doing it. */
const REVISITABLE: ReadonlySet<Stage> = new Set(['open', 'teach', 'name']);


/**
 * Real-world vocabulary, shown as "the actual word for this" callouts.
 *
 * The whole point is practical transfer: she leaves able to recognise the word
 * a news article, a professional, or a chatbot's own docs would use for the
 * thing she just played with. Kid-meaning first, then where she will meet it.
 */
function TermList({ terms }: { terms: import('../domain/types').Term[] }) {
  return (
    <div className="rounded-lg border border-data/30 bg-data/5 p-4">
      <p className="font-mono text-xs uppercase tracking-wide text-data">
        The real words grown-ups use
      </p>
      <dl className="mt-3 flex flex-col gap-4">
        {terms.map((term) => (
          <div key={term.term}>
            <dt className="font-display text-base text-ink">{term.term}</dt>
            <dd className="mt-1 text-sm text-ink-dim">{term.plain}</dd>
            {term.seen_in && (
              <dd className="mt-1 text-sm text-ink-faint">
                <span className="text-data">Where you'll see it: </span>
                {term.seen_in}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}

function StageTrack({
  stage,
  reached,
  onJump,
}: {
  stage: Stage;
  /** The furthest stage the learner has actually got to. */
  reached: Stage;
  onJump: (stage: Stage) => void;
}) {
  const stages = (['open', 'play', 'teach', 'name', 'stretch', 'close'] as Stage[]).map(
    (id) => [id, STAGE_LABEL[id]] as const,
  );
  const current = stages.findIndex(([id]) => id === stage);
  const reachedIndex = stages.findIndex(([id]) => id === reached);

  return (
    <ol className="mb-5 flex items-center gap-1" aria-label="Lesson stages">
      {stages.map(([id, label], index) => {
        // Revisitable, already passed, and a tutorial page — then it is a
        // button that takes you back. Everything else is a plain marker.
        const canJump = REVISITABLE.has(id) && index < current && index <= reachedIndex;
        const tone = cn(
          'nrn-thread font-mono text-[11px] uppercase tracking-wide',
          index === current ? 'text-spark' : index < current ? 'text-ink-dim' : 'text-ink-faint',
        );
        return (
          <li key={id} className="flex flex-1 items-center gap-1">
            {canJump ? (
              <button
                type="button"
                onClick={() => onJump(id)}
                className={cn(tone, 'underline decoration-dotted underline-offset-4 hover:text-ink')}
                title={`Back to ${label}`}
              >
                {label}
              </button>
            ) : (
              <span aria-current={index === current ? 'step' : undefined} className={tone}>
                {label}
              </span>
            )}
            {index < stages.length - 1 && (
              <span aria-hidden="true" className="relative h-px flex-1 bg-line">
                <span
                  className="nrn-thread-line absolute inset-0 bg-spark"
                  style={{ transform: index < current ? 'scaleX(1)' : 'scaleX(0)' }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
