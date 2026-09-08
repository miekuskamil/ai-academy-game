# Neuron

A hands-on AI course for ages 10–15. Not a prompting tutorial — she trains a classifier, finds the bias in a dataset, breaks a neural network on purpose, and *then* learns to prompt properly.

Six worlds, 20 lessons, no account, no server, nothing leaves the device.

---

## Run it

```bash
npm install
pip install -r tools/requirements.txt

python3 tools/build_content.py   # compile + validate the curriculum
npm run dev                      # http://localhost:5173
```

## Ship it

```bash
npm run ci:build     # content pipeline, then vite build → dist/
npm run size         # bundle budget check
```

Netlify: connect the repo and it reads `netlify.toml` — build command `npm run ci:build`, publish `dist`. Nothing else to configure. The build is fully static and the CSP allows no third-party origins.

## Check it

```bash
npm test                      # domain, grading, the Vault, UI walkthrough
python3 -m pytest tools -q     # schemas, DAG, reading level, all-20 completeness
npm run lint
npx tsc --noEmit -p tsconfig.json
```

---

## Layout

```
content/            lesson YAML — the source of truth for all content
  worlds.yaml
  analogies.yaml    one locked metaphor per concept
  lessons/*.yaml
tools/              Python compiler: validate → check → emit
src/generated/      curriculum.json (compiled; never hand-edit)
src/domain/         all rules. No React imports — enforced by ESLint
src/ui/ src/routes/ presentation
scripts/            bundle size gate
```

`ARCHITECTURE.md` has the component diagram and the reasoning behind the design.

---

## Writing a lesson

Add a file to `content/lessons/`, then run `python3 tools/build_content.py`. The compiler refuses anything that would confuse a learner:

- a prerequisite that does not exist, or a cycle in the graph
- a lesson nothing can reach
- text above the reading level for its track
- a metaphor that competes with an existing analogy for the same concept
- an exercise kind with no registered grader

```yaml
id: w1-rules-and-guesses
world: spotting-patterns
title: Rules and guesses
goal: Tell the difference between a machine that follows rules and one that learns.
tracks: [explorer, builder]
prereqs: []
minutes: 8

open_comic:                    # WATCH — Iskra gets it wrong first
  title: The four-legged problem
  beats:
    - { speaker: iskra, text: "I have a rule. If it has four legs, it is a table.",
        prop: none, mood: proud, highlight: rule }

play: none                     # TRY — sandbox id, or none
teach:                         # LEARN — titled steps that explain the idea
  - heading: A rule is written by a person
    body: It never changes on its own. Someone decided it in advance.
terms:                         # the real words grown-ups use
  - term: rule-based system
    plain: A program that only does exactly what a person spelled out.
    seen_in: Spam filters that block words on a list.
recap:                         # RECAP — the takeaways, in her words
  - A rule is written by a person. It never changes on its own.
  - Learning means finding the pattern yourself, from lots of examples.

exercises:                     # TEST
  - id: q1
    kind: mcq
    prompt: Iskra used a rule. What went wrong with it?
    choices: [...]
    answer: [1]
    points: 1
    explain: Lots of things have four legs. The rule was too wide.
```

Order matters and is enforced by the player: **watch → try → learn → recap → test → done**. She should have felt the idea before anyone names it.

---

## Grading

Every exercise is scored by a deterministic function in the browser. No model call, no network, no variance — she can change one word and watch exactly one criterion turn green.

| Kind | Scoring |
|---|---|
| `mcq` | Overlap with the answer set; partial credit |
| `order` | Correctly ordered *pairs*, so one slip does not wipe the sequence |
| `match` | Per correct pair |
| `numeric` | Within tolerance; half credit inside 3× with a nudge which way |
| `prompt_rubric` | Named criteria (role, audience, constraint, format), any synonym counts |
| `sandbox` | A registered check reads what she actually built |

A live model is optional and off by default. Turning it on adds a "try your prompt for real" step; it never affects a score.

---

## Progress

Stored in `localStorage`, exported as JSON from the grown-ups' page. Level, unlocks and companion stage are all **recomputed** from lesson records rather than stored, so nothing can drift out of sync.

- **Completed** (≥60%) unlocks what follows and raises the level.
- **Mastered** (≥90%, no hints) earns a star and gates nothing.

Retries never lower a score. The level never drops. There are no leaderboards and no streak punishment.

Each lesson also builds one part of **the Machine** — the course seen sideways as a real AI pipeline. Finishing a lesson earns a piece; she places each piece herself in **the Vault** (tap-to-place), and when all twenty are earned and placed it opens to reveal the AI she built. Like everything else, it is derived from lesson records: a tampered save cannot open it.

---

## Android

The app is a PWA wrapped with Capacitor — one codebase, no rewrite. The two platform seams are already interfaces (`IProgressStore`, `IAIProvider`), so the port swaps implementations in `container.ts` and touches nothing else. Layout is designed at 360×640 first, all targets are ≥44px, and no interaction depends on hover or precision dragging.
