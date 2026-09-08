import { PROGRESS_VERSION, type ProgressState } from './state';

/**
 * Save-file migrations.
 *
 * A child's progress has to survive a year of changes to this app. Every
 * version bump adds a step here; unknown or corrupt data degrades to a fresh
 * profile rather than throwing, because a crash-on-load would be unfixable
 * from the learner's side.
 */
type Migration = (input: Record<string, unknown>) => Record<string, unknown>;

const MIGRATIONS: Record<number, Migration> = {
  // 0 -> 1 exists to prove the mechanism end to end before it is needed.
  0: (input) => ({ ...input, v: 1, companionName: input.companionName ?? 'Iskra' }),
};

/**
 * Returns null when the data cannot be brought to the current version.
 *
 * Returning an empty profile here would be worse than useless: `import` could
 * not tell "migrated fine" from "unreadable", and a corrupt backup file would
 * silently erase real progress. Callers decide what a failure means — loading
 * falls back to a fresh profile, importing refuses and changes nothing.
 */
export function migrate(raw: unknown, _now: string): ProgressState | null {
  if (!raw || typeof raw !== 'object') return null;

  let working = { ...(raw as Record<string, unknown>) };
  let version = typeof working.v === 'number' ? working.v : 0;

  while (version < PROGRESS_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return null;
    working = step(working);
    const next = typeof working.v === 'number' ? working.v : version + 1;
    // Guard against a migration that fails to advance the version.
    version = next > version ? next : version + 1;
    working.v = version;
  }

  return isProgressState(working) ? working : null;
}

/** Structural check. Rejects anything that would break the reducers. */
export function isProgressState(value: unknown): value is ProgressState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ProgressState>;
  if (candidate.v !== PROGRESS_VERSION) return false;
  if (candidate.track !== 'explorer' && candidate.track !== 'builder') return false;
  if (typeof candidate.companionName !== 'string') return false;
  if (!candidate.records || typeof candidate.records !== 'object') return false;

  for (const [key, record] of Object.entries(candidate.records)) {
    if (!record || typeof record !== 'object') return false;
    const entry = record as Partial<import('./state').LessonRecord>;
    if (entry.lessonId !== key) return false;
    if (typeof entry.best !== 'number' || entry.best < 0 || entry.best > 1) return false;
    if (typeof entry.attempts !== 'number' || entry.attempts < 0) return false;
    if (typeof entry.bestUnaided !== 'boolean') return false;
  }
  return true;
}
