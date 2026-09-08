import type { CSSProperties, ReactNode } from 'react';

/**
 * The ink layer.
 *
 * Everything hand-drawn here is generated, not authored: clean geometry passed
 * through a turbulence displacement filter comes out looking inked by hand.
 * That keeps the whole comic system as SVG paths and CSS — no image assets, no
 * animation library, nothing fetched at runtime — while still reading as a
 * sketchbook rather than a diagram.
 *
 * Two rules hold across every scene:
 *   1. A different filter seed per panel, so no two lines wobble identically.
 *   2. Nothing is conveyed by motion alone. Reduced motion collapses every
 *      drawing to its finished state and the captions carry the same content.
 */

export const INK_SEEDS = [2, 7, 13, 21, 34] as const;

/** Rendered once per scene. Filters are referenced by id from every panel. */
export function InkDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        {INK_SEEDS.map((seed) => (
          <filter key={seed} id={`nrn-rough-${seed}`} x="-12%" y="-12%" width="124%" height="124%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.024"
              numOctaves="2"
              seed={seed}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2.4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        ))}

        {/* Paper tooth, laid over a panel at low opacity. */}
        <filter id="nrn-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="5" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * A stroke that inks itself on.
 *
 * `pathLength="1"` normalises every path to a unit length, so one CSS rule
 * animates a dash offset from 1 to 0 regardless of the path's real geometry —
 * no measuring, no JS.
 */
export function drawIn(order: number, speed = 1): CSSProperties {
  return {
    animationDelay: `${order * 0.22}s`,
    animationDuration: `${0.9 * speed}s`,
  };
}

/** A filled shape that fades in behind its outline. */
export function fillIn(order: number): CSSProperties {
  return { animationDelay: `${order * 0.22 + 0.34}s` };
}

export function Panel({
  seed,
  viewBox,
  children,
  className,
  label,
}: {
  seed: number;
  viewBox: string;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Paper */}
      <rect x="0" y="0" width="100%" height="100%" fill="var(--c-surface)" />
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        filter="url(#nrn-grain)"
        opacity="0.06"
        style={{ mixBlendMode: 'overlay' }}
      />
      <g filter={`url(#nrn-rough-${seed})`}>{children}</g>
    </svg>
  );
}

/**
 * A speech bubble with a tail pointing at whoever is talking.
 *
 * The text is real SVG text rather than a path, so it stays selectable and
 * readable to a screen reader.
 */
export function Bubble({
  x,
  y,
  width,
  lines,
  tail,
  tone = 'ink',
  order = 0,
}: {
  x: number;
  y: number;
  width: number;
  lines: string[];
  /** Where the tail lands, in the same user units. */
  tail: [number, number];
  tone?: 'ink' | 'spark' | 'data';
  order?: number;
}) {
  const lineHeight = 13;
  const padding = 10;
  const height = lines.length * lineHeight + padding * 2 - 3;
  const stroke =
    tone === 'spark' ? 'var(--c-spark)' : tone === 'data' ? 'var(--c-data)' : 'var(--c-ink-dim)';

  const cx = x + width / 2;
  const cy = y + height / 2;
  // Anchor the tail on whichever edge faces the speaker.
  const anchorX = Math.max(x + 12, Math.min(x + width - 12, tail[0]));
  const anchorY = tail[1] > cy ? y + height : y;

  return (
    <g className="nrn-pop" style={fillIn(order)}>
      <path
        d={`M${anchorX - 7},${anchorY} L${tail[0]},${tail[1]} L${anchorX + 7},${anchorY} Z`}
        fill="var(--c-ground-deep)"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="9"
        fill="var(--c-ground-deep)"
        stroke={stroke}
        strokeWidth="1.6"
      />
      {/* Cover the tail's base so the outline reads as one shape. */}
      <line
        x1={anchorX - 6}
        y1={anchorY}
        x2={anchorX + 6}
        y2={anchorY}
        stroke="var(--c-ground-deep)"
        strokeWidth="2.4"
      />
      <text
        x={cx}
        y={y + padding + 9}
        textAnchor="middle"
        fill="var(--c-ink)"
        fontSize="11"
        fontFamily="var(--f-body)"
      >
        {lines.map((line, i) => (
          <tspan key={line} x={cx} dy={i === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}
