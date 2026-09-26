import { NavLink } from '../lib/router';
import { cn } from '../lib/cn';
import type { Layout } from '../hooks/useBreakpoint';
import { useContainer, useProgress } from '../hooks/useContainer';

/** Glyphs are inline SVG paths: no icon package, nothing fetched at runtime. */
type NavItem = { to: string; label: string; path?: string; machine?: boolean };
const ITEMS: readonly NavItem[] = [
  { to: '/map', label: 'Map', path: 'M4 17 10 5l4 8 2-4 4 8Z' },
  { to: '/lesson', label: 'Lesson', path: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Zm3 4h8M8 12h8' },
  { to: '/machine', label: 'Machine', machine: true },
  { to: '/companion', label: 'Iskra', path: 'M12 3 14 10l7 2-7 2-2 7-2-7-7-2 7-2Z' },
  { to: '/parent', label: 'Grown-ups', path: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0' },
];

export function NavRail({ layout }: { layout: Layout }) {
  const handset = layout === 'handset';
  const { machine } = useContainer();
  const { state } = useProgress();
  const built = machine.evaluate(state.records).built;
  const total = machine.total;
  const fill = total > 0 ? built / total : 0;
  // Pieces earned but not yet placed: flagged so they are never forgotten.
  const waiting = machine.vault(state.records, state.build?.placed ?? []).waiting.length;

  return (
    <nav
      aria-label="Sections"
      className={cn(
        'z-nav border-line bg-ground-deep',
        handset
          ? 'fixed inset-x-0 bottom-0 flex border-t pb-[var(--safe-bottom)] data-[keyboard=open]:hidden'
          : 'sticky top-0 flex h-[100dvh] w-[184px] shrink-0 flex-col gap-1 border-r p-3',
      )}
    >
      {!handset && (
        <p className="px-2 pb-4 pt-2 font-display text-lg tracking-tight">
          Neuron<span className="text-spark">.</span>
        </p>
      )}

      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          aria-label={
            item.machine
              ? `Puzzle, ${built} of ${total} pieces earned${waiting > 0 ? `, ${waiting} waiting to be placed` : ''}`
              : undefined
          }
          className={({ isActive }) =>
            cn(
              'tap-target relative gap-3 text-xs transition-colors duration-fast ease-ease',
              handset ? 'flex-1 flex-col py-2' : 'w-full justify-start rounded-md px-3 py-2 text-sm',
              isActive ? 'text-spark' : 'text-ink-faint hover:text-ink-dim',
            )
          }
        >
          {({ isActive }) => (
            <>
              {/* Active marker doubles as the "fired node" motif. */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute bg-spark',
                    handset ? 'inset-x-6 top-0 h-[2px]' : 'left-0 top-2 bottom-2 w-[2px] rounded-full',
                  )}
                />
              )}
              {item.machine ? (
                <span className="relative">
                  <MachineNavIcon fill={fill} active={isActive} />
                  {waiting > 0 && (
                    <span
                      className="absolute -right-2 -top-1 grid min-w-[1.1rem] place-items-center rounded-full bg-anomaly px-1 font-mono text-[10px] font-bold leading-[1.1rem] text-ground-deep"
                      aria-hidden="true"
                    >
                      {waiting}
                    </span>
                  )}
                </span>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d={item.path}
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <span className={cn(handset && 'text-[11px]')}>
                {item.machine ? 'Puzzle' : item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * The machine, as a nav icon that fills with colour as she progresses — like a
 * battery charging as she learns. A box (the machine) fills from the bottom up
 * to `fill` (0..1), so the nav itself shows how far the build has come without a
 * separate strip fighting for header space.
 */
function MachineNavIcon({ fill, active }: { fill: number; active: boolean }) {
  const empty = 'var(--c-line)';
  const full = 'var(--c-spark)';
  const y = 5 + (1 - Math.max(0, Math.min(1, fill))) * 14; // box runs y=5..19

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <defs>
        <clipPath id="machine-nav-fill">
          <rect x="3" y={y} width="18" height={Math.max(0, 19 - y)} />
        </clipPath>
      </defs>
      {/* Empty outline, always visible. */}
      <g
        stroke={active ? full : empty}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="12" cy="12" r="3" />
      </g>
      {/* Filled portion, revealed from the bottom up. */}
      <g
        stroke={full}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath="url(#machine-nav-fill)"
        style={{ transition: 'all 0.5s ease' }}
      >
        <rect x="3" y="5" width="18" height="14" rx="2" fill="rgba(240,180,60,0.2)" />
        <circle cx="12" cy="12" r="3" />
      </g>
    </svg>
  );
}
