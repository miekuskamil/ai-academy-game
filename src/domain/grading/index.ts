import { GraderRegistry } from './GraderRegistry';
import { McqGrader } from './graders/McqGrader';
import { OrderGrader } from './graders/OrderGrader';
import { MatchGrader } from './graders/MatchGrader';
import { NumericGrader } from './graders/NumericGrader';
import { PromptRubricGrader } from './graders/PromptRubricGrader';
import { SandboxGrader } from './graders/SandboxGrader';

export { GraderRegistry } from './GraderRegistry';
export { GradingService } from './GradingService';
export { SandboxGrader } from './graders/SandboxGrader';
export type { SandboxCheck } from './graders/SandboxGrader';
export type { IGrader, GradeOutcome } from './IGrader';

/** The default set. Sandboxes add their checks to the returned SandboxGrader. */
export function createGraderRegistry(): {
  registry: GraderRegistry;
  sandbox: SandboxGrader;
} {
  const sandbox = new SandboxGrader();
  const registry = new GraderRegistry()
    .register(new McqGrader())
    .register(new OrderGrader())
    .register(new MatchGrader())
    .register(new NumericGrader())
    .register(new PromptRubricGrader())
    .register(sandbox);
  return { registry, sandbox };
}
