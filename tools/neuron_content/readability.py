"""Reading-level guard.

Explorer track is written for a Scottish P7 reader (about age 10-11), so
prose is held to roughly a US grade 6 reading level. Words we deliberately
teach - "algorithm", "prediction" - are counted as ordinary words, because
the point of the lesson is to make them ordinary.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

WORD_RE = re.compile(r"[A-Za-z][A-Za-z'\-]*")
SENTENCE_RE = re.compile(r"[.!?]+(?:\s|$)")
VOWEL_GROUP_RE = re.compile(r"[aeiouy]+")

# Grade ceilings per track.
TRACK_MAX_GRADE = {"explorer": 6.5, "builder": 9.0}


def count_syllables(word: str) -> int:
    """Heuristic English syllable count. Good enough for a build guard."""
    word = word.lower().strip("'-")
    if not word:
        return 0
    if len(word) <= 3:
        return 1

    # Drop a silent trailing "e", but keep it in the consonant + "le" ending
    # ("apple", "little"), where it carries its own syllable.
    if word.endswith("e") and not (
        len(word) > 2 and word[-2] == "l" and word[-3] not in "aeiouy"
    ):
        word = word[:-1]

    return max(1, len(VOWEL_GROUP_RE.findall(word)))


@dataclass(frozen=True)
class Readability:
    grade: float
    words: int
    sentences: int
    hardest: list[str]

    def ok_for(self, track: str) -> bool:
        return self.grade <= TRACK_MAX_GRADE.get(track, 6.5)


def score(text: str, glossary: set[str] | None = None) -> Readability:
    """Flesch-Kincaid grade level, with glossary terms normalised.

    Glossary terms are the technical vocabulary the curriculum teaches on
    purpose. They are scored as two syllables so a lesson about tokenisation
    is not punished for saying "tokeniser".
    """
    glossary = {g.lower() for g in (glossary or set())}
    words = WORD_RE.findall(text)
    if not words:
        return Readability(grade=0.0, words=0, sentences=0, hardest=[])

    sentences = max(1, len(SENTENCE_RE.findall(text.strip())))

    syllables = 0
    hard: list[tuple[int, str]] = []
    for word in words:
        n = 2 if word.lower() in glossary else count_syllables(word)
        syllables += n
        if n >= 4 and word.lower() not in glossary:
            hard.append((n, word))

    words_per_sentence = len(words) / sentences
    syllables_per_word = syllables / len(words)
    grade = 0.39 * words_per_sentence + 11.8 * syllables_per_word - 15.59

    hardest = [w for _, w in sorted(hard, reverse=True)[:5]]
    return Readability(
        grade=round(grade, 2),
        words=len(words),
        sentences=sentences,
        hardest=hardest,
    )
