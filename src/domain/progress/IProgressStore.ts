import type { ProgressState } from './state';

/**
 * The persistence seam.
 *
 * Web uses localStorage, Android will use Capacitor Preferences, tests use an
 * in-memory fake. Nothing above this interface knows which is in play — that is
 * the whole cost of the Android port for saved progress.
 */
export interface IProgressStore {
  load(): ProgressState | null;
  save(state: ProgressState): void;
  clear(): void;
}
