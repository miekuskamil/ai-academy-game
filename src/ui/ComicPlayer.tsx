import { useEffect, useState } from 'react';
import type { Comic } from '../domain/types';
import { Button } from './primitives/Button';
import { useReducedMotion } from '../hooks/useBreakpoint';
import { InkDefs } from './comic/ink';
import { GenericScene } from './comic/GenericScene';
import { sceneFor } from './comic/scenes/W1RulesScene';

/**
 * The cold open, and the callback that closes the loop.
 *
 * Concrete before symbolic: a learner watches Iskra get something wrong before
 * anyone names the concept. Iskra is deliberately flawed, so the idea arrives
 * as a bug the learner owns rather than a definition handed down.
 *
 * Every comic is drawn. A lesson with a bespoke scene uses it; everything else
 * gets a panel built from the beat data itself, which is what makes twenty
 * animated lessons affordable.
 */
export function ComicPlayer({
  comic,
  onFinish,
  finishLabel = 'Try it yourself',
}: {
  comic: Comic;
  onFinish: () => void;
  finishLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [take, setTake] = useState(0);
  const reduced = useReducedMotion();

  // Reduced motion gets the whole strip at once: a panel grid, not a sequence.
  useEffect(() => {
    if (reduced) setShowAll(true);
  }, [reduced]);

  const atEnd = showAll || index >= comic.beats.length - 1;
  const visible = showAll ? comic.beats.length - 1 : index;
  const Bespoke = sceneFor(comic);

  return (
    <section aria-label={comic.title}>
      <InkDefs />
      {/* `take` remounts the scene, which restarts every CSS animation. */}
      {Bespoke ? (
        <Bespoke key={take} visible={visible} />
      ) : (
        <GenericScene key={take} comic={comic} visible={visible} />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {atEnd ? (
          <Button onClick={onFinish}>{finishLabel}</Button>
        ) : (
          <>
            <Button onClick={() => setIndex((n) => n + 1)}>Next</Button>
            <Button tone="ghost" onClick={() => setShowAll(true)}>
              Show the whole scene
            </Button>
          </>
        )}
        <Button tone="ghost" onClick={() => setTake((n) => n + 1)}>
          Draw it again
        </Button>
        {!showAll && (
          <p className="font-mono text-xs text-ink-faint" aria-hidden="true">
            {index + 1}/{comic.beats.length}
          </p>
        )}
      </div>
    </section>
  );
}
