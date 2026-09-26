import { Button } from './primitives/Button';
import { RevealDefs } from './RevealArt';
import { LoosePiece } from './JigsawPiece';

/**
 * The moment of reward.
 *
 * When a lesson is cleared for the first time, this pops up over the Done
 * screen with the actual jigsaw piece she just earned — the same tilted piece
 * she will find on the vault bench — and a clear next step: go and place it.
 * Earning and placing are separate on purpose, so the pop-up always says where
 * the piece went and offers to take her there.
 *
 * With motion off it is the same card, just still.
 */
export function RewardSplash({
  partIndex,
  onPlace,
  onDone,
}: {
  partIndex: number;
  onPlace: () => void;
  onDone: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-overlay flex items-center justify-center bg-ground-deep/85 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-title"
    >
      {/* Gradients for the piece artwork. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <RevealDefs />
      </svg>
      <div className="nrn-enter w-full max-w-sm rounded-2xl border border-spark/40 bg-surface p-6 text-center">
        {/* The burst, with the real piece in the middle of it. */}
        <div className="relative mx-auto h-40 w-40">
          <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={60 + Math.cos(a) * 44}
                  y1={60 + Math.sin(a) * 44}
                  x2={60 + Math.cos(a) * 57}
                  y2={60 + Math.sin(a) * 57}
                  stroke="var(--c-spark)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="nrn-ray"
                  style={{ animationDelay: `${i * 0.03}s` }}
                />
              );
            })}
          </svg>
          <div className="nrn-reward-pop absolute inset-0 grid place-items-center">
            <LoosePiece index={partIndex} size={112} idPrefix="reward" />
          </div>
        </div>

        <h2 id="reward-title" className="mt-4 font-display text-xl text-ink">
          You earned a puzzle piece!
        </h2>
        <p className="mt-1 text-sm text-ink-dim">
          It is waiting in your vault. Put it in its place to see a bit more of the hidden picture.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Button className="w-full" onClick={onPlace}>
            Place it now
          </Button>
          <Button tone="ghost" className="w-full" onClick={onDone}>
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
