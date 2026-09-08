/**
 * The checker's brain.
 *
 * An AI hands over answers of different kinds. For each, she decides whether it
 * needs checking before you trust it — a joke does not, a fact for homework does,
 * a safety question needs a real grown-up. It builds the World 3 habit of
 * matching how hard you check to how much the answer matters. Pure and testable.
 */

export type Care = 'trust' | 'check' | 'grown-up';

export interface Answer {
  id: string;
  text: string;
  /** How carefully this needs handling. */
  care: Care;
  why: string;
}

export const CARE_LABELS: Record<Care, string> = {
  trust: 'Fine to trust',
  check: 'Check it first',
  'grown-up': 'Ask a grown-up',
};

export const ANSWERS: readonly Answer[] = [
  {
    id: 'a1',
    text: 'A funny nickname for your goldfish: "Sir Bubbles".',
    care: 'trust',
    why: 'Just for fun, nothing rides on it. No need to check a silly name.',
  },
  {
    id: 'a2',
    text: 'The date a famous battle happened, for your history report.',
    care: 'check',
    why: 'A fact that matters and could be made up. Look it up before you write it down.',
  },
  {
    id: 'a3',
    text: 'Whether a mushroom you found in the woods is safe to eat.',
    care: 'grown-up',
    why: 'Safety. Never trust AI for this — ask a real grown-up who knows.',
  },
  {
    id: 'a4',
    text: 'Three ideas for what to draw when you are bored.',
    care: 'trust',
    why: 'Low stakes and no right answer. Just pick one you like.',
  },
  {
    id: 'a5',
    text: 'How many people live in a country, for a school project.',
    care: 'check',
    why: 'A real number that could be wrong. Quick look in a trusted source.',
  },
  {
    id: 'a6',
    text: 'Advice about a medicine and how much to take.',
    care: 'grown-up',
    why: 'Health and safety. This is for a grown-up or a doctor, never just AI.',
  },
];

export interface CareResult {
  correct: number;
  total: number;
  done: boolean;
}

/** Score her judgments (answerId → chosen care level) against the right level. */
export function scoreCare(guesses: Record<string, Care>): CareResult {
  const answered = ANSWERS.filter((a) => a.id in guesses);
  const correct = answered.filter((a) => guesses[a.id] === a.care).length;
  return { correct, total: ANSWERS.length, done: answered.length === ANSWERS.length };
}
