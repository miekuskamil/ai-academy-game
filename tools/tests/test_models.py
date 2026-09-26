from __future__ import annotations

import pytest
from pydantic import ValidationError

from conftest import make_comic, make_exercise, make_lesson
from neuron_content.models import (
    Beat,
    McqExercise,
    NumericExercise,
    PromptRubricExercise,
)


def test_lesson_rejects_unknown_keys():
    with pytest.raises(ValidationError):
        make_lesson("l1", colour="blue")


def test_lesson_id_must_be_a_slug():
    with pytest.raises(ValidationError):
        make_lesson("Not A Slug")


def test_lesson_cannot_require_itself():
    with pytest.raises(ValidationError, match="itself as a prerequisite"):
        make_lesson("l1", prereqs=["l1"])


def test_lesson_rejects_duplicate_prereqs():
    with pytest.raises(ValidationError, match="duplicate prerequisites"):
        make_lesson("l1", prereqs=["l0", "l0"])


def test_lesson_rejects_duplicate_exercise_ids():
    with pytest.raises(ValidationError, match="duplicate exercise ids"):
        make_lesson("l1", exercises=[make_exercise("same"), make_exercise("same")])


def test_sandbox_lesson_needs_a_brief():
    with pytest.raises(ValidationError, match="no play_brief"):
        make_lesson("l1", play="prompt-lab")


def test_sandbox_lesson_with_brief_is_valid():
    lesson = make_lesson("l1", play="prompt-lab", play_brief="Place dots and watch it guess.")
    assert lesson.play == "prompt-lab"


def test_mcq_answer_index_must_exist():
    with pytest.raises(ValidationError, match="out of range"):
        McqExercise(
            id="q1", prompt="Pick one", choices=["a", "b"], answer=[5], explain="because it is."
        )


def test_mcq_rejects_duplicate_answers():
    with pytest.raises(ValidationError, match="duplicate answer"):
        McqExercise(
            id="q1", prompt="Pick one now", choices=["a", "b"], answer=[1, 1], explain="because it is."
        )


def test_numeric_tolerance_cannot_be_negative():
    with pytest.raises(ValidationError):
        NumericExercise(id="q1", prompt="How many?", answer=3, tolerance=-1, explain="a reason.")


def test_prompt_rubric_labels_must_line_up():
    with pytest.raises(ValidationError, match="criteria_labels"):
        PromptRubricExercise(
            id="q1",
            prompt="Write a prompt",
            explain="a reason here.",
            must_include=[["who"], ["what"]],
            criteria_labels=["only one"],
        )


def test_comic_rejects_duplicate_beat_ids():
    from neuron_content.models import Comic

    with pytest.raises(ValidationError, match="duplicate beat ids"):
        Comic(
            id="c1",
            title="A title",
            beats=[
                Beat(id="b1", speaker="iskra", text="one"),
                Beat(id="b1", speaker="mila", text="two"),
            ],
        )


def test_total_points_sums_exercises():
    lesson = make_lesson(
        "l1",
        exercises=[make_exercise("qa", points=2), make_exercise("qb", points=3)],
    )
    assert lesson.total_points == 5


def test_comic_helper_builds_valid_comic():
    assert make_comic("x").beats[0].speaker == "iskra"
