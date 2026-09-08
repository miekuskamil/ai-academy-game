from __future__ import annotations

import json

import pytest

from conftest import make_curriculum, make_exercise, make_lesson
from neuron_content.compiler import (
    CompileError,
    compile_curriculum,
    level_table,
    level_threshold,
    lesson_prose,
    write_bundle,
)
from neuron_content.models import Beat, Comic, SandboxExercise


def test_level_one_starts_at_zero():
    assert level_threshold(1) == 0
    assert level_threshold(0) == 0


def test_level_thresholds_strictly_increase():
    table = level_table()
    assert table[0] == 0
    assert all(b > a for a, b in zip(table, table[1:]))


def test_level_curve_slows_down():
    table = level_table()
    early = table[3] - table[2]
    late = table[12] - table[11]
    assert late > early


def test_compile_produces_weights_and_unlocks():
    curriculum = make_curriculum([
        make_lesson("l1"),
        make_lesson("l2", prereqs=["l1"]),
    ])
    bundle, report = compile_curriculum(curriculum)
    by_id = {item["id"]: item for item in bundle["lessons"]}
    assert by_id["l1"]["weight"] == 1
    assert by_id["l2"]["weight"] == 2
    assert by_id["l1"]["unlocks"] == ["l2"]
    assert report.total_weight == 3


def test_compiled_lessons_are_in_topological_order():
    curriculum = make_curriculum([
        make_lesson("l3", prereqs=["l2"]),
        make_lesson("l1"),
        make_lesson("l2", prereqs=["l1"]),
    ])
    bundle, _ = compile_curriculum(curriculum)
    ids = [item["id"] for item in bundle["lessons"]]
    assert ids.index("l1") < ids.index("l2") < ids.index("l3")


def test_reading_level_guard_rejects_dense_prose():
    hard = make_lesson(
        "hard",
        goal=(
            "Comprehend the multidimensional representational transformations "
            "underpinning contemporary computational inference architectures."
        ),
    )
    with pytest.raises(CompileError, match="too hard"):
        compile_curriculum(make_curriculum([hard]))


def test_competing_analogy_is_rejected():
    lesson = make_lesson(
        "l1",
        open_comic=Comic(
            id="c1",
            title="Scene",
            beats=[Beat(id="b1", speaker="iskra", text="I work like a brain, sort of.")],
        ),
    )
    with pytest.raises(CompileError, match="competes with"):
        compile_curriculum(make_curriculum([lesson]))


def test_locked_analogy_may_use_its_own_phrase():
    lesson = make_lesson(
        "l1",
        analogy="recipe",
        open_comic=Comic(
            id="c1",
            title="Scene",
            beats=[Beat(id="b1", speaker="iskra", text="Some say I work like a brain.")],
        ),
    )
    bundle, _ = compile_curriculum(make_curriculum([lesson]))
    assert bundle["lessons"][0]["analogy"] == "recipe"


def test_sandbox_grading_without_a_sandbox_is_rejected():
    lesson = make_lesson(
        "l1",
        exercises=[
            SandboxExercise(
                id="s1",
                prompt="Get the score above eight in ten.",
                check="knn-accuracy",
                params={"min": 0.8},
                explain="More dots in the right place means better guesses.",
            )
        ],
    )
    with pytest.raises(CompileError, match="no sandbox"):
        compile_curriculum(make_curriculum([lesson]))


def test_ungraded_sandbox_warns_but_compiles():
    lesson = make_lesson("l1", play="knn", play_brief="Place some dots and look.")
    _, report = compile_curriculum(make_curriculum([lesson]))
    assert any("never grades it" in w for w in report.warnings)


def test_lesson_prose_includes_hints_and_explanations():
    lesson = make_lesson(
        "l1",
        exercises=[make_exercise("q1")],
    )
    prose = lesson_prose(lesson)
    assert "A guess comes from what we saw before" in prose
    assert "spot a pattern" in prose


def test_bundle_round_trips_through_json(tmp_path):
    curriculum = make_curriculum([make_lesson("l1")])
    bundle, _ = compile_curriculum(curriculum)
    target = write_bundle(bundle, tmp_path)
    reloaded = json.loads(target.read_text(encoding="utf-8"))
    assert reloaded["version"] == 1
    assert reloaded["lessons"][0]["id"] == "l1"
    assert reloaded["levels"][0] == 0


def test_max_level_reachable_is_reported():
    curriculum = make_curriculum([
        make_lesson("l1"),
        make_lesson("l2", prereqs=["l1"]),
        make_lesson("l3", prereqs=["l2"]),
    ])
    _, report = compile_curriculum(curriculum)
    assert report.max_level_reachable >= 1
