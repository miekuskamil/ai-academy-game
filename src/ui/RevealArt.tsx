/**
 * The hidden picture.
 *
 * One inline SVG scene — the "AI machine" the whole course is secretly building:
 * a friendly contraption that takes words in, thinks, and speaks out. It is drawn
 * once at the full board size; each jigsaw piece clips this same artwork to its
 * own cell, so placing pieces slowly reveals the picture. Inline so the single-
 * file build stays fully offline.
 *
 * Kept intentionally busy and abstract so a single early piece is hard to read —
 * you only see what it is once several pieces join up.
 */
/** The picture's own coordinate space. */
export const ART_W = 400;
export const ART_H = 500;

/** Gradients the scene uses. Render once per page, inside any <svg>. */
export function RevealDefs() {
  return (
    <defs>
        <linearGradient id="revsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#12203a" />
          <stop offset="1" stopColor="#0d1424" />
        </linearGradient>
        <radialGradient id="revglow" cx="0.5" cy="0.42" r="0.5">
          <stop offset="0" stopColor="#f0b43c" stopOpacity="0.5" />
          <stop offset="1" stopColor="#f0b43c" stopOpacity="0" />
        </radialGradient>
    </defs>
  );
}

/**
 * The scene as plain SVG shapes in a 400×500 space. Pieces clip and scale this
 * group directly — no foreignObject, which renders unreliably under clip paths.
 */
export function RevealScene() {
  return (
    <g aria-hidden="true">
      {/* backdrop */}
      <rect width="400" height="500" fill="url(#revsky)" />
      <circle cx="200" cy="210" r="150" fill="url(#revglow)" />

      {/* scattered word-motes drifting into the intake (top) */}
      <g fill="#6ea9d8" opacity="0.9">
        {Array.from({ length: 22 }).map((_, i) => {
          const x = 30 + ((i * 53) % 340);
          const y = 20 + ((i * 37) % 120);
          const r = 2 + ((i * 7) % 4);
          return <circle key={i} cx={x} cy={y} r={r} />;
        })}
      </g>

      {/* intake funnel */}
      <path d="M120 120 L280 120 L232 176 L168 176 Z" fill="#1c2c4a" stroke="#6ea9d8" strokeWidth="3" />
      <rect x="168" y="176" width="64" height="26" fill="#1c2c4a" stroke="#6ea9d8" strokeWidth="3" />

      {/* core body */}
      <rect x="96" y="206" width="208" height="170" rx="22" fill="#182238" stroke="#f0b43c" strokeWidth="4" />
      {/* core "brain" gears */}
      <g stroke="#f0b43c" strokeWidth="3" fill="none">
        <circle cx="160" cy="270" r="34" />
        <circle cx="160" cy="270" r="12" fill="#f0b43c" />
        <circle cx="244" cy="300" r="26" />
        <circle cx="244" cy="300" r="9" fill="#f0b43c" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={160 + Math.cos(a) * 34}
              y1={270 + Math.sin(a) * 34}
              x2={160 + Math.cos(a) * 44}
              y2={270 + Math.sin(a) * 44}
            />
          );
        })}
      </g>

      {/* dial bank */}
      <g stroke="#5fb87a" strokeWidth="3" fill="none">
        <rect x="112" y="330" width="176" height="30" rx="8" />
        <circle cx="134" cy="345" r="8" />
        <circle cx="170" cy="345" r="8" />
        <circle cx="206" cy="345" r="8" />
        <circle cx="242" cy="345" r="8" />
        <circle cx="268" cy="345" r="8" />
      </g>

      {/* speaker / output at the mouth */}
      <path d="M150 376 L250 376 L280 430 L120 430 Z" fill="#1c2c4a" stroke="#d67ab0" strokeWidth="3" />
      <g stroke="#d67ab0" strokeWidth="3" fill="none">
        <path d="M200 430 q 30 24 20 54" />
        <path d="M200 430 q -30 24 -20 54" />
        <path d="M200 430 v 54" />
      </g>

      {/* little hands reaching out the sides (agents) */}
      <g stroke="#f0b43c" strokeWidth="3" fill="none">
        <path d="M96 250 q -34 6 -44 34" />
        <circle cx="48" cy="290" r="8" />
        <path d="M304 250 q 34 6 44 34" />
        <circle cx="352" cy="290" r="8" />
      </g>

      {/* friendly eyes on the core so the reveal feels like a character */}
      <g fill="#e6ebf5">
        <circle cx="150" cy="238" r="6" />
        <circle cx="250" cy="238" r="6" />
      </g>
    </g>
  );
}
