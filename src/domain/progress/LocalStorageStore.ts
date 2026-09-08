import type { IProgressStore } from './IProgressStore';
import type { ProgressState } from './state';
import { migrate } from './migrations';

const KEY = 'neuron.progress.v1';

/**
 * Browser persistence. Every access is guarded: Safari private mode throws on
 * write, and a thrown error here would take the whole app down.
 */
export class LocalStorageStore implements IProgressStore {
  constructor(
    private readonly storage: Storage,
    private readonly key: string = KEY,
  ) {}

  /** Returns null when storage is unusable, so the caller can fall back. */
  static tryCreate(): LocalStorageStore | null {
    try {
      const probe = '__neuron_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return new LocalStorageStore(window.localStorage);
    } catch {
      return null;
    }
  }

  load(): ProgressState | null {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return null;
      // null here means unreadable; ProgressService starts a fresh profile.
      return migrate(JSON.parse(raw), new Date().toISOString());
    } catch {
      return null;
    }
  }

  save(state: ProgressState): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(state));
    } catch {
      // Quota or private mode. Progress stays correct for this session.
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(this.key);
    } catch {
      /* nothing useful to do */
    }
  }
}
