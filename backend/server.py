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

def _compute_effective_stats(catalog_entry: dict, upgrades: dict) -> dict:
    """Return effectiveHP, effectiveWeight, effectiveET, effectiveTrap."""
    effective = calculate_effective_stats(catalog_entry, upgrades)
    hp = float(effective.get("hp", 0))
    weight = float(effective.get("weight", 3200))
    et, trap = _base_et_and_trap_from_hp_weight(hp, weight)
    return {
        "effectiveHP": round(hp, 2),
        "effectiveWeight": round(weight, 2),
        "effectiveET": round(et, 3),
        "effectiveTrap": round(trap, 2),
    }


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
    return list(CAR_CATALOG.values())


# --- Player Cars ---

@app.get("/api/cars/player/{player_id}")
async def get_player_cars(player_id: str):
    cursor = db.player_cars.find({"player_id": player_id})
    cars = await cursor.to_list(length=200)
    return [_serialize(c) for c in cars]


@app.post("/api/cars/buy")
async def buy_car(request: BuyCarRequest):
    player = await db.players.find_one({"id": request.player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    catalog_entry = CAR_CATALOG.get(request.car_id)
    if not catalog_entry:
        raise HTTPException(status_code=404, detail="Car not found in catalog")

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
    effective = _compute_effective_stats(catalog_entry, upgrades)

    await db.player_cars.update_one(
        {"id": request.player_car_id},
        {"$set": {"upgrades": upgrades, "effective_stats": effective}},
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
        "timestamp": datetime.utcnow().isoformat(),
    }
    await db.race_history.insert_one({**race_record, "_id": race_record["id"]})

    updated_player = await db.players.find_one({"id": request.player_id})
    return _serialize(updated_player)

