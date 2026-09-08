from __future__ import annotations

import pytest

from conftest import make_curriculum, make_lesson
from neuron_content.graph import GraphError, build_graph
from neuron_content.models import World


def test_linear_chain_has_increasing_depth():
    curriculum = make_curriculum([
        make_lesson("l1"),
        make_lesson("l2", prereqs=["l1"]),
        make_lesson("l3", prereqs=["l2"]),
    ])
    facts = build_graph(curriculum)
    assert facts.depth == {"l1": 0, "l2": 1, "l3": 2}
    assert facts.weight == {"l1": 1, "l2": 2, "l3": 3}
    assert facts.total_weight == 6


def test_depth_uses_longest_path_not_shortest():
    curriculum = make_curriculum([
        make_lesson("l1"),
        make_lesson("l2", prereqs=["l1"]),
        make_lesson("l3", prereqs=["l1", "l2"]),
    ])
    facts = build_graph(curriculum)
    assert facts.depth["l3"] == 2


def test_unlock_edges_point_forward():
    curriculum = make_curriculum([
        make_lesson("l1"),
        make_lesson("l2", prereqs=["l1"]),
        make_lesson("l3", prereqs=["l1"]),
    ])
    facts = build_graph(curriculum)
    assert sorted(facts.unlocks["l1"]) == ["l2", "l3"]
    assert facts.unlocks["l2"] == []


def test_cycle_is_rejected():
    # A reachable start exists, so this isolates cycle detection itself.
    curriculum = make_curriculum([
        make_lesson("l0"),
        make_lesson("l1", prereqs=["l0", "l3"]),
        make_lesson("l2", prereqs=["l1"]),
        make_lesson("l3", prereqs=["l2"]),
    ])
    with pytest.raises(GraphError, match="cycle"):
        build_graph(curriculum)


def test_missing_prerequisite_is_rejected():
    curriculum = make_curriculum([make_lesson("l1", prereqs=["ghost"])])
    with pytest.raises(GraphError, match="unknown lesson"):
        build_graph(curriculum)


def test_unknown_world_is_rejected():
    curriculum = make_curriculum([make_lesson("l1", world="nowhere")])
    with pytest.raises(GraphError, match="unknown world"):
        build_graph(curriculum)


def test_unknown_analogy_is_rejected():
    curriculum = make_curriculum([make_lesson("l1", analogy="ghost")])
    with pytest.raises(GraphError, match="unknown analogy"):
        build_graph(curriculum)


def test_cannot_depend_on_a_later_world():
    curriculum = make_curriculum([
        make_lesson("lesson-late", world="w2"),
        make_lesson("lesson-early", world="w1", prereqs=["lesson-late"]),
    ])
    with pytest.raises(GraphError, match="later world"):
        build_graph(curriculum)


def test_track_cannot_have_a_gap():
    curriculum = make_curriculum([
        make_lesson("l1", tracks=["builder"]),
        make_lesson("l2", prereqs=["l1"], tracks=["explorer", "builder"]),
    ])
    with pytest.raises(GraphError, match="is in track 'explorer'"):
        build_graph(curriculum)


def test_every_lesson_gated_is_rejected():
    curriculum = make_curriculum([
        make_lesson("l1", prereqs=["l2"]),
        make_lesson("l2", prereqs=["l1"]),
    ])
    with pytest.raises(GraphError, match="no lesson is available at the start"):
        build_graph(curriculum)


def test_empty_curriculum_is_rejected():
    curriculum = make_curriculum([])
    with pytest.raises(GraphError, match="no lessons"):
        build_graph(curriculum)


def test_duplicate_world_ids_rejected():
    duplicate = [
        World(id="w1", index=1, title="One", tagline="first world", ink="blue"),
        World(id="w1", index=2, title="Two", tagline="second world", ink="pink"),
    ]
    curriculum = make_curriculum([make_lesson("l1")], worlds=duplicate)
    with pytest.raises(GraphError, match="duplicate world ids"):
        build_graph(curriculum)


def test_topological_order_respects_prereqs():
    curriculum = make_curriculum([
        make_lesson("l3", prereqs=["l2"]),
        make_lesson("l1"),
        make_lesson("l2", prereqs=["l1"]),
    ])
    order = build_graph(curriculum).order
    assert order.index("l1") < order.index("l2") < order.index("l3")
