import math
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from backend.game_data import (
        CAR_CATALOG,
        PARTS_CATALOG,
        TOURNAMENTS,
        calculate_effective_stats,
    )
    from backend.race_engine import simulate_quarter_mile
except ImportError:
    from game_data import (  # type: ignore[no-redef]
        CAR_CATALOG,
        PARTS_CATALOG,
        TOURNAMENTS,
        calculate_effective_stats,
    )
    from race_engine import simulate_quarter_mile  # type: ignore[no-redef]

app = FastAPI(title="1320: A New Era API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory storage (no database required)
# ---------------------------------------------------------------------------
_players: dict = {}           # player_id -> player dict
_player_cars: dict = {}       # player_id -> list[player_car dict]
_tournament_progress: dict = {}  # player_id -> {tournament_id -> progress dict}

STARTING_CASH = 20000


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _compute_effective_stats(catalog_entry: dict, upgrades: dict) -> dict:
    """Return effective_stats dict from catalog entry + upgrades."""
    effective = calculate_effective_stats(catalog_entry, upgrades)
    hp = max(float(effective.get("hp", 1)), 1.0)
    weight = max(float(effective.get("weight", 3200)), 1.0)
    base_hp = max(float(catalog_entry.get("hp", 1)), 1.0)
    base_weight = max(float(catalog_entry.get("weight", 3200)), 1.0)

    base_et = 5.825 * ((base_weight / base_hp) ** (1.0 / 3.0)) + 1.2
    effective_et = 5.825 * ((weight / hp) ** (1.0 / 3.0)) + 1.2
    effective_trap = 234.0 * ((hp / weight) ** (1.0 / 3.0))

    return {
        "effectiveHP": round(hp, 1),
        "effectiveET": round(effective_et, 2),
        "effectiveSpeed": round(effective_trap, 1),
        "etReduction": round(max(base_et - effective_et, 0.0), 2),
    }


def _build_player_car(player_id: str, car_id: str, upgrades: Optional[dict] = None) -> dict:
    catalog_entry = CAR_CATALOG.get(car_id)
    if not catalog_entry:
        return {}
    upgrades = upgrades or {}
    return {
        "id": str(uuid.uuid4()),
        "player_id": player_id,
        "car_id": car_id,
        "upgrades": upgrades,
        "paint_color": catalog_entry.get("color", "#888888"),
        "catalog": catalog_entry,
        "effective_stats": _compute_effective_stats(catalog_entry, upgrades),
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
    result: str      # "win" or "loss"
    earnings: float
    race_type: str


class RaceSimulateRequest(BaseModel):
    quarter_mile: float
    drag: float


class TournamentAdvanceRequest(BaseModel):
    player_id: str
    tournament_id: str
    race_index: int
    result: str      # "win" or "loss"


# ---------------------------------------------------------------------------
# Player endpoints
# ---------------------------------------------------------------------------

@app.post("/api/player/create")
async def create_player(request: CreatePlayerRequest):
    player_id = str(uuid.uuid4())
    player = {
        "id": player_id,
        "username": request.username,
        "cash": STARTING_CASH,
        "wins": 0,
        "losses": 0,
        "created_at": datetime.utcnow().isoformat(),
    }
    _players[player_id] = player
    _player_cars[player_id] = []
    _tournament_progress[player_id] = {}
    return player


@app.get("/api/player/{player_id}")
async def get_player(player_id: str):
    player = _players.get(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


# ---------------------------------------------------------------------------
# Car catalog & player car endpoints
# ---------------------------------------------------------------------------

@app.get("/api/cars/catalog")
async def get_car_catalog():
    return list(CAR_CATALOG.values())


@app.post("/api/cars/buy")
async def buy_car(request: BuyCarRequest):
    player = _players.get(request.player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    car = CAR_CATALOG.get(request.car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found in catalog")
    if player["cash"] < car["price"]:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    player["cash"] -= car["price"]
    new_car = _build_player_car(request.player_id, request.car_id)
    _player_cars[request.player_id].append(new_car)
    return {"car": new_car, "new_cash": player["cash"]}


@app.get("/api/cars/player/{player_id}")
async def get_player_cars(player_id: str):
    if player_id not in _players:
        raise HTTPException(status_code=404, detail="Player not found")
    return _player_cars.get(player_id, [])


# ---------------------------------------------------------------------------
# Parts / upgrades
# ---------------------------------------------------------------------------

@app.get("/api/parts/catalog")
async def get_parts_catalog():
    return PARTS_CATALOG


@app.post("/api/cars/upgrade")
async def upgrade_car(request: UpgradeCarRequest):
    player = _players.get(request.player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    part = PARTS_CATALOG.get(request.part_key)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    tier_data = part.get("tiers", {}).get(request.tier)
    if not tier_data:
        raise HTTPException(status_code=404, detail="Upgrade tier not found")

    cars = _player_cars.get(request.player_id, [])
    car = next((c for c in cars if c["id"] == request.player_car_id), None)
    if not car:
        raise HTTPException(status_code=404, detail="Player car not found")

    price = tier_data.get("price", 0)
    if player["cash"] < price:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    player["cash"] -= price
    car["upgrades"][request.part_key] = request.tier
    catalog_entry = CAR_CATALOG.get(car["car_id"], {})
    car["effective_stats"] = _compute_effective_stats(catalog_entry, car["upgrades"])
    return {"car": car, "new_cash": player["cash"]}


# ---------------------------------------------------------------------------
# Tournament endpoints
# ---------------------------------------------------------------------------

@app.get("/api/tournaments")
async def get_tournaments():
    return TOURNAMENTS


@app.get("/api/tournament/progress/{player_id}")
async def get_tournament_progress(player_id: str):
    if player_id not in _players:
        raise HTTPException(status_code=404, detail="Player not found")
    return _tournament_progress.get(player_id, {})


@app.post("/api/tournament/advance")
async def advance_tournament(request: TournamentAdvanceRequest):
    player = _players.get(request.player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    progress = _tournament_progress.setdefault(request.player_id, {})
    t_prog = progress.setdefault(request.tournament_id, {"current_race": 0, "completed": False})

    if request.result == "win":
        t_prog["current_race"] = request.race_index + 1
        tournament = next((t for t in TOURNAMENTS if t["id"] == request.tournament_id), None)
        if tournament:
            total_racers = len(tournament.get("racers", []))
            if request.race_index >= total_racers:
                t_prog["completed"] = True
                player["cash"] += int(tournament.get("tournament_bonus", 0))

    return {"progress": t_prog, "player": player}


# ---------------------------------------------------------------------------
# Race endpoints
# ---------------------------------------------------------------------------

@app.post("/api/race/result")
async def record_race_result(request: RaceResultRequest):
    player = _players.get(request.player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    if request.result == "win":
        player["wins"] += 1
        player["cash"] += int(request.earnings)
    else:
        player["losses"] += 1

    return player


@app.post("/api/race/simulate")
async def simulate_race(request: RaceSimulateRequest):
    player_stats = {"quarterMile": request.quarter_mile}
    opponent_stats = {"quarterMile": request.drag}
    result = simulate_quarter_mile(player_stats, opponent_stats)
    return result
