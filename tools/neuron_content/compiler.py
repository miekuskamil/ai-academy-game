"""Compile validated content into the JSON the app ships with.

Guards run here, not at runtime. A lesson that would confuse or mislead a
learner fails the build instead of reaching her screen.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from .graph import GraphFacts, build_graph
from .models import Curriculum, Lesson
from .readability import Readability, score

LEVEL_BASE = 8.0
LEVEL_EXPONENT = 1.35
MAX_LEVEL = 24


class CompileError(ValueError):
    """Raised when content is structurally valid but pedagogically wrong."""


@dataclass
class Report:
    lessons: int = 0
    worlds: int = 0
    total_weight: int = 0
    max_level_reachable: int = 0
    readability: dict[str, Readability] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)


def level_threshold(level: int) -> int:
    """Points needed to reach ``level``. Level 1 is the starting level."""
    if level <= 1:
        return 0
    return round(LEVEL_BASE * (level - 1) ** LEVEL_EXPONENT)


def level_table(max_level: int = MAX_LEVEL) -> list[int]:
    return [level_threshold(level) for level in range(1, max_level + 1)]


def lesson_prose(lesson: Lesson) -> str:
    """Every string a learner actually reads, joined for scoring."""
    parts: list[str] = [lesson.goal, *(lesson.name_it or [])]
    if lesson.intro:
        parts.append(lesson.intro)
    for step in lesson.teach:
        parts.append(step.heading)
        parts.append(step.body)
    for term in lesson.terms:
        parts.append(term.plain)
        if term.seen_in:
            parts.append(term.seen_in)
    if lesson.play_brief:
        parts.append(lesson.play_brief)
    for comic in (lesson.open_comic, lesson.close_comic):
        if comic:
            parts.extend(beat.text for beat in comic.beats)
    for exercise in lesson.exercises:
        parts.append(exercise.prompt)
        parts.append(exercise.explain)
        if exercise.hint:
            parts.append(exercise.hint)
    return " ".join(part.rstrip(".") + "." for part in parts if part)


def _check_readability(curriculum: Curriculum, report: Report) -> None:
    glossary = set(curriculum.glossary)
    for lesson in curriculum.lessons:
        result = score(lesson_prose(lesson), glossary)
        report.readability[lesson.id] = result
        for track in lesson.tracks:
            if not result.ok_for(track):
                raise CompileError(
                    f"lesson '{lesson.id}' reads at grade {result.grade} which is too "
                    f"hard for track '{track}'. Long words: {', '.join(result.hardest)}"
                )


def _check_analogies(curriculum: Curriculum, report: Report) -> None:
    """One metaphor per concept. A competing metaphor fails the build."""
    banned: list[tuple[str, str]] = [
        (phrase.lower(), analogy.id)
        for analogy in curriculum.analogies
        for phrase in analogy.banned_phrases
    ]
    for lesson in curriculum.lessons:
        prose = lesson_prose(lesson).lower()
        for phrase, analogy_id in banned:
            if phrase in prose and lesson.analogy != analogy_id:
                raise CompileError(
                    f"lesson '{lesson.id}' uses the phrase '{phrase}', which competes "
                    f"with the locked analogy '{analogy_id}'"
                )


def _check_sandbox_coverage(curriculum: Curriculum, report: Report) -> None:
    for lesson in curriculum.lessons:
        sandbox_exercises = [e for e in lesson.exercises if e.kind == "sandbox"]
        if sandbox_exercises and lesson.play == "none":
            raise CompileError(
                f"lesson '{lesson.id}' grades sandbox work but has no sandbox"
            )
        # A prompt rubric is answered inside the prompt lab, so it counts as
        # grading that sandbox even though its kind is not "sandbox".
        if lesson.play == "prompt-lab":
            sandbox_exercises += [e for e in lesson.exercises if e.kind == "prompt_rubric"]

        if lesson.play != "none" and not sandbox_exercises:
            report.warnings.append(
                f"lesson '{lesson.id}' has a sandbox but never grades it"
            )



# Colour words the interactive sandboxes actually use. A lesson that teaches a
# sandbox but describes it in *different* colours forces the learner to hold two
# vocabularies at once, which is what made early drafts feel incoherent.
SANDBOX_COLOURS = {"knn": {"blue", "amber"}}


def _check_scenario_consistency(curriculum: Curriculum, report: Report) -> None:
    """Warn when a lesson's words drift from what its sandbox actually shows."""
    other_colours = {"pink", "red", "green", "yellow", "orange", "purple", "quiet", "loud"}
    for lesson in curriculum.lessons:
        allowed = SANDBOX_COLOURS.get(lesson.play)
        if not allowed:
            continue
        import re
        prose = lesson_prose(lesson).lower()
        # Whole words only: "hundred" must not trip the "red" rule.
        strays = sorted(
            c for c in other_colours
            if c not in allowed and re.search(rf"\b{c}\b", prose)
        )
        if strays:
            report.warnings.append(
                f"lesson '{lesson.id}' uses the {lesson.play} sandbox (which shows "
                f"{', '.join(sorted(allowed))}) but its text also says: {', '.join(strays)}. "
                f"One vocabulary per lesson keeps the scenario coherent."
            )


def _check_exercise_ids_unique(curriculum: Curriculum) -> None:
    seen: dict[str, str] = {}
    for lesson in curriculum.lessons:
        for exercise in lesson.exercises:
            key = f"{lesson.id}/{exercise.id}"
            if key in seen:
                raise CompileError(f"duplicate exercise key {key}")
            seen[key] = lesson.id


def _serialise(curriculum: Curriculum, facts: GraphFacts) -> dict:
    lessons = []
    for lesson in curriculum.lessons:
        payload = lesson.model_dump(mode="json", exclude_none=True)
        payload["weight"] = facts.weight[lesson.id]
        payload["depth"] = facts.depth[lesson.id]
        payload["unlocks"] = sorted(facts.unlocks[lesson.id])
        payload["totalPoints"] = lesson.total_points
        lessons.append(payload)

    order = {lid: i for i, lid in enumerate(facts.order)}
    lessons.sort(key=lambda item: order[item["id"]])

    return {
        "version": 1,
        "worlds": [w.model_dump(mode="json") for w in curriculum.worlds],
        "analogies": [a.model_dump(mode="json") for a in curriculum.analogies],
        "glossary": sorted(curriculum.glossary),
        "lessons": lessons,
        "levels": level_table(),
        "totalWeight": facts.total_weight,
    }


def compile_curriculum(curriculum: Curriculum) -> tuple[dict, Report]:
    report = Report(lessons=len(curriculum.lessons), worlds=len(curriculum.worlds))
    facts = build_graph(curriculum)

    _check_exercise_ids_unique(curriculum)
    _check_readability(curriculum, report)
    _check_analogies(curriculum, report)
    _check_sandbox_coverage(curriculum, report)
    _check_scenario_consistency(curriculum, report)

    report.total_weight = facts.total_weight
    table = level_table()
    report.max_level_reachable = sum(1 for t in table if t <= facts.total_weight)

    return _serialise(curriculum, facts), report


def write_bundle(bundle: dict, out_dir: Path) -> Path:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / "curriculum.json"
    target.write_text(
        json.dumps(bundle, ensure_ascii=False, indent=2, sort_keys=False) + "\n",
        encoding="utf-8",
    )
    return target
