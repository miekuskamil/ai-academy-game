/**
 * Types mirroring the compiled curriculum bundle.
 *
 * The Python pipeline is the single source of truth for content shape; these
 * types describe what it emits. If the two drift, `npm run build` fails at the
 * type-check step before anything is deployed.
 */

export type TrackId = 'explorer' | 'builder';
/** World ids are curriculum-defined strings; this alias documents intent. */
export type WorldId = string;
export type InkName = 'blue' | 'pink' | 'yellow' | 'green';
export type ActorId = 'mila' | 'iskra' | 'narrator';
export type Mood = 'calm' | 'curious' | 'excited' | 'confused' | 'proud';

export type PropKind =
  | 'dots'
  | 'grid'
  | 'curve'
  | 'bricks'
  | 'dials'
  | 'album'
  | 'room'
  | 'map'
  | 'fog'
  | 'none';

export type SandboxId =
  | 'none'
  | 'knn'
  | 'bias-album'
  | 'tokenizer'
  | 'embedding-map'
  | 'ngram'
  | 'perceptron'
  | 'prompt-lab'
  | 'hallucination-spotter'
  | 'task-sorter'
  | 'temperature-dial'
  | 'verifier'
  | 'pipeline-builder'
  | 'agent-planner';

export interface Beat {
  id: string;
  speaker: ActorId;
  text: string;
  prop: PropKind;
  mood: Mood;
  highlight?: string;
}

export interface Comic {
  id: string;
  title: string;
  beats: Beat[];
}

interface ExerciseCommon {
  id: string;
  prompt: string;
  points: number;
  hint?: string;
  explain: string;
}

export interface McqExercise extends ExerciseCommon {
  kind: 'mcq';
  choices: string[];
  answer: number[];
}

export interface OrderExercise extends ExerciseCommon {
  kind: 'order';
  items: string[];
}

export interface MatchExercise extends ExerciseCommon {
  kind: 'match';
  pairs: [string, string][];
}

export interface NumericExercise extends ExerciseCommon {
  kind: 'numeric';
  answer: number;
  tolerance: number;
  unit?: string;
}

export interface PromptRubricExercise extends ExerciseCommon {
  kind: 'prompt_rubric';
  min_words: number;
  must_include: string[][];
  must_avoid: string[];
  criteria_labels: string[];
}

export interface SandboxExercise extends ExerciseCommon {
  kind: 'sandbox';
  check: string;
  params: Record<string, number | string | boolean>;
}

export type Exercise =
  | McqExercise
  | OrderExercise
  | MatchExercise
  | NumericExercise
  | PromptRubricExercise
  | SandboxExercise;

export type ExerciseKind = Exercise['kind'];

export interface World {
  id: string;
  index: number;
  title: string;
  tagline: string;
  ink: InkName;
}

export interface Analogy {
  id: string;
  concept: string;
  phrase: string;
  explain: string;
  banned_phrases: string[];
}

export interface TeachStep {
  heading: string;
  body: string;
  prop: PropKind;
}

export interface Term {
  /** The real-world word, e.g. "training data". */
  term: string;
  /** Kid-friendly meaning. */
  plain: string;
  /** Where she'll actually meet the word out in the world. */
  seen_in?: string;
}

export interface Lesson {
  id: string;
  world: string;
  title: string;
  /** Teacher-facing: the skill. Never the opening words a learner reads. */
  goal: string;
  /** Learner-facing: why this is worth her time, before any objective. */
  intro?: string;
  /** The actual explanation, built in short titled steps. */
  teach?: TeachStep[];
  /** Real-world vocabulary this lesson unlocks. */
  terms?: Term[];
  tracks: TrackId[];
  prereqs: string[];
  analogy?: string;
  minutes: number;
  open_comic: Comic;
  play: SandboxId;
  play_brief?: string;
  name_it: string[];
  exercises: Exercise[];
  close_comic?: Comic;
  /** Added by the compiler from the lesson graph. */
  weight: number;
  depth: number;
  unlocks: string[];
  totalPoints: number;
}

export interface CurriculumBundle {
  version: number;
  worlds: World[];
  analogies: Analogy[];
  glossary: string[];
  lessons: Lesson[];
  /** Points required to reach level 1, 2, 3 ... */
  levels: number[];
  totalWeight: number;
}

/** Whatever a sandbox reports about itself, read by sandbox checks. */
export type SandboxState = Record<string, unknown>;

/** Answer shapes submitted by the exercise UI, keyed by exercise kind. */
export type ExerciseResponse =
  | { kind: 'mcq'; selected: number[] }
  | { kind: 'order'; order: number[] }
  | { kind: 'match'; mapping: Record<number, number> }
  | { kind: 'numeric'; value: number | null }
  | { kind: 'prompt_rubric'; text: string }
  | { kind: 'sandbox'; state: SandboxState };
