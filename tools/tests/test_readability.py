from __future__ import annotations

import pytest

from neuron_content.readability import count_syllables, score


@pytest.mark.parametrize(
    "word,expected",
    [
        ("cat", 1),
        ("dog", 1),
        ("apple", 2),
        ("banana", 3),
        ("computer", 3),
        ("the", 1),
        ("little", 2),
    ],
)
def test_syllable_counts_are_sensible(word, expected):
    assert count_syllables(word) == expected


def test_empty_text_scores_zero():
    result = score("")
    assert result.grade == 0.0
    assert result.words == 0


def test_simple_sentence_is_easy():
    result = score("The cat sat on the mat. The dog ran to the park.")
    assert result.grade < 3
    assert result.sentences == 2


def test_dense_prose_scores_higher_than_simple_prose():
    simple = score("A model learns from data. It finds a pattern.")
    dense = score(
        "Consequently, the parameterisation demonstrates considerable "
        "computational sophistication throughout its intermediary representations."
    )
    assert dense.grade > simple.grade


def test_glossary_terms_do_not_inflate_the_grade():
    text = "An algorithm reads the data. Then the algorithm makes a prediction."
    without = score(text)
    with_glossary = score(text, {"algorithm", "prediction"})
    assert with_glossary.grade < without.grade


def test_hardest_words_are_reported():
    result = score("The categorisation was extraordinarily complicated.")
    assert result.hardest
    assert any(len(word) > 8 for word in result.hardest)


def test_track_ceilings():
    easy = score("The cat sat on the mat.")
    assert easy.ok_for("explorer")
    hard = score(
        "Notwithstanding the aforementioned methodological considerations, "
        "the investigatory apparatus remains fundamentally indeterminate."
    )
    assert not hard.ok_for("explorer")
    assert not hard.ok_for("builder")


def test_text_without_terminator_counts_one_sentence():
    assert score("no full stop here").sentences == 1
