import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createContainer, type Container, type ContainerOptions } from '../domain/container';
import type { ProgressSnapshot } from '../domain/progress/ProgressService';

const ContainerContext = createContext<Container | null>(null);

export function ContainerProvider({
  children,
  options,
  value,
}: {
  children: ReactNode;
  options?: ContainerOptions;
  /** Tests inject a fully built container here. */
  value?: Container;
}) {
  const container = useMemo(() => value ?? createContainer(options), [value, options]);
  useEffect(() => () => container.narrative.dispose(), [container]);
  return <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>;
}

export function useContainer(): Container {
  const container = useContext(ContainerContext);
  if (!container) throw new Error('useContainer must be used inside ContainerProvider');
  return container;
}

/**
 * Subscribes to progress changes and re-renders with a fresh snapshot.
 *
 * Components read derived state (status, level) rather than raw records, so no
 * component ever recomputes progression rules for itself.
 */
export function useProgress(): ProgressSnapshot {
  const { progress, bus } = useContainer();
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>(() => progress.snapshot());
  const latest = useRef(snapshot);
  latest.current = snapshot;

  useEffect(() => {
    return bus.on('progress:changed', () => setSnapshot(progress.snapshot()));
  }, [bus, progress]);

  return snapshot;
}
