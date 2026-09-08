"""Lesson graph integrity.

The curriculum is a directed acyclic graph. Depth in that graph decides how
much a lesson is worth, so the level a learner sees is derived from structure
rather than from a hand-tuned number an author could get wrong.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass

from .models import Curriculum, Lesson


class GraphError(ValueError):
    """Raised when the lesson graph cannot be used."""


@dataclass(frozen=True)
class GraphFacts:
    depth: dict[str, int]
    weight: dict[str, int]
    unlocks: dict[str, list[str]]
    order: list[str]

    @property
    def total_weight(self) -> int:
        return sum(self.weight.values())


def _check_references(curriculum: Curriculum) -> None:
    world_ids = {w.id for w in curriculum.worlds}
    lesson_ids = {lesson.id for lesson in curriculum.lessons}
    analogy_ids = {a.id for a in curriculum.analogies}

    if len(lesson_ids) != len(curriculum.lessons):
        raise GraphError("duplicate lesson ids in curriculum")
    if len(world_ids) != len(curriculum.worlds):
        raise GraphError("duplicate world ids in curriculum")

    for lesson in curriculum.lessons:
        if lesson.world not in world_ids:
            raise GraphError(f"lesson '{lesson.id}' points at unknown world '{lesson.world}'")
        if lesson.analogy and lesson.analogy not in analogy_ids:
            raise GraphError(f"lesson '{lesson.id}' uses unknown analogy '{lesson.analogy}'")
        for prereq in lesson.prereqs:
            if prereq not in lesson_ids:
                raise GraphError(f"lesson '{lesson.id}' needs unknown lesson '{prereq}'")


def _check_world_order(curriculum: Curriculum) -> None:
    """A lesson may never depend on something taught in a later world."""
    world_index = {w.id: w.index for w in curriculum.worlds}
    by_id = {lesson.id: lesson for lesson in curriculum.lessons}

    for lesson in curriculum.lessons:
        here = world_index[lesson.world]
        for prereq in lesson.prereqs:
            there = world_index[by_id[prereq].world]
            if there > here:
                raise GraphError(
                    f"lesson '{lesson.id}' (world {here}) depends on "
                    f"'{prereq}' from later world {there}"
                )


def _check_tracks(curriculum: Curriculum) -> None:
    """A track must be able to walk its own path without gaps."""
    by_id = {lesson.id: lesson for lesson in curriculum.lessons}
    for lesson in curriculum.lessons:
        for track in lesson.tracks:
            for prereq in lesson.prereqs:
                if track not in by_id[prereq].tracks:
                    raise GraphError(
                        f"lesson '{lesson.id}' is in track '{track}' but its "
                        f"prerequisite '{prereq}' is not"
                    )


def _check_reachable_start(lessons: list[Lesson]) -> None:
    if not any(not lesson.prereqs for lesson in lessons):
        raise GraphError("no lesson is available at the start; every lesson has a prerequisite")


def build_graph(curriculum: Curriculum) -> GraphFacts:
    """Validate the graph and return depth, weight, unlock edges and order."""
    if not curriculum.lessons:
        raise GraphError("curriculum has no lessons")

    _check_references(curriculum)
    _check_world_order(curriculum)
    _check_tracks(curriculum)
    _check_reachable_start(curriculum.lessons)

    lessons = {lesson.id: lesson for lesson in curriculum.lessons}
    indegree = {lid: len(lesson.prereqs) for lid, lesson in lessons.items()}
    unlocks: dict[str, list[str]] = {lid: [] for lid in lessons}
    for lesson in curriculum.lessons:
        for prereq in lesson.prereqs:
            unlocks[prereq].append(lesson.id)

    # Kahn's algorithm; a short queue left over means a cycle.
    queue = deque(sorted(lid for lid, deg in indegree.items() if deg == 0))
    order: list[str] = []
    depth: dict[str, int] = {lid: 0 for lid in lessons}

    while queue:
        current = queue.popleft()
        order.append(current)
        for nxt in sorted(unlocks[current]):
            depth[nxt] = max(depth[nxt], depth[current] + 1)
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    if len(order) != len(lessons):
        stuck = sorted(set(lessons) - set(order))
        raise GraphError(f"lesson graph has a cycle involving: {', '.join(stuck)}")

    weight = {lid: 1 + depth[lid] for lid in lessons}
    return GraphFacts(depth=depth, weight=weight, unlocks=unlocks, order=order)
