import type { ProgressState } from './state';
import type { IProgressStore } from './IProgressStore';

/** In-memory store for tests, and the fallback when device storage is
 *  unavailable (private browsing, quota exhausted, storage disabled). */
export class MemoryStore implements IProgressStore {
  private state: ProgressState | null;

  constructor(initial: ProgressState | null = null) {
    this.state = initial ? structuredClone(initial) : null;
  }

  load(): ProgressState | null {
    return this.state ? structuredClone(this.state) : null;
  }

  save(state: ProgressState): void {
    this.state = structuredClone(state);
  }

  clear(): void {
    this.state = null;
  }
}
