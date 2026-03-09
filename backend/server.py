from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

from game_data import CAR_CATALOG, PARTS_CATALOG, TOURNAMENTS, PAINT_COLORS, calculate_effective_stats
from backend.race_engine import simulate_quarter_mile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Models ---
class RaceSimulateRequest(BaseModel):
    player_id: str
    player_car_id: str
    opponent_car_id: Optional[str] = None
    opponent_stats: Optional[Dict] = None
    seed: Optional[int] = None

class PlayerCreate(BaseModel):
    username: str

class Player(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    cash: float = 20000
    wins: int = 0
    losses: int = 0
    races_total: int = 0
    tournaments_won: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CarBuyRequest(BaseModel):
    player_id: str
    car_id: str

class CarUpgradeRequest(BaseModel):
    player_id: str
    player_car_id: str
    part_key: str
    tier: str

class CarPaintRequest(BaseModel):
    player_id: str
    player_car_id: str
    paint_color: str

class RaceResultRequest(BaseModel):
    player_id: str
    player_car_id: str
    opponent_name: str
    opponent_car: str
    player_et: float
    opponent_et: float
    player_speed: float
    opponent_speed: float
    result: str
    earnings: float
    race_type: str
    tournament_id: Optional[str] = None
    race_index: Optional[int] = None

class TournamentAdvanceRequest(BaseModel):
    player_id: str
    tournament_id: str
    race_index: int
    won: bool
    
class RaceSimulateRequest(BaseModel):
    player_id: str
    player_car_id: str
    opponent_car_id: Optional[str] = None
    opponent_stats: Optional[Dict] = None
    seed: Optional[int] = None


# --- Player Routes ---
@api_router.post("/player/create")
async def create_player(req: PlayerCreate):
    player = Player(username=req.username)
    doc = player.model_dump()
    await db.players.insert_one(doc)
    return {k: v for k, v in doc.items() if k != '_id'}

@api_router.get("/player/{player_id}")
async def get_player(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

# --- Car Catalog Routes ---
@api_router.get("/cars/catalog")
async def get_car_catalog():
    return list(CAR_CATALOG.values())

@api_router.get("/parts/catalog")
async def get_parts_catalog():
    return PARTS_CATALOG

@api_router.get("/paint/colors")
async def get_paint_colors():
    return PAINT_COLORS

# --- Player Car Routes ---
@api_router.get("/cars/player/{player_id}")
async def get_player_cars(player_id: str):
    cars = await db.player_cars.find({"player_id": player_id}, {"_id": 0}).to_list(100)
    enriched = []
    for pc in cars:
        cat = CAR_CATALOG.get(pc["car_id"])
        if cat:
            stats = calculate_effective_stats(cat, pc.get("upgrades", {}))
            enriched.append({**pc, "catalog": cat, "effective_stats": stats})
    return enriched

@api_router.post("/cars/buy")
async def buy_car(req: CarBuyRequest):
    player = await db.players.find_one({"id": req.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    car = CAR_CATALOG.get(req.car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    if player["cash"] < car["price"]:
        raise HTTPException(status_code=400, detail="Not enough cash")

    player_car = {
        "id": str(uuid.uuid4()),
        "player_id": req.player_id,
        "car_id": req.car_id,
        "upgrades": {
            "intake": None, "exhaust": None, "turbo": None, "ecu": None,
            "clutch": None, "transmission": None, "suspension": None,
            "tires": None, "weight_reduction": None, "nitrous": None
        },
        "paint_color": car["color"],
        "purchased_at": datetime.now(timezone.utc).isoformat()
    }

    await db.player_cars.insert_one(player_car)
    new_cash = player["cash"] - car["price"]
    await db.players.update_one({"id": req.player_id}, {"$set": {"cash": new_cash}})

    stats = calculate_effective_stats(car, player_car["upgrades"])
    result = {k: v for k, v in player_car.items() if k != '_id'}
    result["catalog"] = car
    result["effective_stats"] = stats
    return {"car": result, "new_cash": new_cash}

@api_router.post("/cars/upgrade")
async def upgrade_car(req: CarUpgradeRequest):
    player = await db.players.find_one({"id": req.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    player_car = await db.player_cars.find_one({"id": req.player_car_id, "player_id": req.player_id}, {"_id": 0})
    if not player_car:
        raise HTTPException(status_code=404, detail="Car not found in garage")

    part = PARTS_CATALOG.get(req.part_key)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    tier_data = part["tiers"].get(req.tier)
    if not tier_data:
        raise HTTPException(status_code=404, detail="Tier not found")

    current_tier = player_car["upgrades"].get(req.part_key)
    tier_order = ["ebay", "rockauto", "performance"]
    if current_tier and tier_order.index(current_tier) >= tier_order.index(req.tier):
        raise HTTPException(status_code=400, detail="Already have equal or better upgrade")

    if player["cash"] < tier_data["price"]:
        raise HTTPException(status_code=400, detail="Not enough cash")

    new_cash = player["cash"] - tier_data["price"]
    await db.players.update_one({"id": req.player_id}, {"$set": {"cash": new_cash}})
    await db.player_cars.update_one(
        {"id": req.player_car_id},
        {"$set": {f"upgrades.{req.part_key}": req.tier}}
    )

    updated_car = await db.player_cars.find_one({"id": req.player_car_id}, {"_id": 0})
    cat = CAR_CATALOG.get(updated_car["car_id"])
    stats = calculate_effective_stats(cat, updated_car["upgrades"])

    return {"car": {**updated_car, "catalog": cat, "effective_stats": stats}, "new_cash": new_cash}

@api_router.post("/cars/paint")
async def paint_car(req: CarPaintRequest):
    player = await db.players.find_one({"id": req.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    await db.player_cars.update_one(
        {"id": req.player_car_id, "player_id": req.player_id},
        {"$set": {"paint_color": req.paint_color}}
    )
    return {"success": True}

# --- Race Routes ---

@api_router.post("/race/simulate")
async def simulate_race(req: RaceSimulateRequest):
    player = await db.players.find_one({"id": req.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    player_car = await db.player_cars.find_one(
        {"id": req.player_car_id, "player_id": req.player_id},
        {"_id": 0}
    )
    if not player_car:
        raise HTTPException(status_code=404, detail="Car not found in garage")

    cat = CAR_CATALOG.get(player_car["car_id"])
    if not cat:
        raise HTTPException(status_code=404, detail="Player car_id not found in catalog")

    player_effective = calculate_effective_stats(cat, player_car.get("upgrades", {}))

    if req.opponent_car_id:
        opp_cat = CAR_CATALOG.get(req.opponent_car_id)
        if not opp_cat:
            raise HTTPException(status_code=404, detail="Opponent car_id not found in catalog")
        opponent_effective = calculate_effective_stats(opp_cat, {})
        opponent_label = opp_cat.get("name", req.opponent_car_id)
    elif req.opponent_stats:
        opponent_effective = req.opponent_stats
        opponent_label = req.opponent_stats.get("name", "Opponent")
    else:
        raise HTTPException(status_code=400, detail="Must provide opponent_car_id or opponent_stats")

    sim = simulate_quarter_mile(player_effective, opponent_effective, seed=req.seed)

    return {
        "player_id": req.player_id,
        "player_car_id": req.player_car_id,
        "opponent_label": opponent_label,
        "simulation": sim,
        "player_effective_stats": player_effective,
        "opponent_effective_stats": opponent_effective,
    }
    
@api_router.post("/race/result")
async def record_race_result(req: RaceResultRequest):
    player = await db.players.find_one({"id": req.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    race_doc = {
        "id": str(uuid.uuid4()),
        "player_id": req.player_id,
        "player_car_id": req.player_car_id,
        "opponent_name": req.opponent_name,
        "opponent_car": req.opponent_car,
        "player_et": req.player_et,
        "opponent_et": req.opponent_et,
        "player_speed": req.player_speed,
        "opponent_speed": req.opponent_speed,
        "result": req.result,
        "earnings": req.earnings,
        "race_type": req.race_type,
        "tournament_id": req.tournament_id,
        "race_index": req.race_index,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.race_history.insert_one(race_doc)

    update_ops = {"$inc": {"races_total": 1}}
    if req.result == "win":
        update_ops["$inc"]["wins"] = 1
        update_ops["$inc"]["cash"] = req.earnings
    else:
        update_ops["$inc"]["losses"] = 1

    await db.players.update_one({"id": req.player_id}, update_ops)
    updated = await db.players.find_one({"id": req.player_id}, {"_id": 0})
    return updated

@api_router.get("/race/history/{player_id}")
async def get_race_history(player_id: str):
    history = await db.race_history.find(
        {"player_id": player_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return history

# --- Tournament Routes ---
@api_router.get("/tournaments")
async def get_tournaments():
    return TOURNAMENTS

@api_router.get("/tournament/progress/{player_id}")
async def get_tournament_progress(player_id: str):
    progress = await db.tournament_progress.find(
        {"player_id": player_id}, {"_id": 0}
    ).to_list(10)
    return {p["tournament_id"]: p for p in progress}

@api_router.post("/tournament/advance")
async def advance_tournament(req: TournamentAdvanceRequest):
    existing = await db.tournament_progress.find_one(
        {"player_id": req.player_id, "tournament_id": req.tournament_id}, {"_id": 0}
    )

    if existing:
        new_index = req.race_index + 1 if req.won else existing.get("current_race", 0)
        completed = new_index > 8
        await db.tournament_progress.update_one(
            {"player_id": req.player_id, "tournament_id": req.tournament_id},
            {"$set": {"current_race": new_index, "completed": completed}}
        )
    else:
        doc = {
            "id": str(uuid.uuid4()),
            "player_id": req.player_id,
            "tournament_id": req.tournament_id,
            "current_race": 1 if req.won else 0,
            "completed": False
        }
        await db.tournament_progress.insert_one(doc)

    if req.won:
        tournament = next((t for t in TOURNAMENTS if t["id"] == req.tournament_id), None)
        if tournament:
            is_boss = req.race_index == 8
            earnings = tournament["tournament_bonus"] if is_boss else tournament["prize_per_race"]
            await db.players.update_one(
                {"id": req.player_id},
                {"$inc": {"cash": earnings}}
            )
            if is_boss:
                await db.players.update_one(
                    {"id": req.player_id},
                    {"$addToSet": {"tournaments_won": req.tournament_id}}
                )

    updated_player = await db.players.find_one({"id": req.player_id}, {"_id": 0})
    progress = await db.tournament_progress.find_one(
        {"player_id": req.player_id, "tournament_id": req.tournament_id}, {"_id": 0}
    )
    return {"player": updated_player, "progress": {k: v for k, v in progress.items() if k != '_id'} if progress else None}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@api_router.post("/race/simulate")
async def simulate_race(req: RaceSimulateRequest):
    player = await db.players.find_one({"id": req.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    player_car = await db.player_cars.find_one(
        {"id": req.player_car_id, "player_id": req.player_id},
        {"_id": 0}
    )
    if not player_car:
        raise HTTPException(status_code=404, detail="Car not found in garage")

    cat = CAR_CATALOG.get(player_car["car_id"])
    if not cat:
        raise HTTPException(status_code=404, detail="Player car_id not found in catalog")

    player_effective = calculate_effective_stats(cat, player_car.get("upgrades", {}))

    if req.opponent_car_id:
        opp_cat = CAR_CATALOG.get(req.opponent_car_id)
        if not opp_cat:
            raise HTTPException(status_code=404, detail="Opponent car_id not found in catalog")
        opponent_effective = calculate_effective_stats(opp_cat, {})
        opponent_label = opp_cat.get("name", req.opponent_car_id)
    elif req.opponent_stats:
        opponent_effective = req.opponent_stats
        opponent_label = req.opponent_stats.get("name", "Opponent")
    else:
        raise HTTPException(status_code=400, detail="Must provide opponent_car_id or opponent_stats")

    sim = simulate_quarter_mile(player_effective, opponent_effective, seed=req.seed)

    return {
        "player_id": req.player_id,
        "player_car_id": req.player_car_id,
        "opponent_label": opponent_label,
        "simulation": sim,
        "player_effective_stats": player_effective,
        "opponent_effective_stats": opponent_effective,
    }
