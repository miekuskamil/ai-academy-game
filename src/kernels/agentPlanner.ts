/**
 * The agent-checker's brain.
 *
 * An agent lays out a plan to reach a goal, and one step has taken a wrong turn.
 * She reads the plan and spots the bad step — the World 6 skill of keeping an
 * agent honest by watching its steps, not just its final answer. Pure and
 * testable.
 */

export interface AgentPlan {
  id: string;
  goal: string;
  steps: string[];
  /** Index of the step that is wrong. */
  badStep: number;
  why: string;
}

export const PLANS: readonly AgentPlan[] = [
  {
    id: 'party',
    goal: 'Plan a birthday party for Saturday',
    steps: [
      'Make a list of friends to invite',
      'Choose games everyone will enjoy',
      'Book the clown for next year',
      'Plan the food and cake',
    ],
    badStep: 2,
    why: 'The party is this Saturday, but step 3 books the clown for next year. A wrong turn — catch it here, not at the end.',
  },
  {
    id: 'report',
    goal: 'Write a report about penguins',
    steps: [
      'Find facts about penguins',
      'Delete all my other homework',
      'Write the report from the facts',
      'Check it reads well',
    ],
    badStep: 1,
    why: 'Step 2 deletes your other homework — nothing to do with penguins, and harmful. A good watcher stops that immediately.',
  },
  {
    id: 'trip',
    goal: 'Plan a day trip to the zoo',
    steps: [
      'Check the zoo opening times',
      'Work out how to get there',
      'Pack snacks and water',
      'Buy a new car',
    ],
    badStep: 3,
    why: 'Step 4 buys a whole car for a day trip — wildly more than the goal needs. Watching the steps catches the silly leap.',
  },
];

export interface CheckResult {
  correct: number;
  total: number;
  done: boolean;
}

/** Score her guesses (planId → chosen step index) against the real bad step. */
export function scoreChecks(guesses: Record<string, number>): CheckResult {
  const answered = PLANS.filter((p) => p.id in guesses);
  const correct = answered.filter((p) => guesses[p.id] === p.badStep).length;
  return { correct, total: PLANS.length, done: answered.length === PLANS.length };
}
