import type { Beat, Comic } from '../../domain/types';
import { Panel, Bubble, INK_SEEDS } from './ink';
import { Iskra, Mila } from './cast';
import { Prop } from './props';

/**
 * The default comic renderer.
 *
 * Hand-composing twenty scenes was never going to happen, so a panel is built
 * from the beat itself: who is speaking, what mood they are in, and which prop
 * the beat calls for. Every lesson gets a drawn, inked, animated comic for free,
 * and a bespoke scene can still override this where a lesson earns it.
 *
 * Panels are small on purpose. A beat is a beat, not a spread.
 */
export function GenericScene({ comic, visible }: { comic: Comic; visible: number }) {
  return (
    <div className="flex flex-col gap-3">
      {comic.beats.slice(0, visible + 1).map((beat, index) => (
        <BeatPanel key={beat.id} beat={beat} index={index} />
      ))}
    </div>
  );
}

function BeatPanel({ beat, index }: { beat: Beat; index: number }) {
  const seed = INK_SEEDS[index % INK_SEEDS.length]!;
  const narrator = beat.speaker === 'narrator';
  // Iskra sits right, Mila left, so a conversation reads as one across panels.
  const onRight = beat.speaker === 'iskra';
  const hasProp = beat.prop !== 'none';

  const lines = wrap(beat.text, narrator ? 46 : 30);
  const bubbleWidth = 168;
  const bubbleX = onRight ? 14 : 320 - bubbleWidth - 14;
  const height = narrator ? 132 : 168;

  return (
    <figure className="overflow-hidden rounded-lg border border-line">
      <Panel
        seed={seed}
        viewBox={`0 0 320 ${height}`}
        className="w-full"
        label={describe(beat)}
      >
        {narrator ? (
          <>
            {hasProp && <Prop kind={beat.prop} mood={beat.mood} x={160} y={height / 2} order={0} />}
            {!hasProp && <Iskra x={160} y={height / 2 - 4} scale={1.1} mood={beat.mood} order={0} />}
          </>
        ) : (
          <>
            {hasProp && (
              <Prop
                kind={beat.prop}
                mood={beat.mood}
                x={onRight ? 108 : 212}
                y={height - 52}
                order={1}
              />
            )}
            {beat.speaker === 'iskra' ? (
              <Iskra x={272} y={height - 58} scale={0.95} mood={beat.mood} order={0} flip />
            ) : (
              <Mila x={48} y={height - 96} scale={0.82} mood={beat.mood} order={0} />
            )}
            <Bubble
              x={bubbleX}
              y={12}
              width={bubbleWidth}
              lines={lines}
              tail={onRight ? [258, height - 74] : [62, height - 88]}
              tone={beat.speaker === 'iskra' ? 'spark' : 'data'}
              order={2}
            />
          </>
        )}
      </Panel>

      {narrator && (
        <figcaption className="border-t border-line bg-ground-deep px-4 py-3 text-sm italic text-ink-dim">
          {beat.text}
        </figcaption>
      )}
    </figure>
  );
}

/** Greedy wrap. Speech bubbles hold two or three short lines comfortably. */
function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && `${line} ${word}`.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const MOOD_WORD: Record<Beat['mood'], string> = {
  calm: 'calmly',
  curious: 'curiously',
  excited: 'excitedly',
  confused: 'looking confused',
  proud: 'proudly',
};

/** What the panel draws, for anyone who cannot see it. */
function describe(beat: Beat): string {
  if (beat.speaker === 'narrator') return beat.text;
  const who = beat.speaker === 'iskra' ? 'Iskra' : 'Mila';
  return `${who}, ${MOOD_WORD[beat.mood]}: ${beat.text}`;
}
