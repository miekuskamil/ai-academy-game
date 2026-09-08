from __future__ import annotations

import sys
from pathlib import Path

import pytest

TOOLS = Path(__file__).resolve().parent.parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))

from neuron_content.models import (  # noqa: E402
    Analogy,
    Beat,
    Comic,
    Curriculum,
    Lesson,
    McqExercise,
    World,
)


@pytest.fixture(scope="session")
def project_root() -> Path:
    return ROOT


def make_comic(prefix: str = "c") -> Comic:
    return Comic(
        id=f"{prefix}-comic",
        title="A short scene",
        beats=[Beat(id=f"{prefix}-b1", speaker="iskra", text="I am not sure yet.")],
    )


def make_exercise(ex_id: str = "q1", points: int = 1) -> McqExercise:
    return McqExercise(
        id=ex_id,
        prompt="Which one is a guess?",
        choices=["A rule", "A guess"],
        answer=[1],
        points=points,
        explain="A guess comes from what we saw before.",
    )


def make_lesson(
    lesson_id: str,
    world: str = "w1",
    prereqs: list[str] | None = None,
    tracks: list[str] | None = None,
    **kwargs,
) -> Lesson:
    payload = {
        "id": lesson_id,
        "world": world,
        "title": "A lesson",
        "goal": "Learn how a machine can spot a pattern in data.",
        "prereqs": prereqs or [],
        "tracks": tracks or ["explorer", "builder"],
        "open_comic": make_comic(lesson_id),
        "exercises": [make_exercise(f"{lesson_id}-q1")],
    }
    payload.update(kwargs)
    return Lesson(**payload)


def make_curriculum(lessons: list[Lesson], worlds: list[World] | None = None) -> Curriculum:
    return Curriculum(
        worlds=worlds
        or [
            World(id="w1", index=1, title="World One", tagline="Where it starts", ink="blue"),
            World(id="w2", index=2, title="World Two", tagline="Where it grows", ink="pink"),
        ],
        lessons=lessons,
        analogies=[
            Analogy(
                id="recipe",
                concept="rules versus learning",
                phrase="a recipe you follow",
                explain="A rule is a recipe. Learning is a taste you picked up.",
                banned_phrases=["like a brain", "just a robot"],
            )
        ],
        glossary=["algorithm", "data"],
    )
