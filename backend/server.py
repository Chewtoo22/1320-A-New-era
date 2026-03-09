"""
1320: A New Era — FastAPI Backend Server

Endpoints:
  POST /api/player/create
  GET  /api/player/{player_id}
  GET  /api/cars/catalog
  GET  /api/cars/player/{player_id}
  POST /api/cars/buy
  POST /api/cars/upgrade
  GET  /api/parts/catalog
  GET  /api/tournaments
  POST /api/race/result
  GET  /api/health
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Any, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

from game_data import (
    CAR_CATALOG,
    PARTS_CATALOG,
    TOURNAMENTS,
    calculate_effective_stats,
)
from race_engine import _base_et_and_trap_from_hp_weight

load_dotenv()

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "turbo_showdown")
# Allowed origins: comma-separated list or "*" for development
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS: List[str] = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins != "*"
    else ["*"]
)

app = FastAPI(title="1320: A New Era API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

client: Optional[AsyncIOMotorClient] = None
db: Optional[Any] = None


@app.on_event("startup")
async def startup_db():
    global client, db
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]


@app.on_event("shutdown")
async def shutdown_db():
    if client:
        client.close()


def _serialize(doc: dict) -> dict:
    """Remove MongoDB _id and return a plain dict."""
    if doc is None:
        return None
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalize_catalog_entry(entry: dict) -> dict:
    """Fill in optional fields that the frontend relies on for rendering."""
    if not entry:
        return {}
    normalized = dict(entry)
    normalized.setdefault(
        "description",
        f"{entry.get('name', 'Car')} ready for the quarter mile.",
    )
    normalized.setdefault("drivetrain", "rwd")
    normalized.setdefault("gears", 1 if entry.get("category") == "electric" else 6)
    normalized.setdefault("redline", 7000)
    normalized.setdefault("bodyType", "coupe")
    normalized.setdefault("paint_color", normalized.get("color", "#FFB300"))

    base_hp = float(normalized.get("hp", 0) or 0)
    base_weight = float(normalized.get("weight", 3200) or 3200)
    if normalized.get("quarterMile") is None:
        et_hint, _ = _base_et_and_trap_from_hp_weight(base_hp or 1.0, base_weight or 3200.0)
        normalized["quarterMile"] = round(et_hint, 3)
    if normalized.get("trapSpeed") is None:
        _, trap_hint = _base_et_and_trap_from_hp_weight(base_hp or 1.0, base_weight or 3200.0)
        normalized["trapSpeed"] = round(trap_hint, 2)

    return normalized


def _compute_effective_stats(catalog_entry: dict, upgrades: dict) -> dict:
    """Return effective stats used by the HUD and race engine."""
    normalized = _normalize_catalog_entry(catalog_entry)
    effective = calculate_effective_stats(normalized, upgrades)

    base_hp = float(normalized.get("hp", 0) or 0)
    base_weight = float(normalized.get("weight", 3200) or 3200)
    hp = float(effective.get("hp", base_hp))
    weight = max(float(effective.get("weight", base_weight)), 1.0)

    base_et = float(normalized.get("quarterMile", _base_et_and_trap_from_hp_weight(base_hp, base_weight)[0]))
    base_trap = float(normalized.get("trapSpeed", _base_et_and_trap_from_hp_weight(base_hp, base_weight)[1]))

    et, trap = _base_et_and_trap_from_hp_weight(hp, weight)
    et = max(et - float(effective.get("et_bonus", 0.0)), 0.0)
    trap = trap + float(effective.get("speed_bonus", 0.0))

    et_reduction = max(0.0, base_et - et)
    speed_gain = trap - base_trap

    return {
        "effectiveHP": round(hp, 2),
        "effectiveWeight": round(weight, 2),
        "effectiveET": round(et, 3),
        "effectiveTrap": round(trap, 2),
        "effectiveSpeed": round(trap, 2),
        "weightReduction": round(
            effective.get("weight_reduction", max(0.0, base_weight - weight)), 2
        ),
        "hpGain": round(effective.get("hp_gain", hp - base_hp), 2),
        "etReduction": round(et_reduction, 3),
        "speedGain": round(speed_gain, 2),
        "gripBonus": round(effective.get("grip_bonus", 0.0), 3),
    }


def _get_tournament_by_id(tournament_id: str) -> Optional[dict]:
    for t in TOURNAMENTS:
        if t["id"] == tournament_id:
            return t
    return None


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------

class CreatePlayerRequest(BaseModel):
    username: str


class BuyCarRequest(BaseModel):
    player_id: str
    car_id: str


class UpgradeCarRequest(BaseModel):
    player_id: str
    player_car_id: str
    part_key: str
    tier: str


class RaceResultRequest(BaseModel):
    player_id: str
    player_car_id: str
    opponent_name: str
    opponent_car: str
    player_et: float
    opponent_et: float
    player_speed: float
    opponent_speed: float
    result: str          # "win" or "loss"
    earnings: int
    race_type: str
    tournament_id: Optional[str] = None
    race_index: Optional[int] = None


class TournamentAdvanceRequest(BaseModel):
    player_id: str
    tournament_id: str
    race_index: int
    won: bool


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# --- Player ---

@app.post("/api/player/create")
async def create_player(request: CreatePlayerRequest):
    player = {
        "id": str(uuid.uuid4()),
        "username": request.username,
        "cash": 20000,
        "wins": 0,
        "losses": 0,
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.players.insert_one({**player, "_id": player["id"]})
    return player


@app.get("/api/player/{player_id}")
async def get_player(player_id: str):
    doc = await db.players.find_one({"id": player_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Player not found")
    return _serialize(doc)


# --- Car Catalog ---

@app.get("/api/cars/catalog")
async def get_car_catalog():
    return [_normalize_catalog_entry(c) for c in CAR_CATALOG.values()]


# --- Player Cars ---

@app.get("/api/cars/player/{player_id}")
async def get_player_cars(player_id: str):
    cursor = db.player_cars.find({"player_id": player_id})
    cars = await cursor.to_list(length=200)
    normalized = []
    for car in cars:
        catalog_entry = _normalize_catalog_entry(
            car.get("catalog") or CAR_CATALOG.get(car.get("car_id"), {})
        )
        upgrades = car.get("upgrades") or {}
        effective = _compute_effective_stats(catalog_entry, upgrades)

        merged_effective = {
            **effective,
            **(car.get("effective_stats") or {}),
        }

        merged_car = {
            **car,
            "catalog": catalog_entry,
            "effective_stats": merged_effective,
            "paint_color": car.get("paint_color") or catalog_entry.get("paint_color"),
        }
        normalized.append(_serialize(merged_car))

    return normalized


@app.post("/api/cars/buy")
async def buy_car(request: BuyCarRequest):
    player = await db.players.find_one({"id": request.player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    catalog_entry = CAR_CATALOG.get(request.car_id)
    if not catalog_entry:
        raise HTTPException(status_code=404, detail="Car not found in catalog")

    catalog_entry = _normalize_catalog_entry(catalog_entry)
    price = catalog_entry["price"]
    if player["cash"] < price:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    new_cash = player["cash"] - price
    await db.players.update_one({"id": request.player_id}, {"$set": {"cash": new_cash}})

    upgrades: dict = {}
    effective = _compute_effective_stats(catalog_entry, upgrades)

    car = {
        "id": str(uuid.uuid4()),
        "player_id": request.player_id,
        "car_id": request.car_id,
        "upgrades": upgrades,
        "catalog": catalog_entry,
        "paint_color": catalog_entry.get("paint_color"),
        "effective_stats": effective,
        "purchased_at": datetime.utcnow().isoformat(),
    }
    await db.player_cars.insert_one({**car, "_id": car["id"]})

    return {"car": car, "new_cash": new_cash}


@app.post("/api/cars/upgrade")
async def upgrade_car(request: UpgradeCarRequest):
    player = await db.players.find_one({"id": request.player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    player_car = await db.player_cars.find_one(
        {"id": request.player_car_id, "player_id": request.player_id}
    )
    if not player_car:
        raise HTTPException(status_code=404, detail="Car not found in garage")

    part = PARTS_CATALOG.get(request.part_key)
    if not part:
        raise HTTPException(status_code=404, detail=f"Part '{request.part_key}' not found")

    tier_data = part.get("tiers", {}).get(request.tier)
    if not tier_data:
        raise HTTPException(status_code=404, detail=f"Tier '{request.tier}' not found")

    price = tier_data["price"]
    if player["cash"] < price:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    new_cash = player["cash"] - price
    await db.players.update_one({"id": request.player_id}, {"$set": {"cash": new_cash}})

    upgrades = dict(player_car.get("upgrades") or {})
    upgrades[request.part_key] = request.tier

    catalog_entry = CAR_CATALOG.get(player_car["car_id"])
    catalog_entry = _normalize_catalog_entry(catalog_entry)
    effective = _compute_effective_stats(catalog_entry, upgrades)

    await db.player_cars.update_one(
        {"id": request.player_car_id},
        {
            "$set": {
                "upgrades": upgrades,
                "effective_stats": effective,
                "catalog": catalog_entry,
                "paint_color": player_car.get("paint_color") or catalog_entry.get("paint_color"),
            }
        },
    )

    updated_car = await db.player_cars.find_one({"id": request.player_car_id})
    return {"car": _serialize(updated_car), "new_cash": new_cash}


# --- Parts ---

@app.get("/api/parts/catalog")
async def get_parts_catalog():
    return PARTS_CATALOG


# --- Tournaments ---

@app.get("/api/tournaments")
async def get_tournaments():
    return TOURNAMENTS


@app.get("/api/tournament/progress/{player_id}")
async def get_tournament_progress(player_id: str):
    cursor = db.tournament_progress.find({"player_id": player_id})
    docs = await cursor.to_list(length=100)
    progress_map = {
        doc["tournament_id"]: {
            "current_race": doc.get("current_race", 0),
            "completed": doc.get("completed", False),
        }
        for doc in docs
        if doc
    }
    for t in TOURNAMENTS:
        progress_map.setdefault(t["id"], {"current_race": 0, "completed": False})
    return progress_map


@app.post("/api/tournament/advance")
async def advance_tournament(request: TournamentAdvanceRequest):
    player = await db.players.find_one({"id": request.player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    tournament = _get_tournament_by_id(request.tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    total_races = len(tournament.get("racers", [])) + 1
    progress = await db.tournament_progress.find_one(
        {"player_id": request.player_id, "tournament_id": request.tournament_id}
    )
    current_race = progress.get("current_race", 0) if progress else 0
    completed = progress.get("completed", False) if progress else False

    if completed:
        return {"progress": {"current_race": current_race, "completed": True}, "cash": player["cash"], "payout": 0}

    if request.race_index < current_race:
        return {"progress": {"current_race": current_race, "completed": completed}, "cash": player["cash"], "payout": 0}
    if request.race_index != current_race:
        raise HTTPException(status_code=400, detail="Race index out of sequence")

    payout = 0
    if request.won:
        current_race = min(current_race + 1, total_races)
        if current_race >= total_races:
            completed = True
            payout = tournament.get("tournament_bonus", 0)
        else:
            payout = tournament.get("prize_per_race", 0)

    new_cash = player["cash"] + payout
    await db.players.update_one({"id": request.player_id}, {"$set": {"cash": new_cash}})
    await db.tournament_progress.update_one(
        {"player_id": request.player_id, "tournament_id": request.tournament_id},
        {
            "$set": {
                "_id": f"{request.player_id}:{request.tournament_id}",
                "player_id": request.player_id,
                "tournament_id": request.tournament_id,
                "current_race": current_race,
                "completed": completed,
                "updated_at": datetime.utcnow().isoformat(),
            }
        },
        upsert=True,
    )

    return {
        "progress": {"current_race": current_race, "completed": completed},
        "cash": new_cash,
        "payout": payout,
    }


# --- Race ---

@app.post("/api/race/result")
async def record_race_result(request: RaceResultRequest):
    player = await db.players.find_one({"id": request.player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    is_win = request.result.lower() == "win"
    new_cash = player["cash"] + (request.earnings if is_win else 0)
    new_wins = player["wins"] + (1 if is_win else 0)
    new_losses = player["losses"] + (0 if is_win else 1)

    await db.players.update_one(
        {"id": request.player_id},
        {"$set": {"cash": new_cash, "wins": new_wins, "losses": new_losses}},
    )

    race_record = {
        "id": str(uuid.uuid4()),
        "player_id": request.player_id,
        "player_car_id": request.player_car_id,
        "opponent_name": request.opponent_name,
        "opponent_car": request.opponent_car,
        "player_et": request.player_et,
        "opponent_et": request.opponent_et,
        "player_speed": request.player_speed,
        "opponent_speed": request.opponent_speed,
        "result": request.result,
        "earnings": request.earnings,
        "race_type": request.race_type,
        "tournament_id": request.tournament_id,
        "race_index": request.race_index,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await db.race_history.insert_one({**race_record, "_id": race_record["id"]})

    updated_player = await db.players.find_one({"id": request.player_id})
    return _serialize(updated_player)
