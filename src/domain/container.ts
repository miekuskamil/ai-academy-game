import bundle from '../generated/curriculum.json';
import type { CurriculumBundle } from './types';
import { Curriculum } from './curriculum';
import { EventBus } from './events';
import { UnlockPolicy } from './policy/UnlockPolicy';
import { LevelPolicy } from './policy/LevelPolicy';
import { NarrativeDirector } from './narrative/NarrativeDirector';
import { ProgressService } from './progress/ProgressService';
import type { IProgressStore } from './progress/IProgressStore';
import { LocalStorageStore } from './progress/LocalStorageStore';
import { MemoryStore } from './progress/MemoryStore';
import { GradingService, createGraderRegistry, type SandboxGrader, type SandboxCheck } from './grading';
import type { GraderRegistry } from './grading';
import type { IAIProvider } from './ai/IAIProvider';
import { NullProvider } from './ai/NullProvider';
import { PipelineService } from './pipeline/PipelineService';
import { MachineService } from './machine/MachineService';

export interface Container {
  curriculum: Curriculum;
  bus: EventBus;
  progress: ProgressService;
  unlocks: UnlockPolicy;
  levels: LevelPolicy;
  narrative: NarrativeDirector;
  grading: GradingService;
  graders: GraderRegistry;
  sandboxChecks: SandboxGrader;
  ai: IAIProvider;
  pipeline: PipelineService;
  machine: MachineService;
}

export interface ContainerOptions {
  store?: IProgressStore;
  ai?: IAIProvider;
  now?: () => string;
  /** Checks contributed by whichever sandboxes this build ships. */
  sandboxChecks?: SandboxCheck[];
}

/**
 * Composition root. This is the only place concrete classes are named;
 * components resolve behaviour through interfaces, which is what makes the
 * Android swap (Capacitor Preferences for localStorage) a one-line change and
 * lets every test run against in-memory fakes.
 */
export function createContainer(options: ContainerOptions = {}): Container {
  const curriculum = new Curriculum(bundle as CurriculumBundle);
  const bus = new EventBus();
  const unlocks = new UnlockPolicy(curriculum);
  const levels = new LevelPolicy(curriculum);

  const store =
    options.store ??
    (typeof window === 'undefined' ? new MemoryStore() : (LocalStorageStore.tryCreate() ?? new MemoryStore()));

  const progress = new ProgressService(store, curriculum, unlocks, levels, bus, options.now);
  const narrative = new NarrativeDirector(
    curriculum,
    levels,
    bus,
    () => progress.snapshot().state.companionName,
  );
  const { registry, sandbox } = createGraderRegistry();
  for (const check of options.sandboxChecks ?? []) sandbox.registerCheck(check);

  return {
    curriculum,
    bus,
    progress,
    unlocks,
    levels,
    narrative,
    grading: new GradingService(registry),
    graders: registry,
    sandboxChecks: sandbox,
    ai: options.ai ?? new NullProvider(),
    pipeline: new PipelineService(curriculum),
    machine: new MachineService(curriculum),
  };
}
