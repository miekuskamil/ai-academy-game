# Neuron — architecture

A mastery-based AI course for ages 10–15. Static-first, no accounts, no server.

---

## 1. The three decisions everything else follows from

**Deterministic grading.** No exercise requires a language model to be scored. Every grader is a pure function running in the browser. A live model is an optional enrichment, never a dependency. This keeps the app free, offline-capable, instant, and — the reason that actually matters — fair: the same answer gets the same score every time, and a child can edit one line and watch precisely one criterion turn green.

**Progress is derived, not stored.** Level, unlock state, and companion stage are all recomputed from one append-only set of lesson records. Two sources of truth is how progression systems rot; a corrupt save cannot inflate a level that is recalculated on every read.

**No accounts, no PII.** Progress lives in `localStorage` with JSON export/import for backup. There is no server to hold data and nothing to leak.

---

## 2. Component diagram

```
┌─────────────────────── BUILD TIME · Python ──────────────────────────────┐
│                                                                          │
│  content/worlds.yaml · analogies.yaml · lessons/*.yaml                    │
│         │                                                                 │
│         ▼                                                                 │
│   loader.py ──► models.py ──► graph.py ──► readability.py ──► compiler.py │
│   (parse)       (Pydantic     (DAG: cycles,  (Flesch-Kincaid   (weights,  │
│                  schemas)      orphans,       per track)        depth,    │
│                                reachability)                    levels)   │
│         │                                                                 │
│         │  64 pytest cases. Bad content fails CI, never a learner.        │
│         ▼                                                                 │
│   src/generated/curriculum.json    ◄── typed by src/domain/types.ts       │
│                                        (drift fails `tsc`)               │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │  vite build → static dist/
                               ▼
┌─────────────────────── RUNTIME · React + TypeScript ─────────────────────┐
│                                                                          │
│  PRESENTATION                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ AppShell ── NavRail (bottom bar ≤768px │ side rail above)           │  │
│  │          └─ AxonLevel  ◄── the signature element                    │  │
│  │                                                                     │  │
│  │ MapRoute      LessonRoute            CompanionRoute   ParentRoute   │  │
│  │               ├─ ComicPlayer   (watch)                              │  │
│  │               ├─ Sandbox       (try)     ← P3                       │  │
│  │               └─ ExerciseView  (test)                               │  │
│  └────────────────────────────────┬───────────────────────────────────┘  │
│                                   │ resolves via React context only       │
│  DOMAIN                           ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    container.ts  (composition root)                 │  │
│  │                                                                     │  │
│  │   ProgressService ──── records attempts, persists, emits            │  │
│  │         │                                                            │  │
│  │         ├── UnlockPolicy  ─────► what is open      ─┐                │  │
│  │         ├── LevelPolicy   ─────► level, points     ─┼─ same records, │  │
│  │         └── NarrativeDirector ─► beats, Iskra stage ┘  three readings │  │
│  │                                                                     │  │
│  │   GradingService ──► GraderRegistry ──► IGrader plugins             │  │
│  │                       mcq · order · match · numeric ·               │  │
│  │                       promptRubric · sandbox(checks)                │  │
│  │                                                                     │  │
│  │   EventBus  ◄── all three policies subscribe to one attempt         │  │
│  └────────────────────────────────┬───────────────────────────────────┘  │
│                                   │                                       │
│  PORTS (interfaces — the only things the layer above names)              │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  IProgressStore          IAIProvider           IGrader             │  │
│  │   ├ LocalStorageStore     ├ NullProvider (default)                 │  │
│  │   ├ MemoryStore (tests)   ├ OllamaProvider (LAN)                   │  │
│  │   └ CapacitorStore ← P7   └ NetlifyProxy ← P4                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  KERNELS (pure TS, zero deps, run in a Web Worker)          ← P3         │
│   kNN · Perceptron/MLP · Tokenizer · EmbeddingMap · NGram                │
└──────────────────────────────────────────────────────────────────────────┘
```

### Why the ports exist

The Android port is the test of this design. It changes exactly two lines:

| Port | Web | Android (Capacitor) |
|---|---|---|
| `IProgressStore` | `LocalStorageStore` | `CapacitorPreferencesStore` |
| `IAIProvider` | `OllamaProvider` / `NullProvider` | `NullProvider` — a phone cannot reach a dev machine's localhost |

Nothing else moves. Same components, same domain, same tests.

---

## 3. SOLID, concretely

- **Single responsibility** — `ProgressService` records; `UnlockPolicy` decides what is open; `LevelPolicy` decides the score. Splitting these is what lets level and unlocks read the same records without either owning the other.
- **Open/closed** — `IGrader` is the main seam. A new exercise type registers into `GraderRegistry`; `LessonPlayer` never changes. `SandboxGrader` repeats the pattern one level down: each sandbox registers its own check.
- **Liskov** — `MemoryStore` and `LocalStorageStore` are interchangeable, which is why the whole test suite runs against the real services rather than mocks.
- **Interface segregation** — `IProgressStore` is three methods. `IAIProvider` is two. Nothing implements more than it needs.
- **Dependency inversion** — `container.ts` is the only file that names a concrete class. An ESLint rule (`no-restricted-imports`) fails the build if domain code imports React or UI.

---

## 4. Pedagogy encoded in the system

Each lesson runs in a fixed order, enforced by `LessonRoute`:

```
WATCH ──► TRY ──────► LEARN ──────► RECAP ──────► TEST ──────► DONE
comic     sandbox     teach steps   takeaways     exercises    callback
(concrete)(visual)    + real terms                             + reward
```

Terminology is deliberately last. A learner should have *felt* the idea — usually by watching Iskra get it wrong — before anyone gives it a name.

**Iskra is flawed on purpose.** She hallucinates, overfits, and inherits bias from bad data. Diagnosing her is the engine of the curriculum: each concept arrives as a bug the learner owns rather than a definition handed down.

**One analogy per concept, for the whole course.** Kids get wrecked by metaphor-switching, so the compiler enforces it: a lesson references an analogy by id, and `readability.py` fails the build if a lesson invents a competing metaphor for a concept that already has one.

**Two completion bars.**

| State | Bar | Effect |
|---|---|---|
| Completed | ≥60%, retries fine | unlocks what follows, raises level |
| Mastered | ≥90% *and* no hints | star and badge, never gates anything |

Completion drives progression so a struggling learner keeps moving; mastery carries the prestige. Retries never subtract, and level never drops.

**No leaderboards, no punishing streaks.** Single-user by design, and social comparison at twelve is corrosive. Badges attach to artifacts produced, never to grind.

---

## 4b. The reward system — the Machine and the Vault

Progress is not just gated, it is *built*. Twenty lessons map to twenty parts of
a machine, and the machine is the course seen sideways: a real AI pipeline
(brief → prompt → model → check → agent → result), one block per world.

- **`MachineService`** (domain, pure) derives two things from the same lesson
  records everything else reads: `evaluate()` for the passive build state, and
  `vault()` for the active one — which pieces are *earned* (lesson cleared)
  versus *placed* (she slotted it in herself).
- **The Vault** (`ui/Vault.tsx`) is the hands-on mystery. Earning a piece and
  placing it are separate steps: finishing a lesson drops a piece on the bench,
  and she taps it into its slot herself (tap-to-place, never drag — a phone
  dexterity trap). The vault stays shut until all 20 are earned *and* placed,
  then reveals it was a working AI all along.
- **Derivation still holds.** The vault can only open on genuinely earned pieces;
  a tampered `placed` array cannot open it without the lessons behind it. Hints
  key to placed count, so the mystery tracks her own assembly.
- **`RewardSplash`** fires once on a genuine first clear (snapshotting before/after
  so retries never re-trigger it), and drops a badge if a world just completed.

---

## 5. Mobile and portability constraints

These were fixed in the first build because they are expensive to retrofit:

- **360×640 is the design baseline.** Desktop is the enhancement.
- **No hover-dependent behaviour.** Hover states are decoration only.
- **No precision drag.** Ordering and matching use select-then-place. Dragging is a dexterity test, not a comprehension test.
- **44px minimum touch target**, enforced by the `.tap-target` utility rather than by discipline.
- **Keyboard-aware layout.** `useViewportKeyboard` tracks `visualViewport` and sets `--vh`/`--kb`. World 5 is text entry, and an Android keyboard eats ~45% of the screen.
- **`HashRouter`.** The same build works from a Netlify origin, a subpath, and `file://` in a WebView.
- **Everything bundled.** Fonts ship as woff2 in `dist/`; nothing is fetched from a CDN. The CSP header has no third-party origins at all.
- **Budget:** ≤200KB JS gzipped, enforced in CI by `scripts/size-gate.mjs`. Currently ~106KB.

---

## 6. Phases

| Phase | Scope | State |
|---|---|---|
| P0 | Shell, tokens, DI container, store, CI, Netlify | done |
| P1 | Python content pipeline, 20 lessons, 6 worlds | done |
| P2 | Lesson player, grading, unlock/level/narrative wiring | done |
| P3 | All 20 lessons authored (teach steps, real-world terms, question pools) | done |
| P4 | Reward system — machine/pipeline, the Vault (active assembly), badges, reward splash | done |
| P5 | Sandboxes — kNN done; bias album, tokenizer, embeddings, n-gram, perceptron | in progress |
| P6 | Prompt Lab, server-side live model provider | next |
| P7 | Agent planner, capstone | |
| P8 | A11y audit, Polish i18n, Playwright at 360px and desktop | |
| P9 | Capacitor packaging, Play Store assets | |

---

## 7. Test coverage

| Suite | Cases | Guards |
|---|---|---|
| `tools/tests` (pytest) | 64 | Schema validity, DAG integrity, reading level per track, analogy consistency, all-20-lessons completeness |
| `src/domain/**` (vitest) | — | Grading maths, unlock rules, level curve, save migration, machine/vault derivation, pipeline unlock, real-curriculum invariants |
| `src/ui/**` (vitest) | — | Full lesson walkthrough, the Vault tap-to-place assembly and reveal, reward splash, backup save/load, nav, motion gating |
| `src/lib`, `scripts` (vitest) | — | Hash-router restricted-document regressions, seeded shuffle, the inliner `$&` guard |

**193 total** (64 pytest + 129 vitest). Two invariants worth calling out because they protect the learner rather than the code:

- *"leaves no lesson permanently unreachable on either track"* — simulates a complete playthrough and asserts nothing is stranded behind an impossible prerequisite.
- *"refuses a corrupt backup without touching existing progress"* — caught a real bug during the build. `migrate()` was returning an empty profile on unreadable input, so importing a damaged file would have silently **erased a year of her progress**. It now returns `null` and the import is refused.
- *"still redirects when history.replaceState throws SecurityError"* — the app rendered a blank screen in any restricted document. See below.

### The routing incident

`react-router-dom` constructs `new URL(path, window.location.origin)` internally. On an **opaque origin** — a sandboxed iframe, a `file://` document, or a Capacitor WebView — `origin` is the literal string `"null"`, which is not a valid base URL. Router construction threw before React rendered anything: CSS loaded, JS died, blank screen.

This would have shipped broken to Android, where the WebView has exactly that origin.

react-router was replaced with a ~190-line hash router in `src/lib/router.tsx`. Two design rules came out of the incident and both are now enforced by tests:

1. **Never read `location.origin`.** Routing works purely from `location.hash`.
2. **In-memory state is authoritative; the URL is a best-effort mirror.** A sandboxed document also throws `SecurityError` on `history.replaceState`. Treating the URL as the source of truth means one blocked write breaks navigation outright; wrapping every URL operation means a blocked write is survivable — routing continues, only the address bar stops tracking.

The same reasoning was applied to the backup download in `ParentRoute`, which falls back to selectable text when blob downloads are blocked.
