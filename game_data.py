"""
Root-level re-export of game data for backward compatibility.

Code that imports directly from this module (e.g. ``from game_data import
CAR_CATALOG``) will receive the canonical data defined in
``backend/game_data.py``, which is the single source of truth for all
game catalogs and helper functions.
"""

from backend.game_data import (  # noqa: F401
    CAR_CATALOG,
    BOSS_CARS,
    PARTS_CATALOG,
    TOURNAMENTS,
    PAINT_COLORS,
    calculate_effective_stats,
)
