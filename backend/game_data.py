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
# Each upgrade tier includes display info and performance deltas.
# server.py expects PARTS_CATALOG[part_key]["tiers"][tier]["price"]
# ---------------------------
PARTS_CATALOG: Dict[str, Dict[str, Any]] = {
    "intake": {
        "name": "Air Intake",
        "tiers": {
            "ebay": {
                "name": "eBay Cold Air Intake",
                "price": 200,
                "hp_bonus": 5,
                "speed_increase": 1.0,
                "et_reduction": 0.05,
            },
            "rockauto": {
                "name": "RockAuto Intake Kit",
                "price": 750,
                "hp_bonus": 10,
                "speed_increase": 2.0,
                "et_reduction": 0.1,
            },
            "performance": {
                "name": "Performance Carbon Intake",
                "price": 1800,
                "hp_bonus": 18,
                "speed_increase": 3.0,
                "et_reduction": 0.18,
            },
        },
    },
    "exhaust": {
        "name": "Exhaust",
        "tiers": {
            "ebay": {
                "name": "Axle-back Exhaust",
                "price": 350,
                "hp_bonus": 6,
                "speed_increase": 1.0,
                "et_reduction": 0.05,
            },
            "rockauto": {
                "name": "Cat-back System",
                "price": 1100,
                "hp_bonus": 14,
                "speed_increase": 2.5,
                "et_reduction": 0.12,
            },
            "performance": {
                "name": "3\" Turbo-back Exhaust",
                "price": 2800,
                "hp_bonus": 26,
                "speed_increase": 4.0,
                "et_reduction": 0.2,
            },
        },
    },
    "turbo": {
        "name": "Forced Induction",
        "tiers": {
            "ebay": {
                "name": "Budget Turbo Kit",
                "price": 1200,
                "hp_bonus": 35,
                "speed_increase": 4.0,
                "et_reduction": 0.25,
            },
            "rockauto": {
                "name": "Street Turbo Kit",
                "price": 3500,
                "hp_bonus": 65,
                "speed_increase": 6.0,
                "et_reduction": 0.45,
            },
            "performance": {
                "name": "Race Turbo Kit",
                "price": 8000,
                "hp_bonus": 110,
                "speed_increase": 8.0,
                "et_reduction": 0.75,
            },
        },
    },
    "ecu": {
        "name": "ECU Tune",
        "tiers": {
            "ebay": {
                "name": "Stage 1 Tune",
                "price": 150,
                "hp_bonus": 6,
                "speed_increase": 0.5,
                "et_reduction": 0.04,
            },
            "rockauto": {
                "name": "Stage 2 Tune",
                "price": 900,
                "hp_bonus": 15,
                "speed_increase": 1.0,
                "et_reduction": 0.08,
            },
            "performance": {
                "name": "Pro Dyno Tune",
                "price": 2500,
                "hp_bonus": 28,
                "speed_increase": 2.0,
                "et_reduction": 0.14,
            },
        },
    },
    "clutch": {
        "name": "Clutch",
        "tiers": {
            "ebay": {
                "name": "Street Clutch",
                "price": 250,
                "grip_bonus": 0.01,
                "et_reduction": 0.02,
            },
            "rockauto": {
                "name": "Stage 2 Clutch",
                "price": 850,
                "grip_bonus": 0.02,
                "et_reduction": 0.04,
            },
            "performance": {
                "name": "Twin-Disc Drag Clutch",
                "price": 2000,
                "grip_bonus": 0.03,
                "et_reduction": 0.06,
            },
        },
    },
    "transmission": {
        "name": "Transmission",
        "tiers": {
            "ebay": {
                "name": "Short Shifter",
                "price": 650,
                "speed_increase": 0.5,
                "et_reduction": 0.03,
            },
            "rockauto": {
                "name": "Performance Gear Set",
                "price": 1800,
                "speed_increase": 1.5,
                "et_reduction": 0.06,
            },
            "performance": {
                "name": "Dogbox Transmission",
                "price": 5000,
                "speed_increase": 3.0,
                "et_reduction": 0.1,
            },
        },
    },
    "suspension": {
        "name": "Suspension",
        "tiers": {
            "ebay": {
                "name": "Lowering Springs",
                "price": 300,
                "grip_bonus": 0.01,
                "et_reduction": 0.02,
            },
            "rockauto": {
                "name": "Coilovers",
                "price": 1200,
                "grip_bonus": 0.025,
                "et_reduction": 0.04,
            },
            "performance": {
                "name": "Drag Coilovers",
                "price": 2200,
                "grip_bonus": 0.04,
                "et_reduction": 0.06,
            },
        },
    },
    "tires": {
        "name": "Tires",
        "tiers": {
            "ebay": {
                "name": "All-Season Street",
                "price": 300,
                "grip_bonus": 0.015,
                "et_reduction": 0.02,
            },
            "rockauto": {
                "name": "Ultra High Performance",
                "price": 800,
                "grip_bonus": 0.03,
                "et_reduction": 0.05,
            },
            "performance": {
                "name": "Drag Radials",
                "price": 1500,
                "grip_bonus": 0.05,
                "et_reduction": 0.08,
            },
        },
    },
    "weight_reduction": {
        "name": "Weight Reduction",
        "tiers": {
            "ebay": {
                "name": "Interior Strip",
                "price": 0,
                "weight_reduction": 50,
                "et_reduction": 0.05,
            },
            "rockauto": {
                "name": "Lightweight Panels",
                "price": 1200,
                "weight_reduction": 120,
                "et_reduction": 0.12,
            },
            "performance": {
                "name": "Full Carbon Kit",
                "price": 3000,
                "weight_reduction": 220,
                "et_reduction": 0.2,
            },
        },
    },
    "nitrous": {
        "name": "Nitrous",
        "tiers": {
            "ebay": {
                "name": "50 Shot Wet Kit",
                "price": 500,
                "hp_bonus": 20,
                "speed_increase": 2.0,
                "et_reduction": 0.12,
            },
            "rockauto": {
                "name": "100 Shot Kit",
                "price": 1500,
                "hp_bonus": 40,
                "speed_increase": 3.5,
                "et_reduction": 0.22,
            },
            "performance": {
                "name": "200 Shot Progressive",
                "price": 3500,
                "hp_bonus": 70,
                "speed_increase": 5.0,
                "et_reduction": 0.35,
            },
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
        "description": "Back-alley grudge matches and cash days for newcomers finding their rhythm.",
        "difficulty": "easy",
        "recommended_et": 14.5,
        "prize_per_race": 500,
        "tournament_bonus": 10000,
        "racers": [
            {"name": "Alley Cat", "car": "Honda Civic Si", "et": 15.6, "trap": 91, "car_color": "#cc0000", "bodyType": "sedan"},
            {"name": "Wrench Willa", "car": "Chevy S-10 Mini Truck", "et": 16.1, "trap": 87, "car_color": "#225522", "bodyType": "truck"},
            {"name": "Backroad Ben", "car": "Ford Bronco Wildtrack", "et": 14.9, "trap": 96, "car_color": "#996633", "bodyType": "suv"},
            {"name": "Downtown Dee", "car": "Datsun 240Z", "et": 15.0, "trap": 90, "car_color": "#ff4400", "bodyType": "coupe"},
            {"name": "Low Boost Leo", "car": "Mazda RX-7", "et": 14.4, "trap": 101, "car_color": "#ffffff", "bodyType": "coupe"},
            {"name": "Midnight Mina", "car": "Pontiac Trans Am KITT", "et": 14.1, "trap": 103, "car_color": "#111111", "bodyType": "coupe"},
            {"name": "Evo Nate", "car": "Mitsubishi Lancer Evo IX", "et": 13.8, "trap": 104, "car_color": "#0044cc", "bodyType": "sedan"},
            {"name": "Raptor Ray", "car": "Ford F-150 Raptor", "et": 13.6, "trap": 106, "car_color": "#334455", "bodyType": "truck"},
        ],
        "boss": {
            "title": "Garage Legend",
            "name": "Street King Kenny",
            "car": "2000 SVT Contour",
            "et": 13.4,
            "trap": 108,
            "car_color": "#ffb300",
            "bodyType": "sedan",
            "taunt": "Show me you can hang with the big kids.",
        },
    },
    {
        "id": "underground_circuit",
        "name": "Underground Circuit",
        "description": "Closed warehouse lots and midnight beltway pulls with faster, tuned builds.",
        "difficulty": "medium",
        "recommended_et": 12.5,
        "prize_per_race": 750,
        "tournament_bonus": 20000,
        "racers": [
            {"name": "Turbo Tasha", "car": "BMW M3 E30", "et": 13.5, "trap": 104, "car_color": "#003399", "bodyType": "coupe"},
            {"name": "Circuit Cyrus", "car": "Pontiac Trans Am KITT", "et": 13.3, "trap": 105, "car_color": "#111111", "bodyType": "coupe"},
            {"name": "Grip Greg", "car": "Jeep Grand Cherokee SRT", "et": 12.9, "trap": 112, "car_color": "#222222", "bodyType": "suv"},
            {"name": "Stage3 Sara", "car": "Dodge Charger R/T", "et": 12.6, "trap": 114, "car_color": "#880000", "bodyType": "sedan"},
            {"name": "Trackside Toni", "car": "Chevrolet Camaro ZL1", "et": 12.2, "trap": 120, "car_color": "#ffcc00", "bodyType": "coupe"},
            {"name": "Voltage Vic", "car": "Tesla Model S Plaid", "et": 11.6, "trap": 126, "car_color": "#e8e8e8", "bodyType": "sedan"},
            {"name": "Countess Cleo", "car": "Lamborghini Countach", "et": 11.9, "trap": 118, "car_color": "#ffdd00", "bodyType": "coupe"},
            {"name": "Midnight Mike", "car": "R34 GT-R Midnight Tune", "et": 11.2, "trap": 125, "car_color": "#1c1c3a", "bodyType": "coupe"},
        ],
        "boss": {
            "title": "Shadow Warden",
            "name": "Ghost GTR",
            "car": "Skyline GT-R V-Spec",
            "et": 10.9,
            "trap": 129,
            "car_color": "#0f172a",
            "bodyType": "coupe",
            "taunt": "No one outruns the ghost.",
        },
    },
    {
        "id": "elite_championship",
        "name": "Elite Championship",
        "description": "Invite-only cash games with the fastest cars in the city. No excuses.",
        "difficulty": "hard",
        "recommended_et": 10.5,
        "prize_per_race": 1000,
        "tournament_bonus": 40000,
        "racers": [
            {"name": "Silver Arrow", "car": "BMW M3 E30 (Built)", "et": 12.0, "trap": 115, "car_color": "#9ea7b3", "bodyType": "coupe"},
            {"name": "Apex Abby", "car": "Audi R8 V10", "et": 11.5, "trap": 122, "car_color": "#777777", "bodyType": "coupe"},
            {"name": "Boosted Byron", "car": "Camaro ZL1 (Sprayed)", "et": 11.1, "trap": 128, "car_color": "#ffb300", "bodyType": "coupe"},
            {"name": "Hammer Hank", "car": "Tesla Model S Plaid", "et": 10.2, "trap": 140, "car_color": "#c0c0c0", "bodyType": "sedan"},
            {"name": "Phoenix", "car": "Lamborghini Countach Twin Turbo", "et": 10.5, "trap": 135, "car_color": "#ffdd00", "bodyType": "coupe"},
            {"name": "Railgun Rui", "car": "Underground Supra", "et": 9.9, "trap": 142, "car_color": "#ff5500", "bodyType": "coupe"},
            {"name": "Nightshade Nova", "car": "GT-R Nismo", "et": 9.7, "trap": 146, "car_color": "#0a0a0f", "bodyType": "coupe"},
            {"name": "Storm Stella", "car": "Koenigsegg Agera", "et": 9.5, "trap": 150, "car_color": "#e0e0e0", "bodyType": "coupe"},
        ],
        "boss": {
            "title": "City Champion",
            "name": "The Phoenix",
            "car": "Full Tube Chassis Dragster",
            "et": 9.0,
            "trap": 160,
            "car_color": "#ff3b30",
            "bodyType": "dragster",
            "taunt": "You get one light. Make it count.",
        },
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

    grip_bonus = 0.0
    speed_bonus = 0.0
    et_bonus = 0.0

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

        hp += float(tier_data.get("hp_bonus", tier_data.get("hp", 0)))
        # Preserve support for legacy "weight" deltas while preferring explicit reductions
        weight += float(tier_data.get("weight", 0))
        weight -= float(tier_data.get("weight_reduction", 0))
        grip_bonus += float(tier_data.get("grip_bonus", 0))
        speed_bonus += float(tier_data.get("speed_increase", 0))
        et_bonus += float(tier_data.get("et_reduction", 0))

    weight = max(weight, 1.0)

    return {
        "hp": round(hp, 2),
        "weight": round(weight, 2),
        "grip_bonus": round(grip_bonus, 4),
        "speed_bonus": round(speed_bonus, 2),
        "et_bonus": round(et_bonus, 3),
        "hp_gain": round(hp - float(base.get("hp", 0)), 2),
        "weight_reduction": round(max(0.0, float(base.get("weight", 3200)) - weight), 2),
    }
