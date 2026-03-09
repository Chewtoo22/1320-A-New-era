"""
Race simulation for 1320: A New Era.

- Slight randomness (reaction/traction/shift), bounded to stay fair.
- Accepts effective stats dicts (hp/weight, optional quarterMile/trapSpeed baseline).
- Returns ET + trap for player and opponent + winner.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Any, Optional, Tuple
import random
import math


@dataclass(frozen=True)
class RaceSimConfig:
    reaction_sigma: float = 0.08
    traction_sigma: float = 0.035
    shift_sigma: float = 0.03

    reaction_min: float = 0.05
    reaction_max: float = 0.35

    traction_min: float = 0.92
    traction_max: float = 1.08

    shift_min: float = 0.93
    shift_max: float = 1.07

    et_min: float = 7.0
    et_max: float = 25.0
    trap_min: float = 60.0
    trap_max: float = 220.0


def _get_stat(car: Dict[str, Any], *keys: str, default: Optional[float] = None) -> Optional[float]:
    for k in keys:
        if k in car and car[k] is not None:
            return car[k]
    return default


def _base_et_and_trap_from_hp_weight(hp: float, weight_lb: float) -> Tuple[float, float]:
    hp = max(hp, 1.0)
    weight_lb = max(weight_lb, 1.0)

    et = 5.825 * ((weight_lb / hp) ** (1.0 / 3.0)) + 1.2
    trap = 234.0 * ((hp / weight_lb) ** (1.0 / 3.0))
    return et, trap


def _apply_random_factors(
    et: float, trap: float, rng: random.Random, cfg: RaceSimConfig
) -> Tuple[float, float, Dict[str, float]]:
    reaction = rng.gauss(0.18, cfg.reaction_sigma)
    reaction = min(max(reaction, cfg.reaction_min), cfg.reaction_max)

    traction = rng.gauss(1.0, cfg.traction_sigma)
    traction = min(max(traction, cfg.traction_min), cfg.traction_max)

    shift = rng.gauss(1.0, cfg.shift_sigma)
    shift = min(max(shift, cfg.shift_min), cfg.shift_max)

    et2 = (et * traction * shift) + reaction
    trap2 = trap / (math.sqrt(traction) * math.sqrt(shift))

    return et2, trap2, {"reaction": reaction, "traction": traction, "shift": shift}


def simulate_quarter_mile(
    player_stats: Dict[str, Any],
    opponent_stats: Dict[str, Any],
    *,
    seed: Optional[int] = None,
    cfg: Optional[RaceSimConfig] = None,
) -> Dict[str, Any]:
    cfg = cfg or RaceSimConfig()
    rng = random.Random(seed)

    def compute(car: Dict[str, Any]) -> Dict[str, Any]:
        hp = float(_get_stat(car, "hp", "horsepower", default=200.0))
        weight = float(_get_stat(car, "weight", "weight_lb", default=3200.0))

        et_hint = _get_stat(car, "quarter_mile", "quarterMile", default=None)
        trap_hint = _get_stat(car, "trap_speed", "trapSpeed", default=None)

        if et_hint is not None and trap_hint is not None:
            base_et = float(et_hint)
            base_trap = float(trap_hint)
        else:
            base_et, base_trap = _base_et_and_trap_from_hp_weight(hp, weight)

        et2, trap2, meta = _apply_random_factors(base_et, base_trap, rng, cfg)

        et2 = min(max(et2, cfg.et_min), cfg.et_max)
        trap2 = min(max(trap2, cfg.trap_min), cfg.trap_max)

        return {
            "hp": hp,
            "weight": weight,
            "base_et": round(base_et, 3),
            "base_trap": round(base_trap, 2),
            "et": round(et2, 3),
            "trap": round(trap2, 2),
            "random_factors": meta,
        }

    p = compute(player_stats)
    o = compute(opponent_stats)

    winner = "player" if p["et"] < o["et"] else "opponent"
    margin = round(abs(p["et"] - o["et"]), 3)

    return {"player": p, "opponent": o, "winner": winner, "margin_seconds": margin, "seed": seed}
