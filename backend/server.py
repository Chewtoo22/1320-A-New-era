from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

api_router = APIRouter()

class RaceSimulateRequest(BaseModel):
    quarter_mile: float
    drag: float

@api_router.post("/api/race/simulate")
async def simulate_race(request: RaceSimulateRequest):
    # Simulate race logic here
    return {"message": "Race simulation executed"}

app.include_router(api_router)

# Ensure this is called before any middleware
