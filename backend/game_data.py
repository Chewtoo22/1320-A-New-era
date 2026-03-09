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
    {"name": "Yellow", "hex": "#ffcc00"},
    {"name": "Orange", "hex": "#ff6600"},
    {"name": "Green", "hex": "#00cc66"},
    {"name": "Purple", "hex": "#9900ff"},
    {"name": "Pink", "hex": "#ff66cc"},
]


# ---------------------------
# Cars (Catalog) — 17 cars across 8 categories
# Fields: id, name, hp, torque, weight, quarterMile, trapSpeed,
#         price, color, category, description
# ---------------------------
CAR_CATALOG: Dict[str, Dict[str, Any]] = {
    # ── Compact ──────────────────────────────────────────────────
    "civic_si": {
        "id": "civic_si",
        "name": "Honda Civic Si",
        "hp": 155,
        "torque": 139,
        "weight": 2800,
        "quarterMile": 15.6,
        "trapSpeed": 89,
        "price": 5000,
        "color": "#cc0000",
        "category": "compact",
        "description": "The perfect starter car. Light, reliable, and endlessly tunable.",
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
        "category": "compact",
        "description": "An underdog with a surprise factor. Upgrade it and shock the competition.",
    },
    "svt_contour": {
        "id": "svt_contour",
        "name": "Ford SVT Contour",
        "hp": 195,
        "torque": 165,
        "weight": 2950,
        "quarterMile": 15.1,
        "trapSpeed": 92,
        "price": 7000,
        "color": "#003399",
        "category": "compact",
        "description": "A sleeper compact with a European sport pedigree. Nimble and quick.",
    },
    # ── JDM ──────────────────────────────────────────────────────
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
        "category": "jdm",
        "description": "Timeless Japanese sports car. Its lightweight chassis makes it a drag-strip surprise.",
    },
    "mazda_rx7_fc": {
        "id": "mazda_rx7_fc",
        "name": "Mazda RX-7 FC",
        "hp": 200,
        "torque": 196,
        "weight": 2700,
        "quarterMile": 14.8,
        "trapSpeed": 95,
        "price": 22000,
        "color": "#cc0044",
        "category": "jdm",
        "description": "Rotary-powered legend. High-revving and perfectly balanced.",
    },
    "toyota_supra_mk4": {
        "id": "toyota_supra_mk4",
        "name": "Toyota Supra MK4",
        "hp": 320,
        "torque": 315,
        "weight": 3300,
        "quarterMile": 13.5,
        "trapSpeed": 107,
        "price": 40000,
        "color": "#ff6600",
        "category": "jdm",
        "description": "The 2JZ engine is the stuff of legend. Tune it and run 9s all day.",
    },
    # ── Muscle ───────────────────────────────────────────────────
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
        "category": "muscle",
        "description": "The iconic black Trans Am from Knight Rider. Sleek and menacing.",
    },
    "ford_mustang_shelby": {
        "id": "ford_mustang_shelby",
        "name": "Ford Mustang Shelby GT500",
        "hp": 500,
        "torque": 480,
        "weight": 3800,
        "quarterMile": 12.0,
        "trapSpeed": 118,
        "price": 55000,
        "color": "#ffffff",
        "category": "muscle",
        "description": "500 horses of pure American muscle. Cobra stripes optional.",
    },
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
        "category": "muscle",
        "description": "The supercharged Camaro that shocks everything it lines up against.",
    },
    # ── Truck ────────────────────────────────────────────────────
    "gmc_cyclone": {
        "id": "gmc_cyclone",
        "name": "GMC Syclone",
        "hp": 280,
        "torque": 350,
        "weight": 3400,
        "quarterMile": 13.4,
        "trapSpeed": 103,
        "price": 20000,
        "color": "#111111",
        "category": "truck",
        "description": "The sleeper truck that shocked the world. 0-60 in 4.3 seconds.",
    },
    "ford_f150_raptor": {
        "id": "ford_f150_raptor",
        "name": "Ford F-150 Raptor",
        "hp": 450,
        "torque": 510,
        "weight": 5500,
        "quarterMile": 13.8,
        "trapSpeed": 99,
        "price": 50000,
        "color": "#336699",
        "category": "truck",
        "description": "Off-road beast that surprises on the strip. Big torque numbers.",
    },
    # ── SUV ──────────────────────────────────────────────────────
    "dodge_durango_rt": {
        "id": "dodge_durango_rt",
        "name": "Dodge Durango R/T",
        "hp": 360,
        "torque": 390,
        "weight": 5200,
        "quarterMile": 13.9,
        "trapSpeed": 100,
        "price": 35000,
        "color": "#aa0000",
        "category": "suv",
        "description": "A Hemi-powered SUV that punches far above its class.",
    },
    # ── Euro ─────────────────────────────────────────────────────
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
        "category": "euro",
        "description": "Nobody expects the turbocharged hippie van. Catch them off guard.",
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
        "category": "euro",
        "description": "Stainless steel body, gull-wing doors, and room to grow with the right mods.",
    },
    # ── Exotic ───────────────────────────────────────────────────
    "porsche_911_turbo": {
        "id": "porsche_911_turbo",
        "name": "Porsche 911 Turbo",
        "hp": 580,
        "torque": 553,
        "weight": 3500,
        "quarterMile": 10.8,
        "trapSpeed": 131,
        "price": 150000,
        "color": "#ffffff",
        "category": "exotic",
        "description": "German engineering at its peak. Flat-six turbocharged perfection.",
    },
    "lamborghini_gallardo": {
        "id": "lamborghini_gallardo",
        "name": "Lamborghini Gallardo",
        "hp": 520,
        "torque": 376,
        "weight": 3200,
        "quarterMile": 11.4,
        "trapSpeed": 124,
        "price": 180000,
        "color": "#ffcc00",
        "category": "exotic",
        "description": "The baby Lambo that bites like the big ones. V10 scream included.",
    },
    # ── Electric ─────────────────────────────────────────────────
    "tesla_model_s_plaid": {
        "id": "tesla_model_s_plaid",
        "name": "Tesla Model S Plaid",
        "hp": 1020,
        "torque": 1050,
        "weight": 4800,
        "quarterMile": 9.2,
        "trapSpeed": 155,
        "price": 90000,
        "color": "#cc0000",
        "category": "electric",
        "description": "Instant torque from three motors. The quickest production car ever made.",
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
# Each upgrade tier provides hp/weight deltas plus display stats.
# server.py expects PARTS_CATALOG[part_key]["tiers"][tier]["price"]
# Frontend also uses: name, et_reduction, speed_increase, hp_bonus
# ---------------------------
PARTS_CATALOG: Dict[str, Dict[str, Any]] = {
    "intake": {
        "name": "Air Intake",
        "tiers": {
            "ebay": {
                "name": "eBay Cold Air Intake",
                "price": 250,
                "hp": 5,
                "weight": 0,
                "hp_bonus": 5,
                "et_reduction": 0.1,
                "speed_increase": 1,
            },
            "rockauto": {
                "name": "RockAuto Performance Intake",
                "price": 750,
                "hp": 10,
                "weight": 0,
                "hp_bonus": 10,
                "et_reduction": 0.2,
                "speed_increase": 2,
            },
            "performance": {
                "name": "Competition Air Intake System",
                "price": 1800,
                "hp": 18,
                "weight": 0,
                "hp_bonus": 18,
                "et_reduction": 0.4,
                "speed_increase": 3,
            },
        },
    },
    "exhaust": {
        "name": "Exhaust",
        "tiers": {
            "ebay": {
                "name": "eBay Cat-Back Exhaust",
                "price": 350,
                "hp": 5,
                "weight": 0,
                "hp_bonus": 5,
                "et_reduction": 0.1,
                "speed_increase": 1,
            },
            "rockauto": {
                "name": "RockAuto Performance Exhaust",
                "price": 1100,
                "hp": 12,
                "weight": 0,
                "hp_bonus": 12,
                "et_reduction": 0.25,
                "speed_increase": 3,
            },
            "performance": {
                "name": "Full Race Exhaust System",
                "price": 2800,
                "hp": 22,
                "weight": 0,
                "hp_bonus": 22,
                "et_reduction": 0.5,
                "speed_increase": 5,
            },
        },
    },
    "turbo": {
        "name": "Forced Induction",
        "tiers": {
            "ebay": {
                "name": "eBay Turbo Kit",
                "price": 1200,
                "hp": 25,
                "weight": 0,
                "hp_bonus": 25,
                "et_reduction": 0.5,
                "speed_increase": 5,
            },
            "rockauto": {
                "name": "RockAuto Stage 2 Turbo",
                "price": 3500,
                "hp": 45,
                "weight": 0,
                "hp_bonus": 45,
                "et_reduction": 0.9,
                "speed_increase": 9,
            },
            "performance": {
                "name": "Competition Turbo / Supercharger",
                "price": 8000,
                "hp": 80,
                "weight": 0,
                "hp_bonus": 80,
                "et_reduction": 1.6,
                "speed_increase": 15,
            },
        },
    },
    "ecu": {
        "name": "ECU Tune",
        "tiers": {
            "ebay": {
                "name": "eBay ECU Flash",
                "price": 150,
                "hp": 4,
                "weight": 0,
                "hp_bonus": 4,
                "et_reduction": 0.08,
                "speed_increase": 1,
            },
            "rockauto": {
                "name": "RockAuto Stage 1 Tune",
                "price": 900,
                "hp": 12,
                "weight": 0,
                "hp_bonus": 12,
                "et_reduction": 0.25,
                "speed_increase": 2,
            },
            "performance": {
                "name": "Full Custom ECU Remap",
                "price": 2500,
                "hp": 25,
                "weight": 0,
                "hp_bonus": 25,
                "et_reduction": 0.5,
                "speed_increase": 4,
            },
        },
    },
    "clutch": {
        "name": "Clutch",
        "tiers": {
            "ebay": {
                "name": "eBay Performance Clutch",
                "price": 250,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.05,
                "speed_increase": 0,
            },
            "rockauto": {
                "name": "RockAuto Stage 2 Clutch",
                "price": 850,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.15,
                "speed_increase": 0,
            },
            "performance": {
                "name": "Competition Twin-Disc Clutch",
                "price": 2000,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.3,
                "speed_increase": 0,
            },
        },
    },
    "transmission": {
        "name": "Transmission",
        "tiers": {
            "ebay": {
                "name": "eBay Short-Throw Shifter",
                "price": 650,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.1,
                "speed_increase": 2,
            },
            "rockauto": {
                "name": "RockAuto Close-Ratio Gearbox",
                "price": 1800,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.3,
                "speed_increase": 4,
            },
            "performance": {
                "name": "Competition Sequential Trans",
                "price": 5000,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.7,
                "speed_increase": 8,
            },
        },
    },
    "suspension": {
        "name": "Suspension",
        "tiers": {
            "ebay": {
                "name": "eBay Lowering Springs",
                "price": 300,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.05,
                "speed_increase": 0,
            },
            "rockauto": {
                "name": "RockAuto Coilover Kit",
                "price": 1200,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.15,
                "speed_increase": 0,
            },
            "performance": {
                "name": "Competition Drag Suspension",
                "price": 2200,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.25,
                "speed_increase": 0,
            },
        },
    },
    "tires": {
        "name": "Tires",
        "tiers": {
            "ebay": {
                "name": "eBay Performance Tires",
                "price": 300,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.1,
                "speed_increase": 1,
            },
            "rockauto": {
                "name": "RockAuto Drag Radials",
                "price": 800,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.2,
                "speed_increase": 2,
            },
            "performance": {
                "name": "Competition Drag Slicks",
                "price": 1500,
                "hp": 0,
                "weight": 0,
                "hp_bonus": 0,
                "et_reduction": 0.4,
                "speed_increase": 4,
            },
        },
    },
    "weight_reduction": {
        "name": "Weight Reduction",
        "tiers": {
            "ebay": {
                "name": "eBay Interior Strip",
                "price": 0,
                "hp": 0,
                "weight": -50,
                "hp_bonus": 0,
                "et_reduction": 0.07,
                "speed_increase": 1,
            },
            "rockauto": {
                "name": "RockAuto Lightweight Parts",
                "price": 1200,
                "hp": 0,
                "weight": -120,
                "hp_bonus": 0,
                "et_reduction": 0.2,
                "speed_increase": 2,
            },
            "performance": {
                "name": "Carbon Fiber Body Panels",
                "price": 3000,
                "hp": 0,
                "weight": -220,
                "hp_bonus": 0,
                "et_reduction": 0.35,
                "speed_increase": 3,
            },
        },
    },
    "nitrous": {
        "name": "Nitrous",
        "tiers": {
            "ebay": {
                "name": "eBay 50-Shot Nitrous Kit",
                "price": 500,
                "hp": 20,
                "weight": 0,
                "hp_bonus": 20,
                "et_reduction": 0.4,
                "speed_increase": 4,
            },
            "rockauto": {
                "name": "RockAuto 100-Shot Nitrous",
                "price": 1500,
                "hp": 40,
                "weight": 0,
                "hp_bonus": 40,
                "et_reduction": 0.8,
                "speed_increase": 8,
            },
            "performance": {
                "name": "Competition 150-Shot Nitrous",
                "price": 3500,
                "hp": 70,
                "weight": 0,
                "hp_bonus": 70,
                "et_reduction": 1.4,
                "speed_increase": 13,
            },
        },
    },
}


# ---------------------------
# Tournaments
# Each tournament has racers (8) and a boss, plus difficulty/description.
# ---------------------------
TOURNAMENTS = [
    {
        "id": "street_league",
        "name": "Street League",
        "difficulty": "easy",
        "recommended_et": 18.0,
        "prize_per_race": 500,
        "tournament_bonus": 10000,
        "description": "Take on local street racers in their stock rides. A great starting point.",
        "racers": [
            {"name": "Slow Steve", "car": "Honda Civic (Stock)", "et": 17.8, "trap": 79, "car_color": "#cc0000", "bodyType": "compact"},
            {"name": "Cautious Carl", "car": "Ford Focus", "et": 17.5, "trap": 80, "car_color": "#0066ff", "bodyType": "compact"},
            {"name": "Mild Mike", "car": "Toyota Corolla", "et": 17.2, "trap": 81, "car_color": "#ffffff", "bodyType": "compact"},
            {"name": "Easy Eddie", "car": "VW Golf", "et": 16.9, "trap": 83, "car_color": "#333333", "bodyType": "compact"},
            {"name": "Timid Tim", "car": "Dodge Neon", "et": 16.7, "trap": 84, "car_color": "#ff6600", "bodyType": "compact"},
            {"name": "Passive Pete", "car": "Mazda 3", "et": 16.4, "trap": 85, "car_color": "#336699", "bodyType": "compact"},
            {"name": "Average Ava", "car": "Subaru Impreza", "et": 16.2, "trap": 86, "car_color": "#0055aa", "bodyType": "sports"},
            {"name": "Lazy Larry", "car": "Pontiac Sunfire", "et": 16.0, "trap": 87, "car_color": "#aa5500", "bodyType": "compact"},
        ],
        "boss": {
            "name": "Kenny 'Street King'",
            "title": "Street King",
            "car": "Ford SVT Contour (Tuned)",
            "et": 14.8,
            "trap": 95,
            "car_color": "#003399",
            "bodyType": "compact",
            "taunt": "You thought you could run with me? Go back to the kiddie races!",
        },
    },
    {
        "id": "underground_circuit",
        "name": "Underground Circuit",
        "difficulty": "medium",
        "recommended_et": 14.0,
        "prize_per_race": 750,
        "tournament_bonus": 20000,
        "description": "Midnight street racing with serious competition. Upgraded rides, big prizes.",
        "racers": [
            {"name": "Quick Quinn", "car": "Honda Civic Si (Modded)", "et": 14.5, "trap": 97, "car_color": "#cc0000", "bodyType": "compact"},
            {"name": "Flash Fernando", "car": "Mitsubishi Eclipse", "et": 14.2, "trap": 99, "car_color": "#cc00cc", "bodyType": "sports"},
            {"name": "Drift Derek", "car": "Nissan 240SX", "et": 13.9, "trap": 101, "car_color": "#ffffff", "bodyType": "sports"},
            {"name": "Boost Brad", "car": "Mazda RX-7 FD", "et": 13.7, "trap": 103, "car_color": "#ff6600", "bodyType": "sports"},
            {"name": "Nitro Nick", "car": "Toyota MR2 Turbo", "et": 13.5, "trap": 105, "car_color": "#00aa00", "bodyType": "sports"},
            {"name": "Slick Sam", "car": "Subaru WRX", "et": 13.3, "trap": 107, "car_color": "#0066cc", "bodyType": "sports"},
            {"name": "Turbo Teresa", "car": "Mitsubishi Evo VII", "et": 13.1, "trap": 109, "car_color": "#cc0000", "bodyType": "sports"},
            {"name": "Road Runner Ray", "car": "Pontiac Trans Am", "et": 12.9, "trap": 111, "car_color": "#333333", "bodyType": "muscle"},
        ],
        "boss": {
            "name": "Midnight Mike",
            "title": "Night Stalker",
            "car": "Nissan Skyline R34 GT-R",
            "et": 11.5,
            "trap": 122,
            "car_color": "#111111",
            "bodyType": "sports",
            "taunt": "I own these streets after dark. You're just visiting, kid.",
        },
    },
    {
        "id": "elite_championship",
        "name": "Elite Championship",
        "difficulty": "hard",
        "recommended_et": 11.0,
        "prize_per_race": 1000,
        "tournament_bonus": 40000,
        "description": "The top tier of street racing. Only the fastest survive.",
        "racers": [
            {"name": "Apex Alex", "car": "Porsche 911 GT3", "et": 11.8, "trap": 118, "car_color": "#ffffff", "bodyType": "exotic"},
            {"name": "Savage Sara", "car": "Chevrolet Corvette Z06", "et": 11.5, "trap": 121, "car_color": "#ffcc00", "bodyType": "exotic"},
            {"name": "Blitz Blake", "car": "Ford GT", "et": 11.2, "trap": 124, "car_color": "#0033cc", "bodyType": "exotic"},
            {"name": "Phantom Phil", "car": "Dodge Viper ACR", "et": 11.0, "trap": 126, "car_color": "#cc0000", "bodyType": "exotic"},
            {"name": "Zero Zero", "car": "Nissan GT-R R35", "et": 10.7, "trap": 128, "car_color": "#c0c0c0", "bodyType": "sports"},
            {"name": "Titan Tasha", "car": "McLaren 570S", "et": 10.5, "trap": 131, "car_color": "#ff6600", "bodyType": "exotic"},
            {"name": "Ghost Gary", "car": "Lamborghini Huracan", "et": 10.3, "trap": 134, "car_color": "#00aa44", "bodyType": "exotic"},
            {"name": "King Kyle", "car": "Ferrari F40", "et": 10.1, "trap": 136, "car_color": "#cc0000", "bodyType": "exotic"},
        ],
        "boss": {
            "name": "The Phoenix",
            "title": "Undefeated Champion",
            "car": "Twin-Turbo Dragster",
            "et": 8.5,
            "trap": 162,
            "car_color": "#ff4400",
            "bodyType": "dragster",
            "taunt": "Nobody has ever beaten me. Nobody. Turn around now and I'll let you keep your car.",
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
