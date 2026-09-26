import { useEffect, useRef, useState } from 'react';
import { useContainer, useProgress } from '../hooks/useContainer';
import { useNavigate } from '../lib/router';
import { cn } from '../lib/cn';
import type { MachineState } from '../domain/machine/MachineService';

/**
 * The machine progress marker.
 *
 * A bright, always-visible pill on the right edge that shows the machine
 * charging up as parts are earned. It is the reward marker — her place in the
 * build — so it is meant to catch the eye, not blend in: a solid spark-yellow
 * cap holds the count, a tube below charges with progress, and a fresh part
 * gives it a pulse. Tappable to the machine page.
 */
export function SaveTab() {
  const { machine } = useContainer();
  const { state } = useProgress();
  const navigate = useNavigate();

  const prev = useRef(0);
  const [snap, setSnap] = useState<MachineState>(() => machine.evaluate(state.records, 0));
  useEffect(() => {
    const next = machine.evaluate(state.records, prev.current);
    setSnap(next);
    prev.current = next.built;
  }, [machine, state.records]);

  const { built, total, justBuilt } = snap;
  const waiting = machine.vault(state.records, state.build?.placed ?? []).waiting.length;
  // Show at least a sliver of fill from the very first part, so it never looks
  // empty and broken.
  const pct = total > 0 ? Math.max(built > 0 ? 8 : 0, Math.round((built / total) * 100)) : 0;

  return (
    <button
      type="button"
      onClick={() => navigate('/machine')}
      aria-label={`Your puzzle, ${built} of ${total} pieces earned${waiting > 0 ? `, ${waiting} waiting to be placed` : ''}. Tap to open.`}
      className={cn(
        // Wider screens only: on a phone the bottom bar already carries this,
        // and a fixed tab there sits on top of lesson text.
        'nrn-press group fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 min-[769px]:flex flex-col items-center overflow-hidden rounded-full border-2 border-spark bg-ground-deep shadow-[0_0_20px_rgba(240,180,60,0.35)]',
        'transition-all hover:right-4 hover:shadow-[0_0_28px_rgba(240,180,60,0.5)]',
        justBuilt !== null && 'nrn-part-new',
      )}
    >
      {/* Solid spark cap with the count — the bright, unmissable bit. */}
      <span className="flex w-full flex-col items-center rounded-t-full bg-spark px-3 py-2 text-ground-deep">
        <span aria-hidden="true" className="text-sm leading-none">
          ⚙
        </span>
        <span className="mt-1 font-mono text-sm font-bold leading-none">
          {built}
          <span className="opacity-60">/{total}</span>
        </span>
      </span>
      {waiting > 0 && (
        <span className="w-full bg-anomaly py-1 text-center font-mono text-[10px] font-bold leading-none text-ground-deep">
          {waiting} new
        </span>
      )}

      {/* Charging tube below: fills with progress against a dark track. */}
      <span className="relative block h-20 w-full overflow-hidden rounded-b-full bg-ground-deep">
        <span
          className="absolute inset-x-0 bottom-0 bg-spark/70 transition-[height] duration-700 ease-ease"
          style={{ height: `${pct}%` }}
        />
        <span
          className="absolute inset-0 flex items-center justify-center font-mono text-[9px] uppercase tracking-widest text-ink-dim"
          style={{ writingMode: 'vertical-rl' }}
        >
          puzzle
        </span>
      </span>
    </button>
  );
}
