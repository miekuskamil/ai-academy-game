# Contributing

Thanks for looking. This is a small, personal project built for one kid to learn
AI, but it is structured cleanly and PRs are welcome.

## Setup

```bash
npm install
pip install -r tools/requirements.txt
```

## The one rule that matters

**Content lives in `content/*.yaml`, not in code.** The Python pipeline validates
it and compiles it to `src/generated/curriculum.json`. Never hand-edit the
generated JSON — it is overwritten on every build, and CI fails if it is stale.

To change a lesson: edit the YAML, then run `python3 tools/build_content.py` and
commit the regenerated JSON alongside your YAML change.

## Before you open a PR

Run the full check locally. All of it must be green — CI runs the same:

```bash
python3 tools/build_content.py        # compile + validate the curriculum
python3 -m pytest tools -q            # content tests
npx vitest run                        # domain + UI tests
npx tsc --noEmit -p tsconfig.json     # types
npx eslint .                          # lint
npm run build && node scripts/size-gate.mjs   # build + bundle budget
npm run build:single && npm run smoke # single-file build + boot check
```

## Two hard boundaries the linter enforces

1. **No React in `src/domain/`.** The domain layer is pure rules and must stay
   testable without a DOM. An ESLint rule fails the build if domain code imports
   React or UI.
2. **The bundle budget.** JS ≤200 KB gzip, CSS ≤40 KB gzip. `size-gate.mjs` fails
   the build past that. Everything ships bundled — no CDN fetches, no third-party
   origins in the CSP.

## Adding things

- **A lesson** → a YAML file in `content/lessons/`. The compiler rejects a
  missing prerequisite, a cycle, an unreachable lesson, text above the reading
  level, or a metaphor that competes with an existing analogy.
- **An exercise kind** → write one pure grader implementing `IGrader`, register
  it in `GraderRegistry`. The lesson player never changes.
- **A model provider** → implement `IAIProvider`. It is optional enrichment; no
  score ever depends on it.
- **A storage backend** → implement `IProgressStore`.

See `atlas.md` for the file-by-file map and `ARCHITECTURE.md` for the reasoning.

## Style

- TypeScript is strict. Keep it that way.
- Comments explain *why*, not *what*. Match the existing voice.
- Tests live beside the code they cover (`*.test.ts(x)`), except the Python
  suite under `tools/tests/`.
- Reading level: learner-facing text targets ~US grade 5. The pipeline checks it.
