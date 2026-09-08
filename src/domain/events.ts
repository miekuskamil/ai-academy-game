/**
 * Typed event bus.
 *
 * Unlocks, level gain and narrative beats all react to the *same* recorded
 * attempt, in the same frame. That is why the tree lighting up and the level
 * bar filling read as one causal thing rather than two systems.
 */

export interface DomainEvents {
  'attempt:recorded': { lessonId: string; score: number; usedHints: boolean };
  'lesson:completed': { lessonId: string };
  'lesson:mastered': { lessonId: string };
  'lesson:unlocked': { lessonId: string };
  'level:gained': { from: number; to: number };
  'progress:changed': { reason: 'attempt' | 'reset' | 'import' | 'settings' };
}

type Handler<K extends keyof DomainEvents> = (payload: DomainEvents[K]) => void;

export class EventBus {
  private readonly handlers = new Map<keyof DomainEvents, Set<Handler<never>>>();

  on<K extends keyof DomainEvents>(event: K, handler: Handler<K>): () => void {
    const set = this.handlers.get(event) ?? new Set<Handler<never>>();
    set.add(handler as Handler<never>);
    this.handlers.set(event, set);
    return () => void set.delete(handler as Handler<never>);
  }

  emit<K extends keyof DomainEvents>(event: K, payload: DomainEvents[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // Snapshot: a handler is allowed to unsubscribe during dispatch.
    for (const handler of [...set]) (handler as Handler<K>)(payload);
  }

  clear(): void {
    this.handlers.clear();
  }
}
