import type { Comic } from '../../../domain/types';
import { Panel, Bubble, InkDefs, drawIn, fillIn } from '../ink';
import { Iskra, Mila, Table, Dog, LegCount } from '../cast';

/**
 * "Iskra gets it wrong" — the cold open for World 1.
 *
 * The lesson is that a rule written by a person can be confidently, uselessly
 * wrong, and the scene has to land that before anyone says the words "rule" or
 * "learning". So the argument is carried by the drawing: a table's four legs
 * are counted, a dog's four legs are counted the *same way*, and Iskra stamps
 * her conclusion on the dog. A ten-year-old gets the joke and the flaw in one
 * beat, which is the point of putting the concrete before the symbolic.
 */
export function W1RulesScene({ visible }: { visible: number }) {
  return (
    <div className="flex flex-col gap-3">
      <InkDefs />

      {visible >= 0 && (
        <figure className="overflow-hidden rounded-lg border border-line">
          <Panel
            seed={2}
            viewBox="0 0 320 200"
            className="w-full"
            label="Iskra, a small lamp-like robot, stands alone looking uncertain."
          >
            {[46, 78].map((r, i) => (
              <circle
                key={r}
                cx="160"
                cy="120"
                r={r}
                className="nrn-draw"
                style={drawIn(i)}
                pathLength={1}
                fill="none"
                stroke="var(--c-line)"
                strokeWidth="1.4"
                strokeDasharray="1"
              />
            ))}
            <Iskra x={160} y={118} scale={1.35} mood="calm" order={1} />
          </Panel>
          <figcaption className="border-t border-line bg-ground-deep px-4 py-3 text-sm italic text-ink-dim">
            This is Iskra. She is new here, and she is not very good yet.
          </figcaption>
        </figure>
      )}

      {visible >= 1 && (
        <Panel
          seed={7}
          viewBox="0 0 320 200"
          className="w-full overflow-hidden rounded-lg border border-line"
          label="Iskra proudly announces her rule: if it has four legs, it is a table. A table stands beside her with its four legs counted one, two, three, four."
        >
          <Bubble
            x={16}
            y={12}
            width={178}
            lines={['I have a RULE. If it has', 'four legs, it is a table.']}
            tail={[238, 104]}
            tone="spark"
            order={3}
          />
          <Table x={95} y={148} scale={1.15} order={0} />
          <LegCount xs={[67, 85, 105, 123]} y={162} order={2} />
          <Iskra x={258} y={122} scale={1.05} mood="proud" order={1} flip />
        </Panel>
      )}

      {visible >= 2 && (
        <Panel
          seed={13}
          viewBox="0 0 320 200"
          className="w-full overflow-hidden rounded-lg border border-line"
          label="Mila points out her dog, which also has four legs, counted one, two, three, four in exactly the same way."
        >
          <Bubble
            x={112}
            y={8}
            width={192}
            lines={['That is my dog.', 'He has four legs.']}
            tail={[86, 86]}
            tone="data"
            order={3}
          />
          <Mila x={68} y={82} scale={0.95} mood="confused" order={0} />
          <Dog x={196} y={152} scale={1.05} order={1} />
          <LegCount xs={[177, 190, 204, 217]} y={166} order={3} tone="var(--c-verified)" />
        </Panel>
      )}

      {visible >= 3 && (
        <Panel
          seed={21}
          viewBox="0 0 320 200"
          className="w-full overflow-hidden rounded-lg border border-line"
          label="Iskra calmly stamps the word TABLE across the dog, insisting her rule says so. The dog is unimpressed."
        >
          <Bubble
            x={14}
            y={10}
            width={170}
            lines={['Then your dog is a table.', 'My rule says so.']}
            tail={[250, 100]}
            tone="spark"
            order={4}
          />
          <Dog x={130} y={150} scale={1.05} order={0} />

          {/* The conclusion, stamped rather than argued. */}
          <g transform="translate(128 136)">
            <g className="nrn-stamp" style={{ animationDelay: '1.5s' }}>
              <rect
                x="-52"
                y="-15"
                width="104"
                height="30"
                rx="3"
                fill="none"
                stroke="var(--c-anomaly)"
                strokeWidth="3"
              />
              <text
                x="0"
                y="7"
                textAnchor="middle"
                fill="var(--c-anomaly)"
                fontSize="20"
                fontFamily="var(--f-display)"
                fontWeight="700"
                letterSpacing="3"
              >
                TABLE
              </text>
            </g>
          </g>

          <Iskra x={270} y={118} scale={1} mood="calm" order={1} flip />
          <text
            x="196"
            y="44"
            className="nrn-fill"
            style={fillIn(6)}
            fill="var(--c-ink-faint)"
            fontSize="11"
            fontFamily="var(--f-body)"
            fontStyle="italic"
          >
            (he is not a table)
          </text>
        </Panel>
      )}
    </div>
  );
}

/**
 * Scene registry.
 *
 * A comic id with a drawn scene renders it; anything else falls back to the
 * text player, so authoring a lesson never blocks on artwork existing yet.
 */
export const SCENES: Record<string, (props: { visible: number }) => JSX.Element> = {
  'w1-01-open': W1RulesScene,
};

export function sceneFor(comic: Comic) {
  return SCENES[comic.id];
}
