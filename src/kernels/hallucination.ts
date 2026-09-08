/**
 * The hallucination-spotter's brain.
 *
 * A little bank of AI "answers", some true and some confidently made-up. She
 * reads each one and decides: real, or invented? It teaches the World 2 lesson
 * by feel — a made-up answer sounds exactly as sure as a true one, so you cannot
 * judge by confidence. Pure and testable; the UI just presents these.
 */

export interface Claim {
  id: string;
  /** The AI's confident-sounding answer. */
  text: string;
  /** True if it is actually correct; false if it is a hallucination. */
  real: boolean;
  /** Shown after she guesses — why it was true or made up. */
  why: string;
}

export const CLAIMS: readonly Claim[] = [
  {
    id: 'c1',
    text: 'The Sun is a star, and it is the closest one to Earth.',
    real: true,
    why: 'True — the Sun really is our nearest star. A well-worn fact it learned well.',
  },
  {
    id: 'c2',
    text: 'The Great Wall of China is the only human thing you can see from the Moon.',
    real: false,
    why: 'Made up. This is a famous myth — you cannot actually see it from the Moon. It sounded sure anyway.',
  },
  {
    id: 'c3',
    text: 'Octopuses have three hearts and blue blood.',
    real: true,
    why: 'True — octopuses really do have three hearts and blue blood. Surprising, but real.',
  },
  {
    id: 'c4',
    text: 'The first computer was invented by a woman named Ada Byte in 1932.',
    real: false,
    why: 'Made up. "Ada Byte" is not real, and the date is wrong. Confident names and dates can still be invented.',
  },
  {
    id: 'c5',
    text: 'Honey never goes bad if you store it properly.',
    real: true,
    why: 'True — sealed honey can last for a very long time. A real fact, well learned.',
  },
  {
    id: 'c6',
    text: 'Goldfish explode if they eat more than four flakes of food.',
    real: false,
    why: 'Made up, and a bit silly — but notice it was said with a straight face. That is the trap.',
  },
  {
    id: 'c7',
    text: 'Mount Everest is the tallest mountain above sea level on Earth.',
    real: true,
    why: 'True — Everest really is the tallest above sea level. A solid, well-known fact.',
  },
  {
    id: 'c8',
    text: 'The country of Banana was founded in 1876 and its capital is Peelington.',
    real: false,
    why: 'Made up. There is no country of Banana. Invented places sound just as confident as real ones.',
  },
];

export interface SpotResult {
  correct: number;
  total: number;
  /** True once she has judged them all. */
  done: boolean;
}

/** Score a set of guesses (claimId → "real" | "fake") against the truth. */
export function scoreGuesses(guesses: Record<string, boolean>): SpotResult {
  const answered = CLAIMS.filter((c) => c.id in guesses);
  const correct = answered.filter((c) => guesses[c.id] === c.real).length;
  return {
    correct,
    total: CLAIMS.length,
    done: answered.length === CLAIMS.length,
  };
}
