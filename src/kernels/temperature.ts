/**
 * The temperature dial's brain.
 *
 * She moves a dial from steady to wild and sees how the AI's answers change: low
 * gives the same safe answer every time, high gives varied, surprising ones. It
 * makes the World 2 temperature idea something she feels by moving it. Pure and
 * testable — the UI just picks from these banks by the dial value.
 */

export interface TempExample {
  /** The steadiest, most likely answer (what low temperature returns). */
  safe: string;
  /** More surprising answers that show up as the dial climbs. */
  wild: string[];
  prompt: string;
}

export const TEMP_DEMO: TempExample = {
  prompt: 'Give my robot a name.',
  safe: 'Robo',
  wild: ['Boltimus', 'Gizmo', 'Captain Sparks', 'Tinbeard', 'Zap', 'Widget', 'Clanky'],
};

/**
 * Pick an answer for a dial value 0..1 and a roll 0..1.
 * Low temperature almost always returns the safe answer; as it climbs, the wild
 * answers become more likely and more varied.
 */
export function answerAt(temp: number, roll: number, demo: TempExample = TEMP_DEMO): string {
  const t = Math.max(0, Math.min(1, temp));
  // Below the threshold we return the safe answer; the threshold rises with temp.
  if (roll > t) return demo.safe;
  const idx = Math.floor(roll * demo.wild.length * (0.5 + t)) % demo.wild.length;
  return demo.wild[idx]!;
}

/** How many distinct answers you would expect across n asks at this temp. */
export function varietyAt(temp: number, demo: TempExample = TEMP_DEMO, n = 6): number {
  const seen = new Set<string>();
  for (let i = 0; i < n; i += 1) {
    seen.add(answerAt(temp, (i + 0.5) / n, demo));
  }
  return seen.size;
}

export type TempBand = 'steady' | 'balanced' | 'wild';

export function bandFor(temp: number): TempBand {
  if (temp < 0.34) return 'steady';
  if (temp < 0.67) return 'balanced';
  return 'wild';
}
