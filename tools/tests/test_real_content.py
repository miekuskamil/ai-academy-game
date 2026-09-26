"""Guards on the curriculum that actually ships.

These run against content/ rather than fixtures, so a real authoring mistake
fails CI even if every unit test still passes.
"""

from __future__ import annotations

import pytest

from neuron_content.compiler import compile_curriculum
from neuron_content.graph import build_graph
from neuron_content.loader import load_curriculum
from neuron_content.readability import TRACK_MAX_GRADE


@pytest.fixture(scope="module")
def built(project_root):
    curriculum = load_curriculum(project_root / "content")
    bundle, report = compile_curriculum(curriculum)
    return curriculum, bundle, report


def test_real_content_compiles(built):
    _, bundle, report = built
    assert report.lessons >= 18
    assert bundle["version"] == 1


def test_no_warnings_in_shipped_content(built):
    _, _, report = built
    assert report.warnings == []


def test_every_world_has_at_least_two_lessons(built):
    curriculum, _, _ = built
    counts: dict[str, int] = {}
    for lesson in curriculum.lessons:
        counts[lesson.world] = counts.get(lesson.world, 0) + 1
    for world in curriculum.worlds:
        assert counts.get(world.id, 0) >= 2, f"world '{world.id}' is too thin"


def test_explorer_track_reads_at_or_below_p7_level(built):
    _, _, report = built
    worst = max(report.readability.values(), key=lambda r: r.grade)
    assert worst.grade <= TRACK_MAX_GRADE["explorer"]


def test_first_lesson_needs_nothing(built):
    curriculum, _, _ = built
    openers = [lesson for lesson in curriculum.lessons if not lesson.prereqs]
    assert len(openers) == 1, "exactly one entry point keeps the first session obvious"
    assert openers[0].id == "w1-ask-like-you-mean-it"


def test_every_lesson_is_reachable_from_the_opener(built):
    curriculum, _, _ = built
    facts = build_graph(curriculum)
    # The opener is the lesson with no prerequisites.
    openers = {item.id for item in curriculum.lessons if not item.prereqs}
    reached = set(openers)
    for lesson_id in facts.order:
        lesson = next(item for item in curriculum.lessons if item.id == lesson_id)
        if lesson.prereqs and all(p in reached for p in lesson.prereqs):
            reached.add(lesson_id)
    assert reached == set(facts.order)


def test_every_sandbox_check_is_known(built):
    """Any check id here must have a matching grader in the frontend."""
    curriculum, _, _ = built
    known = {
        "prompt-parts",
        "spotted-fakes",
        "sorted-tasks",
        "built-pipeline",
        "checked-agent",
        "checked-care",
        "felt-temperature",
    }
    used = {
        exercise.check
        for lesson in curriculum.lessons
        for exercise in lesson.exercises
        if exercise.kind == "sandbox"
    }
    assert used <= known, f"unknown sandbox checks: {sorted(used - known)}"


def test_curriculum_reaches_a_satisfying_level(built):
    _, _, report = built
    assert report.max_level_reachable >= 8


def test_every_exercise_explains_itself(built):
    curriculum, _, _ = built
    for lesson in curriculum.lessons:
        for exercise in lesson.exercises:
            assert len(exercise.explain) >= 20, f"{lesson.id}/{exercise.id} explains too little"


def test_hard_exercises_offer_a_hint(built):
    curriculum, _, _ = built
    for lesson in curriculum.lessons:
        for exercise in lesson.exercises:
            if exercise.points >= 3:
                assert exercise.hint, f"{lesson.id}/{exercise.id} is hard but has no hint"
