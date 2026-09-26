import { planPuzzle, piecePath, benchAngle, TAB_REACH, type PiecePlan } from '../kernels/jigsaw';
import { ART_H, ART_W, RevealScene } from './RevealArt';

/**
 * The one jigsaw layout the whole app shares, plus a drawing of a single loose
 * piece. The vault board, the vault bench and the reward pop-up all use these,
 * so the piece she earns looks exactly like the piece she places.
 */
export const COLS = 4;
export const ROWS = 5;
export const CELL = 88;
export const BOARD_W = COLS * CELL;
export const BOARD_H = ROWS * CELL;
/** The artwork is drawn at 400×500; this fits it to the board. */
export const ART_SCALE = BOARD_W / ART_W;
if (Math.abs(BOARD_H / ART_H - ART_SCALE) > 0.001) {
  throw new Error('board and artwork aspect ratios must match');
}

export const PLAN: PiecePlan[] = planPuzzle(ROWS, COLS, 7);

/** Room around a cell so tabs are never clipped by the viewBox. */
const PAD = Math.ceil(CELL * TAB_REACH) + 4;

/**
 * One loose piece: its own slice of the picture, cut to its own shape, tilted
 * so the picture stays hard to read until it is placed.
 *
 * Needs <RevealDefs /> rendered somewhere on the page for the gradients.
 */
export function LoosePiece({
  index,
  size = 64,
  tilt = true,
  idPrefix = 'loose',
}: {
  index: number;
  size?: number;
  tilt?: boolean;
  idPrefix?: string;
}) {
  const p = PLAN[index]!;
  const d = piecePath(p.edges, CELL, CELL);
  const clipId = `${idPrefix}-clip-${index}`;
  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${CELL + PAD * 2} ${CELL + PAD * 2}`}
      width={size}
      height={size}
      aria-hidden="true"
      style={tilt ? { transform: `rotate(${benchAngle(index)}deg)` } : undefined}
    >
      <clipPath id={clipId}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(${-p.col * CELL} ${-p.row * CELL}) scale(${ART_SCALE})`}>
          <RevealScene />
        </g>
      </g>
      <path d={d} fill="none" stroke="var(--c-spark)" strokeWidth="2.5" />
    </svg>
  );
}
