import { useState } from 'react';
import { useContainer, useProgress } from '../hooks/useContainer';
import { Button } from '../ui/primitives/Button';
import { BackupPanel } from '../ui/settings/BackupPanel';
import type { TrackId } from '../domain/types';
import type { PuzzleMode } from '../domain/progress/state';

/**
 * The grown-ups' page.
 *
 * Progress lives on this device only — no account, no server, nothing sent
 * anywhere. An optional 4-digit lock keeps a curious child out of the controls;
 * it guards the settings, not data (there is no uploaded data to guard).
 */
export function ParentRoute() {
  const { progress, curriculum, ai } = useContainer();
  const { state, level, status } = useProgress();
  const [note, setNote] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // The lock. If a PIN is set, hold the page behind it until entered this visit.
  const hasPin = Boolean(state.pin);
  const [unlocked, setUnlocked] = useState(!hasPin);

  if (hasPin && !unlocked) {
    return <PinGate expected={state.pin!} onPass={() => setUnlocked(true)} />;
  }

  const done = Object.values(status).filter((s) => s === 'completed' || s === 'mastered').length;
  const total = curriculum.forTrack(state.track).length;
  const hidden = new Set(state.hiddenWorlds ?? []);
  const puzzleMode = state.puzzleMode ?? 'full';

  return (
    <div className="nrn-enter mx-auto flex max-w-reading flex-col gap-6">
      <header>
        <h1 className="text-2xl">For grown-ups</h1>
        <p className="mt-2 text-ink-dim">
          Everything here stays on this device. There is no account, nothing is uploaded, and no
          personal details are collected.
        </p>
      </header>

      {/* How she's doing — per world, not just a bare count. */}
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-lg">How she is doing</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-ink-faint">Level</dt>
            <dd className="font-mono text-lg">{level.level}</dd>
          </div>
          <div>
            <dt className="text-ink-faint">Lessons finished</dt>
            <dd className="font-mono text-lg">
              {done}/{total}
            </dd>
          </div>
        </dl>
        <ul className="mt-4 flex flex-col gap-2">
          {curriculum.worlds.map((world) => {
            const lessons = curriculum.lessonsInWorld(world.id);
            const cleared = lessons.filter(
              (l) => status[l.id] === 'completed' || status[l.id] === 'mastered',
            ).length;
            const mastered = lessons.filter((l) => status[l.id] === 'mastered').length;
            return (
              <li key={world.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-ink">
                  {world.index}. {world.title}
                </span>
                <span className="font-mono text-xs text-ink-dim">
                  {hidden.has(world.id) ? 'hidden · ' : ''}
                  {cleared}/{lessons.length}
                  {mastered > 0 ? ` · ${mastered}\u2605` : ''}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-ink-faint">
          A star means she finished that lesson with no hints. Nothing here is timed.
        </p>
      </section>

      {/* Pace — now says concretely what changes. */}
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-lg">Pace and reading level</h2>
        <p className="mt-2 text-sm text-ink-dim">
          Explorer keeps more of the story and comics and takes gentler steps. Builder covers the
          same ideas with less hand-holding and expects a bit more. Switch any time — her progress is
          kept either way.
        </p>
        <div className="mt-4 flex gap-2">
          {(['explorer', 'builder'] as TrackId[]).map((track) => (
            <Button
              key={track}
              tone={state.track === track ? 'primary' : 'quiet'}
              onClick={() => progress.setTrack(track)}
            >
              {track === 'explorer' ? 'Explorer (10\u201312)' : 'Builder (13\u201315)'}
            </Button>
          ))}
        </div>
      </section>

      {/* Puzzle exposure — new control. */}
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-lg">Hands-on puzzles</h2>
        <p className="mt-2 text-sm text-ink-dim">
          Each lesson can include a hands-on activity — writing a prompt, spotting a made-up answer,
          sorting tasks. Choose how much to show.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['full', 'Full puzzles'],
              ['gentle', 'Gentle (never blocks)'],
              ['off', 'Skip puzzles'],
            ] as [PuzzleMode, string][]
          ).map(([value, label]) => (
            <Button
              key={value}
              tone={puzzleMode === value ? 'primary' : 'quiet'}
              onClick={() => progress.setPuzzleMode(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Gentle keeps every activity, and any real try at one counts as done, so she is never stuck
          on it. Skip leaves the activities out entirely — the lesson is scored on its questions
          alone.
        </p>
      </section>

      {/* Which worlds are visible — topic gating. */}
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-lg">Which worlds she can see</h2>
        <p className="mt-2 text-sm text-ink-dim">
          Hide a world to hold a topic back for later. The worlds after it still open in order, as if
          the hidden one were not there. Hiding never deletes progress. Her jigsaw picture needs a
          piece from every lesson, so it finishes once the world is shown again and done.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {curriculum.worlds.map((world) => {
            const isHidden = hidden.has(world.id);
            return (
              <li key={world.id} className="flex items-center justify-between gap-3">
                <span className={`min-w-0 flex-1 truncate text-sm ${isHidden ? 'text-ink-faint line-through' : 'text-ink'}`}>
                  {world.index}. {world.title}
                </span>
                <Button
                  tone="quiet"
                  aria-label={`${isHidden ? 'Show' : 'Hide'} ${world.title}`}
                  onClick={() => progress.setWorldHidden(world.id, !isHidden)}
                >
                  {isHidden ? 'Show again' : 'Hide'}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <BackupPanel />

      {/* Grown-ups lock. */}
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-lg">Lock this page</h2>
        <PinControl
          hasPin={hasPin}
          onSet={(pin) => {
            progress.setPin(pin);
            setNote('Lock updated.');
          }}
          onClear={() => {
            progress.setPin(null);
            setNote('Lock removed.');
          }}
        />
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-lg">Drawings and movement</h2>
        <p className="mt-2 text-sm text-ink-dim">
          The comics draw themselves stroke by stroke. Battery saver on Android switches this off
          without asking, so you can force it back on here.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['auto', 'Follow device'],
              ['full', 'Always animate'],
              ['off', 'No movement'],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              tone={(state.motion ?? 'auto') === value ? 'primary' : 'quiet'}
              onClick={() => progress.setMotion(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-lg">Live model (optional)</h2>
        <p className="mt-2 text-sm text-ink-dim">
          {ai.capabilities().available
            ? `Connected: ${ai.capabilities().label}. This only adds an optional "try your prompt for real" step.`
            : 'Not connected — and that is completely fine. Every lesson, puzzle and score works without one. A live model is an optional extra that lets her run a real prompt; nothing is broken without it.'}
        </p>
      </section>


      <section className="rounded-lg border border-anomaly/40 bg-surface p-5">
        <h2 className="text-lg">Start over</h2>
        <p className="mt-2 text-sm text-ink-dim">
          This erases every lesson result on this device. It cannot be undone.
        </p>
        {confirmingReset ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                progress.reset();
                setConfirmingReset(false);
                setNote('Progress erased.');
              }}
            >
              Yes, erase it
            </Button>
            <Button tone="ghost" onClick={() => setConfirmingReset(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <Button tone="quiet" className="mt-4" onClick={() => setConfirmingReset(true)}>
            Erase progress
          </Button>
        )}
        {note && (
          <p role="status" className="mt-3 text-sm text-ink-dim">
            {note}
          </p>
        )}
      </section>
    </div>
  );
}

/** The lock screen shown when a PIN is set. */
function PinGate({ expected, onPass }: { expected: string; onPass: () => void }) {
  const [entry, setEntry] = useState('');
  const [wrong, setWrong] = useState(false);
  const submit = () => {
    if (entry === expected) onPass();
    else {
      setWrong(true);
      setEntry('');
    }
  };
  return (
    <div className="nrn-enter mx-auto flex max-w-reading flex-col gap-4">
      <h1 className="text-2xl">For grown-ups</h1>
      <p className="text-ink-dim">Enter the 4-digit code to open the grown-ups page.</p>
      <input
        inputMode="numeric"
        pattern="\d*"
        maxLength={4}
        value={entry}
        onChange={(e) => {
          setEntry(e.target.value.replace(/\D/g, '').slice(0, 4));
          setWrong(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-40 rounded-xl border-2 border-line bg-ground-deep p-3 text-center font-mono text-2xl tracking-widest text-ink focus:border-spark focus:outline-none"
        aria-label="Grown-ups code"
      />
      {wrong && <p className="text-sm text-anomaly">Not quite — try again.</p>}
      <div>
        <Button onClick={submit}>Open</Button>
      </div>
    </div>
  );
}

/** Set, change, or remove the 4-digit lock. */
function PinControl({
  hasPin,
  onSet,
  onClear,
}: {
  hasPin: boolean;
  onSet: (pin: string) => void;
  onClear: () => void;
}) {
  const [entry, setEntry] = useState('');
  return (
    <div className="mt-3 flex flex-col gap-3">
      <p className="text-sm text-ink-dim">
        {hasPin
          ? 'A lock is set. Enter a new 4-digit code to change it, or remove it below.'
          : 'Set a 4-digit code to keep this page for grown-ups only.'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          value={entry}
          onChange={(e) => setEntry(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="4 digits"
          className="w-32 rounded-xl border-2 border-line bg-ground-deep p-2 text-center font-mono text-lg tracking-widest text-ink focus:border-spark focus:outline-none"
          aria-label="New code"
        />
        <Button
          tone="primary"
          onClick={() => {
            if (/^\d{4}$/.test(entry)) {
              onSet(entry);
              setEntry('');
            }
          }}
        >
          {hasPin ? 'Change code' : 'Set code'}
        </Button>
        {hasPin && (
          <Button tone="quiet" onClick={onClear}>
            Remove lock
          </Button>
        )}
      </div>
    </div>
  );
}
