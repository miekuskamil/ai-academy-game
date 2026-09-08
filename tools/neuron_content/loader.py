"""Read authored YAML from disk into validated models."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import ValidationError

from .models import Analogy, Curriculum, Lesson, World


class ContentError(ValueError):
    """Raised when authored content on disk cannot be loaded."""


def _read_yaml(path: Path) -> Any:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return yaml.safe_load(handle)
    except yaml.YAMLError as exc:  # pragma: no cover - message passthrough
        raise ContentError(f"{path.name}: invalid YAML - {exc}") from exc


def _require(path: Path) -> Path:
    if not path.exists():
        raise ContentError(f"missing required content file: {path}")
    return path


def load_curriculum(root: Path) -> Curriculum:
    """Load worlds, analogies and every lesson under ``root``."""
    root = Path(root)
    worlds_raw = _read_yaml(_require(root / "worlds.yaml")) or {}
    analogies_raw = _read_yaml(_require(root / "analogies.yaml")) or {}

    lesson_dir = root / "lessons"
    if not lesson_dir.is_dir():
        raise ContentError(f"missing lessons directory: {lesson_dir}")

    lesson_files = sorted(lesson_dir.glob("*.yaml"))
    if not lesson_files:
        raise ContentError(f"no lesson files found in {lesson_dir}")

    try:
        worlds = [World(**w) for w in worlds_raw.get("worlds", [])]
        analogies = [Analogy(**a) for a in analogies_raw.get("analogies", [])]
        glossary = list(analogies_raw.get("glossary", []))
    except ValidationError as exc:
        raise ContentError(f"invalid world/analogy definition:\n{exc}") from exc

    lessons: list[Lesson] = []
    for file in lesson_files:
        data = _read_yaml(file)
        if not isinstance(data, dict):
            raise ContentError(f"{file.name}: expected a mapping at the top level")
        try:
            lessons.append(Lesson(**data))
        except ValidationError as exc:
            raise ContentError(f"{file.name}: invalid lesson\n{exc}") from exc

    return Curriculum(
        worlds=sorted(worlds, key=lambda w: w.index),
        lessons=lessons,
        analogies=analogies,
        glossary=glossary,
    )
