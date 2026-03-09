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
# Each car entry includes:
# - id, name, category, price, color
# - hp, torque, weight
# - quarterMile (baseline ET in seconds)
# - trapSpeed (baseline trap speed in mph)
# ---------------------------
CAR_CATALOG: Dict[str, Dict[str, Any]] = {
    # --- Compact ---
    "civic_si": {
        "id": "civic_si",
        "name": "Honda Civic Si",
        "category": "compact",
        "hp": 160,
        "torque": 140,
        "weight": 2800,
        "quarterMile": 15.5,
        "trapSpeed": 91,
        "price": 5000,
        "color": "#cc0000",
    },
    "amc_pacer": {
        "id": "amc_pacer",
        "name": "AMC Pacer",
        "category": "compact",
        "hp": 90,
        "torque": 120,
        "weight": 3100,
        "quarterMile": 19.0,
        "trapSpeed": 72,
        "price": 8000,
        "color": "#77aa44",
    },
    # --- JDM ---
    "datsun_240z": {
        "id": "datsun_240z",
        "name": "Datsun 240Z",
        "category": "jdm",
        "hp": 150,
        "torque": 145,
        "weight": 2400,
        "quarterMile": 15.8,
        "trapSpeed": 88,
        "price": 18000,
        "color": "#ff4400",
    },
    "mazda_rx7": {
        "id": "mazda_rx7",
        "name": "Mazda RX-7",
        "category": "jdm",
        "hp": 280,
        "torque": 217,
        "weight": 2800,
        "quarterMile": 13.5,
        "trapSpeed": 105,
        "price": 25000,
        "color": "#ffffff",
    },
    "mitsubishi_evo_ix": {
        "id": "mitsubishi_evo_ix",
        "name": "Mitsubishi Lancer Evo IX",
        "category": "jdm",
        "hp": 286,
        "torque": 289,
        "weight": 3300,
        "quarterMile": 13.8,
        "trapSpeed": 103,
        "price": 35000,
        "color": "#0044cc",
    },
    # --- Muscle ---
    "camaro_zl1": {
        "id": "camaro_zl1",
        "name": "Chevrolet Camaro ZL1",
        "category": "muscle",
        "hp": 650,
        "torque": 650,
        "weight": 3900,
        "quarterMile": 11.2,
        "trapSpeed": 127,
        "price": 65000,
        "color": "#ffcc00",
    },
    "pontiac_trans_am_kitt": {
        "id": "pontiac_trans_am_kitt",
        "name": "Pontiac Trans Am KITT",
        "category": "muscle",
        "hp": 300,
        "torque": 340,
        "weight": 3500,
        "quarterMile": 14.2,
        "trapSpeed": 100,
        "price": 28000,
        "color": "#111111",
    },
    "dodge_charger_rt": {
        "id": "dodge_charger_rt",
        "name": "Dodge Charger R/T",
        "category": "muscle",
        "hp": 375,
        "torque": 410,
        "weight": 4100,
        "quarterMile": 13.6,
        "trapSpeed": 104,
        "price": 45000,
        "color": "#880000",
    },
    # --- Truck ---
    "ford_f150_raptor": {
        "id": "ford_f150_raptor",
        "name": "Ford F-150 Raptor",
        "category": "truck",
        "hp": 450,
        "torque": 510,
        "weight": 5500,
        "quarterMile": 13.4,
        "trapSpeed": 106,
        "price": 55000,
        "color": "#334455",
    },
    "chevy_s10_pickup": {
        "id": "chevy_s10_pickup",
        "name": "Chevy S-10 Mini Truck",
        "category": "truck",
        "hp": 160,
        "torque": 180,
        "weight": 2900,
        "quarterMile": 16.2,
        "trapSpeed": 85,
        "price": 12000,
        "color": "#225522",
    },
    # --- SUV ---
    "jeep_cherokee_srt": {
        "id": "jeep_cherokee_srt",
        "name": "Jeep Grand Cherokee SRT",
        "category": "suv",
        "hp": 475,
        "torque": 470,
        "weight": 5000,
        "quarterMile": 12.9,
        "trapSpeed": 112,
        "price": 68000,
        "color": "#222222",
    },
    "ford_bronco": {
        "id": "ford_bronco",
        "name": "Ford Bronco Wildtrack",
        "category": "suv",
        "hp": 300,
        "torque": 325,
        "weight": 4700,
        "quarterMile": 14.8,
        "trapSpeed": 96,
        "price": 42000,
        "color": "#996633",
    },
    # --- Euro ---
    "delorean_dmc_12": {
        "id": "delorean_dmc_12",
        "name": "DeLorean DMC-12",
        "category": "euro",
        "hp": 130,
        "torque": 153,
        "weight": 2800,
        "quarterMile": 17.2,
        "trapSpeed": 78,
        "price": 30000,
        "color": "#c0c0c0",
    },
    "vw_type_2_bus_turbo": {
        "id": "vw_type_2_bus_turbo",
        "name": "VW Type 2 Bus Turbo",
        "category": "euro",
        "hp": 150,
        "torque": 180,
        "weight": 3400,
        "quarterMile": 16.8,
        "trapSpeed": 82,
        "price": 14000,
        "color": "#ff66cc",
    },
    "bmw_m3_e30": {
        "id": "bmw_m3_e30",
        "name": "BMW M3 E30",
        "category": "euro",
        "hp": 238,
        "torque": 177,
        "weight": 2700,
        "quarterMile": 14.1,
        "trapSpeed": 101,
        "price": 32000,
        "color": "#003399",
    },
    # --- Exotic ---
    "lambo_countach": {
        "id": "lambo_countach",
        "name": "Lamborghini Countach",
        "category": "exotic",
        "hp": 455,
        "torque": 369,
        "weight": 3340,
        "quarterMile": 13.0,
        "trapSpeed": 111,
        "price": 250000,
        "color": "#ffdd00",
    },
    # --- Electric ---
    "tesla_model_s_plaid": {
        "id": "tesla_model_s_plaid",
        "name": "Tesla Model S Plaid",
        "category": "electric",
        "hp": 1020,
        "torque": 1050,
        "weight": 4766,
        "quarterMile": 9.4,
        "trapSpeed": 152,
        "price": 119990,
        "color": "#e8e8e8",
    },
}


# ---------------------------
# Boss-only cars (not for sale)
# ---------------------------
BOSS_CARS: Dict[str, Dict[str, Any]] = {
    "turbo_rob_special": {
        "name": "Street King Kenny's Contour",
        "hp": 450,
        "weight": 2900,
        "quarterMile": 11.5,
        "trapSpeed": 128,
    },
    "ghost_gtr": {
        "name": "Midnight Mike's R34",
        "hp": 850,
        "weight": 3200,
        "quarterMile": 9.8,
        "trapSpeed": 160,
    },
    "phoenix_dragster": {
        "name": "The Phoenix's dragster",
        "hp": 2000,
        "weight": 2200,
        "quarterMile": 7.8,
        "trapSpeed": 210,
    },
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
            "ebay": {"price": 200, "hp": 5},
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
        "difficulty": "easy",
        "prize_per_race": 500,
        "tournament_bonus": 10000,
    },
    {
        "id": "underground_circuit",
        "name": "Underground Circuit",
        "difficulty": "medium",
        "prize_per_race": 750,
        "tournament_bonus": 20000,
    },
    {
        "id": "elite_championship",
        "name": "Elite Championship",
        "difficulty": "hard",
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
