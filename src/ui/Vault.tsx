import { useState } from 'react';
import { useContainer, useProgress } from '../hooks/useContainer';
import { cn } from '../lib/cn';
import type { VaultState } from '../domain/machine/MachineService';
import { piecePath } from '../kernels/jigsaw';
import { RevealDefs, RevealScene } from './RevealArt';
import { ART_SCALE, BOARD_H, BOARD_W, CELL, LoosePiece, PLAN } from './JigsawPiece';

/**
 * The vault — a jigsaw of one hidden picture.
 *
 * Finishing a lesson earns a piece; she comes here and places it herself. Each
 * piece is a real interlocking jigsaw shape holding its own slice of one hidden
 * picture — the "AI machine" the course secretly builds. Empty slots show only a
 * faint outline and waiting pieces sit tilted on the bench, so the picture is
 * hard to read until it comes together. The last piece completes it.
 *
 * Tap-to-place, not drag: reliable for a child's thumb, same satisfaction.
 */
export function Vault() {
  const { machine, progress, curriculum } = useContainer();
  const { state, status } = useProgress();

  const placed = state.build?.placed ?? [];
  const v: VaultState = machine.vault(state.records, placed);
  // Pieces that belong to worlds a grown-up has put away, not yet earned.
  const heldBack = (state.hiddenWorlds ?? [])
    .flatMap((w) => curriculum.lessonsInWorld(w))
    .filter((l) => status[l.id] !== 'completed' && status[l.id] !== 'mastered').length;

  const [held, setHeld] = useState<number | null>(null);
  const [justPlaced, setJustPlaced] = useState<number | null>(null);

  const place = (slotIndex: number) => {
    if (held === null || held !== slotIndex) return;
    progress.placePiece(slotIndex);
    setJustPlaced(slotIndex);
    setHeld(null);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* The bench first on a phone: the thing she came here to do. */}
      {v.waiting.length > 0 && (
        <div className="rounded-lg border border-spark/40 bg-spark/5 p-4">
          <p className="font-display text-base text-ink">
            {v.waiting.length === 1 ? 'You have a piece to place' : `You have ${v.waiting.length} pieces to place`}
          </p>
          <p className="mt-1 text-sm text-ink-dim">
            {held === null
              ? 'Tap a piece to pick it up, then tap the glowing space in the picture.'
              : 'Now tap the glowing space in the picture to drop it in.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {v.waiting.map((part) => (
              <button
                key={part.index}
                type="button"
                onClick={() => setHeld(held === part.index ? null : part.index)}
                aria-pressed={held === part.index}
                aria-label={`Puzzle piece ${part.index + 1}${held === part.index ? ', held' : ''}`}
                className={cn(
                  'nrn-press grid h-20 w-20 place-items-center rounded-md border-2',
                  held === part.index
                    ? 'border-spark bg-spark/15 nrn-held'
                    : 'border-line bg-ground-deep',
                )}
              >
                <LoosePiece index={part.index} size={68} idPrefix="bench" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The board: 20 jigsaw spaces that reveal the picture as they fill. */}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border p-3 transition-colors',
          v.open ? 'border-spark bg-spark/5' : 'border-line bg-ground-deep',
        )}
      >
        <svg
          viewBox={`-8 -8 ${BOARD_W + 16} ${BOARD_H + 16}`}
          className="mx-auto block w-full max-w-sm"
          role="img"
          aria-label={`Puzzle: ${v.placedCount} of ${v.total} pieces placed`}
        >
          <RevealDefs />
          <defs>
            {PLAN.map((p) => (
              <clipPath key={p.index} id={`vclip-${p.index}`}>
                <path
                  d={piecePath(p.edges, CELL, CELL)}
                  transform={`translate(${p.col * CELL} ${p.row * CELL})`}
                />
              </clipPath>
            ))}
          </defs>

          {/* Empty spaces: faint jigsaw outlines, so the shape reads but the
              picture does not. The held piece's space glows and takes the tap. */}
          {PLAN.map((p) => {
            if (v.placedSet.has(p.index)) return null;
            const isTarget = held === p.index;
            return (
              <path
                key={`ghost-${p.index}`}
                d={piecePath(p.edges, CELL, CELL)}
                transform={`translate(${p.col * CELL} ${p.row * CELL})`}
                fill={isTarget ? 'var(--c-spark)' : 'var(--c-surface)'}
                fillOpacity={isTarget ? 0.3 : 0.35}
                stroke={isTarget ? 'var(--c-spark)' : 'var(--c-line)'}
                strokeWidth={isTarget ? 3 : 1.2}
                strokeDasharray={isTarget ? undefined : '4 4'}
                className={isTarget ? 'animate-pulse cursor-pointer' : undefined}
                onClick={isTarget ? () => place(p.index) : undefined}
                role={isTarget ? 'button' : undefined}
                tabIndex={isTarget ? 0 : undefined}
                onKeyDown={isTarget ? (e) => (e.key === 'Enter' || e.key === ' ') && place(p.index) : undefined}
                aria-label={isTarget ? `Place piece in slot ${p.index + 1}` : undefined}
              />
            );
          })}

          {/* Placed pieces: each clips the shared picture to its own shape, so
              together they rebuild it. */}
          {PLAN.map((p) => {
            if (!v.placedSet.has(p.index)) return null;
            return (
              <g
                key={`piece-${p.index}`}
                className={justPlaced === p.index ? 'nrn-part-new' : undefined}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              >
                <g clipPath={`url(#vclip-${p.index})`}>
                  <g transform={`scale(${ART_SCALE})`}>
                    <RevealScene />
                  </g>
                </g>
                {/* A fine seam so the pieces still read as a jigsaw. */}
                {!v.open && (
                  <path
                    d={piecePath(p.edges, CELL, CELL)}
                    transform={`translate(${p.col * CELL} ${p.row * CELL})`}
                    fill="none"
                    stroke="var(--c-ground-deep)"
                    strokeWidth="1"
                    strokeOpacity="0.6"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {v.open && (
          <div className="nrn-enter mt-4 rounded-lg border border-spark/40 bg-surface p-4 text-center">
            <p className="font-display text-lg text-spark">The picture is complete.</p>
            <p className="mt-1 text-sm text-ink-dim">
              The thing you built, one lesson at a time, was a working AI — words in, thinking,
              words out.
            </p>
          </div>
        )}
      </div>

      {v.waiting.length === 0 && !v.open && (
        <p className="rounded-lg border border-dashed border-line p-4 text-sm text-ink-dim">
          No pieces waiting. Finish a lesson to earn the next one, then come back and place it.
        </p>
      )}

      {heldBack > 0 && !v.open && (
        <p className="rounded-md border border-line p-4 text-sm text-ink-dim">
          {heldBack === 1 ? 'One piece belongs' : `${heldBack} pieces belong`} to a world a grown-up has
          put away for now. The picture finishes when that world is back and done.
        </p>
      )}

      {v.hint && !v.open && (
        <p className="rounded-md border border-spark/30 bg-spark/5 p-4 text-sm text-ink">{v.hint.text}</p>
      )}

      <p className="text-center font-mono text-xs text-ink-faint">
        {v.placedCount} of {v.total} placed
        {v.earned > v.placedCount && ` · ${v.earned - v.placedCount} waiting`}
      </p>
    </div>
  );
}
