import { useState } from 'react';
import { useContainer, useProgress } from '../hooks/useContainer';
import { cn } from '../lib/cn';
import type { VaultState } from '../domain/machine/MachineService';
import { planPuzzle, piecePath, benchAngle, type PiecePlan } from '../kernels/jigsaw';
import { RevealArt } from './RevealArt';

/**
 * The vault — a jigsaw of one hidden picture.
 *
 * Finishing a lesson earns a piece; she comes here and places it herself. Each
 * piece is a real interlocking jigsaw shape that clips a fragment of one hidden
 * picture — the "AI machine" the whole course secretly builds. Empty slots show
 * only a faint outline, and waiting pieces sit rotated on the bench, so the image
 * is genuinely hard to read until it comes together. The final piece completes
 * the picture and opens the vault.
 *
 * Tap-to-place, not drag: reliable for a child's thumb, same satisfaction.
 */

const COLS = 4;
const ROWS = 5;
const CELL = 88; // px per cell in the board's own coordinate space
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;

// One stable puzzle layout for the whole session.
const PLAN: PiecePlan[] = planPuzzle(ROWS, COLS, 7);

export function Vault() {
  const { machine, progress } = useContainer();
  const { state } = useProgress();

  const placed = state.build?.placed ?? [];
  const v: VaultState = machine.vault(state.records, placed);

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
      {/* The board: 20 jigsaw slots that reveal the picture as they fill. */}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border p-4 transition-colors',
          v.open ? 'border-spark bg-spark/5' : 'border-line bg-ground-deep',
        )}
      >
        <svg
          viewBox={`-8 -8 ${BOARD_W + 16} ${BOARD_H + 16}`}
          className="mx-auto block w-full max-w-sm"
          role="img"
          aria-label={`Puzzle: ${v.placedCount} of ${v.total} pieces placed`}
        >
          <defs>
            {/* One clip per piece, shaped like that piece, positioned at its cell. */}
            {PLAN.map((p) => (
              <clipPath key={p.index} id={`vclip-${p.index}`}>
                <path
                  d={piecePath(p.edges, CELL, CELL)}
                  transform={`translate(${p.col * CELL} ${p.row * CELL})`}
                />
              </clipPath>
            ))}
          </defs>

          {/* Empty-slot outlines: faint jigsaw ghosts so the shape reads even
              before anything is placed. */}
          {PLAN.map((p) => {
            const filled = v.placedSet.has(p.index);
            const isTarget = held === p.index;
            if (filled) return null;
            return (
              <path
                key={`ghost-${p.index}`}
                d={piecePath(p.edges, CELL, CELL)}
                transform={`translate(${p.col * CELL} ${p.row * CELL})`}
                fill={isTarget ? 'var(--c-spark)' : 'transparent'}
                fillOpacity={isTarget ? 0.18 : 0}
                stroke={isTarget ? 'var(--c-spark)' : 'var(--c-line)'}
                strokeWidth={isTarget ? 2.5 : 1.2}
                strokeDasharray={isTarget ? undefined : '4 4'}
                className={isTarget ? 'animate-pulse cursor-pointer' : undefined}
                onClick={isTarget ? () => place(p.index) : undefined}
                role={isTarget ? 'button' : undefined}
                aria-label={isTarget ? `Place piece in slot ${p.index + 1}` : undefined}
              />
            );
          })}

          {/* Placed pieces: each clips the shared artwork to its own shape, so
              together they rebuild the hidden picture. */}
          {PLAN.map((p) => {
            if (!v.placedSet.has(p.index)) return null;
            return (
              <g
                key={`piece-${p.index}`}
                clipPath={`url(#vclip-${p.index})`}
                className={justPlaced === p.index ? 'nrn-part-new' : undefined}
              >
                <g transform={`translate(${p.col * CELL} ${p.row * CELL})`}>
                  {/* Draw the whole picture, shifted so this cell shows its slice. */}
                  <g transform={`translate(${-p.col * CELL} ${-p.row * CELL})`}>
                    <foreignObject x={0} y={0} width={BOARD_W} height={BOARD_H}>
                      <RevealArt w={BOARD_W} h={BOARD_H} />
                    </foreignObject>
                  </g>
                </g>
                {/* seam outline so pieces read as separate */}
                <path
                  d={piecePath(p.edges, CELL, CELL)}
                  transform={`translate(${p.col * CELL} ${p.row * CELL})`}
                  fill="none"
                  stroke="#0d1424"
                  strokeWidth="1.5"
                  strokeOpacity="0.55"
                />
              </g>
            );
          })}
        </svg>

        {v.open && (
          <div className="nrn-enter mt-4 rounded-lg border border-spark/40 bg-surface p-4 text-center">
            <p className="font-display text-lg text-spark">The picture is complete.</p>
            <p className="mt-1 text-sm text-ink-dim">
              The thing you built, one lesson at a time, was a working AI — words in, thinking,
              words out. Open any part below to run it.
            </p>
          </div>
        )}
      </div>

      {/* The bench: earned pieces, rotated so the picture stays a mystery. */}
      {v.waiting.length > 0 ? (
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">
            {v.waiting.length === 1 ? 'A piece is waiting' : `${v.waiting.length} pieces waiting`}
          </p>
          <p className="mt-1 text-sm text-ink-dim">
            {held === null
              ? 'Tap a piece to pick it up, then tap its glowing slot above.'
              : 'Now tap the glowing slot above to drop it into place.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {v.waiting.map((part) => {
              const p = PLAN[part.index]!;
              const angle = benchAngle(part.index);
              return (
                <button
                  key={part.index}
                  type="button"
                  onClick={() => setHeld(held === part.index ? null : part.index)}
                  className={cn(
                    'nrn-press flex h-16 w-16 items-center justify-center rounded-md border-2',
                    held === part.index ? 'border-spark bg-spark/15' : 'border-line bg-ground-deep',
                  )}
                  aria-label={`Puzzle piece ${part.index + 1}${held === part.index ? ', held' : ''}`}
                >
                  <svg viewBox="-6 -6 100 100" className="h-11 w-11" style={{ transform: `rotate(${angle}deg)` }}>
                    <clipPath id={`bench-${part.index}`}>
                      <path d={piecePath(p.edges, CELL, CELL)} />
                    </clipPath>
                    <g clipPath={`url(#bench-${part.index})`}>
                      <g transform={`translate(${-p.col * CELL} ${-p.row * CELL})`}>
                        <foreignObject x={0} y={0} width={BOARD_W} height={BOARD_H}>
                          <RevealArt w={BOARD_W} h={BOARD_H} />
                        </foreignObject>
                      </g>
                    </g>
                    <path d={piecePath(p.edges, CELL, CELL)} fill="none" stroke="#0d1424" strokeWidth="2" strokeOpacity="0.5" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      ) : v.open ? null : (
        <p className="rounded-lg border border-dashed border-line p-4 text-sm text-ink-dim">
          No pieces waiting. Finish a lesson to earn the next one, then come back and place it.
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
