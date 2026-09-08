# Neuron — atlas

A file-by-file map of the repository: where everything lives, what it does, and
where the seams are. For the *why* behind the design, see `ARCHITECTURE.md`; for
how to run it, see `README.md`. This file is the index you read first when you
open the repo cold.

The shape in one line: **Python bakes the curriculum at build time → a typed JSON
file → React renders it → the whole thing inlines into one offline HTML file.**

---

## Top level

| Path | What it is |
| --- | --- |
| `README.md` | How to install, run, build, and deploy. |
| `ARCHITECTURE.md` | The three founding decisions, the component diagram, the layering rules. |
| `atlas.md` | This file — the navigation map. |
| `package.json` | Scripts: `dev`, `build`, `build:single`, `smoke`, `test`. |
| `vite.config.ts` | Normal multi-file site build (→ `dist/`). |
| `vite.config.singlefile.ts` | Single-file build (→ `dist-single/`), everything inlined. |
| `tailwind.config.ts` | Design tokens wired to the CSS variables in `src/styles/tokens.css`. |
| `tsconfig.json` | Strict TypeScript. The domain layer is ESLint-fenced from React (see below). |

---

## `content/` — the source curriculum (authored, not generated)

Plain YAML a human writes. The Python pipeline validates and compiles it; nothing
here is loaded by the app directly.

| Path | What it is |
| --- | --- |
| `content/worlds.yaml` | The six worlds: id, title, one-line description, order. |
| `content/analogies.yaml` | The locked one-analogy-per-concept table (recipe, album, bricks, dials, fog, map). |
| `content/lessons/wN-NN-*.yaml` | One file per lesson, 20 in total. Each holds intro, comic beats, teach steps, real-world terms, recap, a pool of quiz questions, and a close comic. |

Lesson filename → world: `w1`–`w6`. Counts: W1 ×4, W2 ×3, W3 ×4, W4 ×3, W5 ×4, W6 ×2.

---

## `tools/` — the Python build pipeline (Pydantic + pytest)

Compiles `content/` into one typed JSON file. Runs at build time only; never ships.

| Path | What it does |
| --- | --- |
| `build_content.py` | Entry point. Runs the whole pipeline, writes `src/generated/curriculum.json`, prints readability + DAG reports. |
| `neuron_content/loader.py` | Reads the YAML files off disk. |
| `neuron_content/models.py` | Pydantic schemas — the single source of truth for the content shape. Bad content fails validation here. |
| `neuron_content/graph.py` | Builds the lesson DAG; checks for cycles, orphans, unreachable lessons. |
| `neuron_content/readability.py` | Flesch-Kincaid grade per track; fails if a lesson reads above the gate (~grade 5.65). |
| `neuron_content/compiler.py` | Assembles the validated, ordered, weighted bundle → JSON. |
| `tools/tests/test_*.py` | pytest suite (models, graph, readability, compiler, and a real-content pass over all 20 lessons). |
| `tools/requirements.txt` | Python deps (pydantic, pytest, pyyaml). |

**Output:** `src/generated/curriculum.json` — the one file that crosses the
Python→TypeScript boundary. Treated as read-only by the app.

---

## `src/domain/` — rules, no React

Pure logic. An ESLint rule forbids importing React here, so this layer stays
testable in isolation and can be lifted to another runtime (Capacitor, a CLI).
Everything progression-related is **derived from lesson records**, never stored.

### Composition root

| Path | What it does |
| --- | --- |
| `container.ts` | Builds every service and wires dependencies once. The one place construction happens. |
| `events.ts` | `EventBus` — decoupled signalling (e.g. `progress:changed`). |
| `types.ts` | Shared types: `Curriculum`, `Lesson`, `Exercise`, `WorldId`, etc. |
| `curriculum.ts` | Wraps the generated JSON: lesson lookup, `lessonsInWorld`, `worlds`, `opener`. |

### Progress (derived state + persistence seam)

| Path | What it does |
| --- | --- |
| `progress/state.ts` | `ProgressState`, `LessonRecord`, `BuildState` (theme, prompt, **placed** vault pieces), thresholds (`COMPLETE_AT` 0.6, `MASTER_AT` 0.9). |
| `progress/ProgressService.ts` | The write API: `record`, `setBuild`, `placePiece`, `export`, `import`, `reset`. Emits `progress:changed`. |
| `progress/IProgressStore.ts` | The persistence **seam** — interface only. |
| `progress/LocalStorageStore.ts` | Real store. Every read/write try/caught so it never crashes the app. |
| `progress/MemoryStore.ts` | In-memory store for tests and the no-storage fallback. |
| `progress/migrations.ts` | Version-forward migration of old saves. |

### Policy (the derivation rules)

| Path | What it does |
| --- | --- |
| `policy/UnlockPolicy.ts` | `isCleared` (best ≥ 0.6), which lessons are open given records. |
| `policy/LevelPolicy.ts` | Level + points from cleared/mastered counts. |

### Grading (deterministic, pluggable)

| Path | What it does |
| --- | --- |
| `grading/IGrader.ts` | The grader interface. |
| `grading/GraderRegistry.ts` | Maps exercise kind → grader. |
| `grading/GradingService.ts` | Runs the right grader, returns per-criterion feedback. |
| `grading/graders/*.ts` | One pure grader each: `Mcq`, `Match`, `Numeric`, `Order`, `PromptRubric`, `Sandbox`. |

### Machine + pipeline (the reward system)

| Path | What it does |
| --- | --- |
| `machine/MachineService.ts` | 20 parts, one per lesson. `evaluate()` (derived build state + one-shot `justBuilt`) and `vault()` (earned vs **placed** pieces, hints keyed to placed count, `open` only when all earned *and* placed). Pure. |
| `pipeline/blocks.ts` | The 6 pipeline blocks (brief→prompt→model→check→agent→result), their badges, and the 4 project themes. |
| `pipeline/PipelineService.ts` | Which blocks are unlocked, derived from which worlds are cleared. |
| `pipeline/PipelineRunner.ts` | Runs her prompt through prompt→model→check, live via `IAIProvider` or a recorded demo (one demo item fails the check on purpose). |

### AI (optional enrichment seam)

| Path | What it does |
| --- | --- |
| `ai/IAIProvider.ts` | The model **seam** — `capabilities()` + `complete()`. |
| `ai/NullProvider.ts` | Default. Reports unavailable; the app is fully functional without a model. |
| `ai/OllamaProvider.ts` | Talks to a local Ollama (e.g. `192.168.1.187:11434`). |

### Narrative

| Path | What it does |
| --- | --- |
| `narrative/NarrativeDirector.ts` | Picks companion (Iskra) lines/stage from progress. |

---

## `src/ui/`, `src/routes/`, `src/hooks/`, `src/lib/` — React

The only layer allowed to import React. Reads **derived** state through hooks;
never recomputes progression itself.

### Shell + navigation

| Path | What it does |
| --- | --- |
| `App.tsx` | Route table (`/map`, `/lesson/:id`, `/machine`, `/companion`, `/parent`). |
| `ui/AppShell.tsx` | Frame: header (level dial), nav rail, main, the save tab. Responsive via `useLayout`. |
| `ui/NavRail.tsx` | Shared nav — left sidebar on desktop, bottom bar on phone. Includes the **Machine** item whose icon fills like a battery with progress. |
| `ui/SaveTab.tsx` | The right-edge machine progress marker (⚙ count, charges up, taps to `/machine`). |
| `lib/router.tsx` | Custom hash router. Replaced react-router (which threw on opaque/`about:srcdoc` origins). In-memory state authoritative, URL mirrored best-effort. |

### Routes (pages)

| Path | What it does |
| --- | --- |
| `routes/MapRoute.tsx` | Home. The six worlds, lesson status, resume button. |
| `routes/LessonRoute.tsx` | The lesson flow: Watch → Try → Learn → Recap → Test → Done. Fires the reward splash on first clear. |
| `routes/MachineRoute.tsx` | The vault page + openable pipeline blocks. |
| `routes/CompanionRoute.tsx` | Iskra + the badge shelf. |
| `routes/ParentRoute.tsx` | PIN-gated grown-ups page: motion, live model, theme, backup, reset. |

### The reward UI

| Path | What it does |
| --- | --- |
| `ui/Vault.tsx` | The interactive vault. Tap a waiting piece, tap its slot, it clicks in. Opens at 20/20 earned+placed to reveal the AI. |
| `ui/RewardSplash.tsx` | The "a part clicked in!" celebration over the Done screen; badge drops in if a world completed. |
| `ui/build/BlockDetail.tsx` | Opens a pipeline block: real code, edit prompt, run live/demo. |
| `ui/build/blockCode.ts` | The real code shown per block. |
| `ui/build/ThemePicker.tsx` | Choose the project theme. |

### Lesson-facing UI

| Path | What it does |
| --- | --- |
| `ui/ExerciseView.tsx` | Renders a question, collects a response, shows graded feedback. |
| `ui/comic/*` | Data-driven drawn comics: `GenericScene` (from beats), `ink`/`props`/`cast`, `scenes/`. |
| `ui/sandboxes/*` | Interactive workbenches. `KnnSandbox` is real (`kernels/knn.ts`); the rest are honest stubs. |
| `ui/primitives/*` | `Button`, `Card`. |
| `ui/settings/BackupPanel.tsx` | Shared save/load (export file / import file), sandbox-download fallback. |
| `ui/AxonLevel.tsx` | The header level dial. |

### Hooks + utilities

| Path | What it does |
| --- | --- |
| `hooks/useContainer.tsx` | Provides the container; `useProgress()` auto-refreshes on `progress:changed`. |
| `hooks/useBreakpoint.ts` | `useLayout()` → `handset` \| `desk`. |
| `hooks/useViewportKeyboard.ts` | Keeps inputs visible when the mobile keyboard opens. |
| `lib/shuffle.ts` | Seeded (mulberry32) per-attempt question + option shuffling; grading maps back to original indices. |
| `lib/cn.ts` | Class-name join. |
| `lib/transitions.ts` | Motion tokens. |
| `kernels/knn.ts` | The real k-NN used by the KNN sandbox. |
| `styles/tokens.css`, `styles/index.css` | Design tokens + global styles, incl. the motion-gated `nrn-*` animations. |

---

## `scripts/` — build tooling

| Path | What it does |
| --- | --- |
| `inline.mjs`, `inline-core.mjs` | Fold JS/CSS into one HTML file. Use **function** replacers (string `$&` corrupts minified React — see the test). |
| `smoke.mjs` | Boots the real built file in jsdom every build; catches white-screen regressions. |
| `size-gate.mjs` | Fails the build if JS/CSS exceed budget (200 KB / 40 KB gzip). |

---

## Tests

Two suites, run separately.

- **pytest** (`tools/tests/`) — content pipeline. Validates all 20 lessons, the DAG, readability, the compiler.
- **vitest** (`*.test.ts(x)` beside the code) — domain logic and UI. Includes a real lesson walkthrough, the vault interaction, the reward splash, and the inliner `$&` guard.

```bash
python3 tools/build_content.py        # compile + validate content
python3 -m pytest tools -q            # content tests
npx vitest run                        # domain + UI tests
npx tsc --noEmit -p tsconfig.json     # types
npx eslint .                          # lint (incl. the no-React-in-domain fence)
npm run build && node scripts/size-gate.mjs
npm run build:single && npm run smoke # single-file build + boot check
```

---

## The seams (where to extend without touching the core)

- **`IProgressStore`** — swap `localStorage` for SQLite/Capacitor without touching services.
- **`IAIProvider`** — add a provider (e.g. a server-side Grok function) without touching the pipeline.
- **`IGrader` + `GraderRegistry`** — add an exercise kind by writing one pure grader and registering it.
- **`content/*.yaml` + Pydantic models** — add or edit lessons without touching the app; the pipeline validates them.

## Known stubs / not-yet-built

- Sandboxes other than k-NN are honest "workbench being built" placeholders (bias-album, tokenizer, embedding-map, ngram, perceptron, prompt-lab, agent-planner).
- No server-side model provider yet (Ollama or recorded-demo only); `IAIProvider` is ready for one.
- Question *pools* draw is deferred; per-attempt shuffling is done.
