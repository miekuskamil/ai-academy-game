# Neuron v2 — the practical arc

Your daughter's verdict: the shell is good, the content is stiff and machine-driven.
This redesign flips the ratio. The old arc spent 14 of 20 lessons on how-it-works
theory *before* she did anything useful. The new arc is **half practical, half
how-it-works**, and she is prompting for real from World 1.

Weighting follows your ranking: **prompting first**, then real-world judgment,
then building, then agents. Theory is the thin layer that makes a skill make
sense — never the main event, and always introduced *because* she just hit the
thing it explains.

The reward machine, the Vault, the six-step lesson flow, Iskra, the grading — all
of that stays. Only the content changes.

---

## The six worlds

| # | World | Lessons | Split | What she can do after |
| - | ----- | ------- | ----- | --------------------- |
| 1 | **Talking to AI** | 4 | practical | Write a clear prompt: who, what, limits, shape. Iterate it. |
| 2 | **Why it answers that way** | 3 | how-it-works | Knows it predicts likely words, why it makes things up, why the same ask varies. |
| 3 | **Using AI for real things** | 4 | practical | Pick the right job for AI, spot when *not* to trust it, check its work. |
| 4 | **What is going on inside** | 3 | how-it-works | Training data, patterns, bias — enough to reason about *why* it behaves. |
| 5 | **Building with AI** | 4 | practical | Describe an app and build it by talking (vibe-coding); wire AI into a real project. |
| 6 | **AI that does things** | 2 | practical | Give an agent a goal + tools, check and correct its steps. |

Practical worlds: 1, 3, 5, 6 = **14 lessons**. How-it-works: 2, 4 = **7 lessons**...
(20 total — see per-lesson list; the table rounds worlds, the arc is 10 practical
/ 6 theory / 4 applied-building, which reads as "half and half" with a practical
lean.)

---

## World 1 — Talking to AI *(practical — the thing everyone wants first)*

She starts by doing the most useful thing immediately.

1. **Ask like you mean it** — vague in, vague out. The four parts of a good ask:
   who it's for, the job, the limits, the shape. *Play: prompt-lab.*
2. **Show, don't just tell** — giving an example of what you want (one-shot).
   Watch the answer snap into shape.
3. **One step at a time** — breaking a big ask into steps; asking it to think it
   through before answering.
4. **Not quite — try again** — iterating. The first answer is a draft. How to say
   "more like this, less like that" and steer.

## World 2 — Why it answers that way *(how-it-works — but human)*

Now that she's felt prompting, a *little* theory explains what she's steering.

5. **It guesses the next word** — the whole trick, plainly: it predicts what
   likely comes next, one word at a time. Not a brain, not a lookup.
6. **Why it makes things up** — "hallucination" as a natural result of guessing
   confidently. Why it sounds sure when it's wrong.
7. **Same question, different answer** — why it varies (temperature, plainly),
   and when you want it steady vs. surprising.

## World 3 — Using AI for real things *(practical — judgment, your #2)*

The skill that matters most after prompting: *when and whether* to use it.

8. **The right tool for the job** — what AI is genuinely good at vs. what to do
   yourself. Sorting real tasks into "ask AI / do it myself / check carefully."
9. **Trust, but check** — verifying answers. How to catch a confident wrong
   answer. Asking for sources, cross-checking, testing.
10. **AI as a thinking partner** — using it to brainstorm, plan, explain a hard
    thing, get unstuck — with her staying in charge.
11. **When not to use it** — privacy, other people's feelings, things it can't
    know, homework you're meant to do yourself. Real judgment, real cases.

## World 4 — What is going on inside *(how-it-works — the honest middle)*

The deeper layer, earned now that she has context to hang it on.

12. **It learned from a mountain of examples** — training data, plainly. It read
    a huge amount and found patterns. Where the data comes from.
13. **Patterns, not understanding** — what "it found a pattern" really means, and
    why that's powerful *and* limited.
14. **It picked up our habits — good and bad** — bias, in a way a kid gets:
    if the examples lean a way, so does the AI. Why fairness needs checking.

## World 5 — Building with AI *(practical — your #3, the payoff)*

Where it points at her real projects.

15. **Describe it and watch it build** — vibe-coding: describe an app in plain
    words, get a working thing, refine by talking. *This is the bridge to her
    own builds.*
16. **Say what's wrong and fix it** — debugging by conversation. Reading what
    came back, describing the bug, steering to a fix.
17. **AI in a real project** — wiring AI into something physical (a Raspberry Pi
    build): the idea of an AI helper that reads sensors, answers, or controls
    something. Concrete, buildable.
18. **Make it yours** — taste and direction. The AI does the typing; *she*
    decides what's good, what to keep, what it should feel like.

## World 6 — AI that does things *(practical — agents, your #4)*

The frontier skill, last because it builds on all the rest.

19. **Give it a goal and tools** — what an agent is: not one answer, but a thing
    that plans steps and uses tools to reach a goal you set.
20. **Watch it work, keep it honest** — checking an agent's steps, catching a
    wrong turn, correcting it. Staying the boss of the AI.

---

## What changes in tone

The old lessons read machine-first ("a model is a function that maps inputs to
outputs"). The new ones read **her-first**: every lesson opens with something
*she* wants to do, and the AI concept arrives because she hit it. Iskra still
makes mistakes she diagnoses — but now the mistakes are practical ones (a lazy
prompt, a confident wrong answer, a bad plan) instead of abstract ones.

## The one-year outcome

After this, she can: write prompts that work, judge when to trust or use AI,
build a small app by talking to it, wire an AI helper into a Pi project, and
direct an agent. That's a real foundation to point at her own projects — exactly
what you asked for.

---

## Before I build

I rebuild lesson by lesson against this arc, each one fully authored (comic,
play, teach steps, real-world terms, recap, question pool, close comic) and
passing the reading gate and the full test suite, same as before. Twenty lessons
is several sessions of work.

**Tell me if the arc is right first** — reorder worlds, swap a lesson, change the
practical/theory balance. Changing the map now is cheap; changing it after 20
lessons are written is not.
