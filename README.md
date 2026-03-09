# 1320: A New Era

A retro drag-racing game where players buy, upgrade, and race classic cars through tournaments against AI opponents.

## Overview

Players start with a budget, choose from a catalog of iconic vehicles, bolt on performance parts, and race head-to-head in quarter-mile drag competitions. Win races to earn cash, unlock tougher tournaments, and eventually face elite boss drivers.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI (`backend/server.py`) + Flask utility layer (`flask_api.py`) |
| Race Simulation | Python (`backend/race_engine.py`) |
| Game Data | Python (`backend/game_data.py`) |
| Frontend | React + Radix UI + Tailwind CSS |
| Database | MongoDB |

## Project Structure

```
1320-A-New-era/
├── backend/
│   ├── server.py          # FastAPI application entry point
│   ├── game_data.py       # Car catalog, parts, tournaments, paint colors
│   ├── race_engine.py     # Quarter-mile race simulation with realistic physics
│   ├── ai_system.py       # AI opponent leveling system
│   └── requirements.txt   # Python dependencies
├── frontend/              # React application (Create React App)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level views
│   │   └── App.js
│   └── package.json
├── flask_api.py           # Flask API routes (cars, boss-cars, races, tournaments)
├── game_data.py           # Re-exports backend/game_data symbols
├── backend_test.py        # Integration test suite
└── README.md
```

## Game Data

### Cars (6 player vehicles)
- Chevrolet Camaro ZL1 — 650 hp, $65 000
- Pontiac Trans Am KITT — 300 hp, $28 000
- Datsun 240Z — 150 hp, $18 000
- VW Type 2 Bus Turbo — 150 hp, $14 000
- AMC Pacer — 90 hp, $8 000
- DeLorean DMC-12 — 130 hp, $30 000

### Upgrade Parts (10 types × 3 tiers: Ebay / RockAuto / Performance)
Air Intake, Exhaust, Forced Induction, ECU Tune, Clutch, Transmission, Suspension, Tires, Weight Reduction, Nitrous

### Tournaments
1. **Street League** — $500/race · $10 000 bonus
2. **Underground Circuit** — $750/race · $20 000 bonus
3. **Elite Championship** — $1 000/race · $40 000 bonus

## API Endpoints

### Flask API (`flask_api.py`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cars` | List all player cars |
| GET | `/api/boss-cars` | List all boss cars |
| GET | `/api/tournaments` | List all tournaments |
| POST | `/api/race/start` | Start a race |
| POST | `/api/race/complete` | Complete a race and return results |
| GET | `/api/player/stats` | Get player statistics |
| POST | `/api/player/garage` | Update player garage |

### FastAPI (`backend/server.py`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/race/simulate` | Simulate a quarter-mile race |

## Setup & Running

### Backend

```bash
cd backend
pip install -r requirements.txt

# Run FastAPI server
uvicorn server:app --reload --port 8000

# Or run the Flask API
cd ..
python flask_api.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Testing

```bash
# Run the integration test suite against the live API
python backend_test.py
```

## Race Simulation

The quarter-mile simulation in `backend/race_engine.py` uses a physics-based formula:

- **ET** = `5.825 × (weight/hp)^(1/3) + 1.2`
- **Trap Speed** = `234 × (hp/weight)^(1/3)`

Random factors (reaction time, traction, gear shifts) are applied with configurable Gaussian noise to keep races competitive without being unfair.

