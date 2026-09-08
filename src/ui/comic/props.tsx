import type { PropKind, Mood } from '../../domain/types';
import { drawIn, fillIn } from './ink';

/**
 * The prop library.
 *
 * Each prop is the visual anchor for exactly one locked analogy — a photo album
 * for training data, bricks for tokens, a wall of dials for weights — and the
 * same drawing is reused every single time that idea appears. Switching
 * metaphors mid-course is what loses a ten-year-old, so the compiler enforces
 * the analogy and this file enforces the picture.
 *
 * Everything inks itself on. Nothing is large; a prop is a beat, not a scene.
 */
export function Prop({
  kind,
  mood,
  x,
  y,
  order = 0,
}: {
  kind: PropKind;
  mood: Mood;
  x: number;
  y: number;
  order?: number;
}) {
  if (kind === 'none') return null;
  const off = mood === 'confused';

  return (
    <g transform={`translate(${x} ${y})`}>
      {kind === 'dots' && <Dots order={order} />}
      {kind === 'grid' && <Grid order={order} />}
      {kind === 'curve' && <Curve order={order} steep={off} />}
      {kind === 'bricks' && <Bricks order={order} />}
      {kind === 'dials' && <Dials order={order} />}
      {kind === 'album' && <Album order={order} flagged={off} />}
      {kind === 'room' && <Room order={order} />}
      {kind === 'map' && <MeaningMap order={order} />}
      {kind === 'fog' && <Fog order={order} />}
    </g>
  );
}

/** Examples. Two colours that have to be told apart. */
function Dots({ order }: { order: number }) {
  const points = [
    [-38, -16, 0],
    [-20, 6, 0],
    [-34, 18, 0],
    [-8, -22, 0],
    [14, -10, 1],
    [30, 12, 1],
    [10, 20, 1],
    [36, -20, 1],
  ] as const;
  return (
    <g>
      {points.map(([px, py, label], i) => (
        <circle
          key={`${px}-${py}`}
          cx={px}
          cy={py}
          r="5.5"
          className="nrn-pop"
          style={{ animationDelay: `${order * 0.22 + i * 0.09}s` }}
          fill={label === 0 ? 'var(--c-data)' : 'var(--c-spark)'}
        />
      ))}
    </g>
  );
}

/** Data laid out in rows, some of it worth a second look. */
function Grid({ order }: { order: number }) {
  return (
    <g>
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={-46 + c * 20}
            y={-22 + r * 16}
            width="16"
            height="12"
            rx="2"
            className="nrn-pop"
            style={{ animationDelay: `${order * 0.22 + (r * 5 + c) * 0.045}s` }}
            fill={(r + c) % 4 === 0 ? 'var(--c-data)' : 'var(--c-line)'}
          />
        )),
      )}
    </g>
  );
}

/** Error coming down. The shape of learning working. */
function Curve({ order, steep }: { order: number; steep: boolean }) {
  return (
    <g>
      <path
        d="M-48,20 L48,20 M-48,20 L-48,-24"
        className="nrn-draw"
        style={drawIn(order)}
        pathLength={1}
        stroke="var(--c-line)"
        strokeWidth="1.6"
      />
      <path
        d={steep ? 'M-44,-20 Q-20,26 0,-14 Q20,24 44,-8' : 'M-44,-20 Q-14,16 0,12 Q22,18 44,17'}
        className="nrn-draw"
        style={drawIn(order + 1, 1.6)}
        pathLength={1}
        fill="none"
        stroke={steep ? 'var(--c-anomaly)' : 'var(--c-spark)'}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Tokens. Language snapped into pieces. */
function Bricks({ order }: { order: number }) {
  const parts = ['un', 'for', 'get', 'table'];
  return (
    <g>
      {parts.map((part, i) => (
        <g key={part} className="nrn-pop" style={{ animationDelay: `${order * 0.22 + i * 0.14}s` }}>
          <rect
            x={-48 + i * 25}
            y={-11}
            width="22"
            height="22"
            rx="3"
            fill="var(--c-data)"
            opacity="0.22"
            stroke="var(--c-data)"
            strokeWidth="1.6"
          />
          <text
            x={-37 + i * 25}
            y="4"
            textAnchor="middle"
            fill="var(--c-ink)"
            fontSize="9"
            fontFamily="var(--f-mono)"
          >
            {part}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Weights. A wall of knobs nobody set by hand. */
function Dials({ order }: { order: number }) {
  const angles = [-40, 25, -12, 55, -30, 10];
  return (
    <g>
      {angles.map((angle, i) => {
        const cx = -50 + (i % 3) * 34;
        const cy = i < 3 ? -14 : 16;
        return (
          <g key={i} className="nrn-pop" style={{ animationDelay: `${order * 0.22 + i * 0.08}s` }}>
            <circle cx={cx} cy={cy} r="11" fill="var(--c-ground-deep)" stroke="var(--c-line)" strokeWidth="2" />
            <line
              x1={cx}
              y1={cy}
              x2={cx + 7 * Math.sin((angle * Math.PI) / 180)}
              y2={cy - 7 * Math.cos((angle * Math.PI) / 180)}
              stroke="var(--c-spark)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
}

/** Training data. You only know what you saw. */
function Album({ order, flagged }: { order: number; flagged: boolean }) {
  return (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const odd = flagged && i === 3;
        return (
          <g key={i} className="nrn-pop" style={{ animationDelay: `${order * 0.22 + i * 0.11}s` }}>
            <rect
              x={-52 + i * 28}
              y="-20"
              width="24"
              height="30"
              rx="2"
              fill="var(--c-surface-hi)"
              stroke={odd ? 'var(--c-anomaly)' : 'var(--c-line)'}
              strokeWidth={odd ? 2.2 : 1.6}
            />
            <circle cx={-45 + i * 28} cy="-11" r="3" fill={odd ? 'var(--c-anomaly)' : 'var(--c-data)'} />
            <path
              d={`M${-51 + i * 28},9 L${-43 + i * 28},-2 L${-35 + i * 28},9 Z`}
              fill={odd ? 'var(--c-anomaly)' : 'var(--c-data)'}
              opacity="0.55"
            />
          </g>
        );
      })}
    </g>
  );
}

/** Bias. Every photo taken in the same room. */
function Room({ order }: { order: number }) {
  return (
    <g>
      <path
        d="M-52,-22 L52,-22 L52,18 L-52,18 Z"
        className="nrn-draw"
        style={drawIn(order)}
        pathLength={1}
        fill="none"
        stroke="var(--c-line)"
        strokeWidth="2"
      />
      <path
        d="M-52,18 L-34,4 L34,4 L52,18"
        className="nrn-draw"
        style={drawIn(order + 1)}
        pathLength={1}
        fill="none"
        stroke="var(--c-line)"
        strokeWidth="1.6"
      />
      {[-26, 0, 26].map((cx, i) => (
        <circle
          key={cx}
          cx={cx}
          cy="-6"
          r="7"
          className="nrn-pop"
          style={{ animationDelay: `${order * 0.22 + i * 0.12}s` }}
          fill="var(--c-data)"
        />
      ))}
    </g>
  );
}

/** Embeddings. A map where meaning is distance. */
function MeaningMap({ order }: { order: number }) {
  const nodes = [
    [-40, -14, 'cat'],
    [-22, 2, 'dog'],
    [26, -18, 'car'],
    [44, 4, 'bus'],
  ] as const;
  return (
    <g>
      <path
        d="M-40,-14 L-22,2 M26,-18 L44,4"
        className="nrn-draw"
        style={drawIn(order)}
        pathLength={1}
        stroke="var(--c-line)"
        strokeWidth="1.6"
      />
      {nodes.map(([nx, ny, label], i) => (
        <g key={label} className="nrn-pop" style={{ animationDelay: `${order * 0.22 + i * 0.1}s` }}>
          <circle cx={nx} cy={ny} r="4.5" fill={i < 2 ? 'var(--c-verified)' : 'var(--c-data)'} />
          <text x={nx} y={ny + 16} textAnchor="middle" fill="var(--c-ink-faint)" fontSize="8" fontFamily="var(--f-mono)">
            {label}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Gradient descent. Walking downhill in thick fog. */
function Fog({ order }: { order: number }) {
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x="-52"
          y={-22 + i * 12}
          width="104"
          height="7"
          rx="3.5"
          className="nrn-fill"
          style={fillIn(order + i * 0.4)}
          fill="var(--c-line)"
          opacity={0.75 - i * 0.16}
        />
      ))}
      <circle
        cx="-14"
        cy="6"
        r="5"
        className="nrn-pop"
        style={{ animationDelay: `${order * 0.22 + 0.5}s` }}
        fill="var(--c-spark)"
      />
    </g>
  );
}
