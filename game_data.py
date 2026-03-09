# Re-export canonical game data from the backend package.
# This module exists for backwards compatibility with code that imports
# directly from the project root (e.g. `from game_data import CAR_CATALOG`).
from backend.game_data import (  # noqa: F401
    CAR_CATALOG,
    PARTS_CATALOG,
    TOURNAMENTS,
    PAINT_COLORS,
    BOSS_CARS,
    calculate_effective_stats,
)
