import type { Mood } from '../../domain/types';
import { drawIn, fillIn } from './ink';

/**
 * The cast, drawn from parts.
 *
 * Faces are composed rather than illustrated — four small part sets cover every
 * mood, which is what makes a companion who visibly reacts affordable across
 * twenty lessons instead of a name in monospace.
 *
 * Iskra is deliberately unfinished-looking: a bare bulb on legs, antenna
 * drooping when she is confused. She is a program being taught, and she should
 * look like one.
 */

interface CharacterProps {
  x: number;
  y: number;
  /** 1 is roughly 60 user units tall. */
  scale?: number;
  mood: Mood;
  order?: number;
  flip?: boolean;
}

const ISKRA_EYES: Record<Mood, { r: number; dy: number; arc: boolean }> = {
  calm: { r: 2.6, dy: 0, arc: false },
  curious: { r: 3.4, dy: -1, arc: false },
  excited: { r: 3.8, dy: -1, arc: false },
  confused: { r: 4.2, dy: 0, arc: false },
  proud: { r: 2.6, dy: 0, arc: true },
};

const ISKRA_MOUTH: Record<Mood, string> = {
  calm: 'M-5,9 L5,9',
  curious: 'M-3,9 Q0,7 3,9',
  excited: 'M-6,7 Q0,14 6,7',
  confused: 'M-6,10 Q-3,7 0,10 Q3,13 6,10',
  proud: 'M-5,8 Q0,12 5,8',
};

export function Iskra({ x, y, scale = 1, mood, order = 0, flip = false }: CharacterProps) {
  const eyes = ISKRA_EYES[mood];
  // The antenna is the mood tell that reads at a glance, even on a small panel.
  const antenna =
    mood === 'confused'
      ? 'M0,-16 Q3,-24 10,-25'
      : mood === 'excited' || mood === 'proud'
        ? 'M0,-16 Q-1,-27 1,-33'
        : 'M0,-16 Q1,-25 0,-29';
  const bulbY = mood === 'confused' ? -25 : mood === 'excited' || mood === 'proud' ? -34 : -30;
  const bulbX = mood === 'confused' ? 11 : 1;

  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {/* Antenna */}
      <path
        d={antenna}
        className="nrn-draw"
        style={drawIn(order)}
        pathLength={1}
        fill="none"
        stroke="var(--c-spark)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx={bulbX}
        cy={bulbY}
        r="3.4"
        className={mood === 'excited' || mood === 'proud' ? 'nrn-fill nrn-flicker' : 'nrn-fill'}
        style={fillIn(order)}
        fill="var(--c-spark)"
      />

      {/* Body: a bulb that has not warmed up yet. */}
      <path
        d="M-15,-16 Q-15,-22 0,-22 Q15,-22 15,-16 L15,10 Q15,17 0,17 Q-15,17 -15,10 Z"
        className="nrn-draw"
        style={drawIn(order + 1)}
        pathLength={1}
        fill="var(--c-ground-deep)"
        stroke="var(--c-spark)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Face */}
      {eyes.arc ? (
        <>
          <path
            d={`M-9,${1 + eyes.dy} Q-6,${-3 + eyes.dy} -3,${1 + eyes.dy}`}
            className="nrn-fill"
            style={fillIn(order + 1)}
            fill="none"
            stroke="var(--c-ink)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d={`M3,${1 + eyes.dy} Q6,${-3 + eyes.dy} 9,${1 + eyes.dy}`}
            className="nrn-fill"
            style={fillIn(order + 1)}
            fill="none"
            stroke="var(--c-ink)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle
            cx="-6"
            cy={eyes.dy}
            r={eyes.r}
            className="nrn-fill"
            style={fillIn(order + 1)}
            fill="var(--c-ink)"
          />
          <circle
            cx="6"
            cy={eyes.dy}
            r={eyes.r}
            className="nrn-fill"
            style={fillIn(order + 1)}
            fill="var(--c-ink)"
          />
        </>
      )}
      <path
        d={ISKRA_MOUTH[mood]}
        className="nrn-fill"
        style={fillIn(order + 1)}
        fill="none"
        stroke="var(--c-ink)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Legs */}
      <path
        d="M-7,17 L-9,25 M7,17 L9,25"
        className="nrn-draw"
        style={drawIn(order + 2)}
        pathLength={1}
        stroke="var(--c-spark)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Loose sparks. Fewer when she is unsure of herself. */}
      {(mood === 'excited' || mood === 'proud') &&
        [
          [-22, -8],
          [21, -12],
          [24, 4],
        ].map(([sx, sy]) => (
          <circle
            key={`${sx}`}
            cx={sx}
            cy={sy}
            r="1.8"
            className="nrn-fill nrn-flicker"
            style={fillIn(order + 2)}
            fill="var(--c-spark)"
          />
        ))}
      {mood === 'confused' && (
        <text
          x="20"
          y="-14"
          className="nrn-fill"
          style={fillIn(order + 2)}
          fill="var(--c-anomaly)"
          fontSize="14"
          fontFamily="var(--f-display)"
        >
          ?
        </text>
      )}
    </g>
  );
}

const MILA_MOUTH: Record<Mood, string> = {
  calm: 'M-4,6 L4,6',
  curious: 'M-3,6 Q0,4 3,6',
  excited: 'M-5,4 Q0,11 5,4',
  confused: 'M-5,7 Q-2,4 1,7 Q4,10 5,7',
  proud: 'M-4,5 Q0,9 4,5',
};

export function Mila({ x, y, scale = 1, mood, order = 0, flip = false }: CharacterProps) {
  const brow = mood === 'confused' ? -1 : mood === 'curious' ? -2 : 0;

  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {/* Head */}
      <circle
        cx="0"
        cy="0"
        r="14"
        className="nrn-draw"
        style={drawIn(order)}
        pathLength={1}
        fill="var(--c-ground-deep)"
        stroke="var(--c-data)"
        strokeWidth="2"
      />
      {/* Hair */}
      <path
        d="M-14,-3 Q-13,-17 0,-16 Q13,-17 14,-3 Q9,-11 0,-10 Q-9,-11 -14,-3 Z"
        className="nrn-fill"
        style={fillIn(order)}
        fill="var(--c-data)"
        opacity="0.85"
      />
      {/* Face */}
      <circle cx="-5" cy={brow} r="2" className="nrn-fill" style={fillIn(order + 1)} fill="var(--c-ink)" />
      <circle cx="5" cy={brow} r="2" className="nrn-fill" style={fillIn(order + 1)} fill="var(--c-ink)" />
      <path
        d={MILA_MOUTH[mood]}
        className="nrn-fill"
        style={fillIn(order + 1)}
        fill="none"
        stroke="var(--c-ink)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Body and arms */}
      <path
        d="M0,14 L0,38 M-13,24 L0,19 L13,24 M-8,52 L0,38 L8,52"
        className="nrn-draw"
        style={drawIn(order + 2)}
        pathLength={1}
        fill="none"
        stroke="var(--c-data)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

/** A table. Four legs, and that is the whole joke. */
export function Table({ x, y, scale = 1, order = 0 }: { x: number; y: number; scale?: number; order?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M-30,-10 L30,-10 L30,-4 L-30,-4 Z"
        className="nrn-draw"
        style={drawIn(order)}
        pathLength={1}
        fill="var(--c-ground-deep)"
        stroke="var(--c-ink-dim)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {[-24, -9, 9, 24].map((lx) => (
        <path
          key={lx}
          d={`M${lx},-4 L${lx},22`}
          className="nrn-draw"
          style={drawIn(order + 1)}
          pathLength={1}
          stroke="var(--c-ink-dim)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

/** A dog, side on. Also four legs — which is precisely the problem. */
export function Dog({ x, y, scale = 1, order = 0 }: { x: number; y: number; scale?: number; order?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Body */}
      <path
        d="M-26,-6 Q-30,-16 -20,-16 L16,-16 Q26,-16 26,-6 Q26,2 16,2 L-18,2 Q-26,2 -26,-6 Z"
        className="nrn-draw"
        style={drawIn(order)}
        pathLength={1}
        fill="var(--c-ground-deep)"
        stroke="var(--c-verified)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Head */}
      <circle
        cx="28"
        cy="-16"
        r="10"
        className="nrn-draw"
        style={drawIn(order)}
        pathLength={1}
        fill="var(--c-ground-deep)"
        stroke="var(--c-verified)"
        strokeWidth="2"
      />
      <path
        d="M24,-25 L21,-33 L29,-28 Z"
        className="nrn-fill"
        style={fillIn(order)}
        fill="var(--c-verified)"
      />
      <circle cx="30" cy="-18" r="1.8" className="nrn-fill" style={fillIn(order + 1)} fill="var(--c-ink)" />
      <circle cx="37" cy="-13" r="2.2" className="nrn-fill" style={fillIn(order + 1)} fill="var(--c-ink)" />
      {/* Tail */}
      <path
        d="M-26,-12 Q-36,-16 -34,-26"
        className="nrn-draw"
        style={drawIn(order + 1)}
        pathLength={1}
        fill="none"
        stroke="var(--c-verified)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* The four legs, drawn last so the count lands. */}
      {[-18, -6, 8, 20].map((lx) => (
        <path
          key={lx}
          d={`M${lx},2 L${lx},20`}
          className="nrn-draw"
          style={drawIn(order + 2)}
          pathLength={1}
          stroke="var(--c-verified)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

/** Little counting ticks over legs, so "four" is seen rather than asserted. */
export function LegCount({
  xs,
  y,
  order = 0,
  tone = 'var(--c-spark)',
}: {
  xs: number[];
  y: number;
  order?: number;
  tone?: string;
}) {
  return (
    <g>
      {xs.map((cx, i) => (
        <g key={cx} className="nrn-pop" style={{ animationDelay: `${order * 0.22 + i * 0.26}s` }}>
          <circle cx={cx} cy={y} r="7" fill="var(--c-ground-deep)" stroke={tone} strokeWidth="1.4" />
          <text
            x={cx}
            y={y + 3.5}
            textAnchor="middle"
            fill={tone}
            fontSize="9"
            fontFamily="var(--f-mono)"
          >
            {i + 1}
          </text>
        </g>
      ))}
    </g>
  );
}
