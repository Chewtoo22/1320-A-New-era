"""
Canonical game data module used by backend/server.py.

This file MUST export:
- CAR_CATALOG
- PARTS_CATALOG
- TOURNAMENTS
- PAINT_COLORS
- calculate_effective_stats(...)
"""

from __future__ import annotations

from typing import Dict, Any


# ---------------------------
# Paint Colors
# ---------------------------
PAINT_COLORS = [
    {"name": "Red", "hex": "#ff0000"},
    {"name": "Blue", "hex": "#0066ff"},
    {"name": "Black", "hex": "#111111"},
    {"name": "White", "hex": "#ffffff"},
    {"name": "Silver", "hex": "#c0c0c0"},
]


# ---------------------------
# Cars (Catalog)
# Note: server.py expects each car to have:
# - name
# - price
# - color
# Race sim benefits from:
# - hp
# - weight
# - torque (optional but helpful)
# plus optional baseline:
# - quarterMile
# - trapSpeed
# ---------------------------
CAR_CATALOG: Dict[str, Dict[str, Any]] = {
    "camaro_zl1": {
        "id": "camaro_zl1",
        "name": "Chevrolet Camaro ZL1",
        "hp": 650,
        "torque": 650,
        "weight": 3900,
        "quarterMile": 11.2,
        "trapSpeed": 127,
        "price": 65000,
        "color": "#ffcc00",
    },
    "delorean_dmc_12": {
        "id": "delorean_dmc_12",
        "name": "DeLorean DMC-12",
        "hp": 130,
        "torque": 153,
        "weight": 2800,
        "quarterMile": 17.2,
        "trapSpeed": 78,
        "price": 30000,
        "color": "#c0c0c0",
    },
    "amc_pacer": {
        "id": "amc_pacer",
        "name": "AMC Pacer",
        "hp": 90,
        "torque": 120,
        "weight": 3100,
        "quarterMile": 19.0,
        "trapSpeed": 72,
        "price": 8000,
        "color": "#77aa44",
    },
    "pontiac_trans_am_kitt": {
        "id": "pontiac_trans_am_kitt",
        "name": "Pontiac Trans Am KITT",
        "hp": 300,
        "torque": 340,
        "weight": 3500,
        "quarterMile": 14.2,
        "trapSpeed": 100,
        "price": 28000,
        "color": "#111111",
    },
    "vw_type_2_bus_turbo": {
        "id": "vw_type_2_bus_turbo",
        "name": "VW Type 2 Bus Turbo",
        "hp": 150,
        "torque": 180,
        "weight": 3400,
        "quarterMile": 16.8,
        "trapSpeed": 82,
        "price": 14000,
        "color": "#ff66cc",
    },
    "datsun_240z": {
        "id": "datsun_240z",
        "name": "Datsun 240Z",
        "hp": 150,
        "torque": 145,
        "weight": 2400,
        "quarterMile": 15.8,
        "trapSpeed": 88,
        "price": 18000,
        "color": "#ff4400",
    },
}


# ---------------------------
# Boss-only cars (not for sale)
# ---------------------------
BOSS_CARS: Dict[str, Dict[str, Any]] = {
    "turbo_rob_special": {"name": "Street King Kenny's Contour", "hp": 450, "et": "11.5s"},
    "ghost_gtr": {"name": "Midnight Mike's R34", "hp": 850, "et": "9.8s"},
    "phoenix_dragster": {"name": "The Phoenix's dragster", "hp": 2000, "et": "7.8s"},
}


# ---------------------------
# Parts / upgrades
# Each upgrade tier provides an hp/weight delta.
# server.py expects PARTS_CATALOG[part_key]["tiers"][tier]["price"]
# ---------------------------
PARTS_CATALOG: Dict[str, Dict[str, Any]] = {
    "intake": {
        "name": "Air Intake",
        "tiers": {
            "ebay": {"price": 250, "hp": 5},
            "rockauto": {"price": 750, "hp": 10},
            "performance": {"price": 1800, "hp": 18},
        },
    },
    "exhaust": {
        "name": "Exhaust",
        "tiers": {
            "ebay": {"price": 350, "hp": 5},
            "rockauto": {"price": 1100, "hp": 12},
            "performance": {"price": 2800, "hp": 22},
        },
    },
    "turbo": {
        "name": "Forced Induction",
        "tiers": {
            "ebay": {"price": 1200, "hp": 25},
            "rockauto": {"price": 3500, "hp": 45},
            "performance": {"price": 8000, "hp": 80},
        },
    },
    "ecu": {
        "name": "ECU Tune",
        "tiers": {
            "ebay": {"price": 150, "hp": 4},
            "rockauto": {"price": 900, "hp": 12},
            "performance": {"price": 2500, "hp": 25},
        },
    },
    "clutch": {
        "name": "Clutch",
        "tiers": {
            "ebay": {"price": 250, "hp": 0},
            "rockauto": {"price": 850, "hp": 0},
            "performance": {"price": 2000, "hp": 0},
        },
    },
    "transmission": {
        "name": "Transmission",
        "tiers": {
            "ebay": {"price": 650, "hp": 0},
            "rockauto": {"price": 1800, "hp": 0},
            "performance": {"price": 5000, "hp": 0},
        },
    },
    "suspension": {
        "name": "Suspension",
        "tiers": {
            "ebay": {"price": 300, "hp": 0},
            "rockauto": {"price": 1200, "hp": 0},
            "performance": {"price": 2200, "hp": 0},
        },
    },
    "tires": {
        "name": "Tires",
        "tiers": {
            "ebay": {"price": 300, "hp": 0},
            "rockauto": {"price": 800, "hp": 0},
            "performance": {"price": 1500, "hp": 0},
        },
    },
    "weight_reduction": {
        "name": "Weight Reduction",
        "tiers": {
            "ebay": {"price": 0, "weight": -50},
            "rockauto": {"price": 1200, "weight": -120},
            "performance": {"price": 3000, "weight": -220},
        },
    },
    "nitrous": {
        "name": "Nitrous",
        "tiers": {
            "ebay": {"price": 500, "hp": 20},
            "rockauto": {"price": 1500, "hp": 40},
            "performance": {"price": 3500, "hp": 70},
        },
    },
}


# ---------------------------
# Tournaments
# server.py expects TOURNAMENTS to be a list of dicts with:
# - id
# - name
# - prize_per_race
# - tournament_bonus
# plus whatever frontend uses
# ---------------------------
TOURNAMENTS = [
    {
        "id": "street_league",
        "name": "Street League",
        "prize_per_race": 500,
        "tournament_bonus": 10000,
    },
    {
        "id": "underground_circuit",
        "name": "Underground Circuit",
        "prize_per_race": 750,
        "tournament_bonus": 20000,
    },
    {
        "id": "elite_championship",
        "name": "Elite Championship",
        "prize_per_race": 1000,
        "tournament_bonus": 40000,
    },
]


def calculate_effective_stats(car_catalog_entry: Dict[str, Any], upgrades: Dict[str, Any]) -> Dict[str, Any]:
    """
    Applies upgrades to a base car entry and returns a new dict with effective stats.
    The server expects to call this and receive a dict that includes at least hp/weight.
    """
    base = dict(car_catalog_entry)

    hp = float(base.get("hp", 0))
    weight = float(base.get("weight", 3200))

    upgrades = upgrades or {}
    for part_key, tier in upgrades.items():
        if not tier:
            continue
        part = PARTS_CATALOG.get(part_key)
        if not part:
            continue
        tier_data = part.get("tiers", {}).get(tier)
        if not tier_data:
            continue

        hp += float(tier_data.get("hp", 0))
        weight += float(tier_data.get("weight", 0))

    base["hp"] = round(hp, 2)
    base["weight"] = round(weight, 2)
    return base
