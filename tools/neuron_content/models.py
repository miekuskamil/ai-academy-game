"""Authoring schemas for Neuron content.

Every piece of authored content is validated here before it reaches the
frontend. If a lesson is malformed the build fails, so a broken lesson can
never reach the learner.
"""

from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, model_validator

Slug = Annotated[str, Field(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$", min_length=2, max_length=64)]

TrackId = Literal["explorer", "builder"]


class Strict(BaseModel):
    """Reject unknown keys everywhere so typos in YAML fail loudly."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


# --------------------------------------------------------------------------
# Analogies
# --------------------------------------------------------------------------


class Analogy(Strict):
    """One locked metaphor per concept, reused for the whole curriculum."""

    id: Slug
    concept: str = Field(min_length=3, max_length=80)
    phrase: str = Field(min_length=5, max_length=160)
    explain: str = Field(min_length=10, max_length=400)
    banned_phrases: list[str] = Field(default_factory=list)


class Glossary(Strict):
    """Technical words that are allowed to be hard, because we teach them."""

    terms: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------
# Comic scenes
# --------------------------------------------------------------------------

ActorId = Literal["mila", "iskra", "narrator"]

PropKind = Literal[
    "dots",
    "grid",
    "curve",
    "bricks",
    "dials",
    "album",
    "room",
    "map",
    "fog",
    "none",
]


class Beat(Strict):
    """A single comic panel, described as data rather than a drawing.

    The renderer turns this into SVG, so panels stay small, themeable and
    translatable, and no binary art assets ship with the bundle.
    """

    id: Slug
    speaker: ActorId
    text: str = Field(min_length=3, max_length=220)
    prop: PropKind = "none"
    mood: Literal["calm", "curious", "excited", "confused", "proud"] = "calm"
    # Optional emphasis word rendered as a riso-ink highlight.
    highlight: str | None = Field(default=None, max_length=40)


class Comic(Strict):
    id: Slug
    title: str = Field(min_length=3, max_length=80)
    beats: list[Beat] = Field(min_length=1, max_length=8)

    @model_validator(mode="after")
    def _unique_beats(self) -> "Comic":
        ids = [b.id for b in self.beats]
        if len(set(ids)) != len(ids):
            raise ValueError(f"comic '{self.id}' has duplicate beat ids")
        return self


# --------------------------------------------------------------------------
# Exercises
# --------------------------------------------------------------------------


class ExerciseBase(Strict):
    id: Slug
    prompt: str = Field(min_length=5, max_length=400)
    points: int = Field(default=1, ge=1, le=5)
    hint: str | None = Field(default=None, max_length=280)
    explain: str = Field(min_length=5, max_length=400)


class McqExercise(ExerciseBase):
    kind: Literal["mcq"] = "mcq"
    choices: list[str] = Field(min_length=2, max_length=6)
    answer: list[int] = Field(min_length=1)

    @model_validator(mode="after")
    def _answers_in_range(self) -> "McqExercise":
        for i in self.answer:
            if not 0 <= i < len(self.choices):
                raise ValueError(f"{self.id}: answer index {i} out of range")
        if len(set(self.answer)) != len(self.answer):
            raise ValueError(f"{self.id}: duplicate answer indices")
        return self


class OrderExercise(ExerciseBase):
    kind: Literal["order"] = "order"
    items: list[str] = Field(min_length=2, max_length=8)


class MatchExercise(ExerciseBase):
    kind: Literal["match"] = "match"
    pairs: list[tuple[str, str]] = Field(min_length=2, max_length=6)


class NumericExercise(ExerciseBase):
    kind: Literal["numeric"] = "numeric"
    answer: float
    tolerance: float = Field(default=0.0, ge=0)
    unit: str | None = Field(default=None, max_length=16)


class PromptRubricExercise(ExerciseBase):
    """Deterministic prompt grading: no model required, fully reproducible."""

    kind: Literal["prompt_rubric"] = "prompt_rubric"
    min_words: int = Field(default=8, ge=1, le=200)
    must_include: list[list[str]] = Field(default_factory=list)
    must_avoid: list[str] = Field(default_factory=list)
    criteria_labels: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _labels_match(self) -> "PromptRubricExercise":
        if self.criteria_labels and len(self.criteria_labels) != len(self.must_include):
            raise ValueError(f"{self.id}: criteria_labels must match must_include length")
        return self


class SandboxExercise(ExerciseBase):
    """Graded from the state a sandbox emits, e.g. 'reach accuracy >= 0.8'."""

    kind: Literal["sandbox"] = "sandbox"
    check: Slug
    params: dict[str, float | int | str | bool] = Field(default_factory=dict)


Exercise = Annotated[
    Union[
        McqExercise,
        OrderExercise,
        MatchExercise,
        NumericExercise,
        PromptRubricExercise,
        SandboxExercise,
    ],
    Field(discriminator="kind"),
]


# --------------------------------------------------------------------------
# Lessons and worlds
# --------------------------------------------------------------------------

SandboxId = Literal[
    "none",
    "prompt-lab",
    "hallucination-spotter",
    "task-sorter",
    "temperature-dial",
    "verifier",
    "pipeline-builder",
    "agent-planner",
]


class World(Strict):
    id: Slug
    index: int = Field(ge=1, le=12)
    title: str = Field(min_length=3, max_length=60)
    tagline: str = Field(min_length=5, max_length=140)
    ink: Literal["blue", "pink", "yellow", "green"]


class TeachStep(Strict):
    """One beat of actual explanation between playing and being tested."""

    heading: str = Field(min_length=3, max_length=80)
    body: str = Field(min_length=30, max_length=420)
    # Optional prop drawn beside the text, reusing the locked analogy artwork.
    prop: PropKind = "none"


class Term(Strict):
    """A real-world term tied to what the learner just did.

    The point is practical transfer: she should leave able to recognise the
    word a professional, a news article, or a chatbot's own docs would use for
    the thing she has been playing with — not just the toy version.
    """

    term: str = Field(min_length=2, max_length=40)
    # Plain-language meaning, aimed at a ten-year-old.
    plain: str = Field(min_length=20, max_length=280)
    # Optional: where she will actually meet this word out in the world.
    seen_in: str | None = Field(default=None, max_length=160)


class Lesson(Strict):
    id: Slug
    world: Slug
    title: str = Field(min_length=3, max_length=70)
    # Teacher-facing. Describes the skill, never shown as the opening words.
    goal: str = Field(min_length=10, max_length=200)
    # Learner-facing. Two or three warm sentences that say why this is worth
    # her time before anyone states an objective at her.
    intro: str | None = Field(default=None, min_length=40, max_length=600)
    tracks: list[TrackId] = Field(default=["explorer", "builder"], min_length=1)
    prereqs: list[Slug] = Field(default_factory=list)
    analogy: Slug | None = None
    minutes: int = Field(default=10, ge=3, le=45)

    open_comic: Comic
    play: SandboxId = "none"
    play_brief: str | None = Field(default=None, max_length=300)
    # The real teaching: two to four short titled steps that build the concept
    # after she has played with it and before she is tested. Terse bullet lists
    # were leaving learners unsure what they had just done.
    teach: list[TeachStep] = Field(default_factory=list, max_length=5)
    # Real-world vocabulary this lesson unlocks, shown as "the actual word for
    # this" callouts so the toy scenario connects to language she will meet
    # outside the app.
    terms: list[Term] = Field(default_factory=list, max_length=5)
    name_it: list[str] = Field(default_factory=list, max_length=6)
    exercises: list[Exercise] = Field(min_length=1, max_length=8)
    close_comic: Comic | None = None

    @model_validator(mode="after")
    def _sane(self) -> "Lesson":
        if self.id in self.prereqs:
            raise ValueError(f"lesson '{self.id}' lists itself as a prerequisite")
        if len(set(self.prereqs)) != len(self.prereqs):
            raise ValueError(f"lesson '{self.id}' has duplicate prerequisites")
        ex_ids = [e.id for e in self.exercises]
        if len(set(ex_ids)) != len(ex_ids):
            raise ValueError(f"lesson '{self.id}' has duplicate exercise ids")
        if self.play != "none" and not self.play_brief:
            raise ValueError(f"lesson '{self.id}' has a sandbox but no play_brief")
        return self

    @property
    def total_points(self) -> int:
        return sum(e.points for e in self.exercises)


class Curriculum(Strict):
    """The fully validated corpus, ready to compile."""

    worlds: list[World]
    lessons: list[Lesson]
    analogies: list[Analogy]
    glossary: list[str] = Field(default_factory=list)
